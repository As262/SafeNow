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
  Ambulance,
  Flame,
  Users,
  AlertCircle,
  Navigation,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../utils/translations";
import { useWebSocket } from "../hooks/useWebSocket";
import { getAllSOSRequests, updateRequestStatus } from "../utils/api";
import MapView from "./MapView";

const ServiceDashboard = () => {
  const { user, logout, isHospital, isFire, isNGO, isPolice } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const { requests: wsRequests, updateRequestStatus: updateWSRequest } =
    useWebSocket(user);

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  // Determine service type and filter criteria
  const getServiceInfo = () => {
    if (isHospital) {
      return {
        name: "Hospital",
        icon: Ambulance,
        color: "red",
        filterTypes: ["Ambulance", "Medical Help"],
      };
    }
    if (isFire) {
      return {
        name: "Fire Department",
        icon: Flame,
        color: "orange",
        filterTypes: ["Fire Emergency"],
      };
    }
    if (isNGO) {
      return {
        name: "NGO",
        icon: Users,
        color: "purple",
        filterTypes: ["NGO Support"],
      };
    }
    if (isPolice) {
      return {
        name: "Police",
        icon: Shield,
        color: "blue",
        filterTypes: ["Police"],
      };
    }
    return {
      name: "Service Provider",
      icon: Shield,
      color: "blue",
      filterTypes: null,
    };
  };

  const serviceInfo = getServiceInfo();

  useEffect(() => {
    loadRequests();
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

  // Filter requests by service type (only show relevant emergency types)
  const filteredRequests = serviceInfo.filterTypes
    ? requests.filter((r) => serviceInfo.filterTypes.includes(r.type))
    : requests;

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

    if (diffMins < 1) return t.common.justNow;
    if (diffMins < 60) return `${diffMins} ${t.common.minAgo}`;
    const diffHours = Math.floor(diffMs / 3600000);
    return `${diffHours} ${diffHours > 1 ? t.common.hoursAgo : t.common.hourAgo}`;
  };

  const pendingRequests = filteredRequests.filter(
    (r) => r.status === "pending",
  );
  const acceptedRequests = filteredRequests.filter(
    (r) => r.status === "accepted",
  );

  const ServiceIcon = serviceInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Header */}
      <header className="bg-dark-900/80 backdrop-blur-sm border-b border-dark-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 bg-gradient-to-br from-${serviceInfo.color}-500 to-${serviceInfo.color}-700 rounded-full flex items-center justify-center`}
              >
                <ServiceIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  SafeNow {serviceInfo.name}
                </h1>
                <p className="text-xs text-gray-400">
                  {t.serviceDashboard.emergencyResponseDashboard}
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

              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-lg">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white font-medium">
                  {user.name || user.service_id}
                </span>
                <span className="text-xs text-gray-500">
                  ({serviceInfo.name})
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">{t.common.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">
                {t.serviceDashboard.pendingRequests}
              </h3>
              <Activity className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {pendingRequests.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">{t.serviceDashboard.awaitingResponse}</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">
                {t.serviceDashboard.acceptedToday}
              </h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {acceptedRequests.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Active responses</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">
                {t.serviceDashboard.totalRequests}
              </h3>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {filteredRequests.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {serviceInfo.filterTypes
                ? serviceInfo.filterTypes.join(" / ")
                : t.serviceDashboard.all}{" "}
              {t.serviceDashboard.type}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests List */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                {t.serviceDashboard.pendingRequests} ({pendingRequests.length})
              </h3>

              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-gray-400 mt-3">{t.serviceDashboard.loadingRequests}</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">
                    {t.serviceDashboard.noPendingRequests}{" "}
                    {serviceInfo.filterTypes
                      ? serviceInfo.filterTypes.join(" / ")
                      : ""}
                  </p>
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
                        <span
                          className={`px-2 py-1 bg-${serviceInfo.color}-500/20 text-${serviceInfo.color}-400 text-xs font-semibold rounded`}
                        >
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
                          {t.common.accept}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectRequest(request.id);
                          }}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          {t.common.reject}
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
                              "_blank"
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
                  {t.serviceDashboard.acceptedRequests} ({acceptedRequests.length})
                </h3>
                <div className="space-y-3">
                  {acceptedRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className={`p-4 bg-dark-800 rounded-lg cursor-pointer transition-all hover:bg-dark-700 ${
                        selectedRequest?.id === request.id
                          ? "ring-2 ring-green-600"
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const lat = request.location?.latitude;
                              const lng = request.location?.longitude;
                              if (lat && lng) {
                                window.open(
                                  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                                  "_blank"
                                );
                              }
                            }}
                            className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                            title="Get Directions"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                            {t.common.accepted}
                          </span>
                        </div>
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

                      <div className="flex items-center gap-2 mt-3 text-sm text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>{t.serviceDashboard.youRespondedToThisRequest}</span>
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
              className="card p-6"
              style={{ height: "350px" }}
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

            {/* Active Request Locations */}
            {pendingRequests.length > 0 && (
              <div className="card p-6" style={{ maxHeight: "400px" }}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-500" />
                  Active Request Locations ({pendingRequests.length})
                </h3>
                <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "300px" }}>
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
                          <span className="text-xs font-bold text-white">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{request.userName}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {request.userId}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {request.location?.latitude?.toFixed?.(4) || '—'},{" "}
                            {request.location?.longitude?.toFixed?.(4) || '—'}
                          </p>
                          <p className="text-xs text-red-400 mt-1 font-semibold">{request.type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServiceDashboard;
