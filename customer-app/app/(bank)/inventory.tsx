import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, Image,
  TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Search, Car, FileText } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { D, DHeader, FilterPills, GlowCard, SearchBar } from '@/components/dealer/DealerUI';
import { useTabBarSpace } from '@/components/shared/PillTabBar';

const ORANGE = '#e2671b';
const BG     = '#010A1F';
const SERVER = API_BASE.replace('/api/v1', '');

function resolveUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}

const FILTERS = ['All', 'New', 'Approved', 'Under Review'] as const;

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

function fmt(v: number) {
  if (!v || isNaN(v)) return '—';
  if (v >= 10_000_000) return `PKR ${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000)    return `PKR ${(v / 100_000).toFixed(1)}L`;
  return `PKR ${v.toLocaleString('en-PK')}`;
}

function statusMeta(s: string) {
  if (s === 'approved')  return { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' };
  if (s === 'rejected')  return { bg: 'rgba(248,113,113,0.15)', color: '#f87171' };
  if (s === 'reviewing') return { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa' };
  return { bg: 'rgba(226,103,27,0.15)', color: ORANGE };
}

export default function InventoryScreen() {
  const tabSpace = useTabBarSpace(120);
  const router      = useRouter();
  const { token }   = useAuth();
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>('All');
  const [search,       setSearch]       = useState('');
  const [cases,        setCases]        = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [updating,     setUpdating]     = useState<string | null>(null);

  const filterMap: Record<string, string> = {
    'New':          'submitted',
    'Approved':     'approved',
    'Under Review': 'reviewing',
  };

  const fetchCases = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    try {
      const statusParam = filterMap[activeFilter];
      const q = statusParam ? `?status=${statusParam}` : '';
      const res = await fetch(`${API_BASE}/financing/bank/applications${q}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        // API returns array directly
        setCases(Array.isArray(data) ? data : []);
      } else {
        const txt = await res.text();
        console.log('inventory fetch failed', res.status, txt);
        setCases([]);
        if (res.status === 401) Alert.alert('Session expired', 'Please login again');
      }
    } catch (e) {
      console.log('inventory fetch error', e);
      setCases([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, token]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  async function updateStatus(id: string, status: 'approved' | 'rejected' | 'reviewing') {
    setUpdating(id);
    try {
      const res = await fetch(`${API_BASE}/financing/bank/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        Alert.alert('Success', `Case ${status} successfully`);
        fetchCases();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.detail || `Could not update to ${status}`);
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setUpdating(null);
    }
  }

  function handleApprove(id: string) {
    Alert.alert('Approve', 'Approve this financing case?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => updateStatus(id, 'approved') },
    ]);
  }

  function handleReject(id: string) {
    Alert.alert('Reject', 'Reject this financing case?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => updateStatus(id, 'rejected') },
    ]);
  }

  const filtered = cases.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const hay = [
      c.vehicle, c.customer, c.full_name, c.reference_no, c.city, c.brand, c.car_model, c.variant,
    ].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });

  const renderEmpty = () => {
    if (loading) return <ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} size="large" />;
    if (filtered.length === 0 && cases.length > 0 && search.trim()) {
      return (
        <View style={s.emptyBox}>
          <Search size={36} color="rgba(255,255,255,0.2)" />
          <Text style={s.emptyTitle}>No matching cases</Text>
          <Text style={s.emptySub}>Try a different search term</Text>
        </View>
      );
    }
    return (
      <View style={s.emptyBox}>
        <FileText size={40} color="rgba(255,255,255,0.15)" />
        <Text style={s.emptyTitle}>{activeFilter === 'All' ? 'No financing cases yet' : `No ${activeFilter} cases`}</Text>
        <Text style={s.emptySub}>
          {activeFilter === 'All'
            ? 'When customers submit financing applications, they will appear here.'
            : `No cases with status "${filterMap[activeFilter] || activeFilter}" found.`}
        </Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => fetchCases()}>
          <Text style={s.retryTxt}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCases(true)} tintColor={ORANGE} colors={[ORANGE]} />}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={<>

          {/* ── HEADER ── */}
          <View style={{ marginHorizontal: -16 }}>
            <DHeader title="Partner Management" center />
          </View>
          <Text style={s.subHeading}>Financing cases — {filtered.length} {filtered.length === 1 ? 'case' : 'cases'}</Text>

          {/* ── SEARCH ── */}
          <View style={s.searchRow}>
            <SearchBar
              placeholder="Search"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSort={() => {}}
            />
          </View>

          {/* ── FILTER PILLS (inventory menu effect) ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillsRow} style={{ marginHorizontal: -16 }}>
            <FilterPills items={FILTERS} value={activeFilter} onChange={setActiveFilter} style={{ flexWrap: 'nowrap', gap: 10 }} />
          </ScrollView>
        </>}

        renderItem={({ item }) => {
          const meta = statusMeta(item.status);
          const vehicleLabel = item.vehicle || [item.brand, item.car_model, item.variant].filter(Boolean).join(' ') || 'Vehicle';
          const displayInitial = (item.brand || item.vehicle || item.customer || 'V').charAt(0).toUpperCase();
          const rawImg = item.vehicle_image || item.image || item.images?.[0] || null;
          const imgUri = resolveUrl(rawImg) || rawImg;
          return (
            <GlowCard style={s.card} radius={20}
              onPress={() => router.push({ pathname: '/bank-case-detail', params: { id: item.id } } as any)}>
              <View style={s.cardTop}>
                <View style={s.carImg}>
                  {imgUri ? (
                    <Image source={{ uri: imgUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                  ) : (
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#061B4A', alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ color: ORANGE, fontSize: 22, fontFamily: 'Poppins_700Bold' }}>{displayInitial}</Text>
                      <Car size={14} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', bottom: 8 }} />
                    </View>
                  )}
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardTitle} numberOfLines={2}>{vehicleLabel}</Text>
                  {/* Status badge hidden for now (Figma)
                  <View style={[s.statusBadge, { backgroundColor: meta.bg, borderColor: meta.color + '30', borderWidth: 1 }]}>
                    <Text style={[s.statusTxt, { color: meta.color }]}>{item.status}</Text>
                  </View> */}
                  <Text style={s.cardMeta} numberOfLines={1}>Customer: {item.customer || item.full_name || '—'}</Text>
                  <Text style={s.cardMeta} numberOfLines={1}>Case ID: {item.reference_no || '—'}</Text>
                  <View style={s.priceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.priceLabel}>PRICE</Text>
                      <Text style={s.priceValue}>{fmt(item.vehicle_price || item.loan_amount)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.priceLabel}>MONTHLY</Text>
                      <Text style={s.priceValue}>{fmt(item.monthly_installment)}</Text>
                    </View>
                    {/* Tenure hidden for now
                    <View>
                      <Text style={s.priceLabel}>TENURE</Text>
                      <Text style={s.priceValue}>{item.tenure_years ? `${item.tenure_years}Y` : '—'}</Text>
                    </View> */}
                  </View>
                </View>
              </View>

              {(item.status === 'submitted' || item.status === 'reviewing') ? (
                <View style={s.btnRow}>
                  <TouchableOpacity style={[s.actionBtn, s.approveBtn]} disabled={updating === item.id} onPress={() => handleApprove(item.id)}>
                    {updating === item.id ? <ActivityIndicator color="#22C55E" size="small" /> : <Text style={[s.actionText, { color: '#22C55E' }]}>Approve</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, s.rejectBtn]} disabled={updating === item.id} onPress={() => handleReject(item.id)}>
                    {updating === item.id ? <ActivityIndicator color="#EF4444" size="small" /> : <Text style={[s.actionText, { color: '#EF4444' }]}>Reject</Text>}
                  </TouchableOpacity>
                </View>
              ) : null}
            </GlowCard>
          );
        }}

        ListFooterComponent={<View style={{ height: tabSpace }} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: D.bg },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },

  subHeading: { color: D.muted, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: -4, marginBottom: 4 },

  /* SEARCH */
  searchRow:   { marginTop: 4 },

  /* FILTER PILLS */
  pillsRow:      { paddingHorizontal: 16, marginTop: 8, marginBottom: 4 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusTxt:   { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'capitalize' },

  /* CARDS */
  card:      { padding: 14 },
  cardTop:   { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  carImg:    { width: '44%', height: 108, borderRadius: 12, overflow: 'hidden', position: 'relative', backgroundColor: '#061B4A' },
  cardInfo:  { flex: 1 },
  cardTitle: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_500Medium', lineHeight: 21 },
  cardMeta:  { color: '#B8B2BD', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },

  priceRow:   { flexDirection: 'row', gap: 12, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)' },
  priceLabel: { color: '#B8B2BD', fontSize: 9, fontFamily: 'Poppins_400Regular', letterSpacing: 0.4 },
  priceValue: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_500Medium', marginTop: 1 },

  btnRow:     { flexDirection: 'row', gap: 12, marginTop: 14 },
  actionBtn:  { flex: 1, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  approveBtn: { backgroundColor: 'rgba(11,42,34,0.7)', borderColor: 'rgba(46,204,113,0.45)' },
  rejectBtn:  { backgroundColor: 'rgba(58,21,32,0.7)', borderColor: 'rgba(224,54,58,0.45)' },
  actionText: { fontSize: 13, fontFamily: 'Poppins_400Regular' },

  emptyBox: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24, gap: 10 },
  emptyTitle: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginTop: 8, textAlign: 'center' },
  emptySub: { color: D.muted, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 18 },
  retryBtn: { marginTop: 12, backgroundColor: '#061B4A', borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', paddingHorizontal: 22, paddingVertical: 9, borderRadius: 20 },
  retryTxt: { color: ORANGE, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
});
