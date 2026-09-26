import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '@/components/auth/AuthHeader';
import GlassInput from '@/components/auth/GlassInput';
import LinearButton from '@/components/auth/LinearButton';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const C = useAppColors();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
      <AuthHeader />
      <View style={styles.content}>
        <Text style={[styles.title, { color: C.textPrimary }]}>Reset your password</Text>
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>
          Enter your mobile number or email and we'll send you a verification code.
        </Text>
        <GlassInput
          accentBorderColor="rgba(100,160,255,0.5)"
          placeholder="Phone number / Email"
          value={phoneOrEmail}
          onChangeText={setPhoneOrEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.btnFixed}>
        <LinearButton title="Send Code" onPress={handleSend} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  content: { flex: 1, gap: 20 },
  btnFixed: {
    paddingBottom: 24,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 22,
  },
});
