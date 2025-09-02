# EcoWasteGo 🌱

A comprehensive waste management mobile application that connects customers with verified recyclers for efficient waste collection and recycling services.

## 📱 Overview

EcoWasteGo is a React Native mobile application built with Expo that facilitates waste collection services by connecting customers who need waste disposal with verified recyclers who provide collection services. The app promotes environmental sustainability through proper waste management and recycling.

## ✨ Key Features

### 🔐 Authentication & User Management
- **Role-based Authentication**: Separate login flows for customers, recyclers, and admins
- **Email Verification**: Secure email verification process
- **Password Reset**: Forgot password functionality with email reset links
- **Profile Management**: Complete user profile setup and editing
- **Admin Portal**: Comprehensive admin dashboard for platform management

### 👥 User Roles

#### 🏠 Customers
- **Waste Collection Requests**: Schedule waste pickup services
- **Recycler Selection**: Choose from verified recyclers in their area
- **Real-time Tracking**: Track collection progress and recycler location
- **Payment Integration**: Secure payment processing for services
- **Rewards System**: Earn points for sustainable waste disposal
- **History & Analytics**: View past collections and environmental impact

#### 🚛 Recyclers
- **Verification System**: Complete verification process with document upload
- **Service Management**: Accept and manage collection requests
- **Route Optimization**: Efficient route planning for collections
- **Earnings Tracking**: Monitor income and performance metrics
- **Profile Management**: Maintain business information and service areas
- **Notification System**: Real-time updates on new requests and status changes

#### 👨‍💼 Administrators
- **User Management**: Oversee all platform users and their activities
- **Verification Review**: Approve or reject recycler verification applications
- **Analytics Dashboard**: Comprehensive platform insights and metrics
- **Notification Management**: Send system-wide announcements
- **Content Moderation**: Monitor and manage platform content

### 🔧 Technical Features
- **Real-time Notifications**: Push notifications for all user interactions
- **Document Upload**: Secure file upload for verification documents (images & PDFs)
- **Location Services**: GPS integration for service area mapping
- **Offline Support**: Basic functionality when network is unavailable
- **Cross-platform**: Works on both iOS and Android devices

## 🛠️ Technology Stack

### Frontend
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and build tools
- **TypeScript**: Type-safe JavaScript development
- **React Navigation**: Navigation and routing
- **Expo Router**: File-based routing system

### Backend & Database
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL**: Primary database
- **Row Level Security (RLS)**: Database-level security policies
- **Real-time Subscriptions**: Live data synchronization

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
- **`customers`**: Customer profile information
- **`recyclers`**: Recycler profile and verification data
- **`notifications`**: System notifications and alerts
- **`admin_users`**: Administrator accounts and permissions

### Key Features
- **Row Level Security (RLS)**: Ensures data privacy and security
- **Database Triggers**: Automated user profile creation
- **RPC Functions**: Secure server-side operations
- **Real-time Subscriptions**: Live data updates

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

The app includes comprehensive analytics for administrators:
- **User Growth Metrics**: Registration trends and growth rates
- **Verification Statistics**: Approval/rejection rates and processing times
- **Activity Monitoring**: Real-time platform activity tracking
- **Performance Metrics**: App performance and user engagement

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

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ User authentication and role management
- ✅ Basic waste collection request system
- ✅ Recycler verification process
- ✅ Admin portal and analytics

### Phase 2 (Upcoming)
- 🔄 Advanced route optimization
- 🔄 Payment integration
- 🔄 Real-time tracking
- 🔄 Rewards and gamification system

### Phase 3 (Future)
- 📋 AI-powered waste categorization
- 📋 Carbon footprint tracking
- 📋 Community features
- 📋 Advanced analytics and reporting

## 🙏 Acknowledgments

- Supabase team for the excellent backend platform
- Expo team for the amazing development tools
- React Native community for continuous support
- All contributors and testers who helped improve the app

---

**EcoWasteGo** - Making waste management sustainable, one collection at a time! 🌱♻️
