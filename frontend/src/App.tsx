// App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Button, ActivityIndicator } from 'react-native';
import DealFinderScreen from './screens/DealFinderScreen';
import ProfileScreen from './screens/ProfileScreen';
import AddProductsScreen from './screens/AddProductsScreen';
import WatchlistScreen from './screens/WatchlistScreen';
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';

import { auth } from './config/firebaseConfig';
import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged,
} from 'firebase/auth';

const API_BASE_URL = 'http://localhost:3000';

export default function App() {
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [firebaseUser, setFirebaseUser] = useState(null);
const [loading, setLoading] = useState(true);
const [currentScreen, setCurrentScreen] = useState('dealFinder');

type RegisterParams = {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
};

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setFirebaseUser(user);
      setIsAuthenticated(true);
      setCurrentScreen('dealFinder');
    } else {
      setFirebaseUser(null);
      setIsAuthenticated(false);
      setCurrentScreen('login');
    }
    setLoading(false);
  });
  return () => unsubscribe();
}, []);

const handleRegister = async ({ email, password, username, displayName }: RegisterParams) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('Firebase Auth user created:', user.uid);

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
      throw new Error(`Backend registration failed: ${errorData.message || JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Firestore profile created:', data);
    return { success: true };
  } catch (error: any) {
    console.error('Registration failed:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
};

const handleLogin = async ({ email, password }: { email: string; password: string }) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('Firebase Auth user logged in:', user.uid);
    return { success: true };
  } catch (error: any) {
    console.error('Login failed:', error.message);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
};

const handleLogout = async () => {
  try {
    await signOut(auth);
    console.log('User logged out.');
  } catch (error) {
    console.error('Logout failed:', error);
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
      // Explicitly wrap the authenticated content in a View or Fragment
      <React.Fragment>
        <View style={styles.navBar}>
          <Button title="Deals" onPress={() => setCurrentScreen('dealFinder')} />
          <Button title="Watchlist" onPress={() => setCurrentScreen('watchlist')} />
          <Button title="Add Products" onPress={() => setCurrentScreen('addProducts')} />
          <Button title="My Profile" onPress={() => setCurrentScreen('profile')} />
          <Button title="Logout" onPress={handleLogout} />
        </View>

        {currentScreen === 'dealFinder' && (
          <DealFinderScreen firebaseUser={firebaseUser} API_BASE_URL={API_BASE_URL} />
        )}
        {currentScreen === 'watchlist' && (
          <WatchlistScreen firebaseUser={firebaseUser} API_BASE_URL={API_BASE_URL} />
        )}
        {currentScreen === 'addProducts' && (
          <AddProductsScreen firebaseUser={firebaseUser} API_BASE_URL={API_BASE_URL} />
        )}
        {currentScreen === 'profile' && (
          <ProfileScreen firebaseUser={firebaseUser} API_BASE_URL={API_BASE_URL} />
        )}
      </React.Fragment>
    ) : (
      // This part was already correctly wrapped in a fragment
      <React.Fragment>
        <RegistrationForm onRegister={handleRegister} />
        <LoginForm onLogin={handleLogin} />
      </React.Fragment>
    )}
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: '#fff',
  paddingTop: 25,
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
},
navBar: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
  width: '100%',
}
});