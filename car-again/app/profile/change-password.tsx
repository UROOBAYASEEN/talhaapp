import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppColors } from '@/constants/theme';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const BG      = '#010a1f';
const WHITE   = '#f9fafc';
const SUB     = '#baacb6';
const ORANGE  = '#e2671b';
const CARD_BG = 'rgba(6,17,60,0.85)';
const SHADOW  = '#1D53AF';

export default function ChangePasswordScreen() {
  const router      = useRouter();
  const T           = useAppColors();
  const { token }   = useAuth();

  const [form,   setForm]   = useState({ old: '', newPw: '', confirm: '' });
  const [show,   setShow]   = useState({ old: false, newPw: false, confirm: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // ── Password strength ────────────────────────────────────────────────
  const pwValid = {
    length:  form.newPw.length >= 8,
    letters: /[a-zA-Z]/.test(form.newPw),
    numbers: /[0-9]/.test(form.newPw),
    special: /[^a-zA-Z0-9]/.test(form.newPw),
  };
  const strength = Object.values(pwValid).filter(Boolean).length;
  const strengthLabel = strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong';
  const strengthColor = strength <= 1 ? '#e74c3c' : strength === 2 ? ORANGE : strength === 3 ? '#f0c040' : '#27ae60';

  // ── Validation ───────────────────────────────────────────────────────
  function validate() {
    const e: Record<string, string> = {};
    if (!form.old)              e.old     = 'Current password is required';
    if (!form.newPw)            e.newPw   = 'New password is required';
    else if (form.newPw.length < 8)         e.newPw   = 'Must be at least 8 characters';
    else if (!/[a-zA-Z]/.test(form.newPw)) e.newPw   = 'Must contain at least one letter';
    else if (!/[0-9]/.test(form.newPw))    e.newPw   = 'Must contain at least one number';
    if (!form.confirm)          e.confirm = 'Please confirm your password';
    else if (form.newPw !== form.confirm)   e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function clearIfValid(field: string, value: string) {
    if (errors[field] === undefined) return;
    const e = { ...errors };
    if (field === 'old'     && value)                          delete e.old;
    if (field === 'newPw'   && value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value)) delete e.newPw;
    if (field === 'confirm' && value === form.newPw)           delete e.confirm;
    setErrors(e);
  }

  // ── Submit ───────────────────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/profile/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: form.old, new_password: form.newPw }),
      });
      if (res.ok) {
        Alert.alert('Success ✓', 'Your password has been updated successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const e = await res.json();
        Alert.alert('Error', e.detail || 'Failed to change password');
      }
    } catch { Alert.alert('Error', 'Network error. Please try again.'); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: T.bg }]} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color={T.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: T.textPrimary }]}>Change Password</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: T.bg }}>
        <ScrollView contentContainerStyle={s.scroll} style={{ backgroundColor: T.bg }} showsVerticalScrollIndicator={false}>

          {/* Banner */}
          <LinearGradient colors={['#032a69', '#061b4a']} style={s.banner}>
            <View style={s.bannerIcon}>
              <Ionicons name="lock-closed" size={30} color={ORANGE} />
            </View>
            <Text style={s.bannerTitle}>Secure Your Account</Text>
            <Text style={s.bannerSub}>Choose a strong password to keep your account safe</Text>
          </LinearGradient>

          {/* Current Password */}
          <View style={s.fieldGroup}>
              <Text style={[s.label, { color: T.textSecondary }]}>Current Password</Text>
            <View style={[s.inputWrap, errors.old ? s.inputError : null]}>
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <TextInput style={[s.input, { color: T.textPrimary }]} placeholder="Enter current password" placeholderTextColor="rgba(186,172,182,0.4)" value={form.old} onChangeText={v => { setForm(p => ({ ...p, old: v })); clearIfValid('old', v); }} secureTextEntry={!show.old} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShow(p => ({ ...p, old: !p.old }))} style={s.eye}>
                <Ionicons name={show.old ? 'eye-off-outline' : 'eye-outline'} size={20} color={SUB} />
              </TouchableOpacity>
            </View>
            {errors.old ? <Text style={s.errorTxt}>{errors.old}</Text> : null}
          </View>

          {/* New Password */}
          <View style={s.fieldGroup}>
            <Text style={[s.label, { color: T.textSecondary }]}>New Password</Text>
            <View style={[s.inputWrap, errors.newPw ? s.inputError : null]}>
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <TextInput style={[s.input, { color: T.textPrimary }]} placeholder="Enter new password" placeholderTextColor="rgba(186,172,182,0.4)" value={form.newPw} onChangeText={v => { setForm(p => ({ ...p, newPw: v })); clearIfValid('newPw', v); }} secureTextEntry={!show.newPw} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShow(p => ({ ...p, newPw: !p.newPw }))} style={s.eye}>
                <Ionicons name={show.newPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={SUB} />
              </TouchableOpacity>
            </View>
            {errors.newPw ? <Text style={s.errorTxt}>{errors.newPw}</Text> : null}

            {/* Strength bar */}
            {form.newPw.length > 0 && (
              <View style={s.strengthWrap}>
                <View style={s.strengthBar}>
                  {[1, 2, 3, 4].map(i => (
                    <View key={i} style={[s.strengthSeg, { backgroundColor: i <= strength ? strengthColor : 'rgba(255,255,255,0.1)' }]} />
                  ))}
                </View>
                <Text style={[s.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
              </View>
            )}

            {/* Rules */}
            {form.newPw.length > 0 && (
              <View style={s.rules}>
                <Rule met={pwValid.length}  label="At least 8 characters"  />
                <Rule met={pwValid.letters} label="At least one letter"     />
                <Rule met={pwValid.numbers} label="At least one number"     />
                <Rule met={pwValid.special} label="Special character (recommended)" />
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={s.fieldGroup}>
            <Text style={[s.label, { color: T.textSecondary }]}>Confirm New Password</Text>
            <View style={[s.inputWrap, errors.confirm ? s.inputError : null]}>
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <TextInput style={[s.input, { color: T.textPrimary }]} placeholder="Re-enter new password" placeholderTextColor="rgba(186,172,182,0.4)" value={form.confirm} onChangeText={v => { setForm(p => ({ ...p, confirm: v })); clearIfValid('confirm', v); }} secureTextEntry={!show.confirm} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShow(p => ({ ...p, confirm: !p.confirm }))} style={s.eye}>
                <Ionicons name={show.confirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={SUB} />
              </TouchableOpacity>
            </View>
            {errors.confirm ? (
              <Text style={s.errorTxt}>{errors.confirm}</Text>
            ) : form.confirm.length > 0 && form.newPw === form.confirm ? (
              <View style={s.matchRow}>
                <Ionicons name="checkmark-circle" size={14} color="#27ae60" />
                <Text style={s.matchTxt}>Passwords match</Text>
              </View>
            ) : null}
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.87}
            style={s.btnWrap}
          >
            <LinearGradient
              colors={['#032a69', ORANGE]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.btn}
            >
              {saving
                ? <ActivityIndicator color={WHITE} size="small" />
                : <Text style={s.btnTxt}>Update Password</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Rule({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
      <Ionicons name={met ? 'checkmark-circle' : 'radio-button-off-outline'} size={15} color={met ? '#27ae60' : SUB} />
      <Text style={{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: met ? '#27ae60' : SUB }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
  },
  backBtn:     { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_500Medium', color: WHITE },

  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 20 },

  // Banner
  banner: {
    borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 10,
  },
  bannerIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(226,103,27,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: WHITE },
  bannerSub:   { fontSize: 13, fontFamily: 'Poppins_400Regular', color: SUB, textAlign: 'center' },

  // Field
  fieldGroup: { gap: 8 },
  label:      { fontSize: 14, fontFamily: 'Poppins_500Medium', color: SUB },

  inputWrap: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    borderRadius: 32, borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)',
    backgroundColor: 'rgba(3,12,40,0.6)',
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  inputError: { borderColor: '#e74c3c' },
  input: {
    flex: 1, fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    padding: 0,
  },
  eye: { paddingLeft: 8 },

  errorTxt: {
    fontSize: 11, fontFamily: 'Poppins_400Regular',
    color: '#e74c3c', paddingLeft: 4,
  },

  // Strength
  strengthWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  strengthBar:   { flex: 1, flexDirection: 'row', gap: 4 },
  strengthSeg:   { flex: 1, height: 4, borderRadius: 4 },
  strengthLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', width: 44, textAlign: 'right' },

  rules: { paddingLeft: 2 },

  // Match
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4 },
  matchTxt:  { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#27ae60' },

  // Button
  btnWrap: { borderRadius: 32, overflow: 'hidden', backgroundColor: BG },
  btn:     { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnTxt:  { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: WHITE },
});
