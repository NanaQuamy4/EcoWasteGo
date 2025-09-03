# EcoWasteGo 🌱

A comprehensive waste management mobile application that connects customers with verified recyclers for efficient waste collection and recycling services. Built with React Native, Expo, and Supabase for a seamless, real-time experience.

## 📱 Overview

EcoWasteGo is a production-ready React Native mobile application that revolutionizes waste management by creating a direct connection between customers and verified recyclers. The app features real-time tracking, dynamic pricing, GPS integration, and a complete admin management system, promoting environmental sustainability through efficient waste collection and recycling services.

## ✨ Key Features

### 🔐 Authentication & User Management
- **Role-based Authentication**: Separate login flows for customers, recyclers, and admins
- **Email Verification**: Secure email verification process
- **Password Reset**: Forgot password functionality with email reset links
- **Profile Management**: Complete user profile setup and editing
- **Admin Portal**: Comprehensive admin dashboard for platform management

### 👥 User Roles

#### 🏠 Customers
- **Smart Waste Collection Requests**: Schedule pickup services with GPS location
- **Intelligent Recycler Selection**: Choose from verified recyclers with real-time availability
- **Dynamic Pricing**: Transparent pricing based on distance, weight, and truck size
- **Real-time Tracking**: Live tracking of recycler location and pickup progress
- **Location Services**: GPS integration for accurate pickup locations
- **Request Management**: View and manage all pickup requests
- **History & Analytics**: Track past collections and environmental impact

#### 🚛 Recyclers
- **Complete Verification System**: Multi-step verification with document upload
- **Real-time Request Management**: Accept and manage pickup requests with live updates
- **Online/Offline Status Control**: Toggle availability with heartbeat monitoring
- **Earnings Dashboard**: Comprehensive income tracking and performance metrics
- **Profile Management**: Maintain business information and service areas
- **Notification System**: Real-time updates on new requests and status changes
- **Request History**: Track completed pickups and customer ratings

#### 👨‍💼 Administrators
- **Comprehensive User Management**: Oversee all customers, recyclers, and platform activities
- **Real-time Verification Review**: Approve or reject recycler applications with document review
- **Live Analytics Dashboard**: Real-time platform insights, user statistics, and performance metrics
- **Online Recycler Monitoring**: Track recycler availability and activity in real-time
- **Notification Management**: Send system-wide announcements and alerts
- **Content Moderation**: Monitor and manage platform content and user interactions

### 🔧 Technical Features
- **Real-time Data Synchronization**: Live updates across all user interfaces
- **GPS Distance Calculation**: Accurate distance and ETA calculations using Haversine formula
- **Dynamic Pricing Engine**: Smart pricing based on distance, weight, and truck size
- **Document Upload**: Secure file upload for verification documents (images & PDFs)
- **Location Services**: GPS integration for service area mapping and pickup locations
- **Heartbeat Monitoring**: Real-time recycler availability tracking
- **Auto-offline System**: Automatic recycler status management with cron jobs
- **Cross-platform**: Works seamlessly on both iOS and Android devices

## 🛠️ Technology Stack

### Frontend
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and build tools
- **TypeScript**: Type-safe JavaScript development
- **React Navigation**: Navigation and routing
- **Expo Router**: File-based routing system

### Backend & Database
- **Supabase**: Full-stack Backend-as-a-Service platform
- **PostgreSQL**: Primary database with advanced features
- **Row Level Security (RLS)**: Comprehensive database-level security policies
- **Real-time Subscriptions**: Live data synchronization across all clients
- **Database Functions**: Custom RPC functions for complex operations
- **Database Triggers**: Automated data processing and notifications

