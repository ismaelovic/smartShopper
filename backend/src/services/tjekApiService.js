// backend/src/services/tjekApiService.js
const axios = require('axios');
const { saveJsonToFile } = require('../utils/fileLogger');

// VERIFY THIS URL AND ITS PARAMETERS
// This should be the endpoint that returns an ARRAY of offers, not a single one.
// Based on your previous successful find, it might be just 'https://squid-api.tjek.com/v2/offers'
// without dealer_id/dealer_ids, or with different parameters.
const TJEK_API_BASE_URL = 'https://squid-api.tjek.com/v2/offers';

async function fetchTjekOffers(dealerIds = [], limit = 100) {
console.log('Starting Tjek.com API fetch...');
try {
    const params = {
        country_code: 'DK',
        limit: limit // TODO: Fetch a reasonable number of offers
    };

    if (dealerIds.length > 0) {
        params.dealer_ids = dealerIds.join(','); // This assumes the API supports comma-separated IDs
    }

    const response = await axios.get(TJEK_API_BASE_URL, { params });

    console.log('Raw Tjek.com API response.data type:', typeof response.data);

    let rawOffers = response.data;

    await saveJsonToFile('tjek_offers_raw', rawOffers, dealerIds.join('_') || 'all');

    console.log('Total rawOffers before filtering:', rawOffers.length);

    // Debug the filtering conditions
    const debugFiltering = rawOffers.map((offer, index) => {
        const hasDealer = offer.dealer;
        const hasCountry = offer.dealer && offer.dealer.country;
        const isDK = offer.dealer && offer.dealer.country && offer.dealer.country.id === 'DK';
        const hasPricing = offer.pricing;
        const hasPrice = offer.pricing && offer.pricing.price;
        
        // console.log(`Offer ${index}:`, {
        //     hasDealer,
        //     hasCountry,
        //     isDK,
        //     hasPricing,
        //     hasPrice,
        //     countryId: offer.dealer?.country?.id,
        //     price: offer.pricing?.price
        // });
        
        return {
            hasDealer,
            hasCountry,
            isDK,
            hasPricing,
            hasPrice
        };
    });

    const danishOffers = rawOffers.filter(offer =>
        offer.dealer && offer.dealer.country && offer.dealer.country.id === 'DK' &&
        offer.pricing && offer.pricing.price
    );

    console.log('Total danishOffers after filtering:', danishOffers.length);

    console.log(`Fetched and filtered ${danishOffers.length} offers from Tjek.com API.`);
    return danishOffers;

} catch (error) {
    console.error('Error during Tjek.com API fetch:', error);
    if (error.response) {
        console.error('Tjek.com API Response Error:', error.response.status, error.response.data);
    }
    return [];
}
}

module.exports = {
fetchTjekOffers
};