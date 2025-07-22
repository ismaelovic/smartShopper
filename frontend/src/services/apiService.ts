// frontend/src/services/apiService.ts (NEW)
import { User } from 'firebase/auth'; // Import User type from Firebase Auth

// This function now needs the firebaseUser object and the API_BASE_URL
export const fetchDeals = async (
products: string[],
dealerIds: string[],
firebaseUser: User | null, // Accept the Firebase User object
apiBaseUrl: string // Accept the API Base URL
) => {
if (!firebaseUser) {
  throw new Error('User not authenticated. Cannot fetch deals.');
}

try {
  // Get the ID token from the authenticated Firebase user
  const idToken = await firebaseUser.getIdToken();
  console.log('Fetching deals with ID token:', idToken.substring(0, 20) + '...'); // Log first 20 chars
  console.log('API Base URL:', apiBaseUrl);
  console.log(JSON.stringify({ products, dealerIds }, null, 2)); // Log request payload
  const response = await fetch(`${apiBaseUrl}/api/find-deals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${idToken}`, // Attach the Firebase ID token
    },
    body: JSON.stringify({   
      selectedProducts: products,
      selectedDealerIds: dealerIds 
    })
  });
  console.log('Response status:', response);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch deals');
  }

  return await response.json();
} catch (error) {
  console.error('Error in fetchDeals:', error);
  throw error;
}
};