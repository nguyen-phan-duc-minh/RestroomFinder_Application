# 🚽 Restroom Finder App - Project Structure

**Author:** Nguyễn Phan Đức Minh  
**Role:** AI Researcher | Deep Learning, Machine Learning, Education Technology

## 📱 Overview
Restroom Finder là ứng dụng di động được phát triển bằng **React Native Expo** với backend **Flask Python**, giúp người dùng tìm kiếm và sử dụng nhà vệ sinh công cộng một cách tiện lợi.

## 🏗️ Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native với Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation v7
- **State Management**: React Context API
- **Maps**: React Native Maps
- **Camera**: Expo Camera & Image Picker
- **Location**: Expo Location
- **UI Icons**: Expo Vector Icons

### Backend (API Server)
- **Framework**: Flask (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **CORS**: Flask-CORS
- **Authentication**: Simple email/password
- **File Upload**: Base64 image handling

## 📁 Project Structure

```
RestroomFinderApp-main/
├── 📱 Frontend (React Native Expo)
│   ├── App.tsx                     # Main app entry point
│   ├── index.ts                   # Expo entry point
│   ├── app.json                   # Expo configuration
│   ├── package.json               # Dependencies & scripts
│   ├── tsconfig.json             # TypeScript configuration
│   │
│   ├── assets/                    # App assets
│   │   ├── icon.png              # App icon
│   │   ├── splash-icon.png       # Splash screen
│   │   ├── adaptive-icon.png     # Android adaptive icon
│   │   └── favicon.png           # Web favicon
│   │
│   └── src/                      # Source code
│       ├── components/           # Reusable UI components
│       │   └── ImageViewer.tsx   # Full-screen image viewer
│       │
│       ├── context/              # React Context providers
│       │   └── UserContext.tsx   # User authentication state
│       │
│       ├── navigation/           # Navigation configuration
│       │   └── MainTabs.tsx      # Bottom tab navigation
│       │
│       ├── screens/              # Screen components
│       │   ├── RoleSelectionScreen.tsx      # Choose user/owner role
│       │   ├── OwnerRegistrationScreen.tsx  # Owner signup
│       │   ├── OwnerDashboard.tsx           # Owner main dashboard
│       │   │
│       │   ├── owner/            # Owner-specific screens
│       │   │   ├── AddRestroomScreen.tsx         # Add new restroom
│       │   │   ├── OwnerRestroomListScreen.tsx   # Manage restrooms
│       │   │   ├── OwnerRestroomDetailScreen.tsx # Restroom details
│       │   │   ├── OwnerNotificationsScreen.tsx  # Notifications
│       │   │   └── OwnerAccountScreen.tsx        # Account settings
│       │   │
│       │   └── user/             # User-specific screens
│       │       ├── LoginScreen.tsx          # User login
│       │       ├── RegisterScreen.tsx       # User signup
│       │       ├── MainScreen.tsx           # Map with restrooms
│       │       ├── RestaurantDetailScreen.tsx # Restroom details
│       │       ├── NavigationScreen.tsx     # Directions
│       │       ├── PaymentScreen.tsx        # Payment options
│       │       ├── PaymentStatusScreen.tsx  # Payment confirmation
│       │       ├── UsageScreen.tsx          # Timer & usage controls
│       │       ├── ChatScreen.tsx           # Chat with owner
│       │       ├── ReviewScreen.tsx         # Leave reviews
│       │       ├── HistoryScreen.tsx        # Usage history
│       │       └── ProfileScreen.tsx        # User profile
│       │
│       ├── services/             # API and external services
│       │   └── api.ts            # Backend API calls
│       │
│       ├── types/                # TypeScript type definitions
│       │   └── index.ts          # App-wide types
│       │
│       └── theme/                # (Empty) Theme configuration
│
├── 🐍 Backend (Flask API)
│   ├── app.py                    # Main Flask application
│   ├── requirements.txt          # Python dependencies
│   └── restroom_finder.db        # SQLite database
│
├── 📋 Configuration
│   ├── .gitignore               # Git ignore rules
│   ├── .expo/                   # Expo build cache
│   └── .vscode/                 # VSCode settings
│
└── 📚 Documentation
    └── README.md                # Project documentation
```

## 🎯 Core Features

### 👤 User Features
- **🗺️ Map View**: Interactive map showing nearby restrooms
- **📍 Location Services**: GPS-based restroom discovery
- **💳 Payment System**: Cash/transfer payment options
- **⏱️ Usage Timer**: 30-minute usage with 10-minute extensions
- **💬 Real-time Chat**: Communication with restroom owners
- **⭐ Reviews & Ratings**: 5-star rating system
- **📱 SOS & Requests**: Emergency help and toilet paper requests
- **📊 Usage History**: Track past restroom visits

### 🏪 Owner Features
- **➕ Restroom Management**: Add, edit, and manage restrooms
- **📸 Image Upload**: Multiple photos per restroom
- **💰 Payment Confirmation**: Approve/reject transfer payments
- **🔔 Notifications**: Real-time user requests and alerts
- **📈 Analytics**: Usage statistics and user counts
- **⚙️ Settings**: Pricing, facilities, and availability

## 🔧 Database Schema

### Core Models
- **User**: User accounts and authentication
- **Owner**: Restroom owner accounts
- **Restroom**: Restroom locations and details
- **Review**: User reviews and ratings
- **Payment**: Payment transactions and confirmations
- **Notification**: Real-time notifications
- **ChatMessage**: Chat messages between users and owners
- **UsageHistory**: Track restroom usage sessions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- Expo CLI
- Android Studio / Xcode (for device testing)

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android  # Android
npm run ios      # iOS
npm run web      # Web browser
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# or
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Start Flask server
python app.py
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/check-username/<username>` - Check username availability

### Restrooms
- `GET /api/restrooms` - Get all restrooms
- `GET /api/restrooms/<id>` - Get restroom details
- `POST /api/owner/restrooms` - Create new restroom
- `PUT /api/owner/restrooms/<id>` - Update restroom

### Payments
- `POST /api/payments` - Create payment
- `POST /api/payments/<id>/confirm` - Confirm/reject payment
- `GET /api/users/<id>/payment-status/<restroom_id>` - Check payment status

### Usage & Reviews
- `POST /api/users/<id>/start-using/<restroom_id>` - Start using restroom
- `POST /api/users/<id>/stop-using` - Stop using restroom
- `POST /api/reviews` - Submit review
- `GET /api/users/<id>/history` - Get usage history

### Notifications & Chat
- `GET /api/owner/<email>/notifications` - Get owner notifications
- `POST /api/chat/messages` - Send chat message
- `GET /api/chat/messages/<restroom_id>` - Get chat history

## 🎨 UI/UX Features

### Design System
- **Color Scheme**: Green primary (#00bf63), clean whites and grays
- **Typography**: System fonts with clear hierarchy
- **Icons**: Expo Vector Icons for consistency
- **Navigation**: Bottom tabs for users, stack navigation for workflows

### User Experience
- **Onboarding**: Role selection (User/Owner) → Registration/Login
- **Map Integration**: Interactive markers with real-time data
- **Payment Flow**: Upload receipt → Wait for confirmation → Auto-redirect
- **Timer Interface**: Large countdown with color-coded status
- **Image Handling**: Multi-image upload with preview and full-screen viewer

## 📊 Key Metrics & Settings

### Timing Configuration
- **Usage Time**: 30 minutes initial + 10-minute extensions
- **Payment Timeout**: 2 minutes for owner confirmation
- **Polling Interval**: 10 seconds for status checks

### Location Coverage
- **Primary Area**: Dĩ An, Bình Dương, Vietnam
- **Range**: 100m - 2km from user location
- **Sample Locations**: 8 preset restrooms with real businesses

### Rating System
- **Default Rating**: 5.0 stars for all restrooms
- **Review System**: Comment + star rating
- **Display**: Average rating with review count

## 🔒 Security & Privacy

### Authentication
- Simple email/password system
- Owner verification through business registration
- Session management via React Context

### Data Protection
- Local SQLite database
- Base64 image encoding for transfers
- CORS protection for API endpoints

### Payment Security
- Image-based payment confirmation
- Owner manual verification
- Transaction history tracking

## 🚀 Deployment

### Mobile App
- **Development**: Expo Go app for testing
- **Production**: Build APK/IPA through Expo Build Services
- **Distribution**: Google Play Store / Apple App Store

### Backend API
- **Development**: Local Flask server (localhost:5002)
- **Production**: Deploy to cloud services (Heroku, AWS, etc.)
- **Database**: Upgrade to PostgreSQL for production

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for better restroom accessibility in Vietnam** 🇻🇳
