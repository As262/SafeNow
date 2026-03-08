<div align="center">
  <h1>🛡️ SafeNow</h1>
  <p><strong>Real-Time Emergency Help Platform</strong></p>
  <p>Connecting users with emergency services through instant SOS alerts and real-time location tracking</p>
  
  ![React](https://img.shields.io/badge/React-18.0-61DAFB?style=flat&logo=react)
  ![Django](https://img.shields.io/badge/Django-5.0-092E20?style=flat&logo=django)
  ![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-orange?style=flat)
  ![License](https://img.shields.io/badge/License-MIT-green?style=flat)
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [User Roles](#user-roles)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**SafeNow** is a comprehensive emergency response platform that enables users to send instant SOS alerts to nearby emergency services with real-time location tracking. The platform features role-based authentication, live WebSocket notifications, AI-powered chatbot assistance, and a points-based reward system for community helpers.

### Why SafeNow?

- ⚡ **Instant Response**: One-click SOS button for emergencies
- 📍 **Real-Time Tracking**: GPS location sharing with emergency services
- 🔔 **Live Notifications**: WebSocket-powered instant alerts
- 🤖 **AI Chatbot**: Intelligent emergency assistance and guidance
- 🏆 **Points System**: Reward community helpers for their service
- 🌐 **Multi-Language**: Support for English and Hindi

---

## ✨ Key Features

### For Users (Emergency Requesters)

- **Mobile OTP Authentication**: Secure login via SMS verification (Twilio)
- **One-Click SOS**: Large emergency button for quick access
- **Multiple Emergency Types**: Ambulance, Police, Fire, NGO Support
- **Real-Time Location**: Automatic GPS coordinates capture
- **Emergency Contacts**: Manage personal emergency contacts
- **Request History**: Track all past SOS requests and their status
- **Live Map**: View nearby helpers and services
- **Profile Management**: Update personal information and preferences
- **Multi-Language Support**: Switch between English and Hindi

### For Helpers (Community Volunteers)

- **Volunteer Dashboard**: Accept nearby emergency requests
- **Availability Toggle**: Control when you're available to help
- **Points & Earnings**: Earn points for helping others
- **Request Queue**: View and respond to nearby SOS alerts
- **Location-Based Matching**: Receive requests based on proximity
- **Helper Leaderboard**: Track your community contribution

### For Service Providers (Emergency Services)

- **Service Dashboard**: Dedicated interfaces for Hospitals, Police, Fire, NGO
- **Real-Time Alerts**: Instant notifications for new emergencies
- **Request Management**: Accept, reject, or mark requests as complete
- **Location Tracking**: View requester location on interactive map
- **History & Analytics**: View all handled requests
- **Multi-Service Support**: Separate portals for different service types

### For Admins

- **Admin Dashboard**: Complete oversight of all platform activities
- **Analytics & Charts**:
  - Request distribution by type
  - Response time analytics
  - User statistics and trends
  - Service provider performance
- **User Management**: View and manage all users
- **Request Monitoring**: Track all SOS requests in real-time
- **System Settings**: Configure platform parameters

### Advanced Features

- **AI Chatbot Integration**: Get emergency guidance and support
- **WebSocket Real-Time Updates**: Live notifications without page refresh
- **Points Reward System**: Gamification for community helpers
- **PWA Support**: Install as a mobile app
- **Splash Screen**: Professional loading experience
- **Dark Mode UI**: Eye-friendly dark theme throughout
- **Responsive Design**: Works seamlessly on mobile and desktop

---

## 🛠️ Tech Stack

### Frontend

| Technology   | Purpose                        |
| ------------ | ------------------------------ |
| React 18     | UI Framework with Hooks        |
| Vite         | Fast build tool and dev server |
| Tailwind CSS | Utility-first styling          |
| React Router | Client-side routing            |
| Lucide React | Modern icon library            |
| Recharts     | Data visualization             |
| Context API  | State management               |
| WebSocket    | Real-time communication        |

### Backend

| Technology            | Purpose              |
| --------------------- | -------------------- |
| Django 5.0            | Web framework        |
| Django REST Framework | RESTful API          |
| Django Channels       | WebSocket support    |
| Daphne                | ASGI server          |
| Simple JWT            | Token authentication |
| Twilio                | SMS/OTP verification |
| SQLite/PostgreSQL     | Database             |

---

## 📁 Project Structure

```
SafeNow/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── ServiceDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── HelpersView.jsx
│   │   │   ├── EmergencyContacts.jsx
│   │   │   └── ...
│   │   ├── contexts/        # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── LanguageContext.jsx
│   │   ├── utils/           # Utility functions
│   │   │   ├── api.js       # API calls
│   │   │   └── translations.js
│   │   └── assets/          # Static assets
│   ├── public/              # Public files
│   │   ├── favicon.svg
│   │   ├── manifest.json
│   │   └── service-worker.js
│   └── package.json
│
├── backend/                 # Django backend
│   ├── authentication/      # User auth & management
│   │   ├── models.py       # User, ServiceProvider, EmergencyContact
│   │   ├── views.py        # Auth endpoints
│   │   ├── serializers.py  # DRF serializers
│   │   └── points_utils.py # Points system logic
│   ├── sos/                # SOS request system
│   │   ├── models.py       # SOSRequest model
│   │   ├── views.py        # SOS endpoints
│   │   ├── consumers.py    # WebSocket consumers
│   │   └── routing.py      # WebSocket routing
│   ├── analytics/          # Analytics endpoints
│   ├── safenow_backend/    # Django settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── middleware.py
│   ├── manage.py
│   └── requirements.txt
│
├── README.md               # This file
└── documentation/          # Additional docs
    ├── AI_CHATBOT_GUIDE.md
    ├── POINTS_SYSTEM_IMPLEMENTATION.md
    ├── ROLE_BASED_AUTH_IMPLEMENTATION.md
    └── SERVICE_PROVIDER_LOGIN_GUIDE.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **Git**
- **Twilio Account** (for SMS/OTP)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/SafeNow.git
cd SafeNow
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file and add your credentials
# See backend/.env.example for required variables

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Load service providers (optional)
python manage.py loaddata service_providers.json

# Start the development server
python manage.py runserver
```

The backend will run on `http://localhost:8000`

#### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file (if needed)
# VITE_API_URL=http://localhost:8000

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### Environment Variables

#### Backend (.env)

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Database (for production)
DATABASE_URL=postgresql://user:password@localhost/safenow
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 👥 User Roles

### 1. Regular User

- Send SOS alerts
- View request history
- Manage emergency contacts
- Update profile

### 2. Helper (Volunteer)

- Accept nearby emergency requests
- Earn points for helping
- Toggle availability status
- View earnings and contributions

### 3. Service Provider

- **Hospital**: Medical emergencies
- **Police**: Law enforcement assistance
- **Fire**: Fire and rescue services
- **NGO**: Social support services

Each type has a dedicated dashboard for managing requests.

### 4. Admin

- Full platform oversight
- Analytics and reporting
- User management
- System configuration

---

## 📡 API Documentation

### Authentication Endpoints

```
POST   /api/auth/send-otp/          # Send OTP to mobile number
POST   /api/auth/verify-otp/        # Verify OTP and login
POST   /api/auth/register/          # Register new user
POST   /api/auth/logout/            # Logout user
GET    /api/auth/user/              # Get current user info
```

### SOS Endpoints

```
POST   /api/sos/requests/           # Create new SOS request
GET    /api/sos/requests/           # List user's requests
GET    /api/sos/requests/{id}/      # Get request details
PATCH  /api/sos/requests/{id}/      # Update request status
DELETE /api/sos/requests/{id}/      # Cancel request
GET    /api/sos/nearby/             # Get nearby requests (for helpers)
```

### Service Provider Endpoints

```
POST   /api/auth/service-login/    # Service provider login
GET    /api/service/requests/      # Get requests for service type
POST   /api/service/accept/{id}/   # Accept a request
POST   /api/service/reject/{id}/   # Reject a request
```

### Helper Endpoints

```
GET    /api/helpers/available/     # Get available helpers nearby
POST   /api/helpers/toggle/        # Toggle helper availability
GET    /api/helpers/earnings/      # Get helper earnings
```

### WebSocket Events

```
ws://localhost:8000/ws/sos/

Events:
- new_sos_request        # New emergency request
- request_accepted       # Request accepted by service
- request_completed      # Request marked complete
- helper_assigned        # Helper assigned to request
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
python manage.py test
```

### Frontend Tests

```bash
cd frontend
npm run test
```

---

## 📱 Demo Credentials

See [LOGIN_CREDENTIALS.md](LOGIN_CREDENTIALS.md) for test account details:

- **Admin**: Service ID `4001923`
- **Hospital**: Service ID `1004782`
- **Fire**: Service ID `3002156`
- **Police**: Service ID `5003847`
- **NGO**: Service ID `2001429`

All service passwords: `hospital123`, `fire123`, etc.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- **Frontend**: Follow ESLint configuration
- **Backend**: Follow PEP 8 guidelines
- **Commits**: Use conventional commit messages

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Twilio** for SMS/OTP services
- **Lucide** for beautiful icons
- **Tailwind CSS** for styling utilities
- **Django** and **React** communities

---

## 📞 Support

For support, email support@safenow.com or open an issue in the repository.

---

## 🔮 Roadmap

- [ ] Mobile app (React Native)
- [ ] Video call integration
- [ ] Multiple language support (expand beyond Hindi)
- [ ] Payment gateway for donations
- [ ] Advanced analytics dashboard
- [ ] Machine learning for request prioritization
- [ ] Integration with emergency services APIs

---

<div align="center">
  <p>Made with ❤️ by the SafeNow Team</p>
  <p>Your Safety, Our Priority 🛡️</p>
</div>
