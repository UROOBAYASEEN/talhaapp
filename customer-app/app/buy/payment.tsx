import { useAppColors, withLightStyles, LIGHT_POP_SHADOW } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import PaymentSection from '@/components/shared/PaymentSection';
import type { PayMethod } from '@/components/shared/PaymentSection';
import { SavedCardEffect, SearchInputEffect, WARM_CARD_COLORS, WARM_CARD_LOCATIONS } from '@/components/shared/FigmaEffects';

const BG     = '#010A1F';
const ORANGE = '#e2671b';
const WHITE  = '#f9fafc';
const MUTED  = '#baacb6';
const BORDER = 'rgba(255,255,255,0.1)';
const BLUE_B = 'rgba(100,160,255,0.4)';

const TIME_SLOTS = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 1:00 PM',
  '2:00 PM - 3:00 PM',
];

const SERVER_BASE = API_BASE.replace('/api/v1', '');
function imgUrl(url?: string) {
  if (!url || url.startsWith('file://')) return null;
  if (url.startsWith('http')) return url.replace(/http:\/\/[\d.]+:\d+/, SERVER_BASE);
  return `${SERVER_BASE}${url}`;
}
function formatPrice(p: number) {
  if (p >= 10_000_000) return `PKR ${(p / 10_000_000).toFixed(2)} Crore`;
  if (p >= 100_000)    return `PKR ${(p / 100_000).toFixed(2)} Lacs`;
  return `PKR ${p.toLocaleString()}`;
}

