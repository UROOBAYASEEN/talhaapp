import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearButton from '@/components/auth/LinearButton';
import { useAppColors } from '@/constants/theme';

export default function PasswordUpdatedScreen() {
  const router = useRouter();
  const C = useAppColors();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={[styles.title, { color: C.textPrimary }]}>Password Updated Successfully!</Text>
        <LinearButton title="Back to Login" onPress={() => router.replace('/(auth)/login')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 20 },
  emoji: { fontSize: 56 },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    lineHeight: 30,
  },
});
