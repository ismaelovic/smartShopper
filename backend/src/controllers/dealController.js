// backend/src/controllers/dealController.js
const geminiService = require('../services/geminiService');
const tjekApiService = require('../services/tjekApiService'); // Use only Tjek.com service

async function findDeals(req, res) {
  const { selectedProducts, selectedDealerIds } = req.body; // New: selectedDealerIds

  if (!selectedProducts || !Array.isArray(selectedProducts) || selectedProducts.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid selectedProducts.' });
  }

  try {
      // Fetch offers from Tjek.com API based on selected dealers
      const tjekOffers = await tjekApiService.fetchTjekOffers(selectedDealerIds);

    // Add these debug lines
      console.log('tjekOffers type:', typeof tjekOffers);
      console.log('tjekOffers is array:', Array.isArray(tjekOffers));

      let allAvailableDeals = [];

      tjekOffers.forEach(offer => {
          // Only include offers that have a price and a dealer name
          if (offer.pricing && offer.pricing.price && offer.dealer && offer.dealer.name) {
              allAvailableDeals.push({
                  source: 'squid-api',
                  id: offer.id, // Include offer ID for unique identification
                  productDescription: offer.heading,
                  offerHeading: offer.description || offer.heading,
                  newPrice: offer.pricing.price,
                  originalPrice: offer.pricing.pre_price || offer.pricing.price, // Use pre_price if available, otherwise use price
                  imageUrl: offer.images.view,
                  validUntil: offer.run_till,
                  store: {
                      brand: offer.dealer.name,
                      address: 'Nationwide offer (Tjek.com API)', // Clarify address
                      id: offer.dealer.id
                  }
              });
          }
      });

      if (allAvailableDeals.length === 0) {
          return res.status(404).json({ error: 'No active deals found for your selected products and dealers.' });
      }

      // Pass the combined and flattened data to the LLM
      const finalResponse = await geminiService.findBestDealsWithLLM(selectedProducts, allAvailableDeals);

      res.json(finalResponse);

  } catch (error) {
      console.error('Error in /find-deals endpoint:', error.message);
      res.status(500).json({ error: error.message });
  }
}

module.exports = {
  findDeals
};