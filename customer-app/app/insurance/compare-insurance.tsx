import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { PRIMARY_BTN_COLORS, SavedCardEffect, WARM_CARD_COLORS, WARM_CARD_LOCATIONS } from '@/components/shared/FigmaEffects';

const ORANGE = '#e2671b';
const SERVER = API_BASE.replace('/api/v1', '');
function resolveUrl(u?: string | null) { if (!u) return ''; if (u.startsWith('http')) return u; return `${SERVER}${u}`; }

const COVERAGE = ['Accidental Damage', 'Theft', 'Fire', 'Flood', 'Third Party Liability', 'Windscreen', 'Natural Disaster'];
const CLAIM_STEPS = ['Report Incident In-App', 'Upload Photos & FIR', 'Assessment Within 48h', 'Cashless Repair Or Reimbursement'];

type Plan = {
  id: string | number; company_name: string; avatar_url?: string | null;
  rating?: number; claim_percentage?: number; annual_rate?: number;
  annual_premium?: number; badge?: string; features?: string[];
};

function parse(raw?: string): Plan | null {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// "EFU Insurance" + "Gold Plan" → "EFU Gold Plan"
function planTitle(p: Plan) {
  const first = (p.company_name || 'Plan').split(' ')[0];
  return p.badge ? `${first} ${p.badge}` : p.company_name;
}
// Short column heading: "EFU Gold" / "Adamjee Plat."
function shortTitle(p: Plan) {
  const first = (p.company_name || 'Plan').split(' ')[0];
  const b = (p.badge || '').split(' ')[0];
  if (!b) return first;
  return `${first} ${b.length > 5 ? `${b.slice(0, 4)}.` : b}`;
}
// A plan without a feature list is treated as comprehensive (same as Plan Details)
function covers(p: Plan, feature: string) {
  const list = (p.features || []).map(f => String(f).toLowerCase());
  if (list.length === 0) return true;
  const key = feature.toLowerCase().split(' ')[0];
  return list.some(f => f.includes(key));
}

export default function CompareInsuranceScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const dark = aC.isDark;
  const params = useLocalSearchParams<{ aData?: string; bData?: string; claimId?: string; car_model?: string; market_value?: string }>();
  const a = parse(params.aData);
  const b = parse(params.bData);
  const plans = [a, b].filter(Boolean) as Plan[];
  const [preferred, setPreferred] = useState(0);

  function choosePlan() {
    const p = plans[preferred];
    if (!p) return;
    router.push({
      pathname: '/insurance/plan-details' as any,
      params: {
        planId:   String(p.id),
        claimId:  params.claimId || '',
        company:  p.company_name,
        avatarUrl: p.avatar_url || '',
        rating:   String(p.rating ?? ''),
        claims:   String(p.claim_percentage ?? ''),
        rate:     String(p.annual_rate ?? ''),
        premium:  String(p.annual_premium ?? 0),
        badge:    p.badge || '',
        features: JSON.stringify(p.features || []),
        has_tracker: 'false',
        selected_addons: '[]',
        car_model: params.car_model || '',
        market_value: params.market_value || '',
      },
    });
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={dark ? '#C9C6D0' : '#010a1f'} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: dark ? '#F2F1F5' : '#010a1f' }]}>Compare  Insurance</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Plan cards */}
        <View style={s.cardsRow}>
          {plans.map((p, i) => {
            const logo = resolveUrl(p.avatar_url);
            return (
              <LinearGradient
                key={i}
                colors={dark ? ['#1A3268', '#9FAAC4', '#B07A66'] : ['rgba(3,42,105,0.12)', 'rgba(3,42,105,0.12)']}
                locations={dark ? [0, 0.55, 1] : undefined}
                start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                style={s.planBorder}
              >
                <View style={[s.planCard, { backgroundColor: dark ? '#0B1D4A' : '#ffffff' }]}>
                  {dark && <LinearGradient colors={WARM_CARD_COLORS as any} locations={WARM_CARD_LOCATIONS as any} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                  <View style={s.planLogo}>
                    {logo
                      ? <Image source={{ uri: logo }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                      : <Text style={s.planLogoTxt}>{(p.company_name || 'INS').slice(0, 3).toUpperCase()}</Text>}
                  </View>
                  <Text style={[s.planName, { color: dark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={1}>{planTitle(p)}</Text>
                  <Text style={[s.planPrice, { color: dark ? '#E6E4EA' : '#475569' }]}>Annual PKR {Number(p.annual_premium || 0).toLocaleString()}</Text>
                </View>
              </LinearGradient>
            );
          })}
          {plans.length === 2 && <View style={s.vsWrap} pointerEvents="none"><Text style={s.vsTxt}>VS</Text></View>}
        </View>

        {/* Coverage Overview */}
        <Text style={[s.sectionTitle, { color: dark ? '#F2F1F5' : '#010a1f' }]}>Coverage Overview</Text>
        <View style={s.tableRow}>
          <Text style={[s.featCol, s.headTxt, { color: dark ? '#F2F1F5' : '#010a1f' }]}>Feature</Text>
          {plans.map((p, i) => (
            <Text key={i} style={[s.valCol, s.headTxt, { color: dark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={1}>{shortTitle(p)}</Text>
          ))}
        </View>
        {COVERAGE.map(f => (
          <View key={f} style={s.tableRow}>
            <Text style={[s.featCol, s.featTxt, { color: dark ? '#F2F1F5' : '#010a1f' }]}>{f}</Text>
            {plans.map((p, i) => (
              <View key={i} style={s.valCol}>
                {covers(p, f)
                  ? <View style={[s.mark, { backgroundColor: ORANGE }]}><Ionicons name="checkmark" size={12} color="#1A0E08" /></View>
                  : <View style={[s.mark, { backgroundColor: '#E5132F' }]}><Ionicons name="close" size={12} color="#2A0508" /></View>}
              </View>
            ))}
          </View>
        ))}
        <View style={[s.divider, { backgroundColor: dark ? 'rgba(126,159,214,0.35)' : 'rgba(3,42,105,0.1)' }]} />

        {/* Claim Process */}
        <Text style={[s.sectionTitle, { color: dark ? '#F2F1F5' : '#010a1f' }]}>Claim Process</Text>
        {CLAIM_STEPS.map((step, i) => (
          <View key={step} style={s.claimRow}>
            <View style={[s.stepCircle, { backgroundColor: dark ? '#0B1D4A' : '#032a69' }]}>
              <Text style={s.stepNum}>{i + 1}</Text>
            </View>
            <Text style={[s.stepTxt, { color: dark ? '#F2F1F5' : '#010a1f' }]}>{step}</Text>
          </View>
        ))}

        {/* Select Preferred Insurance */}
        <Text style={[s.prefTitle, { color: dark ? '#F2F1F5' : '#010a1f' }]}>Select Preferred Insurance</Text>
        {plans.map((p, i) => {
          const sel = preferred === i;
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.85}
              onPress={() => setPreferred(i)}
              style={[s.prefCard, dark
                ? (sel
                    ? { backgroundColor: '#010A1F', borderColor: '#82a5d5', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 }
                    : { backgroundColor: '#0B1D4A', borderColor: 'transparent' })
                : { backgroundColor: '#ffffff', borderColor: sel ? ORANGE : 'rgba(3,42,105,0.12)' }]}
            >
              {sel && dark && <SavedCardEffect />}
              <View style={{ flex: 1 }}>
                <Text style={[s.prefName, { color: dark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={1}>{planTitle(p)}</Text>
                <Text style={s.prefPrice}>Annual PKR {Number(p.annual_premium || 0).toLocaleString()}</Text>
              </View>
              <View style={[s.radioOuter, sel && s.radioOuterOn]}>
                {sel && <View style={s.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Continue with the preferred plan */}
        {plans.length > 0 && (
          <TouchableOpacity style={s.selectBtn} activeOpacity={0.88} onPress={choosePlan}>
            <LinearGradient colors={(aC.isDark ? PRIMARY_BTN_COLORS : ['#27467F', '#8C6A78', '#FF9654']) as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Text style={s.selectTxt}>Select Plan</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 60 },
  backBtn:     { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontFamily: 'Poppins_500Medium' },
  scroll: { paddingHorizontal: 14, paddingTop: 6 },

  cardsRow:  { flexDirection: 'row', gap: 26, paddingHorizontal: 10, position: 'relative' },
  planBorder:{ flex: 1, borderRadius: 12, padding: 1 },
  planCard:  { borderRadius: 11, alignItems: 'center', paddingTop: 14, paddingBottom: 16, paddingHorizontal: 6, overflow: 'hidden' },
  planLogo:  { width: 64, height: 64, borderRadius: 32, backgroundColor: '#12306A', borderWidth: 1, borderColor: '#8FAEE3', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8 },
  planLogoTxt:{ color: '#F2F1F5', fontSize: 16, fontFamily: 'Poppins_500Medium' },
  planName:  { fontSize: 13, fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  planPrice: { fontSize: 11.5, fontFamily: 'Poppins_400Regular', marginTop: 8, textAlign: 'center' },
  vsWrap:    { position: 'absolute', left: 0, right: 0, top: 58, alignItems: 'center' },
  vsTxt:     { color: '#E2671B', fontSize: 14, fontFamily: 'Poppins_500Medium' },

  sectionTitle: { fontSize: 16, fontFamily: 'Poppins_500Medium', marginTop: 24, marginBottom: 10 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  featCol:  { flex: 1.5, paddingRight: 6 },
  valCol:   { flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  headTxt:  { fontSize: 11.5, fontFamily: 'Poppins_400Regular' },
  featTxt:  { fontSize: 13.5, fontFamily: 'Poppins_400Regular' },
  mark:     { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  divider:  { height: 1, marginTop: 10 },

  claimRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  stepCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  stepNum:    { color: '#F2F1F5', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  stepTxt:    { fontSize: 12.5, fontFamily: 'Poppins_500Medium', flex: 1 },

  prefTitle: { fontSize: 14, fontFamily: 'Poppins_500Medium', marginTop: 16, marginBottom: 12 },
  prefCard:  { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12, overflow: 'hidden' },
  prefName:  { fontSize: 13.5, fontFamily: 'Poppins_500Medium' },
  prefPrice: { color: ORANGE, fontSize: 13.5, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },
  radioOuter:  { width: 20, height: 20, borderRadius: 10, borderWidth: 1.2, borderColor: 'rgba(220,230,247,0.7)', alignItems: 'center', justifyContent: 'center' },
  radioOuterOn:{ borderWidth: 2, borderColor: '#DCE6F7', backgroundColor: '#12306A', shadowColor: '#8FAEE3', shadowOpacity: 0.8, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  radioInner:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ffffff' },

  selectBtn: { height: 48, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  selectTxt: { color: '#EDEBF0', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
