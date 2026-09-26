import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Leaf } from 'lucide-react-native';
import { AppColors, useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const BG     = '#010a1f';
const WHITE  = '#f9fafc';
const SUB    = '#baacb6';
const ORANGE = '#e2671b';
const NAVY   = '#032a69';
const SERVER = API_BASE.replace('/api/v1', '');

function resolveUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}

function Row({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  const aC = useAppColors();
  return (
    <View style={[r.row, !isLast && { borderBottomWidth: 1, borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.08)' }]}>
      <Text style={[r.label, { color: aC.isDark ? SUB : '#475569' }]}>{label}</Text>
      <Text style={[r.value, { color: aC.isDark ? WHITE : '#010a1f' }]}>{value}</Text>
    </View>
  );
}
const r = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
  border:{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  label: { color: SUB, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  value: { color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium' },
});

function fmt(n: number) { return `PKR ${n.toLocaleString('en-PK')}`; }

export default function FinancingReviewScreen() {
  const router    = useRouter();
  const { token } = useAuth();
  const params    = useLocalSearchParams<Record<string, string>>();
  const aC = useAppColors();
  const [submitting, setSubmitting] = useState(false);

  const vehiclePrice  = parseInt(params.price || '0')         || 0;
  const downPct       = parseInt(params.downPct || '20')       || 20;
  const tenureYears   = parseInt(params.tenureYears || '5')    || 5;
  const monthlyIncome = parseFloat(params.monthlyIncome || '0') || 0;
  const downAmt       = Math.round(vehiclePrice * downPct / 100);

  const markupStr = params.markup || '16.00%';
  const markup    = parseFloat(markupStr.replace('%', '')) || 16;
  const loan      = vehiclePrice * (1 - downPct / 100);
  const rRate     = markup / 100 / 12;
  const n         = tenureYears * 12;
  const monthly   = rRate === 0 ? loan / n : (loan * rRate * Math.pow(1 + rRate, n)) / (Math.pow(1 + rRate, n) - 1);

  const vehicleLabel = [params.brand, params.carModel, params.variant].filter(Boolean).join(' ') || 'Vehicle';
  const isIslamic    = params.bankType === 'Islamic';
  const vehicleImgUrl = resolveUrl(params.vehicleImage as string) || (params.vehicleImage as string) || null;
  const bankImgUrl    = resolveUrl(params.bankAvatar as string) || (params.bankAvatar as string) || null;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const body: Record<string, any> = {
        vehicle_type:    params.vehicleType    || 'car',
        condition:       params.condition      || 'new',
        brand:           params.brand          || '',
        car_model:       params.carModel       || '',
        variant:         params.variant        || '',
        color:           params.color          || '',
        year:            params.year           || '',
        city:            params.city           || '',
        dealership:      params.dealership     || '',
        vehicle_price:   vehiclePrice,
        down_payment:    downAmt,
        tenure_years:    tenureYears,
        monthly_income:  monthlyIncome,
        full_name:       params.fullName       || '',
        cnic:            params.cnic           || '',
        employment_type: params.employmentType || 'Salaried',
        bank_id:         params.bankId         || undefined,
        bank_name:       params.bankName       || '',
        bank_product:    params.bankProduct    || '',
        rate_type:       params.rateType       || 'variable',
        vehicle_image:   params.vehicleImage   || null,
      };

      const res = await fetch(`${API_BASE}/financing/applications`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || 'Submission failed');
      }

      const appData = await res.json();
      const appId   = appData.id;

      // Upload documents
      const docUrls  = JSON.parse(params.docUrls  || '[]') as string[];
      const docTypes = JSON.parse(params.docTypes || '[]') as string[];
      for (let i = 0; i < docUrls.length; i++) {
        await fetch(`${API_BASE}/financing/documents`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({ application_id: appId, doc_type: docTypes[i] || 'CNIC', file_url: docUrls[i] }),
        });
      }

      router.push({
        pathname: '/financing-success' as any,
        params: { referenceNo: appData.reference_no, bankName: appData.bank_name },
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>

      <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color={aC.isDark ? WHITE : '#010a1f'} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Review Application</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { backgroundColor: aC.bg }]}>

        {/* VEHICLE CARD */}
        <View style={[s.vehicleCard, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
          {aC.isDark ? (
            <>
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          )}
          <View style={[s.vehicleImgWrap, { backgroundColor: aC.isDark ? '#061B4A' : '#f1f5f9' }]}>
            {vehicleImgUrl ? (
              <Image source={{ uri: vehicleImgUrl }} style={s.vehicleImg} resizeMode="cover" />
            ) : (
              <Ionicons name="car-outline" size={36} color={aC.isDark ? SUB : '#64748b'} />
            )}
          </View>
          <View style={s.vehicleInfo}>
            <Text style={[s.vehicleName, { color: aC.isDark ? WHITE : '#010a1f' }]}>{vehicleLabel}</Text>
            <View style={s.vehicleMeta}>
              <Ionicons name="location-outline" size={12} color={aC.isDark ? SUB : '#475569'} />
              <Text style={[s.vehicleMetaTxt, { color: aC.isDark ? SUB : '#475569' }]}>{params.city || '—'} • {params.year || '—'} • {params.condition || 'New'}</Text>
            </View>
            <Text style={s.vehiclePrice}>{fmt(vehiclePrice)}</Text>
          </View>
        </View>

        {/* BANK PLAN CARD */}
        <View style={[s.bankCard, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
          {aC.isDark ? (
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.35)']} start={{ x: 0.5, y: 0.5 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          )}
          <View style={s.bankHeader}>
            <View style={s.bankRow}>
              <View style={s.bankIcon}>
                {bankImgUrl ? (
                  <Image source={{ uri: bankImgUrl }} style={s.bankImg} resizeMode="cover" />
                ) : (
                  <Leaf size={18} color={isIslamic ? '#15803d' : '#1d4ed8'} />
                )}
              </View>
              <View>
                <Text style={[s.bankName, { color: aC.isDark ? WHITE : '#010a1f' }]}>{params.bankName || '—'}</Text>
                <Text style={[s.bankProduct, { color: aC.isDark ? SUB : '#475569' }]}>{params.bankProduct || '—'}</Text>
              </View>
            </View>
            <View style={[s.islamicTag, { backgroundColor: isIslamic ? (aC.isDark ? '#173a2b' : '#dcfce7') : (aC.isDark ? '#172855' : '#dbeafe') }]}>
              <Text style={[s.islamicTxt, { color: isIslamic ? '#4ade80' : '#60a5fa' }]}>{params.bankType || 'Conventional'}</Text>
            </View>
          </View>
          <Row label="Loan Amount"         value={fmt(Math.round(loan))} />
          <Row label="Monthly Installment" value={fmt(Math.round(monthly))} />
          <Row label="Down Payment"        value={`${fmt(downAmt)} (${downPct}%)`} />
          <Row label="Tenure"              value={`${tenureYears} Years`} />
          <Row label="Markup"              value={`${markupStr} p.a.`} isLast />
        </View>

        {/* APPLICANT SECTION */}
        <View style={[s.applicantCard, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
          {aC.isDark ? (
            <>
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          )}
          <Text style={[s.applicantTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Applicant</Text>
          <Row label="Name"            value={params.fullName       || '—'} />
          <Row label="CNIC"            value={params.cnic           || '—'} />
          <Row label="Employment"      value={params.employmentType || '—'} />
          <Row label="Monthly Income"  value={monthlyIncome > 0 ? fmt(monthlyIncome) : '—'} />
          <Row label="City"            value={params.city           || '—'} isLast />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[s.footer, { backgroundColor: aC.bg, borderTopWidth: aC.isDark ? 0 : 1, borderTopColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} activeOpacity={0.88} disabled={submitting}>
          <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          {submitting
            ? <ActivityIndicator color={WHITE} size="small" />
            : <Text style={s.submitTxt}>Submit Application</Text>
          }
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 56 },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: WHITE, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  vehicleCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', backgroundColor: '#010A1F', padding: 14, marginBottom: 16, overflow: 'hidden' },
  vehicleImgWrap: { width: 72, height: 56, borderRadius: 10, backgroundColor: '#061B4A', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  vehicleImg:     { width: 72, height: 56, borderRadius: 10 },
  vehicleInfo:    { flex: 1 },
  vehicleName:    { color: WHITE, fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  vehicleMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  vehicleMetaTxt: { color: SUB, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  vehiclePrice:   { color: ORANGE, fontSize: 14, fontFamily: 'Poppins_700Bold' },
  bankCard:    { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', backgroundColor: '#010A1F', padding: 16, marginBottom: 16, overflow: 'hidden' },
  bankHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  bankRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bankIcon:    { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bankImg:     { width: 42, height: 42, borderRadius: 21 },
  bankName:    { color: WHITE, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  bankProduct: { color: SUB, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  islamicTag:  { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  islamicTxt:  { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  applicantCard:  { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', backgroundColor: '#010A1F', padding: 16, overflow: 'hidden' },
  applicantTitle: { color: WHITE, fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 4 },
  footer:    { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12, backgroundColor: BG },
  submitBtn: { height: 54, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  submitTxt: { color: WHITE, fontSize: 16, fontFamily: 'Poppins_700Bold' },
});
