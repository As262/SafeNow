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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import {
  getAllSOSRequests,
  updateRequestStatus,
  getAnalytics,
} from "../utils/mockApi";
import MapView from "./MapView";
import AnalyticsCharts from "./AnalyticsCharts";
import Sidebar from "./Sidebar";
import EmergencyContacts from "./EmergencyContacts";
import Settings from "./Settings";

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
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    loadRequests();
    loadAnalytics();
  }, []);

  useEffect(() => {
    // Update requests from WebSocket
    if (wsRequests.length > 0) {
      setRequests(wsRequests);
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    window.location.hash = section;
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
    <div className="flex min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Sidebar */}
      <Sidebar onNavigate={handleSectionChange} />

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Alert Badge */}
        {pendingRequests.length > 0 && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-3">
            <Bell className="w-6 h-6 text-red-500 animate-pulse" />
            <div>
              <p className="text-red-400 font-semibold">
                {pendingRequests.length} Pending Emergency {pendingRequests.length === 1 ? 'Request' : 'Requests'}
              </p>
              <p className="text-red-400/70 text-sm">Immediate attention required</p>
            </div>
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
              <p className="text-gray-400">Real-time emergency request locations</p>
            </div>
            <div className="card p-6" style={{ height: "600px" }}>
              <MapView requests={requests} selectedRequest={selectedRequest} />
            </div>
          </div>
        ) : activeSection === "emergency" ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Emergency Management</h2>
              <p className="text-gray-400">Monitor and respond to emergency requests</p>
            </div>
            
            {/* Emergency Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-400">
                    Critical
                  </h3>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-white">
                  {pendingRequests.filter(r => r.type === "Ambulance").length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Medical emergencies</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-400">
                    Security
                  </h3>
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-white">
                  {pendingRequests.filter(r => r.type === "Police").length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Police assistance</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-400">
                    Response Time
                  </h3>
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-white">9.2m</p>
                <p className="text-xs text-gray-500 mt-1">Average today</p>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Active Emergency Requests
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
                <div className="grid gap-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition-all"
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
                          {request.location.address ||
                            `${request.location.latitude.toFixed(4)}, ${request.location.longitude.toFixed(4)}`}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Dashboard Content */}
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
                            {request.location.address ||
                              `${request.location.latitude.toFixed(4)}, ${request.location.longitude.toFixed(4)}`}
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
                          <div>
                            <p className="font-semibold text-white">
                              {request.userName}
                            </p>
                            <p className="text-sm text-gray-400">
                              {request.type}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                            Accepted
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Map View */}
            <div
              className="card p-6 lg:sticky lg:top-24"
              style={{ height: "600px" }}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                Live Location Map
              </h3>
              <MapView
                requests={pendingRequests}
                selectedRequest={selectedRequest}
              />
            </div>
          </div>
        ) : (
          <AnalyticsCharts analytics={analytics} />
        )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
