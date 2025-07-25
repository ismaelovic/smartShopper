import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../styles/colors';

interface DealInfo {
  id: string;
  productName: string;
  productDescription: string;
  price: {
    original: number | null;
    current: number;
    currency: string;
  };
  quantity?: {
    sizeFrom: number;
    sizeTo: number;
    unit: string;
  };
  dealer: {
    id: string;
    name: string;
  };
  imageUrl?: string;
  offerValidFrom?: string;
  offerValidUntil?: string;
  productCategory?: string;
  discountAmount?: number;
  status?: string;
}

interface TrendingDealsCarouselProps {
  API_BASE_URL: string;
  firebaseUser: any;
  onSelectDeal?: (deal: DealInfo) => void;
}

const TrendingDealsCarousel: React.FC<TrendingDealsCarouselProps> = ({ 
  API_BASE_URL, 
  firebaseUser,
  onSelectDeal 
}) => {
  const [trendingDeals, setTrendingDeals] = useState<DealInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to calculate days until expiry
  const calculateDaysUntilExpiry = (expiryDate: string): string => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires in 1 day";
    return `Expires in ${diffDays} days`;
  };

  useEffect(() => {
    const fetchTrendingDeals = async () => {
      if (!firebaseUser) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch(`${API_BASE_URL}/api/deals`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch trending deals');
        }

        const deals = await response.json();
        
        // The response from /api/deals is an object with product names as keys
        // Convert the object to an array of deals
        const dealsArray = Object.entries(deals).map(([productName, dealInfo]: [string, any]) => {
          // Skip any items with status "not_found"
          if (dealInfo.status === "not_found") return null;
          
          // Create a deal object with the new nested structure
          const deal: DealInfo = {
            id: dealInfo.id || Math.random().toString(36).substr(2, 9),
            productName: dealInfo.productName || productName,
            productDescription: dealInfo.productDescription || productName,
            price: {
              original: dealInfo.price?.original || null,
              current: dealInfo.price?.current || dealInfo.currentPrice,
              currency: dealInfo.price?.currency || "DKK"
            },
            quantity: dealInfo.quantity ? {
              sizeFrom: dealInfo.quantity.sizeFrom,
              sizeTo: dealInfo.quantity.sizeTo,
              unit: dealInfo.quantity.unit
            } : undefined,
            dealer: {
              id: dealInfo.dealer?.id || dealInfo.dealerId || '',
              name: dealInfo.dealer?.name || dealInfo.dealerName || ''
            },
            imageUrl: dealInfo.imageUrl,
            offerValidFrom: dealInfo.offerValidFrom,
            offerValidUntil: dealInfo.offerValidUntil || dealInfo.runTill,
            productCategory: dealInfo.productCategory,
            discountAmount: dealInfo.discountAmount
          };
          
          return deal;
        }).filter((deal): deal is DealInfo => deal !== null); // Remove null entries and fix type
        
        // Sort by highest discount amount (monetary value)
        const sortedDeals = dealsArray.sort((a: DealInfo, b: DealInfo) => 
          (b.discountAmount || 0) - (a.discountAmount || 0)
        );
        
        setTrendingDeals(sortedDeals);
      } catch (err) {
        console.error('Error fetching trending deals:', err);
        setError('Failed to load trending deals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingDeals();
  }, [API_BASE_URL, firebaseUser]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (trendingDeals.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Trending Deals</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No trending deals available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Trending Deals</Text>
      <Text style={styles.subtitle}>Highest savings around you</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {trendingDeals.map((deal) => (
          <TouchableOpacity 
            key={deal.id} 
            style={styles.dealCard}
            onPress={() => onSelectDeal && onSelectDeal(deal)}
          >
            <View style={styles.imageContainer}>
              <Image 
                source={{ 
                  uri: deal.imageUrl || 'https://via.placeholder.com/150'
                }}
                style={styles.dealImage}
                resizeMode="cover"
              />
              {deal.discountAmount && deal.discountAmount > 0 && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>-{deal.discountAmount.toFixed(2)} {deal.price.currency}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.dealInfo}>
              <Text style={styles.storeName}>{deal.dealer?.name}</Text>
              <Text style={styles.productName} numberOfLines={2}>
                {deal.productName || deal.productDescription}
              </Text>
              
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{deal.price.current.toFixed(2)} {deal.price.currency}</Text>
                {deal.price.original && (
                  <Text style={styles.originalPrice}>{deal.price.original.toFixed(2)} {deal.price.currency}</Text>
                )}
              </View>

              {deal.offerValidUntil && (
                <Text style={[styles.expiryText, 
                  calculateDaysUntilExpiry(deal.offerValidUntil).includes('Expired') && styles.expiredText
                ]}>
                  {calculateDaysUntilExpiry(deal.offerValidUntil)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 4,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    marginLeft: 16,
    marginBottom: 12,
    color: colors.text.secondary,
  },
  scrollView: {
    paddingLeft: 16,
  },
  scrollViewContent: {
    paddingRight: 16,
  },
  dealCard: {
    width: 180,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  dealImage: {
    width: '100%',
    height: 140,
  },
  savingsBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dealInfo: {
    padding: 12,
  },
  storeName: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text.primary,
    height: 40, // Limit to 2 lines
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  expiryText: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  expiredText: {
    color: colors.error,
    fontWeight: 'bold',
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
  },
  emptyContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
});

export default TrendingDealsCarousel;
