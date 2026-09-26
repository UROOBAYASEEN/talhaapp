import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Image, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

const BG      = '#010a1f';
const WHITE   = '#f9fafc';
const SUBTITLE = '#baacb6';
const ORANGE  = '#e2671b';
const NAVY    = '#032a69';
const IMG_LOGO = require('@/assets/images/autowizor-logo-text.png');

const FILTERS = [
  { key: '',        label: 'All Ads',  badgeColor: ORANGE,     textColor: WHITE   },
  { key: 'active',  label: 'Active',   badgeColor: '#34c759',  textColor: WHITE   },
  { key: 'pending', label: 'Pending',  badgeColor: '#0088ff',  textColor: WHITE   },
  { key: 'sold',    label: 'Sold',     badgeColor: '#00c8b3',  textColor: WHITE   },
  { key: 'expired', label: 'Expired',  badgeColor: '#ff383c',  textColor: WHITE   },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:  { bg: 'rgba(52,199,89,0.1)',   color: '#34c759' },
  sold:    { bg: 'rgba(0,200,179,0.1)',   color: '#00c8b3' },
  pending: { bg: 'rgba(0,136,255,0.1)',   color: '#0088ff' },
  expired: { bg: 'rgba(255,56,60,0.1)',   color: '#ff383c' },
  draft:   { bg: 'rgba(156,163,175,0.1)', color: '#9ca3af' },
};

function ordinalDate(iso: string): string {
  const d   = new Date(iso);
  const day = d.getDate();
  const sfx = [11,12,13].includes(day % 100) ? 'th'
              : ['th','st','nd','rd'][Math.min(day % 10, 3)] || 'th';
  const mon = d.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
  return `${day}${sfx} ${mon} ${d.getFullYear()}`;
}

function formatPrice(p: number): string {
  if (p >= 10000000) return `PKR ${(p / 10000000).toFixed(1)} Crore`;
  if (p >= 100000)   return `PKR ${(p / 100000).toFixed(0)} Lac`;
  return `PKR ${p.toLocaleString()}`;
}

