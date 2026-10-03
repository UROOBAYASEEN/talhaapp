import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

export default function AuthLayout() {
  const scheme = useColorScheme();

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="splash-2" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="personal-info" />
        <Stack.Screen name="verify-otp" />
        <Stack.Screen name="business-info" />
        <Stack.Screen name="store-design" />
        <Stack.Screen name="upload-documents" />
        <Stack.Screen name="registration-payment" />
        <Stack.Screen name="verification-status" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="create-password" />
        <Stack.Screen name="password-updated" />
        <Stack.Screen name="account-created" />
        <Stack.Screen name="suspended" />
      </Stack>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
    </>
  );
}
