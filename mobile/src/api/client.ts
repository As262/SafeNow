// API client for SafeNow Django Backend - React Native Version
// Connects to the Django REST API with AsyncStorage for token management

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { APIResponse } from '../types';

// Determine API URL based on platform and environment
const getApiBaseUrl = () => {
  // If explicitly set in app.json, use that
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }

  // Development defaults by platform
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Use actual network IP for Android emulator (better than 10.0.2.2 for WebSockets)
      return 'http://10.49.250.225:8000/api';
    } else if (Platform.OS === 'ios') {
      // iOS simulator uses localhost
      return 'http://localhost:8000/api';
    }
  }

  // Production fallback (should be set via app.json extra.apiUrl)
  return 'http://10.49.250.225:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Helper to get stored auth token from AsyncStorage
 */
const getToken = async (): Promise<string | null> => {
  try {
    const userData = await AsyncStorage.getItem('safeNowUser');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.token || null;
    }
  } catch (error) {
    console.error('Error getting token:', error);
  }
  return null;
};

/**
 * Helper for making authenticated API requests
 */
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = await getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      timeout: 30000, // 30 second timeout
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Server error (${response.status})`);
    }

    if (!response.ok) {
      // DRF returns errors in various formats
      const errMsg =
        data.message ||
        data.detail ||
        (typeof data === 'object'
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join('; ')
          : 'Request failed');
      throw new Error(errMsg);
    }

    return data;
  } catch (error) {
    // Better error handling for network issues
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error(
        'Cannot connect to server. Please ensure:\n' +
        '1. Backend server is running (python manage.py runserver)\n' +
        '2. Your device can reach the API at: ' + API_BASE_URL
      );
    }
    throw error;
  }
};

/**
 * Send OTP to mobile number
 */
export const sendOTP = async (mobile: string): Promise<APIResponse> => {
  return apiRequest('/auth/send-otp/', {
    method: 'POST',
    body: JSON.stringify({ mobile }),
  });
};

/**
 * Verify OTP
 */
export const verifyOTP = async (mobile: string, otp: string): Promise<APIResponse> => {
  return apiRequest('/auth/verify-otp/', {
    method: 'POST',
    body: JSON.stringify({ mobile, otp }),
  });
};

/**
 * Service Provider Login
 */
export const serviceLogin = async (serviceId: string, password: string): Promise<APIResponse> => {
  return apiRequest('/auth/service-login/', {
    method: 'POST',
    body: JSON.stringify({ service_id: serviceId, password }),
  });
};

/**
 * Get user profile
 */
export const getUserProfile = async (): Promise<APIResponse> => {
  return apiRequest('/auth/profile/');
};

/**
 * Update user profile
 */
export const updateUserProfile = async (data: { name?: string; email?: string }): Promise<APIResponse> => {
  return apiRequest('/auth/profile/update/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const getEmergencyContacts = async (): Promise<APIResponse> => {
  return apiRequest('/auth/emergency-contacts/');
};

export const addEmergencyContact = async (data: {
  name: string;
  phone_number: string;
  relationship: string;
}): Promise<APIResponse> => {
  return apiRequest('/auth/emergency-contacts/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateEmergencyContact = async (
  id: number,
  data: { name: string; phone_number: string; relationship: string }
): Promise<APIResponse> => {
  return apiRequest(`/auth/emergency-contacts/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteEmergencyContact = async (id: number): Promise<APIResponse> => {
  return apiRequest(`/auth/emergency-contacts/${id}/`, {
    method: 'DELETE',
  });
};

/**
 * Submit SOS request
 */
export const submitSOSRequest = async (requestData: {
  type: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
}): Promise<APIResponse> => {
  return apiRequest('/sos/request/', {
    method: 'POST',
    body: JSON.stringify({
      type: requestData.type,
      latitude: parseFloat(requestData.location.latitude.toFixed(6)),
      longitude: parseFloat(requestData.location.longitude.toFixed(6)),
      accuracy: requestData.location.accuracy || null,
      address: requestData.location.address || '',
    }),
  });
};

/**
 * Get user's request history
 */
export const getUserRequests = async (): Promise<APIResponse> => {
  return apiRequest('/sos/user-requests/');
};

