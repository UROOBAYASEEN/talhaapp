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
import { D, DHeader, FilterPills, GlowCard, SearchBar } from '@/components/dealer/DealerUI';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#e2671b';
const BG     = '#010A1F';
const SERVER = API_BASE.replace('/api/v1', '');

const FILTERS   = ['All', 'New', 'Confirmed', 'Installation', 'Completed'] as const;
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
    <GlowCard style={s.card} radius={22}>
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
          <View style={{ flexShrink: 1 }}>
            <Text style={s.claimName} numberOfLines={1}>{item.customer_name || 'Customer'}</Text>
            <View style={s.phoneRow}>
              <Ionicons name="call-outline" size={16} color={ORANGE} />
              <Text style={s.phoneText}>{item.customer_phone || '—'}</Text>
            </View>
          </View>
        </View>
        <View style={[s.statusBadge, { backgroundColor: `${color}33` }]}>
          <Text style={[s.statusText, { color }]}>{item.status?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Info grid */}
      <View style={s.grid}>
        <View style={s.gridItem}>
          <Text style={s.gridLabel}>VEHICLE</Text>
          <Text style={s.gridValue} numberOfLines={2}>{item.vehicle || '—'}</Text>
        </View>
        <View style={s.gridItem}>
          <Text style={s.gridLabel}>AMOUNT</Text>
          <Text style={s.gridValue}>PKR {Number(item.amount || 0).toLocaleString()}</Text>
        </View>
        <View style={s.gridItem}>
          <Text style={s.gridLabel}>PACKAGE</Text>
          <Text style={[s.gridValue, { color: ORANGE }]} numberOfLines={1}>{item.device_name || '—'}</Text>
        </View>
        <View style={s.gridItem}>
          <Text style={s.gridLabel}>CITY</Text>
          <Text style={s.gridValue}>{item.city || '—'}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={s.cardFooter}>
        <Text style={s.dateText}>Claim date: {item.date || date}</Text>
        <TouchableOpacity style={s.viewBtn} onPress={onViewDetail}>
          <Text style={s.viewBtnText}>View Details</Text>
          <ChevronRight size={18} color={ORANGE} />
        </TouchableOpacity>
      </View>
    </GlowCard>
  );
}

export default function TrackerClaimsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>('All');
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
        <DHeader title="Claims" />

        {/* Search + Sort */}
        <View style={s.searchRow}>
          <SearchBar savedSearch
            value={query}
            onChangeText={setQuery}
            placeholder="Search by Claim ID, Customer, Vehicle..."
            onSort={() => setShowSort(v => !v)}
          />
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

        {/* Filter pills — inventory "All" menu effect */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow} style={{ flexGrow: 0 }}>
          <FilterPills
            items={FILTERS}
            value={activeFilter}
            onChange={setActiveFilter}
            style={{ flexWrap: 'nowrap', gap: 10 }}
            badges={Object.fromEntries(FILTERS.filter(f => f !== 'All' && counts[f] > 0).map(f => [f, counts[f]])) as any}
          />
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
  root:        { flex: 1, backgroundColor: D.bg },

  /* SEARCH */
  searchRow:      { paddingHorizontal: 16, marginBottom: 16, zIndex: 20 },
  sortDropdown:   { position: 'absolute', top: 52, right: 16, backgroundColor: 'rgba(6,18,52,0.98)', borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', borderRadius: 12, zIndex: 99, minWidth: 150, overflow: 'hidden' },
  sortItem:       { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  sortItemActive: { backgroundColor: 'rgba(226,103,27,0.12)' },
  sortItemText:   { fontSize: 12, fontFamily: 'Poppins_400Regular', color: AppColors.textSecondary },

  /* FILTERS */
  filtersRow:  { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 },

  countText:   { paddingHorizontal: 16, fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#FFFFFF', marginTop: 12, marginBottom: 10 },

  /* LIST */
  list:        { paddingHorizontal: 16, paddingBottom: 110, gap: 18 },
  empty:       { alignItems: 'center', paddingTop: 60 },
  emptyTxt:    { fontSize: 14, fontFamily: 'Poppins_500Medium', color: AppColors.textSecondary },

  /* CARD */
  card:        { padding: 16, paddingBottom: 14 },

  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardLeft:    { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 1 },
  avatar:        { width: 66, height: 66, borderRadius: 33, backgroundColor: '#1a2a4a', overflow: 'hidden' },
  avatarFallback:{ backgroundColor: '#032a69', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 22, fontFamily: 'Poppins_700Bold' },
  claimName:   { fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  phoneRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  phoneText:   { fontSize: 15, fontFamily: 'Poppins_400Regular', color: '#C9BDC4' },
  statusBadge: { borderRadius: 30, paddingHorizontal: 14, paddingVertical: 4 },
  statusText:  { fontSize: 13, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.8 },

  grid:        { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, paddingHorizontal: 14 },
  gridItem:    { width: '50%', paddingRight: 8 },
  gridLabel:   { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#FFFFFF', letterSpacing: 0.4 },
  gridValue:   { fontSize: 17, fontFamily: 'Poppins_400Regular', color: '#C9BDC4', marginTop: 2, lineHeight: 26 },

  cardFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, marginHorizontal: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)' },
  dateText:    { fontSize: 15, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  viewBtn:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewBtnText: { fontSize: 15, fontFamily: 'Poppins_500Medium', color: ORANGE },
});
