import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert,
  RefreshControl 
} from 'react-native';
import { colors } from '../styles/colors';
import { User } from 'firebase/auth';
import {
  getShoppingCart,
  removeFromShoppingCart,
  clearShoppingCart,
  getShoppingCartByStore,
  ShoppingCartItem,
  ShoppingCartResponse,
  ShoppingCartByStore
} from '../services/shoppingCartService';

interface ShoppingCartScreenProps {
  firebaseUser: User | null;
  API_BASE_URL: string;
}

type ViewMode = 'list' | 'store';

const ShoppingCartScreen: React.FC<ShoppingCartScreenProps> = ({ firebaseUser, API_BASE_URL }) => {
  const [cartData, setCartData] = useState<ShoppingCartResponse | null>(null);
  const [cartByStore, setCartByStore] = useState<ShoppingCartByStore | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to calculate days until expiry display text
  const getExpiryDisplayText = (daysUntilExpiry: number | null): string => {
    if (daysUntilExpiry === null) return '';
    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry === 0) return 'Expires today';
    if (daysUntilExpiry === 1) return 'Expires in 1 day';
    return `Expires in ${daysUntilExpiry} days`;
  };

  // Fetch cart data
  const fetchCartData = useCallback(async () => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      if (viewMode === 'list') {
        const data = await getShoppingCart(firebaseUser, API_BASE_URL);
        setCartData(data);
      } else {
        const data = await getShoppingCartByStore(firebaseUser, API_BASE_URL);
        setCartByStore(data);
      }
    } catch (err: any) {
      console.error('Error fetching cart data:', err);
      setError(err.message || 'Failed to load shopping cart');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [firebaseUser, API_BASE_URL, viewMode]);

  useEffect(() => {
    setLoading(true);
    fetchCartData();
  }, [fetchCartData]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCartData();
  }, [fetchCartData]);

  // Handle remove item
  const handleRemoveItem = async (cartItemId: string, productName: string) => {
    if (!firebaseUser) return;

    Alert.alert(
      'Remove Item',
      `Remove "${productName}" from your shopping cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromShoppingCart(firebaseUser, API_BASE_URL, cartItemId);
              fetchCartData(); // Refresh cart
              Alert.alert('Success', 'Item removed from cart');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove item');
            }
          }
        }
      ]
    );
  };

  // Handle clear cart
  const handleClearCart = async () => {
    if (!firebaseUser) return;

    Alert.alert(
      'Clear Cart',
      'Remove all items from your shopping cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearShoppingCart(firebaseUser, API_BASE_URL);
              fetchCartData(); // Refresh cart
              Alert.alert('Success', 'Shopping cart cleared');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to clear cart');
            }
          }
        }
      ]
    );
  };

  // Render cart item
  const renderCartItem = (item: ShoppingCartItem) => (
    <View key={item.cartItemId} style={styles.cartItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.productName}>{item.productName}</Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.cartItemId, item.productName)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.itemContent}>
        <View style={styles.itemInfo}>
          <Text style={styles.storeName}>{item.dealer.name}</Text>
          <Text style={styles.price}>{`${item.price.current.toFixed(2)} ${item.price.currency}`}</Text>
          {item.price.original ? (
            <Text style={styles.originalPrice}>
              {`Was: ${item.price.original.toFixed(2)} ${item.price.currency}`}
            </Text>
          ) : null}
          {item.discountAmount && item.discountAmount > 0 ? (
            <Text style={styles.savings}>
              {`Save: ${item.discountAmount.toFixed(2)} ${item.price.currency}`}
            </Text>
          ) : null}
          {item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined ? (
            <Text style={[
              styles.expiry,
              item.isExpiringSoon ? styles.expiryUrgent : {},
              item.daysUntilExpiry < 0 ? styles.expiryExpired : {}
            ]}>
              {getExpiryDisplayText(item.daysUntilExpiry)}
            </Text>
          ) : null}
        </View>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        ) : null}
      </View>
    </View>
  );

  if (!firebaseUser) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Please log in to view your shopping cart</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your shopping cart...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCartData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isEmpty = viewMode === 'list' 
    ? !cartData || cartData.items.length === 0
    : !cartByStore || Object.keys(cartByStore).length === 0;

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Your shopping cart is empty</Text>
          <Text style={styles.emptySubtext}>Add some deals to start shopping!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' ? styles.viewModeButtonActive : {}]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.viewModeButtonText, viewMode === 'list' ? styles.viewModeButtonTextActive : {}]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'store' ? styles.viewModeButtonActive : {}]}
            onPress={() => setViewMode('store')}
          >
            <Text style={[styles.viewModeButtonText, viewMode === 'store' ? styles.viewModeButtonTextActive : {}]}>
              By Store
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary */}
      {viewMode === 'list' && cartData && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Cart Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items:</Text>
            <Text style={styles.summaryValue}>{cartData.summary.totalItems}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={styles.summaryValue}>{`${cartData.summary.totalCurrentPrice} DKK`}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Savings:</Text>
            {parseFloat(cartData.summary.totalSavings) > 0 ? (
              <Text style={styles.summarySavings}>{`${cartData.summary.totalSavings} DKK`}</Text>
            ) : (
              <View style={styles.summaryNoSavingsContainer}>
                <Text style={styles.summaryNoSavings}>0.00 DKK</Text>
                <Text style={styles.summaryHelp}>
                  {cartData.summary.itemsWithOriginalPrice === 0 
                    ? "Items show promotional prices only"
                    : `${cartData.summary.itemsWithSavings}/${cartData.summary.totalItems} items have savings`
                  }
                </Text>
              </View>
            )}
          </View>
          {cartData.summary.expiringSoon > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryUrgent}>
                ⚠️ {cartData.summary.expiringSoon} item(s) expiring soon!
              </Text>
            </View>
          ) : null}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {viewMode === 'list' && cartData ? (
          <View style={styles.itemsList}>
            {cartData.items.map(renderCartItem)}
          </View>
        ) : (
          cartByStore ? Object.entries(cartByStore).map(([storeName, storeData]) => (
            <View key={storeName} style={styles.storeGroup}>
              <View style={styles.storeHeader}>
                <Text style={styles.storeTitle}>{storeName}</Text>
                <Text style={styles.storeInfo}>
                  {`${storeData.storeTotalItems} items • ${storeData.storeTotalPrice} DKK`}
                </Text>
              </View>
              {storeData.items.map(renderCartItem)}
            </View>
          )) : null
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearCart}
        >
          <Text style={styles.clearButtonText}>Clear Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shopButton}
        >
          <Text style={styles.shopButtonText}>Go Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.border,
    marginLeft: 8,
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
  },
  viewModeButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  viewModeButtonTextActive: {
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  summary: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.text.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  summarySavings: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  summaryUrgent: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  itemsList: {
    padding: 16,
  },
  storeGroup: {
    marginBottom: 24,
  },
  storeHeader: {
    backgroundColor: colors.surface,
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  storeInfo: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  cartItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.error,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  storeName: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 2,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  savings: {
    fontSize: 14,
    color: colors.success,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  expiry: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  expiryUrgent: {
    color: colors.warning,
    fontWeight: 'bold',
  },
  expiryExpired: {
    color: colors.error,
    fontWeight: 'bold',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shopButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shopButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 18,
    color: colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  summaryNoSavings: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  summaryNoSavingsContainer: {
    alignItems: 'flex-end',
  },
  summaryHelp: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default ShoppingCartScreen;
