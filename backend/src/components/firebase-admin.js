const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path'); // <--- Add this
dotenv.config(); // Load environment variables from .env

// Path to your service account key JSON file
const serviceAccountRelativePathFromRoot = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

// Check if the service account key path is defined
if (!serviceAccountRelativePathFromRoot) {
console.error('FIREBASE_SERVICE_ACCOUNT_KEY_PATH is not defined in .env');
process.exit(1);
}

// Determine the absolute path to the service account key
// process.cwd() returns the current working directory from which the Node.js process was launched.
// If you launch from YourProjectRoot/, then process.cwd() is YourProjectRoot/.
const absoluteServiceAccountPath = path.resolve(process.cwd(), serviceAccountRelativePathFromRoot); // <--- KEY CHANGE

// Load the service account key
let serviceAccount;
try {
serviceAccount = require(absoluteServiceAccountPath);
console.log(`Service account key loaded from: ${absoluteServiceAccountPath}`);
} catch (error) {
console.error(`Error loading service account key from ${absoluteServiceAccountPath}:`, error.message);
console.error('Please ensure the serviceAccountKey.json file exists and is correctly referenced in .env');
process.exit(1);
}

// Initialize Firebase Admin SDK
admin.initializeApp({
credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth(); // For interacting with Firebase Authentication

module.exports = { db, auth, admin }; // Export db, auth, and admin for use in other files