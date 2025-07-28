// backend/src/app.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const dealRoutes = require('./routes/dealRoutes');
const userRoutes = require('./routes/userRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes'); 
const shoppingCartRoutes = require('./routes/shoppingCartRoutes');
const { initializeFileLogger } = require('./utils/fileLogger');
require('./components/firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (you can restrict this in production)
app.use(cors());
app.use(express.json()); // Middleware to parse JSON request bodies

// Mount API routes
app.use('/api', dealRoutes); // All deal routes will be prefixed with /api
app.use('/users', userRoutes); // All user routes will be prefixed with /api
app.use('/watchlist', watchlistRoutes); // All watchlist routes will be prefixed with /watchlist
app.use('/shopping-cart', shoppingCartRoutes); // All shopping cart routes will be prefixed with /shopping-cart

// Global error handler (optional, but good practice)
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).send('Something broke!');
});

// Immediately Invoked Async Function Expression (IIAFE) to start the server
(async () => {
   try {
       await initializeFileLogger(); // Ensure debug_data directory exists
       console.log('File logger initialized.');

       app.listen(PORT, () => {
           console.log(`smartKurv Backend listening on port ${PORT}`);
           console.log(`Gemini API Key: ${process.env.GEMINI_API_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
       });
   } catch (error) {
       console.error('Failed to start backend:', error.message);
       process.exit(1); // Exit if essential setup fails
   }
})();