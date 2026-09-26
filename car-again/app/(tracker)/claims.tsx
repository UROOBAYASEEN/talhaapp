import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, SlidersHorizontal, Phone, ChevronRight, Users } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#e2671b';
const BG     = '#010A1F';
const SERVER = API_BASE.replace('/api/v1', '');

const FILTERS   = ['All', 'New', 'Confirmed', 'Installation', 'Completed'];
const SORT_OPTS = ['Newest First', 'Oldest First', 'Name A–Z', 'Name Z–A'];

function statusColor(status: string) {
  switch (status) {
    case 'confirmed':    return '#3b82f6';
    case 'installation': return '#8b5cf6';
    case 'completed':    return '#22c55e';
    case 'cancelled':    return '#ef4444';
    default:             return ORANGE;
  }
}

function CardShade() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

function resolveUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}
function ClaimCard({ item, onViewDetail }: { item: any; onViewDetail: () => void }) {
  const initials = (item.customer_name || 'C').charAt(0).toUpperCase();
  const color    = statusColor(item.status);
  const date     = item.created_at
    ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <View style={s.card}>
      <CardShade />

      {/* Top row */}
      <View style={s.cardTop}>
        <View style={s.cardLeft}>
          {item.customer_avatar_url ? (
            <Image source={{ uri: resolveUrl(item.customer_avatar_url) }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>{initials}</Text>
            </View>
          )}
          <View>
            <Text style={s.claimName}>{item.customer_name || 'Customer'}</Text>
            <View style={s.phoneRow}>
              <Phone size={11} color={ORANGE} />
              <Text style={s.phoneText}>{item.customer_phone || '—'}</Text>
            </View>
          </View>
        </View>
        <View style={[s.statusBadge, { backgroundColor: color }]}>
          <Text style={s.statusText}>{item.status?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Info grid */}
      <View style={s.grid}>
        <View style={s.gridItem}>
          <Text style={s.gridLabel}>VEHICLE</Text>
          <Text style={s.gridValue} numberOfLines={1}>{item.vehicle || '—'}</Text>
        </View>
        <View style={s.gridItem}>
          <Text style={s.gridLabel}>CITY</Text>
          <Text style={s.gridValue}>{item.city || '—'}</Text>
        </View>
        <View style={s.gridItem}>
          <Text style={s.gridLabel}>PACKAGE</Text>
          <Text style={[s.gridValue, { color: ORANGE }]} numberOfLines={1}>{item.device_name || '—'}</Text>
        </View>
        <View style={s.gridItem}>
          <Text style={s.gridLabel}>AMOUNT</Text>
          <Text style={s.gridValue}>PKR {Number(item.amount || 0).toLocaleString()}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={s.cardFooter}>
        <Text style={s.dateText}>
          Date: <Text style={s.dateValue}>{item.date || date}</Text>
        </Text>
        <TouchableOpacity style={s.viewBtn} onPress={onViewDetail}>
          <Text style={s.viewBtnText}>View Details</Text>
          <ChevronRight size={13} color={ORANGE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TrackerClaimsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [activeFilter, setActiveFilter] = useState('All');
  const [query,        setQuery]        = useState('');
  const [sortBy,       setSortBy]       = useState('Newest First');
  const [showSort,     setShowSort]     = useState(false);
  const [claims,       setClaims]       = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const fetchClaims = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/tracker-bookings/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setClaims(await res.json());
    } catch { /* offline */ }
  }, [token]);

  useEffect(() => {
    fetchClaims().finally(() => setLoading(false));
  }, [fetchClaims]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchClaims();
    setRefreshing(false);
  }

  // Count per filter for badges
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: claims.length };
    FILTERS.filter(f => f !== 'All').forEach(f => {
      c[f] = claims.filter(cl => cl.status?.toLowerCase() === f.toLowerCase()).length;
    });
    return c;
  }, [claims]);

  const filtered = useMemo(() => claims
    .filter(c => {
      const matchFilter = activeFilter === 'All' || c.status?.toLowerCase() === activeFilter.toLowerCase();
      const matchSearch = !query ||
        c.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
        c.vehicle?.toLowerCase().includes(query.toLowerCase()) ||
        c.device_name?.toLowerCase().includes(query.toLowerCase());
      return matchFilter && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'Name A–Z') return (a.customer_name || '').localeCompare(b.customer_name || '');
      if (sortBy === 'Name Z–A') return (b.customer_name || '').localeCompare(a.customer_name || '');
      if (sortBy === 'Oldest First') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }), [claims, activeFilter, query, sortBy]);

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={22} color={AppColors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Claims</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search + Sort */}
        <View style={s.searchRow}>
          <View style={s.searchWrap}>
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <Search size={15} color="#8f9cb5" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by Claim ID, Customer, Vehicle..."
              placeholderTextColor="#8f9cb5"
              style={s.searchInput}
            />
          </View>
          <View>
            <TouchableOpacity style={s.sortBtn} onPress={() => setShowSort(v => !v)}>
              <SlidersHorizontal size={14} color={ORANGE} />
              <Text style={s.sortText}>Sort</Text>
            </TouchableOpacity>
            {showSort && (
              <View style={s.sortDropdown}>
                {SORT_OPTS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[s.sortItem, sortBy === opt && s.sortItemActive]}
                    onPress={() => { setSortBy(opt); setShowSort(false); }}
                  >
                    <Text style={[s.sortItemText, sortBy === opt && { color: ORANGE }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersRow}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[s.chip, activeFilter === f && s.chipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, activeFilter === f && s.chipTextActive]}>{f}</Text>
              {counts[f] > 0 && (
                <View style={[s.chipBadge, activeFilter === f && s.chipBadgeActive]}>
                  <Text style={[s.chipBadgeText, activeFilter === f && s.chipBadgeTextActive]}>
                    {counts[f]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.countText}>Showing {filtered.length} items</Text>
      </SafeAreaView>

      {/* Claims List */}
      {loading ? (
        <ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
          renderItem={({ item }) => <ClaimCard item={item} onViewDetail={() => router.push({ pathname: '/(tracker)/claim-detail' as any, params: { bookingId: item.id } })} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Users size={40} color={AppColors.textSecondary} strokeWidth={1.4} />
              <Text style={s.emptyTxt}>No clients yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },

  /* HEADER */
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: AppColors.textPrimary },

  /* SEARCH */
  searchRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  searchWrap:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(3,12,40,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 30, paddingHorizontal: 14, paddingVertical: 10, overflow: 'hidden' },
  searchInput:    { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', color: AppColors.textPrimary, padding: 0 },
  sortBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  sortText:       { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: ORANGE },
  sortDropdown:   { position: 'absolute', top: 32, right: 0, backgroundColor: 'rgba(6,18,52,0.98)', borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', borderRadius: 12, zIndex: 99, minWidth: 140, overflow: 'hidden' },
  sortItem:       { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  sortItemActive: { backgroundColor: 'rgba(226,103,27,0.12)' },
  sortItemText:   { fontSize: 12, fontFamily: 'Poppins_400Regular', color: AppColors.textSecondary },

  /* FILTERS */
  filtersRow:  { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#061B4A' },
  chipActive:  { borderColor: ORANGE, backgroundColor: 'rgba(226,103,27,0.1)' },
  chipText:    { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#94a3b8' },
  chipTextActive: { color: ORANGE },
  chipBadge:     { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  chipBadgeActive:{ backgroundColor: ORANGE },
  chipBadgeText:  { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#94a3b8' },
  chipBadgeTextActive: { color: '#fff' },

  countText:   { paddingHorizontal: 16, fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#94a3b8', marginTop: 10, marginBottom: 4 },

  /* LIST */
  list:        { paddingHorizontal: 16, paddingBottom: 100, gap: 14 },
  empty:       { alignItems: 'center', paddingTop: 60 },
  emptyTxt:    { fontSize: 14, fontFamily: 'Poppins_500Medium', color: AppColors.textSecondary },

  /* CARD */
  card:        { borderRadius: 16, padding: 16, backgroundColor: '#010A1F', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', overflow: 'hidden' },

  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:        { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a2a4a', overflow: 'hidden' },
  avatarFallback:{ backgroundColor: '#032a69', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_700Bold' },
  lastMsg:       { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#64748b', marginTop: 2, maxWidth: 160 },
  claimName:   { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#fff' },
  phoneRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  phoneText:   { fontSize: 11, fontFamily: 'Poppins_400Regular', color: ORANGE },
  statusBadge: { backgroundColor: ORANGE, borderRadius: 30, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:  { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#fff' },

  grid:        { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, columnGap: 0 },
  gridItem:    { width: '50%' },
  gridLabel:   { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: '#94a3b8', letterSpacing: 0.8 },
  gridValue:   { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff', marginTop: 2 },

  cardFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  dateText:    { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#94a3b8' },
  dateValue:   { fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  viewBtn:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewBtnText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: ORANGE },
});
