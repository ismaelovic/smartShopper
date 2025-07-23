import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

interface ProductSelectionProps {
products: string[];
selectedProducts: string[];
onProductToggle: (product: string) => void;
}

const ProductSelection: React.FC<ProductSelectionProps> = ({
products,
selectedProducts,
onProductToggle,
}) => {
return (
  <View style={styles.container}>
    {products.map((product) => {
      const isSelected = selectedProducts.includes(product);
      return (
        <TouchableOpacity
          key={product}
          style={[styles.productButton, isSelected ? styles.selectedButton : styles.unselectedButton]}
          onPress={() => onProductToggle(product)}
        >
          <Text style={[styles.buttonText, isSelected ? styles.selectedText : styles.unselectedText]}>
            {product}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);
};

const styles = StyleSheet.create({
container: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginBottom: 10,
},
productButton: {
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderRadius: 20,
  borderWidth: 1,
  margin: 5,
},
selectedButton: {
  backgroundColor: colors.primary, // Green for products (fresh products)
  borderColor: colors.primaryDark,
},
unselectedButton: {
  backgroundColor: colors.surface,
  borderColor: colors.border,
},
buttonText: {
  fontSize: 14,
},
selectedText: {
  color: colors.text.inverse,
  fontWeight: 'bold',
},
unselectedText: {
  color: colors.text.primary,
},
});

export default ProductSelection;