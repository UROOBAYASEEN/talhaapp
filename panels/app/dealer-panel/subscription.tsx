import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from '@/constants/theme';

// Redirect to Compare Plans (plan tab removed)
export default function SubscriptionScreen() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace('/dealer-panel/compare-plans' as any);
  }, []);
  return <View style={{ flex: 1, backgroundColor: AppColors.bg }} />;
}
