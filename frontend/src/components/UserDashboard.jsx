import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Camera,
  Upload,
  Mic,
  PhoneCall,
  Image,
  Video,
  RefreshCw,
  Navigation,
  Plus,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { submitSOSRequest, getUserRequests } from "../utils/mockApi";
import Sidebar from "./Sidebar";
import EmergencyContacts from "./EmergencyContacts";
import Settings from "./Settings";
import MapView from "./MapView";

const requestTypes = [
  { id: "ambulance", label: "Ambulance", icon: Ambulance, color: "bg-red-600" },
  { id: "police", label: "Police", icon: Shield, color: "bg-blue-600" },
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
  const {
    location,
    error: locationError,
    loading: locationLoading,
    getLocation,
  } = useGeolocation();

  const [selectedType, setSelectedType] = useState("ambulance");
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [requestHistory, setRequestHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [photos, setPhotos] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({
    activeAlerts: 12,
    availableResponders: 0,
    avgResponseTime: "5.2 min",
    nearbyHelp: 0,
  });

  useEffect(() => {
    loadRequestHistory();
    // Set initial hash if not present
    if (!window.location.hash) {
      window.location.hash = "dashboard";
    }
    // Simulate online status check
    const interval = setInterval(() => {
      setIsOnline(navigator.onLine);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadRequestHistory = async () => {
    try {
      const response = await getUserRequests(user.mobile);
      setRequestHistory(response.requests);
    } catch (error) {
      console.error("Error loading request history:", error);
    }
  };

  const handleSOSClick = () => {
    setShowSOSModal(true);
    getLocation();
  };

  const handleConfirmSOS = async () => {
    if (!location) {
      alert("Please enable location access to send SOS");
      return;
    }

    setLoading(true);
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

      setSuccessMessage(response.message);
      setShowSOSModal(false);

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
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    window.location.hash = section;
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 3) {
      alert("Maximum 3 photos allowed");
      return;
    }
    const newPhotos = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setPhotos([...photos, ...newPhotos]);
  };

  const handleCameraCapture = () => {
    // In a real app, this would open the device camera
    alert("Camera functionality would open here. In production, this would access the device camera.");
  };

  const handleRemovePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // In a real app, start audio recording here
    setTimeout(() => {
      setIsRecording(false);
      setVoiceMessage({
        duration: "0:15",
        timestamp: Date.now()
      });
      alert("Voice message recorded successfully!");
    }, 3000);
  };

  const handleVoiceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVoiceMessage({
        file,
        name: file.name,
        timestamp: Date.now()
      });
      alert("Voice message uploaded successfully!");
    }
  };

  const handleGetLocation = () => {
    getLocation();
  };

  const handleEmergencyCall = () => {
    window.location.href = "tel:911";
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
    <div className="flex min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Sidebar */}
      <Sidebar onNavigate={handleSectionChange} />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg flex items-center gap-3 animate-pulse">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <p className="text-green-400 font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Conditional Section Rendering */}
        {activeSection === "contacts" ? (
          <EmergencyContacts />
        ) : activeSection === "settings" ? (
          <Settings />
        ) : activeSection === "map" ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Live Map</h2>
              <p className="text-gray-400">Track emergency services in real-time</p>
            </div>
            <div className="card p-6" style={{ height: "600px" }}>
              <MapView requests={requestHistory} />
            </div>
          </div>
        ) : activeSection === "emergency" ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Emergency Center Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">Emergency Center</h2>
              </div>
              <p className="text-gray-400 text-lg">
                Quick access to emergency services and immediate assistance
              </p>
            </div>

            {/* Photo Evidence Section */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Camera className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Photo Evidence</h3>
                    <p className="text-sm text-gray-400">{photos.length}/3 photos</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold">
                      <Upload className="w-4 h-4" />
                      Upload
                    </div>
                  </label>
                  <button
                    onClick={handleCameraCapture}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
                  >
                    <Camera className="w-4 h-4" />
                    Camera
                  </button>
                </div>
              </div>

              {/* Photo Grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.url}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="text-white text-xs">×</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Voice Message Section */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <Mic className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Voice Message</h3>
                    <p className="text-sm text-gray-400">
                      {voiceMessage ? "Message recorded" : "Record voice message"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleVoiceUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold">
                      <Upload className="w-4 h-4" />
                      Upload
                    </div>
                  </label>
                  <button
                    onClick={handleStartRecording}
                    disabled={isRecording}
                    className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-semibold ${
                      isRecording
                        ? "bg-red-700 animate-pulse cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    {isRecording ? "Recording..." : "Record"}
                  </button>
                </div>
              </div>

              {voiceMessage && (
                <div className="mt-4 p-3 bg-dark-800 rounded-lg flex items-center gap-3">
                  <Mic className="w-5 h-5 text-purple-500" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      {voiceMessage.name || "Voice recording"}
                    </p>
                    {voiceMessage.duration && (
                      <p className="text-gray-400 text-xs">{voiceMessage.duration}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setVoiceMessage(null)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* SOS Button */}
            <div className="card p-8 text-center">
              <div className="flex flex-col items-center">
                <button
                  onClick={handleSOSClick}
                  disabled={sosActive}
                  className={`w-56 h-56 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_40px_rgba(239,68,68,0.4)] flex items-center justify-center transition-all duration-300 ${
                    sosActive
                      ? "animate-pulse scale-95 opacity-75 cursor-not-allowed"
                      : "hover:scale-105 active:scale-95 hover:shadow-[0_0_60px_rgba(239,68,68,0.6)]"
                  }`}
                >
                  <span className="text-white text-4xl font-bold">SOS</span>
                </button>

                <p className="text-gray-400 mt-6 text-lg">
                  {sosActive ? "Help is on the way!" : "Tap for emergency assistance"}
                </p>

                {sosActive && (
                  <div className="mt-4 flex items-center gap-2 text-green-400">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                    <span className="font-semibold">Alert sent to emergency services</span>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Call Button */}
            <button
              onClick={handleEmergencyCall}
              className="w-full p-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <div className="flex items-center justify-center gap-3">
                <PhoneCall className="w-6 h-6 text-white" />
                <div className="text-left">
                  <p className="text-white text-lg font-bold">Emergency Call</p>
                  <p className="text-red-100 text-sm">Dial 911 - Emergency Services</p>
                </div>
              </div>
            </button>

            {/* Request Type Selection */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Select Emergency Type</h3>
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
        ) : (
          <>
            {/* Dashboard Content */}
            
            {/* Welcome Header */}
            <div className="mb-6 card p-6 border-dark-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Welcome back, {user.name}!
                  </h2>
                  <p className="text-gray-400">
                    Stay safe and connected with emergency services
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full font-semibold ${isOnline ? 'bg-green-600' : 'bg-gray-600'} text-white`}>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Active Alerts */}
              <div className="card p-6 bg-dark-800 border-dark-700">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Active Alerts</p>
                    <p className="text-3xl font-bold text-white">{stats.activeAlerts}</p>
                  </div>
                </div>
              </div>

              {/* Available Responders */}
              <div className="card p-6 bg-dark-800 border-dark-700">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Available Responders</p>
                    <p className="text-3xl font-bold text-white">{stats.availableResponders}</p>
                  </div>
                </div>
              </div>

              {/* Avg Response Time */}
              <div className="card p-6 bg-dark-800 border-dark-700">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Avg Response Time</p>
                    <p className="text-3xl font-bold text-white">{stats.avgResponseTime}</p>
                  </div>
                </div>
              </div>

              {/* Nearby Help */}
              <div className="card p-6 bg-dark-800 border-dark-700">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Nearby Help</p>
                    <p className="text-3xl font-bold text-white">{stats.nearbyHelp}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Emergency Assistance - Takes 2 columns */}
              <div className="lg:col-span-2">
                <div className="card p-8 bg-dark-900 border-dark-800">
                  <h3 className="text-2xl font-bold text-white mb-2 text-center">
                    Emergency Assistance
                  </h3>
                  <p className="text-gray-400 text-center mb-8">
                    Tap the SOS button below to instantly alert emergency services to your location
                  </p>

                  {/* SOS Button */}
                  <div className="flex flex-col items-center mb-6">
                    <button
                      onClick={handleSOSClick}
                      disabled={sosActive}
                      className={`w-56 h-56 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_50px_rgba(239,68,68,0.4)] flex items-center justify-center transition-all duration-300 ${
                        sosActive
                          ? "animate-pulse scale-95 opacity-75 cursor-not-allowed"
                          : "hover:scale-105 active:scale-95 hover:shadow-[0_0_70px_rgba(239,68,68,0.6)]"
                      }`}
                    >
                      <span className="text-white text-5xl font-bold">SOS</span>
                    </button>

                    <p className="text-gray-400 mt-6 text-lg">
                      {sosActive ? "Help is on the way!" : "Tap for emergency assistance"}
                    </p>

                    {sosActive && (
                      <div className="mt-4 flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Alert sent to emergency services</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Location Status */}
                <div className="card p-6 bg-dark-900 border-dark-800">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-bold text-white">Location Status</h3>
                  </div>

                  <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <p className="font-semibold text-white">
                        {location ? "Location Acquired" : "Location Unknown"}
                      </p>
                    </div>
                    <p className="text-sm text-gray-400">
                      {location
                        ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                        : "Tap to get your current location"}
                    </p>
                  </div>

                  <button
                    onClick={handleGetLocation}
                    disabled={locationLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${locationLoading ? 'animate-spin' : ''}`} />
                    {locationLoading ? "Getting Location..." : "Get Location"}
                  </button>
                </div>

                {/* Emergency Contacts Card */}
                <div className="card p-6 bg-dark-900 border-dark-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Emergency Contacts</h3>
                    </div>
                    <button
                      onClick={() => setActiveSection('contacts')}
                      className="w-10 h-10 bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => window.location.href = 'tel:911'}
                      className="w-full p-3 bg-red-900/20 hover:bg-red-900/30 border border-red-700 rounded-lg text-left transition-colors"
                    >
                      <p className="font-semibold text-red-400">Emergency Services</p>
                      <p className="text-sm text-gray-400">911</p>
                    </button>
                    <button
                      onClick={() => window.location.href = 'tel:1800AMBULANCE'}
                      className="w-full p-3 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-700 rounded-lg text-left transition-colors"
                    >
                      <p className="font-semibold text-blue-400">Ambulance</p>
                      <p className="text-sm text-gray-400">1-800-AMBULANCE</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Type Selection */}
            <div className="card p-6 mb-6 bg-dark-900 border-dark-800">
              <h3 className="text-xl font-bold text-white mb-4">Select Emergency Type</h3>
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
                          {request.location.address}
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

                  {request.respondedBy && (
                    <div className="mt-2 pt-2 border-t border-dark-700">
                      <p className="text-xs text-gray-400">
                        Responded by{" "}
                        <span className="text-white font-semibold">
                          {request.respondedBy}
                        </span>{" "}
                        in {request.responseTime}
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
      </main>

      {/* SOS Confirmation Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-2xl p-6 max-w-md w-full border border-dark-700 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Confirm Emergency SOS
              </h3>
              <p className="text-gray-400">
                This will send an alert to emergency services with your current
                location
              </p>
            </div>

            {/* Location Status */}
            <div className="mb-6 p-4 bg-dark-800 rounded-lg">
              {locationLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-400">
                    Getting your location...
                  </span>
                </div>
              ) : locationError ? (
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{locationError}</span>
                </div>
              ) : location ? (
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-semibold">Location acquired</p>
                    <p className="text-xs text-gray-400">
                      {location.latitude.toFixed(6)},{" "}
                      {location.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Selected Type */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Request Type:</p>
              <div className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg">
                {(() => {
                  const type = requestTypes.find((t) => t.id === selectedType);
                  const Icon = type.icon;
                  return (
                    <>
                      <Icon className="w-6 h-6 text-primary-500" />
                      <span className="text-white font-semibold">
                        {type.label}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSOSModal(false)}
                className="flex-1 px-4 py-3 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSOS}
                disabled={!location || loading}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Confirm SOS"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
