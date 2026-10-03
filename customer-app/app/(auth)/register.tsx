import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthGlowBackground from '@/components/auth/AuthGlowBackground';
import { API_BASE } from '@/constants/api';
import { PassRule, SocialButtons } from '@/components/auth/AuthGlow';
import { G, Glass, GlassField, GradientButton, OrDivider, ScreenHeader } from '@/components/shared/GlowUI';
import { useAuth } from '@/contexts/AuthContext';
import { exchangeGoogleCode, getGoogleCode } from '@/hooks/useGoogleAuthFlow';

const ROLES = [
  { key: 'customer',            label: 'Customer',                             desc: 'Buy cars, bikes, financing & insurance', icon: require('@/assets/images/role-customer.png') },
  { key: 'bank_representative', label: 'Bank Representative',                  desc: 'Manage auto-loan offering',              icon: require('@/assets/images/role-bank.png') },
  { key: 'dealership_owner',    label: 'Dealership Owner',                     desc: 'List inventory & manage leads',          icon: require('@/assets/images/role-dealership.png') },
  { key: 'individual_seller',   label: 'Seller',                               desc: 'Sell your own used vehicles directly',   emoji: '🏷️' },
  { key: 'insurance_provider',  label: 'Insurance Provider',                   desc: 'Offer vehicle insurance plans',          icon: require('@/assets/images/role-insurance.png') },
  { key: 'tracker_provider',    label: 'Tracker Provider',                     desc: 'Provide tracking & telematics',          icon: require('@/assets/images/role-tracker.png') },
] as const;

// Only Customer and Seller are offered for now; the other roles stay defined for later.
const VISIBLE_ROLES: string[] = ['customer', 'individual_seller'];

