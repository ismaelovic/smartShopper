// App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Button, ActivityIndicator, TouchableOpacity } from 'react-native';
import DealFinderScreen from './screens/DealFinderScreen';
import ProfileScreen from './screens/ProfileScreen';
import AddProductsScreen from './screens/AddProductsScreen';
import WatchlistScreen from './screens/WatchlistScreen';
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';
import { colors } from './styles/colors';

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
const [firebaseUser, setFirebaseUser] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [currentScreen, setCurrentScreen] = useState('dealFinder');
const [authScreen, setAuthScreen] = useState('login'); // 'login' or 'register'

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
      // Default to login screen when logged out
      setAuthScreen('login');
    }
    setLoading(false);
  });
  return () => unsubscribe();
}, []);const handleRegister = async ({ email, password, username, displayName }: RegisterParams) => {
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
          <TouchableOpacity
            style={[styles.navButton, currentScreen === 'dealFinder' ? styles.activeNavButton : {}]}
            onPress={() => setCurrentScreen('dealFinder')}
          >
            <Text style={[styles.navButtonText, currentScreen === 'dealFinder' ? styles.activeNavText : {}]}>Deals</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navButton, currentScreen === 'watchlist' ? styles.activeNavButton : {}]}
            onPress={() => setCurrentScreen('watchlist')}
          >
            <Text style={[styles.navButtonText, currentScreen === 'watchlist' ? styles.activeNavText : {}]}>Watchlist</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navButton, currentScreen === 'addProducts' ? styles.activeNavButton : {}]}
            onPress={() => setCurrentScreen('addProducts')}
          >
            <Text style={[styles.navButtonText, currentScreen === 'addProducts' ? styles.activeNavText : {}]}>Add Products</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navButton, currentScreen === 'profile' ? styles.activeNavButton : {}]}
            onPress={() => setCurrentScreen('profile')}
          >
            <Text style={[styles.navButtonText, currentScreen === 'profile' ? styles.activeNavText : {}]}>Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
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
      // Authentication screens
      <React.Fragment>
        {authScreen === 'login' ? (
          <LoginForm 
            onLogin={handleLogin} 
            onSwitchToRegister={() => setAuthScreen('register')} 
          />
        ) : (
          <RegistrationForm 
            onRegister={handleRegister} 
            onSwitchToLogin={() => setAuthScreen('login')} 
          />
        )}
      </React.Fragment>
    )}
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: colors.background,
  paddingTop: 25,
},
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: colors.background,
},
welcomeText: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 20,
  color: colors.text.primary,
},
navBar: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
  width: '100%',
  backgroundColor: colors.surface,
},
navButton: {
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 6,
},
activeNavButton: {
  backgroundColor: colors.primary,
},
navButtonText: {
  fontSize: 14,
  color: colors.text.primary,
  fontWeight: '500',
},
activeNavText: {
  color: colors.text.inverse,
  fontWeight: 'bold',
},
logoutButton: {
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 6,
  backgroundColor: colors.secondary,
},
logoutButtonText: {
  color: colors.text.inverse,
  fontWeight: 'bold',
  fontSize: 14,
}
});