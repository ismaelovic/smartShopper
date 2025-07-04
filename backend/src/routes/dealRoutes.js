// backend/src/routes/dealRoutes.js
const express = require('express');
const dealController = require('../controllers/dealController');

const router = express.Router();

router.post('/find-deals', dealController.findDeals);

module.exports = router;