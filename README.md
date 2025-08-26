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

### 🧮 **Smart Distance & Pricing System**
- **Haversine Distance Calculation**: Precise geographic distance using Earth's spherical geometry
- **Intelligent ETA Estimation**: Traffic-aware arrival time with urban condition modeling
- **Dynamic Pricing Algorithm**: Distance-based pricing with vehicle type optimization
- **Golden Angle Distribution**: Optimal recycler positioning for balanced coverage
- **Real-Time Route Optimization**: Live distance updates and closest recycler prioritization

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

### 💬 **Smart Messaging System** 💬
- **Intelligent Response Suggestions**: Context-aware message suggestions for common scenarios
- **Real-Time Communication**: Instant messaging between recyclers and customers
- **Message Persistence**: All conversations stored in database with conversation history
- **Smart Response Templates**: Contextual responses based on pickup stage and message type
- **Professional Communication**: Ensures high-quality, appropriate responses
- **Quick Response Buttons**: Pre-written messages for common situations

### 🗺️ **Location & Navigation System** 🚗
- **GPS Location Services**: Current location detection and address search
- **Location-Based Search**: Find recyclers and services near specific addresses
- **Distance Calculation**: Precise distance measurement using GPS coordinates
- **Location Permissions**: Secure handling of location access
- **Address Validation**: Location search and reverse geocoding
- **Route Information**: Basic navigation between pickup and delivery points

### 📏 **Distance Calculation & ETA System** 🧮
- **Haversine Formula**: Precise distance calculation using Earth's spherical geometry
- **Realistic ETA Calculation**: Traffic-aware arrival time estimates with city conditions
- **Smart Speed Adjustments**: Dynamic speed calculations based on distance and urban factors
- **Traffic Delay Modeling**: 20% extra time factor for city traffic conditions
- **Golden Angle Distribution**: Optimal recycler positioning simulation around customers
- **Distance-Based Pricing**: Dynamic rate calculation with 8% increase per kilometer
- **Vehicle Type Optimization**: Different pricing models for Big vs Small trucks

### ✅ **Request Approval Workflow** 📋
- **Customer Request Submission**: Submit waste pickup requests with details
- **Recycler Review**: Recyclers can view and manage pending requests
- **Accept/Reject System**: Recyclers can accept or reject requests with reasons
- **Status Tracking**: Real-time status updates throughout the process
- **Waiting Screens**: Customer waiting experience with progress indicators
- **Approval Notifications**: Instant alerts for request status changes
- **Database Persistence**: All workflow data stored securely in database

### 💳 Payment & Financial System
- **Payment Summaries**: Detailed breakdown of service costs and totals
- **Payment Approval Flow**: Accept/reject payment summaries with confirmation
- **Secure Transactions**: HTTPS transmission with Supabase backend security
- **Environmental Impact Tracking**: Basic CO2 savings calculation framework

### 🌍 Environmental Impact
- **CO2 Savings Calculation**: Basic framework for tracking recycling impact
- **Eco Impact Celebration**: Post-payment environmental statistics display
- **Rewards System**: Achievement tracking for environmental contributions
- **Educational Content**: Recycling education and best practices

### 📊 Analytics & Reporting
- **Customer Analytics**: Pickup history, environmental impact, rewards
- **Recycler Analytics**: Earnings, completed pickups, performance metrics
- **Environmental Tracking**: CO2 saved, trees equivalent, energy hours
- **Real-Time Statistics**: Live updates of user activity and impact

## 🛠️ Technical Architecture

### 📏 **Distance Calculation Algorithms**

#### **Haversine Formula Implementation**
```typescript
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
```

#### **Intelligent ETA Calculation**
```typescript
const calculateETA = (distance: number): string => {
  let avgSpeed = 25; // km/h - conservative city speed
  
  // Adjust speed based on distance
  if (distance > 5) {
    avgSpeed = 35; // km/h for longer distances (highways)
  } else if (distance < 1) {
    avgSpeed = 15; // km/h for very short distances (more traffic lights)
  }
  
  // Add traffic delay factor (20% extra time for city conditions)
  const trafficDelay = 1.2;
  const timeInHours = (distance / avgSpeed) * trafficDelay;
  const timeInMinutes = Math.round(timeInHours * 60);
  
  return formatTime(timeInMinutes);
};
```

#### **Smart Recycler Positioning**
```typescript
// Generate realistic recycler positions around the customer
const angle = (index * 137.5) % 360; // Golden angle for better distribution
const radius = 0.3 + (index % 5) * 0.4; // 0.3 to 2.3 km radius

const recyclerLat = customerLocation.latitude + (radius * Math.cos(angle * Math.PI / 180)) / 111;
const recyclerLon = customerLocation.longitude + (radius * Math.sin(angle * Math.PI / 180)) / (111 * Math.cos(customerLocation.latitude * Math.PI / 180));
```

