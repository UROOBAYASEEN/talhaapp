import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthGlowBackground from '@/components/auth/AuthGlowBackground';
import { GlassField, GradientButton, ScreenHeader } from '@/components/shared/GlowUI';
import { API_BASE } from '@/constants/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!phoneOrEmail.trim()) {
      Alert.alert('Error', 'Please enter your phone number or email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_or_email: phoneOrEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          phone: data.phone,
          purpose: 'reset_password',
          dev_otp: data.dev_otp ?? '',
          sent_to: data.sent_to ?? data.phone,
        },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGlowBackground>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader logo />
        <View style={styles.content}>
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            {"Enter your mobile number or email and we'll send you a verification code."}
          </Text>
          <GlassField
            placeholder="Phone number / Email"
            value={phoneOrEmail}
            onChangeText={setPhoneOrEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.btnFixed}>
          <GradientButton title="Send OTP" loadingTitle="Sending OTP..." height={50} fontSize={17} onPress={handleSend} loading={loading} />
        </View>
      </SafeAreaView>
    </AuthGlowBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },
  btnFixed: { paddingHorizontal: 16, paddingBottom: 20 },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 8,
  },
  subtitle: {
    color: '#BAACB6',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 20,
  },
});
