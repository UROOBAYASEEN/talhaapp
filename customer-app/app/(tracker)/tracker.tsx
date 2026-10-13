import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  Share2,
  Heart,
  Plus,
  Cpu,
} from 'lucide-react-native';
import { AppColors, useAppColors } from '@/constants/theme';
import { D, DHeader, GlowCard, SearchBar } from '@/components/dealer/DealerUI';
import { MaterialIcons } from "@expo/vector-icons";
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTabBarSpace } from '@/components/shared/PillTabBar';

const ORANGE    = '#e2671b';
const SERVER    = API_BASE.replace('/api/v1', '');

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
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

function resolveUrl(url: string) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}

function statusColor(status: string) {
  if (status === 'published')    return '#34D399';
  if (status === 'rejected')     return '#f87171';
  if (status === 'under_review') return ORANGE;
  return '#64748b';
}

function statusLabel(status: string) {
  if (status === 'published')    return 'Live';
  if (status === 'rejected')     return 'Rejected';
  if (status === 'under_review') return 'Under Review';
  return 'Draft';
}

function TrackerCard({ item }: { item: any }) {
  const aC = useAppColors();
  const [liked, setLiked] = useState(false);
  const initials = item.name?.slice(0, 3).toUpperCase() || 'TRK';
  const color    = statusColor(item.status);
  const label    = statusLabel(item.status);

  return (
    <GlowCard style={s.card} radius={20}>
      {/* Top row */}
      <View style={s.cardTop}>
        <View style={s.cardLeft}>
          {item.images?.[0] ? (
            <Image source={{ uri: resolveUrl(item.images[0])! }} style={s.logoImg} />
          ) : (
            <View style={s.logoCircle}>
              <Text style={s.logoText}>{initials}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[s.trackerName, { color: aC.isDark ? '#fff' : '#010a1f' }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[s.trackerTagline, { color: aC.isDark ? '#C9BDC4' : '#475569' }]} numberOfLines={2}>
              {item.description || item.coverage || 'Tracker device'}
            </Text>
          </View>
        </View>

        <View style={s.cardRight}>
          <View style={s.iconRow}>
            <TouchableOpacity>
              <Share2 size={20} color={ORANGE} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLiked(v => !v)}>
              <Heart
                size={20}
                strokeWidth={1.8}
                color={ORANGE}
                fill={liked ? ORANGE : 'transparent'}
              />
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
            <Text style={s.periodText}>Yearly</Text>
            <Text style={s.priceText}>PKR {Number(item.price).toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Status badge */}
      <View style={s.ratingRow}>
        <View style={[s.statusDot, { backgroundColor: color }]} />
        <Text style={[s.ratingText, { color }]}>{label}</Text>
      </View>

      {/* Info strip */}
      <View style={s.infoStrip}>
        <View style={s.infoItem}>
          <Text style={[s.infoLabel, { color: aC.isDark ? '#E6E1E8' : '#64748b' }]}>Installation</Text>
          <Text style={[s.infoValue, { color: aC.isDark ? '#fff' : '#010a1f' }]}>
            {item.installation_fee ? `PKR ${Number(item.installation_fee).toLocaleString()}` : 'N/A'}
          </Text>
        </View>
        <View style={[s.divider, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)' }]} />
        <View style={[s.infoItem, { alignItems: 'center' }]}>
          <Text style={[s.infoLabel, { color: aC.isDark ? '#E6E1E8' : '#64748b' }]}>Monthly</Text>
          <Text style={[s.infoValue, { color: aC.isDark ? '#fff' : '#010a1f' }]}>
            {item.monthly_fee ? `PKR ${Number(item.monthly_fee).toLocaleString()}` : 'N/A'}
          </Text>
        </View>
        <View style={[s.divider, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)' }]} />
        <View style={[s.infoItem, { alignItems: 'flex-end' }]}>
          <Text style={[s.infoLabel, { color: aC.isDark ? '#E6E1E8' : '#64748b' }]}>Coverage</Text>
          <Text style={[s.infoValue, { color: aC.isDark ? '#fff' : '#010a1f' }]} numberOfLines={1}>{item.coverage || 'Pakistan'}</Text>
        </View>
      </View>
    </GlowCard>
  );
}

export default function TrackerScreen() {
  const tabSpace = useTabBarSpace(120);
  const fabBottom = useTabBarSpace(110, 16);
  const router = useRouter();
  const aC = useAppColors();
  const { token } = useAuth();

  const [query,      setQuery]      = useState('');
  const [trackers,   setTrackers]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrackers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/tracker-devices/mine?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTrackers(await res.json());
    } catch { /* offline */ }
  }, [token]);

  useEffect(() => {
    fetchTrackers().finally(() => setLoading(false));
  }, [fetchTrackers]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchTrackers();
    setRefreshing(false);
  }

  const filtered = trackers.filter(t =>
    t.name?.toLowerCase().includes(query.toLowerCase()) ||
    t.description?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={[s.root, { backgroundColor: aC.bg }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: aC.bg }}>
        {/* Header */}
        <DHeader title="Policy Applications" />

        {/* Search + Sort */}
        <View style={s.searchRow}>
          <SearchBar savedSearch value={query} onChangeText={setQuery} placeholder="Search Tracker" onSort={() => {}} />
        </View>
      </SafeAreaView>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={[s.list, { paddingBottom: tabSpace }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
          renderItem={({ item }) => <TrackerCard item={item} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Cpu size={40} color={aC.textSecondary} strokeWidth={1.4} />
              <Text style={[s.emptyTxt, { color: aC.textSecondary }]}>
                {query ? `No trackers match "${query}"` : 'No trackers added yet'}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating add button */}
      <TouchableOpacity style={[s.fab, { bottom: fabBottom }]} activeOpacity={0.85} onPress={() => router.push('/(tracker)/new-tracker' as any)}>
        <MaterialIcons name="add-box" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg },

  /* HEADER */
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Poppins_600SemiBold', color: AppColors.textPrimary },

  /* SEARCH */
  searchRow:   { paddingHorizontal: 16, marginBottom: 12 },
  searchWrap:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(3,12,40,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 30, paddingHorizontal: 14, paddingVertical: 10, overflow: 'hidden' },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: AppColors.textPrimary, padding: 0 },
  sortBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText:    { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: ORANGE },

  /* LIST */
  list:     { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120, gap: 14 },
  empty:    { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTxt: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: AppColors.textSecondary, textAlign: 'center' },

  /* CARD */
  card:          { padding: 16 },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  logoCircle:    { width: 58, height: 58, borderRadius: 29, backgroundColor: '#0B2358', borderWidth: 1, borderColor: '#7F98C4', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoImg:       { width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: '#7F98C4', flexShrink: 0 },
  logoText:      { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF' },
  trackerName:   { fontSize: 20, fontFamily: 'Poppins_500Medium', color: '#fff' },
  trackerTagline:{ fontSize: 15, fontFamily: 'Poppins_400Regular', color: '#C9BDC4', lineHeight: 22, maxWidth: 170 },

  cardRight:  { alignItems: 'flex-end', gap: 4 },
  iconRow:    { flexDirection: 'row', gap: 6 },
  periodText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#E6E1E8' },
  priceText:  { fontSize: 16, fontFamily: 'Poppins_500Medium', color: ORANGE },

  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  ratingText: { fontSize: 15, fontFamily: 'Poppins_400Regular' },

  infoStrip:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 4, marginTop: 10 },
  infoItem:   { flex: 1, paddingHorizontal: 8 },
  infoLabel:  { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#E6E1E8', marginBottom: 3 },
  infoValue:  { fontSize: 16, fontFamily: 'Poppins_500Medium', color: '#fff' },
  divider:    { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.4)' },

  /* FAB */
  fab: { position: 'absolute', bottom: 110, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
});
