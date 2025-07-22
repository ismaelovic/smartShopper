// firebaseConfig.js (UPDATED)
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; // Import initializeAuth and getReactNativePersistence
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import Constants from 'expo-constants'; // Import Constants

// Your web app's Firebase configuration
// Access Firebase config from Constants.expoConfig.extra
const firebaseConfig = Constants.expoConfig.extra.firebaseConfig;

console.log('Firebase configuration:', firebaseConfig.projectId); // Log for debugging

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { auth, app };