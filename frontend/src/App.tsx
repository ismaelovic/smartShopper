// App.jsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Button, ActivityIndicator } from 'react-native';
import DealFinderScreen from './screens/DealFinderScreen';
import ProfileScreen from './screens/ProfileScreen';
import OnboardingWatchlistScreen from './screens/OnboardingWatchlistScreen';
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';

import { auth } from './config/firebaseConfig';
import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged,
} from 'firebase/auth';

// Define your backend API base URL - This can stay outside if it's truly a global constant
// but often better to pass it as a prop or context if it varies by environment.
// For now, let's keep it here as it's used by functions defined inside App.
const API_BASE_URL = 'http://localhost:3000';

export default function App() {
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [firebaseUser, setFirebaseUser] = useState(null);
const [loading, setLoading] = useState(true);
const [currentScreen, setCurrentScreen] = useState('dealFinder');
const [needsOnboarding, setNeedsOnboarding] = useState(false);

// Define types for RegisterParams inside the component or globally if preferred
type RegisterParams = {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
};

// --- MOVE ALL THESE FUNCTIONS INSIDE THE COMPONENT ---

// Function to check if user's watchlist is empty
const checkWatchlistStatus = async (user) => {
  if (!user) return;
  try {
    const idToken = await user.getIdToken();
    const response = await fetch(`${API_BASE_URL}/users/${user.uid}/watchlist`, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch watchlist status:', await response.text());
      setNeedsOnboarding(false);
      return;
    }

    const watchlist = await response.json();
    if (watchlist.length === 0) {
      setNeedsOnboarding(true);
      setCurrentScreen('onboarding');
    } else {
      setNeedsOnboarding(false);
      setCurrentScreen('dealFinder');
    }
  } catch (error) {
    console.error('Error checking watchlist status:', error);
    setNeedsOnboarding(false);
  }
};

// Listen for Firebase Auth state changes
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setFirebaseUser(user);
      setIsAuthenticated(true);
      await checkWatchlistStatus(user);
    } else {
      setFirebaseUser(null);
      setIsAuthenticated(false);
      setCurrentScreen('login');
      setNeedsOnboarding(false);
    }
    setLoading(false);
  });
  return () => unsubscribe();
}, []);

// Callback from OnboardingWatchlistScreen when watchlist is populated
const handleWatchlistPopulated = () => {
  setNeedsOnboarding(false);
  setCurrentScreen('dealFinder');
};

// Function to handle user registration (called from RegistrationForm)
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

// Function to handle user login (called from LoginForm)
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
    console.error('Logout failed:', error.message);
  }
};

// --- END OF MOVED FUNCTIONS ---

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
      needsOnboarding ? (
        <OnboardingWatchlistScreen
          firebaseUser={firebaseUser}
          API_BASE_URL={API_BASE_URL}
          onWatchlistPopulated={handleWatchlistPopulated}
        />
      ) : (
        <>
          <View style={styles.navBar}>
            <Button title="Deals" onPress={() => setCurrentScreen('dealFinder')} />
            <Button title="My Profile" onPress={() => setCurrentScreen('profile')} />
            <Button title="Logout" onPress={handleLogout} />
          </View>

          {currentScreen === 'dealFinder' && (
            <DealFinderScreen firebaseUser={firebaseUser} API_BASE_URL={API_BASE_URL} />
          )}
          {currentScreen === 'profile' && (
            <ProfileScreen firebaseUser={firebaseUser} API_BASE_URL={API_BASE_URL} />
          )}
        </>
      )
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