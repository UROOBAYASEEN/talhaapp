import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthGlowBackground from '@/components/auth/AuthGlowBackground';
import { Glass, GradientButton, ScreenHeader } from '@/components/shared/GlowUI';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 150;

export default function VerifyOTPScreen() {
  const router = useRouter();
  const C = useAppColors();
  const { setAuth } = useAuth();
  const { phone, purpose, dev_otp, sent_to, role } = useLocalSearchParams<{ phone: string; purpose: string; dev_otp?: string; sent_to?: string; role?: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  function handleChange(val: string, idx: number) {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  }

  function handleKeyPress(e: any, idx: number) {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp_code: code, purpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Verification failed');
      if (purpose === 'reset_password') {
        router.push({ pathname: '/(auth)/create-password', params: { phone, otp_code: code } });
      } else {
        const BUSINESS_ROLES = ['bank_representative', 'dealership_owner', 'individual_seller', 'insurance_provider', 'tracker_provider'];
        if (BUSINESS_ROLES.includes(role || '')) {
          // Business role → continues to business-info with tokens (setAuth happens after docs upload)
          router.replace({
            pathname: '/(auth)/business-info',
            params: { role: role || '', access_token: data.access_token, refresh_token: data.refresh_token },
          });
        } else {
          // Customer: direct login — no further steps
          await setAuth(data.access_token, data.refresh_token);
          router.replace('/(tabs)' as any);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Resend failed');
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimer(RESEND_SECONDS);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}s`;

  return (
    <AuthGlowBackground>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader logo />
        <View style={styles.content}>
          <Text style={styles.title}>Verify Code</Text>
          <Text style={styles.subtitle}>Enter the 6-digit that we have sent to</Text>
          <Text style={styles.phone}>{sent_to || phone}</Text>

          <View style={styles.otpRow}>
            {otp.map((digit, idx) => (
              <View key={idx} style={styles.otpBox}>
                <Glass radius={23} blur={10} />
                <TextInput
                  ref={(el) => { inputs.current[idx] = el; }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(v) => handleChange(v, idx)}
                  onKeyPress={(e) => handleKeyPress(e, idx)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectionColor={C.gradientEnd}
                />
              </View>
            ))}
          </View>

          <Text style={styles.timer}>{timeStr}</Text>

          <TouchableOpacity onPress={timer <= 0 ? handleResend : undefined} activeOpacity={timer <= 0 ? 0.7 : 1}>
            <Text style={styles.orText}>
              {"Didn't receive it? "}
              <Text style={{ color: timer <= 0 ? '#e2671b' : '#FFFFFF' }}>Resend code</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.btnFixed}>
          <GradientButton title="Verify" height={50} fontSize={17} onPress={handleVerify} loading={loading} />
        </View>
      </SafeAreaView>
    </AuthGlowBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 16, paddingTop: 70 },
  btnFixed: { paddingHorizontal: 16, paddingBottom: 20 },

  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#BAACB6',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 6,
  },
  phone: {
    color: '#E6E1E8',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 14 },
  otpBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
  },

  timer: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    marginTop: 24,
  },
  orText: {
    color: '#BAACB6',
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginTop: 24,
  },
});
