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
 * Service Provider Login
 * @param {string} serviceId - Service ID (e.g., HSP-001, ADM-001)
 * @param {string} password - Password
 * @returns {Promise} - User data + token if successful
 */
export const serviceLogin = async (serviceId, password) => {
  return apiRequest("/auth/service-login/", {
    method: "POST",
    body: JSON.stringify({ service_id: serviceId, password }),
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

export const getEmergencyContacts = async () => {
  return apiRequest("/auth/emergency-contacts/");
};

export const addEmergencyContact = async (data) => {
  return apiRequest("/auth/emergency-contacts/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateEmergencyContact = async (id, data) => {
  return apiRequest(`/auth/emergency-contacts/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteEmergencyContact = async (id) => {
  return apiRequest(`/auth/emergency-contacts/${id}/`, {
    method: "DELETE",
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
 * Send message to AI Safety Chatbot
 * @param {string} message - User message
 * @returns {Promise} - AI response
 */
export const sendChatbotMessage = async (message) => {
  return apiRequest("/sos/chatbot/", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
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

/**
 * Toggle helper mode
 * @param {boolean} isHelper - Enable/disable helper mode
 * @param {string} helperSkills - Helper skills
 * @param {number} helperRadiusKm - Service radius in km
 * @returns {Promise}
 */
export const toggleHelperMode = async (
  isHelper,
  helperSkills = "",
  helperRadiusKm = 5,
) => {
  return apiRequest("/auth/helper/toggle/", {
    method: "POST",
    body: JSON.stringify({
      is_helper: isHelper,
      helper_skills: helperSkills,
      helper_radius_km: helperRadiusKm,
    }),
  });
};

/**
 * Toggle helper availability
 * @param {boolean} available - Helper availability status
 * @returns {Promise}
 */
export const toggleHelperAvailability = async (available) => {
  return apiRequest("/auth/helper/availability/", {
    method: "POST",
    body: JSON.stringify({ available }),
  });
};

/**
 * Get all SOS requests for helpers
 * @param {number} latitude - Helper's current latitude
 * @param {number} longitude - Helper's current longitude
 * @returns {Promise} - List of nearby SOS requests
 */
export const getHelperRequests = async (latitude = null, longitude = null) => {
  let url = "/sos/helper/requests/";
  if (latitude && longitude) {
    url += `?latitude=${latitude}&longitude=${longitude}`;
  }
  return apiRequest(url, { method: "GET" });
};

/**
 * Get points balance and stats
 * @returns {Promise} - Points balance and statistics
 */
export const getPointsBalance = async () => {
  return apiRequest("/auth/points/balance/");
};

/**
 * Get points transaction history
 * @returns {Promise} - List of transactions
 */
export const getPointsTransactions = async () => {
  return apiRequest("/auth/points/transactions/");
};

/**
 * Withdraw points
 * @param {number} amount - Amount to withdraw
 * @returns {Promise} - Withdrawal confirmation
 */
export const withdrawPoints = async (amount) => {
  return apiRequest("/auth/points/withdraw/", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
};

/**
 * Respond to an SOS request as a helper
 * @param {string} requestId - SOS request ID
 * @param {string} action - 'accept' or 'reject'
 * @returns {Promise}
 */
export const helperRespondToRequest = async (requestId, action) => {
  return apiRequest(`/sos/helper/request/${requestId}/respond/`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
};

/**
 * Get all service providers (Admin only)
 * @param {string} role - Optional filter by role (hospital, fire, ngo, police)
 * @returns {Promise} - List of service providers
 */
export const getServiceProviders = async (role = null) => {
  let url = "/auth/service-providers/";
  if (role) {
    url += `?role=${role}`;
  }
  return apiRequest(url, { method: "GET" });
};

/**
 * Confirm help received (requesting user marks their own SOS as complete)
 * @param {string} requestId - SOS request ID
 * @returns {Promise}
 */
export const confirmRequestComplete = async (requestId) => {
  return apiRequest(`/sos/request/${requestId}/confirm-complete/`, {
    method: "POST",
  });
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
  toggleHelperMode,
  toggleHelperAvailability,
  getHelperRequests,
  helperRespondToRequest,
  confirmRequestComplete,
};
