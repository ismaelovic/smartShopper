// backend/src/controllers/shoppingCartController.js
const { saveJsonToFile } = require('../utils/fileLogger');

// In-memory storage for shopping carts (you might want to use a database in production)
const shoppingCarts = new Map();

// Helper function to remove expired deals from cart
function removeExpiredDeals(cartItems) {
  const now = new Date();
  return cartItems.filter(item => {
    if (!item.offerValidUntil) return true; // Keep items without expiry date
    const expiryDate = new Date(item.offerValidUntil);
    return expiryDate > now; // Keep only non-expired items
  });
}

// Helper function to calculate days until expiry
function calculateDaysUntilExpiry(expiryDate) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return -1; // Expired
  return diffDays;
}

// GET /shopping-cart/:userId - Get user's shopping cart
async function getShoppingCart(req, res) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    // Get cart items for user
    let cartItems = shoppingCarts.get(userId) || [];
    
    // Remove expired deals automatically
    cartItems = removeExpiredDeals(cartItems);
    shoppingCarts.set(userId, cartItems);

    // Add calculated fields for frontend
    const enrichedCartItems = cartItems.map(item => ({
      ...item,
      daysUntilExpiry: item.offerValidUntil ? calculateDaysUntilExpiry(item.offerValidUntil) : null,
      isExpiringSoon: item.offerValidUntil ? calculateDaysUntilExpiry(item.offerValidUntil) <= 1 : false,
      discountAmount: (item.price?.original && item.price?.current) ? 
        (item.price.original - item.price.current) : 0
    }));

    // Sort by expiry date (most urgent first)
    enrichedCartItems.sort((a, b) => {
      if (!a.daysUntilExpiry && !b.daysUntilExpiry) return 0;
      if (!a.daysUntilExpiry) return 1;
      if (!b.daysUntilExpiry) return -1;
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

    // Calculate totals
    const totalItems = enrichedCartItems.length;
    const totalSavings = enrichedCartItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const totalCurrentPrice = enrichedCartItems.reduce((sum, item) => sum + (item.price?.current || 0), 0);
    const itemsWithOriginalPrice = enrichedCartItems.filter(item => item.price?.original != null).length;
    const itemsWithSavings = enrichedCartItems.filter(item => (item.discountAmount || 0) > 0).length;

    res.json({
      items: enrichedCartItems,
      summary: {
        totalItems,
        totalCurrentPrice: totalCurrentPrice.toFixed(2),
        totalSavings: totalSavings.toFixed(2),
        expiringToday: enrichedCartItems.filter(item => item.daysUntilExpiry === 0).length,
        expiringSoon: enrichedCartItems.filter(item => item.isExpiringSoon).length,
        itemsWithOriginalPrice,
        itemsWithSavings
      }
    });

  } catch (error) {
    console.error('Error fetching shopping cart:', error.message);
    res.status(500).json({ error: error.message });
  }
}

// POST /shopping-cart/:userId - Add item to shopping cart
async function addToShoppingCart(req, res) {
  try {
    const { userId } = req.params;
    const dealItem = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    if (!dealItem || !dealItem.id) {
      return res.status(400).json({ error: 'Valid deal item with ID is required.' });
    }

    // Get existing cart
    let cartItems = shoppingCarts.get(userId) || [];
    
    // Remove expired deals
    cartItems = removeExpiredDeals(cartItems);

    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex(item => item.id === dealItem.id);
    
    if (existingItemIndex !== -1) {
      return res.status(400).json({ error: 'This deal is already in your shopping cart.' });
    }

    // Add timestamp when added to cart
    const cartItem = {
      ...dealItem,
      addedToCartAt: new Date().toISOString(),
      cartItemId: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    cartItems.push(cartItem);
    shoppingCarts.set(userId, cartItems);

    // Log for debugging
    await saveJsonToFile('shopping_cart_add', { userId, cartItem }, userId);

    res.json({ 
      message: 'Deal added to shopping cart successfully!',
      cartItem,
      cartItemCount: cartItems.length
    });

  } catch (error) {
    console.error('Error adding to shopping cart:', error.message);
    res.status(500).json({ error: error.message });
  }
}

// DELETE /shopping-cart/:userId/:cartItemId - Remove item from shopping cart
async function removeFromShoppingCart(req, res) {
  try {
    const { userId, cartItemId } = req.params;
    
    if (!userId || !cartItemId) {
      return res.status(400).json({ error: 'User ID and cart item ID are required.' });
    }

    // Get existing cart
    let cartItems = shoppingCarts.get(userId) || [];
    
    // Find and remove the item
    const initialLength = cartItems.length;
    cartItems = cartItems.filter(item => item.cartItemId !== cartItemId);
    
    if (cartItems.length === initialLength) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    shoppingCarts.set(userId, cartItems);

    res.json({ 
      message: 'Item removed from shopping cart successfully!',
      cartItemCount: cartItems.length
    });

  } catch (error) {
    console.error('Error removing from shopping cart:', error.message);
    res.status(500).json({ error: error.message });
  }
}

// DELETE /shopping-cart/:userId - Clear entire shopping cart
async function clearShoppingCart(req, res) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    shoppingCarts.set(userId, []);

    res.json({ message: 'Shopping cart cleared successfully!' });

  } catch (error) {
    console.error('Error clearing shopping cart:', error.message);
    res.status(500).json({ error: error.message });
  }
}

// GET /shopping-cart/:userId/group-by-store - Get cart items grouped by store
async function getShoppingCartByStore(req, res) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    // Get cart items
    let cartItems = shoppingCarts.get(userId) || [];
    cartItems = removeExpiredDeals(cartItems);
    shoppingCarts.set(userId, cartItems);

    // Group by store
    const groupedByStore = {};
    cartItems.forEach(item => {
      const storeName = item.dealer?.name || 'Unknown Store';
      if (!groupedByStore[storeName]) {
        groupedByStore[storeName] = {
          storeInfo: item.dealer,
          items: [],
          storeTotalItems: 0,
          storeTotalPrice: 0,
          storeTotalSavings: 0
        };
      }
      
      const discountAmount = (item.price?.original && item.price?.current) ? 
        (item.price.original - item.price.current) : 0;
        
      groupedByStore[storeName].items.push({
        ...item,
        daysUntilExpiry: item.offerValidUntil ? calculateDaysUntilExpiry(item.offerValidUntil) : null,
        isExpiringSoon: item.offerValidUntil ? calculateDaysUntilExpiry(item.offerValidUntil) <= 1 : false,
        discountAmount
      });
      
      groupedByStore[storeName].storeTotalItems++;
      groupedByStore[storeName].storeTotalPrice += item.price?.current || 0;
      groupedByStore[storeName].storeTotalSavings += discountAmount;
    });

    // Sort items within each store by expiry
    Object.values(groupedByStore).forEach(store => {
      store.items.sort((a, b) => {
        if (!a.daysUntilExpiry && !b.daysUntilExpiry) return 0;
        if (!a.daysUntilExpiry) return 1;
        if (!b.daysUntilExpiry) return -1;
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });
      
      // Format prices
      store.storeTotalPrice = store.storeTotalPrice.toFixed(2);
      store.storeTotalSavings = store.storeTotalSavings.toFixed(2);
    });

    res.json(groupedByStore);

  } catch (error) {
    console.error('Error getting shopping cart by store:', error.message);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getShoppingCart,
  addToShoppingCart,
  removeFromShoppingCart,
  clearShoppingCart,
  getShoppingCartByStore
};
