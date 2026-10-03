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
import { Ionicons } from '@expo/vector-icons';
import { PRIMARY_BTN_COLORS, RingGlow, SavedCardEffect, WARM_CARD_COLORS, WARM_CARD_LOCATIONS } from '@/components/shared/FigmaEffects';

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
            { backgroundColor: aC.isDark ? '#0B2A63' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)' },
            step === activeStep && { backgroundColor: aC.isDark ? '#010A1F' : 'rgba(226,103,27,0.10)', borderColor: aC.isDark ? '#82a5d5' : ORANGE },
          ]}>
            {step === activeStep && aC.isDark && <SavedCardEffect band={9} />}
            <Text style={[
              si.num,
              { color: aC.isDark ? '#F2F1F5' : '#475569' },
              step === activeStep && { color: aC.isDark ? '#fff' : ORANGE },
            ]}>{step}</Text>
          </View>
          {idx < STEPS.length - 1 && <View style={[si.line, { backgroundColor: aC.isDark ? '#1E3F7C' : 'rgba(3,42,105,0.12)' }]} />}
        </View>
      ))}
    </View>
  );
}
const si = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 0 },
  item:        { flexDirection: 'row', alignItems: 'center' },
  circle:      { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#1e3a8a', backgroundColor: '#0e1a3d', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  circleActive:{ borderColor: '#3b6fe0', backgroundColor: '#173066' },
  num:         { color: '#cbd5e1', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  numActive:   { color: '#fff' },
  line:        { width: 44, height: 1, backgroundColor: '#1e3a8a' },
});

function DetailRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  const aC = useAppColors();
  return (
    <View style={[dr.row, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(3,42,105,0.08)', borderBottomWidth: 1 }]}>
      <Text style={[dr.label, { color: aC.isDark ? '#9A97A6' : '#475569' }]}>{label}</Text>
      <Text style={[dr.value, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>{value}</Text>
    </View>
  );
}
const dr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  border:{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  label: { color: '#94a3b8', fontSize: 12.5, fontFamily: 'Poppins_400Regular', flex: 1 },
  value: { color: '#fff', fontSize: 12.5, fontFamily: 'Poppins_500Medium', textAlign: 'right' },
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
          <ChevronLeft size={26} color={aC.isDark ? '#C9C6D0' : '#010a1f'} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Apply</Text>
        <View style={{ width: 36 }} />
      </View>

      <StepIndicator activeStep={1} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { backgroundColor: aC.bg }]} keyboardShouldPersistTaps="handled" style={{ backgroundColor: aC.bg }}>

        {/* VEHICLE SUMMARY */}
        <View style={[s.vehicleRow, { backgroundColor: 'transparent', borderColor: aC.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(3,42,105,0.12)' }]}>
          <Ionicons name="information-circle" size={24} color={aC.isDark ? '#C9C6D0' : '#475569'} />
          <Text style={[s.vehicleName, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={1}>{vehicleLabel}</Text>
          <Text style={[s.vehiclePrice, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>{fmt(vehiclePrice)}</Text>
        </View>

        {/* BANK PLAN — border: orange (top) → blue (bottom) */}
        <LinearGradient
          colors={aC.isDark ? ['#E2671B', '#8A5A55', '#2E4F8E'] : ['rgba(3,42,105,0.12)', 'rgba(3,42,105,0.12)']}
          locations={aC.isDark ? [0, 0.5, 1] : undefined}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={s.bankBorder}
        >
        <View style={[s.bankCard, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff' }]}>
          {aC.isDark && <LinearGradient colors={WARM_CARD_COLORS as any} locations={WARM_CARD_LOCATIONS as any} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
          <View style={[s.bankRow, { flex: 1, marginRight: 8 }]}>
            <View style={[s.bankIcon, { borderWidth: 2, borderColor: aC.isDark ? '#8FAEE3' : 'rgba(3,42,105,0.12)' }]}>
              {bankImgUrl ? (
                <Image source={{ uri: bankImgUrl }} style={s.bankImg} resizeMode="cover" />
              ) : (
                <Leaf size={18} color={isIslamic ? '#15803d' : '#1d4ed8'} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.bankName, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={1}>{params.bankName || 'Bank'}</Text>
              <Text style={[s.bankProduct, { color: aC.isDark ? '#C9C6D0' : '#475569' }]} numberOfLines={1}>{params.bankProduct || ''}</Text>
            </View>
          </View>
          <View style={[s.tagWrap, { backgroundColor: isIslamic ? (aC.isDark ? '#12302A' : 'rgba(22,101,52,0.12)') : (aC.isDark ? '#172855' : 'rgba(29,78,216,0.10)') }]}>
            <Text style={[s.tagTxt, { color: isIslamic ? '#4ade80' : '#60a5fa' }]}>{params.bankType || 'Conventional'}</Text>
          </View>
        </View>
        </LinearGradient>

        {/* TENURE */}
        <Text style={[s.sectionTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Tenure (in years)</Text>
        <View style={s.optionRow}>
          {TENURE_OPTIONS.map(y => {
            const active = y === tenure;
            return (
              <TouchableOpacity key={y} style={[s.optCircle, { backgroundColor: 'transparent', borderColor: aC.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(3,42,105,0.12)' }, active && s.optCircleActive]} onPress={() => setTenure(y)} activeOpacity={0.8}>
                {active && (
                  <>
                    <LinearGradient colors={['#E2671B', '#8A5A55', '#2E4F8E']} locations={[0, 0.5, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} />
                    <LinearGradient colors={['#0B1D4A', '#0E2152', '#3A2F4A', '#6E4538']} locations={[0, 0.45, 0.75, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={s.optInner} />
                  </>
                )}
                <Text style={[s.optTxt, { color: aC.isDark ? '#9A97A6' : '#475569' }, active && s.optTxtActive]}>{y}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DOWN PAYMENT */}
        <Text style={[s.sectionTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Down payment</Text>
        <View style={s.dpGrid}>
          {DOWN_PAYMENT_OPTIONS.map(pct => {
            const active = pct === downPayment;
            return (
              <TouchableOpacity key={pct} style={[s.optCircle, { backgroundColor: 'transparent', borderColor: aC.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(3,42,105,0.12)' }, active && s.optCircleActive]} onPress={() => setDownPayment(pct)} activeOpacity={0.8}>
                {active && (
                  <>
                    <LinearGradient colors={['#E2671B', '#8A5A55', '#2E4F8E']} locations={[0, 0.5, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} />
                    <LinearGradient colors={['#0B1D4A', '#0E2152', '#3A2F4A', '#6E4538']} locations={[0, 0.45, 0.75, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={s.optInner} />
                  </>
                )}
                <Text style={[s.optTxtSm, { color: aC.isDark ? '#9A97A6' : '#475569' }, active && s.optTxtActive]}>{pct}%</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DETAILS */}
        <Text style={[s.subHeading, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Details</Text>
        <DetailRow label="Monthly payment"                  value={fmt(monthly)} />
        <DetailRow label={`Down payment (${downPayment}%)`} value={fmt(downAmt)} />
        <DetailRow label="Tenure (in years)"                value={`${tenure} years`} />
        <DetailRow label="Bank loan"                        value={fmt(loan)} isLast />

        {/* INITIAL PAYMENT */}
        <SH>Initial payment</SH>
        <DetailRow label="Down payment"         value={fmt(downAmt)} />
        <DetailRow label="Processing fee"       value={fmt(processingFee)} />
        <DetailRow label="First year insurance" value={fmt(insurance)} isLast />

        {/* YEARLY INSTALLMENT PLAN */}
        <SH>Yearly installment plan</SH>
        {Array.from({ length: tenure }).map((_, i) => {
          const n = i + 1;
          const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
          return <DetailRow key={n} label={`${n}${suffix} year`} value={`${fmt(monthly)}/Month`} isLast={n === tenure} />;
        })}

        <Text style={[s.linksTxt, { color: aC.isDark ? '#E6E4EA' : '#334155' }]}>
          Please view <Text style={s.link}>Eligibility Criteria</Text>, <Text style={s.link}>Required Documents</Text> for a smooth application process
        </Text>
        <Text style={[s.disclaimer, { color: aC.isDark ? '#6E6A7A' : '#64748b' }]}>
          Disclaimer: Prices and Calculations might have slight variation depending on KIBOR or any other variable rates. Prices can be verified from respective bank(s).
        </Text>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={[s.footer, { backgroundColor: aC.isDark ? '#0A1530' : '#ffffff', borderTopColor: aC.isDark ? 'rgba(126,159,214,0.35)' : 'rgba(3,42,105,0.08)' }]}>
        {aC.isDark && <LinearGradient colors={['rgba(40,86,168,0.25)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
        <View style={s.footerTop}>
          <Text style={[s.depositLabel, { color: aC.isDark ? '#E6E4EA' : '#475569' }]}>Total initial deposit:</Text>
          <Text style={[s.depositVal, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>{fmt(totalInitial)}</Text>
        </View>
        <TouchableOpacity
          style={s.continueBtn}
          activeOpacity={0.88}
          onPress={() => router.push({
            pathname: '/financing-apply-2' as any,
            params: { ...params, tenureYears: String(tenure), downPct: String(downPayment) },
          })}
        >
          <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          <Text style={s.continueTxt}>Continue</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#010A1F' },
  scroll: { paddingHorizontal: 14, paddingBottom: 16 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 6, paddingBottom: 0 },
  backBtn:     { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontFamily: 'Poppins_500Medium' },
  vehicleRow:  { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, gap: 10 },
  vehicleIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  vehicleName: { flex: 1, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  vehiclePrice:{ fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  bankBorder: { borderRadius: 16, padding: 1, marginBottom: 16 },
  bankCard:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 15, paddingHorizontal: 16, paddingVertical: 18, overflow: 'hidden' },
  bankRow:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bankIcon:   { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bankImg:    { width: 44, height: 44, borderRadius: 22 },
  bankName:   { fontSize: 17, fontFamily: 'Poppins_500Medium' },
  bankProduct:{ fontSize: 13, fontFamily: 'Poppins_400Regular' },
  tagWrap:    { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4, flexShrink: 0 },
  tagTxt:     { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  sectionTitle:   { fontSize: 16, fontFamily: 'Poppins_400Regular', marginBottom: 12 },
  subHeading:     { fontSize: 14.5, fontFamily: 'Poppins_600SemiBold', marginTop: 16, marginBottom: 2 },
  sectionHeading: { color: '#fff', fontSize: 17, fontFamily: 'Poppins_500Medium', marginTop: 22, marginBottom: 2 },
  optionRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  dpGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  optCircle:      { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  optCircleActive:{ borderWidth: 0 },
  optInner:       { position: 'absolute', top: 1, left: 1, right: 1, bottom: 1, borderRadius: 20 },
  optTxt:         { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  optTxtSm:       { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  optTxtActive:   { color: '#fff' },
  card:       { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: '#010A1F', paddingHorizontal: 16, overflow: 'hidden', marginBottom: 4 },
  linksTxt:   { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18, marginTop: 18 },
  link:       { color: '#4B8BFF', textDecorationLine: 'underline' },
  disclaimer: { fontSize: 11.5, fontFamily: 'Poppins_400Regular', lineHeight: 18, marginTop: 10 },
  footer:       { borderTopWidth: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 30, overflow: 'hidden' },
  footerTop:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 },
  depositLabel: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  depositVal:   { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  continueBtn:  { height: 50, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  continueTxt:  { color: '#EDEBF0', fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
});