function fmtCnic(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth, logout } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', cnic: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState<string>('customer');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pass = {
    length:  form.password.length >= 8,
    letters: /[a-zA-Z]/.test(form.password),
    numbers: /[0-9]/.test(form.password),
  };

  function update(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: k === 'cnic' ? fmtCnic(v) : v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (form.full_name.trim().length < 3) e.full_name = 'Please enter your full name';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    if (!/^(\+92|0)3[0-9]{9}$/.test(form.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a valid phone number';
    if (form.cnic && form.cnic.replace(/\D/g, '').length !== 13) e.cnic = 'CNIC must be 13 digits';
    if (!pass.length || !pass.letters || !pass.numbers) e.password = 'Password does not meet the requirements';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;
    if (!agreed) { Alert.alert('Terms', 'Please accept the terms and conditions to continue.'); return; }
    setLoading(true);
    try {
      const phone = form.phone.replace(/[\s-]/g, '');
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email:     form.email.trim() || undefined,
          phone,
          cnic:      form.cnic || undefined,
          password:  form.password,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Registration failed');
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { phone, purpose: 'register', role, dev_otp: data.dev_otp ?? '', sent_to: data.sent_to ?? phone },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  const err = (k: string) => (errors[k] ? <Text style={s.err}>{errors[k]}</Text> : null);

  async function handleGooglePress() {
    if (googleLoading || loading) return;
    if (!agreed) { Alert.alert('Terms', 'Please accept the terms and conditions to continue.'); return; }
    setGoogleLoading(true);
    try {
      const code = await getGoogleCode();
      if (!code) return; // user cancelled
      setLoading(true);
      const data = await exchangeGoogleCode(code, { role });
      const newUser = await setAuth(data.access_token, data.refresh_token);
      if (!newUser?.role) {
        await logout();
        Alert.alert('Sign-Up Failed', 'Could not verify account details. Please try again.');
        return;
      }
      if (newUser.role !== 'customer' && newUser.role !== 'individual_seller') {
        await logout();
        Alert.alert('Account Not Found', 'No customer account found with this email — please use the business (panels) app.');
        return;
      }
      if (newUser.role === 'individual_seller') {
        router.replace('/Become_a_Seller' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch (err: any) {
      Alert.alert('Google Sign-Up Failed', err.message || 'Please try again.');
    } finally {
      setGoogleLoading(false);
      setLoading(false);
    }
  };

  return (
    <AuthGlowBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenHeader logo />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={s.title}>Create Account</Text>
            <Text style={s.subtitle}>Join Autowizor and simplify your car journey.</Text>

            <View style={s.form}>
              <View>
                <GlassField placeholder="Full name" value={form.full_name} onChangeText={v => update('full_name', v)} autoCapitalize="words" />
                {err('full_name')}
              </View>
              <View>
                <GlassField placeholder="Your email" value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
                {err('email')}
              </View>
              <View>
                <GlassField placeholder="Phone number" value={form.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" />
                <Text style={s.hint}>{errors.phone || 'Format: +92 349 9571255'}</Text>
              </View>
              <View>
                <GlassField placeholder="Your CNIC" value={form.cnic} onChangeText={v => update('cnic', v)} keyboardType="number-pad" />
                <Text style={s.hint}>{errors.cnic || 'Format: 12345-1234567-1'}</Text>
              </View>
              <View>
                <GlassField
                  placeholder="Your password"
                  value={form.password}
                  onChangeText={v => update('password', v)}
                  secureTextEntry={!showPass}
                  right={
                    <TouchableOpacity onPress={() => setShowPass(x => !x)}>
                      <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8F8A96" />
                    </TouchableOpacity>
                  }
                />
                <Text style={s.rulesTitle}>Password must include:</Text>
                <PassRule met={pass.length} label="At least 8 characters" />
                <PassRule met={pass.letters} label="Include letters" />
                <PassRule met={pass.numbers} label="Include numbers" />
              </View>
            </View>

            <Text style={s.roleTitle}>Select Your Role</Text>
            <View style={{ gap: 12 }}>
              {ROLES.filter(r => VISIBLE_ROLES.includes(r.key)).map(r => {
                const sel = role === r.key;
                return (
                  <TouchableOpacity key={r.key} style={s.role} activeOpacity={0.85} onPress={() => setRole(r.key)}>
                    <Glass radius={25} blur={14} />
                    <View style={s.roleIcon}>
                      {'emoji' in r ? <Text style={{ fontSize: 14 }}>{r.emoji}</Text> : <Image source={r.icon} style={{ width: 17, height: 17 }} resizeMode="contain" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.roleName} numberOfLines={1}>{r.label}</Text>
                      <Text style={s.roleDesc} numberOfLines={1}>{r.desc}</Text>
                    </View>
                    <View style={[s.radio, sel && s.radioOn]}>
                      {sel && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={s.terms} activeOpacity={0.8} onPress={() => setAgreed(a => !a)}>
              <View style={[s.check, agreed && { borderColor: G.orange, backgroundColor: G.orange }]}>
                {agreed && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={s.termsTxt}>
                I confirm that I have read and accept the{' '}
                <Text style={{ color: G.orange, fontFamily: 'Poppins_600SemiBold' }}>terms and conditions</Text>
                {' '}and privacy policy.
              </Text>
            </TouchableOpacity>

            <GradientButton title="Create Account" height={50} fontSize={17} loading={loading} onPress={handleCreate} />
            <View style={{ marginVertical: 14 }}><OrDivider /></View>
            <View style={{ gap: 14 }}>
              <SocialButtons onGooglePress={handleGooglePress} googleLoading={googleLoading} />
            </View>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={{ marginTop: 16 }}>
              <Text style={s.signin}>
                Already have an account?{' '}
                <Text style={{ color: '#FFFFFF' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthGlowBackground>
  );
}

const s = StyleSheet.create({
  scroll:     { paddingHorizontal: 16, paddingBottom: 32 },
  title:      { color: '#FFFFFF', fontSize: 22, fontFamily: 'Poppins_600SemiBold', marginTop: 8 },
  subtitle:   { color: G.muted, fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 2, marginBottom: 14 },
  form:       { gap: 14 },
  hint:       { color: '#FF6B6D', fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 6, marginLeft: 2 },
  err:        { color: '#FF6B6D', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 6, marginLeft: 2 },
  rulesTitle: { color: G.muted, fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 10 },

  roleTitle: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginTop: 22, marginBottom: 12 },
  role:      { height: 50, borderRadius: 25, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 12 },
  roleIcon:  { width: 30, height: 30, borderRadius: 15, backgroundColor: '#0A1B45', alignItems: 'center', justifyContent: 'center' },
  roleName:  { color: '#E6E1E8', fontSize: 13.5, fontFamily: 'Poppins_500Medium' },
  roleDesc:  { color: G.muted, fontSize: 10.5, fontFamily: 'Poppins_400Regular' },
  radio:     { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#C9C6D0', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  radioOn:   { backgroundColor: G.orange, borderColor: '#136AB1' },

  terms:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 18, marginBottom: 18, paddingHorizontal: 2 },
  check:    { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#C9C6D0', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  termsTxt: { flex: 1, color: G.muted, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  signin:   { textAlign: 'center', color: G.muted, fontSize: 14, fontFamily: 'Poppins_400Regular' },
});