export default function MyListingsScreen() {
  const router       = useRouter();
  const { token }    = useAuth();
  const aC           = useAppColors();
  const [filter, setFilter]         = useState('');
  const [ads, setAds]               = useState<any[]>([]);
  const [stats, setStats]           = useState<Record<string,number>>({});
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const q   = filter ? `&status=${filter}` : '';
      const [listRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/vehicles/my?limit=50${q}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/vehicles/my/stats`,        { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (listRes.ok)  { const d = await listRes.json();  setAds(d.items || []); }
      if (statsRes.ok) { const d = await statsRes.json(); setStats(d); }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token, filter]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  function getCount(key: string) {
    if (!key) return stats.total || 0;
    return (stats as any)[key] || 0;
  }

  const renderCard = ({ item }: { item: any }) => {
    const sc          = STATUS_STYLE[item.status] || STATUS_STYLE.draft;
    const statusLabel = item.status.charAt(0).toUpperCase() + item.status.slice(1);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: aC.isDark ? aC.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: item.id } })}
      >
        {aC.isDark ? (
          <>
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        ) : (
          <>
            <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        )}
        {/* Car image */}
        <View style={styles.imgBox}>
          {item.images?.[0]
            ? <Image source={{ uri: item.images[0] }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            : <View style={[styles.imgPlaceholder, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                <Ionicons name="car-outline" size={28} color={aC.isDark ? SUBTITLE : '#94a3b8'} />
              </View>
          }
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.cardTitle, { color: aC.isDark ? aC.textPrimary : '#010a1f' }]} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>

          {/* Location row */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={aC.isDark ? SUBTITLE : '#94a3b8'} />
            <Text style={[styles.locationTxt, { color: aC.isDark ? SUBTITLE : '#64748b' }]} numberOfLines={1}>
              {item.city || 'Pakistan'} • {item.year} • CVT
            </Text>
          </View>

          {/* Status + Date */}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
              <Text style={[styles.statusTxt, { color: sc.color }]}>{statusLabel}</Text>
            </View>
            <View style={styles.dateArrowRow}>
              <Text style={[styles.dateTxt, { color: aC.isDark ? SUBTITLE : '#64748b' }]} numberOfLines={1}>Posted on {ordinalDate(item.created_at)}</Text>
              <Ionicons name="chevron-forward" size={14} color={ORANGE} />
            </View>
          </View>
        </View>

      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg }]}>

      {/* Header — company logo on top */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconWrap} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={aC.textPrimary} />
        </TouchableOpacity>
        <View style={styles.logoWrap} pointerEvents="none">
          {aC.isDark ? (
            <Image source={IMG_LOGO} style={styles.logo} resizeMode="contain" />
          ) : (
            <Text style={styles.logoTextLight}>
              <Text style={{ color: '#032a69' }}>Auto</Text>
              <Text style={{ color: '#e2671b' }}>wizor</Text>
            </Text>
          )}
        </View>
        <View style={styles.iconWrap} />
      </View>

      {/* Page title */}
      <View style={styles.titleWrap}>
        <Text style={[styles.headerTitle, { color: aC.textPrimary }]}>My Ads</Text>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => {
          const active = filter === f.key;
          const count  = getCount(f.key);
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.chip,
                { borderWidth: 1, overflow: 'hidden' },
                active
                  ? { backgroundColor: aC.isDark ? NAVY : ORANGE, borderColor: ORANGE }
                  : { backgroundColor: aC.isDark ? NAVY : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 },
              ]}
              onPress={() => setFilter(f.key)}
            >
              {!aC.isDark && !active && <LinearGradient colors={['rgba(3,42,105,0.03)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
              <Text style={[styles.chipTxt, active ? { color: aC.isDark ? ORANGE : WHITE, fontFamily: 'Poppins_700Bold' } : { color: aC.isDark ? WHITE : '#032a69', fontFamily: 'Poppins_500Medium' }]}>{f.label}</Text>
              <View style={[styles.countBadge, { backgroundColor: f.badgeColor }]}>
                <Text style={styles.countTxt}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {loading
        ? <ActivityIndicator color={ORANGE} style={{ flex: 1 }} />
        : <FlatList
            data={ads}
            keyExtractor={i => i.id}
            renderItem={renderCard}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={ORANGE} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="car-outline" size={56} color={SUBTITLE} />
                <Text style={styles.emptyTitle}>No Ads Yet</Text>
                <Text style={styles.emptySub}>Post your first vehicle listing to start selling</Text>
              </View>
            }
          />
      }

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/vehicle/create' as any)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={WHITE} />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6,
    position: 'relative',
  },
  iconWrap:    { width: 36, height: 36, justifyContent: 'center', zIndex: 1 },
  logoWrap: { position: 'absolute', left: 0, right: 0, top: 14, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 112, height: 21 },
  logoTextLight: { fontSize: 18, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5, textAlign: 'center' },
  titleWrap: { paddingHorizontal: 20, paddingBottom: 10 },
  headerTitle: { color: WHITE, fontSize: 20, fontFamily: 'Poppins_500Medium' },

  /* Filter */
  filterBar:     { flexGrow: 0, marginBottom: 14 },
  filterContent: { paddingHorizontal: 20, gap: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 16, borderWidth: 1,
  },
  chipActive:   { backgroundColor: NAVY, borderColor: ORANGE },
  chipInactive: { backgroundColor: NAVY, borderColor: 'rgba(255,255,255,0.15)' },
  chipTxt:      { color: WHITE, fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  chipTxtActive:{ color: ORANGE },
  countBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countTxt: { color: WHITE, fontSize: 8, fontFamily: 'Poppins_500Medium' },

  /* List */
  list: { paddingHorizontal: 20, paddingBottom: 110, gap: 12 },

  /* Card */
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)',
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    minHeight: 129,
  },
  imgBox: {
    width: 129,
    alignSelf: 'stretch',
    flexShrink: 0,
    overflow: 'hidden',
    marginVertical: 10,
    marginLeft: 10,
    borderRadius: 10,
  },
  imgPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  cardTitle: {
    color: WHITE, fontSize: 12,
    fontFamily: 'Poppins_500Medium', lineHeight: 17,
  },
  cardPrice: {
    color: ORANGE, fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  locationTxt: {
    color: SUBTITLE, fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 2,
    gap: 6,
  },
  dateArrowRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 18,
    minWidth: 62,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusTxt: { fontSize: 10, fontFamily: 'Poppins_500Medium' },
  dateTxt:   { color: SUBTITLE, fontSize: 9, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  arrow:     { marginRight: 12, flexShrink: 0 },

  /* Empty */
  empty:      { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { color: WHITE,    fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  emptySub:   { color: SUBTITLE, fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingHorizontal: 32 },

  /* FAB */
  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 61, height: 61, borderRadius: 39,
    backgroundColor: ORANGE,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 4,
    elevation: 8,
  },
});
