import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors, useAppColors } from '@/constants/theme';

const BG       = '#010a1f';
const WHITE    = '#f9fafc';
const SUBTITLE = '#baacb6';
const ORANGE   = '#e2671b';
const NAVY     = '#032a69';
const DARK_NAV = '#061b4a';
const BORDER   = 'rgba(255,255,255,0.15)';

function GlassInset() {
  const aC = useAppColors();
  if (!aC.isDark) {
    return (
      <>
        <LinearGradient colors={["rgba(3,42,105,0.04)","transparent"]} start={{x:0.5,y:0}} end={{x:0.5,y:0.4}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        <LinearGradient colors={["transparent","rgba(226,103,27,0.07)"]} start={{x:0.5,y:0.6}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      </>
    );
  }
  return (
    <>
      <LinearGradient colors={["rgba(22,64,136,0.2)","transparent"]} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={["rgba(13,37,84,0.18)","transparent"]} start={{x:0,y:0.5}} end={{x:0.45,y:0.5}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={["transparent","rgba(29,83,175,0.2)"]} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

function formatPrice(p: number) {
  if (p >= 10000000) return `PKR ${(p / 10000000).toFixed(1)} Crore`;
  if (p >= 100000)   return `PKR ${(p / 100000).toFixed(1)} Lacs`;
  return `PKR ${p.toLocaleString()}`;
}

const FILTERS = ['All', 'Price', 'Year', 'City', 'Fuel'];

export default function BrandVehiclesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();
  const { brand, brandLogo } = useLocalSearchParams<{ brand: string; brandLogo: string }>();

  const [vehicles,    setVehicles]    = useState<any[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasNext,     setHasNext]     = useState(false);
  const [search,      setSearch]      = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [savedIds,    setSavedIds]    = useState<Set<string>>(new Set());

  const fetchVehicles = useCallback(async (p = 1, replace = true, searchTerm = search) => {
    try {
      const q = new URLSearchParams({
        page:      String(p),
        limit:     '10',
        category:  'car',
        condition: 'new',
        make:      brand || '',
      });
      if (searchTerm) q.set('search', searchTerm);

      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/vehicles?${q}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setVehicles(prev => replace ? data.items : [...prev, ...data.items]);
        setTotal(data.total);
        setHasNext(data.has_next);
        setPage(p);
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, [brand, search, token]);

  useEffect(() => { fetchVehicles(1, true); }, [brand]);

  function handleSearch(text: string) {
    setSearch(text);
    setLoading(true);
    fetchVehicles(1, true, text);
  }

  function loadMore() {
    if (!hasNext || loadingMore) return;
    setLoadingMore(true);
    fetchVehicles(page + 1, false);
  }

  async function toggleSave(id: string) {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}/save`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setSavedIds(prev => {
          const next = new Set(prev);
          if (d.saved) next.add(id); else next.delete(id);
          return next;
        });
      }
    } catch { /* offline */ }
  }

  function VehicleCard({ item }: { item: any }) {
    const saved = savedIds.has(item.id);
    return (
      <View style={[styles.card, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
        <GlassInset />
        <View style={styles.cardTop}>
          {/* Image */}
          <View style={[styles.cardImgBox, { backgroundColor: aC.isDark ? DARK_NAV : '#f1f5f9' }]}>
            {item.images?.[0]
              ? <Image source={{ uri: item.images[0] }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              : <View style={styles.cardImgPh}>
                  <Ionicons name="car-outline" size={32} color={aC.isDark ? SUBTITLE : '#94a3b8'} />
                </View>
            }
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={12} color={aC.isDark ? SUBTITLE : '#64748b'} />
                <Text style={[styles.metaTxt, { color: aC.isDark ? SUBTITLE : '#475569' }]}>{item.year}</Text>
              </View>
              {item.mileage ? (
                <View style={styles.metaItem}>
                  <Ionicons name="speedometer-outline" size={12} color={aC.isDark ? SUBTITLE : '#64748b'} />
                  <Text style={[styles.metaTxt, { color: aC.isDark ? SUBTITLE : '#475569' }]}>{Number(item.mileage).toLocaleString()} km</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="water-outline" size={12} color={aC.isDark ? SUBTITLE : '#64748b'} />
                <Text style={[styles.metaTxt, { color: aC.isDark ? SUBTITLE : '#475569' }]}>{item.fuel_type || 'Petrol'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={12} color={aC.isDark ? SUBTITLE : '#64748b'} />
                <Text style={[styles.metaTxt, { color: aC.isDark ? SUBTITLE : '#475569' }]}>{item.city || 'Pakistan'}</Text>
              </View>
            </View>

            {/* Available badge */}
            <View style={styles.availBadge}>
              <Ionicons name="checkmark-circle" size={10} color="#34c759" />
              <Text style={styles.availTxt}>Available</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.cardBtns}>
          <TouchableOpacity
            style={styles.viewBtn}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: item.id } })}
          >
            <LinearGradient
              colors={[NAVY, ORANGE]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.viewGrad}
            >
              <Text style={styles.viewTxt}>View Details</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, { borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}
            activeOpacity={0.85}
            onPress={() => toggleSave(item.id)}
          >
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={18}
              color={saved ? '#ff4d6d' : (aC.isDark ? WHITE : '#e2671b')}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg }]} edges={["top"]}>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color={aC.isDark ? '#f9fafc' : '#010a1f'} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {brandLogo ? (
            <Image source={{ uri: brandLogo }} style={styles.headerBrandLogo} resizeMode="contain" />
          ) : null}
          <Text style={[styles.headerBrand, { color: aC.isDark ? WHITE : '#010a1f' }]}>{brand || 'Brand'}</Text>
        </View>

        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={i => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { backgroundColor: aC.bg }]}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchVehicles(1, true); }}
            tintColor={ORANGE}
          />
        }
        ListHeaderComponent={
          <>
            {/* Title + count */}
            <View style={styles.titleBox}>
              <Text style={[styles.pageTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>{brand} New Cars</Text>
              <Text style={[styles.resultSub, { color: aC.isDark ? SUBTITLE : '#475569' }]}>{total} Results Found</Text>
            </View>

            {/* Search bar */}
            <View style={[styles.searchBox, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 2, overflow: 'hidden' }]}>
              <GlassInset />
              <Ionicons name="search-outline" size={18} color={aC.isDark ? SUBTITLE : '#64748b'} />
              <TextInput
                style={[styles.searchInput, { color: aC.isDark ? WHITE : '#010a1f' }]}
                placeholder={`Search ${brand} cars...`}
                placeholderTextColor={aC.isDark ? SUBTITLE : '#94a3b8'}
                value={search}
                onChangeText={handleSearch}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Ionicons name="close-circle" size={18} color={aC.isDark ? SUBTITLE : '#94a3b8'} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter chips */}
            <FlatList
              horizontal
              data={FILTERS}
              keyExtractor={f => f}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
              renderItem={({ item: f }) => {
                const active = activeFilter === f;
                return (
                  <TouchableOpacity
                    style={[styles.filterChip, { backgroundColor: aC.isDark ? DARK_NAV : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', borderWidth: 1, shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1 }, active && (aC.isDark ? styles.filterChipActive : { borderColor: ORANGE, backgroundColor: 'rgba(226,103,27,0.08)' })]}
                    onPress={() => setActiveFilter(f)}
                  >
                    <Text style={[styles.filterTxt, { color: aC.isDark ? WHITE : '#010a1f' }, active && styles.filterTxtActive]}>{f}</Text>
                    <Ionicons name="chevron-down" size={11} color={active ? ORANGE : (aC.isDark ? WHITE : '#475569')} />
                  </TouchableOpacity>
                );
              }}
            />

            {loading && <ActivityIndicator color={ORANGE} style={{ marginVertical: 28 }} />}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={[styles.emptyBox, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.2)' : 'rgba(3,42,105,0.08)' }]}>
              <Ionicons name="car-outline" size={56} color={aC.isDark ? SUBTITLE : '#94a3b8'} />
              <Text style={[styles.emptyTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>No {brand} cars found</Text>
              <Text style={[styles.emptySub, { color: aC.isDark ? SUBTITLE : '#475569' }]}>Try a different search term</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={ORANGE} style={{ marginVertical: 16 }} /> : null
        }
        renderItem={({ item }) => <VehicleCard item={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  list: { paddingHorizontal: 20, paddingBottom: 100 },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBrandLogo: { width: 32, height: 22 },
  headerBrand:   { color: WHITE, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },

  /* Title */
  titleBox:  { marginBottom: 12, marginTop: 4 },
  pageTitle: { color: WHITE,    fontSize: 18, fontFamily: 'Poppins_500Medium' },
  resultSub: { color: SUBTITLE, fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2 },

  /* Search */
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 32, paddingHorizontal: 16, paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: WHITE, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  /* Filters */
  filterContent: { gap: 10, paddingBottom: 14 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16, backgroundColor: DARK_NAV,
  },
  filterChipActive: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'transparent' },
  filterTxt:        { color: WHITE,  fontSize: 12, fontFamily: 'Poppins_500Medium' },
  filterTxtActive:  { color: ORANGE, fontFamily: 'Poppins_600SemiBold' },

  /* Vehicle Card */
  card: {
    borderWidth: 1, borderColor: 'rgba(91,152,213,0.4)',
    borderRadius: 16, overflow: 'hidden', marginBottom: 14,
    backgroundColor: 'rgba(6,27,74,0.3)',
  },
  cardTop:    { flexDirection: 'row', gap: 10 },
  cardImgBox: {
    width: 120, alignSelf: 'stretch', flexShrink: 0,
    margin: 10, borderRadius: 12, overflow: 'hidden',
    backgroundColor: DARK_NAV,
  },
  cardImgPh:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardInfo:   { flex: 1, gap: 4, paddingVertical: 10, paddingRight: 10 },
  cardTitle:  { color: WHITE,  fontSize: 13, fontFamily: 'Poppins_500Medium', lineHeight: 18 },
  cardPrice:  { color: ORANGE, fontSize: 12, fontFamily: 'Poppins_700Bold' },

  metaRow:  { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt:  { color: SUBTITLE, fontSize: 10, fontFamily: 'Poppins_400Regular' },

  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52,199,89,0.1)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 18,
    marginTop: 2,
  },
  availTxt: { color: '#34c759', fontSize: 9, fontFamily: 'Poppins_500Medium' },

  /* Card Buttons */
  cardBtns: { flexDirection: 'row', gap: 10, padding: 10, paddingTop: 0 },
  viewBtn:  { flex: 1, borderRadius: 16, overflow: 'hidden' },
  viewGrad: { height: 34, alignItems: 'center', justifyContent: 'center' },
  viewTxt:  { color: WHITE, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  saveBtn: {
    width: 36, height: 34, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Empty */
  emptyBox: {
    alignItems: 'center', paddingVertical: 60, gap: 10,
  },
  emptyTitle: { color: WHITE,    fontSize: 16, fontFamily: 'Poppins_500Medium' },
  emptySub:   { color: SUBTITLE, fontSize: 13, fontFamily: 'Poppins_400Regular' },
});
