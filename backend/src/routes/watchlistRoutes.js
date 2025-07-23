// backend/src/routes/watchlist.js
const express = require('express');
const watchlistController = require('../controllers/watchlistController');

const router = express.Router();

router.get('/:uid', watchlistController.getUserWatchlist);
router.post('/:uid', watchlistController.addItemToWatchlist);
router.delete('/:uid/product/:id', watchlistController.removeItemToWatchlist);

module.exports = router;