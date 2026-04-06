// User and Authentication Types
export interface User {
  id: number;
  mobile: string;
  name: string;
  email?: string;
  role: 'user' | 'admin' | 'hospital' | 'fire' | 'ngo' | 'police';
  is_helper: boolean;
  helper_available: boolean;
  helper_skills?: string[];
  helper_radius_km?: number;
  points: number;
  total_earnings: number;
  total_requests_completed: number;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isAdmin: boolean;
  isHospital: boolean;
  isFire: boolean;
  isNGO: boolean;
  isPolice: boolean;
}

// SOS Request Types
export type SOSType = 'Ambulance' | 'Police' | 'Fire Emergency' | 'Medical Help' | 'NGO Support';
export type SOSStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface SOSRequest {
  id: number;
  user: number;
  user_name?: string;
  user_mobile?: string;
  type: SOSType;
  description: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  status: SOSStatus;
  responded_by?: number;
  responder_name?: string;
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
  response_time?: number;
}

// Emergency Contact Types
export interface EmergencyContact {
  id: number;
  name: string;
  phone_number: string;
  relationship: string;
}

// Location Types
export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: string;
  data: any;
}

// Chatbot Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Points/Transaction Types
export interface PointsTransaction {
  id: number;
  user: number;
  type: 'earned' | 'withdrawn';
  amount: number;
  description: string;
  created_at: string;
}

// Language Types
export type Language = 'en' | 'hi';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  MainApp: undefined;
};

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
};

export type UserTabParamList = {
  Dashboard: undefined;
  Map: undefined;
  History: undefined;
  Helper: undefined;
  Contacts: undefined;
  Wallet: undefined;
  Settings: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  HelpersView: undefined;
};

// API Response Types
export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Analytics Types
export interface AnalyticsData {
  totalRequests: number;
  pendingRequests: number;
  acceptedRequests: number;
  completedRequests: number;
  requestsByType: { type: string; count: number }[];
  averageResponseTime: number;
}
