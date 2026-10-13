import { AUTH_EDGES } from '@/constants/authEdges';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Clock, ShieldCheck, XCircle } from 'lucide-react-native';
import LinearButton from '@/components/auth/LinearButton';
import AuthHeader from '@/components/auth/AuthHeader';
import { useAppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/constants/api';

const ORANGE = '#e2671b';
const GREEN  = '#27ae60';
const RED    = '#e74c3c';

export default function VerificationStatusScreen() {
  const router = useRouter();
  const C = useAppColors();
  const { setAuth, user, token, refreshUser } = useAuth();
  const { access_token, refresh_token } = useLocalSearchParams<{ access_token: string; refresh_token: string }>();

  const [docsStatus, setDocsStatus] = useState<string>(user?.docs_status || 'pending');
  const [rejectionReason, setRejectionReason] = useState<string | null>(user?.docs_rejection_reason || null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Authenticate with registration-flow tokens if present
  useEffect(() => {
    if (access_token && refresh_token && !user) {
      setAuth(access_token, refresh_token);
    }
  }, []);

  // Poll /auth/me every 8 seconds while pending
  useEffect(() => {
    if (docsStatus !== 'pending') return;

    const authToken = access_token || token;
    if (!authToken) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const u = await res.json();
          if (u.docs_status && u.docs_status !== 'pending') {
            setDocsStatus(u.docs_status);
            setRejectionReason(u.docs_rejection_reason || null);
            await refreshUser();
            if (u.docs_status === 'approved') {
              Alert.alert('Account Approved!', 'Your account has been verified. You can now access the dashboard.');
            } else if (u.docs_status === 'rejected') {
              const reason = u.docs_rejection_reason || 'Please contact support.';
              Alert.alert('Verification Failed', `Your account was not approved.\n\nReason: ${reason}`);
            }
          }
        }
      } catch { /* silent */ }
    }, 8000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [docsStatus, token, access_token]);

  async function handleGoHome() {
    if (access_token && refresh_token && !user) {
      await setAuth(access_token, refresh_token);
    }
    await refreshUser();
    const role = user?.role;
    if (role === 'individual_seller')   router.replace('/Become_a_Seller' as any);
    else                                router.replace('/(tabs)');
  }

  // ── Approved state ─────────────────────────────────────────────
  if (docsStatus === 'approved') {
    return (
      <SafeAreaView edges={AUTH_EDGES} style={[s.safe, { backgroundColor: C.bg }]}>
        <View style={s.container}>
          <AuthHeader />
          <View style={s.graphic}>
            <LinearGradient colors={['rgba(39,174,96,0.25)', 'rgba(22,64,136,0.15)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.circle} />
            <CheckCircle size={64} color={GREEN} style={{ position: 'absolute' }} />
          </View>
          <Text style={[s.title, { color: C.textPrimary }]}>Account Approved!</Text>
          <Text style={[s.subtitle, { color: C.textSecondary }]}>
            Congratulations! Your account has been verified. You can now access all features.
          </Text>
          <StatusCard steps={[
            { label: 'Account Created',     done: true },
            { label: 'Documents Submitted', done: true },
            { label: 'Verification Passed', done: true, color: GREEN },
          ]} C={C} />
          <View style={{ flex: 1 }} />
          <LinearButton title="Go to Dashboard" onPress={handleGoHome} />
          <View style={{ height: 32 }} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Rejected state ─────────────────────────────────────────────
  if (docsStatus === 'rejected') {
    return (
      <SafeAreaView edges={AUTH_EDGES} style={[s.safe, { backgroundColor: C.bg }]}>
        <View style={s.container}>
          <AuthHeader />
          <View style={s.graphic}>
            <LinearGradient colors={['rgba(231,76,60,0.25)', 'rgba(22,64,136,0.15)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.circle} />
            <XCircle size={64} color={RED} style={{ position: 'absolute' }} />
          </View>
          <Text style={[s.title, { color: C.textPrimary }]}>Verification Failed</Text>
          <Text style={[s.subtitle, { color: C.textSecondary }]}>
            {rejectionReason
              ? `Reason: ${rejectionReason}`
              : 'Your documents were not approved. Please contact support or re-upload.'}
          </Text>
          <StatusCard steps={[
            { label: 'Account Created',     done: true },
            { label: 'Documents Submitted', done: true },
            { label: 'Verification Failed', done: true, color: RED },
          ]} C={C} />
          <View style={{ flex: 1 }} />
          <LinearButton title="Re-upload Documents" onPress={() => router.replace('/(auth)/upload-documents' as any)} />
          <View style={{ height: 32 }} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Pending state (default) ────────────────────────────────────
  return (
    <SafeAreaView edges={AUTH_EDGES} style={[s.safe, { backgroundColor: C.bg }]}>
      <View style={s.container}>
        <AuthHeader />
        <View style={s.graphic}>
          <LinearGradient colors={['rgba(22,64,136,0.3)', 'rgba(226,103,27,0.15)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.circle} />
          <ShieldCheck size={64} color={ORANGE} style={{ position: 'absolute' }} />
        </View>
        <Text style={[s.title, { color: C.textPrimary }]}>Account Under Review</Text>
        <Text style={[s.subtitle, { color: C.textSecondary }]}>
          Your documents have been submitted. Our team will review and notify you once approved.
        </Text>
        <StatusCard steps={[
          { label: 'Account Created',     done: true },
          { label: 'Documents Submitted', done: true },
          { label: 'Under Review',        done: false },
        ]} C={C} />
        <View style={[s.pollNote, { backgroundColor: 'rgba(22,64,136,0.1)', borderColor: 'rgba(100,160,255,0.2)' }]}>
          <Text style={[s.pollText, { color: C.textSecondary }]}>
            This page will update automatically when your account is reviewed.
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <LinearButton title="Back to Login" onPress={() => router.replace('/(auth)/login')} />
        <View style={{ height: 32 }} />
      </View>
    </SafeAreaView>
  );
}

// ── Shared step card ───────────────────────────────────────────────────────
function StatusCard({ steps, C }: { steps: { label: string; done: boolean; color?: string }[]; C: any }) {
  return (
    <View style={[s.stepsCard, { backgroundColor: C.glassBg, borderColor: C.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,12,40,0.12)' }]}>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      {steps.map((step, i) => {
        const color = step.color || (step.done ? ORANGE : undefined);
        return (
          <View key={i} style={[s.stepRow, i < steps.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.divider }]}>
            <View style={[s.stepIcon, { backgroundColor: step.done ? `${color}22` : C.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,12,40,0.06)' }]}>
              {step.done
                ? <CheckCircle size={20} color={color} />
                : <Clock size={20} color={C.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(3,12,40,0.4)'} />
              }
            </View>
            <Text style={[s.stepLabel, { color: step.done ? C.textPrimary : C.textSecondary }]}>{step.label}</Text>
            <View style={[s.stepStatus, { backgroundColor: step.done ? `${color}18` : C.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,12,40,0.06)', borderColor: step.done ? `${color}44` : C.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,12,40,0.1)' }]}>
              <Text style={[s.stepStatusTxt, { color: step.done ? color : C.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(3,12,40,0.5)' }]}>
                {step.done ? 'Done' : 'Pending'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  graphic:   { alignItems: 'center', justifyContent: 'center', height: 140, marginBottom: 20 },
  circle:    { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
  title:     { fontSize: 22, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 12 },
  subtitle:  { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: 28, opacity: 0.8 },
  stepsCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  stepRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  stepIcon:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { flex: 1, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  stepStatus:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  stepStatusTxt: { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  pollNote:  { borderRadius: 12, borderWidth: 1, padding: 12 },
  pollText:  { fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 16 },
});
