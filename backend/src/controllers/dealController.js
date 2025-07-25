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

      let allAvailableDeals = [];

      tjekOffers.forEach(offer => {
          // Only include offers that have a price and a dealer name
          if (offer.pricing && offer.pricing.price && offer.dealer && offer.dealer.name) {
allAvailableDeals.push({
                  source: 'squid-api',
                  id: offer.id, // Include offer ID for unique identification
                  productName: offer.heading,
                  productDescription: offer.description,
                  price: {
                    original: offer.pricing.pre_price,
                    current: offer.pricing.price,
                    currency: offer.pricing.currency
                  },
                  quantity: {
                    sizeFrom: offer.quantity.size.from,
                    sizeTo: offer.quantity.size.to,
                    unit: offer.quantity.size_unit
                  },
                  imageUrl: offer.images.view,
                  offerValidFrom: offer.run_from,
                  offerValidUntil: offer.run_till,
                  dealer: {
                      id: offer.dealer.id,
                      name: offer.dealer.name
                  }
              });
          }
      });

      if (allAvailableDeals.length === 0) {
          return res.status(404).json({ error: 'No active deals found for your selected products and dealers.' });
      }

      // Pass the combined and flattened data to the LLM
      const finalResponse = await geminiService.findSelectedDealsWithLLM(selectedProducts, allAvailableDeals);

      res.json(finalResponse);

  } catch (error) {
      console.error('Error in /find-deals endpoint:', error.message);
      res.status(500).json({ error: error.message });
  }
}   

async function getAllDeals(req, res) {
  try {
      // Fetch offers from Tjek.com API based on selected dealers
      const tjekOffers = await tjekApiService.fetchTjekOffers([]);

      let allAvailableDeals = [];

      tjekOffers.forEach(offer => {
          // Only include offers that have a price and a dealer name
          if (offer.pricing && offer.pricing.price && offer.dealer && offer.dealer.name) {
allAvailableDeals.push({
                  source: 'squid-api',
                  id: offer.id, // Include offer ID for unique identification
                  productName: offer.heading,
                  productDescription: offer.description,
                  price: {
                    original: offer.pricing.pre_price,
                    current: offer.pricing.price,
                    currency: offer.pricing.currency
                  },
                  quantity: {
                    sizeFrom: offer.quantity.size.from,
                    sizeTo: offer.quantity.size.to,
                    unit: offer.quantity.size_unit
                  },
                  imageUrl: offer.images.view,
                  offerValidFrom: offer.run_from,
                  offerValidUntil: offer.run_till,
                  dealer: {
                      id: offer.dealer.id,
                      name: offer.dealer.name
                  }
              });
          }
      });

      if (allAvailableDeals.length === 0) {
          return res.status(404).json({ error: 'No active deals found for your selected products and dealers.' });
      }

      // Pass the combined and flattened data to the LLM
      const finalResponse = await geminiService.findDealsWithoutLLM(allAvailableDeals);

      res.json(finalResponse);

  } catch (error) {
      console.error('Error in /deals endpoint:', error.message);
      res.status(500).json({ error: error.message });
  }
}


// async function getUserProfile(req, res) {
//   // Implementation for getting user profile
//     const userId = req.params.id;
//     if (!userId) {
//         return res.status(400).json({ error: 'User ID is required.' });
//     }
//     else {
//         // Fetch user profile logic here
//         return res.status(200).json({ message: `User profile for ID ${userId} fetched successfully.` }); // Example response
//     }
// }
// async function updateUserProfile(req, res) {
//   // Implementation for updating user profile
//     return res.status(200).json({ message: 'User profile updated successfully.' }); // Example response
// }
// async function deleteUserProfile(req, res) {
//   // Implementation for deleting user profile
//   return res.status(200).json({ message: 'User profile deleted successfully.' }); // Example response
// }

module.exports = {
    findDeals,
    getAllDeals
};