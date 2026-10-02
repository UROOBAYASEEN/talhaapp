import { Ionicons, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '@/components/auth/AuthHeader';
import LinearButton from '@/components/auth/LinearButton';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { GOOGLE_CLIENT_ID, GOOGLE_PROXY_REDIRECT } from '@/constants/google';
import { useAuth } from '@/contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const ROLES = [
  {
    key: 'customer',
    label: 'Individual Seller',
    desc: 'Buy cars, bikes, financing & insurance',
    icon: require('@/assets/images/role-customer.png'),
  },
  {
    key: 'bank_representative',
    label: 'Bank Representative',
    desc: 'Manage auto-loan offering',
    icon: require('@/assets/images/role-bank.png'),
  },
  {
    key: 'dealership_owner',
    label: 'Dealership Owner',
    desc: 'List inventory & manage leads',
    icon: require('@/assets/images/role-dealership.png'),
  },
  {
    key: 'individual_seller',
    label: 'Non-Dealer Seller',
    desc: 'Sell your own used vehicles directly',
    emoji: '🏷️',
  },
  {
    key: 'insurance_provider',
    label: 'Insurance Provider',
    desc: 'Offer vehicle insurance plans',
    icon: require('@/assets/images/role-insurance.png'),
  },
  {
    key: 'tracker_provider',
    label: 'Tracker Provider',
    desc: 'Provide tracking & telematics',
    icon: require('@/assets/images/role-tracker.png'),
  },
];

