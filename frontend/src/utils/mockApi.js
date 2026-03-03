// Mock API for SafeNow - Simulates backend responses
// In production, replace with actual API calls

// Simulated delay for realistic API behavior
const delay = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock user database
const mockUsers = {
  9876543210: {
    mobile: "9876543210",
    name: "Admin User",
    role: "admin",
    email: "admin@safenow.com",
  },
  9123456789: {
    mobile: "9123456789",
    name: "Priya Sharma",
    role: "user",
    email: "priya@example.com",
  },
  9988776655: {
    mobile: "9988776655",
    name: "Rahul Kumar",
    role: "user",
    email: "rahul@example.com",
  },
};

// Mock OTP storage (in production, handled by backend)
let otpStore = {};
let userRegistrations = {}; // Store user data during registration

/**
 * Send OTP to mobile number
 * @param {string} mobile - Mobile number
 * @param {string} name - User's name (optional for new users)
 * @returns {Promise} - Success response
 */
export const sendOTP = async (mobile, name = null) => {
  await delay(800);

  if (!mobile || mobile.length !== 10) {
    throw new Error("Invalid mobile number. Must be 10 digits.");
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[mobile] = otp;

  // Store name if provided (for new user registration)
  if (name) {
    userRegistrations[mobile] = { name };
  }

  // For demo purposes, log OTP to console
  console.log(`📱 OTP for ${mobile}: ${otp}`);

  return {
    success: true,
    message: "OTP sent successfully",
    // In production, don't send OTP in response!
    // Including here for demo purposes only
    otp: otp,
  };
};

/**
 * Verify OTP
 * @param {string} mobile - Mobile number
 * @param {string} otp - OTP to verify
 * @param {string} name - User's name (for new users)
 * @returns {Promise} - User data if successful
 */
export const verifyOTP = async (mobile, otp, name = null) => {
  await delay(600);

  if (!otpStore[mobile]) {
    throw new Error("No OTP sent to this number. Please request OTP first.");
  }

  if (otpStore[mobile] !== otp) {
    throw new Error("Invalid OTP. Please try again.");
  }

  // Clear OTP after successful verification
  delete otpStore[mobile];

  // Return user data or create new user
  let user = mockUsers[mobile];
  
  if (!user) {
    // New user - use provided name or registration data
    const userName = name || userRegistrations[mobile]?.name || "New User";
    user = {
      mobile,
      name: userName,
      role: "user",
      email: `${mobile}@safenow.com`,
    };
    
    // Store new user in mock database
    mockUsers[mobile] = user;
  }
  
  // Clean up registration data
  delete userRegistrations[mobile];

  return {
    success: true,
    user,
    token: `mock_token_${mobile}_${Date.now()}`,
  };
};

/**
 * Get user profile
 * @param {string} mobile - Mobile number
 * @returns {Promise} - User profile
 */
export const getUserProfile = async (mobile) => {
  await delay(400);

  const user = mockUsers[mobile];
  if (!user) {
    throw new Error("User not found");
  }

  return {
    success: true,
    user,
  };
};

/**
 * Submit SOS request
 * @param {Object} requestData - SOS request data
 * @returns {Promise} - Request confirmation
 */
export const submitSOSRequest = async (requestData) => {
  await delay(500);

  const request = {
    id: `req_${Date.now()}`,
    ...requestData,
    timestamp: new Date().toISOString(),
    status: "pending",
  };

  console.log("📍 SOS Request submitted:", request);

  return {
    success: true,
    request,
    message: "Emergency request sent successfully. Help is on the way!",
  };
};

/**
 * Get user's request history
 * @param {string} userId - User mobile number
 * @returns {Promise} - List of requests
 */
export const getUserRequests = async (userId) => {
  await delay(600);

  // Mock request history
  const mockRequests = [
    {
      id: "req_1",
      type: "Medical Help",
      location: {
        latitude: 28.6139,
        longitude: 77.209,
        address: "Connaught Place, New Delhi",
      },
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: "completed",
      respondedBy: "Dr. Kumar",
      responseTime: "8 minutes",
    },
    {
      id: "req_2",
      type: "Police",
      location: {
        latitude: 28.7041,
        longitude: 77.1025,
        address: "Rohini, Delhi",
      },
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      status: "completed",
      respondedBy: "Officer Singh",
      responseTime: "12 minutes",
    },
  ];

  return {
    success: true,
    requests: mockRequests,
  };
};

/**
 * Get all SOS requests (Admin only)
 * @returns {Promise} - List of all requests
 */
export const getAllSOSRequests = async () => {
  await delay(700);

  const mockRequests = [
    {
      id: "req_3",
      userId: "9123456789",
      userName: "Priya Sharma",
      type: "Ambulance",
      location: {
        latitude: 28.6139,
        longitude: 77.209,
        address: "Connaught Place, New Delhi",
      },
      timestamp: new Date(Date.now() - 300000).toISOString(),
      status: "pending",
    },
    {
      id: "req_4",
      userId: "9988776655",
      userName: "Anita Desai",
      type: "Police",
      location: {
        latitude: 28.7041,
        longitude: 77.1025,
        address: "Rohini, Delhi",
      },
      timestamp: new Date(Date.now() - 120000).toISOString(),
      status: "pending",
    },
  ];

  return {
    success: true,
    requests: mockRequests,
  };
};

/**
 * Update request status (Admin only)
 * @param {string} requestId - Request ID
 * @param {string} status - New status (accepted/rejected/completed)
 * @returns {Promise} - Update confirmation
 */
export const updateRequestStatus = async (requestId, status) => {
  await delay(400);

  console.log(`✅ Request ${requestId} status updated to: ${status}`);

  return {
    success: true,
    message: `Request ${status} successfully`,
    requestId,
    status,
  };
};

/**
 * Get analytics data (Admin only)
 * @returns {Promise} - Analytics data
 */
export const getAnalytics = async () => {
  await delay(800);

  return {
    success: true,
    analytics: {
      totalRequests: 1247,
      activeRequests: 8,
      completedToday: 23,
      averageResponseTime: "9.5 minutes",
      requestsByType: [
        { type: "Ambulance", count: 487 },
        { type: "Police", count: 356 },
        { type: "Medical Help", count: 234 },
        { type: "NGO", count: 170 },
      ],
      responseTimeData: [
        { time: "00:00", avgTime: 12 },
        { time: "04:00", avgTime: 8 },
        { time: "08:00", avgTime: 15 },
        { time: "12:00", avgTime: 18 },
        { time: "16:00", avgTime: 14 },
        { time: "20:00", avgTime: 11 },
      ],
    },
  };
};

export default {
  sendOTP,
  verifyOTP,
  getUserProfile,
  submitSOSRequest,
  getUserRequests,
  getAllSOSRequests,
  updateRequestStatus,
  getAnalytics,
};
