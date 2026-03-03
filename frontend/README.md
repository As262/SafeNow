# SafeNow - Real-Time Emergency Help Platform

A comprehensive React frontend for a real-time emergency help platform that connects users with emergency services through a mobile number + OTP authentication system.

## 🚀 Features

### User Features

- **Mobile OTP Authentication**: Secure login using mobile number and OTP verification
- **One-Click SOS Button**: Large, prominent emergency button for quick access
- **Real-Time Location**: Automatic GPS location capture using browser Geolocation API
- **Multiple Request Types**: Choose from Ambulance, Police, Medical Help, or NGO Support
- **Request History**: View past emergency requests and their status
- **Profile Management**: View and manage user profile information

### Admin Features

- **Real-Time Dashboard**: Live view of all incoming SOS requests
- **Interactive Map**: Google Maps integration showing user locations
- **Request Management**: Accept or reject emergency requests
- **Analytics Dashboard**: Comprehensive charts showing:
  - Request distribution by type
  - Response time analytics
  - Performance metrics
  - System statistics
- **Live Notifications**: Real-time alerts for new SOS requests

## 🛠️ Tech Stack

- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Recharts**: Analytics and data visualization
- **Google Maps React**: Map integration
- **Socket.io Client**: Real-time communication (mock implementation)
- **Context API**: State management

## 📦 Installation

1. **Navigate to the frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Optional - Add Google Maps API Key:**
   - Open `src/components/MapView.jsx`
   - Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual Google Maps API key
   - Get your API key from: https://developers.google.com/maps/documentation/javascript/get-api-key

## 🚀 Running the Application

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Open your browser and navigate to:**
   ```
   http://localhost:5173
   ```

## 🔐 Authentication

The application uses Twilio OTP-based authentication via the Django backend.

1. Enter any 10-digit mobile number
2. Click "Send OTP"
3. In development mode, the OTP will be shown in the API response and server console
4. Enter the OTP and click "Verify & Login"
5. First login with a number auto-creates an account (user role by default)
6. To create an admin, use Django admin or management shell

## 📱 Features Demonstration

### Login Flow

1. Enter a 10-digit mobile number
2. Click "Send OTP"
3. OTP will be displayed on screen (in blue box) and in console
4. Enter the OTP and click "Verify & Login"
5. System will redirect based on user role:
   - Admin → Admin Dashboard
   - User → User Dashboard

### User Dashboard - Sending SOS

1. Select request type (Ambulance, Police, Medical Help, or NGO)
2. Click the large red SOS button
3. Allow location access when prompted
4. Confirm the emergency request
5. Request is sent to admins in real-time
6. View status in request history

### Admin Dashboard

1. View all pending SOS requests
2. Click on a request to see location on map
3. Accept or reject requests
4. Switch to Analytics tab to view:
   - Request distribution charts
   - Response time trends
   - Performance metrics

## 🏗️ Project Structure

```
frontend/
├── public/
│   └── manifest.json          # PWA manifest
├── src/
│   ├── components/
│   │   ├── Login.jsx          # Login and OTP verification
│   │   ├── UserDashboard.jsx  # User dashboard with SOS
│   │   ├── AdminDashboard.jsx # Admin dashboard
│   │   ├── MapView.jsx        # Google Maps integration
│   │   ├── AnalyticsCharts.jsx # Analytics visualizations
│   │   └── ProtectedRoute.jsx # Route protection
│   ├── contexts/
│   │   └── AuthContext.jsx    # Authentication context
│   ├── hooks/
│   │   ├── useGeolocation.js  # Location hook
│   │   └── useWebSocket.js    # WebSocket hook (mock)
│   ├── utils/
│   │   └── mockApi.js         # Mock API functions
│   ├── App.jsx                # Main app with routing
│   ├── App.css                # App styles
│   ├── index.css              # Tailwind directives
│   └── main.jsx               # Entry point
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## 🎨 Design Features

- **Dark Theme**: Modern dark theme optimized for safety applications
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Animations**: Smooth transitions and loading states
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **PWA Support**: Installable as a Progressive Web App

## 🔧 Configuration

### Tailwind CSS

Tailwind is configured with custom colors and animations in `tailwind.config.js`:

- Primary red theme for emergency focus
- Dark color palette
- Custom animations (pulse-slow, ping-slow)

### Build Configuration

- Vite for fast development and optimized builds
- PostCSS for Tailwind processing
- Hot Module Replacement (HMR) enabled

## 📊 Mock Data

The application includes comprehensive mock data:

- User profiles (admin and regular users)
- Historical requests
- Real-time request simulation
- Analytics data

To integrate with a real backend:

1. Replace mock API calls in `src/utils/mockApi.js`
2. Update WebSocket connection in `src/hooks/useWebSocket.js`
3. Add actual Google Maps API key
4. Configure environment variables

## 🚀 Production Build

```bash
npm run build
```

The optimized build will be created in the `dist` directory.

## 🔒 Security Features

- OTP-based authentication
- Role-based access control (RBAC)
- Protected routes with authentication guards
- Secure session management with localStorage
- Location permission handling

## 📱 PWA Features

- Offline capability (basic structure ready)
- Installable on mobile devices
- App-like experience
- Custom app icons and splash screens

## 🎯 Future Enhancements

1. **Backend Integration**:
   - Connect to Firebase Auth or custom backend
   - Real WebSocket implementation
   - Database for persistent storage

2. **Additional Features**:
   - Push notifications
   - Voice calling integration
   - Photo/video evidence upload
   - Multi-language support
   - Offline SOS queue

3. **Enhanced Security**:
   - JWT token authentication
   - Rate limiting
   - HTTPS enforcement
   - Data encryption

## 🐛 Known Limitations

1. **Mock Implementation**: All API calls and WebSocket connections are mocked
2. **Google Maps**: Requires API key for full functionality (placeholder shown otherwise)
3. **Location**: Requires HTTPS in production for Geolocation API
4. **Offline**: Full offline support requires service worker implementation

## 📝 License

MIT License - Feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**Built with ❤️ for women's safety and emergency response**
