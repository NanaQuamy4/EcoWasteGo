# EcoWasteGo ♻️

EcoWasteGo is a mobile app built with Expo and React Native to help users easily schedule and track waste pickups with local recyclers. The app provides a seamless experience from selecting a truck to confirming pickup completion, with real-time status updates, direct communication features, and comprehensive payment management.

## 🚀 Features

### Core Pickup Flow
- **Onboarding Experience**: Friendly onboarding screens introduce new users to the app's benefits and flow.
- **User Registration & Login**: Secure sign-up and login with validation, including country code selection for phone numbers.
- **Profile Management**: Edit your profile details and manage your account information.
- **Truck Selection & Filtering**: View and filter available trucks by size (Big, Small, All) to find the best fit for your waste pickup.
- **Recycler Profile Details**: See detailed recycler/driver profiles, including name, truck type, ID, color, rate, and past pickups, with a circular profile image and rating badge.
- **Pickup Request Flow**: Confirm your pickup, view a waiting screen, and track your recycler's journey.
- **Waiting Screen**: Animated waiting screen simulates waiting for recycler confirmation before tracking begins.
- **Live Tracking Simulation**: Watch a countdown as your recycler approaches, then get notified when they arrive (simulated for demo/testing).
- **Recycler Arrival Notification**: Automatic transition to a dedicated "Recycler Has Arrived" screen when the recycler is at your location.

### Communication Features
- **Direct Communication**: Call or text your recycler directly from the app using dedicated, profile-rich screens. Phone calls use the device dialer.
- **Call Recycler Screen**: Dedicated screen showing recycler profile, contact information, and one-tap calling functionality.
- **Text Chat Simulation**: In-app chat interface with suggested quick messages and simulated recycler responses tailored for user-recycler communication.

### Payment & Financial Management
- **Payment Summary Flow**: After recycler arrival and waste weighing, view detailed payment breakdown including base amount, environmental tax, and total.
- **Payment Review & Approval**: Accept or reject payment summaries with confirmation dialogs.
- **Payment Rejection Flow**: Reject payments to notify recyclers to review their inputs (weight calculations, etc.) and receive corrected summaries.
- **Environmental Tax Calculation**: Automatic 5% environmental tax calculation on all pickups.
- **Payment Made Confirmation**: Confirmation screen after successful payment with environmental impact celebration.

### History & Analytics
- **Comprehensive History Screen**: View all past pickups with filtering options (All, Completed, Pending, Cancelled).
- **Pickup Statistics**: Track completed pickups, total waste collected, and total earnings.
- **Detailed Pickup View**: Tap any history item to view comprehensive details including:
  - Recycler information with profile image and rating
  - Pickup details (date, time, weight, rate)
  - Payment breakdown (base amount, environmental tax, total)
  - Service notes and comments
  - Direct recycler contact options
- **History Actions**: Share receipts and repeat pickups from detailed view.

### Environmental Impact & Rewards
- **Eco Impact Celebration**: Post-payment celebration screen showing environmental impact statistics.
- **Environmental Impact Tracking**: Calculate and display CO2 saved, trees equivalent, energy hours, and car kilometers saved.
- **Rewards System**: Track achievements and environmental contributions.
- **Educational Content**: Learn about recycling and environmental protection.

### User Experience
- **Modern UI/UX**: Clean, user-friendly design with consistent branding, green color theme, and smooth navigation.
- **Status Tracking**: Real-time status updates throughout the pickup process.
- **Rating System**: Star-based rating system for completed pickups.
- **Help & FAQ**: Browse frequently asked questions and get help directly from the app.
- **Notifications**: Access app notifications (screen placeholder for future expansion).

## 📲 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd EcoWasteGo
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Start the app:**
   ```bash
   npx expo start
   ```
4. **Run on your device:**
   - Use the Expo Go app (Android/iOS) or an emulator/simulator.

## 🗺️ App Structure

### Core Screens
- `app/` — All screens and navigation (file-based routing)
  - `SplashScreen.tsx` — App launch screen
  - `OnboardingScreen.tsx` — User onboarding flow
  - `LoginScreen.tsx` — User authentication
  - `RegisterScreen.tsx` — User registration
  - `(tabs)/` — Main tab navigation (Home, History, User)

### Pickup Flow Screens
- `SelectTruck.tsx` — Truck selection with filtering
- `RecyclerProfileDetails.tsx` — Recycler information and confirmation
- `WaitingForRecycler.tsx` — Loading screen with animation
- `TrackingScreen.tsx` — Live tracking simulation
- `RecyclerHasArrived.tsx` — Arrival notification and actions
- `PaymentSummary.tsx` — Payment review and approval
- `PaymentMade.tsx` — Payment confirmation screen
- `EcoImpactCelebration.tsx` — Environmental impact celebration

