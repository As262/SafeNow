import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  LogOut,
  User,
  MapPin,
  Phone,
  Shield,
  Ambulance,
  Users,
  AlertTriangle,
  Settings as SettingsIcon,
  Mail,
  Edit2,
  Save,
  X,
  Globe,
  Moon,
  Sun,
  Bell,
  Lock,
  Eye,
  EyeOff,
  BarChart3,
  Volume2,
  VolumeX,
  Navigation,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../utils/translations";
import {
  submitSOSRequest,
  getUserRequests,
  updateUserProfile,
} from "../utils/api";
import Sidebar from "./Sidebar";
import SafetyChatbot from "./SafetyChatbot";
import EmergencyContacts from "./EmergencyContacts";
import MapView from "./MapView";

const requestTypes = [
  { id: "ambulance", label: "Ambulance", icon: Ambulance, color: "bg-red-600" },
  { id: "police", label: "Police", icon: Shield, color: "bg-blue-600" },
  {
    id: "fire",
    label: "Fire Emergency",
    icon: AlertTriangle,
    color: "bg-orange-600",
  },
  {
    id: "medical",
    label: "Medical Help",
    icon: AlertCircle,
    color: "bg-green-600",
  },
  { id: "ngo", label: "NGO Support", icon: Users, color: "bg-purple-600" },
];

const UserDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const locationHook = useLocation();
  const { language, changeLanguage } = useLanguage();
  const t = translations[language]; // Translation object
  const {
    location,
    error: locationError,
    loading: locationLoading,
    getLocation,
  } = useGeolocation();

  const [selectedType, setSelectedType] = useState("ambulance");
  const [sosActive, setSosActive] = useState(false);
  const [requestHistory, setRequestHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const submittingRef = useRef(false);

  // Settings states
  const [theme, setTheme] = useState(
    () => localStorage.getItem("appTheme") || "dark",
  );
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email || "",
    mobile: user.mobile,
  });
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("notificationSettings");
    return saved
      ? JSON.parse(saved)
      : {
          push: true,
          email: true,
          sms: true,
        };
  });
  const [privacy, setPrivacy] = useState(() => {
    const saved = localStorage.getItem("privacySettings");
    return saved
      ? JSON.parse(saved)
      : {
          shareLocation: true,
          dataAnalytics: true,
        };
  });
  const [appPreferences, setAppPreferences] = useState(() => {
    const saved = localStorage.getItem("appPreferences");
    return saved
      ? JSON.parse(saved)
      : {
          soundEffects: true,
          autoLocation: true,
        };
  });

  // Get active section from URL hash
  const activeSection = locationHook.hash.replace("#", "") || "dashboard";

  useEffect(() => {
    loadRequestHistory();
    // Get location on component mount so it's ready when needed
    getLocation();
  }, []);

  // Watch for location updates when sending request
  useEffect(() => {
    if (sendingRequest && location && !submittingRef.current) {
      sendSOSRequest();
    }
  }, [location, sendingRequest]);

  // Handle location errors while sending
  useEffect(() => {
    if (sendingRequest && locationError) {
      alert(
        `Location error: ${locationError}. Please enable location access and try again.`,
      );
      setLoading(false);
      setSendingRequest(false);
    }
  }, [locationError, sendingRequest]);

  const loadRequestHistory = async () => {
    try {
      const response = await getUserRequests();
      setRequestHistory(response.requests);
    } catch (error) {
      console.error("Error loading request history:", error);
    }
  };

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem("appTheme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("notificationSettings", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("privacySettings", JSON.stringify(privacy));
  }, [privacy]);

  useEffect(() => {
    localStorage.setItem("appPreferences", JSON.stringify(appPreferences));
  }, [appPreferences]);

  // Calculate statistics
  const statistics = {
    total: requestHistory.length,
    pending: requestHistory.filter((r) => r.status === "pending").length,
    completed: requestHistory.filter((r) => r.status === "completed").length,
    rejected: requestHistory.filter((r) => r.status === "rejected").length,
  };

  // Settings handlers
  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  const handleProfileEdit = () => {
    setEditingProfile(true);
  };

  const handleProfileCancel = () => {
    setEditingProfile(false);
    setProfileData({
      name: user.name,
      email: user.email || "",
      mobile: user.mobile,
    });
  };

  const handleProfileSave = async () => {
    try {
      const dataToUpdate = {};
      if (profileData.name !== user.name) dataToUpdate.name = profileData.name;
      if (profileData.email !== user.email)
        dataToUpdate.email = profileData.email;

      if (Object.keys(dataToUpdate).length > 0) {
        const response = await updateUserProfile(dataToUpdate);
        updateUser(response.user);
      }

      setEditingProfile(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.message || "Failed to update profile");
    }
  };

  const handleNotificationToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrivacyToggle = (key) => {
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAppPreferenceToggle = (key) => {
    setAppPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSOSClick = () => {
    if (submittingRef.current || sosActive || sendingRequest) return;

    // Start the sending process
    setSendingRequest(true);
    setLoading(true);

    // Get location if not already available
    if (!location) {
      getLocation();
    } else {
      // Location already available, send immediately
      sendSOSRequest();
    }
  };

  const sendSOSRequest = async () => {
    if (submittingRef.current) return;

    if (!location) {
      alert(
        "Unable to get your location. Please enable location access in your browser settings.",
      );
      setLoading(false);
      setSendingRequest(false);
      return;
    }

    submittingRef.current = true;
    setSosActive(true);

    try {
      const requestData = {
        userId: user.mobile,
        userName: user.name,
        type: requestTypes.find((t) => t.id === selectedType).label,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },
      };

      const response = await submitSOSRequest(requestData);

      setSuccessMessage(
        response.message || "SOS Alert sent successfully! Help is on the way.",
      );

      // Reload history
      loadRequestHistory();

      // Reset after 5 seconds
      setTimeout(() => {
        setSosActive(false);
        setSuccessMessage("");
      }, 5000);
    } catch (error) {
      alert("Error sending SOS: " + error.message);
      setSosActive(false);
    } finally {
      setLoading(false);
      setSendingRequest(false);
      submittingRef.current = false;
    }
  };

  // Handle SOS request triggered from chatbot
  const handleChatbotSOS = async (emergencyType) => {
    if (submittingRef.current || sosActive || sendingRequest) return;

    if (!location) {
      alert(
        "Unable to get your location. Please enable location access in your browser settings.",
      );
      return;
    }

    // Map emergency type to label
    const typeMapping = {
      ambulance: "Ambulance",
      fire: "Fire Emergency",
      ngo: "NGO Support",
      police: "Police",
      medical: "Medical Help",
    };

    const typeLabel = typeMapping[emergencyType] || "Ambulance";

    submittingRef.current = true;
    setSosActive(true);
    setSendingRequest(true);
    setLoading(true);

    try {
      const requestData = {
        userId: user.mobile,
        userName: user.name,
        type: typeLabel,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },
      };

      const response = await submitSOSRequest(requestData);

      setSuccessMessage(
        response.message || "SOS Alert sent successfully! Help is on the way.",
      );

      // Reload history
      loadRequestHistory();

      // Reset after 5 seconds
      setTimeout(() => {
        setSosActive(false);
        setSuccessMessage("");
      }, 5000);
    } catch (error) {
      alert("Error sending SOS: " + error.message);
      setSosActive(false);
    } finally {
      setLoading(false);
      setSendingRequest(false);
      submittingRef.current = false;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNavigation = (section) => {
    navigate(`/user-dashboard#${section}`);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex">
      {/* Sidebar */}
      <Sidebar onNavigate={handleNavigation} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {t.dashboard.welcome},{" "}
              <span className="text-primary-500">{user.name}</span>
            </h1>
            <p className="text-gray-400">
              {t.dashboard.subtitle}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/50 rounded-xl flex items-center gap-3 animate-pulse backdrop-blur-sm">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-green-400 font-semibold">{successMessage}</p>
            </div>
          )}

          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <>
              {/* SOS Section */}
              <div className="mb-6">
                <div className="bg-gradient-to-br from-red-600/10 via-dark-900 to-dark-900 border-2 border-red-500/20 rounded-2xl p-5 sm:p-6 text-center shadow-2xl">
                  <div className="max-w-3xl mx-auto">
                    <div className="inline-block p-2 bg-red-500/10 rounded-full mb-3">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                      {t.dashboard.emergencyAssistance}
                    </h2>
                    <p className="text-sm text-gray-400 mb-6">
                      {t.dashboard.tapForHelp}
                    </p>

                    {/* SOS Button */}
                    <div className="flex flex-col items-center mb-6">
                      <button
                        onClick={handleSOSClick}
                        disabled={sosActive || loading}
                        className={`relative w-40 h-40 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-2xl flex items-center justify-center transition-all duration-300 ${
                          sosActive || loading
                            ? "animate-pulse scale-95 opacity-75 cursor-not-allowed"
                            : "hover:scale-110 hover:shadow-red-500/50 active:scale-95"
                        }`}
                      >
                        <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />
                        <div className="text-center relative z-10">
                          <AlertTriangle className="w-16 h-16 text-white mx-auto mb-2 drop-shadow-lg" />
                          <span className="text-white text-xl font-black tracking-wider">
                            {loading ? "SENDING" : "SOS"}
                          </span>
                        </div>
                      </button>

                      {(sosActive || loading) && (
                        <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                          <span className="font-semibold text-green-400 text-sm">
                            {loading
                              ? "Sending emergency alert..."
                              : "Alert Sent - Help is on the way!"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Request Type Selection */}
                    <div>
                      <h3 className="text-base font-semibold text-white mb-3 text-left">
                        Select Emergency Type
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                        {requestTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.id}
                              onClick={() => setSelectedType(type.id)}
                              className={`p-3 rounded-xl border-2 transition-all duration-200 group ${
                                selectedType === type.id
                                  ? "bg-gradient-to-br from-primary-600/30 to-primary-700/30 border-primary-500 shadow-lg shadow-primary-500/20 scale-105"
                                  : "bg-dark-800/50 border-dark-700 hover:border-primary-500/50 hover:bg-dark-800"
                              }`}
                            >
                              <Icon
                                className={`w-8 h-8 mx-auto mb-2 transition-transform group-hover:scale-110 ${
                                  selectedType === type.id
                                    ? "text-primary-400"
                                    : "text-gray-400"
                                }`}
                              />
                              <span
                                className={`text-xs sm:text-sm font-semibold block ${
                                  selectedType === type.id
                                    ? "text-white"
                                    : "text-gray-400"
                                }`}
                              >
                                {type.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <div className="bg-gradient-to-br from-primary-600/20 to-primary-700/20 backdrop-blur-sm border border-primary-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-primary-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {statistics.total}
                  </h3>
                  <p className="text-sm text-gray-400">{t.dashboard.totalRequests}</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {statistics.pending}
                  </h3>
                  <p className="text-sm text-gray-400">{t.dashboard.pending}</p>
                </div>

                <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {statistics.completed}
                  </h3>
                  <p className="text-sm text-gray-400">{t.dashboard.completed}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {location ? "✓" : "✗"}
                  </h3>
                  <p className="text-sm text-gray-400">{t.dashboard.location}</p>
                </div>
              </div>

              {/* Profile & Location Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Profile Info */}
                <div className="lg:col-span-2 bg-gradient-to-br from-dark-900 to-dark-800 border border-dark-700 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-lg">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {t.dashboard.yourProfile}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {t.dashboard.accountInformation}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-500/50 transition-colors">
                      <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">{t.dashboard.name}</p>
                        <p className="text-sm font-semibold text-white">
                          {user.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-500/50 transition-colors">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">{t.dashboard.mobile}</p>
                        <p className="text-sm font-semibold text-white">
                          {user.mobile}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Status */}
                <div className="bg-gradient-to-br from-dark-900 to-dark-800 border border-dark-700 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        location ? "bg-green-500/20" : "bg-red-500/20"
                      }`}
                    >
                      <MapPin
                        className={`w-6 h-6 ${
                          location ? "text-green-400" : "text-red-400"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {t.dashboard.location}
                      </h3>
                      <p
                        className={`text-sm font-semibold ${
                          location ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {location ? t.dashboard.active : t.dashboard.inactive}
                      </p>
                    </div>
                  </div>
                  {location ? (
                    <div className="space-y-2">
                      <div className="p-2 bg-dark-800 rounded text-xs">
                        <p className="text-gray-400">
                          {t.dashboard.lat}:{" "}
                          <span className="text-white font-mono">
                            {location.latitude.toFixed(4)}
                          </span>
                        </p>
                      </div>
                      <div className="p-2 bg-dark-800 rounded text-xs">
                        <p className="text-gray-400">
                          {t.dashboard.long}:{" "}
                          <span className="text-white font-mono">
                            {location.longitude.toFixed(4)}
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={getLocation}
                      className="w-full mt-2 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      {t.dashboard.enableLocation}
                    </button>
                  )}
                </div>
              </div>

              {/* Request History */}
              <div className="bg-gradient-to-br from-dark-900 to-dark-800 border border-dark-700 rounded-xl p-6 sm:p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {t.dashboard.recentRequests}
                    </h3>
                  </div>
                  {requestHistory.length > 0 && (
                    <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-semibold">
                      {requestHistory.length}
                    </span>
                  )}
                </div>

                {requestHistory.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-10 h-10 text-gray-600" />
                    </div>
                    <p className="text-gray-400 text-lg font-medium">
                      {t.dashboard.noPreviousRequests}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {t.dashboard.emergencyRequestsAppear}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requestHistory.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="p-5 bg-dark-800 border border-dark-700 rounded-xl hover:border-primary-500/50 hover:shadow-lg transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-4 flex-1">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                request.status === "completed"
                                  ? "bg-green-500/20 border border-green-500/30"
                                  : request.status === "accepted"
                                    ? "bg-blue-500/20 border border-blue-500/30"
                                    : request.status === "pending"
                                      ? "bg-yellow-500/20 border border-yellow-500/30"
                                      : "bg-red-500/20 border border-red-500/30"
                              }`}
                            >
                              {request.status === "completed" ? (
                                <CheckCircle className="w-6 h-6 text-green-400" />
                              ) : request.status === "accepted" ? (
                                <CheckCircle className="w-6 h-6 text-blue-400" />
                              ) : request.status === "pending" ? (
                                <Clock className="w-6 h-6 text-yellow-400" />
                              ) : (
                                <X className="w-6 h-6 text-red-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white text-base mb-1">
                                {request.type}
                              </p>
                              <p className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span className="truncate">
                                  {request.location?.address ||
                                    `${request.location?.latitude?.toFixed?.(4) || "—"}, ${request.location?.longitude?.toFixed?.(4) || "—"}`}
                                </span>
                              </p>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <p className="text-xs text-gray-500">
                                  {formatTimestamp(request.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const lat = request.location?.latitude;
                                const lng = request.location?.longitude;
                                if (lat && lng) {
                                  window.open(
                                    `https://www.google.com/maps?q=${lat},${lng}`,
                                    "_blank"
                                  );
                                }
                              }}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                              title="View on map"
                            >
                              <Navigation className="w-4 h-4" />
                            </button>
                            <span
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 ${
                                request.status === "completed"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : request.status === "accepted"
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : request.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {request.status}
                            </span>
                          </div>
                        </div>

                        {(request.respondedBy || request.respondedByName) && (
                          <div className="mt-4 pt-4 border-t border-dark-700">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-primary-400" />
                              </div>
                              <p className="text-sm text-gray-400">
                                Responded by{" "}
                                <span className="text-white font-semibold">
                                  {request.respondedBy ||
                                    request.respondedByName}
                                </span>
                                {(request.responseTime ||
                                  request.response_time) && (
                                  <span className="text-gray-500">
                                    {" "}
                                    in{" "}
                                    {request.responseTime ||
                                      request.response_time}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {requestHistory.length > 5 && (
                      <button
                        onClick={() => handleNavigation("history")}
                        className="w-full py-3 text-center text-primary-400 hover:text-primary-300 font-semibold text-sm transition-colors"
                      >
                        View All {requestHistory.length} Requests →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Emergency Section */}
          {activeSection === "emergency" && (
            <div className="bg-gradient-to-br from-red-600/10 via-dark-900 to-dark-900 border-2 border-red-500/20 rounded-2xl p-8 sm:p-12 text-center shadow-2xl">
              <div className="max-w-4xl mx-auto">
                <div className="inline-block p-4 bg-red-500/10 rounded-full mb-6">
                  <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Emergency SOS
                </h2>
                <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
                  Quickly send emergency alerts to nearby services with one tap
                </p>

                {/* SOS Button */}
                <div className="flex flex-col items-center mb-12">
                  <button
                    onClick={handleSOSClick}
                    disabled={sosActive || loading}
                    className={`relative w-64 h-64 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-2xl flex items-center justify-center transition-all duration-300 ${
                      sosActive || loading
                        ? "animate-pulse scale-95 opacity-75 cursor-not-allowed"
                        : "hover:scale-110 hover:shadow-red-500/50 active:scale-95"
                    }`}
                  >
                    <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />
                    <div className="text-center relative z-10">
                      <AlertTriangle className="w-28 h-28 text-white mx-auto mb-4 drop-shadow-lg" />
                      <span className="text-white text-2xl font-black tracking-widest">
                        {loading ? "SENDING" : "SOS"}
                      </span>
                    </div>
                  </button>

                  {(sosActive || loading) && (
                    <div className="mt-8 flex items-center gap-3 px-8 py-4 bg-green-500/20 border border-green-500/50 rounded-full">
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-ping" />
                      <span className="font-bold text-green-400">
                        {loading
                          ? "Sending emergency alert..."
                          : "Alert Sent - Help is on the way!"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Request Type Selection */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-6 text-left">
                    Select Emergency Type
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {requestTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className={`p-6 rounded-2xl border-2 transition-all duration-200 group text-left ${
                            selectedType === type.id
                              ? "bg-gradient-to-br from-primary-600/30 to-primary-700/30 border-primary-500 shadow-lg shadow-primary-500/20 scale-105"
                              : "bg-dark-800/50 border-dark-700 hover:border-primary-500/50 hover:bg-dark-800 hover:scale-105"
                          }`}
                        >
                          <Icon
                            className={`w-12 h-12 mb-4 transition-transform group-hover:scale-110 ${
                              selectedType === type.id
                                ? "text-primary-400"
                                : "text-gray-400"
                            }`}
                          />
                          <span
                            className={`text-lg font-bold block ${
                              selectedType === type.id
                                ? "text-white"
                                : "text-gray-300"
                            }`}
                          >
                            {type.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Section */}
          {activeSection === "history" && (
            <div className="bg-gradient-to-br from-dark-900 to-dark-800 border border-dark-700 rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      All Requests
                    </h2>
                    <p className="text-sm text-gray-400">
                      Your complete emergency request history
                    </p>
                  </div>
                </div>
                {requestHistory.length > 0 && (
                  <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-semibold">
                    {requestHistory.length} total
                  </span>
                )}
              </div>

              {requestHistory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-10 h-10 text-gray-600" />
                  </div>
                  <p className="text-gray-400 text-lg font-medium">
                    No requests yet
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Your emergency requests will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requestHistory.map((request) => (
                    <div
                      key={request.id}
                      className="p-5 bg-dark-800 border border-dark-700 rounded-xl hover:border-primary-500/50 hover:shadow-lg transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-4 flex-1">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                              request.status === "completed"
                                ? "bg-green-500/20 border border-green-500/30"
                                : request.status === "accepted"
                                  ? "bg-blue-500/20 border border-blue-500/30"
                                  : request.status === "pending"
                                    ? "bg-yellow-500/20 border border-yellow-500/30"
                                    : "bg-red-500/20 border border-red-500/30"
                            }`}
                          >
                            {request.status === "completed" ? (
                              <CheckCircle className="w-6 h-6 text-green-400" />
                            ) : request.status === "accepted" ? (
                              <CheckCircle className="w-6 h-6 text-blue-400" />
                            ) : request.status === "pending" ? (
                              <Clock className="w-6 h-6 text-yellow-400" />
                            ) : (
                              <X className="w-6 h-6 text-red-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-base mb-1">
                              {request.type}
                            </p>
                            <p className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="truncate">
                                {request.location?.address ||
                                  `${request.location?.latitude?.toFixed?.(4) || "—"}, ${request.location?.longitude?.toFixed?.(4) || "—"}`}
                              </span>
                            </p>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <p className="text-xs text-gray-500">
                                {formatTimestamp(request.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 ${
                            request.status === "completed"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : request.status === "accepted"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : request.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>

                      {(request.respondedBy || request.respondedByName) && (
                        <div className="mt-4 pt-4 border-t border-dark-700">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-primary-400" />
                            </div>
                            <p className="text-sm text-gray-400">
                              {t.dashboard.respondedBy}{" "}
                              <span className="text-white font-semibold">
                                {request.respondedBy || request.respondedByName}
                              </span>
                              {(request.responseTime ||
                                request.response_time) && (
                                <span className="text-gray-500">
                                  {" "}
                                  {t.dashboard.in}{" "}
                                  {request.responseTime ||
                                    request.response_time}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contacts Section */}
          {activeSection === "contacts" && <EmergencyContacts />}

          {/* Map Section */}
          {activeSection === "map" && (
            <div className="bg-gradient-to-br from-dark-900 to-dark-800 border border-dark-700 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary-400" />
                </div>
                <h2 className="text-xl font-bold text-white">{t.map.title}</h2>
              </div>

              {locationLoading ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <p className="text-gray-400">{t.dashboard.gettingLocation}</p>
                </div>
              ) : locationError ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <p className="text-red-400 mb-6">{locationError}</p>
                  <button
                    onClick={getLocation}
                    className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    {t.dashboard.tryAgain}
                  </button>
                </div>
              ) : location ? (
                <div className="space-y-6">
                  <div className="p-6 bg-dark-800 border border-dark-700 rounded-xl">
                    <p className="text-sm text-gray-400 mb-4 font-semibold">
                      {t.dashboard.currentCoordinates}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                        <span className="text-sm text-gray-400">{t.dashboard.latitude}:</span>
                        <span className="text-white font-mono font-semibold">
                          {location.latitude.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                        <span className="text-sm text-gray-400">
                          {t.dashboard.longitude}:
                        </span>
                        <span className="text-white font-mono font-semibold">
                          {location.longitude.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                        <span className="text-sm text-gray-400">{t.dashboard.accuracy}:</span>
                        <span className="text-green-400 font-semibold">
                          ±{location.accuracy?.toFixed(0)}m
                        </span>
                      </div>
                    </div>
                  </div>
                  <MapView />
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-10 h-10 text-gray-600" />
                  </div>
                  <p className="text-gray-400 text-lg mb-6">
                    {t.dashboard.locationNotAvailable}
                  </p>
                  <button
                    onClick={getLocation}
                    className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    {t.dashboard.getLocation}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Settings Section */}
          {activeSection === "settings" && (
            <div className="space-y-6">
              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-500/20 border border-green-500 text-green-400 p-4 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {successMessage}
                </div>
              )}

              {/* Statistics Overview */}
              <div className="card p-8">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary-500" />
                  {t.dashboard.yourStatistics}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-dark-800 rounded-lg border border-dark-700">
                    <p className="text-sm text-gray-400 mb-1">{t.dashboard.totalRequests}</p>
                    <p className="text-2xl font-bold text-white">
                      {statistics.total}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <p className="text-sm text-yellow-400 mb-1">{t.dashboard.pending}</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {statistics.pending}
                    </p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <p className="text-sm text-green-400 mb-1">{t.dashboard.completed}</p>
                    <p className="text-2xl font-bold text-green-500">
                      {statistics.completed}
                    </p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                    <p className="text-sm text-red-400 mb-1">{t.dashboard.rejected}</p>
                    <p className="text-2xl font-bold text-red-500">
                      {statistics.rejected}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Settings */}
              <div className="card p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-primary-500" />
                    {t.settings.profileInfo}
                  </h3>
                  {!editingProfile ? (
                    <button
                      onClick={handleProfileEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t.dashboard.editProfile}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleProfileSave}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        {t.common.save}
                      </button>
                      <button
                        onClick={handleProfileCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        {t.common.cancel}
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <label className="text-sm text-gray-400 block mb-2">
                      {t.dashboard.name}
                    </label>
                    {editingProfile ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                      />
                    ) : (
                      <p className="text-white font-medium">{user.name}</p>
                    )}
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <label className="text-sm text-gray-400 block mb-2">
                      {t.dashboard.mobile}
                    </label>
                    <p className="text-white font-medium">{user.mobile}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t.dashboard.mobileCannotChange}
                    </p>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <label className="text-sm text-gray-400 block mb-2">
                      {t.dashboard.email}
                    </label>
                    {editingProfile ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                        placeholder="Enter your email"
                      />
                    ) : (
                      <p className="text-white font-medium">
                        {user.email || "Not set"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Appearance Settings */}
              <div className="card p-8">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary-500" />
                  {t.settings.appearanceLanguage}
                </h3>
                <div className="space-y-4">
                  {/* Theme Toggle */}
                  <div className="p-4 bg-dark-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {theme === "dark" ? (
                        <Moon className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Sun className="w-5 h-5 text-yellow-400" />
                      )}
                      <div>
                        <p className="text-white font-medium">{t.settings.theme}</p>
                        <p className="text-sm text-gray-400">
                          {theme === "dark" ? t.settings.darkMode : t.settings.lightMode}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleThemeToggle}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        theme === "dark" ? "bg-primary-600" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          theme === "dark" ? "translate-x-7" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Language Selection */}
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <label className="text-white font-medium mb-3 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary-500" />
                      {t.settings.languageLabel}
                    </label>
                    <select
                      value={language}
                      onChange={handleLanguageChange}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 cursor-pointer"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="card p-8">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary-500" />
                  {t.settings.notificationPreferences}
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-dark-800 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        {t.settings.pushNotifications}
                      </p>
                      <p className="text-sm text-gray-400">
                        {t.settings.receiveInstantAlerts}
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle("push")}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        notifications.push ? "bg-primary-600" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.push ? "translate-x-7" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 bg-dark-800 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        {t.settings.emailNotifications}
                      </p>
                      <p className="text-sm text-gray-400">
                        {t.settings.getUpdatesViaEmail}
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle("email")}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        notifications.email ? "bg-primary-600" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.email
                            ? "translate-x-7"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 bg-dark-800 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        {t.settings.smsNotifications}
                      </p>
                      <p className="text-sm text-gray-400">
                        {t.settings.receiveTextAlerts}
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle("sms")}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        notifications.sms ? "bg-primary-600" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.sms ? "translate-x-7" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="card p-8">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary-500" />
                  {t.settings.privacySecurity}
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-dark-800 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        {t.settings.shareLocationServices}
                      </p>
                      <p className="text-sm text-gray-400">
                        {t.settings.allowEmergencyAccess}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePrivacyToggle("shareLocation")}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        privacy.shareLocation ? "bg-primary-600" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          privacy.shareLocation
                            ? "translate-x-7"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 bg-dark-800 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{t.settings.usageAnalytics}</p>
                      <p className="text-sm text-gray-400">
                        {t.settings.helpImproveApp}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePrivacyToggle("dataAnalytics")}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        privacy.dataAnalytics ? "bg-primary-600" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          privacy.dataAnalytics
                            ? "translate-x-7"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* App Preferences */}
              <div className="card p-8">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-primary-500" />
                  {t.settings.appPreferences}
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-dark-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {appPreferences.soundEffects ? (
                        <Volume2 className="w-5 h-5 text-primary-500" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <p className="text-white font-medium">{t.settings.soundEffects}</p>
                        <p className="text-sm text-gray-400">
                          {t.settings.playSoundsForActions}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAppPreferenceToggle("soundEffects")}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        appPreferences.soundEffects
                          ? "bg-primary-600"
                          : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          appPreferences.soundEffects
                            ? "translate-x-7"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 bg-dark-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary-500" />
                      <div>
                        <p className="text-white font-medium">
                          {t.settings.autoFetchLocation}
                        </p>
                        <p className="text-sm text-gray-400">
                          {t.settings.autoGetLocation}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAppPreferenceToggle("autoLocation")}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        appPreferences.autoLocation
                          ? "bg-primary-600"
                          : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          appPreferences.autoLocation
                            ? "translate-x-7"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Location Services Status */}
                  <div className="p-4 bg-dark-800 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        {t.settings.locationServices}
                      </p>
                      <p className="text-sm text-gray-400">
                        {t.settings.browserLocationStatus}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        location
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {location ? t.settings.enabled : t.settings.disabled}
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card p-8 border border-red-500/30">
                <h3 className="text-lg font-semibold text-red-400 mb-6">
                  {t.settings.dangerZone}
                </h3>
                <div className="space-y-4">
                  <button className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-medium transition-colors">
                    {t.settings.clearAllHistory}
                  </button>
                  <button className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-medium transition-colors">
                    {t.settings.deleteAccount}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* AI Safety Chatbot */}
      <SafetyChatbot onSOSRequest={handleChatbotSOS} userLocation={location} />
    </div>
  );
};

export default UserDashboard;