export default function PaymentScreen() {
  const aC = useAppColors();
  const s = aC.isDark ? s_dark : s_light;
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; reserveDate?: string; preferredTime?: string }>();
  const { token } = useAuth();

  const [vehicle,   setVehicle]   = useState<any>(null);
  const [time,      setTime]      = useState('11:00 AM - 12:00 PM');
  const [timeOpen,  setTimeOpen]  = useState(false);
  const [amount,    setAmount]    = useState(50000);
  const [paying,    setPaying]    = useState(false);

  useEffect(() => { if (params.id) loadVehicle(); }, [params.id]);

  async function loadVehicle() {
    try {
      const h: any = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/vehicles/${params.id}`, { headers: h });
      if (res.ok) setVehicle(await res.json());
    } catch { }
  }

  async function handlePay(method: PayMethod) {
    if (!token) { Alert.alert('Login Required', 'Please login to pay.'); return; }
    if (!params.id) { Alert.alert('Error', 'Vehicle not found.'); return; }

    setPaying(true);
    try {
      // Step 1: Create checkout session
      const res = await fetch(`${API_BASE}/payments/safepay/reservation-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vehicle_id: params.id, amount }),
      });
      const d = await res.json();
      if (!res.ok) { Alert.alert('Error', d.detail || 'Payment failed.'); return; }

      const trackerToken = d.tracker_token;

      // Step 2: Open payment browser
      await WebBrowser.openBrowserAsync(d.checkout_url, {
        toolbarColor: '#010a1f',
        showTitle: true,
      });

      // Step 3: Quick single verify — only block on explicit cancel
      setPaying(true);
      try {
        const verifyRes = await fetch(
          `${API_BASE}/payments/safepay/verify-tracker/${trackerToken}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const verifyData = await verifyRes.json();
        const s = (verifyData.state || '').toUpperCase();
        if (s === 'CANCELLED' || s === 'FAILED' || s === 'REJECTED') {
          Alert.alert('Payment Cancelled', 'Payment was cancelled. Please try again.');
          return;
        }
      } catch { /* API unreachable — trust browser completion */ }

      // Step 3b: Record for admin panel Reserver (backend groups dealer-wise via vehicle_id)
      try {
        await fetch(`${API_BASE}/admin/payments/reserver`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, title: vehicle?.title || (vehicle?.category === 'bike' ? 'New Bike Reservation' : 'New Car Reservation'), boost_weeks: 0, vehicle_id: params.id || '' }),
        });
      } catch {}

      // Step 4: Navigate to success (replace — taake back par summary na khule)
      router.replace({
        pathname: '/vehicle/payment-success' as any,
        params: {
          title: vehicle?.title || 'Vehicle',
          price: String(amount),
          photo: vehicle?.images?.[0] || '',
          city: vehicle?.city || '',
          year: vehicle?.year ? String(vehicle.year) : '',
          trans: vehicle?.transmission || '',
          dealerPhone: vehicle?.contact_phone || vehicle?.seller?.phone || '',
        },
      });
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  const carImg   = vehicle ? imgUrl(vehicle.images?.[0]) : null;
  const carName  = vehicle?.title || '—';
  const carCity  = vehicle?.city  || '—';
  const carYear  = vehicle?.year  || '';
  const carTrans = vehicle?.transmission || '';
  const carPrice = vehicle ? formatPrice(vehicle.price) : '—';
  const reserveDate   = params.reserveDate   || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const preferredTime = params.preferredTime || '11:00 AM to 12:00 PM';

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#C9C6D0" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Payment</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: aC.isDark ? BG : '#ffffff' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, backgroundColor: aC.isDark ? BG : '#ffffff' }} keyboardShouldPersistTaps="handled">

          {/* Car Summary Card */}
          <View style={s.carCard}>
            {aC.isDark && <SavedCardEffect />}
            {carImg
              ? <Image source={{ uri: carImg }} style={s.carImg} resizeMode="cover" />
              : <View style={[s.carImg, { backgroundColor: aC.isDark ? '#0d1e3d' : '#ffffff', alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="car-outline" size={24} color={aC.isDark ? MUTED : '#4b5563'} />
                </View>
            }
            <View style={{ flex: 1 }}>
              <Text style={s.carName} numberOfLines={1}>{carName}</Text>
              <View style={s.carMeta}>
                <Ionicons name="location-outline" size={15} color="#BAB6C4" />
                <Text style={s.carMetaTxt} numberOfLines={1}>{carCity} • {carYear} • {carTrans}</Text>
              </View>
              <Text style={s.carPrice}>{carPrice}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={ORANGE} />
          </View>

          {/* Your Reservation — border: orange (top) → blue (bottom) */}
          <LinearGradient colors={['#E2671B', '#8A5A55', '#2E4F8E']} locations={[0, 0.5, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={s.reserveBorder}>
          <View style={s.reserveCard}>
            {aC.isDark && <LinearGradient colors={(aC.isDark ? WARM_CARD_COLORS : ['#F1F4F8', '#FCDCC8']) as any} locations={(aC.isDark ? WARM_CARD_LOCATIONS : [0, 1]) as any} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
            <Text style={s.reserveTitle}>Your Reservation</Text>
            <View style={[s.row, s.rowBorder]}>
              <Text style={s.rowLabel}>Reservation Date</Text>
              <Text style={s.rowVal}>{reserveDate}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Preferred Time</Text>
              <Text style={s.rowVal}>{preferredTime}</Text>
            </View>
          </View>
          </LinearGradient>

          {/* Pay Amount */}
          <View style={{ marginTop: 18 }}>
            <Text style={s.fieldLabel}>Pay Preservation Amount</Text>
            <View style={s.inputWrap}>
              {aC.isDark && <SearchInputEffect />}
              <TextInput
                style={s.input}
                value={`Rs. ${amount.toLocaleString()}`}
                onChangeText={t => setAmount(Number(t.replace(/[^0-9]/g, '')) || 50000)}
                placeholderTextColor={aC.isDark ? MUTED : '#8f8f8f'}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Select Time */}
          <View style={{ marginTop: 16 }}>
            <Text style={s.fieldLabel}>Select Time</Text>
            <TouchableOpacity style={s.inputWrap} onPress={() => setTimeOpen(o => !o)} activeOpacity={0.85}>
              {aC.isDark && <SearchInputEffect />}
              <Text style={s.input}>{time}</Text>
              <Ionicons name={timeOpen ? 'chevron-up' : 'chevron-down'} size={20} color={aC.isDark ? '#E6E4EA' : '#000000'} style={{ position: 'absolute', right: 20 }} />
            </TouchableOpacity>
            {timeOpen && (
              <View style={s.dropdown}>
                {TIME_SLOTS.map(t => (
                  <TouchableOpacity key={t} style={s.dropOption} onPress={() => { setTime(t); setTimeOpen(false); }}>
                    <Text style={[s.dropOptionTxt, time === t && { color: ORANGE }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Payment Section — info note sits above the button, like Figma */}
          <View style={{ marginTop: 20 }}>
            <PaymentSection
              price={amount}
              description="Reservation Deposit"
              loading={paying}
              onPay={handlePay}
              payLabel="Proceed to Payment"
              beforePayButton={
                <View style={s.infoRow}>
                  <View style={s.infoIcon}>
                    <Ionicons name="bulb" size={16} color={ORANGE} />
                  </View>
                  <Text style={s.infoTxt}>
                    Before reserving, please call the dealership to verify the vehicle's availability. Once confirmed, your reservation amount will be adjusted against the final purchase price.
                  </Text>
                </View>
              }
            />
          </View>

          {/* Info Note — moved above the button (kept for reference)
          <View style={s.infoRow}>
            <View style={s.infoIcon}>
              <Ionicons name="bulb-outline" size={14} color={ORANGE} />
            </View>
            <Text style={s.infoTxt}>
              Before reserving, please call the dealership to verify the vehicle's availability. Once confirmed, your reservation amount will be adjusted against the final purchase price.
            </Text>
          </View>
          */}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s_dark = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: '#F2F1F5', fontSize: 20, fontFamily: 'Poppins_500Medium' },

  carCard:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, paddingRight: 12, backgroundColor: '#010A1F', borderWidth: 1, borderColor: '#82a5d5', borderRadius: 16, overflow: 'hidden', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  carImg:     { width: 90, height: 62, borderRadius: 10 },
  carName:    { color: '#F2F1F5', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  carMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  carMetaTxt: { color: '#BAB6C4', fontSize: 12.5, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  carPrice:   { color: ORANGE, fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginTop: 1 },

  reserveBorder:{ borderRadius: 16, padding: 1, marginTop: 14 },
  reserveCard:  { borderRadius: 15, paddingHorizontal: 18, paddingTop: 20, paddingBottom: 8, overflow: 'hidden', backgroundColor: '#0B1D4A' },
  reserveTitle: { color: '#F2F1F5', fontSize: 16, fontFamily: 'Poppins_500Medium', marginBottom: 6 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowBorder:    { borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  rowLabel:     { color: '#BAB6C4', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  rowVal:       { color: '#F2F1F5', fontSize: 14, fontFamily: 'Poppins_400Regular' },

  fieldLabel: { color: '#D2CFD8', fontSize: 14.5, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
  inputWrap:  { height: 52, borderRadius: 32, borderWidth: 1, borderColor: '#829fd0', backgroundColor: 'rgba(3,12,40,0.6)', overflow: 'hidden', justifyContent: 'center' },
  input:      { color: '#F2F1F5', fontSize: 14, fontFamily: 'Poppins_400Regular', paddingHorizontal: 20 },

  dropdown:      { marginTop: 6, backgroundColor: '#061b4a', borderRadius: 14, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  dropOption:    { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderColor: BORDER },
  dropOptionTxt: { color: WHITE, fontSize: 14, fontFamily: 'Poppins_400Regular' },

  infoRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4, marginBottom: 8 },
  infoIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0E2552', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  infoTxt:  { flex: 1, color: '#C9C6D0', fontSize: 12.5, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
});
// Light mode layer for `s` — dark mode uses s_dark as is
const s_light = withLightStyles(s_dark, {
  root: { backgroundColor: '#ffffff' },
  headerTitle: { color: '#000000' },
  carCard: { backgroundColor: '#F2F4F8', borderColor: 'rgba(0,0,0,0.04)', boxShadow: LIGHT_POP_SHADOW },
  carName: { color: '#000000' },
  carMetaTxt: { color: '#4b5563' },
  reserveCard: { backgroundColor: '#F2F4F8', borderColor: 'rgba(226,103,27,0.28)', boxShadow: LIGHT_POP_SHADOW },
  rowBorder: { borderColor: 'rgba(0,0,0,0.12)' },
  rowLabel: { color: '#4b5563' },
  rowVal: { color: '#000000' },
  fieldLabel: { color: '#000000' },
  inputWrap: { backgroundColor: '#E8EAEF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.18)', boxShadow: LIGHT_POP_SHADOW },
  input: { color: '#000000' },
  dropdown: { backgroundColor: '#E8EAEF', borderColor: 'rgba(0,0,0,0.18)', boxShadow: LIGHT_POP_SHADOW },
  dropOption: { borderColor: 'rgba(0,0,0,0.12)' },
  dropOptionTxt: { color: '#000000' },
  infoIcon: { backgroundColor: '#F2F4F8' },
  infoTxt: { color: '#000000' },
});

