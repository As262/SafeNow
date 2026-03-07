import { useState, useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import SplashScreen from "./components/SplashScreen";

// Lazy load components for faster initial load
const Login = lazy(() => import("./components/Login"));
const UserDashboard = lazy(() => import("./components/UserDashboard"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const ServiceDashboard = lazy(() => import("./components/ServiceDashboard"));
const HelpersView = lazy(() => import("./components/HelpersView"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white text-lg font-semibold">Loading...</p>
    </div>
  </div>
);

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Skip splash on refresh - only show on first visit
    const splashShown = sessionStorage.getItem("splashShown");
    return !splashShown;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected User Route */}
              <Route
                path="/user-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["user"]}>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Route */}
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Helpers Route */}
              <Route
                path="/admin/helpers"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <HelpersView />
                  </ProtectedRoute>
                }
              />

              {/* Protected Hospital Route */}
              <Route
                path="/hospital-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["hospital"]}>
                    <ServiceDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Fire Department Route */}
              <Route
                path="/fire-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["fire"]}>
                    <ServiceDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected NGO Route */}
              <Route
                path="/ngo-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["ngo"]}>
                    <ServiceDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Police Route */}
              <Route
                path="/police-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["police"]}>
                    <ServiceDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
