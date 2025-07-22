// backend/src/controllers/userController.js
const { db, auth, admin } = require('../components/firebase-admin');

// Create user profile (supports both Firebase Auth and direct testing)
const registerUser = async (req, res) => {
  const { uid, email, displayName, username, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required!' });
  }

  try {
    let userId = uid;
    
    // If no uid provided, create Firebase Auth user (for testing)
    if (!uid && password) {
      console.log('Creating Firebase Auth user for testing...');
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: displayName || username || email.split('@')[0]
      });
      userId = userRecord.uid;
      console.log('Firebase Auth user created:', userId);
    } else if (!uid) {
      return res.status(400).json({ 
        message: 'Either uid (from frontend) or password (for testing) is required.' 
      });
    }

    // Check if user profile already exists
    const existingUser = await db.collection('users').doc(userId).get();
    if (existingUser.exists) {
      return res.status(400).json({ message: 'User profile already exists.' });
    }

    // Create user profile in Firestore
    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      email,
      username: username || email.split('@')[0],
      displayName: displayName || email.split('@')[0],
      profilePictureUrl: null,
      bio: null,
      location: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.status(201).json({ 
      message: 'User profile created successfully.', 
      userId: userId,
      email: email
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    res.status(500).json({ 
      message: 'Failed to create user profile.', 
      error: error.message 
    });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userDoc.data());
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    // TODO: Hardcode what fields can be updated and maintained
    const updates = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Remove fields that shouldn't be updated directly
    delete updates.createdAt;
    delete updates.email; // Email changes should go through Firebase Auth

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRef.update(updates);
    
    // Get updated user data
    const updatedDoc = await userRef.get();
    res.json(updatedDoc.data());
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete user profile
const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Delete from Firestore
    await db.collection('users').doc(userId).delete();
    
    // Also delete from Firebase Auth
    await auth.deleteUser(userId);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Login is handled by Firebase Auth on frontend
const loginUser = async (req, res) => {
  // Frontend handles Firebase Auth login and gets ID token
  // Backend verifies the token for protected routes
  res.status(200).json({ 
    message: 'Login handled by Firebase Auth on frontend. Use ID token for protected routes.' 
  });
};

// Middleware to verify Firebase ID token (add this for protected routes)
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  verifyToken
};