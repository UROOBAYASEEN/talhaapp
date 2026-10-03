import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';

export default function BecomeSellerMyAdsScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={s.text}>My Ads</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: AppColors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text:   { color: AppColors.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
