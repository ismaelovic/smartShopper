// frontend/src/screens/WatchlistScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { colors } from '../styles/colors';
import { User } from 'firebase/auth';

interface WatchlistScreenProps {
firebaseUser: User; // User must be logged in to view watchlist
API_BASE_URL: string;
}

interface WatchlistItem {
id: string; // Firestore document ID (which is the originalDealId)
productName: string;
productCategory: string;
displayImageUrl?: string | null;
originalDealerName?: string;
currentPrice?: number; // Price at the time of adding
originalPrice?: number; // Original price at the time of adding
discountAmount?: number;
addedAt: any; // Firestore Timestamp
// Add other fields you want to display from your watchlist item structure
}

const WatchlistScreen: React.FC<WatchlistScreenProps> = ({ firebaseUser, API_BASE_URL }) => {
const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh

const fetchWatchlist = useCallback(async () => {
  if (!firebaseUser) {
    setLoading(false);
    return;
  }
  setLoading(true);
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
    setWatchlist(data);
  } catch (error: any) {
    console.error('Error fetching watchlist:', error);
    Alert.alert('Error', `Failed to load your watchlist: ${error.message}`);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [firebaseUser, API_BASE_URL]);

useEffect(() => {
  fetchWatchlist();
}, [fetchWatchlist]);

const onRefresh = useCallback(() => {
  setRefreshing(true);
  fetchWatchlist();
}, [fetchWatchlist]);

const handleRemoveItem = async (itemId: string, productName: string) => {
  Alert.alert(
    'Remove from Watchlist',
    `Are you sure you want to remove "${productName}" from your watchlist?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        onPress: async () => {
  try {
    const idToken = await firebaseUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/watchlist/${firebaseUser.uid}/product/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove item');
    }

            Alert.alert('Success', 'Item removed from watchlist.');
    fetchWatchlist(); // Refresh the list
  } catch (error: any) {
    console.error('Error removing item:', error);
            Alert.alert('Error', `Failed to remove item: ${error.message}`);
  }
        },
        style: 'destructive',
      },
    ],
    { cancelable: true }
  );
};

if (loading) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text>Loading your watchlist...</Text>
    </View>
  );
}

return (
  <ScrollView
    style={styles.container}
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    }
  >
    <Text style={styles.header}>My Watchlist</Text>

    {watchlist.length === 0 ? (
      <View style={styles.emptyWatchlist}>
        <Text style={styles.emptyWatchlistText}>Your watchlist is empty.</Text>
        <Text style={styles.emptyWatchlistSubText}>Find deals and add them to your watchlist!</Text>
      </View>
    ) : (
      watchlist.map((item) => (
        <View key={item.id} style={styles.watchlistItem}>
          <View style={styles.itemHeader}>
            {item.displayImageUrl && (
              <Image source={{ uri: item.displayImageUrl }} style={styles.itemImage} />
            )}
            <View style={styles.itemHeaderTextContainer}>
              <Text style={styles.itemProductName}>{item.productName}</Text>
              {item.productCategory && (
                <Text style={styles.itemProductCategory}>{item.productCategory}</Text>
              )}
            </View>
          </View>

          <View style={styles.itemDetails}>
            {item.originalDealerName && item.currentPrice && (
              <Text style={styles.itemPrice}>
                {item.originalDealerName}: DKK {item.currentPrice.toFixed(2)}
                {item.originalPrice && <Text style={styles.itemOriginalPrice}> (Org: {item.originalPrice.toFixed(2)})</Text>}
              </Text>
            )}
            <Text style={styles.itemAddedAt}>Added: {new Date(item.addedAt._seconds * 1000).toLocaleDateString()}</Text>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id, item.productName)}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))
    )}
  </ScrollView>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  padding: 20,
  backgroundColor: colors.background,
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
  color: colors.text.primary,
},
emptyWatchlist: {
  alignItems: 'center',
  marginTop: 50,
},
emptyWatchlistText: {
  fontSize: 18,
  color: colors.text.secondary,
  marginBottom: 10,
},
emptyWatchlistSubText: {
  fontSize: 14,
  color: colors.text.muted,
  textAlign: 'center',
},
watchlistItem: {
  backgroundColor: colors.surface,
  borderRadius: 10,
  padding: 15,
  marginBottom: 15,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
itemHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},
itemImage: {
  width: 60,
  height: 60,
  borderRadius: 30,
  marginRight: 10,
  resizeMode: 'contain',
},
itemHeaderTextContainer: {
  flex: 1,
},
itemProductName: {
  fontSize: 18,
  fontWeight: 'bold',
  color: colors.text.primary,
},
itemProductCategory: {
  fontSize: 14,
  color: colors.text.secondary,
},
itemDetails: {
  marginBottom: 10,
},
itemPrice: {
  fontSize: 16,
  fontWeight: '600',
  color: colors.primary,
},
itemOriginalPrice: {
  fontSize: 14,
  color: colors.error,
  textDecorationLine: 'line-through',
},
itemAddedAt: {
  fontSize: 12,
  color: colors.text.muted,
  marginTop: 5,
},
removeButton: {
  backgroundColor: colors.secondary,
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 5,
  alignSelf: 'flex-end', // Align to the right
},
removeButtonText: {
  color: colors.text.inverse,
  fontSize: 14,
  fontWeight: 'bold',
},
});

export default WatchlistScreen;