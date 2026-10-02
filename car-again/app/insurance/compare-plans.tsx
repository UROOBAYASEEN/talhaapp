import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Modal, ActivityIndicator, RefreshControl, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Share2, Heart, Star, ShieldCheck, ArrowLeftRight } from 'lucide-react-native';
import { AppColors, useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';

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
  const { claimId } = useLocalSearchParams<{ claimId: string }>();
  const [sortBy,      setSortBy]      = useState('lowest_premium');
  const [liked,       setLiked]       = useState<Record<string, boolean>>({});
  const [plans,       setPlans]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [showAddons,  setShowAddons]  = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

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
      <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={aC.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: aC.textPrimary }]}>Compare Insurance Plans</Text>
        <TouchableOpacity
          onPress={() => {
            const picked = plans.filter(p => liked[String(p.id)]).slice(0, 2);
            if (picked.length < 2) {
              Alert.alert('Select Plans', 'Please like at least 2 plans to compare.');
              return;
            }
            router.push({
              pathname: '/insurance/compare-detail' as any,
              params: { aData: JSON.stringify(picked[0]), bData: JSON.stringify(picked[1]) },
            });
          }}
          style={s.compareBtn}
          activeOpacity={0.7}
        >
          <ArrowLeftRight size={13} color="#e2671b" />
          <Text style={[s.compareTxt, { color: '#e2671b' }]}>Compare</Text>
        </TouchableOpacity>
      </View>

      <AddonsModal visible={showAddons} onClose={() => setShowAddons(false)} plan={selectedPlan} claimId={claimId} />

      {/* FILTER PILLS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.filtersRow, { backgroundColor: aC.bg }]} style={{ flexGrow: 0, backgroundColor: aC.bg }}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[
              s.filterPill,
              { backgroundColor: aC.isDark ? C.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 },
              sortBy === f.key && { borderColor: ORANGE, backgroundColor: aC.isDark ? C.glassBg : 'rgba(226,103,27,0.10)' },
            ]}
            onPress={() => setSortBy(f.key)} activeOpacity={0.8}
          >
            <Text style={[s.filterTxt, { color: sortBy === f.key ? ORANGE : (aC.isDark ? C.textSecondary : '#475569') }, sortBy === f.key && { fontFamily: 'Poppins_500Medium' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
            const rating   = p.rating ? p.rating.toFixed(1) : '—';
            return (
              <View style={[s.card, { backgroundColor: aC.isDark ? 'rgba(1,6,20,1)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
                <GlassInset />

                {/* Top row */}
                <View style={s.cardTop}>
                  <TouchableOpacity style={s.providerLeft} onPress={() => router.push({ pathname: '/insurance/company-profile' as any, params: { id: String(p.id), company: p.company_name, rating: String(p.rating), claims: `Claim ${p.claim_percentage}%` } })} activeOpacity={0.8}>
                    {p.avatar_url ? (
                      <Image source={{ uri: resolveUrl(p.avatar_url) }} style={[s.avatar, { overflow:'hidden', backgroundColor: aC.isDark ? 'rgba(19,34,66,1)' : '#eef2ff', borderColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)' }]} />
                    ) : (
                      <View style={[s.avatar, { backgroundColor: aC.isDark ? 'rgba(19,34,66,1)' : '#eef2ff', borderColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)' }]}>
                        <Text style={[s.avatarTxt, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>{initials}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[s.providerName, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>{p.company_name}</Text>
                      <Text style={[s.providerTagline, { color: aC.isDark ? C.textSecondary : '#475569' }]} numberOfLines={1}>
                        {p.badge || `Claim ${p.claim_percentage}% • Rate ${p.annual_rate}%`}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={s.cardRight}>
                    <View style={s.iconRow}>
                      <TouchableOpacity><Share2 size={16} color={aC.isDark ? C.textSecondary : '#64748b'} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => toggleLike(String(p.id))}>
                        <Heart size={16} color={ORANGE} fill={liked[String(p.id)] ? ORANGE : 'transparent'} />
                      </TouchableOpacity>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[s.yearlyLabel, { color: aC.isDark ? C.textSecondary : '#64748b' }]}>Annual</Text>
                      <Text style={s.price}>PKR {Number(p.annual_premium).toLocaleString()}</Text>
                    </View>
                  </View>
                </View>

                {/* Rating */}
                <View style={s.ratingRow}>
                  <Star size={14} color={ORANGE} fill={ORANGE} />
                  <Text style={[s.ratingTxt, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>{rating}</Text>
                </View>

                {/* Stats */}
                <View style={s.statsRow}>
                  <View style={s.statItem}>
                    <Text style={[s.statLabel, { color: aC.isDark ? C.textSecondary : '#64748b' }]}>Annual Rate</Text>
                    <Text style={[s.statValue, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>{p.annual_rate}%</Text>
                  </View>
                  <View style={[s.statDiv, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)' }]} />
                  <View style={s.statItem}>
                    <Text style={[s.statLabel, { color: aC.isDark ? C.textSecondary : '#64748b' }]}>Claim Rate</Text>
                    <Text style={[s.statValue, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>{p.claim_percentage}%</Text>
                  </View>
                  <View style={[s.statDiv, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)' }]} />
                  <View style={s.statItem}>
                    <Text style={[s.statLabel, { color: aC.isDark ? C.textSecondary : '#64748b' }]}>Coverage</Text>
                    <Text style={[s.statValue, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>{p.features?.length || 0} Types</Text>
                  </View>
                </View>

                {/* Select Plan Button */}
                <TouchableOpacity style={s.selectBtn} activeOpacity={0.85} onPress={() => { setSelectedPlan(p); setShowAddons(true); }}>
                  <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 56 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  compareBtn:  { minWidth: 36, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  compareTxt:  { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  headerTitle: { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', flex: 1, textAlign: 'center' },
  filtersRow:      { paddingHorizontal: 20, gap: 10, paddingBottom: 16 },
  filterPill:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: C.glassBg },
  filterPillActive:{ borderColor: ORANGE, backgroundColor: C.glassBg },
  filterTxt:       { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  filterTxtActive: { color: ORANGE, fontFamily: 'Poppins_500Medium' },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', backgroundColor: 'rgba(1,6,20,1)', padding: 16, overflow: 'hidden' },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  providerLeft:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  avatar:        { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(19,34,66,1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:     { color: C.textPrimary, fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  providerName:  { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  providerTagline:{ color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  cardRight:   { alignItems: 'flex-end', gap: 8, flexShrink: 0 },
  iconRow:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  yearlyLabel: { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  price:       { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  ratingTxt: { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  statsRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statItem:   { flex: 1 },
  statLabel:  { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular', marginBottom: 4 },
  statValue:  { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  statDiv:    { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 8 },
  selectBtn:  { height: 48, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  selectTxt:  { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});
