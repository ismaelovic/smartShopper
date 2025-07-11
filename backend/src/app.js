// backend/src/app.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const dealRoutes = require('./routes/dealRoutes');
const { initializeFileLogger } = require('./utils/fileLogger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON request bodies

// Mount API routes
app.use('/api', dealRoutes); // All deal routes will be prefixed with /api

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
           console.log(`Salling Group API Key: ${process.env.SALLING_GROUP_API_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
           console.log(`Gemini API Key: ${process.env.GEMINI_API_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
       });
   } catch (error) {
       console.error('Failed to start backend:', error.message);
       process.exit(1); // Exit if essential setup fails
   }
})();