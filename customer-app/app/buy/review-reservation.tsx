import VerifiedIcon from '@/components/shared/VerifiedIcon';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { PRIMARY_BTN_COLORS, SavedCardEffect, WARM_CARD_COLORS, WARM_CARD_LOCATIONS } from '@/components/shared/FigmaEffects';

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
          <Ionicons name="chevron-back" size={26} color="#C9C6D0" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Review Your Reservation</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: '#010A1F' }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 30, backgroundColor: '#010A1F' }}>

        {/* Car Summary Card */}
        <View style={s.carCard}>
          <SavedCardEffect />
          {carImg
            ? <Image source={{ uri: carImg }} style={s.carImg} resizeMode="cover" />
            : <View style={[s.carImg, { backgroundColor: '#0d1e3d', alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="car-outline" size={24} color={MUTED} />
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

        {/* Dealer Card — border: orange (top) → blue (bottom) */}
        <LinearGradient colors={['#E2671B', '#8A5A55', '#2E4F8E']} locations={[0, 0.5, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={s.dealerBorder}>
        <View style={s.dealerCard}>
          <LinearGradient colors={WARM_CARD_COLORS as any} locations={WARM_CARD_LOCATIONS as any} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <View style={s.dealerAvatar}>
            {dealerAvatar
              ? <Image source={{ uri: dealerAvatar }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              : <Text style={s.dealerInitial}>{dealerName[0]?.toUpperCase()}</Text>
            }
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.dealerNameRow}>
              <Text style={s.dealerName} numberOfLines={2}>{dealerName}</Text>
              <VerifiedIcon size={18} style={{ marginLeft: 6, marginTop: 3 }} />
            </View>
            <Text style={s.dealerSub}>Official Dealership</Text>
            <View style={s.dealerRatingRow}>
              <Ionicons name="star" size={20} color={ORANGE} />
              <Text style={s.dealerRatingTxt}>{dealerRating} ({dealerReviews} Reviews)</Text>
            </View>
            <View style={s.dealerLocRow}>
              <Ionicons name="location-outline" size={16} color={ORANGE} />
              <Text style={s.dealerLocTxt} numberOfLines={1}>{dealerCity}, Pakistan</Text>
            </View>
          </View>
        </View>
        </LinearGradient>

        {/* Your Details */}
        <View style={s.section}>
          <Text style={s.secTitle}>Your Details</Text>
          {yourDetails.map((row, i) => (
            <View key={i} style={[s.row, s.rowBorder]}>
              <Text style={s.rowLabel}>{row.label}</Text>
              <Text style={s.rowVal}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Your Reservation */}
        <View style={[s.section, { marginTop: 20 }]}>
          <Text style={s.secTitle}>Your Reservation</Text>
          {yourReservation.map((row, i) => (
            <View key={i} style={[s.row, s.rowBorder]}>
              <Text style={s.rowLabel}>{row.label}</Text>
              <Text style={s.rowVal}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Continue Button */}
        <View style={{ height: 56 }} />
        <TouchableOpacity style={s.continueBtn} onPress={handleContinue} disabled={submitting} activeOpacity={0.88}>
          <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
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

  header:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 14 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#F2F1F5', fontSize: 21, fontFamily: 'Poppins_500Medium' },

  carCard:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, paddingRight: 12, backgroundColor: '#010A1F', borderWidth: 1, borderColor: '#82a5d5', borderRadius: 16, overflow: 'hidden', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  carImg:     { width: 96, height: 64, borderRadius: 10 },
  carName:    { color: '#F2F1F5', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  carMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  carMetaTxt: { color: '#BAB6C4', fontSize: 13, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  carPrice:   { color: ORANGE, fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginTop: 1 },

  dealerBorder:    { borderRadius: 16, padding: 1, marginTop: 14 },
  dealerCard:      { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 15, padding: 14, overflow: 'hidden', backgroundColor: '#0B1D4A' },
  dealerAvatar:    { width: 110, height: 90, borderRadius: 12, backgroundColor: '#ECEEF2', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dealerInitial:   { color: '#0B1D4A', fontSize: 28, fontFamily: 'Poppins_600SemiBold' },
  dealerNameRow:   { flexDirection: 'row', alignItems: 'flex-start' },
  dealerName:      { color: '#F2F1F5', fontSize: 17, fontFamily: 'Poppins_500Medium', flexShrink: 1, lineHeight: 24 },
  dealerSub:       { color: '#BAB6C4', fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 6 },
  dealerRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  dealerRatingTxt: { color: '#BAB6C4', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  dealerLocRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  dealerLocTxt:    { color: '#D2CFD8', fontSize: 11, fontFamily: 'Poppins_400Regular', flexShrink: 1 },

  section:   { backgroundColor: '#020B1F', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 16, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12, marginTop: 20 },
  secTitle:  { color: '#F2F1F5', fontSize: 16, fontFamily: 'Poppins_500Medium', marginBottom: 4 },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  rowLabel:  { color: '#BAB6C4', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  rowVal:    { color: '#F2F1F5', fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'right', flexShrink: 1, marginLeft: 12 },

  continueBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 'auto', marginBottom: 4 },
  continueTxt: { color: '#EDEBF0', fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
});
