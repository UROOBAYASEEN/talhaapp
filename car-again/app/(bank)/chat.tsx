import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';

export default function BankChatScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.center}>
        <MessageCircle size={48} color={AppColors.textSecondary} strokeWidth={1.2} />
        <Text style={s.title}>Messages</Text>
        <Text style={s.sub}>Customer conversations will appear here</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#010A1F' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title:  { color: AppColors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  sub:    { color: AppColors.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
});