#### **Dynamic Pricing Algorithm**
```typescript
// Generate realistic rates based on distance and vehicle type
let baseRate = 1.0;
if (recycler.vehicle_type === 'Big Truck') {
  baseRate = 0.8; // Big trucks are more efficient, cheaper per kg
} else if (recycler.vehicle_type === 'Small Truck') {
  baseRate = 1.2; // Small trucks are more expensive per kg
}

const distanceMultiplier = 1 + (distance * 0.08); // 8% increase per km
const rate = baseRate * distanceMultiplier;
```

#### **Mathematical Principles & Optimization**

**Golden Angle Distribution (137.5°)**
- Uses the golden angle to distribute recyclers evenly around customers
- Prevents clustering and ensures optimal coverage
- Formula: `angle = (index * 137.5) % 360`

**Earth's Curvature Compensation**
- Accounts for Earth's spherical shape in coordinate calculations
- Uses 111 km per degree latitude (approximate at equator)
- Longitude adjustment: `111 * cos(latitude)` for accurate distance

**Traffic-Aware Speed Modeling**
- **Short Distance (< 1 km)**: 15 km/h (heavy traffic, many stops)
- **Medium Distance (1-5 km)**: 25 km/h (city traffic average)
- **Long Distance (> 5 km)**: 35 km/h (highway speeds possible)

**Dynamic Pricing Factors**
- **Base Rate**: Vehicle type efficiency (Big Truck: 0.8x, Small Truck: 1.2x)
- **Distance Multiplier**: 8% increase per kilometer
- **Traffic Factor**: 20% additional time for urban conditions

#### **Real-World Application Benefits**

**Customer Experience**
- **Accurate ETA**: Traffic-aware arrival time estimates
- **Fair Pricing**: Distance-based transparent pricing
- **Optimal Selection**: Closest recyclers prioritized automatically

**Operational Efficiency**
- **Route Optimization**: Minimizes travel time and fuel consumption
- **Load Balancing**: Even distribution prevents recycler clustering
- **Cost Transparency**: Clear pricing based on actual distance and conditions

**Environmental Impact**
- **Reduced Carbon Footprint**: Shorter routes mean less emissions
- **Efficient Resource Use**: Optimal vehicle selection based on distance
- **Sustainable Operations**: Data-driven decision making for green logistics

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

### ✅ **Fully Implemented Features**
- **User Authentication**: Registration, login, password reset with Supabase
- **Role-Based System**: Complete customer and recycler experience separation
- **Form Validation**: Comprehensive email, phone, password validation
- **Security**: Supabase Auth, HTTPS, input validation, rate limiting
- **Navigation**: File-based routing with role-based navigation
- **UI Components**: Consistent design system with reusable components
- **Backend API**: Complete REST API with authentication and middleware
- **Database**: Supabase integration with proper schema and RLS policies
- **Request Approval Workflow**: Complete customer-recycler approval system
- **Smart Messaging**: Context-aware message suggestions and templates
- **Location Services**: GPS location detection and address search
- **Distance Calculation**: Haversine formula with ETA and pricing
- **Payment System**: Payment summaries and approval workflow
- **Environmental Tracking**: Basic CO2 savings calculation framework

### 🚧 In Progress
- **Payment Processing**: Basic structure exists, needs payment gateway integration
- **Real-Time Updates**: Polling-based updates, needs WebSocket implementation
- **Advanced Analytics**: Basic stats exist, needs enhanced reporting

### 📋 Planned Features
- **Push Notifications**: Real-time push notifications for status updates
- **WebSocket Integration**: Real-time bidirectional communication
- **Advanced AI**: Machine learning for message analysis and suggestions
- **Multi-Language Support**: Internationalization for global markets
- **Social Features**: Community features and user sharing
- **IoT Integration**: Smart waste bin integration for automated collection
- **Voice Messaging**: Audio message support for hands-free communication

## 🧠 **Smart System Capabilities**

### **Message Understanding**
- **Context-Aware Suggestions**: Provides relevant response options based on pickup stage
- **Smart Templates**: Pre-written messages for common scenarios
- **Stage-Based Responses**: Different suggestions for different pickup phases
- **Professional Communication**: Ensures appropriate and helpful responses

### **Response Generation**
- **Quick Response Buttons**: Easy access to common messages
- **Contextual Suggestions**: Relevant responses based on current situation
- **Template System**: Structured messages for consistency
- **User Experience**: Reduces typing time and improves communication quality

### **System Intelligence**
- **Real-Time Updates**: Live status monitoring and updates
- **Smart Routing**: Efficient recycler-customer matching
- **Performance Tracking**: Monitor system usage and optimize performance
- **User Behavior**: Learn from user interactions to improve suggestions

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

