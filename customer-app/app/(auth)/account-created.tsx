import { AUTH_EDGES } from '@/constants/authEdges';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthGlowBackground from '@/components/auth/AuthGlowBackground';
import { GradientButton, ScreenHeader } from '@/components/shared/GlowUI';

// Seller sign-up: shown after Upload Documents (same design as password-updated)
export default function AccountCreatedScreen() {
  const router = useRouter();
  const toLogin = () => router.replace('/(auth)/login');

  return (
    <AuthGlowBackground>
      <SafeAreaView edges={AUTH_EDGES} style={styles.safe}>
        <ScreenHeader logo onBack={toLogin} />
        <View style={styles.content}>
          <Image source={require('@/assets/images/successful.png')} style={styles.emoji} resizeMode="contain" />
          <Text style={styles.title}>{'Your Account Created\nSuccessfully!'}</Text>
        </View>
        <View style={styles.btnFixed}>
          <GradientButton title="Back" height={50} fontSize={17} onPress={toLogin} />
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
