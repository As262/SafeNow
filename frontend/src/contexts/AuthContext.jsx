import { createContext, useContext, useState, useEffect } from "react";
import { logoutUser } from "../utils/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in sessionStorage (per-window session)
    const storedUser = sessionStorage.getItem("safeNowUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        sessionStorage.removeItem("safeNowUser");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token, refresh) => {
    // Store user data along with tokens
    const userWithToken = {
      ...userData,
      token,
      refresh,
    };
    setUser(userWithToken);
    sessionStorage.setItem("safeNowUser", JSON.stringify(userWithToken));
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      sessionStorage.setItem("safeNowUser", JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Continue logout even if API call fails
    }
    setUser(null);
    sessionStorage.removeItem("safeNowUser");
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isHospital: user?.role === "hospital",
    isFire: user?.role === "fire",
    isNGO: user?.role === "ngo",
    isServiceProvider: ["admin", "hospital", "fire", "ngo"].includes(
      user?.role,
    ),
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
