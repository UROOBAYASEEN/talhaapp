import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from '@/constants/theme';

// Redirect to the Plan tab
export default function SubscriptionScreen() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace('/(dealer)/plan' as any);
  }, []);
  return <View style={{ flex: 1, backgroundColor: AppColors.bg }} />;
}
