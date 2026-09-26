import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import BrowseMoreServices from '@/components/shared/BrowseMoreServices';
import LatestVideoSection from '@/components/shared/LatestVideoSection';
import React, { useState, useCallback, useEffect } from 'react';
import {
  ActivityIndicator, FlatList, Image, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAppColors } from '@/constants/theme';

const BG       = '#010a1f';
const WHITE    = '#f9fafc';
const SUBTITLE = '#baacb6';
const UNSELECT = '#d2d2d2';
const ORANGE   = '#e2671b';
const NAVY     = '#032a69';
const DARK_NAV = '#061b4a';
const BORDER   = 'rgba(255,255,255,0.2)';


const IMG_COMPARE   = 'https://www.figma.com/api/mcp/asset/24747b0a-c872-49e3-93a5-5837b0393536.png';
const IMG_INSURANCE = 'https://www.figma.com/api/mcp/asset/6cd6ddbb-7d65-4df6-8bde-1aaefdda8b39.png';

const IMG_LOGO = require('@/assets/images/autowizor-logo-text.png');

function formatPrice(p: number) {
  if (p >= 10000000) return `PKR ${(p / 10000000).toFixed(2)} Crore`;
  if (p >= 100000)   return `PKR ${(p / 100000).toFixed(2)} Lacs`;
  return `PKR ${p.toLocaleString()}`;
}

