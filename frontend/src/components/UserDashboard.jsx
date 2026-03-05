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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { useLanguage } from "../contexts/LanguageContext";
import { submitSOSRequest, getUserRequests } from "../utils/api";
import Sidebar from "./Sidebar";

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const locationHook = useLocation();
  const { language, changeLanguage } = useLanguage();
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
      // Here you would make an API call to update the profile
      // await updateUserProfile(profileData);

      // For now, just update local state
      user.name = profileData.name;
      user.email = profileData.email;

      setEditingProfile(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
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
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg flex items-center gap-3 animate-pulse">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <p className="text-green-400 font-semibold">{successMessage}</p>
            </div>
          )}

          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <>
              {/* SOS Section */}
              <div className="mb-8">
                <div className="card p-8 text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Emergency SOS
                  </h2>
                  <p className="text-gray-400 mb-8">
                    Tap the button below if you need immediate help
                  </p>

                  {/* SOS Button */}
                  <div className="flex flex-col items-center mb-8">
                    <button
                      onClick={handleSOSClick}
                      disabled={sosActive || loading}
                      className={`w-48 h-48 rounded-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-2xl flex items-center justify-center transition-all duration-200 ${
                        sosActive || loading
                          ? "animate-pulse scale-95 opacity-75 cursor-not-allowed"
                          : "hover:scale-105 active:scale-95"
                      }`}
                    >
                      <div className="text-center">
                        <AlertTriangle className="w-20 h-20 text-white mx-auto mb-2" />
                        <span className="text-white text-2xl font-bold">
                          {loading ? "SENDING..." : "SOS"}
                        </span>
                      </div>
                    </button>

                    {(sosActive || loading) && (
                      <div className="mt-4 flex items-center gap-2 text-green-400">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                        <span className="font-semibold">
                          {loading
                            ? "Sending alert..."
                            : "Alert Sent - Help is on the way!"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Request Type Selection */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {requestTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            selectedType === type.id
                              ? "bg-dark-800 border-primary-600 shadow-lg"
                              : "bg-dark-900/50 border-dark-700 hover:border-dark-600"
                          }`}
                        >
                          <Icon
                            className={`w-8 h-8 mx-auto mb-2 ${
                              selectedType === type.id
                                ? "text-primary-500"
                                : "text-gray-400"
                            }`}
                          />
                          <span
                            className={`text-sm font-semibold ${
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

              {/* Profile Card */}
              <div className="mb-8 card p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Your Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Name</p>
                      <p className="text-sm font-semibold text-white">
                        {user.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Mobile</p>
                      <p className="text-sm font-semibold text-white">
                        {user.mobile}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request History */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Requests
                </h3>

                {requestHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No previous requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requestHistory.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 ${
                                request.status === "completed"
                                  ? "bg-green-600"
                                  : "bg-yellow-600"
                              } rounded-full flex items-center justify-center`}
                            >
                              {request.status === "completed" ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : (
                                <Clock className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {request.type}
                              </p>
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {request.location?.address ||
                                  `${request.location?.latitude?.toFixed?.(4) || "—"}, ${request.location?.longitude?.toFixed?.(4) || "—"}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                request.status === "completed"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {request.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimestamp(request.timestamp)}
                            </p>
                          </div>
                        </div>

                        {(request.respondedBy || request.respondedByName) && (
                          <div className="mt-2 pt-2 border-t border-dark-700">
                            <p className="text-xs text-gray-400">
                              Responded by{" "}
                              <span className="text-white font-semibold">
                                {request.respondedBy || request.respondedByName}
                              </span>{" "}
                              in {request.responseTime || request.response_time}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Emergency Section */}
          {activeSection === "emergency" && (
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                Emergency SOS
              </h2>
              <p className="text-gray-400 mb-8">
                Quickly send emergency alerts to nearby services
              </p>

              {/* SOS Button */}
              <div className="flex flex-col items-center mb-8">
                <button
                  onClick={handleSOSClick}
                  disabled={sosActive || loading}
                  className={`w-48 h-48 rounded-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-2xl flex items-center justify-center transition-all duration-200 ${
                    sosActive || loading
                      ? "animate-pulse scale-95 opacity-75 cursor-not-allowed"
                      : "hover:scale-105 active:scale-95"
                  }`}
                >
                  <div className="text-center">
                    <AlertTriangle className="w-20 h-20 text-white mx-auto mb-2" />
                    <span className="text-white text-2xl font-bold">
                      {loading ? "SENDING..." : "SOS"}
                    </span>
                  </div>
                </button>

                {(sosActive || loading) && (
                  <div className="mt-4 flex items-center gap-2 text-green-400">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                    <span className="font-semibold">
                      {loading
                        ? "Sending alert..."
                        : "Alert Sent - Help is on the way!"}
                    </span>
                  </div>
                )}
              </div>

              {/* Request Type Selection */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Select Emergency Type:
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {requestTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          selectedType === type.id
                            ? "bg-dark-800 border-primary-600 shadow-lg"
                            : "bg-dark-900/50 border-dark-700 hover:border-dark-600"
                        }`}
                      >
                        <Icon
                          className={`w-8 h-8 mx-auto mb-2 ${
                            selectedType === type.id
                              ? "text-primary-500"
                              : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`text-sm font-semibold block ${
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
          )}

          {/* Contacts Section */}
          {activeSection === "contacts" && (
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Phone className="w-6 h-6 text-primary-500" />
                Emergency Contacts
              </h2>
              <p className="text-gray-400 mb-6">
                Quick access to emergency services
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-600 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                      <Ambulance className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Ambulance
                      </h3>
                      <p className="text-sm text-gray-400">
                        Emergency Medical Services
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:108"
                    className="text-2xl font-bold text-primary-500 hover:text-primary-400"
                  >
                    108
                  </a>
                </div>

                <div className="p-6 bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-600 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Police</h3>
                      <p className="text-sm text-gray-400">
                        Emergency Police Services
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:100"
                    className="text-2xl font-bold text-primary-500 hover:text-primary-400"
                  >
                    100
                  </a>
                </div>

                <div className="p-6 bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-600 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Fire Brigade
                      </h3>
                      <p className="text-sm text-gray-400">
                        Fire Emergency Services
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:101"
                    className="text-2xl font-bold text-primary-500 hover:text-primary-400"
                  >
                    101
                  </a>
                </div>

                <div className="p-6 bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-600 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Women Helpline
                      </h3>
                      <p className="text-sm text-gray-400">24x7 Support</p>
                    </div>
                  </div>
                  <a
                    href="tel:1091"
                    className="text-2xl font-bold text-primary-500 hover:text-primary-400"
                  >
                    1091
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Map Section */}
          {activeSection === "map" && (
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary-500" />
                Your Location
              </h2>

              {locationLoading ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Getting your location...</p>
                </div>
              ) : locationError ? (
                <div className="text-center py-16">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-400 mb-4">{locationError}</p>
                  <button onClick={getLocation} className="btn-primary">
                    Try Again
                  </button>
                </div>
              ) : location ? (
                <div className="space-y-4">
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">
                      Current Coordinates:
                    </p>
                    <p className="text-white font-mono">
                      Lat: {location.latitude.toFixed(6)}, Long:{" "}
                      {location.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Accuracy: ±{location.accuracy?.toFixed(0)}m
                    </p>
                  </div>
                  <div className="aspect-video bg-dark-800 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Map view coming soon...</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Location not available</p>
                  <button onClick={getLocation} className="btn-primary">
                    Get Location
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
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary-500" />
                  Your Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-dark-800 rounded-lg border border-dark-700">
                    <p className="text-sm text-gray-400 mb-1">Total Requests</p>
                    <p className="text-3xl font-bold text-white">
                      {statistics.total}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <p className="text-sm text-yellow-400 mb-1">Pending</p>
                    <p className="text-3xl font-bold text-yellow-500">
                      {statistics.pending}
                    </p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <p className="text-sm text-green-400 mb-1">Completed</p>
                    <p className="text-3xl font-bold text-green-500">
                      {statistics.completed}
                    </p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                    <p className="text-sm text-red-400 mb-1">Rejected</p>
                    <p className="text-3xl font-bold text-red-500">
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
                    Profile Information
                  </h3>
                  {!editingProfile ? (
                    <button
                      onClick={handleProfileEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleProfileSave}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleProfileCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <label className="text-sm text-gray-400 block mb-2">
                      Name
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
                      Mobile
                    </label>
                    <p className="text-white font-medium">{user.mobile}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Mobile number cannot be changed
                    </p>
                  </div>
                  <div className="p-4 bg-dark-800 rounded-lg">
                    <label className="text-sm text-gray-400 block mb-2">
                      Email
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
                  Appearance & Language
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
                        <p className="text-white font-medium">Theme</p>
                        <p className="text-sm text-gray-400">
                          {theme === "dark" ? "Dark Mode" : "Light Mode"}
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
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={handleLanguageChange}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 cursor-pointer"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="fr">Français (French)</option>
                      <option value="ar">العربية (Arabic)</option>
                      <option value="bn">বাংলা (Bengali)</option>
                      <option value="pt">Português (Portuguese)</option>
                      <option value="ru">Русский (Russian)</option>
                      <option value="ja">日本語 (Japanese)</option>
                      <option value="de">Deutsch (German)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="card p-8">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary-500" />
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-dark-800 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        Push Notifications
                      </p>
                      <p className="text-sm text-gray-400">
                        Receive instant alerts about your requests
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
                        Email Notifications
                      </p>
                      <p className="text-sm text-gray-400">
                        Get updates via email
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
                        SMS Notifications
                      </p>
                      <p className="text-sm text-gray-400">
                        Receive text message alerts
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
                  Privacy & Security
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-dark-800 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        Share Location with Services
                      </p>
                      <p className="text-sm text-gray-400">
                        Allow emergency services to access your location
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
                      <p className="text-white font-medium">Usage Analytics</p>
                      <p className="text-sm text-gray-400">
                        Help improve the app by sharing usage data
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
                  App Preferences
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
                        <p className="text-white font-medium">Sound Effects</p>
                        <p className="text-sm text-gray-400">
                          Play sounds for actions and alerts
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
                          Auto-Fetch Location
                        </p>
                        <p className="text-sm text-gray-400">
                          Automatically get your location on app start
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
                        Location Services
                      </p>
                      <p className="text-sm text-gray-400">
                        Browser location access status
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        location
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {location ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card p-8 border border-red-500/30">
                <h3 className="text-lg font-semibold text-red-400 mb-6">
                  Danger Zone
                </h3>
                <div className="space-y-4">
                  <button className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-medium transition-colors">
                    Clear All Request History
                  </button>
                  <button className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-medium transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
