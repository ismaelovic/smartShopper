// frontend/src/screens/OnboardingWatchlistScreen.tsx
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { User } from 'firebase/auth';
import { onboardingProductCategories, ProductCategory, ProductVariant } from '../data/onboardingProducts'; // Import new data structure

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface OnboardingWatchlistScreenProps {
firebaseUser: User;
API_BASE_URL: string;
onWatchlistPopulated: () => void;
}

const OnboardingWatchlistScreen: React.FC<OnboardingWatchlistScreenProps> = ({
firebaseUser,
API_BASE_URL,
onWatchlistPopulated,
}) => {
// State to store selected product variants (e.g., { "Milk (Low-Fat)": true, "Rye Bread": true })
const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: boolean }>({});
const [expandedCategory, setExpandedCategory] = useState<string | null>(null); // State to manage expanded category
const [loading, setLoading] = useState(false);

const handleToggleVariant = (llmName: string) => {
  setSelectedVariants((prev) => ({
    ...prev,
    [llmName]: !prev[llmName],
  }));
};

const handleToggleCategoryExpand = (categoryName: string) => {
  LayoutAnimation.easeInEaseOut(); // Animate the expansion/collapse
  setExpandedCategory((prev) => (prev === categoryName ? null : categoryName));
};

const handleAddSelectedToWatchlist = async () => {
  const productsToAdd = Object.keys(selectedVariants).filter(llmName => selectedVariants[llmName]);

  if (productsToAdd.length === 0) {
    Alert.alert('No Selection', 'Please select at least one product to add to your watchlist.');
    return;
  }

  setLoading(true);

try {
  const idToken = await firebaseUser.getIdToken();
  const addPromises = productsToAdd.map(async (productName) => { // productName is now "Letmælk"
    let productCategory = 'Uncategorized';

    // Find the category to get the productCategory
    for (const category of onboardingProductCategories) {
      if (category.variants.some(variant => variant.name === productName)) { // Check variant.name
        productCategory = category.llmCategory; // Use the LLM category for consistency
        break;
      }
    }

    const response = await fetch(`${API_BASE_URL}/users/${firebaseUser.uid}/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        productName, 
        productCategory,
        displayImageUrl: null, // No image for generic onboarding items
      }),
    });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to add ${productName}: ${errorData.message || response.statusText}`);
      }
      return response.json();
    });

    await Promise.all(addPromises);
    Alert.alert('Success', 'Selected products added to your watchlist!');
    onWatchlistPopulated();
  } catch (error: any) {
    console.error('Error adding products to watchlist:', error);
    Alert.alert('Error', `Failed to add products: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

return (
  <ScrollView style={styles.container}>
    <Text style={styles.header}>Welcome! Let's build your first Watchlist.</Text>
    <Text style={styles.subheader}>Select specific products you'd like to track:</Text>

    {onboardingProductCategories.map((category) => (
      <View key={category.name} style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => handleToggleCategoryExpand(category.name)}
        >
          <Text style={styles.categoryHeaderText}>{category.name}</Text>
          <Text style={styles.categoryExpandIcon}>
            {expandedCategory === category.name ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {expandedCategory === category.name && (
          <View style={styles.variantsGrid}>
            {category.variants.map((variant) => (
              <TouchableOpacity
                key={variant.name}
                style={[
                  styles.variantButton,
                  selectedVariants[variant.name] && styles.variantButtonSelected,
                ]}
                onPress={() => handleToggleVariant(variant.name)}
              >
                <Text style={styles.variantButtonText}>{variant.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    ))}

    <Button
      title={loading ? 'Adding to Watchlist...' : 'Add Selected to Watchlist'}
      onPress={handleAddSelectedToWatchlist}
      disabled={loading || Object.keys(selectedVariants).filter(llmName => selectedVariants[llmName]).length === 0}
    />
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
  fontSize: 22,
  fontWeight: 'bold',
  marginBottom: 10,
  textAlign: 'center',
},
subheader: {
  fontSize: 16,
  marginBottom: 20,
  textAlign: 'center',
  color: '#666',
},
categoryContainer: {
  marginBottom: 15,
  backgroundColor: '#fff',
  borderRadius: 8,
  overflow: 'hidden', // Ensures children respect border radius
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
variantButton: {
  backgroundColor: '#f0f0f0',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 15,
  margin: 5,
  borderWidth: 1,
  borderColor: '#ccc',
},
variantButtonSelected: {
  backgroundColor: '#007bff',
  borderColor: '#007bff',
},
variantButtonText: {
  fontSize: 14,
  color: '#333',
},
});

export default OnboardingWatchlistScreen;