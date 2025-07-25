// backend/src/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { saveJsonToFile, saveTextToFile } = require('../utils/fileLogger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let geminiModel;
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  // Using 'models/gemini-pro' is generally safer for free tier.
  // 'gemini-2.0-flash-lite' is a newer, paid model. Let's stick to 'gemini-pro' for free tier.
//   geminiModel = genAI.getGenerativeModel({ model: 'models/gemini-pro' });
  geminiModel = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash-lite'});
} else {
  console.warn('GEMINI_API_KEY is not configured. LLM functionality will be disabled.');
}

let systemPrompt = `Your response MUST be a JSON object. Remove any json prefix, colons or other characters that might break a JSON format. The result is to be consumed by a Javascript app.
  The value for each key should be an object containing the best deal found, or a status indicating it was not found.

Example of desired JSON output structure:
{
"milk": {
  "status": "found",
  "requestedProductName": "mælk", 
  "productCategory": "dairy",
  "source": "squid-api",
  "id": "abc123",
  "productName": "Lurpak smør",
  "productDescription": "Lurpak smør, smørbar eller plantebaseret 200 g",
  "price": {
    "original": 12.95,
    "current": 8.5,
    "currency": "DKK"
  },
  "discountAmount": 4.45,
  "quantity": {
    "sizeFrom": 200,
    "sizeTo": 200,
    "unit": "g"
  },
  "dealer": {
    "id": "9ba51",
    "name": "Netto"
  },
  "imageUrl": "http://example.com/milk.jpg",
  "offerValidFrom": "2025-06-28T00:00:00Z",
  "offerValidUntil": "2025-07-03T23:59:59Z"
},
"bread": {
  "status": "found",
  "requestedProductName": "bread",
  "productCategory": "bread",
  "source": "squid-api",
  "id": "def456",
  "productName": "Schulstad yoghurtboller",
  "productDescription": "Schulstad yoghurtboller, sødmælksbrød, Signatur Gilleleje eller Fanø, Kornkammeret økologisk solsikke rugbrød eller kernefryd 500-750 g",
  "price": {
    "original": 22.0,
    "current": 15.0,
    "currency": "DKK"
  },
  "discountAmount": 7.0,
  "quantity": {
    "sizeFrom": 500,
    "sizeTo": 750,
    "unit": "g"
  },
  "dealer": {
    "id": "11deC",
    "name": "REMA 1000"
  },
  "imageUrl": "http://example.com/bread.jpg",
  "offerValidFrom": "2025-06-28T00:00:00Z",
  "offerValidUntil": "2025-07-03T23:59:59Z"
},
"unavailable_product": {
  "status": "not_found",
  "message": "No deal found for this product in your area."
}
}
IMPORTANT: Do not convert product data to english. fx kaffe to coffe. Keep the product names in their native language as they are provided in the 'selectedProducts' list.
The payload does not provide any information about the product category, please generate a fitting category name, fx brød should be "Bread", Havarti Ost should be "Cheese" etc.
For each offer returned, please calculate the discountAmount as price.original - price.current.
`;

async function findSelectedDealsWithLLM(selectedProducts, availableDeals) {
  if (!geminiModel) {
      throw new Error('LLM is not configured. Cannot perform deal comparison.');
  }

  // availableDeals is already in the flattened format needed by the LLM
  // No need for the foodWasteData.forEach(store => ...) loop here anymore.
  // We can directly use 'availableDeals' as 'offersForLLM'
  const offersForLLM = availableDeals;

  // Save offersForLLM for debugging
  await saveJsonToFile('llm_input_offers', offersForLLM);

  // Construct the prompt for the LLM
  const prompt = `
You are an expert grocery deal finder. Your task is to identify the best available deals for a list of specific products from a list of available offers.
The offers can come from different dealers (found under dealer.name) such as 'Rema 1000', 'Netto', 'Bilka', so the same product may appear from different dealers.
I'm looking for the following products:
${selectedProducts.map(p => `- ${p}`).join('\n')}

Here is a JSON array of available grocery offers. Each object represents a single offer:
${JSON.stringify(offersForLLM, null, 2)}

Please help me find the best deals for the products I am looking for.
The best deal is defined as the lowest 'price.current'. If multiple offers have the same lowest 'price.current' for a product, select the one where 'price.original' is not null.
The keys of the JSON object should be the exact product names from the user's 'selectedProducts' list.
${systemPrompt}
`;

  // Save the full prompt for debugging
  await saveTextToFile('llm_input_prompt', prompt);

  try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Save the raw LLM response for debugging
      await saveTextToFile('llm_raw_response', text);

      // Clean the text - remove outer quotes if present
      text = text.trim();
      if ((text.startsWith("'") && text.endsWith("'")) || (text.startsWith('"') && text.endsWith('"'))) {
          text = text.slice(1, -1);
      }

      // Attempt to parse the JSON output from the LLM
      let parsedResult;
      try {
          // First try to extract from code block
        const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
              parsedResult = JSON.parse(codeBlockMatch[1].trim());
          } else {
              // Try to find JSON object in the text
              const jsonMatch = text.match(/(\{[\s\S]*\})/);
              if (jsonMatch && jsonMatch[1]) {
                  parsedResult = JSON.parse(jsonMatch[1].trim());
              } else {
                  // Last resort - try parsing the whole cleaned text
                  parsedResult = JSON.parse(text);
              }
          }
      } catch (parseError) {
          console.error('Failed to parse LLM JSON output:', parseError);
          console.error('LLM raw text output:', text);
          throw new Error('LLM returned malformed JSON.');
      }

      // Explicitly return the parsed result
      return parsedResult;

  } catch (error) {
      console.error('Error calling Gemini LLM:', error.message);
      throw error; // Re-throw the error so it can be handled upstream
  }
}

