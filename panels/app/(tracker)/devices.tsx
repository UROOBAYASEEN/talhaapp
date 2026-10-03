import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';

export default function TrackerDevicesScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.center}>
        <Text style={s.text}>Devices</Text>
        <Text style={s.sub}>Coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: AppColors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text:   { color: AppColors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  sub:    { color: AppColors.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 6 },
});
