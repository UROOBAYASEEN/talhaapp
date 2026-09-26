import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import AuthHeader from '@/components/auth/AuthHeader';
import LinearButton from '@/components/auth/LinearButton';
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
          // setAuth() baad mein call hogi — verification-status pe
          router.replace({
            pathname: '/(auth)/business-info',
            params: { role: role || '', access_token: data.access_token, refresh_token: data.refresh_token },
          });
        } else {
          await setAuth(data.access_token, data.refresh_token);
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
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
      <AuthHeader />
      <View style={styles.content}>
        <Text style={[styles.title, { color: C.textPrimary }]}>Verify Code</Text>
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>
          Enter the 6-digit verification code sent to{' '}
          <Text style={{ color: '#e2671b', fontFamily: 'Poppins_600SemiBold' }}>{sent_to || phone}</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <View
              key={idx}
              style={[
                styles.otpBox,
                {
                  borderColor: digit
                    ? C.isDark ? 'rgba(255,255,255,0.9)' : 'rgba(3,12,40,0.5)'
                    : C.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(3,12,40,0.15)',
                  backgroundColor: C.glassBg,
                  overflow: 'hidden',
                },
              ]}
            >
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <TextInput
                ref={(el) => { inputs.current[idx] = el; }}
                style={[styles.otpInput, { color: C.textPrimary }]}
                value={digit}
                onChangeText={(v) => handleChange(v, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                secureTextEntry
                selectionColor={C.gradientEnd}
              />
            </View>
          ))}
        </View>

        {timer > 0 ? (
          <Text style={[styles.timer, { color: C.textPrimary }]}>{timeStr}</Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text style={[styles.resendLink, { color: C.textSecondary }]}>Resend OTP</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={timer <= 0 ? handleResend : undefined} activeOpacity={timer <= 0 ? 0.7 : 1}>
          <Text style={[styles.orText, { color: C.textSecondary }]}>
            Didn't receive it?{' '}
            <Text style={{ color: timer <= 0 ? '#e2671b' : C.textSecondary, fontFamily: 'Poppins_600SemiBold' }}>
              Resend it
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.btnFixed}>
        <LinearButton title="Verify" onPress={handleVerify} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  content: { flex: 1, gap: 20, justifyContent: 'center', paddingBottom: 190 },
  btnFixed: { paddingBottom: 24 },

  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 22,
    textAlign: 'center',
  },

  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  otpBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    fontSize: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
  },

  timer: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  resendLink: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  orText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
});
