// Google OAuth — Web client ID (Google Cloud Console → APIs & Services → Credentials).
// Expo Go (proxy) flow isi se chalta hai. Production Android/iOS builds ke liye
// alag platform client IDs + SHA-1 lagta hai.
export const GOOGLE_CLIENT_ID =
  '479343487367-o796q3iai2546qidcumveglqpk96ddlp.apps.googleusercontent.com';

// Expo proxy redirect — Google Cloud me Web client ke
// "Authorized redirect URIs" me exact yehi hona chahiye.
export const GOOGLE_PROXY_REDIRECT = 'https://auth.expo.io/@uro/car-again';
