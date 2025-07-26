# EcoWasteGo ♻️

EcoWasteGo is a mobile app built with Expo and React Native to help users easily schedule and track waste pickups with local recyclers. The app provides a seamless experience from selecting a truck to confirming pickup completion, with real-time status updates and direct communication features.

## 🚀 Features

- **Onboarding Experience**: Friendly onboarding screens introduce new users to the app’s benefits and flow.
- **User Registration & Login**: Secure sign-up and login with validation, including country code selection for phone numbers.
- **Profile Management**: Edit your profile details and manage your account information.
- **Truck Selection & Filtering**: View and filter available trucks by size (Big, Small, All) to find the best fit for your waste pickup.
- **Recycler Profile Details**: See detailed recycler/driver profiles, including name, truck type, ID, color, rate, and past pickups, with a circular profile image and rating badge.
- **Pickup Request Flow**: Confirm your pickup, view a waiting screen, and track your recycler’s journey.
- **Waiting Screen**: Animated waiting screen simulates waiting for recycler confirmation before tracking begins.
- **Live Tracking Simulation**: Watch a countdown as your recycler approaches, then get notified when they arrive (simulated for demo/testing).
- **Recycler Arrival Notification**: Automatic transition to a dedicated "Recycler Has Arrived" screen when the recycler is at your location.
- **Direct Communication**: Call or text your recycler directly from the app using dedicated, profile-rich screens. Phone calls use the device dialer.
- **Text Chat Simulation**: In-app chat interface with suggested quick messages and simulated recycler responses.
- **Completion Confirmation**: Mark your pickup as complete once the recycler arrives, with confirmation dialog.
- **History**: View your past pickups and interactions (screen placeholder for future expansion).
- **Notifications**: Access app notifications (screen placeholder for future expansion).
- **Help & FAQ**: Browse frequently asked questions and get help directly from the app.
- **Modern UI/UX**: Clean, user-friendly design with consistent branding, green color theme, and smooth navigation.

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
- `app/` — All screens and navigation (file-based routing)
- `assets/` — Images and fonts
- `components/` — Reusable UI components

## 🛠️ Tech Stack
- **React Native** (with Expo)
- **expo-router** for navigation
- **TypeScript**
- **@expo/vector-icons** for icons

## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📧 Contact
For questions or support, please contact the project maintainer.

---

*Built with ❤️ using Expo and React Native.*

