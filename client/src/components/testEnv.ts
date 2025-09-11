// Test environment variables - only in development
if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
  console.log("ENV TEST:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
}
