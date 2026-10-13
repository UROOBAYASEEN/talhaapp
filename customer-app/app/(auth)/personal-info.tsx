import { AUTH_EDGES } from '@/constants/authEdges';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '@/components/auth/AuthHeader';
import GlassInput from '@/components/auth/GlassInput';
import LinearButton from '@/components/auth/LinearButton';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const C = useAppColors();
  const { role } = useLocalSearchParams<{ role: string }>();

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const passValid = {
    length:  form.password.length >= 8,
    letters: /[a-zA-Z]/.test(form.password),
    numbers: /[0-9]/.test(form.password),
  };

  function validate() {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    else if (form.full_name.trim().length < 3) e.full_name = 'At least 3 characters';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^(\+92|0)[0-9]{10}$/.test(form.phone.trim().replace(/\s|-/g, ''))) e.phone = 'e.g. 03001234567';
    if (!form.password) e.password = 'Password is required';
    else if (!passValid.length || !passValid.letters || !passValid.numbers) e.password = 'Password too weak';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email:     form.email.trim() || undefined,
          phone:     form.phone.trim(),
          password:  form.password,
          role:      role || 'customer',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { phone: form.phone.trim(), purpose: 'register', role: role || 'customer', dev_otp: data.dev_otp ?? '', sent_to: data.sent_to ?? form.phone },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={AUTH_EDGES} style={[s.safe, { backgroundColor: C.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <AuthHeader />
          <Text style={[s.title, { color: C.textPrimary }]}>Personal Information</Text>
          <Text style={[s.subtitle, { color: C.textSecondary }]}>Please provide your personal details</Text>

          <View style={s.form}>
            <GlassInput accentBorderColor="rgba(100,160,255,0.5)" placeholder="Full Name" value={form.full_name} onChangeText={v => update('full_name', v)} error={errors.full_name}/>
            <GlassInput accentBorderColor="rgba(100,160,255,0.5)" placeholder="Email Address" value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" autoCapitalize="none" error={errors.email}/>
            <GlassInput accentBorderColor="rgba(100,160,255,0.5)" placeholder="Phone Number" value={form.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" hint={errors.phone ? undefined : '03XX XXXXXXX'} error={errors.phone}/>

            <View>
              <GlassInput
                accentBorderColor="rgba(100,160,255,0.5)"
                placeholder="Password"
                value={form.password}
                onChangeText={v => update('password', v)}
                secureTextEntry={!showPass}
                error={errors.password}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textPlaceholder}/>
                  </TouchableOpacity>
                }
              />
              {form.password.length > 0 && (
                <View style={s.passRules}>
                  <Text style={[s.rulesTitle, { color: C.textSecondary }]}>Password must include:</Text>
                  <PassRule met={passValid.length}  label="At least 8 characters" color={C.textHint}/>
                  <PassRule met={passValid.letters} label="Include letters"        color={C.textHint}/>
                  <PassRule met={passValid.numbers} label="Include numbers"        color={C.textHint}/>
                </View>
              )}
            </View>

            <GlassInput
              accentBorderColor="rgba(100,160,255,0.5)"
              placeholder="Confirm Password"
              value={form.confirm_password}
              onChangeText={v => update('confirm_password', v)}
              secureTextEntry={!showConf}
              error={errors.confirm_password}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConf(!showConf)}>
                  <Ionicons name={showConf ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textPlaceholder}/>
                </TouchableOpacity>
              }
            />

            <LinearButton title="Create Account" onPress={handleSubmit} loading={loading}/>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[s.signinText, { color: C.textSecondary }]}>
                Already have an account?{' '}
                <Text style={{ color: '#e2671b', fontFamily: 'Poppins_600SemiBold' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 32 }}/>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PassRule({ met, label, color }: { met: boolean; label: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 }}>
      <Ionicons name={met ? 'checkmark-circle' : 'radio-button-off-outline'} size={15} color={met ? '#27ae60' : color}/>
      <Text style={{ fontSize: 12, color, fontFamily: 'Poppins_400Regular' }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1 },
  scroll:    { paddingHorizontal: 20, paddingBottom: 48 },
  title:     { fontSize: 20, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  subtitle:  { fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 20 },
  form:      { gap: 16 },
  passRules: { marginTop: 8, paddingLeft: 4 },
  rulesTitle:{ fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 2 },
  signinText:{ textAlign: 'center', fontSize: 14, fontFamily: 'Poppins_500Medium', marginTop: 4 },
});
