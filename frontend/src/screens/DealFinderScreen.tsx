import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import DealerSelection from '../components/DealerSelection';
import { fetchDeals } from '../services/apiService';
import { User } from 'firebase/auth';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DealFinderScreenProps {
firebaseUser: User | null;
API_BASE_URL: string;
}

interface WatchlistItem {
id: string;
productName: string; // This is the single, canonical name
productCategory: string;
displayImageUrl?: string | null; // Optional image for display
// ... other original deal fields if needed for display or context
}

interface DealInfo {
productDescription: string; // The specific product description from the deal
price: number;
store: string; // Assuming this is the store brand name
storeAddress: string; // Assuming this is the store address
originalPrice?: number;
validUntil?: string;
imageUrl?: string; // The image URL for this specific deal
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
// Add the LLM-generated fields that come with the dealInfo
productName?: string; // LLM-generated simplified name
productCategory?: string; // LLM-generated category
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
const [deals, setDeals] = useState<Record<string, DealInfo> | null>(null);

// New states for grouping and expansion
const [groupedWatchlist, setGroupedWatchlist] = useState<Record<string, WatchlistItem[]>>({});
const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

// Helper to group watchlist items by category
useEffect(() => {
  const groups: Record<string, WatchlistItem[]> = {};
  userWatchlist.forEach(item => {
    const category = item.productCategory || 'Other'; // Default to 'Other' if category is missing
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
  });
  setGroupedWatchlist(groups);
}, [userWatchlist]);

// Toggle category expansion
const handleToggleCategoryExpand = (categoryName: string) => {
  LayoutAnimation.easeInEaseOut(); // For smooth animation
  setExpandedCategory((prev) => (prev === categoryName ? null : categoryName));
};

const fetchUserWatchlist = useCallback(async () => {
  if (!firebaseUser) {
    setLoadingWatchlist(false);
    return;
  }
  setLoadingWatchlist(true);
  try {
    const idToken = await firebaseUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/watchlist/${firebaseUser.uid}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch watchlist');
    }

    const data: WatchlistItem[] = await response.json();
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

const handleToggleWatchlistItem = (productName: string) => {
  setSelectedProductNames((prev) =>
    prev.includes(productName)
      ? prev.filter((name) => name !== productName)
      : [...prev, productName]
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
    console.log('Fetching deals for products:', selectedProductNames, 'and dealers:', selectedDealerIds);
    const fetchedDeals = await fetchDeals(selectedProductNames, selectedDealerIds, firebaseUser, API_BASE_URL);
    setDeals(fetchedDeals);
    console.log('Fetched deals:', fetchedDeals);
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    Alert.alert('Error', error.message || 'Failed to fetch deals. Please try again.');
  } finally {
    setLoadingDeals(false);
  }
};

const handleAddDealToWatchlist = async (deal: DealInfo) => {
  if (!firebaseUser) {
    Alert.alert('Authentication Required', 'Please log in to add items to your watchlist.');
    return;
  }

  try {
    const idToken = await firebaseUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/watchlist/${firebaseUser.uid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(deal),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add deal to watchlist');
    }

    const result = await response.json();
    Alert.alert('Success', result.message || 'Deal added to watchlist!');
    fetchUserWatchlist(); // Re-fetch to update the watchlist display
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
  <View style={styles.fullScreenContainer}>
    <ScrollView style={styles.scrollViewContent}>
      <Text style={styles.header}>Find Your Best Grocery Deals</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Select Products to Find Deals For:</Text>
        {userWatchlist.length === 0 ? (
          <Text style={styles.noWatchlistText}>
            Your watchlist is empty. Pull recent deals! A specific "Add to Watchlist" feature is coming later!
          </Text>
        ) : (
          Object.keys(groupedWatchlist).sort().map(categoryName => (
            <View key={categoryName} style={styles.categoryContainer}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => handleToggleCategoryExpand(categoryName)}
              >
                <Text style={styles.categoryHeaderText}>{categoryName}</Text>
                <Text style={styles.categoryExpandIcon}>
                  {expandedCategory === categoryName ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {expandedCategory === categoryName && (
                <View style={styles.variantsGrid}>
                  {groupedWatchlist[categoryName].map((item) => (
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
          ))
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

      {loadingDeals && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}

      {deals && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsHeader}>Your Deals:</Text>
          {Object.keys(deals).length > 0 ? (
            Object.entries(deals).map(([requestedProductName, dealInfo]: [string, any]) => (
              <View key={requestedProductName} style={styles.dealItem}>
                <Text style={styles.dealProduct}>{dealInfo.productDescription || requestedProductName}:</Text>
                {dealInfo.status === 'not_found' ? (
                  <Text style={styles.notFound}>{dealInfo.message}</Text>
                ) : (
                  <View>
                    <View style={styles.dealContentRow}>
                      <View style={styles.dealInfoColumn}>
                        <Text style={styles.dealPrice}>Price: DKK {dealInfo.currentPrice.toFixed(2)}</Text>
                        <Text style={styles.dealStore}>Store: {dealInfo.dealerName}</Text>
                        {dealInfo.originalPrice && <Text style={styles.dealDiscount}>Original: DKK {dealInfo.originalPrice.toFixed(2)}</Text>}
                        {dealInfo.runTill && <Text style={styles.dealExpiry}>Expires: {new Date(dealInfo.runTill).toLocaleDateString()}</Text>}
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

    {/* Fixed Bottom Action Bar */}
    <View style={styles.bottomActionBar}>
      <Text style={styles.selectedCountText}>
        {selectedProductNames.length} selected
      </Text>
      <Button
        title={loadingDeals ? "Finding Deals..." : "Find Best Deals"}
        onPress={handleFindDeals}
        disabled={loadingDeals || selectedProductNames.length === 0}
      />
    </View>
  </View>
);
};

const styles = StyleSheet.create({
fullScreenContainer: {
  flex: 1,
  backgroundColor: '#f8f8f8',
},
scrollViewContent: {
  flex: 1,
  padding: 20,
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
// Category-based watchlist styles
categoryContainer: {
  marginBottom: 10,
  backgroundColor: '#fff',
  borderRadius: 8,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '#ddd',
},
categoryHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 15,
  backgroundColor: '#e9e9e9',
},
categoryHeaderText: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
},
categoryExpandIcon: {
  fontSize: 18,
  color: '#666',
},
variantsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  padding: 10,
  borderTopWidth: 1,
  borderTopColor: '#eee',
},
productButton: {
  backgroundColor: '#f0f0f0',
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
addToWatchlistButton: {
  backgroundColor: '#28a745',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 5,
  marginTop: 10,
  alignSelf: 'flex-start',
},
addToWatchlistButtonText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
},
bottomActionBar: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 10,
  paddingHorizontal: 20,
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: '#eee',
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 5,
},
selectedCountText: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#555',
},
});

export default DealFinderScreen;