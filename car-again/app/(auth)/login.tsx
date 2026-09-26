import { AntDesign, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '@/components/auth/AuthHeader';
import GlassInput from '@/components/auth/GlassInput';
import LinearButton from '@/components/auth/LinearButton';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const C = useAppColors();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleGooglePress() {
    Alert.alert(
      'Google Sign-In',
      'Google login is available in the production app. Please use email and password to login.',
      [{ text: 'OK' }]
    );
  }

  async function handleGoogleLogin(accessToken: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Google login failed');
      const googleUser = await setAuth(data.access_token, data.refresh_token);
      const BUSINESS_ROLES = ['bank_representative', 'dealership_owner', 'individual_seller', 'insurance_provider', 'tracker_provider'];
      if (googleUser?.role === 'admin') {
        router.replace('/(admin)' as any);
      } else if (BUSINESS_ROLES.includes(googleUser?.role || '')) {
        if (googleUser?.docs_status === 'approved') {
          if (googleUser?.role === 'dealership_owner')        router.replace('/(dealer)' as any);
          else if (googleUser?.role === 'bank_representative') router.replace('/(bank)' as any);
          else if (googleUser?.role === 'insurance_provider')  router.replace('/(insurance_provider)' as any);
          else if (googleUser?.role === 'tracker_provider')    router.replace('/(tracker)' as any);
          else                                                 router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/verification-status' as any);
        }
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.detail;
        if (detail?.code === 'UNVERIFIED') {
          router.push({
            pathname: '/(auth)/verify-otp',
            params: {
              phone: detail.phone,
              purpose: 'register',
              sent_to: detail.sent_to,
              dev_otp: detail.dev_otp ?? '',
            },
          });
          return;
        }
        throw new Error(typeof detail === 'string' ? detail : 'Login failed');
      }
      const loggedInUser = await setAuth(data.access_token, data.refresh_token);
      const BUSINESS_ROLES = ['bank_representative', 'dealership_owner', 'individual_seller', 'insurance_provider', 'tracker_provider'];
      if (loggedInUser?.role === 'admin') {
        router.replace('/(admin)' as any);
      } else if (BUSINESS_ROLES.includes(loggedInUser?.role || '')) {
        if (loggedInUser?.docs_status === 'approved') {
          if (loggedInUser?.role === 'dealership_owner')        router.replace('/(dealer)' as any);
          else if (loggedInUser?.role === 'bank_representative') router.replace('/(bank)' as any);
          else if (loggedInUser?.role === 'insurance_provider')  router.replace('/(insurance_provider)' as any);
          else if (loggedInUser?.role === 'tracker_provider')    router.replace('/(tracker)' as any);
          else                                                   router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/verification-status' as any);
        }
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  const socialBorderColor = C.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(3,12,40,0.15)';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} style={{ backgroundColor: C.bg }}>

          <AuthHeader />

          <Text style={[styles.title, { color: C.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>Login to your Autowizor account</Text>

          <View style={styles.form}>
            <GlassInput
              placeholder="Email address or phone number"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View>
              <GlassInput
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={C.textPlaceholder}
                    />
                  </TouchableOpacity>
                }
              />
              <View style={styles.rememberRow}>
                <TouchableOpacity
                  style={styles.rememberLeft}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    { borderColor: C.textSecondary },
                    rememberMe && { backgroundColor: C.selectedIndicator, borderColor: C.selectedIndicatorBorder },
                  ]}>
                    {rememberMe && <Ionicons name="checkmark" size={10} color="#fff" />}
                  </View>
                  <Text style={[styles.rememberText, { color: C.textSecondary }]}>Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={[styles.forgotText, { color: C.textSecondary }]}>Forgot Password ?</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginTop: 120 }}>
              <LinearButton title="Login" onPress={handleLogin} loading={loading} />
            </View>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: C.divider }]} />
              <Text style={[styles.dividerText, { color: C.textSecondary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: C.divider }]} />
            </View>

            <TouchableOpacity
              style={[styles.socialBtn, { borderColor: socialBorderColor, backgroundColor: C.glassBg, overflow: 'hidden' }]}
              activeOpacity={0.8}
              onPress={handleGooglePress}
            >
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <View style={styles.socialInner}>
                <AntDesign name="google" size={22} color="#DB4437" />
                <Text style={[styles.socialText, { color: C.textRole }]}>Continue with Google </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { borderColor: socialBorderColor, backgroundColor: C.glassBg, overflow: 'hidden' }]} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <View style={styles.socialInner}>
                <Ionicons name="logo-apple" size={22} color={C.textPrimary} />
                <Text style={[styles.socialText, { color: C.textRole }]}>Continue with Apple </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[styles.signinText, { color: C.textSecondary }]}>
                Don't have an account?{' '}
                <Text style={[styles.signinLink, { color: C.textRole }]}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 24,
  },

  form: { gap: 16 },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  rememberLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  forgotText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  dividerLine: { flex: 1, height: 0.5 },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },

  socialBtn: {
    height: 48,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(29,83,175,0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  socialInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socialIcon: { width: 24, height: 24 },
  socialText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },

  signinText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  signinLink: {
    fontFamily: 'Poppins_500Medium',
  },
});