/**
 * Get all SOS requests (Admin/Service Provider)
 */
export const getAllSOSRequests = async (): Promise<APIResponse> => {
  return apiRequest('/sos/all-requests/');
};

/**
 * Update request status (Service Provider)
 */
export const updateRequestStatus = async (requestId: string | number, status: string): Promise<APIResponse> => {
  return apiRequest(`/sos/request/${requestId}/status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

/**
 * Get analytics data (Admin only)
 */
export const getAnalytics = async (): Promise<APIResponse> => {
  return apiRequest('/analytics/');
};

/**
 * Send message to AI Safety Chatbot
 */
export const sendChatbotMessage = async (message: string, sessionId?: string): Promise<APIResponse> => {
  return apiRequest('/sos/chatbot/', {
    method: 'POST',
    body: JSON.stringify({ message, session_id: sessionId }),
  });
};

/**
 * Logout
 */
export const logoutUser = async (): Promise<void> => {
  try {
    const userData = await AsyncStorage.getItem('safeNowUser');
    let refresh = null;
    if (userData) {
      const parsed = JSON.parse(userData);
      refresh = parsed.refresh;
    }

    await apiRequest('/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    });
  } catch (error) {
    // Logout locally even if API fails
    console.error('Logout API error:', error);
  }
};

/**
 * Toggle helper mode
 */
export const toggleHelperMode = async (
  isHelper: boolean,
  helperSkills: string = '',
  helperRadiusKm: number = 5
): Promise<APIResponse> => {
  return apiRequest('/auth/helper/toggle/', {
    method: 'POST',
    body: JSON.stringify({
      is_helper: isHelper,
      helper_skills: helperSkills,
      helper_radius_km: helperRadiusKm,
    }),
  });
};

/**
 * Toggle helper availability
 */
export const toggleHelperAvailability = async (available: boolean): Promise<APIResponse> => {
  return apiRequest('/auth/helper/availability/', {
    method: 'POST',
    body: JSON.stringify({ available }),
  });
};

/**
 * Get all SOS requests for helpers
 */
export const getHelperRequests = async (latitude?: number, longitude?: number): Promise<APIResponse> => {
  let url = '/sos/helper/requests/';
  if (latitude && longitude) {
    url += `?latitude=${latitude}&longitude=${longitude}`;
  }
  return apiRequest(url, { method: 'GET' });
};

/**
 * Get points balance and stats
 */
export const getPointsBalance = async (): Promise<APIResponse> => {
  return apiRequest('/auth/points/balance/');
};

/**
 * Get points transaction history
 */
export const getPointsTransactions = async (): Promise<APIResponse> => {
  return apiRequest('/auth/points/transactions/');
};

/**
 * Withdraw points
 */
export const withdrawPoints = async (amount: number): Promise<APIResponse> => {
  return apiRequest('/auth/points/withdraw/', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
};

/**
 * Respond to an SOS request as a helper
 */
export const helperRespondToRequest = async (requestId: string | number, action: string): Promise<APIResponse> => {
  return apiRequest(`/sos/helper/request/${requestId}/respond/`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
};

/**
 * Get all service providers (Admin only)
 */
export const getServiceProviders = async (role?: string): Promise<APIResponse> => {
  let url = '/auth/service-providers/';
  if (role) {
    url += `?role=${role}`;
  }
  return apiRequest(url, { method: 'GET' });
};

/**
 * Confirm help received (requesting user marks their own SOS as complete)
 */
export const confirmRequestComplete = async (requestId: string | number): Promise<APIResponse> => {
  return apiRequest(`/sos/request/${requestId}/confirm-complete/`, {
    method: 'POST',
  });
};

export default {
  sendOTP,
  verifyOTP,
  serviceLogin,
  getUserProfile,
  updateUserProfile,
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  submitSOSRequest,
  getUserRequests,
  getAllSOSRequests,
  updateRequestStatus,
  getAnalytics,
  sendChatbotMessage,
  logoutUser,
  toggleHelperMode,
  toggleHelperAvailability,
  getHelperRequests,
  getPointsBalance,
  getPointsTransactions,
  withdrawPoints,
  helperRespondToRequest,
  getServiceProviders,
  confirmRequestComplete,
};
