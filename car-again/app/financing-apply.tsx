import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Info, Leaf } from 'lucide-react-native';
import { API_BASE } from '@/constants/api';
import { useAppColors } from '@/constants/theme';

const ORANGE = '#e2671b';
const SERVER = API_BASE.replace('/api/v1', '');

function resolveUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}
const STEPS              = [1, 2, 3, 4];
const TENURE_OPTIONS     = [1, 2, 3, 4, 5];
const DOWN_PAYMENT_OPTIONS = [30, 35, 40, 45, 50, 55, 60, 65, 70];

function calcInstallment(price: number, downPct: number, tenureYears: number, markupStr: string) {
  const markup = parseFloat(markupStr.replace('%', '')) || 16;
  const loan   = price * (1 - downPct / 100);
  const r      = markup / 100 / 12;
  const n      = tenureYears * 12;
  if (n <= 0 || loan <= 0) return { loan: 0, monthly: 0 };
  const monthly = r === 0 ? loan / n : (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return { loan: Math.round(loan), monthly: Math.round(monthly) };
}

function fmt(n: number) { return `PKR ${n.toLocaleString('en-PK')}`; }

function StepIndicator({ activeStep }: { activeStep: number }) {
  const aC = useAppColors();
  return (
    <View style={si.row}>
      {STEPS.map((step, idx) => (
        <View key={step} style={si.item}>
          <View style={[
            si.circle,
            { backgroundColor: aC.isDark ? '#0e1a3d' : '#ffffff', borderColor: aC.isDark ? '#1e3a8a' : 'rgba(3,42,105,0.12)' },
            step === activeStep && { backgroundColor: aC.isDark ? '#173066' : 'rgba(226,103,27,0.10)', borderColor: aC.isDark ? '#3b6fe0' : ORANGE },
          ]}>
            <Text style={[
              si.num,
              { color: aC.isDark ? '#cbd5e1' : '#475569' },
              step === activeStep && { color: aC.isDark ? '#fff' : ORANGE },
            ]}>{step}</Text>
          </View>
          {idx < STEPS.length - 1 && <View style={[si.line, { backgroundColor: aC.isDark ? '#1e3a8a' : 'rgba(3,42,105,0.12)' }]} />}
        </View>
      ))}
    </View>
  );
}
const si = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 0 },
  item:        { flexDirection: 'row', alignItems: 'center' },
  circle:      { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#1e3a8a', backgroundColor: '#0e1a3d', alignItems: 'center', justifyContent: 'center' },
  circleActive:{ borderColor: '#3b6fe0', backgroundColor: '#173066' },
  num:         { color: '#cbd5e1', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  numActive:   { color: '#fff' },
  line:        { width: 32, height: 1, backgroundColor: '#1e3a8a', marginHorizontal: 6 },
});

function DetailRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  const aC = useAppColors();
  return (
    <View style={[dr.row, !isLast && { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.08)', borderBottomWidth: 1 }]}>
      <Text style={[dr.label, { color: aC.isDark ? '#94a3b8' : '#475569' }]}>{label}</Text>
      <Text style={[dr.value, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{value}</Text>
    </View>
  );
}
const dr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  border:{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  label: { color: '#94a3b8', fontSize: 13, fontFamily: 'Poppins_400Regular', flex: 1 },
  value: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold', textAlign: 'right' },
});

function SH({ children }: { children: string }) {
  const aC = useAppColors();
  return <Text style={[s.sectionHeading, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{children}</Text>;
}

export default function FinancingApplyScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const params = useLocalSearchParams<{
    vehicleType?: string; condition?: string; city?: string; brand?: string;
    carModel?: string; variant?: string; color?: string; year?: string;
    price?: string; dealership?: string; downPct?: string; rateType?: string;
    tenureYears?: string; bankId?: string; bankName?: string;
    bankProduct?: string; bankType?: string; markup?: string;
    bankAvatar?: string; vehicleImage?: string;
  }>();

  const vehiclePrice = parseInt(params.price || '0') || 0;
  const markupStr    = params.markup || '16.00%';
  const isIslamic    = params.bankType === 'Islamic';
  const bankImgUrl   = resolveUrl(params.bankAvatar as string) || (params.bankAvatar as string) || null;

  const [tenure,      setTenure]      = useState(parseInt(params.tenureYears || '5') || 5);
  const [downPayment, setDownPayment] = useState(parseInt(params.downPct || '30') || 30);

  const { loan, monthly } = calcInstallment(vehiclePrice, downPayment, tenure, markupStr);
  const downAmt     = Math.round(vehiclePrice * downPayment / 100);
  const processingFee = 12000;
  const insurance   = Math.round(vehiclePrice * 0.015);
  const totalInitial = downAmt + processingFee + insurance;

  const vehicleLabel = [params.brand, params.carModel, params.variant].filter(Boolean).join(' ') || 'Your Vehicle';

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>

      <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <ChevronLeft size={26} color={aC.isDark ? '#e2e8f0' : '#010a1f'} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Apply</Text>
        <View style={{ width: 36 }} />
      </View>

      <StepIndicator activeStep={1} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { backgroundColor: aC.bg }]} keyboardShouldPersistTaps="handled" style={{ backgroundColor: aC.bg }}>

        {/* VEHICLE SUMMARY */}
        <View style={[s.vehicleRow, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2 }]}>
          <View style={[s.vehicleIcon, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.1)' : '#eef2ff' }]}><Info size={15} color={aC.isDark ? '#cbd5e1' : '#475569'} /></View>
          <Text style={[s.vehicleName, { color: aC.isDark ? '#e2e8f0' : '#010a1f' }]}>{vehicleLabel}</Text>
          <Text style={[s.vehiclePrice, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{fmt(vehiclePrice)}</Text>
        </View>

        {/* BANK PLAN */}
        <View style={[s.bankCard, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2 }]}>
          <View style={s.bankRow}>
            <View style={[s.bankIcon, { borderWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)' }]}>
              {bankImgUrl ? (
                <Image source={{ uri: bankImgUrl }} style={s.bankImg} resizeMode="cover" />
              ) : (
                <Leaf size={18} color={isIslamic ? '#15803d' : '#1d4ed8'} />
              )}
            </View>
            <View>
              <Text style={[s.bankName, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{params.bankName || 'Bank'}</Text>
              <Text style={[s.bankProduct, { color: aC.isDark ? '#94a3b8' : '#475569' }]}>{params.bankProduct || ''}</Text>
            </View>
          </View>
          <View style={[s.tagWrap, { backgroundColor: isIslamic ? (aC.isDark ? '#173a2b' : 'rgba(22,101,52,0.12)') : (aC.isDark ? '#172855' : 'rgba(29,78,216,0.10)') }]}>
            <Text style={[s.tagTxt, { color: isIslamic ? '#4ade80' : '#60a5fa' }]}>{params.bankType || 'Conventional'}</Text>
          </View>
        </View>

        {/* TENURE */}
        <Text style={[s.sectionTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Tenure (in years)</Text>
        <View style={s.optionRow}>
          {TENURE_OPTIONS.map(y => {
            const active = y === tenure;
            return (
              <TouchableOpacity key={y} style={[s.optCircle, { backgroundColor: aC.isDark ? '#0e1a3d' : '#ffffff', borderColor: aC.isDark ? '#1e3a8a' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }, active && s.optCircleActive]} onPress={() => setTenure(y)} activeOpacity={0.8}>
                {active && <LinearGradient colors={['#1b3a8f', '#d2621f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
                <Text style={[s.optTxt, { color: aC.isDark ? '#cbd5e1' : '#475569' }, active && s.optTxtActive]}>{y}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DOWN PAYMENT */}
        <Text style={[s.sectionTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Down payment</Text>
        <View style={s.dpGrid}>
          {DOWN_PAYMENT_OPTIONS.map(pct => {
            const active = pct === downPayment;
            return (
              <TouchableOpacity key={pct} style={[s.optCircle, { backgroundColor: aC.isDark ? '#0e1a3d' : '#ffffff', borderColor: aC.isDark ? '#1e3a8a' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }, active && s.optCircleActive]} onPress={() => setDownPayment(pct)} activeOpacity={0.8}>
                {active && <LinearGradient colors={['#1b3a8f', '#d2621f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
                <Text style={[s.optTxtSm, { color: aC.isDark ? '#cbd5e1' : '#475569' }, active && s.optTxtActive]}>{pct}%</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DETAILS */}
        <SH>Details</SH>
        <View style={[s.card, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
          {aC.isDark ? (
            <>
              <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          )}
          <DetailRow label="Monthly payment"             value={fmt(monthly)} />
          <DetailRow label={`Down payment (${downPayment}%)`} value={fmt(downAmt)} />
          <DetailRow label="Tenure (in years)"           value={`${tenure} years`} />
          <DetailRow label="Bank loan"                   value={fmt(loan)} isLast />
        </View>

        {/* INITIAL PAYMENT */}
        <SH>Initial payment</SH>
        <View style={[s.card, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
          {aC.isDark ? (
            <>
              <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          )}
          <DetailRow label="Down payment"          value={fmt(downAmt)} />
          <DetailRow label="Processing fee"         value={fmt(processingFee)} />
          <DetailRow label="First year insurance"   value={fmt(insurance)} isLast />
        </View>

        <Text style={[s.disclaimer, { color: aC.isDark ? '#64748b' : '#64748b' }]}>
          Disclaimer: Prices and calculations may vary depending on KIBOR or other variable rates.
        </Text>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={[s.footer, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderTopColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.08)' }]}>
        <View style={s.footerTop}>
          <Text style={[s.depositLabel, { color: aC.isDark ? '#94a3b8' : '#475569' }]}>Total initial deposit:</Text>
          <Text style={[s.depositVal, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{fmt(totalInitial)}</Text>
        </View>
        <TouchableOpacity
          style={s.continueBtn}
          activeOpacity={0.88}
          onPress={() => router.push({
            pathname: '/financing-apply-2' as any,
            params: { ...params, tenureYears: String(tenure), downPct: String(downPayment) },
          })}
        >
          <LinearGradient colors={['#1b3a8f', '#5a4a7b', '#d2621f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          <Text style={s.continueTxt}>Continue</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#010A1F' },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 19, fontFamily: 'Poppins_600SemiBold' },
  vehicleRow:  { flexDirection: 'row', alignItems: 'center', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: '#010A1F', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, gap: 10, overflow: 'hidden' },
  vehicleIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  vehicleName: { flex: 1, color: '#e2e8f0', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  vehiclePrice:{ color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  bankCard:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: '#010A1F', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20, overflow: 'hidden' },
  bankRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bankIcon:   { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bankImg:    { width: 40, height: 40, borderRadius: 20 },
  bankName:   { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  bankProduct:{ color: '#94a3b8', fontSize: 11, fontFamily: 'Poppins_400Regular' },
  tagWrap:    { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  tagTxt:     { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  sectionTitle:   { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 12 },
  sectionHeading: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold', marginTop: 20, marginBottom: 10 },
  optionRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  dpGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  optCircle:      { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#1e3a8a', backgroundColor: '#0e1a3d', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  optCircleActive:{ borderColor: ORANGE },
  optTxt:         { color: '#cbd5e1', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  optTxtSm:       { color: '#cbd5e1', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  optTxtActive:   { color: '#fff' },
  card:       { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: '#010A1F', paddingHorizontal: 16, overflow: 'hidden', marginBottom: 4 },
  disclaimer: { color: '#64748b', fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 18, marginTop: 16 },
  footer:       { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: '#010A1F', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32 },
  footerTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  depositLabel: { color: '#94a3b8', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  depositVal:   { color: '#fff', fontSize: 14, fontFamily: 'Poppins_700Bold' },
  continueBtn:  { height: 54, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  continueTxt:  { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },
});
