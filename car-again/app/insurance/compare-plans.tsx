import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Modal, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Share2, Heart, Star, ShieldCheck } from 'lucide-react-native';
import { AppColors, useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PRIMARY_BTN_COLORS, RingGlow, SavedCardEffect } from '@/components/shared/FigmaEffects';

const ORANGE = '#e2671b';
const NAVY   = '#032a69';
const C      = AppColors;
const SERVER = API_BASE.replace('/api/v1','');
function resolveUrl(url?:string|null){ if(!url) return ''; if(url.startsWith('http')) return url; return `${SERVER}${url}`; }

const ADDONS = [
  { name: 'SMS ignition On',                      price: 5500 },
  { name: 'SMS ignition Off',                     price: 5500 },
  { name: 'Vehicle Analytics',                    price: 5500 },
  { name: 'Over Speeding Alerts on SMS',          price: 3000 },
  { name: 'Battery Alerts on SMS',                price: 1000 },
  { name: 'Geo-fencing - No Go Areas on SMS',     price: 2000 },
];

function AddonsModal({ visible, onClose, plan, claimId }: { visible: boolean; onClose: () => void; plan: any; claimId?: string }) {
  const aC = useAppColors();
  const router = useRouter();
  const search = useLocalSearchParams<{ brand?: string; model?: string; year?: string; market_value?: string }>();
  const [selected, setSelected] = useState<number[]>([]);

  function toggleAddon(i: number) {
    setSelected(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  }

  const addonTotal = selected.reduce((sum, i) => sum + ADDONS[i].price, 0);
  const total = (plan?.annual_premium || 0) + addonTotal;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={[m.card, { backgroundColor: aC.isDark ? '#020B20' : '#ffffff', borderColor: aC.isDark ? '#8D96A8' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 8 }]}>
          <View style={[m.header, { backgroundColor: aC.isDark ? '#09265E' : '#ffffff', borderWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
            <Text style={[m.title, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Addons</Text>
            <TouchableOpacity onPress={onClose}><Text style={[m.close, { color: aC.isDark ? '#BFC5D1' : '#64748b' }]}>×</Text></TouchableOpacity>
          </View>

          <View style={m.addonsContainer}>
            {ADDONS.map((addon, index) => {
              const isSelected = selected.includes(index);
              return (
                <TouchableOpacity key={index} style={[m.addonRow, { borderColor: aC.isDark ? '#26334D' : 'rgba(3,42,105,0.12)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]} onPress={() => toggleAddon(index)} activeOpacity={0.8}>
                  <View style={[m.radioOuter, { borderColor: aC.isDark ? '#52617A' : 'rgba(3,42,105,0.18)', backgroundColor: aC.isDark ? '#102E63' : '#ffffff' }, isSelected && m.radioSelected, isSelected && { borderColor: '#5B8EDB' }]}>
                    {isSelected && <View style={m.radioInner} />}
                  </View>
                  <Text style={[m.addonText, { color: aC.isDark ? '#A8AAB8' : '#475569' }]}>{addon.name} [+Rs{addon.price.toLocaleString()}]</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={m.priceRow}>
            <Text style={[m.priceLabel, { color: aC.isDark ? '#B6B4C0' : '#475569' }]}>Product Price Rs{Number(plan?.annual_premium || 0).toLocaleString()} x 1</Text>
            <Text style={[m.priceValue, { color: aC.isDark ? '#B6B4C0' : '#475569' }]}>Rs{Number(plan?.annual_premium || 0).toLocaleString()}</Text>
          </View>
          <View style={[m.divider, { backgroundColor: aC.isDark ? '#18243A' : 'rgba(3,42,105,0.12)' }]} />
          <View style={m.totalRow}>
            <Text style={[m.totalLabel, { color: aC.isDark ? '#C7C3CE' : '#010a1f' }]}>Total</Text>
            <Text style={[m.totalValue, { color: aC.isDark ? '#C7C3CE' : '#010a1f' }]}>Rs{total.toLocaleString()}</Text>
          </View>
          <View style={[m.divider, { backgroundColor: aC.isDark ? '#18243A' : 'rgba(3,42,105,0.12)' }]} />

          <TouchableOpacity style={m.addButton} activeOpacity={0.85} onPress={() => {
            onClose();
            const hasTracker = selected.some(i => /tracker|sms|ignition|geo|analytics|speeding|battery/i.test(ADDONS[i].name));
            const selectedNames = selected.map(i => ADDONS[i].name);
            router.push({
              pathname: '/insurance/plan-details' as any,
              params: {
                planId:   plan?.id,
                claimId:  claimId || '',
                company:  plan?.company_name,
                avatarUrl: plan?.avatar_url || '',
                rating:   String(plan?.rating),
                claims:   String(plan?.claim_percentage),
                rate:     String(plan?.annual_rate),
                premium:  String(total),
                badge:    plan?.badge || '',
                features: JSON.stringify(plan?.features || []),
                has_tracker: String(hasTracker),
                selected_addons: JSON.stringify(selectedNames),
                car_model: [search.year, search.brand, search.model].filter(Boolean).join(' '),
                market_value: search.market_value || '',
              },
            });
          }}>
            <LinearGradient colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Text style={m.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card:            { width: '100%', maxWidth: 360, backgroundColor: '#020B20', borderWidth: 1, borderColor: '#8D96A8', borderRadius: 20, padding: 14 },
  header:          { height: 56, backgroundColor: '#09265E', borderRadius: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  title:           { color: '#fff', fontSize: 17, fontFamily: 'Poppins_400Regular' },
  close:           { color: '#BFC5D1', fontSize: 32, lineHeight: 36 },
  addonsContainer: { gap: 12 },
  addonRow:        { height: 38, borderWidth: 1, borderColor: '#26334D', borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  radioOuter:      { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#52617A', backgroundColor: '#102E63', justifyContent: 'center', alignItems: 'center', marginRight: 8, flexShrink: 0 },
  radioSelected:   { borderColor: '#5B8EDB' },
  radioInner:      { width: 10, height: 10, borderRadius: 5, backgroundColor: '#416CA8' },
  addonText:       { color: '#A8AAB8', fontSize: 11, fontFamily: 'Poppins_400Regular', flex: 1 },
  priceRow:        { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingHorizontal: 4 },
  priceLabel:      { color: '#B6B4C0', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  priceValue:      { color: '#B6B4C0', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  divider:         { height: 1, backgroundColor: '#18243A', marginVertical: 12 },
  totalRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  totalLabel:      { color: '#C7C3CE', fontSize: 14, fontFamily: 'Poppins_700Bold' },
  totalValue:      { color: '#C7C3CE', fontSize: 14, fontFamily: 'Poppins_700Bold' },
  addButton:       { height: 48, borderRadius: 28, marginHorizontal: 11, marginBottom: 4, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  addButtonText:   { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },
});

const FILTERS = [
  { key: 'lowest_premium',  label: 'Lowest Premium'  },
  { key: 'best_coverage',   label: 'Best Coverage'    },
  { key: 'highest_rating',  label: 'Highest Rated'    },
];

function GlassInset() {
  const aC = useAppColors();
  if (!aC.isDark) {
    return (
      <>
        <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      </>
    );
  }
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

export default function ComparePlansScreen() {
  const aC = useAppColors();
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ claimId: string; brand?: string; model?: string; year?: string; market_value?: string }>();
  const { claimId } = searchParams;
  const [sortBy,      setSortBy]      = useState('lowest_premium');
  const [liked,       setLiked]       = useState<Record<string, boolean>>({});
  const [plans,       setPlans]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [showAddons,  setShowAddons]  = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  // "Add Tracker" toggle per plan (Figma) — on by default
  const [trackerOff,  setTrackerOff]  = useState<Record<string, boolean>>({});
  // Plans picked for comparison (max 2 — picking a 3rd replaces the oldest)
  const [compareIds,  setCompareIds]  = useState<string[]>([]);
  const canCompare = compareIds.length === 2;

  function toggleCompare(id: string) {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]);
  }

  // Select Plan → straight to plan details (addons now open from "Add Tracker")
  function selectPlan(plan: any) {
    router.push({
      pathname: '/insurance/plan-details' as any,
      params: {
        planId:   plan?.id,
        claimId:  claimId || '',
        company:  plan?.company_name,
        avatarUrl: plan?.avatar_url || '',
        rating:   String(plan?.rating),
        claims:   String(plan?.claim_percentage),
        rate:     String(plan?.annual_rate),
        premium:  String(plan?.annual_premium || 0),
        badge:    plan?.badge || '',
        features: JSON.stringify(plan?.features || []),
        has_tracker: 'false',
        selected_addons: JSON.stringify([]),
        car_model: [searchParams.year, searchParams.brand, searchParams.model].filter(Boolean).join(' '),
        market_value: searchParams.market_value || '',
      },
    });
  }

  function openCompare() {
    if (!canCompare) return;
    const [a, b] = compareIds.map(id => plans.find(pl => String(pl.id) === id)).filter(Boolean);
    if (!a || !b) return;
    router.push({
      pathname: '/insurance/compare-insurance' as any,
      params: {
        aData: JSON.stringify(a),
        bData: JSON.stringify(b),
        claimId: claimId || '',
        car_model: [searchParams.year, searchParams.brand, searchParams.model].filter(Boolean).join(' '),
        market_value: searchParams.market_value || '',
      },
    });
  }

  useEffect(() => { load(); }, [sortBy]);

  async function load() {
    setLoading(true);
    try {
      const [provRes, planRes] = await Promise.all([
        fetch(`${API_BASE}/sellers?role=insurance_provider&limit=50`),
        fetch(`${API_BASE}/insurance/plans?sort_by=${sortBy}`),
      ]);
      const providers: any[] = provRes.ok ? await provRes.json() : [];
      const planList: any[]  = planRes.ok  ? await planRes.json()  : [];

      if (providers.length > 0) {
        // Match provider with plan by name, or assign default plan
        const merged = providers.map((prov: any, idx: number) => {
          const matched = planList.find((pl: any) =>
            pl.company_name?.toLowerCase().includes(prov.full_name?.split(' ')[0]?.toLowerCase())
          ) || planList[idx % planList.length] || {};
          return {
            id:               prov.id,
            company_name:     prov.full_name,
            avatar_url:       prov.avatar_url || prov.avatar || null,
            rating:           matched.rating           ?? 4.5,
            claim_percentage: matched.claim_percentage ?? 90,
            annual_rate:      matched.annual_rate      ?? 1.25,
            annual_premium:   matched.annual_premium   ?? 83344,
            badge:            matched.badge            ?? '',
            features:         matched.features         ?? [],
          };
        });
        setPlans(merged);
      } else {
        // Fallback to plan data if no providers registered
        setPlans(planList);
      }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  function toggleLike(id: string) { setLiked(p => ({ ...p, [id]: !p[id] })); }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>

      {/* HEADER */}
      <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={26} color={aC.isDark ? '#C9C6D0' : '#010a1f'} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>All Insurance Plans</Text>
        <TouchableOpacity style={s.compareBtn} activeOpacity={0.8} disabled={!canCompare} onPress={openCompare}>
          <MaterialCommunityIcons name="compare-horizontal" size={20} color={canCompare ? ORANGE : '#B4552A'} />
          <Text style={[s.compareTxt, canCompare && { color: ORANGE, fontFamily: 'Poppins_600SemiBold' }]}>Compare</Text>
        </TouchableOpacity>
      </View>

      <AddonsModal visible={showAddons} onClose={() => setShowAddons(false)} plan={selectedPlan} claimId={claimId} />

      {/* FILTER PILLS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.filtersRow, { backgroundColor: aC.bg }]} style={{ flexGrow: 0, backgroundColor: aC.bg }}>
        {FILTERS.map(f => {
          const active = sortBy === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                s.filterPill,
                aC.isDark
                  ? (active ? { backgroundColor: '#0A1838', borderColor: '#7E9FD6' } : { backgroundColor: '#0B1D4A', borderColor: 'transparent' })
                  : { backgroundColor: active ? 'rgba(226,103,27,0.10)' : '#ffffff', borderColor: active ? ORANGE : 'rgba(3,42,105,0.12)' },
              ]}
              onPress={() => setSortBy(f.key)} activeOpacity={0.8}
            >
              {active && aC.isDark && <RingGlow radius={14} peak={0.5} rings={8} />}
              <Text style={[s.filterTxt, { color: active ? ORANGE : (aC.isDark ? '#F2F1F5' : '#475569') }, active && { fontFamily: 'Poppins_600SemiBold' }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={[s.pickTxt, { color: aC.isDark ? '#E6E4EA' : '#334155' }]}>Select Any 2 Plans to Compare</Text>

      {/* PLAN CARDS */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: aC.bg }}>
          <ActivityIndicator color={ORANGE} size="large" />
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: aC.bg }}
          contentContainerStyle={[s.list, { backgroundColor: aC.bg }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80, gap: 10 }}>
              <ShieldCheck size={40} color={aC.isDark ? C.textSecondary : '#64748b'} />
              <Text style={{ color: aC.isDark ? C.textSecondary : '#64748b', fontSize: 14, fontFamily: 'Poppins_400Regular' }}>No insurance plans found</Text>
            </View>
          }
          renderItem={({ item: p }) => {
            const initials = p.company_name.slice(0, 3).toUpperCase();
            const rating   = p.rating ? Number(p.rating).toFixed(1) : '—';
            const tracker  = !trackerOff[String(p.id)];
            const picked   = compareIds.includes(String(p.id));
            return (
              <View style={[s.card, aC.isDark ? { backgroundColor: '#010A1F', borderColor: '#82a5d5', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 } : { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)', shadowColor: 'rgba(3,42,105,0.12)', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 }]}>
                {aC.isDark ? <SavedCardEffect /> : <GlassInset />}

                {/* Top row */}
                <View style={s.cardTop}>
                  <TouchableOpacity style={s.providerLeft} onPress={() => router.push({ pathname: '/insurance/company-profile' as any, params: { id: String(p.id), company: p.company_name, rating: String(p.rating), claims: `Claim ${p.claim_percentage}%` } })} activeOpacity={0.8}>
                    {p.avatar_url ? (
                      <Image source={{ uri: resolveUrl(p.avatar_url) }} style={[s.avatar, { overflow: 'hidden' }]} />
                    ) : (
                      <View style={s.avatar}>
                        <Text style={s.avatarTxt}>{initials}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[s.providerName, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={1}>{p.company_name}</Text>
                      <View style={s.ratingRow}>
                        <Ionicons name="star" size={18} color={ORANGE} />
                        <Text style={[s.providerTagline, { color: aC.isDark ? '#BAB6C4' : '#475569' }]} numberOfLines={1}>{rating} · Claim {p.claim_percentage}%</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    {/* Select for comparison */}
                    <TouchableOpacity onPress={() => toggleCompare(String(p.id))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <View style={[s.radioOuter, picked && s.radioOuterOn]}>
                        {picked ? <View style={s.radioInner} /> : <View style={s.radioRing} />}
                      </View>
                    </TouchableOpacity>
                    <View style={s.iconRow}>
                      <TouchableOpacity><Ionicons name="share-social-outline" size={19} color={ORANGE} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => toggleLike(String(p.id))}>
                        <Ionicons name={liked[String(p.id)] ? 'heart' : 'heart-outline'} size={20} color={ORANGE} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Rate / Total */}
                <View style={[s.infoRow, s.infoBorder]}>
                  <Text style={[s.infoLabel, { color: aC.isDark ? '#E6E4EA' : '#334155' }]}>Rate</Text>
                  <Text style={[s.infoVal, { color: aC.isDark ? '#E6E4EA' : '#010a1f' }]}>{p.annual_rate}</Text>
                </View>
                <View style={[s.infoRow, s.infoBorder]}>
                  <Text style={[s.infoLabel, { color: aC.isDark ? '#E6E4EA' : '#334155' }]}>Total</Text>
                  <Text style={[s.infoVal, { color: aC.isDark ? '#E6E4EA' : '#010a1f' }]}>PKR {Number(p.annual_premium).toLocaleString()}/ Year</Text>
                </View>

                {/* Add Tracker */}
                <TouchableOpacity style={s.trackerRow} activeOpacity={0.8} onPress={() => { setSelectedPlan(p); setShowAddons(true); }}>
                  <Text style={[s.trackerTxt, { color: aC.isDark ? '#E6E4EA' : '#334155' }]}>Add Tracker PKR 9,000  per Year</Text>
                  <View style={[s.radioOuter, tracker && s.radioOuterOn]}>
                    {tracker && <View style={s.radioInner} />}
                  </View>
                </TouchableOpacity>

                {/* Select Plan Button */}
                <TouchableOpacity style={s.selectBtn} activeOpacity={0.85} onPress={() => selectPlan(p)}>
                  <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                  <Text style={s.selectTxt}>Select Plan</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, height: 56 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 17, fontFamily: 'Poppins_500Medium' },
  compareBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compareTxt:  { color: '#6E6A7A', fontSize: 12.5, fontFamily: 'Poppins_400Regular' },

  filtersRow:  { paddingHorizontal: 14, gap: 10, paddingBottom: 4 },
  filterPill:  { height: 42, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  filterTxt:   { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  pickTxt:     { fontSize: 13, fontFamily: 'Poppins_400Regular', paddingHorizontal: 22, marginTop: 2, marginBottom: 8 },

  list: { paddingHorizontal: 14, paddingBottom: 40, gap: 16 },
  card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14, overflow: 'hidden' },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  providerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar:        { width: 40, height: 40, borderRadius: 20, backgroundColor: '#12306A', borderWidth: 1, borderColor: '#8FAEE3', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:     { color: '#F2F1F5', fontSize: 11, fontFamily: 'Poppins_500Medium' },
  providerName:  { fontSize: 16, fontFamily: 'Poppins_500Medium' },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  providerTagline:{ fontSize: 12, fontFamily: 'Poppins_400Regular' },
  iconRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },

  infoRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)' },
  infoLabel:  { fontSize: 11.5, fontFamily: 'Poppins_400Regular' },
  infoVal:    { fontSize: 11.5, fontFamily: 'Poppins_400Regular' },

  trackerRow:  { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 10 },
  trackerTxt:  { fontSize: 11.5, fontFamily: 'Poppins_400Regular' },
  radioOuter:  { width: 20, height: 20, borderRadius: 10, borderWidth: 1.2, borderColor: 'rgba(220,230,247,0.6)', backgroundColor: '#12306A', alignItems: 'center', justifyContent: 'center' },
  radioOuterOn:{ borderWidth: 2, borderColor: '#DCE6F7', shadowColor: '#8FAEE3', shadowOpacity: 0.8, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  radioInner:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ffffff' },
  radioRing:   { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(220,230,247,0.6)' },

  selectBtn:  { height: 40, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  selectTxt:  { color: '#EDEBF0', fontSize: 13, fontFamily: 'Poppins_500Medium' },
});
