import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Debug logging - only in development
if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
  console.log("🔧 Loaded Firebase config file");
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
  console.log("🔧 Firebase config:", {
    apiKey: firebaseConfig.apiKey ? "✅ Set" : "❌ Missing",
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
  console.log("✅ Firebase app initialized:", app.name);
}

// Auth
export const auth = getAuth(app);
if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
  console.log("📦 Firebase auth initialized");
}

// Optional: Analytics
let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
      console.log("📊 Firebase analytics initialized");
    }
  }
});

export default app;