export default function AdsScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const [vehicles,    setVehicles]    = useState<any[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [activeFilters, setActiveFilters] = useState<any>({});

  const [page,        setPage]        = useState(1);
  const [hasNext,     setHasNext]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchVehicles = useCallback(async (p = 1, replace = true, filters = activeFilters, q_search = search) => {
    try {
      const q = new URLSearchParams({ page: String(p), limit: '10' });
      if (q_search)              q.set('search',    q_search);
      if (filters.cities?.length) q.set('city',     filters.cities[0]);
      if (filters.models?.length) q.set('search',   filters.models[0]);
      if (filters.minBudget > 0)  q.set('min_price', String(filters.minBudget));
      if (filters.maxBudget < 50_000_000) q.set('max_price', String(filters.maxBudget));
      if (filters.minYear && filters.minYear > 1990) q.set('year', String(filters.minYear));
      const res = await fetch(`${API_BASE}/vehicles?${q}`);
      if (res.ok) {
        const data = await res.json();
        setVehicles(prev => replace ? data.items : [...prev, ...data.items]);
        setTotal(data.total);
        setHasNext(data.has_next);
        setPage(p);
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, [search, activeFilters]);

  useEffect(() => { fetchVehicles(1, true, activeFilters, search); }, [search]);

  function handleFilterApply(filters: any) {
    setActiveFilters(filters);
    setLoading(true);
    fetchVehicles(1, true, filters, search);
  }

  function loadMore() {
    if (!hasNext || loadingMore) return;
    setLoadingMore(true);
    fetchVehicles(page + 1, false);
  }

  const VehicleCard = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: aC.isDark ? aC.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
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
      <View style={styles.cardTop}>
        {/* Image */}
        <View style={styles.cardImgBox}>
          {item.images?.[0]
            ? <Image source={{ uri: item.images[0] }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            : <View style={styles.cardImgPh}>
                <Ionicons name="car-outline" size={32} color={SUBTITLE} />
              </View>
          }
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: aC.textPrimary }]} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>

          {/* Year + KM */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={aC.textSecondary} />
              <Text style={[styles.metaTxt, { color: aC.textSecondary }]}>{item.year}</Text>
            </View>
            {item.mileage ? (
              <View style={styles.metaItem}>
                <Ionicons name="speedometer-outline" size={13} color={aC.textSecondary} />
                <Text style={[styles.metaTxt, { color: aC.textSecondary }]}>{item.mileage.toLocaleString()}Km</Text>
              </View>
            ) : null}
          </View>

          {/* Fuel + City */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="water-outline" size={13} color={aC.textSecondary} />
              <Text style={[styles.metaTxt, { color: aC.textSecondary }]}>{item.fuel_type || 'Petrol'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={aC.textSecondary} />
              <Text style={[styles.metaTxt, { color: aC.textSecondary }]}>{item.city || 'Pakistan'}</Text>
            </View>
          </View>

          {/* Available badge */}
          <View style={styles.statusRow}>
            <View style={styles.availBadge}>
              <Ionicons name="checkmark-circle" size={10} color="#34c759" />
              <Text style={styles.availTxt}>Available</Text>
            </View>
            <Text style={[styles.deliveryTxt, { color: aC.textSecondary }]}>Delivery: Immediate</Text>
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

        <TouchableOpacity style={[styles.contactBtn, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(3,42,105,0.14)' }]} activeOpacity={0.85}>
          <Text style={[styles.contactTxt, { color: aC.isDark ? '#f9fafc' : '#032a69' }]}>Contact Seller</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={22} color={aC.textPrimary} />
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
        <View style={styles.heartWrap}>
          <Ionicons name="heart" size={20} color={ORANGE} style={{ marginTop: 16 }} />
          <Text style={[styles.heartCount, { marginTop: 16 }]}>3</Text>
        </View>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={i => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVehicles(1, true); }} tintColor={ORANGE} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <>
            {/* Title */}
            <View style={styles.titleBox}>
              <Text style={[styles.pageTitle, { color: aC.textPrimary }]}>Car For Sale</Text>
              <Text style={[styles.resultSub, { color: aC.textSecondary }]}>{total.toLocaleString()} Results Found in karachi</Text>
            </View>


            {/* Search */}
            <View style={[styles.searchBox, { backgroundColor: aC.isDark ? aC.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.14)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2 }]}>
              {aC.isDark ? (
                <>
                  <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              ) : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              <Ionicons name="search-outline" size={18} color={aC.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: aC.textPrimary }]}
                placeholder="Search cars, banks & dealers..."
                placeholderTextColor={aC.textSecondary}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
            </View>


            {loading && <ActivityIndicator color={ORANGE} style={{ marginVertical: 24 }} />}
          </>
        }
        ListFooterComponent={
          !loading ? (
            <>
              {loadingMore && <ActivityIndicator color={ORANGE} style={{ marginVertical: 16 }} />}

              {/* You May Need This */}
              <Text style={[styles.sectionTitle, { color: aC.textPrimary }]}>You May Need This</Text>
              <View style={styles.needsRow}>
                <TouchableOpacity style={[styles.needCard, { borderWidth: 1, borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,12,40,0.12)' }]} activeOpacity={0.85}>
                  <LinearGradient
                    colors={aC.isDark ? [BG, DARK_NAV, 'rgba(226,103,27,0.4)'] : ['#ffffff', '#f0f4ff', 'rgba(226,103,27,0.28)']}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    style={styles.needGrad}
                  >
                    <Image source={{ uri: IMG_COMPARE }} style={styles.needImg} resizeMode="contain" />
                    <View style={styles.needTitleRow}>
                      <Text style={[styles.needTitle, { color: aC.isDark ? WHITE : '#032a69' }]}>{'Compare\nVehicle'}</Text>
                      <Ionicons name="chevron-forward" size={14} color={aC.isDark ? WHITE : '#032a69'} />
                    </View>
                    <Text style={[styles.needSub, { color: aC.isDark ? UNSELECT : '#555566' }]}>Compare and choose the vehicle that best fits your needs.</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.needCard, { borderWidth: 1, borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,12,40,0.12)' }]} activeOpacity={0.85}>
                  <LinearGradient
                    colors={aC.isDark ? [BG, DARK_NAV, 'rgba(226,103,27,0.4)'] : ['#ffffff', '#f0f4ff', 'rgba(226,103,27,0.28)']}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    style={styles.needGrad}
                  >
                    <Image source={{ uri: IMG_INSURANCE }} style={styles.needImg} resizeMode="contain" />
                    <View style={styles.needTitleRow}>
                      <Text style={[styles.needTitle, { color: aC.isDark ? WHITE : '#032a69' }]}>{'Compare\nInsurance'}</Text>
                      <Ionicons name="chevron-forward" size={14} color={aC.isDark ? WHITE : '#032a69'} />
                    </View>
                    <Text style={[styles.needSub, { color: aC.isDark ? UNSELECT : '#555566' }]}>Compare plans, coverage, and benefits to find the right insurance.</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <BrowseMoreServices />
              <LatestVideoSection count={2} />
            </>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={56} color={aC.textSecondary} />
              <Text style={[styles.emptyTxt, { color: aC.textSecondary }]}>No vehicles found</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <VehicleCard item={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  logoWrap: {
    position: 'absolute',
    left: 0, right: 0,
    top: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 112, height: 21 },
  logoTextLight: { fontSize: 20, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5, textAlign: 'center' },
  heartWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  heartCount:{ color: ORANGE, fontSize: 8, fontFamily: 'Poppins_500Medium' },

  list: { paddingHorizontal: 20, paddingBottom: 110 },

  titleBox:  { marginBottom: 12, marginTop: 4, paddingHorizontal: 20 },
  pageTitle: { color: WHITE,    fontSize: 18, fontFamily: 'Poppins_500Medium' },
  resultSub: { color: SUBTITLE, fontSize: 14, fontFamily: 'Poppins_500Medium' },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    borderRadius: 32, paddingHorizontal: 16, paddingVertical: 8,
    marginBottom: 12, backgroundColor: 'rgba(3,12,40,0.6)',
    overflow: 'hidden',
  },
  searchInput: { flex: 1, color: WHITE, fontSize: 12, fontFamily: 'Poppins_400Regular' },

  filterScroll:  { flexGrow: 0, marginBottom: 14 },
  filterContent: { gap: 10 },
  filterChipActive: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1, borderColor: BORDER,
  },
  filterChipInactive: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16, backgroundColor: DARK_NAV,
  },
  filterChip:    {},
  filterTxt:     { color: WHITE,  fontSize: 13, fontFamily: 'Poppins_500Medium' },
  filterTxtActive:{ color: ORANGE, fontFamily: 'Poppins_700Bold' },

  /* Vehicle card */
  card: {
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderRadius: 16, overflow: 'hidden', marginBottom: 16,
  },
  cardTop:   { flexDirection: 'row', gap: 10 },
  cardImgBox:{
    width: 120, alignSelf: 'stretch', flexShrink: 0,
    margin: 10, borderRadius: 12, overflow: 'hidden',
  },
  cardImgPh: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  cardInfo:  { flex: 1, gap: 4, paddingVertical: 10, paddingRight: 10 },
  cardTitle: { color: WHITE,  fontSize: 12, fontFamily: 'Poppins_500Medium', lineHeight: 17 },
  cardPrice: { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_700Bold' },

  metaRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:  { color: UNSELECT, fontSize: 10, fontFamily: 'Poppins_400Regular' },

  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(52,199,89,0.1)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 18,
  },
  availTxt:    { color: '#34c759', fontSize: 9, fontFamily: 'Poppins_500Medium' },
  deliveryTxt: { color: SUBTITLE,  fontSize: 8, fontFamily: 'Poppins_400Regular' },

  cardBtns:   { flexDirection: 'row', gap: 10, padding: 10, paddingTop: 6 },
  viewBtn:    { flex: 1, borderRadius: 16, overflow: 'hidden' },
  viewGrad:   { height: 32, alignItems: 'center', justifyContent: 'center' },
  viewTxt:    { color: WHITE, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  contactBtn: {
    flex: 1, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(29,83,175,1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 5,
  },
  contactTxt: { color: WHITE, fontSize: 11, fontFamily: 'Poppins_500Medium' },

  sectionTitle: {
    color: WHITE, fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    textTransform: 'capitalize',
    marginBottom: 12, marginTop: 8,
  },

  needsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  needCard: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  needGrad: { padding: 10, minHeight: 186, justifyContent: 'flex-end' },
  needTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  needTitle: { color: WHITE,    fontSize: 16, fontFamily: 'Poppins_500Medium', textTransform: 'capitalize' },
  needImg:   { width: 96, height: 70, marginBottom: 8 },
  needSub:   { color: UNSELECT, fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 14 },

  videoCard: {
    flexDirection: 'row', gap: 14,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 16, padding: 10, marginBottom: 10,
  },
  videoThumb: {
    width: 144, height: 117, borderRadius: 16, overflow: 'hidden', flexShrink: 0,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  playBtn: {
    position: 'absolute',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(3,42,105,0.83)',
    alignItems: 'center', justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 17,
  },
  durationTxt:  { color: WHITE, fontSize: 8, fontFamily: 'Poppins_400Regular' },
  videoInfo:    { flex: 1, justifyContent: 'center', gap: 6 },
  videoTitle:   { color: WHITE,    fontSize: 14, fontFamily: 'Poppins_500Medium' },
  videoSub:     { color: SUBTITLE, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  videoDivider: { height: 0.5, backgroundColor: BORDER },
  videoMeta:    { flexDirection: 'row', gap: 8 },
  videoMetaTxt: { color: SUBTITLE, fontSize: 8, fontFamily: 'Poppins_400Regular' },

  empty:    { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTxt: { color: SUBTITLE, fontSize: 15, fontFamily: 'Poppins_500Medium' },
});
