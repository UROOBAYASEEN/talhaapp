import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Star, Building2 } from 'lucide-react-native';
import { API_BASE } from '@/constants/api';
import { useAppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { PRIMARY_BTN_COLORS, RingGlow, SavedCardEffect } from '@/components/shared/FigmaEffects';

const SERVER = API_BASE.replace('/api/v1', '');

function resolveUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}

const ORANGE = '#e2671b';

const FILTERS = ['Lowest Plan', 'Fastest Approval', 'Lowest Fee'];

type Bank = {
  id: string; name: string; product_name: string;
  bank_type: string; markup_type: string; avg_markup: string;
  rating: number; reviews_count: number;
  processing_fee: number; security_deposit: number;
  insurance_fee?: number;
  avatar_url?: string | null;
};

function calcInstallment(price: number, downPct: number, tenureYears: number, markupStr: string) {
  const markup = parseFloat(markupStr.replace('%', '')) || 16;
  const loan   = price * (1 - downPct / 100);
  const r      = markup / 100 / 12;
  const n      = tenureYears * 12;
  if (n <= 0 || loan <= 0) return { loan: 0, monthly: 0 };
  const monthly = r === 0 ? loan / n : (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return { loan: Math.round(loan), monthly: Math.round(monthly) };
}

function fmt(n: number) {
  return `Rs ${n.toLocaleString('en-PK')}`;
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const aC = useAppColors();
  return (
    <View style={r.row}>
      <Text style={[r.label, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>{label}</Text>
      <Text style={[r.value, { color: aC.isDark ? '#fff' : '#010a1f' }, highlight && r.highlight]}>{value}</Text>
    </View>
  );
}
const r = StyleSheet.create({
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  label:     { color: '#94a3b8', fontSize: 13, fontFamily: 'Poppins_400Regular', flex: 1 },
  value:     { color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'right' },
  highlight: { color: ORANGE, fontFamily: 'Poppins_500Medium' },
});

function BankCard({ bank, price, downPct, tenureYears, onApply, onBankPress }: {
  bank: Bank; price: number; downPct: number; tenureYears: number;
  onApply: (b: Bank) => void; onBankPress: (b: Bank) => void;
}) {
  const aC = useAppColors();
  const { loan, monthly } = calcInstallment(price, downPct, tenureYears, bank.avg_markup);
  const downAmt = Math.round(price * downPct / 100);
  const insuranceFee = bank.insurance_fee ?? Math.round(price * 0.01);
  const totalDown = downAmt + bank.processing_fee + bank.security_deposit + insuranceFee;
  const months = tenureYears * 12;
  const totalCost = totalDown + monthly * months;
  const isIslamic = bank.bank_type === 'Islamic';

  return (
    <View style={[pc.card, aC.isDark
      ? { backgroundColor: '#010A1F', borderColor: '#82a5d5', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 }
      : { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)', shadowColor: 'rgba(3,42,105,0.12)', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }]}>
      {aC.isDark ? (
        <SavedCardEffect />
      ) : (
        <>
          <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        </>
      )}

      <View style={pc.header}>
        <TouchableOpacity style={[pc.bankRow, { flex: 1, marginRight: 8 }]} onPress={() => onBankPress(bank)} activeOpacity={0.8}>
          <View style={[pc.iconWrap, { backgroundColor: aC.isDark ? '#fff' : '#eef2ff', borderWidth: aC.isDark ? 2 : 1, borderColor: aC.isDark ? '#8FAEE3' : 'rgba(3,42,105,0.12)' }]}>
            {resolveUrl(bank.avatar_url) ? (
              <Image
                source={{ uri: resolveUrl(bank.avatar_url)! }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
                resizeMode="cover"
              />
            ) : (
              <Building2 size={20} color={isIslamic ? '#15803d' : '#1d4ed8'} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[pc.bankName, { color: aC.isDark ? '#fff' : '#010a1f' }]} numberOfLines={1}>{bank.name}</Text>
            <Text style={[pc.product, { color: aC.isDark ? '#94a3b8' : '#475569' }]} numberOfLines={1}>{bank.product_name}</Text>
          </View>
        </TouchableOpacity>
        <View style={[pc.tagWrap, { backgroundColor: isIslamic ? (aC.isDark ? '#12302A' : 'rgba(22,101,52,0.12)') : (aC.isDark ? '#172855' : 'rgba(29,78,216,0.10)') }]}>
          <Text style={[pc.tagTxt, { color: isIslamic ? '#4ade80' : '#60a5fa' }]}>{bank.bank_type}</Text>
        </View>
      </View>

      <View style={pc.ratingRow}>
        <Ionicons name="star" size={20} color={ORANGE} />
        <Text style={[pc.ratingReviews, { color: aC.isDark ? '#BAB6C4' : '#475569' }]}>{bank.rating.toFixed(1)} ({bank.reviews_count}+ Reviews)</Text>
      </View>

      <Row label="Vehicle Price"              value={fmt(price)}                highlight />
      <View style={[pc.divider, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(3,42,105,0.08)' }]} />
      <Row label="Processing Fee"             value={fmt(bank.processing_fee)} />
      <Row label="Security Deposit"           value={fmt(bank.security_deposit)} />
      <Row label="Insurance Fee (1st year)"   value={fmt(insuranceFee)} />
      <Row label={`Down Payment(${downPct}%)`} value={fmt(downAmt)}           />
      <Row label="Total Down Payment"         value={fmt(totalDown)}          highlight />
      <Row label="Number of Months"           value={String(months)} />
      <Row label="Monthly Installments"       value={fmt(monthly)} />
      <Row label="Total Cost After Financing" value={fmt(totalCost)} />

      <TouchableOpacity style={pc.applyBtn} onPress={() => onApply(bank)} activeOpacity={0.88}>
        <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
        <Text style={pc.applyTxt}>Apply Now</Text>
      </TouchableOpacity>
    </View>
  );
}
const pc = StyleSheet.create({
  card:      { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: '#010A1F', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14, marginBottom: 18, overflow: 'hidden' },
  header:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  bankRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap:  { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bankName:  { color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium' },
  product:   { color: '#94a3b8', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  tagWrap:   { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4, flexShrink: 0 },
  tagTxt:    { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  ratingVal: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  ratingReviews: { color: '#94a3b8', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  divider:   { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 4, marginBottom: 6 },
  applyBtn:  { height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  applyTxt:  { color: '#EDEBF0', fontSize: 13, fontFamily: 'Poppins_500Medium' },
});

export default function FinancingCompareScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const params = useLocalSearchParams<{
    vehicleType?: string; condition?: string; city?: string; brand?: string;
    carModel?: string; variant?: string; color?: string; year?: string;
    price?: string; dealership?: string; downPct?: string; rateType?: string;
    tenureYears?: string; bankId?: string;
  }>();

  const price       = parseInt(params.price || '5350000') || 5350000;
  const downPct     = parseInt(params.downPct || '20')    || 20;
  const tenureYears = parseInt(params.tenureYears || '5') || 5;

  const [banks,        setBanks]        = useState<Bank[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeFilter, setActiveFilter] = useState('Lowest Plan');

  useEffect(() => {
    fetch(`${API_BASE}/financing/banks`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setBanks(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function sortedBanks() {
    const copy = [...banks];
    if (activeFilter === 'Fastest Approval') copy.sort((a, b) => b.rating - a.rating);
    else if (activeFilter === 'Lowest Fee') copy.sort((a, b) => a.processing_fee - b.processing_fee);
    else copy.sort((a, b) => parseFloat(a.avg_markup) - parseFloat(b.avg_markup));
    return copy;
  }

  function handleApply(bank: Bank) {
    const rawAvatar = bank.avatar_url || '';
    const resolvedAvatar = rawAvatar ? (rawAvatar.startsWith('http') ? rawAvatar : `${SERVER}${rawAvatar}`) : '';
    router.push({
      pathname: '/financing-apply' as any,
      params: {
        ...params,
        bankId:      bank.id,
        bankName:    bank.name,
        bankProduct: bank.product_name,
        bankType:    bank.bank_type,
        markup:      bank.avg_markup,
        bankAvatar:  resolvedAvatar,
      },
    });
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>
      <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <ChevronLeft size={26} color={aC.isDark ? '#C9C6D0' : '#010a1f'} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Finance Purchase</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { backgroundColor: aC.bg }]} style={{ backgroundColor: aC.bg }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.filtersRow, { backgroundColor: aC.bg }]}>
          {FILTERS.map(f => {
            const active = f === activeFilter;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  s.chip,
                  aC.isDark
                    ? (active ? { backgroundColor: '#0A1838', borderColor: '#7E9FD6' } : { backgroundColor: '#0B1D4A', borderColor: 'transparent' })
                    : { backgroundColor: '#ffffff', borderColor: active ? ORANGE : 'rgba(3,42,105,0.12)', shadowColor: 'rgba(3,42,105,0.08)', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
                ]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.8}
              >
                {active && (
                  <>
                    {aC.isDark ? (
                      <RingGlow radius={14} peak={0.5} rings={8} />
                    ) : (
                      <>
                        <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                        <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                      </>
                    )}
                  </>
                )}
                <Text style={[s.chipTxt, { color: active ? ORANGE : (aC.isDark ? '#F2F1F5' : '#475569') }, active && s.chipTxtActive]}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[s.subTxt, { color: aC.isDark ? '#E6E4EA' : '#475569' }]}>
          Installment shown for financing Rs {price.toLocaleString('en-PK')} over {tenureYears} years
        </Text>

        {loading ? (
          <ActivityIndicator color={ORANGE} style={{ marginTop: 40 }} />
        ) : sortedBanks().length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
            <Text style={{ fontSize: 36 }}>🏦</Text>
            <Text style={{ color: aC.isDark ? '#fff' : '#010a1f', fontSize: 15, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' }}>No Banks Available</Text>
            <Text style={{ color: aC.isDark ? '#94a3b8' : '#475569', fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 18 }}>
              No approved bank representatives found.{'\n'}Bank plans will appear here once banks are registered.
            </Text>
          </View>
        ) : sortedBanks().map(bank => (
          <BankCard
            key={bank.id}
            bank={bank}
            price={price}
            downPct={downPct}
            tenureYears={tenureYears}
            onApply={handleApply}
            onBankPress={(b) => router.push({ pathname: '/bank-profile-view' as any, params: { bankId: b.id } })}
          />
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#010A1F' },
  scroll: { paddingHorizontal: 14, paddingBottom: 16 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 14, paddingTop: 6, paddingBottom: 12 },
  backBtn:     { width: 30, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontFamily: 'Poppins_500Medium' },
  filtersRow:   { gap: 10, paddingBottom: 4, marginBottom: 6 },
  chip:         { height: 42, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  chipActive:   { borderColor: ORANGE, backgroundColor: '#2a1a10' },
  chipInactive: { borderColor: 'rgba(100,160,255,0.4)', backgroundColor: '#061B4A' },
  chipTxt:      { color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  chipTxtActive:{ color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  subTxt: { color: '#94a3b8', fontSize: 11.5, fontFamily: 'Poppins_400Regular', marginBottom: 14 },
});
