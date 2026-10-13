import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthGlowBackground from '@/components/auth/AuthGlowBackground';
import PartnerCard from '@/components/auth/PartnerCard';
import { G, Glass, GradientButton, ScreenHeader } from '@/components/shared/GlowUI';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

export default function PartnerLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAuth, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Same login flow as app/(auth)/login.tsx
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
            params: { phone: detail.phone, purpose: 'register', sent_to: detail.sent_to, dev_otp: detail.dev_otp ?? '' },
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
      const BUSINESS_ROLES = ['bank_representative', 'dealership_owner', 'individual_seller', 'insurance_provider', 'tracker_provider'];
      if (loggedInUser.role === 'admin') {
        router.replace('/(admin)' as any);
      } else if (BUSINESS_ROLES.includes(loggedInUser.role)) {
        if (loggedInUser.role === 'dealership_owner')         router.replace('/(dealer)' as any);
        else if (loggedInUser.role === 'bank_representative') router.replace('/(bank)' as any);
        else if (loggedInUser.role === 'insurance_provider')  router.replace('/(insurance_provider)' as any);
        else if (loggedInUser.role === 'tracker_provider')    router.replace('/(tracker)' as any);
        else                                                  router.replace('/Become_a_Seller' as any);
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
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        <ScreenHeader logo />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: 24 + (Platform.OS === 'ios' ? insets.bottom : 0) }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={s.eyebrowRow}>
              <Image source={require('@/assets/Icons/new-seller-storefront.png')} style={{ width: 30, height: 30 }} resizeMode="contain" />
              <Text style={s.eyebrow}>PARTNER PORTAL</Text>
            </View>
            <Text style={s.title}>Welcome back, Partner</Text>
            <Text style={s.subtitle}>Log in to manage your business.</Text>

            <Text style={s.label}>Phone number / Email</Text>
            <View style={s.field}>
              <Glass radius={25} blur={14} />
              <Ionicons name="person-outline" size={20} color="#C9D2EA" />
              <TextInput
                style={s.input}
                placeholder="Enter your phone number or email"
                placeholderTextColor="#8F8A96"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={[s.label, { marginTop: 16 }]}>Password</Text>
            <View style={s.field}>
              <Glass radius={25} blur={14} />
              <Ionicons name="lock-closed-outline" size={20} color="#C9D2EA" />
              <TextInput
                style={s.input}
                placeholder="Enter your password"
                placeholderTextColor="#8F8A96"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#C9D2EA" />
              </TouchableOpacity>
            </View>

            <View style={s.rememberRow}>
              <TouchableOpacity style={s.rememberLeft} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
                <View style={[s.checkbox, rememberMe && { backgroundColor: G.orange, borderColor: G.orange }]}>
                  {rememberMe && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={s.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={s.forgotText}>Forgot password ?</Text>
              </TouchableOpacity>
            </View>

            <GradientButton title="Partner Login" height={50} fontSize={17} style={{ marginTop: 22 }} onPress={handleLogin} loading={loading} />
            <Text style={s.note}>For registered AutoWizor partners.</Text>

            <View style={{ marginTop: 24 }}>
              <PartnerCard
                icon={require('@/assets/Icons/new-seller-storefront.png')}
                title="New to AutoWizor?"
                subtitle="Start your business with us."
                onBecomePartner={() => router.push('/(auth)/partner-register' as any)}
              />
            </View>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={{ marginTop: 22 }} activeOpacity={0.8}>
              <Text style={s.back}>Back to <Text style={s.backLink}>User Login</Text></Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthGlowBackground>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1 },
  scroll:       { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24 },
  eyebrowRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  eyebrow:      { color: G.orange, fontSize: 12, fontFamily: 'Poppins_500Medium', letterSpacing: 0.8 },
  title:        { color: '#FFFFFF', fontSize: 24, fontFamily: 'Poppins_600SemiBold', marginTop: 4 },
  subtitle:     { color: G.muted, fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 18 },
  label:        { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 8, marginLeft: 2 },
  field:        { height: 50, borderRadius: 25, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 14 },
  input:        { flex: 1, height: '100%', color: G.white, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  rememberRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingHorizontal: 4 },
  rememberLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox:     { width: 16, height: 16, borderRadius: 3, borderWidth: 1.3, borderColor: G.muted, alignItems: 'center', justifyContent: 'center' },
  rememberText: { color: G.muted, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  forgotText:   { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  note:         { textAlign: 'center', color: G.muted, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 12 },
  back:         { textAlign: 'center', color: G.muted, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  backLink:     { color: '#FFFFFF', fontFamily: 'Poppins_500Medium' },
});
