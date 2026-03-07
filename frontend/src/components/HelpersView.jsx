import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  LogOut,
  User,
  Building2,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Hospital,
  Flame,
  HandHeart,
  ShieldCheck,
  Search,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getServiceProviders } from "../utils/api";

const HelpersView = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", name: "All Helpers", icon: Building2, role: null },
    { id: "hospital", name: "Hospitals", icon: Hospital, role: "hospital" },
    { id: "police", name: "Police", icon: ShieldCheck, role: "police" },
    { id: "fire", name: "Fire Department", icon: Flame, role: "fire" },
    { id: "ngo", name: "NGOs", icon: HandHeart, role: "ngo" },
  ];

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [selectedCategory, providers, searchQuery]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await getServiceProviders();
      setProviders(response.providers);
    } catch (error) {
      console.error("Error loading service providers:", error);
      alert("Error loading service providers: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterProviders = () => {
    let filtered = providers;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.role === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.service_id.toLowerCase().includes(query) ||
          p.phone.toLowerCase().includes(query) ||
          p.address.toLowerCase().includes(query),
      );
    }

    setFilteredProviders(filtered);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleBack = () => {
    navigate("/admin-dashboard");
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "hospital":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "police":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
      case "fire":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "ngo":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "hospital":
        return "Hospital";
      case "police":
        return "Police";
      case "fire":
        return "Fire Department";
      case "ngo":
        return "NGO";
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Header */}
      <header className="bg-dark-900/80 backdrop-blur-sm border-b border-dark-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Service Providers
                </h1>
                <p className="text-xs text-gray-400">Registered Helpers</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="card p-4 sticky top-24">
              <h2 className="text-lg font-bold text-white mb-4">Categories</h2>
              <nav className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.id;
                  const count =
                    category.id === "all"
                      ? providers.length
                      : providers.filter((p) => p.role === category.role)
                          .length;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? "bg-red-500/20 border border-red-500/30 text-red-400"
                          : "bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isActive
                            ? "bg-red-500/30 text-red-300"
                            : "bg-dark-700 text-gray-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="card p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, phone, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {filteredProviders.length}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedCategory === "all"
                      ? "Total Service Providers"
                      : `${getRoleLabel(selectedCategory)} Helpers`}
                  </p>
                </div>
                <Building2 className="w-12 h-12 text-red-500 opacity-50" />
              </div>
            </div>

            {/* Providers List */}
            {loading ? (
              <div className="card p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
                <p className="text-gray-400 mt-4">
                  Loading service providers...
                </p>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="card p-8 text-center">
                <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No service providers found</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-sm text-white transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="card p-6 hover:border-red-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">
                            {provider.name}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                              provider.role,
                            )}`}
                          >
                            {getRoleLabel(provider.role)}
                          </span>
                          {provider.is_active ? (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-400">
                              <XCircle className="w-4 h-4" />
                              Inactive
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Helper ID:</span>
                            <span className="text-white font-mono">
                              {provider.service_id}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Contact:</span>
                            <span className="text-white">
                              {provider.phone || "Not provided"}
                            </span>
                          </div>

                          {provider.address && (
                            <div className="flex items-start gap-2 text-sm md:col-span-2">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                              <span className="text-gray-500">Location:</span>
                              <span className="text-white">
                                {provider.address}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpersView;