### Key Libraries
- **@expo/vector-icons**: Icon library
- **expo-image-picker**: Image and document selection
- **expo-location**: GPS and location services
- **expo-notifications**: Push notification handling
- **react-native-maps**: Map integration

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Supabase account
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ecowastego.git
   cd ecowastego
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database setup scripts in order:
     ```sql
     -- Run these SQL scripts in your Supabase SQL Editor:
     1. admin_database_setup.sql
     2. create_notifications_table.sql
     3. grant_admin_permissions.sql
     4. fix_pickup_requests_final.sql (for pickup requests system)
     5. implement_recycler_online_tracking.sql (for real-time tracking)
     ```

4. **Configure environment variables**
   - Copy your Supabase URL and anon key
   - Update `lib/supabase.ts` with your credentials

5. **Start the development server**
   ```bash
   npx expo start
   ```

6. **Run on device/simulator**
   - Install Expo Go app on your device
   - Scan the QR code from the terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

## 📁 Project Structure

```
EcoWasteGo/
├── app/                          # Main application screens
│   ├── (tabs)/                   # Customer tab navigation
│   ├── (recycler-tabs)/          # Recycler tab navigation
│   ├── admin-screens/            # Admin portal screens
│   ├── customer-screens/         # Customer-specific screens
│   ├── recycler-screens/         # Recycler-specific screens
│   └── components/               # Shared components
├── components/                   # Reusable UI components
├── lib/                          # Configuration and utilities
│   ├── supabase.ts              # Supabase client configuration
│   └── adminConfig.ts           # Admin configuration
├── constants/                    # App constants and themes
├── assets/                       # Images, fonts, and static assets
├── docs/                         # Project documentation
└── scripts/                      # Database and setup scripts
```

## 🗄️ Database Schema

### Core Tables
- **`auth.users`**: User authentication and metadata
- **`customers`**: Customer profile information and preferences
- **`recyclers`**: Recycler profile, verification data, and online status
- **`pickup_requests`**: Complete pickup request lifecycle management
- **`notifications`**: System notifications and real-time alerts
- **`admin_users`**: Administrator accounts and permissions
- **`admin_notifications`**: Admin-specific notifications and system logs

### Key Features
- **Row Level Security (RLS)**: Comprehensive data privacy and security policies
- **Database Triggers**: Automated user profile creation and status updates
- **RPC Functions**: Secure server-side operations for complex queries
- **Real-time Subscriptions**: Live data updates across all clients
- **Auto-offline System**: Automated recycler status management
- **Foreign Key Constraints**: Data integrity and consistency
- **Database Views**: Optimized queries for admin analytics

## 🔐 Security Features

- **Authentication**: Secure user authentication with Supabase Auth
- **Role-based Access Control**: Different permissions for different user types
- **Row Level Security**: Database-level security policies
- **Input Validation**: Client and server-side validation
- **Secure File Upload**: Safe document and image upload handling
- **Admin Verification**: Multi-step recycler verification process

## 📱 Screenshots

*Add screenshots of your app here*

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- Unit tests for utility functions
- Component tests for UI components
- Integration tests for user flows
- E2E tests for critical user journeys

## 🚀 Deployment

### Development Build
```bash
# Create development build
eas build --profile development --platform all
```

### Production Build
```bash
# Create production build
eas build --profile production --platform all
```

### App Store Deployment
```bash
# Submit to app stores
eas submit --platform all
```

## 📊 Analytics & Monitoring

The app includes comprehensive analytics and monitoring for administrators:
- **Real-time User Metrics**: Live registration trends and growth rates
- **Verification Statistics**: Approval/rejection rates and processing times
- **Online Recycler Monitoring**: Real-time availability and activity tracking
- **Pickup Request Analytics**: Request volume, completion rates, and performance
- **Platform Performance**: App performance metrics and user engagement
- **System Health Monitoring**: Database performance and error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Follow the existing code style and conventions

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: [Your Name]
- **Backend Developer**: [Team Member]
- **Frontend Developer**: [Team Member]
- **UI/UX Designer**: [Team Member]

## 📞 Support

