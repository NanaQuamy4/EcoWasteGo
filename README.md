# EcoWasteGo ♻️

EcoWasteGo is a comprehensive mobile waste management platform built with Expo and React Native, connecting customers with recyclers for efficient waste pickup and recycling services. The app features a dual-role system (Customer/Recycler), advanced security, real-time validation, intelligent messaging, live navigation tracking, and environmental impact tracking.

## 🚀 Core Features

### 🔐 Advanced Security & Authentication
- **Supabase Auth Integration**: Secure user authentication with automatic password hashing
- **Role-Based Access Control**: Separate customer and recycler experiences with strict role validation
- **Cross-Role Protection**: Prevents recyclers from accessing customer features and vice versa
- **Email Verification**: 6-digit OTP verification for password reset
- **Privacy Policy Agreement**: Mandatory terms acceptance with version tracking
- **Session Management**: Secure token-based authentication with automatic refresh

### 📱 User Registration & Validation
- **Country-Specific Phone Validation**: Real-time validation for 50+ countries with specific length requirements
- **Enhanced Email Validation**: Comprehensive email format checking with detailed error messages
- **Strong Password Requirements**: 8+ characters, uppercase, lowercase, numbers, special characters
- **Real-Time Form Validation**: Instant feedback with visual indicators (red/green borders)
- **Terms & Conditions**: Mandatory agreement with "I Disagree" default state

### 🏢 Dual-Role System

#### Customer Features
- **Waste Pickup Scheduling**: Select recyclers and schedule pickups
- **Real-Time Tracking**: Live tracking of recycler location and arrival with ETA
- **Payment Management**: Secure payment processing with environmental tax calculation
- **Communication Tools**: Direct call and intelligent text messaging with recyclers
- **History & Analytics**: Comprehensive pickup history with environmental impact
- **Request Approval Workflow**: Submit requests and wait for recycler approval
- **Arrival Notifications**: Real-time alerts when recycler reaches location

#### Recycler Features
- **Immediate Access**: Basic registration → Direct access to recycler dashboard
- **Profile-Based Completion**: Complete registration through user profile
- **Auto-Fill Company Name**: Pre-filled from initial registration
- **Verification Prompts**: Clear guidance for unverified recyclers
- **Pickup Requests**: Receive and manage customer pickup requests with approval workflow
- **Earnings Tracking**: Monitor earnings and performance analytics
- **Profile Management**: Complete business information and verification status
- **Weight Entry**: Record waste weights and generate payment summaries
- **Live Navigation**: Real-time GPS tracking and route optimization
- **Customer Communication**: Intelligent messaging system with smart suggestions

### 💬 **Intelligent Messaging System** 🧠
- **AI-Powered Message Analysis**: Analyzes incoming messages for intent, urgency, and emotion
- **Context-Aware Suggestions**: Provides smart response suggestions based on message content
- **Real-Time Communication**: Instant messaging between recyclers and customers
- **Message Persistence**: All conversations stored in database with conversation history
- **Smart Response Templates**: Contextual responses based on pickup stage and message type
- **Emotion Detection**: Recognizes positive, negative, and neutral emotional tones
- **Urgency Assessment**: Identifies high, medium, and low priority messages
- **Intent Recognition**: Automatically categorizes messages (greeting, question, concern, arrival, etc.)
- **Stage-Based Suggestions**: Different responses for different pickup stages
- **Professional Communication**: Ensures high-quality, appropriate responses

### 🗺️ **Real-Time Navigation & Tracking** 🚗
- **Live GPS Tracking**: Real-time location updates for recyclers and customers
- **Route Optimization**: Intelligent route planning and ETA calculations
- **Distance Monitoring**: Live distance and time-to-arrival updates
- **Arrival Detection**: Automatic detection when recycler reaches customer location
- **Status Synchronization**: Real-time status updates across both user types
- **Location Permissions**: Secure handling of location access
- **Map Integration**: Interactive maps showing current positions and routes
- **Progress Updates**: Continuous tracking updates during pickup process

### ✅ **Request Approval Workflow** 📋
- **Customer Request Submission**: Submit waste pickup requests with details
- **Recycler Review**: Recyclers can view and manage pending requests
- **Accept/Reject System**: Recyclers can accept or reject requests with reasons
- **Status Tracking**: Real-time status updates throughout the process
- **Waiting Screens**: Customer waiting experience with progress indicators
- **Approval Notifications**: Instant alerts for request status changes
- **Database Persistence**: All workflow data stored securely in database

### 💳 Payment & Financial System
- **Environmental Tax**: Automatic 5% environmental tax calculation
- **Payment Summaries**: Detailed breakdown of base amount, tax, and total
- **Payment Approval Flow**: Accept/reject payment summaries with confirmation
- **Secure Transactions**: HTTPS transmission with Supabase backend security

