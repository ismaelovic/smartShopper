// backend/src/services/sallingGroupService.js
const axios = require('axios');
const apiCache = require('../utils/cache');
const { saveJsonToFile } = require('../utils/fileLogger');

const SALLING_GROUP_API_KEY = process.env.SALLING_GROUP_API_KEY;

async function fetchFoodWasteDeals(zipCode) {
   if (!SALLING_GROUP_API_KEY || SALLING_GROUP_API_KEY === 'YOUR_SALLING_GROUP_API_KEY') {
       throw new Error('Salling Group API Key is not configured. Please set SALLING_GROUP_API_KEY in your .env file.');
   }

   const cacheKey = `foodWaste_${zipCode}`;
   let cachedData = apiCache.get(cacheKey);

   if (cachedData) {
       console.log(`Cache hit for ${cacheKey}`);
       return cachedData;
   }

   console.log(`Cache miss for ${cacheKey}, fetching from Salling Group API...`);
   try {
       const response = await axios.get('https://api.sallinggroup.com/v1/food-waste', {
           headers: {
               'Authorization': `Bearer ${SALLING_GROUP_API_KEY}`
           },
           params: {
               zip: zipCode
           }
       });
       const data = response.data;

       // Save raw API response for debugging
       await saveJsonToFile('salling_raw_api_response', data, zipCode);

       apiCache.set(cacheKey, data); // Cache the response
       return data;
   } catch (error) {
       console.error(`Error fetching food waste data for zip ${zipCode}:`, error.message);
       if (error.response) {
           console.error('Salling Group API Response Error:', error.response.status, error.response.data);
       }
       throw new Error('Could not fetch food waste data from Salling Group.');
   }
}

module.exports = {
   fetchFoodWasteDeals
};