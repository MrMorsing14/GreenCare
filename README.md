# GreenCare 🌱

Identify plants from photos and get care instructions.

## Setup

```bash
npx create-expo-app GreenCare --template blank
cd GreenCare
```

Then copy the `src/` folder and `App.js` from this repo into your project.

### Install dependencies

```bash
# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

# Firebase
npx expo install firebase

# Camera
npx expo install expo-camera

# Icons (included with Expo but good to be explicit)
npx expo install @expo/vector-icons
```

### Firebase setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Storage
5. Copy your config into `src/config/firebase.js`

## Project Structure

```
src/
├── config/
│   └── firebase.js          # Firebase configuration
├── screens/
│   ├── LoginScreen.js        # Email/password login
│   ├── SignupScreen.js       # Account creation
│   ├── HomeScreen.js         # Landing page with instructions
│   ├── CameraScreen.js       # Take plant photo
│   ├── GardenScreen.js       # View saved plants
│   └── PlantDetailScreen.js  # Plant care info + save
├── navigation/
│   ├── RootNavigator.js      # Auth/App switch
│   ├── AuthNavigator.js      # Login/Signup stack
│   └── AppNavigator.js       # Bottom tabs + nested stacks
├── components/               # Reusable components (TODO)
└── hooks/                    # Custom hooks (TODO)
```

## Architecture

- **Frontend**: React Native (Expo)
- **Auth + DB + Storage**: Firebase
- **ML Model**: Hosted separately (FastAPI server)
- **Plant Care Data**: External plant API

The app sends a photo to the ML server, receives a plant identification,
then queries a plant care API for watering, sunlight, and soil info.
