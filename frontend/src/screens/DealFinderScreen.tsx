// frontend/src/screens/DealFinderScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, TouchableOpacity } from 'react-native';
import DealerSelection from '../components/DealerSelection';
import { fetchDeals } from '../services/apiService';
import { User } from 'firebase/auth';

interface DealFinderScreenProps {
firebaseUser: User | null;
API_BASE_URL: string;
}

// Interface for frontend (and implied backend structure)
interface WatchlistItem {
id: string;
productName: string; // This is the single, canonical name (e.g., "Sødmælk", "Arla Økologisk Letmælk 1L")
productCategory: string; // e.g., "Dairy", "Meat"
displayImageUrl?: string | null; // Optional image for display
// Other original deal fields if needed for display or context (e.g., originalDealId, originalDealerName)
}

// Define the structure of a single deal object returned from your backend
interface DealInfo {
productDescription: string; // The specific product description from the deal
price: number;
store: string; 
storeAddress: string; 
originalPrice?: number;
validUntil?: string;
imageUrl?: string; 
// ... other fields from your API payload that you might want to store
id: string; // The unique ID of the deal from the external API (e.g., "phxCnkQY9jZarfee4IAud")
heading: string; // The original heading from the external API
description: string; // The original description from the external API
dealer_id: string; // The dealer ID from the external API
dealer: { // The dealer object from the external API
  name: string;
  // ... other dealer details
};
pricing: {
  price: number;
  // ...
};
images: {
  thumb: string;
  // ...
};
// ... any other fields from the raw deal payload you pass to the backend
}

const allDealers = [
{ id: '11deC', name: 'REMA 1000' },
{ id: '9ba51', name: 'Netto' },
{ id: '71c90', name: 'Lidl' },
{ id: '267e1m', name: 'MENY' },
{ id: 'bdf5A', name: 'føtex' },
{ id: '603dfL', name: 'Min Købmand' },
];

const DealFinderScreen: React.FC<DealFinderScreenProps> = ({ firebaseUser, API_BASE_URL }) => {
const [userWatchlist, setUserWatchlist] = useState<WatchlistItem[]>([]);
const [selectedProductNames, setSelectedProductNames] = useState<string[]>([]);
const [loadingWatchlist, setLoadingWatchlist] = useState(true);
const [selectedDealerIds, setSelectedDealerIds] = useState<string[]>([]);
const [loadingDeals, setLoadingDeals] = useState<boolean>(false);
const [deals, setDeals] = useState<Record<string, DealInfo> | null>(null); // Use Record<string, DealInfo> for better typing

const fetchUserWatchlist = useCallback(async () => {
  if (!firebaseUser) {
    setLoadingWatchlist(false);
    return;
  }
  setLoadingWatchlist(true);
  try {
    const idToken = await firebaseUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/users/${firebaseUser.uid}/watchlist`, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch watchlist');
    }

    const data: WatchlistItem[] = await response.json();
    console.log('Fetched user watchlist:', data);
    setUserWatchlist(data);
    setSelectedProductNames(data.map(item => item.productName));
  } catch (error: any) {
    console.error('Error fetching user watchlist:', error);
    Alert.alert('Error', `Failed to load your watchlist: ${error.message}`);
  } finally {
    setLoadingWatchlist(false);
  }
}, [firebaseUser, API_BASE_URL]);

useEffect(() => {
  fetchUserWatchlist();
}, [fetchUserWatchlist]);

// Toggle selection of a watchlist item based on its llmProductName
const handleToggleWatchlistItem = (llmProductName: string) => {
  setSelectedProductNames((prev) =>
    prev.includes(llmProductName)
      ? prev.filter((name) => name !== llmProductName)
      : [...prev, llmProductName]
  );
};

const handleFindDeals = async () => {
  if (selectedProductNames.length === 0) {
    Alert.alert('Selection Required', 'Please select at least one product from your watchlist.');
    return;
  }

  if (!firebaseUser) {
    Alert.alert('Authentication Required', 'Please log in to find deals.');
    return;
  }

  setLoadingDeals(true);
  setDeals(null);
  try {
    // console.log('Fetching deals for LLM products:', selectedProductNames, 'and dealers:', selectedDealerIds);
    const fetchedDeals = await fetchDeals(selectedProductNames, selectedDealerIds, firebaseUser, API_BASE_URL);
    console.log('Fetched deals:', fetchedDeals);
    setDeals(fetchedDeals);
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    Alert.alert('Error', error.message || 'Failed to fetch deals. Please try again.');
  } finally {
    setLoadingDeals(false);
  }
};

// NEW: Function to add a specific deal to watchlist
const handleAddDealToWatchlist = async (deal: DealInfo) => {
  if (!firebaseUser) {
    Alert.alert('Authentication Required', 'Please log in to add items to your watchlist.');
    return;
  }

  try {
    const idToken = await firebaseUser.getIdToken();
    // Send the entire deal object to the backend.
    // The backend's addItemToWatchlist will extract what it needs (heading, description, etc.)
    const response = await fetch(`${API_BASE_URL}/users/${firebaseUser.uid}/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(deal), // Send the full deal object
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add deal to watchlist');
    }

    const result = await response.json();
    Alert.alert('Success', result.message || 'Deal added to watchlist!');
    // Optionally, re-fetch the watchlist to update the UI
    fetchUserWatchlist();
  } catch (error: any) {
    console.error('Error adding deal to watchlist:', error);
    Alert.alert('Error', `Failed to add deal to watchlist: ${error.message}`);
  }
};

if (loadingWatchlist) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text>Loading your watchlist...</Text>
    </View>
  );
}

