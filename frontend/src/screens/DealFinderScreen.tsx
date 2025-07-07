// frontend/src/screens/DealFinderScreen.tsx
import React, { useState, useEffect } from 'react'; // Import useEffect
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import ProductSelection from '../components/ProductSelection';
import DealerSelection from '../components/DealerSelection';
import { fetchDeals } from '../services/apiService';

const commonProducts = [
'Milk', 'Eggs', 'Bread', 'Chicken Breast', 'Oat Milk', 'Tomatoes',
'Apples', 'Potatoes', 'Cheese', 'Yogurt', 'Coffee', 'Pasta', 'Rice',
'Butter', 'Salmon', 'Oranges', 'Bananas', 'Onions', 'Garlic', 'Lettuce'
];

// Placeholder for dealers. TODO: we need to fetch this from the API or a static list.
const allDealers = [
{ id: '11deC', name: 'REMA 1000' },
{ id: '9ba51', name: 'Netto' },
{ id: '71c90', name: 'Lidl' },
{ id: '267e1m', name: 'MENY' },
{ id: 'bdf5A', name: 'føtex' },
{ id: '603dfL', name: 'Min Købmand' },
];

const DealFinderScreen: React.FC = () => {
const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
const [selectedDealerIds, setSelectedDealerIds] = useState<string[]>([]); // New state for dealers
const [loading, setLoading] = useState<boolean>(false);
const [deals, setDeals] = useState<any>(null);

const handleFindDeals = async () => {
  if (selectedProducts.length === 0) {
    Alert.alert('Selection Required', 'Please select at least one product.');
    return;
  }

  setLoading(true);
  setDeals(null);
  try {
    // Pass selectedDealerIds to fetchDeals
    const fetchedDeals = await fetchDeals(selectedProducts, selectedDealerIds);
    setDeals(fetchedDeals);
    // console.log('Fetched deals:', fetchedDeals);
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    Alert.alert('Error', error.message || 'Failed to fetch deals. Please try again.');
  } finally {
    setLoading(false);
  }
};

return (
  <ScrollView style={styles.container}>
    <Text style={styles.header}>Find Your Best Grocery Deals</Text>

    <View style={styles.section}>
      <Text style={styles.label}>Select Products You Need:</Text>
      <ProductSelection
        products={commonProducts}
        selectedProducts={selectedProducts}
        onProductToggle={(product) => {
          setSelectedProducts((prev) =>
            prev.includes(product)
              ? prev.filter((p) => p !== product)
              : [...prev, product]
          );
        }}
      />
    </View>

    {/* NEW: Dealer Selection Section */}
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
      title={loading ? "Finding Deals..." : "Find Best Deals"}
      onPress={handleFindDeals}
      disabled={loading}
    />

    {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}

    {deals && (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsHeader}>Your Deals:</Text>
        {Object.keys(deals).length > 0 ? (
          Object.entries(deals).map(([productName, dealInfo]: [string, any]) => (
            <View key={productName} style={styles.dealItem}>
              <Text style={styles.dealProduct}>{productName}:</Text>
              {dealInfo.status === 'not_found' ? (
                <Text style={styles.notFound}>{dealInfo.message}</Text>
              ) : (
                <View style={styles.dealContentRow}>
                  <View style={styles.dealInfoColumn}>
                    <Text style={styles.dealPrice}>Price: DKK {dealInfo.price.toFixed(2)}</Text>
                    <Text style={styles.dealStore}>Store: {dealInfo.store.brand} ({dealInfo.store.address})</Text>
                    {dealInfo.originalPrice && <Text style={styles.dealDiscount}>Original: DKK {dealInfo.originalPrice.toFixed(2)}</Text>}
                    {dealInfo.validUntil && <Text style={styles.dealExpiry}>Expires: {new Date(dealInfo.validUntil).toLocaleDateString()}</Text>}
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
input: {
  height: 40,
  borderColor: '#ddd',
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 10,
  backgroundColor: '#fff',
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
  // Add padding/border to the item itself if you want the whole box to be distinct
  padding: 10, // Added padding to the dealItem
  borderRadius: 8,
  backgroundColor: '#fff', // Added background for better visual separation
  shadowColor: '#000', // Optional: add a subtle shadow
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2, // For Android shadow
},

dealContentRow: {
  flexDirection: 'row', // Arrange children horizontally
  alignItems: 'center', // Vertically align items in the center
  marginTop: 10, // Space between product name and content row
},

dealInfoColumn: {
  flex: 2, // Takes 2 parts of the available space (2/3)
  paddingRight: 10, // Space between info and image
},

dealImageColumn: {
  flex: 1, // Takes 1 part of the available space (1/3)
  alignItems: 'flex-end', // Align image to the right within its column
},

dealImage: {
  width: '100%', // Make image fill its column
  height: 80,    // Fixed height for the image
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
}
});

export default DealFinderScreen;