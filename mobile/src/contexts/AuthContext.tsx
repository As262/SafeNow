import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutUser } from '../api/client';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from AsyncStorage on app start
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('safeNowUser');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
        await AsyncStorage.removeItem('safeNowUser');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (userData: User, accessToken: string, refreshToken: string): Promise<void> => {
    // Store user data along with tokens
    const userWithToken = {
      ...userData,
      token: accessToken,
      refresh: refreshToken,
    };
    setUser(userWithToken as User);
    await AsyncStorage.setItem('safeNowUser', JSON.stringify(userWithToken));
  };

  const updateUser = async (updatedFields: Partial<User>): Promise<void> => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      AsyncStorage.setItem('safeNowUser', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue logout even if API call fails
    }
    setUser(null);
    await AsyncStorage.removeItem('safeNowUser');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
    isAdmin: user?.role === 'admin',
    isHospital: user?.role === 'hospital',
    isFire: user?.role === 'fire',
    isNGO: user?.role === 'ngo',
    isPolice: user?.role === 'police',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
