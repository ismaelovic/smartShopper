import React, { useState } from 'react';
import { Image } from 'react-native';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import ProductSelection from '../components/ProductSelection'; // We'll create this
import { fetchDeals } from '../services/apiService'; // We'll create this

const commonProducts = [
'Mælk', 'Æg', 'Brød', 'Kyllingebryst', 'Havremælk', 'Tomater',
'Æbler', 'Kartofler', 'Ost', 'Yoghurt', 'Kaffe', 'Pasta', 'Ris',
'Smør', 'Laks', 'Appelsiner', 'Bananer', 'Løg', 'Hvidløg', 'Salat'
];

const DealFinderScreen: React.FC = () => {
const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
const [zipCode, setZipCode] = useState<string>('');
const [loading, setLoading] = useState<boolean>(false);
const [deals, setDeals] = useState<any>(null); // To store the fetched deals

const handleFindDeals = async () => {
  if (selectedProducts.length === 0) {
  Alert.alert('Valg påkrævet', 'Vælg venligst mindst ét produkt.');
    return;
  }
  if (!zipCode) {
    Alert.alert('Post nummer er påkrævet', 'Indtast venligst dit post nummer.');
    return;
  }

  setLoading(true);
  setDeals(null); // Clear previous deals
  try {
    const fetchedDeals = await fetchDeals(zipCode, selectedProducts);
    console.info('Error fetching deals:', fetchDeals);
    setDeals(fetchedDeals);
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    Alert.alert('Error', error.message || 'Kunne ikke hente tilbud. Prøv igen senere.');
  } finally {
    setLoading(false);
  }
};

return (
  <ScrollView style={styles.container}>
    <Text style={styles.header}>Find de bedste tilbud nær dig</Text>

    <View style={styles.section}>
      <Text style={styles.label}>Dit post nummer:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 8000"
        keyboardType="numeric"
        value={zipCode}
        onChangeText={setZipCode}
      />
    </View>
  
    <View style={styles.section}>
      <Text style={styles.label}>Vælg dine produkter:</Text>
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

    <Button
      title={loading ? "Finder tilbud..." : "Find tilbud"}
      onPress={handleFindDeals}
      disabled={loading}
    />

    {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}

    {deals && (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsHeader}>Dine tilbud:</Text>
        {Object.keys(deals).length > 0 ? (
          Object.entries(deals).map(([productName, dealInfo]: [string, any]) => (
         <View key={productName} style={styles.dealItem}>
  <Text style={styles.dealProduct}>{productName}:</Text>
  {dealInfo.status === 'not_found' ? (
    <Text style={styles.notFound}>{dealInfo.message}</Text>
  ) : (
    <View style={styles.dealContentRow}>
      {/* Product Info - takes 2/3 width */}
      <View style={styles.dealInfoColumn}>
        <Text style={styles.dealPrice}>Pris: {dealInfo.price.toFixed(2)} {dealInfo.currency}</Text>
        {dealInfo.originalPrice && <Text style={styles.dealDiscount}>Vejl. pris: {dealInfo.originalPrice.toFixed(2)} (nedsat {dealInfo.discount}%)</Text>}
        <Text style={styles.dealStore}>Butik: {dealInfo.store} ({dealInfo.storeAddress})</Text>
        {dealInfo.expires && <Text style={styles.dealExpiry}>Expires: {new Date(dealInfo.expires).toLocaleDateString()}</Text>}
      </View>

      {/* Image - takes 1/3 width */}
      {dealInfo.imageUrl && (
        <View style={styles.dealImageColumn}>
          <Image
            source={{ uri: dealInfo.imageUrl }}
            style={styles.dealImage} // dealImage style will be adjusted for fill
          />
        </View>
      )}
    </View>
  )}
</View>
          ))
        ) : (
          <Text style={styles.noDeals}>No deals found for your selected products in this area.</Text>
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