### 🌍 Environmental Impact
- **CO2 Savings Calculation**: Track environmental impact of recycling
- **Eco Impact Celebration**: Post-payment environmental statistics
- **Rewards System**: Achievement tracking for environmental contributions
- **Educational Content**: Recycling education and best practices

### 📊 Analytics & Reporting
- **Customer Analytics**: Pickup history, environmental impact, rewards
- **Recycler Analytics**: Earnings, completed pickups, performance metrics
- **Environmental Tracking**: CO2 saved, trees equivalent, energy hours
- **Real-Time Statistics**: Live updates of user activity and impact

## 🛠️ Technical Architecture

### Frontend (React Native + Expo)
```
EcoWasteGo/
├── app/                          # Main application screens
│   ├── (tabs)/                   # Customer tab navigation
│   ├── (recycler-tabs)/          # Recycler tab navigation
│   ├── customer-screens/         # Customer-specific screens
│   │   ├── WaitingForRecycler.tsx    # Request approval workflow
│   │   ├── TrackingScreen.tsx        # Real-time tracking
│   │   └── TextRecyclerScreen.tsx    # Intelligent messaging
│   ├── recycler-screens/         # Recycler-specific screens
│   │   ├── RecyclerRequests.tsx      # Request management
│   │   ├── RecyclerNavigation.tsx    # Live navigation
│   │   └── RecyclerTextUserScreen.tsx # Intelligent messaging
│   └── components/               # Shared components
├── components/                    # Reusable UI components
├── services/                     # API and external services
│   ├── apiService.ts             # Backend communication
│   └── messageAnalysisService.ts # AI-powered message analysis
├── contexts/                     # React contexts (Auth, etc.)
├── utils/                        # Utility functions
└── assets/                       # Images and fonts
```

### Backend (Node.js + Express + Supabase)
```
backend/
├── src/
│   ├── controllers/              # Business logic handlers
│   │   ├── wasteController.ts    # Waste collection management
│   │   └── textRecyclerController.ts # Messaging system
│   ├── routes/                   # API endpoints
│   │   ├── waste.ts             # Waste collection routes
│   │   └── text-recycler.ts     # Messaging routes
│   ├── middleware/               # Auth, security, validation
│   ├── services/                 # External service integrations
│   └── config/                   # Database and service configs
├── scripts/                      # Database setup and migrations
│   ├── waste-collections-migration.sql    # Workflow database
│   └── chat-messages-migration.sql        # Messaging database
└── package.json
```

### Database Schema (Supabase)
- **users**: User profiles with role-based fields
- **email_verifications**: OTP storage for password reset
- **waste_collections**: Pickup requests and tracking with approval workflow
- **chat_messages**: Real-time messaging between users with RLS policies
- **payments**: Transaction records
- **notifications**: User notifications
- **analytics**: Performance and impact data

## 🔒 Security Implementation

### Authentication Security
- **Supabase Auth**: Industry-standard authentication with bcrypt hashing
- **JWT Tokens**: Secure session management with automatic refresh
- **HTTPS Transmission**: All API calls use secure protocols
- **Rate Limiting**: Protection against brute force attacks
- **Role-Based Authentication**: Strict validation preventing cross-role access
- **Login Error Handling**: Smart alerts that refresh login screen with same role for retry

### Password Security
- **Strong Requirements**: 8+ chars, uppercase, lowercase, numbers, special chars
- **Real-Time Validation**: Instant feedback on password strength
- **Secure Storage**: Passwords never stored in plain text
- **Reset Flow**: 6-digit OTP verification for password reset

### Data Protection
- **Role-Based Permissions**: Database-level access control
- **Row Level Security (RLS)**: Fine-grained database access control
- **Input Validation**: Comprehensive frontend and backend validation
- **SQL Injection Protection**: Parameterized queries
- **CSRF Protection**: Cross-site request forgery prevention
- **Message Privacy**: Secure chat system with access control

## 📱 User Experience Features

### Smart Validation System
- **Country-Specific Phone Validation**: 50+ countries with specific requirements
- **Real-Time Email Validation**: Comprehensive format checking with examples
- **Password Strength Indicator**: Visual feedback on password requirements
- **Form State Management**: Disabled buttons until all validations pass

### Navigation & Routing
- **File-Based Routing**: Expo Router for intuitive navigation
- **Role-Based Navigation**: Separate flows for customers and recyclers
- **Deep Linking**: Direct navigation to specific screens
- **Back Navigation**: Context-aware back button behavior

### UI/UX Design
- **Consistent Design System**: Centralized colors, typography, spacing
- **Visual Feedback**: Red/green borders, icons, error messages
- **Loading States**: Smooth transitions and loading indicators
- **Accessibility**: Screen reader support and keyboard navigation
- **Real-Time Updates**: Live status indicators and progress bars

## 🧠 **AI & Intelligence Features**