export default function RegisterScreen() {
  const router = useRouter();
  const C = useAppColors();
  const { setAuth } = useAuth();
  const [selectedRole, setSelectedRole] = useState('customer');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const borderColor = C.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(3,12,40,0.15)';

  function handleContinue() {
    if (!agreedToTerms) {
      return;
    }
    router.push({ pathname: '/(auth)/personal-info', params: { role: selectedRole } });
  }

  async function handleGooglePress() {
    if (googleLoading) return;
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please accept the terms and conditions first.');
      return;
    }
    setGoogleLoading(true);
    try {
      const redirectUri = GOOGLE_PROXY_REDIRECT;
      const authUrl =
        'https://accounts.google.com/o/oauth2/v2/auth' +
        `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        '&response_type=code' +
        `&scope=${encodeURIComponent('openid profile email')}` +
        '&access_type=offline' +
        '&prompt=select_account';
      const returnUrl = Linking.createURL('expo-auth-session');
      const startUrl =
        `${GOOGLE_PROXY_REDIRECT}/start?authUrl=${encodeURIComponent(authUrl)}` +
        `&returnUrl=${encodeURIComponent(returnUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
      if (result.type !== 'success') return;
      const url = (result as any).url || '';
      const m = url.match(/[?&]code=([^&]+)/);
      const code = m ? decodeURIComponent(m[1]) : null;
      if (!code) {
        if (/[?&]error=/.test(url)) return;
        throw new Error('No authorization code received. Please try again.');
      }
      const res = await fetch(`${API_BASE}/auth/google/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: redirectUri, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Google sign-up failed');
      const newUser = await setAuth(data.access_token, data.refresh_token);
      const BUSINESS_ROLES = ['bank_representative', 'dealership_owner', 'individual_seller', 'insurance_provider', 'tracker_provider'];
      if (newUser?.role === 'admin') {
        router.replace('/(admin)' as any);
      } else if (BUSINESS_ROLES.includes(newUser?.role || '')) {
        if (newUser?.docs_status === 'approved') {
          if (newUser?.role === 'dealership_owner')        router.replace('/(dealer)' as any);
          else if (newUser?.role === 'bank_representative') router.replace('/(bank)' as any);
          else if (newUser?.role === 'insurance_provider')  router.replace('/(insurance_provider)' as any);
          else if (newUser?.role === 'tracker_provider')    router.replace('/(tracker)' as any);
          else                                               router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/verification-status' as any);
        }
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Google Sign-Up Failed', err.message || 'Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <AuthHeader />
        <Text style={[s.title, { color: C.textPrimary }]}>Create Account</Text>
        <Text style={[s.subtitle, { color: C.textSecondary }]}>Join Autowizor and simplify your car journey.</Text>

        <Text style={[s.roleLabel, { color: C.textSecondary }]}>Select your role</Text>
        <View style={s.roleList}>
          {ROLES.map((r) => {
            const selected = selectedRole === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                style={[s.roleItem, { borderColor: selected ? '#e2671b' : borderColor, backgroundColor: C.glassBg }]}
                onPress={() => setSelectedRole(r.key)}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>

                <View style={[s.roleIconWrap, { backgroundColor: C.roleIconBg }]}>
                  {'emoji' in r ? (
                    <Text style={s.roleEmoji}>{r.emoji}</Text>
                  ) : (
                    <Image source={r.icon} style={s.roleImg} resizeMode="contain" />
                  )}
                </View>
                <View style={s.roleTextWrap}>
                  <Text style={[s.roleName, { color: C.textRole }]} numberOfLines={1}>{r.label}</Text>
                  <Text style={[s.roleDesc, { color: C.textSecondary }]} numberOfLines={1}>{r.desc}</Text>
                </View>
                <View style={[s.radio, { borderColor: selected ? '#e2671b' : C.unselectedIndicatorBorder }, selected && s.radioActive]}>
                  {selected && <Ionicons name="checkmark" size={10} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={s.termsRow} onPress={() => setAgreedToTerms(!agreedToTerms)} activeOpacity={0.8}>
          <View style={[s.checkbox, { borderColor: agreedToTerms ? '#e2671b' : C.unselectedIndicatorBorder }]}>
            {agreedToTerms && <Ionicons name="checkmark" size={12} color="#e2671b" />}
          </View>
          <Text style={[s.termsText, { color: C.textSecondary }]}>
            I confirm that I have read and accept the{' '}
            <Text style={{ color: '#e2671b', fontFamily: 'Poppins_500Medium' }}>terms and conditions</Text>
            {' '}and privacy policy.
          </Text>
        </TouchableOpacity>

        <LinearButton title="Continue" onPress={handleContinue} disabled={!agreedToTerms} />

        <View style={s.dividerRow}>
          <View style={[s.dividerLine, { backgroundColor: C.textSecondary }]} />
          <Text style={[s.dividerText, { color: C.textSecondary }]}>or</Text>
          <View style={[s.dividerLine, { backgroundColor: C.textSecondary }]} />
        </View>

        <TouchableOpacity
          style={[s.socialBtn, { borderColor, backgroundColor: C.glassBg, overflow: 'hidden', opacity: agreedToTerms ? 1 : 0.6 }]}
          activeOpacity={0.8}
          onPress={handleGooglePress}
          disabled={googleLoading}
        >
          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <View style={s.socialInner}>
            <AntDesign name="google" size={22} color="#DB4437" />
            <Text style={[s.socialText, { color: C.textRole }]}>Continue with Google</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={{ marginTop: 12 }}>
          <Text style={[s.signinText, { color: C.textSecondary }]}>
            Already have an account?{' '}
            <Text style={{ color: '#e2671b', fontFamily: 'Poppins_600SemiBold' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { paddingHorizontal: 20, paddingBottom: 48 },
  title:   { fontSize: 20, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  subtitle:{ fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 16 },
  roleLabel:{ fontSize: 14, fontFamily: 'Poppins_500Medium', marginBottom: 12 },
  roleList: { gap: 12, marginBottom: 20 },

  roleItem: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderRadius: 32, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 12, overflow: 'hidden' },
  roleIconWrap: { width: 27, height: 27, borderRadius: 32, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roleImg:  { width: 15, height: 15 },
  roleEmoji:{ fontSize: 13 },
  roleTextWrap: { flex: 1, overflow: 'hidden' },
  roleName: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  roleDesc: { fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  radio:    { width: 16, height: 16, borderRadius: 8, borderWidth: 1.33, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioActive: { backgroundColor: '#e2671b', borderColor: '#e2671b' },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  termsText:{ fontSize: 12, fontFamily: 'Poppins_400Regular', flex: 1, lineHeight: 18 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginVertical: 4 },
  dividerLine: { flex: 1, height: 0.5 },
  dividerText: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  socialBtn: {
    height: 48, borderRadius: 32, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  socialInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  socialText: { fontSize: 16, fontFamily: 'Poppins_500Medium' },
  signinText:{ textAlign: 'center', fontSize: 14, fontFamily: 'Poppins_500Medium' },
});
