import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, Alert, ActivityIndicator, AppState,
} from 'react-native';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VehicleRowCard } from '@/components/dealer/DealerUI';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import PaymentSection, { PayMethod } from '@/components/shared/PaymentSection';

const ORANGE = AppColors.gradientEnd;
const C      = AppColors;

interface Checkout {
  promotion_id: string;
  checkout_url: string;
  vehicle_id:   string;
}

export default function PromotePaymentScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const params = useLocalSearchParams<{
    vehicle_ids: string;
    plan_title:  string;
    amount:      string;
    duration:    string;
  }>();

  const vehicle_ids = (params.vehicle_ids || '').split(',').filter(Boolean);
  const planTitle   = params.plan_title || 'Promotion';
  const duration    = Number(params.duration || 7);
  const planAmount  = Number(params.amount || 0);

  const [vehicle,    setVehicle]    = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [waiting,    setWaiting]    = useState(false);
  const [paid,       setPaid]       = useState(false);

  const checkoutsRef    = useRef<Checkout[]>([]);
  const currentIdxRef   = useRef(0);
  const pollIntervalRef = useRef<any>(null);
  const appStateRef     = useRef(AppState.currentState);
  const isWaitingRef    = useRef(false); // avoids stale closure

  useEffect(() => {
    if (!vehicle_ids[0] || !token) { setLoading(false); return; }
    fetch(`${API_BASE}/vehicles/${vehicle_ids[0]}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setVehicle(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    // AppState — restart polling when coming back to foreground
    const appSub = AppState.addEventListener('change', nextState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active' &&
        isWaitingRef.current
      ) {
        startPolling();
      }
      appStateRef.current = nextState;
    });

    // Deep link — caragain://payment-success from SafePay redirect page
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('payment-success') && isWaitingRef.current) {
        stopPolling();
        isWaitingRef.current = false;
        setWaiting(false);
        setSubmitting(false);
        setPaid(true);
      }
    });

    return () => {
      appSub.remove();
      linkSub.remove();
      stopPolling();
    };
  }, []);

  function startPolling() {
    stopPolling();
    pollIntervalRef.current = setInterval(pollStatus, 2500);
    pollStatus(); // immediate first check
  }

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  async function pollStatus() {
    const checkouts = checkoutsRef.current;
    const idx       = currentIdxRef.current;
    if (idx >= checkouts.length) {
      stopPolling();
      isWaitingRef.current = false;
      setWaiting(false);
      setSubmitting(false);
      setPaid(true);
      /* record backend-side with real amount via _mark_success — no 0-amount duplicate */
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/payments/safepay/status/${checkouts[idx].promotion_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        currentIdxRef.current += 1;
        if (currentIdxRef.current >= checkouts.length) {
          stopPolling();
          isWaitingRef.current = false;
          setWaiting(false);
          setSubmitting(false);
          setPaid(true);
          /* record backend-side with real amount via _mark_success — no 0-amount duplicate */
        } else {
          await Linking.openURL(checkouts[currentIdxRef.current].checkout_url);
        }
      }
    } catch {}
  }

  async function handlePay(_method: PayMethod) {
    if (vehicle_ids.length === 0) return;
    setSubmitting(true);

    try {
      // Create SafePay checkouts for all vehicles
      const checkouts: Checkout[] = [];
      for (const vid of vehicle_ids) {
        const res = await fetch(`${API_BASE}/payments/safepay/checkout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicle_id:     vid,
            promotion_type: 'featured',
            duration_days:  duration,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Checkout failed');
        }
        const data = await res.json();
        checkouts.push({
          promotion_id: data.promotion_id,
          checkout_url: data.checkout_url,
          vehicle_id:   vid,
        });
      }

      checkoutsRef.current  = checkouts;
      currentIdxRef.current = 0;
      isWaitingRef.current  = true;

      await Linking.openURL(checkouts[0].checkout_url);
      setWaiting(true);

      // Start polling immediately — don't wait for AppState change
      startPolling();
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert('Error', e.message || 'Could not initiate payment.');
    }
  }

  const title      = vehicle?.title || `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim() || 'Vehicle';
  const color      = vehicle?.color || '';
  const imgUri     = vehicle?.images?.[0];
  const dealer     = vehicle?.location || user?.full_name || 'Dealership';
  const extraCount = vehicle_ids.length - 1;

  // Per-vehicle amount from SafePay (fixed by backend)
  const totalVehicles = vehicle_ids.length;

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.container}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
            <Ionicons name="chevron-back" size={26} color="#C9C6D0" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Payment Summary</Text>
          <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
            <Ionicons name="close" size={24} color="#C9C6D0" />
          </TouchableOpacity>
        </View>

        {/* ── PAYMENT SUCCESS ── */}
        {paid && (
          <View style={s.successWrap}>
            <Text style={s.successEmoji}>🎉</Text>
            <Text style={s.successTitle}>Payment Successful!</Text>
            <Text style={s.successSub}>Your vehicle is now promoted and live.</Text>
            <TouchableOpacity
              style={s.successBtn}
              activeOpacity={0.85}
              onPress={() => router.replace({
                pathname: '/vehicle/payment-success' as any,
                params: {
                  kind: 'promote',
                  vid: vehicle_ids[0] || '',
                  title: title || planTitle,
                  price: String(planAmount || 0),
                  home: (user as any)?.role === 'individual_seller' ? '/(seller)' : '/(dealer)',
                },
              })}
            >
              <LinearGradient
                colors={[AppColors.gradientStart, ORANGE]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={s.successBtnTxt}>View Success Page</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace(((user as any)?.role === 'individual_seller' ? '/(seller)' : '/(dealer)') as any)}>
              <Text style={s.successHome}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

          {/* VEHICLE CARD */}
          {loading ? (
            <ActivityIndicator color={ORANGE} style={{ marginBottom: 20 }}/>
          ) : (
            <VehicleRowCard v={{ ...vehicle, title, color }} dealer={dealer}>
              {extraCount > 0 && (
                <Text style={s.extraCount}>+{extraCount} more vehicle{extraCount > 1 ? 's' : ''}</Text>
              )}
              <View style={s.divider}/>
              <View style={s.planRow}>
                <Text style={s.planLabel}>{totalVehicles > 1 ? `${planTitle} × ${totalVehicles}` : planTitle}</Text>
                <Text style={s.planPrice}>PKR {planAmount.toLocaleString()}</Text>
              </View>
            </VehicleRowCard>
          )}

          {/* POLLING STATUS */}
          {waiting && (
            <View style={{ gap: 12 }}>
              <View style={s.pollingBox}>
                <ActivityIndicator color={ORANGE} size="small"/>
                <Text style={s.pollingText}>
                  {`Waiting for payment confirmation${totalVehicles > 1 ? ` (${currentIdxRef.current + 1}/${totalVehicles})` : ''}...\nComplete payment in the browser — app will redirect automatically.`}
                </Text>
              </View>
              <TouchableOpacity
                style={s.doneBtn}
                activeOpacity={0.85}
                onPress={async () => {
                  const checkouts = checkoutsRef.current;
                  if (!checkouts.length) return;
                  try {
                    // Try force-confirm first (works in sandbox too)
                    const res = await fetch(
                      `${API_BASE}/payments/safepay/force-confirm/${checkouts[0].promotion_id}`,
                      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
                    );
                    const data = await res.json();
                    if (data.success) {
                      stopPolling();
                      isWaitingRef.current = false;
                      setWaiting(false);
                      setPaid(true);
                      /* record backend-side with real amount via _mark_success — no 0-amount duplicate */
                    } else {
                      Alert.alert(
                        'Payment Pending',
                        'Payment not confirmed yet. Please complete the payment in the browser first, then tap this button.',
                        [{ text: 'OK' }]
                      );
                    }
                  } catch {
                    Alert.alert('Error', 'Could not check payment status. Check your connection.');
                  }
                }}
              >
                <LinearGradient
                  colors={[AppColors.gradientStart, ORANGE]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={s.doneTxt}>I've Completed Payment</Text>
              </TouchableOpacity>
              <Text style={s.doneHint}>
                Tap above if the app didn't redirect after payment
              </Text>
            </View>
          )}

          {/* PAYMENT SECTION */}
          {!waiting && (
            <PaymentSection
              price={planAmount}
              description={`${planTitle} — Powered by SafePay`}
              payLabel="Pay Now"
              loading={submitting}
              onPay={handlePay}
            />
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: 28, paddingBottom: 14,
  },
  headerBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_500Medium' },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },

  vehicleCard: {
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(99,148,214,0.45)',
    backgroundColor: C.glassBg, overflow: 'hidden', padding: 14,
  },
  vehicleRow:  { flexDirection: 'row', gap: 12 },
  vehicleImg:  { width: 96, height: 72, borderRadius: 10 },
  vehicleImgFb:{ backgroundColor: 'rgba(3,12,40,0.8)' },
  vehicleInfo: { flex: 1, justifyContent: 'center', gap: 3 },
  vehicleTitle:{ color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', lineHeight: 20 },
  vehicleColor:{ color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  dealerRow:   { flexDirection: 'row', alignItems: 'center' },
  dealerName:  { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  extraCount:  { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_500Medium', marginTop: 8 },
  divider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.35)', marginTop: 14, marginBottom: 10 },
  planRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planLabel:   { color: '#C9BDC4', fontSize: 15, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  planPrice:   { color: ORANGE, fontSize: 18, fontFamily: 'Poppins_500Medium' },

  pollingBox:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, backgroundColor: C.glassBg, borderWidth: 1, borderColor: 'rgba(99,148,214,0.3)' },
  pollingText: { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', flex: 1, lineHeight: 20 },

  doneBtn:  { height: 52, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  doneTxt:  { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  doneHint: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center' },

  successWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  successEmoji:  { fontSize: 64 },
  successTitle:  { color: C.textPrimary, fontSize: 24, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  successSub:    { color: C.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22 },
  successBtn:    { height: 52, width: '100%', borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  successBtnTxt: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  successHome:   { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 4 },
});
