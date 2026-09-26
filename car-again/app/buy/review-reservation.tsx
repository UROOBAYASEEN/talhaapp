import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const BG     = '#010A1F';
const CARD   = '#010A1F';
const ORANGE = '#e2671b';
const NAVY   = '#032a69';
const WHITE  = '#f9fafc';
const MUTED  = '#baacb6';
const BORDER = 'rgba(255,255,255,0.1)';
const AMBER  = '#f59e0b';

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

export default function ReviewReservationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    variantName?: string;
    fullName?: string;
    phone?: string;
    city?: string;
    cnic?: string;
    notes?: string;
  }>();
  const { token } = useAuth();

  const [vehicle,     setVehicle]     = useState<any>(null);
  const [dealer,      setDealer]      = useState<any>(null);
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => { if (params.id) load(); }, [params.id]);

  async function load() {
    try {
      const h: any = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/vehicles/${params.id}`, { headers: h });
      if (res.ok) {
        const v = await res.json();
        setVehicle(v);
        if (v.seller_id) {
          // Try dealer profile first, fall back to seller info from vehicle
          const dRes = await fetch(`${API_BASE}/dealers/${v.seller_id}`, { headers: h });
          if (dRes.ok) {
            setDealer(await dRes.json());
          } else if (v.seller) {
            // Individual seller — use seller info embedded in vehicle response
            setDealer({
              full_name: v.seller.full_name,
              avatar_url: v.seller.avatar_url,
              city: v.city,
              avg_rating: 0,
              review_count: 0,
            });
          }
        }
      }
    } catch { }
  }

  async function handleContinue() {
    if (!token) { Alert.alert('Login Required', 'Please login to reserve.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/vehicles/${params.id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          variant_name: params.variantName,
          full_name:    params.fullName,
          phone:        params.phone,
          city:         params.city,
          cnic:         params.cnic,
          notes:        params.notes,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        router.push({
          pathname: '/buy/payment' as any,
          params: {
            id: params.id,
            reserveDate: reserveDate,
            preferredTime: '11:00 AM to 12:00 PM',
          },
        });
      } else {
        Alert.alert('Error', d.detail || 'Could not submit reservation.');
      }
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setSubmitting(false); }
  }

  const carImg   = vehicle ? imgUrl(vehicle.images?.[0]) : null;
  const carName  = vehicle?.title || '—';
  const carCity  = vehicle?.city  || '—';
  const carYear  = vehicle?.year  || '';
  const carTrans = vehicle?.transmission || '';
  const carPrice = vehicle ? formatPrice(vehicle.price) : '—';

  const dealerName   = dealer?.dealership_name || dealer?.full_name || '—';
  const dealerAvatar = dealer ? imgUrl(dealer.avatar_url) : null;
  const dealerCity   = dealer?.city || '—';
  const dealerRating = dealer?.avg_rating || 4.9;
  const dealerReviews= dealer?.review_count || '250+';

  const today = new Date();
  const reserveDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const yourDetails = [
    { label: 'Full Name',     value: params.fullName || '—' },
    { label: 'Phone Number',  value: params.phone    || '—' },
    { label: 'CNIC',          value: params.cnic     || '—' },
    { label: 'Delivery City', value: params.city     || '—' },
  ];

  const yourReservation = [
    { label: 'Reservation Date', value: reserveDate },
    { label: 'Preferred Time',   value: '11:00 AM to 12:00 PM' },
  ];

  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={WHITE} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Review Your Reservation</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: '#010A1F' }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, backgroundColor: '#010A1F' }}>

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

        {/* Dealer Card */}
        <LinearGradient colors={['rgba(3,12,40,0.6)', 'rgba(3,12,40,0.6)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.dealerCard}>
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.15)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          <View style={s.dealerAvatar}>
            {dealerAvatar
              ? <Image source={{ uri: dealerAvatar }} style={{ width: 68, height: 68 }} resizeMode="cover" />
              : <Text style={s.dealerInitial}>{dealerName[0]?.toUpperCase()}</Text>
            }
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.dealerNameRow}>
              <Text style={s.dealerName}>{dealerName}</Text>
              <Ionicons name="checkmark-circle" size={16} color="#2f7dff" style={{ marginLeft: 4 }} />
            </View>
            <Text style={s.dealerSub}>Official Dealership</Text>
            <View style={s.dealerRatingRow}>
              <Ionicons name="star" size={13} color={AMBER} />
              <Text style={s.dealerRatingVal}>{dealerRating}</Text>
              <Text style={s.dealerRatingCount}>({dealerReviews} Reviews)</Text>
            </View>
            <View style={s.dealerLocRow}>
              <Ionicons name="location-outline" size={16} color={ORANGE} />
              <Text style={s.dealerLocTxt}>{dealerCity}, Pakistan</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Your Details */}
        <View style={s.section}>
          <Text style={s.secTitle}>Your Details</Text>
          {yourDetails.map((row, i) => (
            <View key={i} style={[s.row, i < yourDetails.length - 1 && s.rowBorder]}>
              <Text style={s.rowLabel}>{row.label}</Text>
              <Text style={s.rowVal}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Your Reservation */}
        <View style={[s.section, { marginTop: 12 }]}>
          <Text style={s.secTitle}>Your Reservation</Text>
          {yourReservation.map((row, i) => (
            <View key={i} style={[s.row, i < yourReservation.length - 1 && s.rowBorder]}>
              <Text style={s.rowLabel}>{row.label}</Text>
              <Text style={s.rowVal}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={s.continueBtn} onPress={handleContinue} disabled={submitting} activeOpacity={0.88}>
          <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          {submitting
            ? <ActivityIndicator color={WHITE} />
            : <Text style={s.continueTxt}>Continue</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#010A1F' },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: WHITE, fontSize: 18, fontFamily: 'Poppins_700Bold' },

  carCard:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(3,12,40,0.6)', borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', borderRadius: 14, padding: 10, marginTop: 8, overflow: 'hidden' },
  carImg:     { width: 48, height: 38, borderRadius: 7 },
  carName:    { color: WHITE, fontSize: 13, fontFamily: 'Poppins_700Bold' },
  carMeta:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  carMetaTxt: { color: MUTED, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  carPrice:   { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_700Bold' },

  dealerCard:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: BORDER, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, marginTop: 14, overflow: 'hidden' },
  dealerAvatar:    { width: 68, height: 68, borderRadius: 14, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dealerInitial:   { color: WHITE, fontSize: 22, fontFamily: 'Poppins_700Bold' },
  dealerNameRow:   { flexDirection: 'row', alignItems: 'center' },
  dealerName:      { color: WHITE, fontSize: 15, fontFamily: 'Poppins_700Bold' },
  dealerSub:       { color: MUTED, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  dealerRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  dealerRatingVal: { color: AMBER, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  dealerRatingCount:{ color: MUTED, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  dealerLocRow:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  dealerLocTxt:    { color: MUTED, fontSize: 12, fontFamily: 'Poppins_400Regular' },

  section:   { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 16, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, marginTop: 14 },
  secTitle:  { color: WHITE, fontSize: 15, fontFamily: 'Poppins_700Bold', marginBottom: 4 },
  row:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderColor: BORDER },
  rowLabel:  { color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  rowVal:    { color: WHITE, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  continueBtn: { height: 54, borderRadius: 30, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 32 },
  continueTxt: { color: WHITE, fontSize: 15, fontFamily: 'Poppins_700Bold' },
});
