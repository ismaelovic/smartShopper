// backend/src/routes/dealRoutes.js
const express = require('express');
const dealController = require('../controllers/dealController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/find-deals', dealController.findDeals);
router.get('/deals', dealController.getAllDeals);

module.exports = router;