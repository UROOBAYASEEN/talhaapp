import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthGlowBackground from '@/components/auth/AuthGlowBackground';
import { GradientButton, ScreenHeader } from '@/components/shared/GlowUI';

export default function PasswordUpdatedScreen() {
  const router = useRouter();
  const toLogin = () => router.replace('/(auth)/login');

  return (
    <AuthGlowBackground>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader logo onBack={toLogin} />
        <View style={styles.content}>
          <Image source={require('@/assets/images/successful.png')} style={styles.emoji} resizeMode="contain" />
          <Text style={styles.title}>{'Password Updated\nSuccessfully!'}</Text>
        </View>
        <View style={styles.btnFixed}>
          <GradientButton title="Back to login" height={50} fontSize={17} onPress={toLogin} />
        </View>
      </SafeAreaView>
    </AuthGlowBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 40 },
  emoji: { width: 84, height: 84 },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    lineHeight: 30,
  },
  btnFixed: { paddingHorizontal: 16, paddingBottom: 20 },
});
