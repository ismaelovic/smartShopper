// frontend/src/screens/AddProductsScreen.tsx (formerly OnboardingWatchlistScreen.tsx)
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { User } from 'firebase/auth';
import { onboardingProductCategories, ProductCategory, ProductVariant } from '../data/onboardingProducts';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AddProductsScreenProps { // Renamed interface
firebaseUser: User;
API_BASE_URL: string;
// Removed onWatchlistPopulated prop
}

const AddProductsScreen: React.FC<AddProductsScreenProps> = ({ // Renamed component
firebaseUser,
API_BASE_URL,
}) => {
const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: boolean }>({});
const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
const [userWatchlist, setUserWatchlist] = useState<WatchlistItem[]>([]);

// Fetch user's watchlist (now accessible everywhere in the component)
const fetchWatchlist = async () => {
  if (!firebaseUser) return;
  try {
    const idToken = await firebaseUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/watchlist/${firebaseUser.uid}`, {
      headers: { 'Authorization': `Bearer ${idToken}` },
    });
    if (response.ok) {
      const data = await response.json();
      setUserWatchlist(data);
    }
  } catch (err) {
    // Optionally handle error
  }
};

useEffect(() => {
  fetchWatchlist();
}, [firebaseUser, API_BASE_URL]);

const handleToggleVariant = (name: string) => {
  setSelectedVariants((prev) => ({
    ...prev,
    [name]: !prev[name],
  }));
};

const handleToggleCategoryExpand = (categoryName: string) => {
  LayoutAnimation.easeInEaseOut();
  setExpandedCategory((prev) => (prev === categoryName ? null : categoryName));
};

const handleAddSelectedToWatchlist = async () => {
  const productsToAdd = Object.keys(selectedVariants).filter(name => selectedVariants[name]);

  if (productsToAdd.length === 0) {
    Alert.alert('No Selection', 'Please select at least one product to add to your watchlist.');
    return;
  }

  setLoading(true);
  try {
    const idToken = await firebaseUser.getIdToken();
    const addPromises = productsToAdd.map(async (productName) => {
      let productCategory = 'Uncategorized';

      for (const category of onboardingProductCategories) {
        const foundVariant = category.variants.find(variant => variant.name === productName);
        if (foundVariant) {
          productCategory = category.llmCategory;
          break;
        }
      }

      const response = await fetch(`${API_BASE_URL}/watchlist/${firebaseUser.uid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          productName,
          productCategory,
          displayImageUrl: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle 409 Conflict if you implemented it based on productName/productCategory
        if (response.status === 409) {
          return { success: false, message: `"${productName}" is already in your watchlist.` };
        }
        throw new Error(`Failed to add ${productName}: ${errorData.message || response.statusText}`);
      }
      fetchWatchlist(); // Refresh watchlist after adding
      return { success: true, message: `"${productName}" added.` };
    });

    const results = await Promise.all(addPromises);
    const successfulAdds = results.filter(r => r.success).length;
    const failedAdds = results.filter(r => !r.success);

    if (successfulAdds > 0) {
      Alert.alert('Success', `${successfulAdds} product(s) added to your watchlist!`);
      setSelectedVariants({}); // Clear selections after successful add
      setExpandedCategory(null); // Collapse categories
    }
    if (failedAdds.length > 0) {
      const errorMessages = failedAdds.map(r => r.message).join('\n');
      Alert.alert('Partial Success/Error', `Some products could not be added:\n${errorMessages}`);
    }
  } catch (error: any) {
    console.error('Error adding products to watchlist:', error);
    Alert.alert('Error', `Failed to add products: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// Helper to check if variant is already in watchlist
const isVariantInWatchlist = (variantName: string, category: ProductCategory) =>
    userWatchlist.some(
      item =>
        item.productName === variantName &&
        item.productCategory === category.llmCategory
    );

return (
  <ScrollView style={styles.container}>
    <Text style={styles.header}>Add Products to Watchlist</Text> {/* Updated header */}
    <Text style={styles.subheader}>Select products from categories below:</Text> {/* Updated subheader */}

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
            {category.variants.map((variant) => {
              const disabled = isVariantInWatchlist(variant.name, category);
              return (
                <TouchableOpacity
                  key={variant.name}
                  style={[
                    styles.variantButton,
                    selectedVariants[variant.name] && styles.variantButtonSelected,
                    disabled && styles.variantButtonDisabled,
                  ]}
                  onPress={() => !disabled && handleToggleVariant(variant.name)}
                  disabled={disabled}
                >
                  <Text style={[
                    styles.variantButtonText,
                    disabled && { color: '#aaa' }
                  ]}>
                    {variant.name}
                    {disabled && ' (Already added)'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    ))}

    <Button
      title={loading ? 'Adding to Watchlist...' : 'Add Selected Products'}
      onPress={handleAddSelectedToWatchlist}
      disabled={loading || Object.keys(selectedVariants).filter(name => selectedVariants[name]).length === 0}
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
variantButtonDisabled: {
  opacity: 0.5,
  backgroundColor: '#eee',
  borderColor: '#ddd',
},
variantButtonText: {
  fontSize: 14,
  color: '#333',
},
});

export default AddProductsScreen; // Renamed export