### Communication Screens
- `CallRecyclerScreen.tsx` — Dedicated calling interface
- `TextRecyclerScreen.tsx` — In-app messaging with suggestions

### History & Analytics
- `history.tsx` — Comprehensive pickup history with filtering
- `HistoryDetail.tsx` — Detailed pickup information view

### Support & Settings
- `Help.tsx` — FAQ and support
- `EditProfileScreen.tsx` — Profile management
- `NotificationScreen.tsx` — App notifications
- `EducationScreen.tsx` — Educational content
- `RecyclerRegistrationScreen.tsx` — Recycler signup
- `Rewards.tsx` — Rewards and achievements

### Components & Utilities
- `components/CommonHeader.tsx` — Reusable header component
- `utils/constants.ts` — Centralized app constants (colors, dimensions, mock data)
- `utils/helpers.ts` — Utility functions for calculations, formatting, and validation

### Assets
- `assets/` — Images and fonts

## 🛠️ Tech Stack
- **React Native** (with Expo)
- **expo-router** for file-based navigation
- **TypeScript** for type safety
- **@expo/vector-icons** for icons
- **React Native Components**: SafeAreaView, FlatList, TouchableOpacity, Alert, Linking, Animated

## 🔄 User Flow

1. **Onboarding** → User introduction and app benefits
2. **Registration/Login** → Account creation and authentication
3. **Truck Selection** → Filter and select appropriate recycler
4. **Recycler Details** → Review recycler profile and confirm pickup
5. **Waiting** → Animated loading while recycler confirms
6. **Tracking** → Live countdown to recycler arrival
7. **Arrival** → Recycler arrival notification and payment check
8. **Payment** → Review and approve/reject payment summary
9. **Payment Made** → Confirmation screen with environmental impact
10. **Eco Celebration** → Environmental impact celebration and rewards
11. **History** → View detailed pickup records and analytics

## 🎨 Design System

### Centralized Design Constants
The app uses a centralized design system with consistent colors, dimensions, and styling:

#### Colors (`utils/constants.ts`)
- **Primary**: `#1C3301` (Dark Green)
- **Secondary**: `#4CAF50` (Green)
- **Background**: `#CFDFBF` (Light Green)
- **Light Green**: `#E3F0D5`
- **Dark Green**: `#22330B`
- **White**: `#fff`
- **Black**: `#000`
- **Gray**: `#666`
- **Red**: `#f44336`

#### Dimensions (`utils/constants.ts`)
- **Border Radius**: `12px`
- **Card Border Radius**: `16px`
- **Padding**: `16px`
- **Margin**: `16px`

### Status Colors
- **Completed**: Green (`#4CAF50`)
- **Pending**: Orange (`#FF9800`)
- **Cancelled**: Red (`#f44336`)

### Components
- **CommonHeader**: Reusable header component with back navigation and branding
- **Consistent Card Layouts**: Standardized card components with shadows and rounded corners
- **Button Styles**: Consistent button styling across the app

## 🔧 Code Architecture

### Optimization Features
The app has been optimized for maintainability and performance:

#### Centralized Constants (`utils/constants.ts`)
- **Colors**: All app colors centralized for consistent theming
- **Dimensions**: Standardized spacing and sizing
- **Mock Data**: Centralized mock data for trucks, recyclers, payments, history
- **Environmental Factors**: Constants for environmental impact calculations
- **Message Suggestions**: Predefined message sets for text communication

#### Utility Functions (`utils/helpers.ts`)
- **Weight Parsing**: `parseWeight()` for consistent weight string handling
- **Status Management**: `getStatusColor()`, `getStatusText()` for status consistency
- **Environmental Calculations**: `calculateEnvironmentalImpact()` for impact metrics
- **Time Formatting**: `formatSecondsToTime()`, `formatDate()` for consistent time display
- **Statistics**: `calculateTotalStats()` for history analytics
- **Validation**: `isValidEmail()`, `isValidPhone()` for input validation
- **Performance**: `debounce()`, `memoize()` for optimization

#### Reusable Components
- **CommonHeader**: Consistent navigation header across all screens
- **Standardized Styling**: All screens use centralized colors and dimensions

### Optimized Screens
All main screens have been optimized with:
- ✅ Centralized constants usage
- ✅ Helper function integration
- ✅ CommonHeader component
- ✅ Consistent styling
- ✅ TypeScript improvements
- ✅ Performance optimizations

## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📧 Contact
For questions or support, please contact the project maintainer.

---

*Built with ❤️ using Expo and React Native for a greener future.*

