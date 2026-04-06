# SafeNow Mobile - React Native App

React Native mobile application for SafeNow emergency response platform, converted from the React web version.

## Features

- 🚨 Emergency SOS System with GPS location
- 📱 Real-time WebSocket notifications
- 🗺️ Interactive maps (react-native-maps)
- 🎙️ AI Safety Chatbot with voice input/output
- 💰 Points/Rewards system for helpers
- 🌍 Multi-language support (English/Hindi)
- 👤 Multi-role authentication (Users, Service Providers, Admin)
- 📊 Analytics dashboards

## Tech Stack

- **Framework**: React Native with Expo SDK 55
- **Language**: TypeScript
- **Navigation**: React Navigation v7 (Stack, Drawer, Bottom Tabs)
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Maps**: react-native-maps
- **Voice**: expo-speech, @react-native-voice/voice
- **Charts**: victory-native
- **Icons**: lucide-react-native
- **Real-time**: WebSocket (socket.io-client)

## Prerequisites

- Node.js >= 18
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Expo Go app on physical device (optional)

## Installation

```bash
cd mobile
npm install
```

## Configuration

### 1. Update Backend URLs

Edit `app.json` and update the `extra` section with your backend URLs:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_BACKEND_IP:8000/api",
      "wsUrl": "ws://YOUR_BACKEND_IP:8000/ws"
    }
  }
}
```

**Note**: Replace `YOUR_BACKEND_IP` with your computer's local IP address (not `localhost`).

### 2. Google Maps API Keys

Add your Google Maps API keys in `app.json`:

```json
{
  "ios": {
    "config": {
      "googleMapsApiKey": "YOUR_IOS_API_KEY"
    }
  },
  "android": {
    "config": {
      "googleMaps": {
        "apiKey": "YOUR_ANDROID_API_KEY"
      }
    }
  }
}
```

Get API keys from: https://console.cloud.google.com/

## Running the App

### Development Mode

```bash
npm start
```

This will start the Expo development server. You can then:

- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan QR code with Expo Go app on your phone

### Specific Platforms

```bash
# iOS
npm run ios

# Android
npm run android

# Web (Progressive Web App)
npm run web
```

## Project Structure

```
mobile/
├── src/
│   ├── api/              # API client with AsyncStorage
│   │   └── client.ts
│   ├── components/       # Reusable components
│   │   ├── common/
│   │   ├── sos/
│   │   ├── chatbot/
│   │   └── map/
│   ├── contexts/         # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   ├── hooks/            # Custom hooks
│   │   ├── useGeolocation.ts
│   │   └── useWebSocket.ts
│   ├── navigation/       # Navigation structure
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── DrawerNavigator.tsx
│   ├── screens/          # All app screens
│   │   ├── auth/
│   │   ├── user/
│   │   ├── service/
│   │   └── admin/
│   ├── styles/           # Theme and styling
│   │   └── theme.ts
│   ├── types/            # TypeScript definitions
│   │   └── index.ts
│   └── utils/            # Utility functions
│       └── translations.ts
├── app.json              # Expo configuration
├── App.tsx               # App entry point
└── package.json
```

## Authentication

### Demo Credentials

**User Login (OTP)**:
- Mobile: `1234567890`
- OTP: `000000`

**Service Provider Login**:
- Hospital: `1004782` / `hospital123`
- NGO: `2003456` / `ngo123`
- Fire: `3001234` / `fire123`
- Admin: `4005678` / `admin123`
- Police: `5002345` / `police123`

## Key Features Implementation

### 1. Navigation

The app uses a nested navigation structure:
- **Auth Stack**: Splash → Login
- **Main App**:
  - **Users**: Bottom Tabs (Dashboard, Map, History, Helper, Contacts, Wallet, Settings)
  - **Service Providers**: Service Dashboard
  - **Admin**: Stack Navigator (Admin Dashboard, Helpers View)

### 2. Async Storage

Replaced `sessionStorage`/`localStorage` with AsyncStorage:
- User authentication data
- Language preferences
- App settings

### 3. Geolocation

Using `expo-location` instead of navigator.geolocation:
- Requests permissions (foreground/background)
- High accuracy location tracking
- Works on both iOS and Android

### 4. Real-time Updates

WebSocket implementation preserved from web version:
- Connects based on user role
- Auto-reconnection with exponential backoff
- Ping/pong keep-alive

## Permissions

### iOS (in app.json)

- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysUsageDescription`
- `NSMicrophoneUsageDescription`
- `NSSpeechRecognitionUsageDescription`

### Android (in app.json)

- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`
- `RECORD_AUDIO`
- `INTERNET`

## Building for Production

### EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for both platforms
eas build --platform all

# Build for specific platform
eas build --platform ios
eas build --platform android
```

### Local Build

```bash
# Generate native code
npx expo prebuild

# iOS (requires Mac)
npm run ios

# Android
npm run android
```

## Troubleshooting

### "Unable to resolve module"

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

### Metro bundler issues

```bash
# Reset Metro cache
npx expo start --clear
```

### Android build errors

```bash
cd android && ./gradlew clean
cd .. && npm run android
```

### iOS pod install errors

```bash
cd ios && pod install
cd .. && npm run ios
```

## Testing

```bash
# Run tests (when configured)
npm test

# Type checking
npx tsc --noEmit
```

## Deployment

### iOS App Store

1. Build with EAS: `eas build --platform ios`
2. Download `.ipa` file
3. Upload to App Store Connect
4. Submit for review

### Google Play Store

1. Build with EAS: `eas build --platform android`
2. Download `.aab` file
3. Upload to Google Play Console
4. Submit for review

## Migration from Web

Key changes from React web version:

| Web | React Native |
|-----|--------------|
| `div`, `span` | `View`, `Text` |
| `button` | `TouchableOpacity` |
| `input` | `TextInput` |
| CSS/Tailwind | StyleSheet / NativeWind |
| `react-router-dom` | `@react-navigation/native` |
| `navigator.geolocation` | `expo-location` |
| `localStorage` | `@react-native-async-storage/async-storage` |
| `window.location.href` | `Linking.openURL()` |
| `react-leaflet` | `react-native-maps` |
| `recharts` | `victory-native` |

## Next Steps

1. Implement full UserDashboard with SOS button
2. Add react-native-maps integration
3. Add voice chatbot functionality
4. Implement push notifications
5. Add offline support
6. Optimize performance

## License

Same as parent project

## Support

For issues or questions, refer to the main project README or create an issue on GitHub.
