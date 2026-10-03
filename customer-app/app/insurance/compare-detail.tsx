import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppColors } from '@/constants/theme';

const ORANGE = '#e2671b';
const NAVY   = '#032a69';
const BLUE   = '#2f6fed';

const COVERAGE_ROWS = [
  'Accidental Damage',
  'Theft',
  'Fire',
  'Flood',
  'Third Party Liability',
  'Windscreen',
  'Natural Disaster',
];

const CLAIM_STEPS = [
  'Report Incident In-App',
  'Upload Photos & FIR',
  'Assessment Within 48h',
  'Cashless Repair Or Reimbursement',
];

function initialsOf(name: string) {
  const clean = (name || '').replace(/[^A-Za-z ]/g, '').trim();
  if (!clean) return 'IN';
  const words = clean.split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function shortName(title: string) {
  const t = (title || '').trim() || 'Plan';
  return t.length > 12 ? `${t.slice(0, 12)}.` : t;
}

function covers(features: any, keyword: string) {
  if (!Array.isArray(features)) return false;
  const kw = keyword.toLowerCase();
  return features.some((f: any) => {
    const s = String(f?.name ?? f?.title ?? f ?? '').toLowerCase();
    return s.includes(kw) || kw.split(' ').some(w => w.length > 3 && s.includes(w));
  });
}

function Mark({ ok }: { ok: boolean }) {
  return (
    <View style={[s.mark, ok ? s.markOk : s.markNo]}>
      <Ionicons name={ok ? 'checkmark' : 'close'} size={12} color={ok ? BLUE : '#ef4444'} strokeWidth={3} />
    </View>
  );
}

export default function InsuranceCompareDetailScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const params = useLocalSearchParams<{ aData?: string; bData?: string }>();

  let a: any = null;
  let b: any = null;
  try { if (params.aData) a = JSON.parse(String(params.aData)); } catch {}
  try { if (params.bData) b = JSON.parse(String(params.bData)); } catch {}

  const [preferred, setPreferred] = useState<'a' | 'b'>('a');
  const [going, setGoing] = useState(false);

  if (!a || !b) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]}>
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={aC.isDark ? '#fff' : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[s.topTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Compare Insurance</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          {going ? <ActivityIndicator color={ORANGE} /> : (
            <Text style={{ color: aC.isDark ? '#baacb6' : '#475569', fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' }}>
              Please select 2 plans to compare.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const titleA = a.title || a.plan_name || `${a.company_name || ''}`.trim() || 'Plan A';
  const titleB = b.title || b.plan_name || `${b.company_name || ''}`.trim() || 'Plan B';
  const priceA = Number(a.annual_premium ?? a.price ?? 0);
  const priceB = Number(b.annual_premium ?? b.price ?? 0);
  const selected = preferred === 'a' ? a : b;

  function handleContinue() {
    const planId = selected?.id || selected?.plan_id;
    if (!planId) {
      Alert.alert('Not Available', 'Selected plan details are not available.');
      return;
    }
    setGoing(true);
    router.push({ pathname: '/insurance/plan-details', params: { planId: String(planId) } } as any);
    setGoing(false);
  }

  const dark = aC.isDark;
  const ink = dark ? '#fff' : '#010a1f';
  const sub = dark ? '#8b93ab' : '#475569';

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28, backgroundColor: aC.bg }}>

        {/* Topbar */}
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={ink} />
          </TouchableOpacity>
          <Text style={[s.topTitle, { color: ink }]}>Compare Insurance</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Plan cards */}
        <View style={s.cardsRow}>
          <View style={s.vsBadgeWrap}><Text style={s.vsBadge}>VS</Text></View>
          {[
            { t: titleA, p: priceA, c: a.company_name || '' },
            { t: titleB, p: priceB, c: b.company_name || '' },
          ].map((card, i) => (
            <View
              key={i}
              style={[s.planCard, { backgroundColor: dark ? '#16213c' : '#ffffff', borderColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(3,42,105,0.12)' }]}
            >
              {dark && (
                <LinearGradient colors={['#16213c', '#2a2440', '#4a3324']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFillObject} />
              )}
              <View style={s.initCircle}>
                <Text style={s.initTxt}>{initialsOf(card.c || card.t)}</Text>
              </View>
              <Text style={[s.planName, { color: ink }]} numberOfLines={2}>{card.t}</Text>
              <Text style={s.planPrice}>Annual PKR {card.p.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Coverage Overview */}
        <Text style={[s.sectionTitle, { color: ink }]}>Coverage Overview</Text>
        <View style={s.table}>
          <View style={[s.row, s.headRow]}>
            <Text style={[s.cellLabel, { color: sub }]}>Feature</Text>
            <Text style={[s.cellVal, { color: sub }]} numberOfLines={1}>{shortName(titleA)}</Text>
            <Text style={[s.cellVal, { color: sub }]} numberOfLines={1}>{shortName(titleB)}</Text>
          </View>
          {COVERAGE_ROWS.map(f => (
            <View key={f} style={s.row}>
              <Text style={[s.cellLabel, { color: ink }]}>{f}</Text>
              <View style={s.cellValWrap}><Mark ok={covers(a.features, f)} /></View>
              <View style={s.cellValWrap}><Mark ok={covers(b.features, f)} /></View>
            </View>
          ))}
        </View>
        <View style={[s.divider, { backgroundColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(3,42,105,0.08)' }]} />

        {/* Claim Process */}
        <Text style={[s.sectionTitle, { color: ink }]}>Claim Process</Text>
        <View style={{ gap: 14, paddingHorizontal: 20, marginTop: 4 }}>
          {CLAIM_STEPS.map((step, i) => (
            <View key={step} style={s.stepRow}>
              <View style={s.stepNum}><Text style={s.stepNumTxt}>{i + 1}</Text></View>
              <Text style={[s.stepTxt, { color: ink }]}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Select Preferred Insurance */}
        <Text style={[s.sectionTitle, { color: ink }]}>Select Preferred Inssurance</Text>
        <View style={{ gap: 10, paddingHorizontal: 20 }}>
          {[
            { key: 'a' as const, t: titleA, p: priceA },
            { key: 'b' as const, t: titleB, p: priceB },
          ].map(row => {
            const sel = preferred === row.key;
            return (
              <TouchableOpacity
                key={row.key}
                activeOpacity={0.85}
                onPress={() => setPreferred(row.key)}
                style={[s.prefCard, { backgroundColor: dark ? 'rgba(3,42,105,0.5)' : '#ffffff', borderColor: sel ? ORANGE : (dark ? 'rgba(100,160,255,0.25)' : 'rgba(3,42,105,0.12)') }]}
              >
                {sel && (
                  <LinearGradient colors={['rgba(100,160,255,0.25)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[s.prefName, { color: ink }]} numberOfLines={1}>{row.t}</Text>
                  <Text style={s.prefPrice}>Annual PKR {row.p.toLocaleString()}</Text>
                </View>
                <View style={[s.radio, sel && s.radioSel]}>
                  {sel && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue */}
        <TouchableOpacity style={s.ctaBtn} activeOpacity={0.88} onPress={handleContinue} disabled={going}>
          <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          {going
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.ctaTxt}>Continue with {shortName(preferred === 'a' ? titleA : titleB)}</Text>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },
  backBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 19, fontFamily: 'Poppins_600SemiBold' },

  cardsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 22, position: 'relative' },
  vsBadgeWrap: { position: 'absolute', top: 52, left: '50%', marginLeft: -14, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, zIndex: 2 },
  vsBadge: { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_700Bold' },
  planCard: { flex: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1, overflow: 'hidden' },
  initCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  initTxt: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  planName: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', lineHeight: 18 },
  planPrice: { color: '#fff', opacity: 0.85, fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 6 },

  sectionTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', paddingHorizontal: 20, marginTop: 6, marginBottom: 10 },
  table: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  headRow: { paddingBottom: 8 },
  cellLabel: { flex: 1.4, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  cellVal: { flex: 1, fontSize: 11, fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  cellValWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  markOk: { backgroundColor: 'rgba(226,103,27,0.15)', borderColor: ORANGE },
  markNo: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: '#ef4444' },
  divider: { height: 1, marginHorizontal: 20, marginTop: 12, marginBottom: 4 },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepNum: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0a2458', alignItems: 'center', justifyContent: 'center' },
  stepNumTxt: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  stepTxt: { flex: 1, fontSize: 13, fontFamily: 'Poppins_500Medium' },

  prefCard: { borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  prefName: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  prefPrice: { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_700Bold', marginTop: 4 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  radioSel: { borderColor: '#fff' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },

  ctaBtn: { marginHorizontal: 20, marginTop: 20, height: 52, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  ctaTxt: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});