For support and questions:
- **Email**: support@ecowastego.com
- **Documentation**: [Link to documentation]
- **Issues**: [GitHub Issues](https://github.com/yourusername/ecowastego/issues)

## 🚀 Recent Major Updates

### Latest Improvements (December 2024)
- **🎯 Complete SelectTruck Screen Overhaul**: Transformed from mock data to fully integrated real-time system
- **📍 GPS Distance Calculation**: Implemented Haversine formula for accurate distance and ETA calculations
- **💰 Dynamic Pricing Engine**: Smart pricing based on distance, weight, and truck size with real-time updates
- **🔄 Real-time Database Integration**: Full Supabase integration with live data synchronization
- **📱 Enhanced User Experience**: Improved loading states, error handling, and UI consistency
- **🛡️ Robust Error Handling**: Comprehensive error recovery and user feedback systems
- **⚡ Performance Optimization**: Reduced bundle size and improved rendering performance
- **🔧 Auto-offline System**: Automated recycler status management with heartbeat monitoring
- **📊 Admin Portal Enhancements**: Real-time analytics and online recycler monitoring
- **🗄️ Database Schema Improvements**: Complete pickup_requests system with foreign key relationships

### Technical Achievements
- **Database Integration**: 100% real-time data synchronization
- **Location Services**: Accurate GPS-based distance calculations
- **Pricing Algorithm**: Dynamic pricing with distance multipliers
- **Real-time Updates**: Live recycler availability and status tracking
- **Code Quality**: Removed 200+ lines of unused code and optimized performance

## 🗺️ Roadmap

### Phase 1 (Completed ✅)
- ✅ User authentication and role management
- ✅ Complete waste collection request system with real-time updates
- ✅ Advanced recycler verification process with document upload
- ✅ Comprehensive admin portal with real-time analytics
- ✅ Real-time recycler tracking and availability monitoring
- ✅ Dynamic pricing system with GPS distance calculation
- ✅ Auto-offline system with heartbeat monitoring
- ✅ Complete pickup request lifecycle management

### Phase 2 (In Progress 🔄)
- 🔄 Payment integration with secure processing
- 🔄 Advanced route optimization for recyclers
- 🔄 Push notifications for all user interactions
- 🔄 Enhanced real-time tracking with live location updates

### Phase 3 (Future 📋)
- 📋 AI-powered waste categorization and pricing
- 📋 Carbon footprint tracking and environmental impact
- 📋 Community features and social sharing
- 📋 Advanced analytics and reporting dashboard
- 📋 Multi-language support
- 📋 Offline mode with data synchronization

## 🙏 Acknowledgments

- Supabase team for the excellent backend platform
- Expo team for the amazing development tools
- React Native community for continuous support
- All contributors and testers who helped improve the app

---

## 🎯 Current System Status

### ✅ Production-Ready Features
- **Complete User Management**: Authentication, profiles, and role-based access
- **Real-time Pickup System**: End-to-end pickup request lifecycle
- **Dynamic Pricing**: Smart pricing with GPS distance calculation
- **Admin Management**: Comprehensive admin portal with real-time monitoring
- **Database Integration**: Full Supabase integration with RLS security
- **Mobile Optimization**: Cross-platform React Native app with Expo

### 🔧 System Architecture
- **Frontend**: React Native with TypeScript and Expo Router
- **Backend**: Supabase with PostgreSQL and real-time subscriptions
- **Security**: Row Level Security (RLS) and role-based access control
- **Real-time**: Live data synchronization across all clients
- **Monitoring**: Auto-offline system and heartbeat tracking

### 📊 Performance Metrics
- **Real-time Updates**: < 1 second data synchronization
- **Distance Accuracy**: GPS-based calculations with Haversine formula
- **Pricing Precision**: Dynamic pricing with distance multipliers
- **Database Performance**: Optimized queries with proper indexing
- **User Experience**: Smooth navigation and responsive UI

---

**EcoWasteGo** - Making waste management sustainable, one collection at a time! 🌱♻️

*Built with ❤️ using React Native, Expo, and Supabase*
