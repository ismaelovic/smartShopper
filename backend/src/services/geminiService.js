// backend/src/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { saveJsonToFile, saveTextToFile } = require('../utils/fileLogger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let geminiModel;
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
   const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
   geminiModel = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash-lite'});
} else {
   console.warn('GEMINI_API_KEY is not configured. LLM functionality will be disabled.');
}

async function findBestDealsWithLLM(selectedProducts, foodWasteData) {
  if (!geminiModel) {
      throw new Error('LLM is not configured. Cannot perform deal comparison.');
  }

  // Prepare the data for the LLM
  const availableOffers = [];
  foodWasteData.forEach(store => {
      const storeInfo = {
          brand: store.store.brand,
          address: `${store.store.address.street}, ${store.store.address.zip} ${store.store.address.city}`,
          id: store.store.id
      };
      store.clearances.forEach(clearanceItem => {
          availableOffers.push({
              productDescription: clearanceItem.product.description,
              offerHeading: clearanceItem.offer.heading,
              newPrice: clearanceItem.offer.newPrice,
              originalPrice: clearanceItem.offer.originalPrice,
              discount: clearanceItem.offer.discount,
              imageUrl: clearanceItem.product.image,
              validUntil: clearanceItem.offer.validUntil,
              store: storeInfo
          });
      });
  });

  // Save availableOffers for debugging
  await saveJsonToFile('llm_input_offers', availableOffers);

  // Construct the prompt for the LLM
  const prompt = `
You are an expert grocery deal finder. Your task is to identify the best available deals for a list of specific products from a list of available offers.

Im looking for the following products:
${selectedProducts.map(p => `- ${p}`).join('\n')}

Here is a JSON array of available grocery offers. Each object represents a single offer from a store's food waste section:
${JSON.stringify(availableOffers, null, 2)}

Please help me find the best deals for the products I am looking for. 
The best deal is defined as the lowest price after discount, and if you find multiple products, prefer the one with the highest discount number.

Your response MUST be a JSON object. Remove any json prefix, colons or other characters that might break a JSON format. The result is to be consumed by a Javascript app.
The keys of the JSON object should be the exact product names from the user's 'selectedProducts' list.
The value for each key should be an object containing the best deal found, or a status indicating it was not found.

Example of desired JSON output structure:
{
"milk": {
  "product": "milk",
  "price": 8.5,
  "originalPrice": 12.95,
  "discount": 34.5,
  "store": "Netto",
  "storeAddress": "Vesterbrogade 1, 8000 Aarhus C",
  "storeId": "store_id_123",
  "itemNameFound": "Økologisk Letmælk",
  "imageUrl": "http://example.com/milk.jpg",
  "expires": "2025-07-03T23:59:59Z"
},
"eggs": {
  "product": "eggs",
  "price": 15.0,
  "originalPrice": 22.0,
  "discount": 31.8,
  "store": "Føtex",
  "storeAddress": "Søndergade 2, 8000 Aarhus C",
  "storeId": "store_id_456",
  "itemNameFound": "Frilandsæg 10 stk.",
  "imageUrl": "http://example.com/eggs.jpg",
  "expires": "2025-07-04T12:00:00Z"
},
"bread": {
  "status": "not_found",
  "message": "No clearance deal found for this product in your area."
}
}
IMPORTANT: Do not convert product data to english. fx kaffe to coffe. Keep the product names in their native language as they are provided in the 'selectedProducts' list.
Ensure the 'storeAddress' field is correctly formatted using the 'store.address' fields from the input.
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
      console.error('Error:', error);
      throw error; // Re-throw the error so it can be handled upstream
  }
}
module.exports = {
   findBestDealsWithLLM
};