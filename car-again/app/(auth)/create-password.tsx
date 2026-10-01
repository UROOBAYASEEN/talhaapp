import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthGlowBackground from '@/components/auth/AuthGlowBackground';
import { PassRule } from '@/components/auth/AuthGlow';
import { GlassField, GradientButton, ScreenHeader } from '@/components/shared/GlowUI';
import { API_BASE } from '@/constants/api';

export default function CreatePasswordScreen() {
  const router = useRouter();
  const { phone, otp_code } = useLocalSearchParams<{ phone: string; otp_code: string }>();

  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [errors,          setErrors]          = useState<Record<string, string>>({});

  // ── Password strength ──────────────────────────────────────────
  const pwValid = {
    length:  newPassword.length >= 8,
    letters: /[a-zA-Z]/.test(newPassword),
    numbers: /[0-9]/.test(newPassword),
  };

  // ── Per-field validation ───────────────────────────────────────
  function getPasswordError(val: string): string {
    if (!val)                          return 'Password is required';
    if (val.length < 8)               return 'Password must be at least 8 characters';
    if (!/[a-zA-Z]/.test(val))        return 'Password must contain at least one letter';
    if (!/[0-9]/.test(val))           return 'Password must contain at least one number';
    return '';
  }

  function getConfirmError(newVal: string, confirmVal: string): string {
    if (!confirmVal)                   return 'Please confirm your password';
    if (newVal !== confirmVal)         return 'Passwords do not match';
    return '';
  }

  // ── Real-time clear on valid ───────────────────────────────────
  function handleNewPasswordChange(val: string) {
    setNewPassword(val);
    if (errors.newPassword !== undefined) {
      setErrors(prev => ({ ...prev, newPassword: getPasswordError(val) }));
    }
    // also re-check confirm if it was already touched
    if (errors.confirmPassword !== undefined) {
      setErrors(prev => ({ ...prev, confirmPassword: getConfirmError(val, confirmPassword) }));
    }
  }

  function handleConfirmChange(val: string) {
    setConfirmPassword(val);
    if (errors.confirmPassword !== undefined) {
      setErrors(prev => ({ ...prev, confirmPassword: getConfirmError(newPassword, val) }));
    }
  }

  // ── Submit ─────────────────────────────────────────────────────
  async function handleReset() {
    const pwErr      = getPasswordError(newPassword);
    const confirmErr = getConfirmError(newPassword, confirmPassword);
    if (pwErr || confirmErr) {
      setErrors({ newPassword: pwErr, confirmPassword: confirmErr });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp_code,
          new_password:     newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Reset failed');
      router.replace('/(auth)/password-updated');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  const eye = (on: boolean, toggle: () => void) => (
    <TouchableOpacity onPress={toggle}>
      <Ionicons name={on ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8F8A96" />
    </TouchableOpacity>
  );

  return (
    <AuthGlowBackground>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader logo />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.subtitle}>Set a new password for your account security.</Text>

          <GlassField
            placeholder="New password"
            value={newPassword}
            onChangeText={handleNewPasswordChange}
            secureTextEntry={!showNew}
            right={eye(showNew, () => setShowNew(!showNew))}
          />
          {errors.newPassword ? <Text style={styles.err}>{errors.newPassword}</Text> : null}
          <Text style={styles.rulesTitle}>Password must include:</Text>
          <PassRule met={pwValid.length}  label="At least 8 characters" />
          <PassRule met={pwValid.letters} label="Include letters" />
          <PassRule met={pwValid.numbers} label="Include numbers" />

          <GlassField
            containerStyle={{ marginTop: 22 }}
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={handleConfirmChange}
            secureTextEntry={!showConfirm}
            right={eye(showConfirm, () => setShowConfirm(!showConfirm))}
          />
          {errors.confirmPassword ? <Text style={styles.err}>{errors.confirmPassword}</Text> : null}
        </ScrollView>
        <View style={styles.btnFixed}>
          <GradientButton title="Reset Password" height={50} fontSize={17} onPress={handleReset} loading={loading} />
        </View>
      </SafeAreaView>
    </AuthGlowBackground>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1 },
  content:  { paddingHorizontal: 16, paddingBottom: 20 },
  btnFixed: { paddingHorizontal: 16, paddingBottom: 20 },
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
    marginBottom: 20,
  },
  rulesTitle: { color: '#BAACB6', fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 10 },
  err: { color: '#FF6B6D', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 6, marginLeft: 2 },
});
