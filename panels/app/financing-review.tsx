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
import { PRIMARY_BTN_COLORS, SavedCardEffect, WARM_CARD_COLORS, WARM_CARD_LOCATIONS } from '@/components/shared/FigmaEffects';

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

function Row({ label, value, isLast, plain }: { label: string; value: string; isLast?: boolean; plain?: boolean }) {
  const aC = useAppColors();
  return (
    <View style={[r.row, plain && { paddingVertical: 8 }, !plain && { borderBottomWidth: 1, borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(3,42,105,0.08)' }]}>
      <Text style={[r.label, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>{label}</Text>
      <Text style={[r.value, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>{value}</Text>
    </View>
  );
}
const r = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  border:{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  label: { color: SUB, fontSize: 13.5, fontFamily: 'Poppins_400Regular' },
  value: { color: WHITE, fontSize: 13.5, fontFamily: 'Poppins_400Regular' },
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
          <Ionicons name="chevron-back" size={26} color={aC.isDark ? '#C9C6D0' : '#010a1f'} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Review Application</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { backgroundColor: aC.bg }]}>

        {/* VEHICLE CARD */}
        <View style={[s.vehicleCard, aC.isDark
          ? { backgroundColor: '#010A1F', borderColor: '#82a5d5', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 }
          : { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)', shadowColor: 'rgba(3,42,105,0.12)', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }]}>
          {aC.isDark ? (
            <SavedCardEffect />
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
            <Text style={[s.vehicleName, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={1}>{vehicleLabel}</Text>
            <View style={s.vehicleMeta}>
              <Ionicons name="location-outline" size={15} color={aC.isDark ? '#BAB6C4' : '#475569'} />
              <Text style={[s.vehicleMetaTxt, { color: aC.isDark ? '#BAB6C4' : '#475569' }]} numberOfLines={1}>{params.city || '—'} • {params.year || '—'} • {params.condition || 'New'}</Text>
            </View>
            <Text style={s.vehiclePrice}>{fmt(vehiclePrice)}</Text>
          </View>
        </View>

        {/* BANK PLAN CARD — border: orange (top) → blue (bottom) */}
        <LinearGradient
          colors={aC.isDark ? ['#E2671B', '#8A5A55', '#2E4F8E'] : ['rgba(3,42,105,0.12)', 'rgba(3,42,105,0.12)']}
          locations={aC.isDark ? [0, 0.5, 1] : undefined}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={s.bankBorder}
        >
        <View style={[s.bankCard, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff' }]}>
          {aC.isDark ? (
            <LinearGradient colors={WARM_CARD_COLORS as any} locations={WARM_CARD_LOCATIONS as any} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          )}
          <View style={s.bankHeader}>
            <View style={[s.bankRow, { flex: 1, marginRight: 8 }]}>
              <View style={[s.bankIcon, { borderWidth: 2, borderColor: aC.isDark ? '#8FAEE3' : 'rgba(3,42,105,0.12)' }]}>
                {bankImgUrl ? (
                  <Image source={{ uri: bankImgUrl }} style={s.bankImg} resizeMode="cover" />
                ) : (
                  <Leaf size={18} color={isIslamic ? '#15803d' : '#1d4ed8'} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.bankName, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={1}>{params.bankName || '—'}</Text>
                <Text style={[s.bankProduct, { color: aC.isDark ? '#C9C6D0' : '#475569' }]} numberOfLines={1}>{params.bankProduct || '—'}</Text>
              </View>
            </View>
            <View style={[s.islamicTag, { backgroundColor: isIslamic ? (aC.isDark ? '#12302A' : '#dcfce7') : (aC.isDark ? '#172855' : '#dbeafe') }]}>
              <Text style={[s.islamicTxt, { color: isIslamic ? '#4ade80' : '#60a5fa' }]}>{params.bankType || 'Conventional'}</Text>
            </View>
          </View>
          <Row plain label="Loan Amount"         value={fmt(Math.round(loan))} />
          <Row plain label="Monthly Installment" value={fmt(Math.round(monthly))} />
          {/* <Row plain label="Down Payment"        value={`${fmt(downAmt)} (${downPct}%)`} /> — not in Figma */}
          <Row plain label="Tenure"              value={`${tenureYears} Years`} />
          <Row plain label="Markup"              value={`${markupStr} p.a.`} isLast />
        </View>
        </LinearGradient>

        {/* APPLICANT SECTION */}
        <View style={[s.applicantCard, { backgroundColor: aC.isDark ? '#020B1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
          {aC.isDark ? null : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          )}
          <Text style={[s.applicantTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Applicant</Text>
          <Row label="Name"            value={params.fullName       || '—'} />
          <Row label="CNIC"            value={params.cnic           || '—'} />
          {/* <Row label="Employment"      value={params.employmentType || '—'} /> — not in Figma */}
          <Row label="Income"          value={monthlyIncome > 0 ? `${fmt(monthlyIncome)}/mo` : '—'} />
          <Row label="City"            value={params.city           || '—'} isLast />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[s.footer, { backgroundColor: aC.bg, borderTopWidth: aC.isDark ? 0 : 1, borderTopColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} activeOpacity={0.88} disabled={submitting}>
          <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
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
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, height: 60 },
  backBtn:     { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { color: WHITE, fontSize: 20, fontFamily: 'Poppins_500Medium' },
  vehicleCard:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, padding: 8, paddingRight: 12, marginBottom: 14, overflow: 'hidden' },
  vehicleImgWrap: { width: 90, height: 62, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  vehicleImg:     { width: 90, height: 62, borderRadius: 10 },
  vehicleInfo:    { flex: 1 },
  vehicleName:    { color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium', marginBottom: 1 },
  vehicleMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 1 },
  vehicleMetaTxt: { color: SUB, fontSize: 12.5, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  vehiclePrice:   { color: ORANGE, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  bankBorder:  { borderRadius: 16, padding: 1, marginBottom: 20 },
  bankCard:    { borderRadius: 15, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, overflow: 'hidden' },
  bankHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  bankRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bankIcon:    { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bankImg:     { width: 42, height: 42, borderRadius: 21 },
  bankName:    { color: WHITE, fontSize: 16, fontFamily: 'Poppins_500Medium' },
  bankProduct: { color: SUB, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  islamicTag:  { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4, flexShrink: 0 },
  islamicTxt:  { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  applicantCard:  { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8, overflow: 'hidden' },
  applicantTitle: { color: WHITE, fontSize: 16, fontFamily: 'Poppins_500Medium', marginBottom: 2 },
  footer:    { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 36, paddingTop: 12, backgroundColor: BG },
  submitBtn: { height: 50, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  submitTxt: { color: '#EDEBF0', fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
});
