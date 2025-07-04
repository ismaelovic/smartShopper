// backend/src/utils/cache.js
const NodeCache = require('node-cache');

// Initialize cache with a TTL (Time To Live) of 10 minutes (600 seconds)
const apiCache = new NodeCache({ stdTTL: 600 });

module.exports = apiCache;