// backend/src/controllers/dealController.js
const sallingGroupService = require('../services/sallingGroupService');
const geminiService = require('../services/geminiService');

async function findDeals(req, res) {
   const { zipCode, selectedProducts } = req.body;

   if (!zipCode || !selectedProducts || !Array.isArray(selectedProducts) || selectedProducts.length === 0) {
       return res.status(400).json({ error: 'Missing or invalid zipCode or selectedProducts.' });
   }

   try {
       const foodWasteData = await sallingGroupService.fetchFoodWasteDeals(zipCode);

       // Use the LLM to find the best deals
       const finalResponse = await geminiService.findBestDealsWithLLM(selectedProducts, foodWasteData);

       res.json(finalResponse);

   } catch (error) {
       console.error('Error in /find-deals endpoint:', error.message);
       res.status(500).json({ error: error.message });
   }
}

module.exports = {
   findDeals
};