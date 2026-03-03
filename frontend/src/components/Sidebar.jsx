import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  AlertCircle,
  Users,
  Map,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Phone,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../utils/translations";

const Sidebar = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAdmin = user?.role === "admin";
  const t = translations[language].sidebar;

  const menuItems = [
    {
      name: t.dashboard,
      icon: LayoutDashboard,
      path: isAdmin ? "/admin-dashboard" : "/user-dashboard",
      section: "dashboard",
    },
    {
      name: t.emergency,
      icon: AlertCircle,
      path: "#",
      section: "emergency",
      highlight: true,
    },
    {
      name: t.contacts,
      icon: Phone,
      path: "#",
      section: "contacts",
    },
    {
      name: t.map,
      icon: Map,
      path: "#",
      section: "map",
    },
    {
      name: t.settings,
      icon: Settings,
      path: "#",
      section: "settings",
    },
  ];

  const handleNavigation = (item) => {
    if (onNavigate) {
      onNavigate(item.section);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-dark-900 border-r border-dark-800 transition-all duration-300 z-50 flex flex-col ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-dark-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <h1 className="text-lg font-bold text-white whitespace-nowrap">
                    SafeNow
                  </h1>
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    {isAdmin ? "Admin Portal" : "Emergency Help"}
                  </p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 hover:bg-dark-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="mt-3 w-full p-1 hover:bg-dark-800 rounded-lg transition-colors mx-auto flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-4 border-b border-dark-800">
            <div className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-400">
                  {isAdmin ? "Administrator" : "User"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.hash === `#${item.section}` ||
                (item.section === "dashboard" &&
                  location.pathname === item.path &&
                  !location.hash);

              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30"
                      : item.highlight
                        ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        : "text-gray-400 hover:bg-dark-800 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`flex-shrink-0 ${
                      isCollapsed ? "w-6 h-6" : "w-5 h-5"
                    } ${
                      isActive
                        ? "text-white"
                        : item.highlight
                          ? "text-red-400 group-hover:text-red-300"
                          : "text-gray-400 group-hover:text-white"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="font-medium text-sm whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
                  {item.highlight && !isCollapsed && (
                    <span className="ml-auto">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-dark-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
          >
            <LogOut
              className={`flex-shrink-0 ${
                isCollapsed ? "w-6 h-6" : "w-5 h-5"
              } text-gray-400 group-hover:text-red-400`}
            />
            {!isCollapsed && (
              <span className="font-medium text-sm">{t.logout}</span>
            )}
          </button>
        </div>
      </aside>

      {/* Spacer */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      />
    </>
  );
};

export default Sidebar;
