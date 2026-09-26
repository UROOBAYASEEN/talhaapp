import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '@/components/auth/AuthHeader';
import GlassInput from '@/components/auth/GlassInput';
import LinearButton from '@/components/auth/LinearButton';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';

export default function CreatePasswordScreen() {
  const router = useRouter();
  const C = useAppColors();
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
    special: /[^a-zA-Z0-9]/.test(newPassword),
  };
  const strengthScore = Object.values(pwValid).filter(Boolean).length;
  const strengthLabel = strengthScore <= 1 ? 'Weak' : strengthScore === 2 ? 'Fair' : strengthScore === 3 ? 'Good' : 'Strong';
  const strengthColor = strengthScore <= 1 ? '#e74c3c' : strengthScore === 2 ? '#e2671b' : strengthScore === 3 ? '#f0c040' : '#27ae60';

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
      <AuthHeader />
      <View style={styles.content}>
        <Text style={[styles.title, { color: C.textPrimary }]}>Create New Password</Text>
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>
          Set a strong password to keep your account secure.
        </Text>

        <View style={styles.form}>

          {/* ── New Password ── */}
          <View>
            <GlassInput
              accentBorderColor="rgba(100,160,255,0.5)"
              placeholder="New password"
              value={newPassword}
              onChangeText={handleNewPasswordChange}
              secureTextEntry={!showNew}
              error={errors.newPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  <Ionicons
                    name={showNew ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={C.textPlaceholder}
                  />
                </TouchableOpacity>
              }
            />

            {newPassword.length > 0 && (
              <View style={styles.rules}>
                {/* Strength bar */}
                <View style={styles.strengthRow}>
                  {[1, 2, 3, 4].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthSegment,
                        { backgroundColor: i <= strengthScore ? strengthColor : C.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(3,12,40,0.12)' },
                      ]}
                    />
                  ))}
                  <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
                </View>

                <Text style={[styles.rulesTitle, { color: C.textSecondary }]}>Password must include:</Text>
                <RuleItem met={pwValid.length}  label="At least 8 characters"        color={C.textHint} />
                <RuleItem met={pwValid.letters} label="At least one letter"           color={C.textHint} />
                <RuleItem met={pwValid.numbers} label="At least one number"           color={C.textHint} />
                <RuleItem met={pwValid.special} label="Special character (!@#…)  (recommended)" color={C.textHint} />
              </View>
            )}
          </View>

          {/* ── Confirm Password ── */}
          <View>
            <GlassInput
              accentBorderColor="rgba(100,160,255,0.5)"
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={handleConfirmChange}
              secureTextEntry={!showConfirm}
              error={errors.confirmPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={C.textPlaceholder}
                  />
                </TouchableOpacity>
              }
            />
            {/* Match indicator — only show when both fields have content and no error */}
            {confirmPassword.length > 0 && !errors.confirmPassword && newPassword === confirmPassword && (
              <View style={styles.matchRow}>
                <Ionicons name="checkmark-circle" size={14} color="#27ae60" />
                <Text style={styles.matchText}>Passwords match</Text>
              </View>
            )}
          </View>

        </View>
      </View>
      <View style={styles.btnFixed}>
        <LinearButton title="Reset Password" onPress={handleReset} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

function RuleItem({ met, label, color }: { met: boolean; label: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'radio-button-off-outline'}
        size={16}
        color={met ? '#27ae60' : color}
      />
      <Text style={{ fontSize: 12, color: met ? '#27ae60' : color, fontFamily: 'Poppins_400Regular' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, paddingHorizontal: 20 },
  content: { flex: 1 },
  btnFixed: { paddingBottom: 24 },

  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 28,
    lineHeight: 22,
  },

  form: { gap: 16 },

  rules: { marginTop: 8, paddingLeft: 4, gap: 2 },

  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 4,
  },
  strengthLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    width: 44,
    textAlign: 'right',
  },

  rulesTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 2,
  },

  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingLeft: 4,
  },
  matchText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#27ae60',
  },
});
