// frontend/src/services/apiService.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api'; // Or your computer's IP for physical device

// Update fetchDeals to accept selectedDealerIds
export const fetchDeals = async (selectedProducts: string[], selectedDealerIds: string[]) => {
try {
  const response = await axios.post(`${API_BASE_URL}/find-deals`, {
    selectedProducts,
    selectedDealerIds, // Pass the new parameter
  });
  return response.data;
} catch (error: any) {
  console.error('API call failed:', error.response?.data || error.message);
  throw new Error(error.response?.data?.error || 'Network error. Could not connect to backend.');
}
};