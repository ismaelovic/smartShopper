// backend/src/controllers/watchlistController.js
const { db, admin } = require('../components/firebase-admin');
// const { getLlmProductInfo } = require('../services/llmService'); // Your LLM integration

const addItemToWatchlist = async (req, res) => {
const userId = req.params.id;
const dealData = req.body; // Frontend sends the full deal object

if (!dealData) {
  return res.status(400).json({ message: 'Invalid deal data provided.' });
}

try {
  // Use LLM to get a consistent category, but the productName will be the heading
  // const llmInfo = await getLlmProductInfo(dealData.heading, dealData.description, dealData.dealer.name);
  // const productCategory = llmInfo.productCategory; // Use LLM for category consistency

  const newItem = {
    productName: dealData.productName, // The original heading is the product name
    productCategory: dealData.productCategory, // The LLM-derived category
    displayImageUrl: dealData.displayImageUrl || null, // The thumbnail image

    // Original deal details (for context/re-fetching)
    originalHeading: dealData.heading || null, // Redundant, but kept for clarity if needed elsewhere
    originalDescription: dealData.description || null,
    originalDealerId: dealData.dealer_id || null,
    originalDealerName: dealData.dealer?.name || null,
    originalPrice: dealData.pricing?.price || null,
    addedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const watchlistRef = db.collection('users').doc(userId).collection('watchlist');
  const docRef = await watchlistRef.add(newItem);

  res.status(201).json({ id: docRef.id, ...newItem, message: 'Item added to watchlist.' });
} catch (error) {
  console.error('Error adding item to watchlist:', error);
  res.status(500).json({ message: 'Failed to add item to watchlist.', error: error.message });
}
};


const getUserWatchlist = async (req, res) => {
const userId = req.params.id;

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
    addItemToWatchlist
};