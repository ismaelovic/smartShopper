// backend/src/routes/shoppingCartRoutes.js
const express = require('express');
const shoppingCartController = require('../controllers/shoppingCartController');

const router = express.Router();

// GET /shopping-cart/:userId - Get user's shopping cart
router.get('/:userId', shoppingCartController.getShoppingCart);

// POST /shopping-cart/:userId - Add item to shopping cart
router.post('/:userId', shoppingCartController.addToShoppingCart);

// DELETE /shopping-cart/:userId/:cartItemId - Remove specific item from shopping cart
router.delete('/:userId/:cartItemId', shoppingCartController.removeFromShoppingCart);

// DELETE /shopping-cart/:userId - Clear entire shopping cart
router.delete('/:userId', shoppingCartController.clearShoppingCart);

// GET /shopping-cart/:userId/group-by-store - Get cart items grouped by store
router.get('/:userId/group-by-store', shoppingCartController.getShoppingCartByStore);

module.exports = router;
