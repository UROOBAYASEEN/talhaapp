import React from "react";
import {
  View, Text, StyleSheet,
  SafeAreaView, ScrollView, StatusBar, TouchableOpacity, Alert, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import PaymentSection from "@/components/shared/PaymentSection";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WARM_CARD_COLORS, WARM_CARD_LOCATIONS } from "@/components/shared/FigmaEffects";
import { API_BASE } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { VehicleRowCard } from "@/components/dealer/DealerUI";
import { useAppColors } from "@/constants/theme";

const SERVER = API_BASE.replace("/api/v1", "");
function resolveUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${SERVER}${url}`;
}

export default function PaymentSummaryScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const aC = useAppColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(false);
  const params = useLocalSearchParams<{
    type?: string; vehicle?: string; city?: string; center?: string;
    date?: string; time?: string; phone?: string; address?: string;
    providerId?: string; providerName?: string;
    deviceId?: string; deviceName?: string;
    price?: string; installationFee?: string; monthlyFee?: string;
    planId?: string; fullName?: string; cnic?: string; email?: string;
    deviceImage?: string; avatarUrl?: string; pendingPayload?: string;
    addonsTotal?: string; selectedAddons?: string;
    car_model?: string; badge?: string;
  }>();

  const isTracker       = params.type === 'tracker';
  const isInsurance     = params.type === 'insurance';
  const isDealerExtra   = params.type === 'dealer_extra';
  const installFee      = Number(params.installationFee || 0);
  const yearlyPrice     = Number(params.price || 0);
  const monthlyFee      = Number(params.monthlyFee || 0);
  const addonsTotal     = Number(params.addonsTotal || 0);
  const trackerTotal    = installFee + (monthlyFee > 0 ? monthlyFee : yearlyPrice) + addonsTotal;
  const dealerTotal     = Number(params.price || 500);
  const insurancePremium = Number(params.price || 0);
  const insuranceTax    = Math.round(insurancePremium * 0.13);
  const insuranceTotal  = insurancePremium + insuranceTax;
  const logoText        = isInsurance
    ? (params.providerName || 'INS').slice(0, 3).toUpperCase()
    : isTracker ? 'TRK' : 'EFU';
  const avatarImgUrl = resolveUrl(params.avatarUrl as string);
  const [fetchedImg, setFetchedImg] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!isTracker) return;
    if (params.deviceImage) return;
    if (!params.deviceId) return;
    fetch(`${API_BASE}/tracker-devices/${params.deviceId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.images?.[0]) setFetchedImg(d.images[0]); })
      .catch(() => {});
  }, [isTracker, params.deviceId, params.deviceImage]);
  const trackerImgUrl = resolveUrl(params.deviceImage || fetchedImg);

  async function handlePay(method: 'card' | 'jazzcash' | 'easypaisa') {
    // Profile → claim → payment summary: direct success for insurance
    if (isInsurance) {
      const amount = insuranceTotal;
      // record for admin panel Payments
      try {
        await fetch(`${API_BASE}/admin/payments/insurance`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, title: `${params.providerName || 'Insurance'} • ${params.deviceName || 'Premium'}`.trim(), boost_weeks: 0 }),
        });
      } catch {}
      router.replace({ pathname: '/vehicle/payment-success' as any, params: { kind: 'insurance', company: params.providerName || 'Insurance', title: params.providerName || 'Insurance Premium', price: String(amount) } });
      return;
    }
    if (isDealerExtra) {
      const amount = dealerTotal;
      try {
        const pending = params.pendingPayload as unknown as string;
        if (pending) {
          const payload = JSON.parse(String(pending));
          const res2 = await fetch(`${API_BASE}/vehicles/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Extra-Paid': 'true' },
            body: JSON.stringify(payload),
          });
          if (!res2.ok && res2.status !== 402) {
            const e = await res2.json().catch(()=>({}));
            console.log('extra vehicle post failed', e);
          }
        }
      } catch {}
      // record for admin panel Adds (5+1 extra)
      try {
        await fetch(`${API_BASE}/admin/payments/extra`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, title: params.deviceName || params.vehicle || 'Extra Vehicle Ad', boost_weeks: 0 }),
        });
      } catch {}
      router.replace({ pathname: '/vehicle/payment-success' as any, params: { kind: 'dealer_extra', title: params.deviceName || 'Extra Ad - PKR 500', price: String(amount), photo: (params.deviceImage as string) || '' } });
      return;
    }
    if (isTracker) {
      const amount = trackerTotal;
      // record tracker payment for admin panel (company name = providerName)
      try {
        await fetch(`${API_BASE}/admin/payments/tracker`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, title: `${params.providerName || 'Tracker'} • ${params.deviceName || ''}`.trim(), boost_weeks: 0 }),
        });
      } catch {}
      // also save tracker booking after payment
      if (params.providerId) {
        fetch(`${API_BASE}/tracker-bookings/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            provider_id: params.providerId,
            device_id:   params.deviceId   || '',
            device_name: params.deviceName || '',
            vehicle:     params.vehicle    || '',
            city:        params.city       || '',
            center:      params.center     || '',
            address:     params.address    || '',
            date:        params.date       || '',
            time:        params.time       || '',
            amount,
          }),
        }).catch(() => {});
      }
      router.replace({ pathname: '/vehicle/payment-success' as any, params: { kind: 'tracker', title: params.deviceName || params.providerName || 'Tracker Installation', price: String(amount), providerName: params.providerName || '', deviceName: params.deviceName || '', city: params.city || '', date: params.date || '', time: params.time || '', center: params.center || '' } });
      return;
    }
    if (!token) { Alert.alert('Login Required', 'Please login to pay.'); return; }
    setLoading(true);
    try {
      const amount = isTracker ? trackerTotal : isInsurance ? insuranceTotal : 83344;

      // Step 1: Create checkout session
      const res = await fetch(`${API_BASE}/payments/safepay/tracker-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount,
          description: isTracker
            ? `Tracker - ${params.deviceName || 'Installation'}`
            : 'Insurance Premium',
        }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data.detail || 'Payment failed.'); return; }

      const trackerToken = data.tracker_token;

      // Step 2: Open payment browser
      await WebBrowser.openBrowserAsync(data.checkout_url, {
        toolbarColor: '#010a1f',
        showTitle: true,
      });

      // Step 3: Verify payment — fast poll (was 6×1.8s ≈10s, now ~3s)
      setLoading(true);
      const PAID = new Set(['PAID','COMPLETED','SUCCESS','CONFIRMED']);
      const FAIL = new Set(['CANCELLED','FAILED','REJECTED','EXPIRED','DECLINED']);
      let isPaid = false;
      let lastState = '';
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const verifyRes = await fetch(
            `${API_BASE}/payments/safepay/verify-tracker/${trackerToken}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const verifyData = await verifyRes.json();
          const s = (verifyData.state || verifyData.paid ? (verifyData.state || '') : '').toUpperCase();
          lastState = s || (verifyData.paid ? 'PAID' : 'PENDING');
          if (verifyData.paid || PAID.has(s)) { isPaid = true; break; }
          if (FAIL.has(s)) {
            Alert.alert('Payment Failed', `State: ${s}. Please try again.`);
            return;
          }
        } catch { /* retry */ }
        if (attempt < 2) await new Promise(r => setTimeout(r, 900));
      }
      if (!isPaid) {
        // Sandbox/pending-safe: final check before failing
        try {
          const r = await fetch(`${API_BASE}/payments/safepay/verify-tracker/${trackerToken}`, { headers: { Authorization: `Bearer ${token}` } });
          const d = await r.json(); if (d.paid || PAID.has((d.state||'').toUpperCase())) isPaid = true;
        } catch {}
      }
      if (!isPaid) {
        Alert.alert('Payment Not Confirmed', lastState ? `State: ${lastState}. Please complete payment, close browser and try again.` : 'Payment not verified yet.');
        return;
      }
      Alert.alert('Payment Successful', 'Your payment has been verified successfully!');

      // Step 4a: Save insurance application after confirmed payment
      if (isInsurance) {
        fetch(`${API_BASE}/insurance/submit-application`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            plan_id:        params.planId    || '',
            full_name:      params.fullName  || params.vehicle?.split(' • ')[0] || '',
            cnic:           params.cnic      || params.vehicle?.split(' • ')[1] || '',
            phone:          params.phone     || '',
            email:          params.email     || '',
            address:        params.address   || '',
            preferred_date: params.date      || '',
            preferred_time: params.time      || '',
          }),
        }).catch(() => {});
      }

      // Step 4b: Save tracker booking after confirmed payment
      if (isTracker && params.providerId) {
        fetch(`${API_BASE}/tracker-bookings/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            provider_id: params.providerId,
            device_id:   params.deviceId   || '',
            device_name: params.deviceName || '',
            vehicle:     params.vehicle    || '',
            city:        params.city       || '',
            center:      params.center     || '',
            address:     params.address    || '',
            date:        params.date       || '',
            time:        params.time       || '',
            amount,
          }),
        }).catch(() => {});
      }

      // Step 5: Navigate to success
      router.replace({
        pathname: '/vehicle/payment-success' as any,
        params: {
          title: isTracker ? params.deviceName || 'Tracker Installation' : (params.providerName || 'Insurance Premium'),
          price: String(amount),
        },
      });
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg, paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />
      <View style={[styles.container, { backgroundColor: aC.bg }]}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomColor: aC.isDark ? "rgba(255,255,255,0.08)" : "rgba(3,42,105,0.08)" }, (isInsurance || isTracker) && { borderBottomWidth: 0 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={aC.isDark ? "#C9C6D0" : "#010a1f"} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, (isInsurance || isTracker) && styles.insHeaderTitle, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>
            Payment Summary
          </Text>

          <View style={{ width: 35 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { backgroundColor: aC.bg }]}
          style={{ backgroundColor: aC.bg }}
        >

          {/* Summary Card — insurance/tracker use the Figma card (orange top → blue bottom border) */}
          {isTracker ? (
            <LinearGradient
              colors={aC.isDark ? ['#E2671B', '#8A5A55', '#2E4F8E'] : ['rgba(3,42,105,0.12)', 'rgba(3,42,105,0.12)']}
              locations={aC.isDark ? [0, 0.5, 1] : undefined}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
              style={styles.insBorder}
            >
              <View style={[styles.insCard, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff', paddingTop: 8 }]}>
                {aC.isDark && <LinearGradient colors={WARM_CARD_COLORS as any} locations={WARM_CARD_LOCATIONS as any} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                {[
                  { label: 'Tracker Provider',     value: params.providerName || '—' },
                  { label: 'Selected Package',     value: params.deviceName || '—' },
                  { label: 'Installation Fee',     value: `Rs ${installFee.toLocaleString()}` },
                  { label: 'Monthly Subscription', value: `Rs ${monthlyFee.toLocaleString()}` },
                  ...(addonsTotal > 0 ? [{ label: `Add-ons${params.selectedAddons ? ` (${String(params.selectedAddons).split(',').length})` : ''}`, value: `Rs ${addonsTotal.toLocaleString()}` }] : []),
                ].map(row => (
                  <View key={row.label} style={styles.insRow}>
                    <Text style={[styles.insLabel, { color: aC.isDark ? "#E6E4EA" : "#64748b" }]}>{row.label}</Text>
                    <Text style={[styles.insValue, { color: aC.isDark ? "#E6E4EA" : "#010a1f" }]} numberOfLines={1}>{row.value}</Text>
                  </View>
                ))}
                <View style={[styles.insDivider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.22)" : "rgba(3,42,105,0.1)" }]} />
                <View style={styles.insRow}>
                  <Text style={[styles.insLabel, { color: aC.isDark ? "#E6E4EA" : "#64748b" }]}>Total Amount</Text>
                  <Text style={styles.insTotal}>Rs {trackerTotal.toLocaleString()}</Text>
                </View>
              </View>
            </LinearGradient>
          ) : isDealerExtra ? (
            // Figma dealer "Payment Summary": vehicle card + "Single ad  PKR 500"
            <VehicleRowCard
              v={{ title: params.vehicle || params.deviceName || 'Extra Vehicle Listing', color: (params as any).color, images: trackerImgUrl ? [trackerImgUrl] : [] }}
              dealer={(user as any)?.full_name}
              style={{ marginBottom: 6 }}
            >
              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.35)', marginTop: 14, marginBottom: 10 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#C9BDC4', fontSize: 15, fontFamily: 'Poppins_400Regular' }}>Single ad</Text>
                <Text style={{ color: '#E2671B', fontSize: 18, fontFamily: 'Poppins_500Medium' }}>PKR {dealerTotal.toLocaleString()}</Text>
              </View>
            </VehicleRowCard>
          ) : isInsurance ? (
            <LinearGradient
              colors={aC.isDark ? ['#E2671B', '#8A5A55', '#2E4F8E'] : ['rgba(3,42,105,0.12)', 'rgba(3,42,105,0.12)']}
              locations={aC.isDark ? [0, 0.5, 1] : undefined}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
              style={styles.insBorder}
            >
              <View style={[styles.insCard, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff' }]}>
                {aC.isDark && <LinearGradient colors={WARM_CARD_COLORS as any} locations={WARM_CARD_LOCATIONS as any} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                <View style={styles.companyRow}>
                  <View style={styles.insLogo}>
                    {avatarImgUrl
                      ? <Image source={{ uri: avatarImgUrl }} style={{ width: 42, height: 42, borderRadius: 21 }} resizeMode="cover" />
                      : <Text style={styles.insLogoTxt}>{logoText}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.insName, { color: aC.isDark ? "#F2F1F5" : "#010a1f" }]} numberOfLines={1}>{params.providerName || 'Insurance'}</Text>
                    <Text style={[styles.insSub, { color: aC.isDark ? "#BAB6C4" : "#475569" }]} numberOfLines={1}>{params.badge || 'Comprehensive · Gold Plan'}</Text>
                  </View>
                </View>
                {[
                  { label: 'Vehicle',        value: params.car_model || '—' },
                  { label: 'Annual Premium', value: `PKR ${insurancePremium.toLocaleString()}` },
                  { label: 'Tax (13%)',      value: `PKR ${insuranceTax.toLocaleString()}` },
                ].map(row => (
                  <View key={row.label} style={styles.insRow}>
                    <Text style={[styles.insLabel, { color: aC.isDark ? "#C9C6D0" : "#64748b" }]}>{row.label}</Text>
                    <Text style={[styles.insValue, { color: aC.isDark ? "#F2F1F5" : "#010a1f" }]}>{row.value}</Text>
                  </View>
                ))}
                <View style={[styles.insDivider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.22)" : "rgba(3,42,105,0.1)" }]} />
                <View style={styles.insRow}>
                  <Text style={[styles.insLabel, { color: aC.isDark ? "#C9C6D0" : "#64748b" }]}>Annual</Text>
                  <Text style={styles.insTotal}>PKR {insuranceTotal.toLocaleString()}</Text>
                </View>
              </View>
            </LinearGradient>
          ) : (
          <View style={[styles.summaryCard, { backgroundColor: aC.isDark ? "rgba(3,12,40,0.6)" : "#ffffff", borderColor: aC.isDark ? '#e2671b' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
            {aC.isDark ? (
              <>
                <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                
              </>
            ) : (
              <>

              </>
            )}

            <View style={styles.companyRow}>
              <View style={[styles.efuLogo, { overflow: 'hidden', backgroundColor: aC.isDark ? "#032a69" : "#eef2ff", borderColor: aC.isDark ? "#1a3a6a" : "rgba(3,42,105,0.12)" }]}>
                {isTracker && trackerImgUrl ? (
                  <Image source={{ uri: trackerImgUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="cover" />
                ) : isInsurance && avatarImgUrl ? (
                  <Image source={{ uri: avatarImgUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="cover" />
                ) : isDealerExtra ? (
                  trackerImgUrl ? <Image source={{ uri: trackerImgUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="cover" /> : <Ionicons name="car-outline" size={18} color={aC.isDark ? "#f9fafc" : "#032a69"} />
                ) : (
                  <Text style={[styles.efuText, { color: aC.isDark ? "#f9fafc" : "#032a69" }]}>{logoText}</Text>
                )}
              </View>
              <View>
                <Text style={[styles.companyName, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>
                  {params.providerName || (isTracker ? 'Tracker Installation' : 'Insurance')}
                </Text>
                <Text style={[styles.planName, { color: aC.isDark ? "#baacb6" : "#475569" }]}>
                  {isTracker
                    ? params.deviceName || params.center || 'Installation Service'
                    : params.deviceName || 'Insurance Plan'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.08)" : "rgba(3,42,105,0.08)" }]} />

            {isTracker ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Vehicle</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>{params.vehicle || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>City</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>{params.city || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Date & Time</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>{params.date || '—'} {params.time ? `· ${params.time}` : ''}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Phone</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>{params.phone || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Installation Fee</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>PKR {installFee.toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Monthly Subscription</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>PKR {monthlyFee.toLocaleString()}</Text>
                </View>
                {addonsTotal > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Add-ons{params.selectedAddons ? ` (${String(params.selectedAddons).split(',').length})` : ''}</Text>
                    <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>PKR {addonsTotal.toLocaleString()}</Text>
                  </View>
                )}
              </>
            ) : isDealerExtra ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Vehicle Listing</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>{params.vehicle || 'Extra Ad'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Limit</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>5 free ads used</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Extra Ad Fee</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>PKR {dealerTotal.toLocaleString()}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Applicant</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]} numberOfLines={1}>{params.vehicle || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Phone</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>{params.phone || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Date & Time</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>{params.date || '—'}{params.time ? ` · ${params.time}` : ''}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Annual Premium</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>PKR {insurancePremium.toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: aC.isDark ? "#baacb6" : "#64748b" }]}>Tax (13%)</Text>
                  <Text style={[styles.detailValue, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>PKR {insuranceTax.toLocaleString()}</Text>
                </View>
              </>
            )}

            <View style={[styles.divider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.08)" : "rgba(3,42,105,0.08)" }]} />

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: aC.isDark ? "#f9fafc" : "#010a1f" }]}>
                {isTracker ? 'Total' : isDealerExtra ? 'Total Fee' : 'Annual'}
              </Text>
              <Text style={styles.totalValue}>
                {isTracker
                  ? `PKR ${trackerTotal.toLocaleString()}`
                  : isDealerExtra ? `PKR ${dealerTotal.toLocaleString()}`
                  : `PKR ${insuranceTotal.toLocaleString()}`}
              </Text>
            </View>
          </View>
          )}

          {/* Payment Section */}
          <PaymentSection
            price={isTracker ? trackerTotal : isDealerExtra ? dealerTotal : insuranceTotal}
            description={isTracker
              ? `Tracker — ${params.deviceName || 'Installation'}`
              : isDealerExtra ? `Dealer Extra Ad — PKR ${dealerTotal}`
              : `Insurance — ${params.providerName || 'Premium'}`
            }
            loading={loading}
            onPay={(method) => handlePay(method)}
            payLabel={isInsurance || isTracker || isDealerExtra ? 'Pay Now' : undefined}
          />

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: "#010a1f" },
  container: { flex: 1, backgroundColor: "#010a1f", paddingHorizontal: 16 },

  header: {
    height: 72, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingTop: 16,
    borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backButton:  { width: 35, height: 35, justifyContent: "center" },
  headerTitle: { color: "#f9fafc", fontSize: 17, fontFamily: "Poppins_600SemiBold" },

  /* Insurance — Figma */
  insHeaderTitle: { fontSize: 20, fontFamily: "Poppins_500Medium" },
  insBorder:   { borderRadius: 16, padding: 1, marginBottom: 14 },
  insCard:     { borderRadius: 15, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12, overflow: "hidden" },
  insLogo:     { width: 42, height: 42, borderRadius: 21, backgroundColor: "#12306A", borderWidth: 1, borderColor: "#8FAEE3", justifyContent: "center", alignItems: "center", marginRight: 12, overflow: "hidden" },
  insLogoTxt:  { color: "#F2F1F5", fontSize: 11, fontFamily: "Poppins_500Medium" },
  insName:     { fontSize: 16, fontFamily: "Poppins_500Medium" },
  insSub:      { fontSize: 12, fontFamily: "Poppins_400Regular", marginTop: 1 },
  insRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  insLabel:    { fontSize: 13.5, fontFamily: "Poppins_400Regular" },
  insValue:    { fontSize: 13.5, fontFamily: "Poppins_400Regular" },
  insDivider:  { height: 1, marginTop: 12 },
  insTotal:    { color: "#e2671b", fontSize: 17, fontFamily: "Poppins_500Medium" },

  scrollContent: { paddingBottom: 30, paddingTop: 16, gap: 0 },

  summaryCard: {
    borderRadius: 16, padding: 10,
    backgroundColor: "rgba(3,12,40,0.6)",
    borderWidth: 1, borderColor: "rgba(100,160,255,0.5)",
    overflow: "hidden",
  },
  companyRow: { flexDirection: "row", alignItems: "center" },
  efuLogo: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#032a69", borderWidth: 1, borderColor: "#1a3a6a",
    justifyContent: "center", alignItems: "center", marginRight: 10,
  },
  efuText:     { color: "#f9fafc", fontSize: 10, fontFamily: "Poppins_700Bold" },
  companyName: { color: "#f9fafc", fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  planName:    { color: "#baacb6", fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 2 },

  divider: { height: 0.5, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 6 },

  detailRow:   { flexDirection: "row", justifyContent: "space-between", marginVertical: 3 },
  detailLabel: { color: "#baacb6", fontSize: 12, fontFamily: "Poppins_400Regular" },
  detailValue: { color: "#f9fafc", fontSize: 12, fontFamily: "Poppins_500Medium" },

  totalRow:   { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { color: "#f9fafc", fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  totalValue: { color: "#e2671b", fontSize: 14, fontFamily: "Poppins_700Bold" },

  sectionTitle: {
    color: "#f9fafc", fontSize: 14, fontFamily: "Poppins_600SemiBold",
    marginTop: 18, marginBottom: 10,
  },

  paymentCard: {
    borderRadius: 16, padding: 14,
    backgroundColor: "#020d24",
    borderWidth: 1, borderColor: "#1a3a6a",
  },
  activePaymentCard: { borderColor: "#e2671b" },

  paymentHeader: { flexDirection: "row", alignItems: "center" },

  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: "#baacb6",
    justifyContent: "center", alignItems: "center",
  },
  radioActive: { borderColor: "#e2671b" },
  radioDot:    { width: 9, height: 9, borderRadius: 5, backgroundColor: "#e2671b" },

  cardBrands: { flexDirection: "row", alignItems: "center", marginLeft: 8, width: 50 },
  visaCircle: {
    width: 28, height: 18, borderRadius: 3,
    backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center",
  },
  visaText:     { color: "#123A8C", fontSize: 7, fontFamily: "Poppins_700Bold" },
  masterRed:    { width: 14, height: 14, borderRadius: 7, backgroundColor: "#EB001B", marginLeft: -3 },
  masterYellow: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#F79E1B", marginLeft: -6 },

  paymentTitle: { color: "#f9fafc", fontSize: 13, fontFamily: "Poppins_500Medium", marginLeft: 8 },

  inputLabel: {
    color: "#baacb6", fontSize: 12, fontFamily: "Poppins_400Regular",
    marginBottom: 6, marginTop: 12,
  },
  inputWrapper: {
    height: 44, borderRadius: 10,
    backgroundColor: "#010a1f",
    borderWidth: 1, borderColor: "#1a3a6a",
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12,
  },
  input: { flex: 1, color: "#f9fafc", fontSize: 13, fontFamily: "Poppins_400Regular", padding: 0 },
  inputRow:  { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },

  otherPayment: {
    height: 48, borderRadius: 32,
    backgroundColor: "#020d24",
    borderWidth: 1, borderColor: "#1a3a6a",
    marginTop: 10, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  activeOtherPayment: { borderColor: "#e2671b" },

  jazzCash:        { color: "#F7C500", fontSize: 12, fontFamily: "Poppins_700Bold" },
  otherPaymentText:{ color: "#f9fafc", fontSize: 13, fontFamily: "Poppins_400Regular", marginLeft: 4 },

  easyLogo: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center",
  },
  easyLogoText: { color: "#00A651", fontSize: 14, fontFamily: "Poppins_700Bold" },

  payButton:     { height: 52, justifyContent: "center", alignItems: "center" },
  payButtonText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Poppins_600SemiBold" },
});