import { Stack } from 'expo-router';
import { AppColors, useAppColors } from '@/constants/theme';

export default function AdminLayout() {
  const aC = useAppColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: aC.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="partners" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="add-partner" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="company-info" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="add-banner" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="send-notification" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="approve-listings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="listing-detail"   options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="payments"         options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="subscription"     options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ad-payment"            options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="manage-subscriptions"  options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="add-plan"              options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="analytics"             options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="partner-profile"       options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="advertisement"          options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="video-ads"             options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
