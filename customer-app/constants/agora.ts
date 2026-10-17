// Agora voice-call config.
// App ID backend (/calls/{id}/token) se bhi aata hai; ye sirf fallback hai.
// Agora Console → Project → App ID yahan daal sakte hain (ya backend .env me AGORA_APP_ID set karein).
export const AGORA_APP_ID =
  process.env.EXPO_PUBLIC_AGORA_APP_ID || 'e969b7311dcf4e389e9dff35917783e5';
