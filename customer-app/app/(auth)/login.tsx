import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import AuthGlowBackground from '@/components/auth/AuthGlowBackground';
import { SocialButtons } from '@/components/auth/AuthGlow';
import { GlassField, GradientButton, OrDivider, ScreenHeader } from '@/components/shared/GlowUI';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { exchangeGoogleCode, getGoogleCode } from '@/hooks/useGoogleAuthFlow';

WebBrowser.maybeCompleteAuthSession();

// Admin / business accounts are not allowed in the customer app
const BLOCKED_ROLES = ['admin', 'bank_representative', 'dealership_owner', 'insurance_provider', 'tracker_provider'];

function blockedMessage(role?: string) {
  const label =
    role === 'admin' ? 'Admin' :
    role === 'bank_representative' ? 'Bank' :
    role === 'dealership_owner' ? 'Dealership' :
    role === 'insurance_provider' ? 'Insurance' :
    role === 'tracker_provider' ? 'Tracker' : 'Business';
  return `No customer account found with this email. ${label} accounts cannot log in here — please use the business (panels) app.`;
}

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGooglePress() {
    if (googleLoading || loading) return;
    setGoogleLoading(true);
    try {
      const code = await getGoogleCode();
      if (!code) return; // user cancelled
      setLoading(true);
      const data = await exchangeGoogleCode(code);
      const googleUser = await setAuth(data.access_token, data.refresh_token);
      if (!googleUser?.role) {
        await logout();
        Alert.alert('Login Failed', 'Could not verify account details. Please try again.');
        return;
      }
      if (BLOCKED_ROLES.includes(googleUser.role)) {
        await logout();
        Alert.alert('Account Not Found', blockedMessage(googleUser?.role));
        return;
      }
      if (googleUser?.role === 'individual_seller') {
        router.replace('/(seller)' as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Google Sign-In Failed', err.message || 'Please try again.');
    } finally {
      setGoogleLoading(false);
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter phone number or email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
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
      if (!loggedInUser?.role) {
        await logout();
        Alert.alert('Login Failed', 'Could not verify account details. Please try again.');
        return;
      }
      if (BLOCKED_ROLES.includes(loggedInUser.role)) {
        await logout();
        Alert.alert('Account Not Found', blockedMessage(loggedInUser?.role));
        return;
      }
      if (loggedInUser?.role === 'individual_seller') {
        router.replace('/(seller)' as any);
      } else {
        router.replace('/(tabs)');
      }
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Login to your autowizor account</Text>

            <GlassField
              placeholder="Phone number / Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <GlassField
              containerStyle={{ marginTop: 18 }}
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              right={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8F8A96" />
                </TouchableOpacity>
              }
            />
            <View style={styles.rememberRow}>
              <TouchableOpacity style={styles.rememberLeft} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
                <View style={[styles.checkbox, rememberMe && { backgroundColor: '#e2671b', borderColor: '#e2671b' }]}>
                  {rememberMe && <Ionicons name="checkmark" size={10} color="#fff" />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.forgotText}>Forgot Password ?</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, minHeight: 60 }} />

            <GradientButton title="Login" height={50} fontSize={17} onPress={handleLogin} loading={loading} />
            <View style={{ marginVertical: 14 }}><OrDivider /></View>
            <View style={{ gap: 14 }}>
              <SocialButtons onGooglePress={handleGooglePress} googleLoading={googleLoading} />
            </View>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={{ marginTop: 16 }}>
              <Text style={styles.signinText}>
                {"Don't have any account? "}<Text style={{ color: '#FFFFFF' }}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthGlowBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 20 },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 8,
  },
  subtitle: {
    color: '#BAACB6',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
    marginBottom: 18,
  },
  hint: {
    color: '#FF6B6D',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    marginTop: 6,
    marginLeft: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  rememberLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 13,
    height: 13,
    borderRadius: 2,
    borderWidth: 1.2,
    borderColor: '#BAACB6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: { color: '#BAACB6', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  forgotText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  signinText: {
    textAlign: 'center',
    color: '#BAACB6',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
});
