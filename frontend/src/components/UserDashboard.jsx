import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { submitSOSRequest, getUserRequests } from "../utils/api";

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
  const submittingRef = useRef(false);

  useEffect(() => {
    loadRequestHistory();
  }, []);

  const loadRequestHistory = async () => {
    try {
      const response = await getUserRequests();
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
    if (submittingRef.current) return;
    if (!location) {
      alert("Please enable location access to send SOS");
      return;
    }

    submittingRef.current = true;
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
      submittingRef.current = false;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Header */}
      <header className="bg-dark-900/80 backdrop-blur-sm border-b border-dark-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SafeNow</h1>
                <p className="text-xs text-gray-400">Emergency Help Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-lg">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white font-medium">
                  {user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg flex items-center gap-3 animate-pulse">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <p className="text-green-400 font-semibold">{successMessage}</p>
          </div>
        )}

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
                disabled={sosActive}
                className={`w-48 h-48 rounded-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-2xl flex items-center justify-center transition-all duration-200 ${
                  sosActive
                    ? "animate-pulse scale-95 opacity-75 cursor-not-allowed"
                    : "hover:scale-105 active:scale-95"
                }`}
              >
                <div className="text-center">
                  <AlertTriangle className="w-20 h-20 text-white mx-auto mb-2" />
                  <span className="text-white text-2xl font-bold">SOS</span>
                </div>
              </button>

              {sosActive && (
                <div className="mt-4 flex items-center gap-2 text-green-400">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                  <span className="font-semibold">
                    Alert Sent - Help is on the way!
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
                <p className="text-sm font-semibold text-white">{user.name}</p>
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
                          {request.location?.address || `${request.location?.latitude?.toFixed?.(4) || '—'}, ${request.location?.longitude?.toFixed?.(4) || '—'}`}
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
