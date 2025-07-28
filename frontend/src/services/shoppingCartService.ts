// frontend/src/services/shoppingCartService.ts
import { User } from 'firebase/auth';

export interface ShoppingCartItem {
  id: string;
  cartItemId: string;
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
  addedToCartAt: string;
  daysUntilExpiry?: number | null;
  isExpiringSoon?: boolean;
}

export interface ShoppingCartSummary {
  totalItems: number;
  totalCurrentPrice: string;
  totalSavings: string;
  expiringToday: number;
  expiringSoon: number;
  itemsWithOriginalPrice: number;
  itemsWithSavings: number;
}

export interface ShoppingCartResponse {
  items: ShoppingCartItem[];
  summary: ShoppingCartSummary;
}

export interface StoreGroup {
  storeInfo: {
    id: string;
    name: string;
  };
  items: ShoppingCartItem[];
  storeTotalItems: number;
  storeTotalPrice: string;
  storeTotalSavings: string;
}

export interface ShoppingCartByStore {
  [storeName: string]: StoreGroup;
}

// Get user's shopping cart
export async function getShoppingCart(
  user: User,
  API_BASE_URL: string
): Promise<ShoppingCartResponse> {
  const idToken = await user.getIdToken();
  const response = await fetch(`${API_BASE_URL}/shopping-cart/${user.uid}`, {
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch shopping cart');
  }

  return response.json();
}

// Add item to shopping cart
export async function addToShoppingCart(
  user: User,
  API_BASE_URL: string,
  dealItem: any
): Promise<{ message: string; cartItem: ShoppingCartItem; cartItemCount: number }> {
  const idToken = await user.getIdToken();
  const response = await fetch(`${API_BASE_URL}/shopping-cart/${user.uid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(dealItem),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to add item to shopping cart');
  }

  return response.json();
}

// Remove item from shopping cart
export async function removeFromShoppingCart(
  user: User,
  API_BASE_URL: string,
  cartItemId: string
): Promise<{ message: string; cartItemCount: number }> {
  const idToken = await user.getIdToken();
  const response = await fetch(`${API_BASE_URL}/shopping-cart/${user.uid}/${cartItemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to remove item from shopping cart');
  }

  return response.json();
}

// Clear entire shopping cart
export async function clearShoppingCart(
  user: User,
  API_BASE_URL: string
): Promise<{ message: string }> {
  const idToken = await user.getIdToken();
  const response = await fetch(`${API_BASE_URL}/shopping-cart/${user.uid}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to clear shopping cart');
  }

  return response.json();
}

// Get shopping cart grouped by store
export async function getShoppingCartByStore(
  user: User,
  API_BASE_URL: string
): Promise<ShoppingCartByStore> {
  const idToken = await user.getIdToken();
  const response = await fetch(`${API_BASE_URL}/shopping-cart/${user.uid}/group-by-store`, {
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch shopping cart by store');
  }

  return response.json();
}
