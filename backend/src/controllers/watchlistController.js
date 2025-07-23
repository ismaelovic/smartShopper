// backend/src/controllers/watchlistController.js
const { db, auth, admin } = require('../components/firebase-admin');
const crypto = require('crypto');

const addItemToWatchlist = async (req, res) => {
  const userId = req.params.uid;
  const itemData = req.body;

  // Generate a unique ID if missing (for onboarding products)
  let itemId = itemData.id;
  if (!itemId) {
    if (!itemData.productName) {
      return res.status(400).json({ message: 'Missing productName for onboarding product.' });
    }
    // Hash productName (and optionally category) for uniqueness
    itemId = crypto.createHash('sha256').update(itemData.productName + (itemData.productCategory || '')).digest('hex');
  }

  try {
    const watchlistItemDocRef = db.collection('users').doc(userId).collection('watchlist').doc(itemId);
    const existingDoc = await watchlistItemDocRef.get();

    if (existingDoc.exists) {
      return res.status(409).json({
        message: `This item (ID: ${itemId}) is already in your watchlist.`,
        id: existingDoc.id
      });
    }

    const productNameToStore = itemData.productName || itemData.heading;
    const productCategoryToStore = itemData.productCategory || 'Uncategorized';
    const displayImageUrlToStore = itemData.imageUrl || itemData.images?.thumb || null;

    const newItem = {
      originalDealId: itemData.id || null,
      productName: productNameToStore,
      productCategory: productCategoryToStore,
      displayImageUrl: displayImageUrlToStore,
      originalHeading: itemData.heading || null,
      originalDescription: itemData.description || null,
      originalDealerId: itemData.dealer_id || itemData.dealerId || null,
      originalDealerName: itemData.dealer?.name || itemData.dealerName || null,
      currentPrice: itemData.pricing?.price || itemData.currentPrice || null,
      originalPrice: itemData.pricing?.pre_price || itemData.originalPrice || null,
      discountAmount: itemData.discountAmount || null,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await watchlistItemDocRef.set(newItem);

    res.status(201).json({ id: itemId, ...newItem, message: 'Item added to watchlist.' });
  } catch (error) {
    console.error('Error adding item to watchlist:', error);
    res.status(500).json({ message: 'Failed to add item to watchlist.', error: error.message });
  }
};

const removeItemToWatchlist = async (req, res) => {
const userId = req.params.uid;
const productId = req.params.id; // Use the product ID from the URL
if (!productId || !userId) {
  return res.status(400).json({ message: 'Missing required params!' });
}

try {
  await db.collection('users').doc(userId).collection('watchlist').doc(productId).delete();
  res.status(200).json({ message: 'Item removed from watchlist.' });
} catch (error) {
  console.error('Error removing item from watchlist:', error);
  res.status(500).json({ message: 'Failed to remove item from watchlist.', error: error.message });
}
};


const getUserWatchlist = async (req, res) => {
const userId = req.params.uid;

try {
  const watchlistSnapshot = await db.collection('users').doc(userId).collection('watchlist').get();

  // Check if the watchlist is empty
  if (watchlistSnapshot.empty) {
    return res.status(200).json([]);
  }

  // Map over the documents in the snapshot to get their data
  const watchlistItems = watchlistSnapshot.docs.map(doc => ({
    id: doc.id, // Include the document ID, which is often useful on the frontend
    ...doc.data() // Get the actual data of the document
  }));

  res.status(200).json(watchlistItems); // Send the array of watchlist items
} catch (error) {
  console.error('Error fetching watchlist:', error);
  res.status(500).json({ message: 'Failed to fetch watchlist.', error: error.message });
}
};

module.exports = {
    getUserWatchlist,
    addItemToWatchlist,
    removeItemToWatchlist
};