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
          body: JSON.stringify({ amount, title: vehicle?.title || 'New Car Reservation', boost_weeks: 0, vehicle_id: params.id || '' }),
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
            <Ionicons name="chevron-back" size={22} color={WHITE} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Payment</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: BG }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, backgroundColor: BG }} keyboardShouldPersistTaps="handled">

          {/* Car Summary Card */}
          <View style={s.carCard}>
            <LinearGradient colors={['rgba(22,64,136,0.2)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <LinearGradient colors={['rgba(13,37,84,0.18)','transparent']} start={{x:0,y:0.5}} end={{x:0.45,y:0.5}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <LinearGradient colors={['transparent','rgba(29,83,175,0.2)']} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            {carImg
              ? <Image source={{ uri: carImg }} style={s.carImg} resizeMode="cover" />
              : <View style={[s.carImg, { backgroundColor: '#0d1e3d', alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="car-outline" size={24} color={MUTED} />
                </View>
            }
            <View style={{ flex: 1 }}>
              <Text style={s.carName} numberOfLines={1}>{carName}</Text>
              <View style={s.carMeta}>
                <Ionicons name="location-outline" size={12} color={MUTED} />
                <Text style={s.carMetaTxt}>{carCity}  •  {carYear}  •  {carTrans}</Text>
              </View>
              <Text style={s.carPrice}>{carPrice}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={ORANGE} />
          </View>

          {/* Your Reservation */}
          <LinearGradient colors={['#16213f', '#2a1c14']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.reserveCard}>
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.15)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <Text style={s.reserveTitle}>Your Reservation</Text>
            <View style={[s.row, s.rowBorder]}>
              <Text style={s.rowLabel}>Reservation Date</Text>
              <Text style={s.rowVal}>{reserveDate}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Preferred Time</Text>
              <Text style={s.rowVal}>{preferredTime}</Text>
            </View>
          </LinearGradient>

          {/* Pay Amount */}
          <View style={{ marginTop: 20 }}>
            <Text style={s.fieldLabel}>Pay Preservation Amount</Text>
            <View style={s.inputWrap}>
              <LinearGradient colors={['rgba(22,64,136,0.2)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent','rgba(29,83,175,0.2)']} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <TextInput
                style={s.input}
                value={`Rs. ${amount.toLocaleString()}`}
                onChangeText={t => setAmount(Number(t.replace(/[^0-9]/g, '')) || 50000)}
                placeholderTextColor={MUTED}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Select Time */}
          <View style={{ marginTop: 20 }}>
            <Text style={s.fieldLabel}>Select Time</Text>
            <TouchableOpacity style={s.inputWrap} onPress={() => setTimeOpen(o => !o)} activeOpacity={0.85}>
              <LinearGradient colors={['rgba(22,64,136,0.2)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent','rgba(29,83,175,0.2)']} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <Text style={[s.input, { paddingTop: 14 }]}>{time}</Text>
              <Ionicons name={timeOpen ? 'chevron-up' : 'chevron-down'} size={16} color={MUTED} style={{ position: 'absolute', right: 20, top: 16 }} />
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

          {/* Payment Section */}
          <View style={{ marginTop: 24 }}>
            <PaymentSection
              price={amount}
              description="Reservation Deposit"
              loading={paying}
              onPay={handlePay}
            />
          </View>

          {/* Info Note */}
          <View style={s.infoRow}>
            <View style={s.infoIcon}>
              <Ionicons name="bulb-outline" size={14} color={ORANGE} />
            </View>
            <Text style={s.infoTxt}>
              Before reserving, please call the dealership to verify the vehicle's availability. Once confirmed, your reservation amount will be adjusted against the final purchase price.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: WHITE, fontSize: 18, fontFamily: 'Poppins_700Bold' },

  carCard:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(3,12,40,0.6)', borderWidth: 1, borderColor: BLUE_B, borderRadius: 14, padding: 10, marginTop: 8, overflow: 'hidden' },
  carImg:     { width: 48, height: 38, borderRadius: 7 },
  carName:    { color: WHITE, fontSize: 13, fontFamily: 'Poppins_700Bold' },
  carMeta:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  carMetaTxt: { color: MUTED, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  carPrice:   { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_700Bold' },

  reserveCard:  { borderWidth: 1, borderColor: 'rgba(226,103,27,0.5)', borderRadius: 16, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, marginTop: 14, overflow: 'hidden' },
  reserveTitle: { color: WHITE, fontSize: 15, fontFamily: 'Poppins_700Bold', marginBottom: 6 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11 },
  rowBorder:    { borderBottomWidth: 1, borderColor: BORDER },
  rowLabel:     { color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  rowVal:       { color: WHITE, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  fieldLabel: { color: '#cbd5e1', fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
  inputWrap:  { height: 52, borderRadius: 30, borderWidth: 1, borderColor: BLUE_B, backgroundColor: 'rgba(3,12,40,0.6)', overflow: 'hidden', justifyContent: 'center' },
  input:      { color: WHITE, fontSize: 14, fontFamily: 'Poppins_400Regular', paddingHorizontal: 20 },

  dropdown:      { marginTop: 6, backgroundColor: '#061b4a', borderRadius: 14, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  dropOption:    { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderColor: BORDER },
  dropOptionTxt: { color: WHITE, fontSize: 14, fontFamily: 'Poppins_400Regular' },

  infoRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16 },
  infoIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(226,103,27,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  infoTxt:  { flex: 1, color: MUTED, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
});