return (
  <ScrollView style={styles.container}>
    <Text style={styles.header}>Find Your Best Grocery Deals</Text>

    <View style={styles.section}>
      <Text style={styles.label}>Your Watchlist Products:</Text>
      {userWatchlist.length === 0 ? (
        <Text style={styles.noWatchlistText}>
          Your watchlist is empty. Add items from the onboarding screen or a future "Add to Watchlist" feature!
        </Text>
      ) : (
        <View style={styles.productsGrid}>
          {userWatchlist.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.productButton,
                selectedProductNames.includes(item.productName) && styles.productButtonSelected,
              ]}
              onPress={() => handleToggleWatchlistItem(item.productName)}
            >
              {item.displayImageUrl && (
                <Image source={{ uri: item.displayImageUrl }} style={styles.productImage} />
              )}
              <Text style={styles.productButtonText}>{item.productName}</Text>
              {item.productCategory && (
                <Text style={styles.productButtonCategory}>{item.productCategory}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>

    <View style={styles.section}>
      <Text style={styles.label}>Select Supermarkets (Optional):</Text>
      <DealerSelection
        dealers={allDealers}
        selectedDealerIds={selectedDealerIds}
        onDealerToggle={(dealerId) => {
          setSelectedDealerIds((prev) =>
            prev.includes(dealerId)
              ? prev.filter((id) => id !== dealerId)
              : [...prev, dealerId]
          );
        }}
      />
    </View>

    <Button
      title={loadingDeals ? "Finding Deals..." : "Find Best Deals"}
      onPress={handleFindDeals}
      disabled={loadingDeals || selectedProductNames.length === 0}
    />

    {loadingDeals && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}

    {deals && (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsHeader}>Your Deals:</Text>
        {Object.keys(deals).length > 0 ? (
          Object.entries(deals).map(([requestedProductName, dealInfo]: [string, any]) => (
            <View key={requestedProductName} style={styles.dealItem}>
              <Text style={styles.dealProduct}>{dealInfo.productName || dealInfo.productDescription || requestedProductName}:</Text>
              {dealInfo.status === 'not_found' ? (
                <Text style={styles.notFound}>{dealInfo.message}</Text>
              ) : (
                <View>
                  <View style={styles.dealContentRow}>
                    <View style={styles.dealInfoColumn}>
                      <Text style={styles.dealPrice}>Price: DKK {dealInfo.currentPrice.toFixed(2)}</Text>
                      <Text style={styles.dealStore}>Dealer: {dealInfo.dealerName}</Text>
                      {dealInfo.originalPrice && <Text style={styles.dealDiscount}>Original: DKK {dealInfo.originalPrice.toFixed(2)}</Text>}
                      {dealInfo.offerExpires && <Text style={styles.dealExpiry}>Expires: {new Date(dealInfo.offerExpires).toLocaleDateString()}</Text>}
                    </View>
                    {dealInfo.imageUrl && (
                      <View style={styles.dealImageColumn}>
                        <Image
                          source={{ uri: dealInfo.imageUrl }}
                          style={styles.dealImage}
                        />
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.addToWatchlistButton}
                    onPress={() => handleAddDealToWatchlist(dealInfo)} 
                  >
                    <Text style={styles.addToWatchlistButtonText}>Add to Watchlist</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noDeals}>No deals found for your selected products and dealers.</Text>
        )}
      </View>
    )}
  </ScrollView>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  padding: 20,
  backgroundColor: '#f8f8f8',
},
centered: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
header: {
  fontSize: 24,
  fontWeight: 'bold',
  marginBottom: 20,
  textAlign: 'center',
  color: '#333',
},
section: {
  marginBottom: 20,
},
label: {
  fontSize: 16,
  fontWeight: '600',
  marginBottom: 8,
  color: '#555',
},
productsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginBottom: 10,
},
productButton: {
  backgroundColor: '#e0e0e0',
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderRadius: 20,
  margin: 5,
  borderWidth: 1,
  borderColor: '#ccc',
  alignItems: 'center',
  flexDirection: 'row',
},
productButtonSelected: {
  backgroundColor: '#007bff',
  borderColor: '#007bff',
},
productImage: {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 8,
  resizeMode: 'contain',
},
productButtonText: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#333',
},
productButtonCategory: {
  fontSize: 12,
  color: '#666',
  marginLeft: 5,
},
noWatchlistText: {
  fontSize: 14,
  color: '#888',
  textAlign: 'center',
  padding: 10,
  backgroundColor: '#f0f0f0',
  borderRadius: 8,
},
loader: {
  marginTop: 20,
},
resultsContainer: {
  marginTop: 30,
  padding: 15,
  backgroundColor: '#fff',
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#eee',
},
resultsHeader: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 15,
  color: '#333',
},
dealProduct: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#007bff',
  marginBottom: 5,
},
dealPrice: {
  fontSize: 16,
  fontWeight: '600',
  color: '#28a745',
},
dealStore: {
  fontSize: 14,
  color: '#666',
},
dealDiscount: {
  fontSize: 14,
  color: '#dc3545',
},
dealExpiry: {
  fontSize: 12,
  color: '#999',
},
dealItem: {
  marginBottom: 15,
  paddingBottom: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
  padding: 10,
  borderRadius: 8,
  backgroundColor: '#fff',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
dealContentRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 10,
},
dealInfoColumn: {
  flex: 2,
  paddingRight: 10,
},
dealImageColumn: {
  flex: 1,
  alignItems: 'flex-end',
},
dealImage: {
  width: '100%',
  height: 80,
  resizeMode: 'contain',
  borderRadius: 5,
},
notFound: {
  fontSize: 14,
  color: '#ffc107',
  fontStyle: 'italic',
},
noDeals: {
  fontSize: 16,
  color: '#999',
  textAlign: 'center',
  paddingVertical: 20,
},
addToWatchlistButton: { // New style for the button
  backgroundColor: '#28a745',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 5,
  marginTop: 10,
  alignSelf: 'flex-start', // Align button to the left
},
addToWatchlistButtonText: { // New style for button text
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
},
});

export default DealFinderScreen;