// API client for SafeNow Django Backend
// Connects to the Django REST API

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Helper to get stored auth token
 */
const getToken = () => {
  const userData = sessionStorage.getItem("safeNowUser");
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      return parsed.token;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Helper for making authenticated API requests
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
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
      (typeof data === "object"
        ? Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("; ")
        : "Request failed");
    throw new Error(errMsg);
  }

  return data;
};

/**
 * Send OTP to mobile number
 * @param {string} mobile - Mobile number (10 digits)
 * @returns {Promise} - Success response
 */
export const sendOTP = async (mobile) => {
  return apiRequest("/auth/send-otp/", {
    method: "POST",
    body: JSON.stringify({ mobile }),
  });
};

/**
 * Verify OTP
 * @param {string} mobile - Mobile number
 * @param {string} otp - OTP to verify
 * @returns {Promise} - User data + token if successful
 */
export const verifyOTP = async (mobile, otp) => {
  return apiRequest("/auth/verify-otp/", {
    method: "POST",
    body: JSON.stringify({ mobile, otp }),
  });
};

/**
 * Get user profile
 * @returns {Promise} - User profile
 */
export const getUserProfile = async () => {
  return apiRequest("/auth/profile/");
};

/**
 * Update user profile
 * @param {Object} data - { name, email }
 * @returns {Promise}
 */
export const updateUserProfile = async (data) => {
  return apiRequest("/auth/profile/update/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

/**
 * Submit SOS request
 * @param {Object} requestData - SOS request data
 * @returns {Promise} - Request confirmation
 */
export const submitSOSRequest = async (requestData) => {
  return apiRequest("/sos/request/", {
    method: "POST",
    body: JSON.stringify({
      type: requestData.type,
      latitude: parseFloat(requestData.location.latitude.toFixed(6)),
      longitude: parseFloat(requestData.location.longitude.toFixed(6)),
      accuracy: requestData.location.accuracy || null,
      address: requestData.location.address || "",
    }),
  });
};

/**
 * Get user's request history
 * @returns {Promise} - List of requests
 */
export const getUserRequests = async () => {
  return apiRequest("/sos/user-requests/");
};

/**
 * Get all SOS requests (Admin only)
 * @returns {Promise} - List of all requests
 */
export const getAllSOSRequests = async () => {
  return apiRequest("/sos/all-requests/");
};

/**
 * Update request status (Admin only)
 * @param {string} requestId - Request ID (UUID)
 * @param {string} status - New status (accepted/rejected/completed)
 * @returns {Promise} - Update confirmation
 */
export const updateRequestStatus = async (requestId, status) => {
  return apiRequest(`/sos/request/${requestId}/status/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};

/**
 * Get analytics data (Admin only)
 * @returns {Promise} - Analytics data
 */
export const getAnalytics = async () => {
  return apiRequest("/analytics/");
};

/**
 * Logout
 * @returns {Promise}
 */
export const logoutUser = async () => {
  const userData = sessionStorage.getItem("safeNowUser");
  let refresh = null;
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      refresh = parsed.refresh;
    } catch {
      // ignore
    }
  }

  try {
    await apiRequest("/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    });
  } catch {
    // Logout even if API fails
  }
};

export default {
  sendOTP,
  verifyOTP,
  getUserProfile,
  updateUserProfile,
  submitSOSRequest,
  getUserRequests,
  getAllSOSRequests,
  updateRequestStatus,
  getAnalytics,
  logoutUser,
};