### **Message Analysis Engine**
- **Intent Detection**: Automatically identifies message purpose (greeting, question, concern, etc.)
- **Emotion Analysis**: Recognizes emotional tone (positive, negative, neutral)
- **Urgency Assessment**: Determines message priority levels
- **Keyword Extraction**: Identifies important words and phrases
- **Context Awareness**: Considers pickup stage and conversation history

### **Smart Response Generation**
- **Context-Aware Templates**: Responses that match message context
- **Stage-Based Suggestions**: Different responses for different pickup stages
- **Emotion-Responsive**: Appropriate responses to emotional content
- **Urgency-Matched**: Responses that address priority levels
- **Dynamic Content**: Automatic time and action placeholder filling

### **Intelligent Communication**
- **Professional Responses**: Always appropriate and contextual
- **Time-Saving Suggestions**: Quick access to relevant responses
- **Customer Satisfaction**: Better communication quality
- **Efficiency**: Focus on pickup rather than typing

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Supabase Account](https://supabase.com/) (for backend services)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd EcoWasteGo
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

4. **Environment Setup:**
   ```bash
   # Frontend (.env)
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

   # Backend (.env)
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret
   ```

5. **Database Setup:**
   ```bash
   cd backend
   npm run db:setup
   ```

6. **Run Database Migrations:**
   ```bash
   # Run the approval workflow migration
   psql -h your_host -U your_user -d your_database -f scripts/waste-collections-migration.sql
   
   # Run the messaging system migration
   psql -h your_host -U your_user -d your_database -f scripts/chat-messages-migration.sql
   ```

7. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

8. **Start the frontend:**
   ```bash
   npx expo start
   ```

## 🔧 Development Features

### Code Quality
- **TypeScript**: Full type safety across the application
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting
- **Error Boundaries**: Graceful error handling

### Performance Optimizations
- **Memoization**: React.memo and useMemo for performance
- **Debouncing**: Input validation debouncing
- **Lazy Loading**: Component and route lazy loading
- **Image Optimization**: Compressed and optimized assets
- **Real-Time Polling**: Efficient 3-second intervals for updates

### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: User flow testing with Expo
- **Security Tests**: Authentication and authorization testing

## 📊 Current Implementation Status

### ✅ **Completed Features**
- **User Authentication**: Registration, login, password reset
- **Role-Based System**: Customer and recycler experiences
- **Form Validation**: Email, phone, password validation
- **Security**: Supabase Auth, HTTPS, input validation
- **Navigation**: File-based routing with role separation
- **UI Components**: Reusable components with consistent design
- **Backend API**: Complete REST API with authentication
- **Database**: Supabase integration with proper schema
- **Request Approval Workflow**: Complete customer-recycler approval system
- **Real-Time Messaging**: AI-powered intelligent messaging system
- **Live Navigation Tracking**: GPS-based real-time tracking
- **Arrival Notifications**: Automatic arrival detection and alerts
- **Intelligent Suggestions**: Context-aware response suggestions

### 🚧 In Progress
- **Payment Processing**: Integration with payment gateways
- **Push Notifications**: Real-time notifications
- **Offline Support**: Offline data synchronization

### 📋 Planned Features
- **Multi-Language Support**: Internationalization
- **Advanced Analytics**: Machine learning insights
- **Social Features**: Community and sharing
- **IoT Integration**: Smart waste bin integration
- **Voice Messaging**: Audio message support
- **Advanced AI**: Machine learning for better suggestions

## 🧠 **AI System Capabilities**

### **Message Understanding**
- **10 Intent Types**: Greeting, question, concern, arrival, pickup_ready, etc.
- **3 Urgency Levels**: High, medium, low priority detection
- **3 Emotion States**: Positive, negative, neutral tone recognition
- **6 Pickup Stages**: Context-aware responses for each stage

### **Smart Response Generation**
- **Context-Aware Templates**: Adapts based on message content and situation
- **Dynamic Content**: Automatic time and action placeholder filling
- **Relevance Scoring**: 0-1 scoring system for suggestion quality
- **Category Classification**: Immediate, helpful, and alternative responses

### **Real-Time Adaptation**
- **Live Analysis**: Analyzes messages as they arrive
- **Context Switching**: Adapts to different pickup stages
- **Conversation History**: Learns from previous messages
- **Performance Optimization**: Efficient suggestion generation

## 🤝 Contributing

### Development Guidelines
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow coding standards**: TypeScript, ESLint, Prettier
4. **Write tests**: Unit and integration tests
5. **Submit a pull request**: Detailed description of changes

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb style guide
- **Prettier**: Consistent formatting
- **Git Hooks**: Pre-commit validation

## 📞 Support & Contact

- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Email**: support@ecowastego.com
- **Discord**: [Community Server](link-to-discord)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ using Expo, React Native, Supabase, and AI-powered intelligence for a sustainable future.* ♻️🧠

