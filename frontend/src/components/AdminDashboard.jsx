import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  LogOut,
  User,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Activity,
  TrendingUp,
  AlertCircle,
  Navigation,
  Building2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import {
  getAllSOSRequests,
  updateRequestStatus,
  getAnalytics,
} from "../utils/api";
import MapView from "./MapView";
import AnalyticsCharts from "./AnalyticsCharts";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { requests: wsRequests, updateRequestStatus: updateWSRequest } =
    useWebSocket(user);

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState("requests"); // 'requests' or 'analytics'
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
    loadAnalytics();
  }, []);

  useEffect(() => {
    // Merge WebSocket requests with existing, deduplicating by ID
    if (wsRequests.length > 0) {
      setRequests((prev) => {
        const merged = new Map();
        // Existing requests first
        prev.forEach((r) => merged.set(r.id, r));
        // WebSocket requests overwrite (fresher data)
        wsRequests.forEach((r) => merged.set(r.id, r));
        return Array.from(merged.values()).sort(
          (a, b) =>
            new Date(b.timestamp || b.created_at) -
            new Date(a.timestamp || a.created_at),
        );
      });
    }
  }, [wsRequests]);

  const loadRequests = async () => {
    try {
      const response = await getAllSOSRequests();
      setRequests(response.requests);
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await getAnalytics();
      setAnalytics(response.analytics);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await updateRequestStatus(requestId, "accepted");
      updateWSRequest(requestId, "accepted");
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "accepted" } : req,
        ),
      );
      alert("Request accepted successfully!");
    } catch (error) {
      alert("Error accepting request: " + error.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await updateRequestStatus(requestId, "rejected");
      updateWSRequest(requestId, "rejected");
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "rejected" } : req,
        ),
      );
      alert("Request rejected");
    } catch (error) {
      alert("Error rejecting request: " + error.message);
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

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMs / 3600000);
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const acceptedRequests = requests.filter((r) => r.status === "accepted");

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
                <h1 className="text-xl font-bold text-white">SafeNow Admin</h1>
                <p className="text-xs text-gray-400">
                  Emergency Response Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {pendingRequests.length > 0 && (
                <div className="relative">
                  <Bell className="w-6 h-6 text-red-500 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {pendingRequests.length}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate("/admin/helpers")}
                className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">Service Providers</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-lg">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white font-medium">
                  {user.name}
                </span>
                <span className="text-xs text-gray-500">(Admin)</span>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">
                Active Requests
              </h3>
              <Activity className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {pendingRequests.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">
                Accepted Today
              </h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {analytics?.completedToday || 23}
            </p>
            <p className="text-xs text-gray-500 mt-1">+12% from yesterday</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">
                Avg Response
              </h3>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {analytics?.averageResponseTime || "9.5m"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Target: &lt;10 min</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">
                Total Requests
              </h3>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {analytics?.totalRequests || 1247}
            </p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-dark-800">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === "requests"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            SOS Requests
            {activeTab === "requests" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === "analytics"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Analytics
            {activeTab === "analytics" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === "requests" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Requests List */}
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Pending Requests ({pendingRequests.length})
                </h3>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-gray-400 mt-3">Loading requests...</p>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        className={`p-4 bg-dark-800 rounded-lg cursor-pointer transition-all hover:bg-dark-700 ${
                          selectedRequest?.id === request.id
                            ? "ring-2 ring-primary-600"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-white">
                              {request.userName}
                            </p>
                            <p className="text-sm text-gray-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {request.userId}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded">
                            {request.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {request.location?.address ||
                              `${request.location?.latitude?.toFixed?.(4) || "—"}, ${request.location?.longitude?.toFixed?.(4) || "—"}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(request.timestamp)}
                        </div>

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptRequest(request.id);
                            }}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectRequest(request.id);
                            }}
                            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const lat = request.location?.latitude;
                            const lng = request.location?.longitude;
                            if (lat && lng) {
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                                "_blank",
                              );
                            }
                          }}
                          className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <Navigation className="w-4 h-4" />
                          Directions
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accepted Requests */}
              {acceptedRequests.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Accepted Requests ({acceptedRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {acceptedRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 bg-dark-800 rounded-lg opacity-75"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-white">
                              {request.userName}
                            </p>
                            <p className="text-sm text-gray-400">
                              {request.type}
                            </p>
                            {request.respondedByName && (
                              <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                <User className="w-3 h-3" />
                                Responded by {request.respondedByName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const lat = request.location?.latitude;
                                const lng = request.location?.longitude;
                                if (lat && lng) {
                                  window.open(
                                    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                                    "_blank",
                                  );
                                }
                              }}
                              className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                              title="View on map"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                              Accepted
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Map View */}
            <div className="space-y-6 lg:sticky lg:top-24">
              <div
                className="card p-6 overflow-hidden"
                style={{ height: "500px" }}
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  Live Location Map
                </h3>
                <div className="h-[calc(100%-3rem)] overflow-hidden">
                  <MapView
                    requests={pendingRequests}
                    selectedRequest={selectedRequest}
                  />
                </div>
              </div>

              {/* Active Request Locations */}
              {pendingRequests.length > 0 && (
                <div className="card p-6" style={{ maxHeight: "400px" }}>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-500" />
                    Active Request Locations ({pendingRequests.length})
                  </h3>
                  <div
                    className="space-y-2 overflow-y-auto"
                    style={{ maxHeight: "300px" }}
                  >
                    {pendingRequests.map((request, index) => (
                      <div
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-dark-700 ${
                          selectedRequest?.id === request.id
                            ? "bg-primary-600/20 border border-primary-600"
                            : "bg-dark-800"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {request.userName}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" />
                              {request.userId}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              📍{" "}
                              {request.location?.latitude?.toFixed?.(4) || "—"},{" "}
                              {request.location?.longitude?.toFixed?.(4) || "—"}
                            </p>
                            <p className="text-xs text-red-400 mt-1 font-semibold">
                              {request.type}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <AnalyticsCharts analytics={analytics} />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
