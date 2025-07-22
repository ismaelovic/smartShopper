// App.jsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Button, ActivityIndicator } from 'react-native';
import DealFinderScreen from './screens/DealFinderScreen';
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';

// import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './config/firebaseConfig'; // Import auth from your config
import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged,
} from 'firebase/auth';

// Define your backend API base URL
const API_BASE_URL = 'http://127.0.0.1:3000'; // TODO: Change this to backend URL

export default function App() {
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [firebaseUser, setFirebaseUser] = useState(null); // Stores the Firebase user object
const [loading, setLoading] = useState(true); // To show a loading indicator while checking auth state

// Listen for Firebase Auth state changes
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      setFirebaseUser(user);
      setIsAuthenticated(true);
    } else {
      // User is signed out
      setFirebaseUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false); // Auth state checked, stop loading
  });

  // Clean up the listener on component unmount
  return () => unsubscribe();
}, []);

// Function to handle user registration (called from RegistrationForm)
type RegisterParams = {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
};

const handleRegister = async ({ email, password, username, displayName }: RegisterParams) => {
  try {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('Firebase Auth user created:', user.uid);

    // 2. Send user data to your backend to create Firestore profile
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName,
        username: username,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Backend registration failed: ${errorData.message}`);
    }

    const data = await response.json();
    console.log('Firestore profile created:', data);
    // No need to set token here, onAuthStateChanged will handle authentication state
    return { success: true };
  } catch (error) {
    console.error('Registration failed:', error);
    return { success: false, error: error };
  }
};

// Function to handle user login (called from LoginForm)
const handleLogin = async ({ email, password }: { email: string; password: string }) => {
  try {
    // 1. Sign in user with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('Firebase Auth user logged in:', user.uid);

    // No need to call a backend login endpoint or store a token from backend.
    // Firebase handles the session.
    // onAuthStateChanged will update isAuthenticated state.
    return { success: true };
  } catch (error) {
    console.error('Login failed:', error.message);
    return { success: false, error: error.message };
  }
};

const handleLogout = async () => {
  try {
    await signOut(auth); // Sign out from Firebase Auth
    // onAuthStateChanged will update isAuthenticated state
    console.log('User logged out.');
  } catch (error) {
    console.error('Logout failed:', error.message);
  }
};

if (loading) {
  return (
    <SafeAreaView style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text>Checking authentication status...</Text>
    </SafeAreaView>
  );
}

return (
  <SafeAreaView style={styles.container}>
    {isAuthenticated ? (
      <>
        <Text style={styles.welcomeText}>Welcome, {firebaseUser?.displayName || firebaseUser?.email}!</Text>
        <Button title="Logout" onPress={handleLogout} />
        <DealFinderScreen firebaseUser={firebaseUser} API_BASE_URL={API_BASE_URL} />
      </>
    ) : (
      <>
        <RegistrationForm onRegister={handleRegister} />
        <LoginForm onLogin={handleLogin} />
      </>
    )}
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: '#fff',
  paddingTop: 25, // For Android status bar
  justifyContent: 'center',
  alignItems: 'center',
},
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
welcomeText: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 20,
}
});