import axios from 'axios';

// IMPORTANT: Replace with your backend's IP address or hostname
// If running on a physical device, this MUST be your computer's IP address on the local network.
// If running on a simulator, 'localhost' or '127.0.0.1' usually works.
// API_BASE_URL: If you're running on a physical device, localhost won't work. 
// You need to find your computer's local IP address (e.g., 192.168.1.100) and use that instead. For simulators, localhost or 127.0.0.1 usually works.
// const API_BASE_URL = 'http://10.242.170.86:3000/api'; // Or your actual IP: 'http://192.168.1.100:3000/api'
const API_BASE_URL = 'http://localhost:3000/api'

export const fetchDeals = async (zipCode: string, selectedProducts: string[]) => {
try {
  const response = await axios.post(`${API_BASE_URL}/find-deals`, {
    zipCode,
    selectedProducts,
  });
  return response.data;
} catch (error: any) {
  console.error('API call failed:', error.response?.data || error.message);
  throw new Error(error.response?.data?.error || 'Network error. Could not connect to backend.');
}
};