import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Login from "./components/Login";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ServiceDashboard from "./components/ServiceDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./components/SplashScreen";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if splash has been shown in this session
    const splashShown = sessionStorage.getItem("splashShown");
    if (splashShown) {
      setShowSplash(false);
    }
  }, []);

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
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