async function findDealsWithLLM(availableDeals) {
  if (!geminiModel) {
      throw new Error('LLM is not configured. Cannot perform deal comparison.');
  }

  const offersForLLM = availableDeals;

  // Save offersForLLM for debugging
  await saveJsonToFile('llm_input_offers', offersForLLM);

  // Construct the prompt for the LLM
  const prompt = `
  You are an expert grocery deal finder. Your task is to scan a list of available offers and highlight the best deals.
  The best deals are defined as the highest discountAmount. 
  discountAmount is the difference between 'price.original' and 'price.current'. 
  Start by going for the offers where 'price.original' is not null.

  fx. here:
  {
    ...
    "price.original": 71.95,
    "price.current": 45
  }
  The discountAmount is 71.95 - 45 = 26.95.
  
  If multiple offers of the same product have the same 'price.current' for a product, select the one where 'price.original' is not null.
  The offers can come from different dealers (found under dealer.name) such as 'Rema 1000', 'Netto', 'Bilka', so the same product may appear from different dealers.

  Here is currentOffers, a JSON array of latest available grocery offers. Each object represents a single offer:
  ${JSON.stringify(offersForLLM, null, 2)}
  Please return the best eight deals found in the currentOffers JSON object.
  The keys of the JSON object should be the exact product names from currentOffers.productName.
  ${systemPrompt}
`;

  try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Save the raw LLM response for debugging
      await saveTextToFile('llm_raw_response', text);

      // Clean the text - remove outer quotes if present
      text = text.trim();
      if ((text.startsWith("'") && text.endsWith("'")) || (text.startsWith('"') && text.endsWith('"'))) {
          text = text.slice(1, -1);
      }

      // Attempt to parse the JSON output from the LLM
      let parsedResult;
      try {
          // First try to extract from code block
        const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
              parsedResult = JSON.parse(codeBlockMatch[1].trim());
          } else {
              // Try to find JSON object in the text
              const jsonMatch = text.match(/(\{[\s\S]*\})/);
              if (jsonMatch && jsonMatch[1]) {
                  parsedResult = JSON.parse(jsonMatch[1].trim());
              } else {
                  // Last resort - try parsing the whole cleaned text
                  parsedResult = JSON.parse(text);
              }
          }
      } catch (parseError) {
          console.error('Failed to parse LLM JSON output:', parseError);
          console.error('LLM raw text output:', text);
          throw new Error('LLM returned malformed JSON.');
      }

      // Explicitly return the parsed result
      return parsedResult;

  } catch (error) {
      console.error('Error calling Gemini LLM:', error.message);
      throw error; // Re-throw the error so it can be handled upstream
  }
}

async function findDealsWithoutLLM(availableDeals) {
  try {
    // Process all deals - calculate discount amount where possible, otherwise use 0
    const processedDeals = availableDeals
      .filter(deal => deal.price?.current != null) // Only need current price
      .map(deal => {
        // Calculate discount amount if original price exists, otherwise use 0
        const discountAmount = deal.price.original != null ? 
          deal.price.original - deal.price.current : 0;
        return {
          ...deal,
          discountAmount: discountAmount
        };
      });

    // Sort by discount amount (highest to lowest), then by current price (lowest to highest) as tiebreaker
    const sortedDeals = processedDeals.sort((a, b) => {
      if (b.discountAmount !== a.discountAmount) {
        return b.discountAmount - a.discountAmount; // Higher discount first
      }
      return a.price.current - b.price.current; // Lower price first as tiebreaker
    });

    // Return the top 8 deals
    const topDeals = sortedDeals.slice(0, 8);

    // Transform into the expected format with product names as keys
    const result = {};
    topDeals.forEach((deal, index) => {
      const key = deal.productName || `deal_${index + 1}`;
      result[key] = {
        status: "found",
        requestedProductName: deal.productName,
        productCategory: deal.productCategory || "general",
        source: "squid-api",
        currency: deal.price?.currency || "DKK",
        currentPrice: deal.price?.current,
        "price.original": deal.price?.original,
        discountAmount: deal.discountAmount,
        dealerName: deal.dealer?.name,
        dealerId: deal.dealer?.id,
        fullProductName: deal.productName,
        productName: deal.productName,
        size: deal.quantity?.sizeFrom,
        sizeUnit: deal.quantity?.unit,
        imageUrl: deal.imageUrl,
        runFrom: deal.offerValidFrom,
        runTill: deal.offerValidUntil
      };
    });

    return result;
  } catch (error) {
    console.error('Error in findDealsWithoutLLM:', error.message);
    throw error;
  }
}
module.exports = {
  findSelectedDealsWithLLM,
  findDealsWithLLM,
  findDealsWithoutLLM
};