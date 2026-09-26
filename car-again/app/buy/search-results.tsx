import { Ionicons } from '@expo/vector-icons';
import BrowseMoreServices from '@/components/shared/BrowseMoreServices';
import LatestVideoSection from '@/components/shared/LatestVideoSection';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import FilterBar from '@/components/shared/FilterBar';
import { useAppColors } from '@/constants/theme';

const { width } = Dimensions.get('window');

const VIDEO_IMAGE =
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=700&q=80';

const SERVER_BASE = API_BASE.replace('/api/v1', '');
function imgUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER_BASE}${url}`;
}

function formatPrice(p: number) {
  if (p >= 10000000) return `PKR ${(p / 10000000).toFixed(1)} Crore`;
  if (p >= 100000)   return `PKR ${(p / 100000).toFixed(1)} Lacs`;
  return `PKR ${p.toLocaleString()}`;
}

// ── Car Card ─────────────────────────────────────────────────────────────────
function CarCard({ item, onPress, onSave, saved }: {
  item: any; onPress: () => void; onSave: () => void; saved: boolean;
}) {
  const aC = useAppColors();
  const carImg = imgUrl(item.images?.[0]);

  if (aC.isDark) {
    return (
      <LinearGradient
        colors={['#0A285B', '#071A3B', '#071B3D']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.carCard}
      >
      <View style={styles.carTop}>
        {/* Image */}
        <View style={styles.carImageWrap}>
          {carImg ? (
            <Image source={{ uri: carImg }} style={styles.carImage} resizeMode="cover" />
          ) : (
            <View style={[styles.carImage, { alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="car-outline" size={32} color="#929DB1" />
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.carDetails}>
          <Text style={styles.carTitle} numberOfLines={2}>
            {item.title || `${item.make} ${item.model}`}
          </Text>
          <Text style={styles.carColor}>{item.color || '—'}</Text>

          <View style={styles.dealerRow}>
            <Text style={styles.dealer}>
              {item.seller?.full_name || 'Seller'}
            </Text>
            <Ionicons name="checkmark-circle" size={16} color="#05AFFF" />
          </View>

          <Text style={styles.carMeta}>
            {item.city || 'Pakistan'} • {item.year} • {item.transmission || 'CVT'}
          </Text>

          <View style={styles.availableRow}>
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Available</Text>
            </View>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
          </View>
        </View>

        {/* Heart */}
        <TouchableOpacity style={styles.heartButton} onPress={onSave}>
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={22}
            color={saved ? '#ff4d6d' : '#FF7600'}
          />
        </TouchableOpacity>
      </View>

      {/* Buttons */}
      <View style={styles.cardButtons}>
        <TouchableOpacity style={styles.detailsButton} onPress={onPress} activeOpacity={0.85}>
          <LinearGradient
            colors={['#073C8E', '#F46A19']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>View Details</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactButton} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Contact Dealer</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
    );
  }
  // Light — white card with subtle blue/orange shade
  return (
    <View style={[styles.carCard, { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)', shadowColor: 'rgba(3,42,105,0.12)', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, overflow: 'hidden' }]}>
      <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <View style={styles.carTop}>
        <View style={[styles.carImageWrap, { backgroundColor: '#f1f5f9' }]}>
          {carImg ? (
            <Image source={{ uri: carImg }} style={styles.carImage} resizeMode="cover" />
          ) : (
            <View style={[styles.carImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="car-outline" size={32} color="#94a3b8" />
            </View>
          )}
        </View>
        <View style={styles.carDetails}>
          <Text style={[styles.carTitle, { color: '#010a1f' }]} numberOfLines={2}>{item.title || `${item.make} ${item.model}`}</Text>
          <Text style={[styles.carColor, { color: '#475569' }]}>{item.color || '—'}</Text>
          <View style={styles.dealerRow}>
            <Text style={[styles.dealer, { color: '#010a1f' }]}>{item.seller?.full_name || 'Seller'}</Text>
            <Ionicons name="checkmark-circle" size={16} color="#05AFFF" />
          </View>
          <Text style={[styles.carMeta, { color: '#64748b' }]}>{item.city || 'Pakistan'} • {item.year} • {item.transmission || 'CVT'}</Text>
          <View style={styles.availableRow}>
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Available</Text>
            </View>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.heartButton, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(3,42,105,0.12)' }]} onPress={onSave}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? '#ff4d6d' : '#e2671b'} />
        </TouchableOpacity>
      </View>
      <View style={styles.cardButtons}>
        <TouchableOpacity style={styles.detailsButton} onPress={onPress} activeOpacity={0.85}>
          <LinearGradient colors={['#073C8E', '#F46A19']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
            <Text style={styles.buttonText}>View Details</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.contactButton, { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)' }]} activeOpacity={0.85}>
          <Text style={[styles.buttonText, { color: '#032a69' }]}>Contact Dealer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Video Card ────────────────────────────────────────────────────────────────
function VideoCard() {
  return (
    <LinearGradient
      colors={['#0A285A', '#071B3D', '#061735']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.videoCard}
    >
      <View style={styles.thumbnailWrapper}>
        <Image source={{ uri: VIDEO_IMAGE }} style={styles.thumbnail} resizeMode="cover" />
        <View style={styles.playButton}>
          <Ionicons name="play" size={16} color="#fff" />
        </View>
        <View style={styles.duration}>
          <Text style={styles.durationText}>12:45</Text>
        </View>
      </View>

      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>2026 Honda Civic</Text>
        <Text style={styles.videoSubtitle}>4K Walkaround Review</Text>
        <View style={styles.videoMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={11} color="#FF7200" />
            <Text style={styles.metaText}>245k Views</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={11} color="#FF7200" />
            <Text style={styles.metaText}>2 days ago</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.watchButton}>
          <Text style={styles.watchText}>Watch Video</Text>
          <Ionicons name="chevron-forward" size={14} color="#FF5500" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function SearchResultsScreen() {
  const router  = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();
  const params  = useLocalSearchParams<{
    city?: string; car?: string; variant?: string;
    year?: string; color?: string; sellerType?: string;
    brand?: string; dealerId?: string; make?: string;
    condition?: string; min_price?: string; max_price?: string;
    search?: string; hot?: string; category?: string; featured?: string;
  }>();

  const isHot = params.hot === 'true' || params.hot === '1';

  const [vehicles,    setVehicles]    = useState<any[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasNext,     setHasNext]     = useState(false);
  const [search,        setSearch]        = useState(params.search || '');
  const [savedIds,      setSavedIds]      = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<any>({});

  const fetchVehicles = useCallback(async (p = 1, replace = true, q = search, filters = activeFilters) => {
    try {
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

      // Hot Selling mode — sirf paid ads (AdPromotion success)
      if (isHot) {
        const hotQuery = new URLSearchParams({ limit: '50' });
        if (params.condition) hotQuery.set('condition', params.condition);
        if (params.category)  hotQuery.set('category',  params.category);
        const res = await fetch(`${API_BASE}/ads/hot-selling?${hotQuery}`, { headers });
        if (res.ok) {
          const data = await res.json();
          let items = data.items || data || [];
          // client-side search filter
          if (q) {
            const needle = q.toLowerCase();
            items = items.filter((v: any) =>
              (v.title || '').toLowerCase().includes(needle) ||
              (v.make || '').toLowerCase().includes(needle) ||
              (v.model || '').toLowerCase().includes(needle),
            );
          }
          setVehicles(items);
          setTotal(items.length);
          setHasNext(false);
          setPage(1);
        }
        return;
      }

      const query = new URLSearchParams({ page: String(p), limit: '10' });
      if (params.condition)  query.set('condition',  params.condition);
      if (params.category)   query.set('category',   params.category);
      if (params.dealerId)   query.set('seller_id',  params.dealerId);
      // URL params (from used-car search form)
      if (params.min_price)  query.set('min_price',  params.min_price);
      if (params.max_price)  query.set('max_price',  params.max_price);
      if (q) query.set('search', q);
      // FilterBar filters (override URL params if set)
      if (filters.cities?.length)              query.set('city',      filters.cities[0]);
      if (filters.models?.length)              query.set('search',    filters.models[0]);
      if (filters.minBudget > 0)               query.set('min_price', String(filters.minBudget));
      if (filters.maxBudget < 50_000_000)      query.set('max_price', String(filters.maxBudget));
      if (filters.minYear && filters.minYear > 1990) query.set('year', String(filters.minYear));

      const res = await fetch(`${API_BASE}/vehicles?${query}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setVehicles(prev => replace ? data.items : [...prev, ...data.items]);
        setTotal(data.total);
        setHasNext(data.has_next);
        setPage(p);
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, [params, search, token, activeFilters, isHot]);

  useEffect(() => { fetchVehicles(1, true, search, activeFilters); }, []);

  function handleSearch(text: string) {
    setSearch(text);
    setLoading(true);
    fetchVehicles(1, true, text, activeFilters);
  }

  function handleFilterApply(filters: any) {
    setActiveFilters(filters);
    setLoading(true);
    fetchVehicles(1, true, search, filters);
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
          const s = new Set(prev);
          if (d.saved) s.add(id); else s.delete(id);
          return s;
        });
      }
    } catch { /* offline */ }
  }

  const city = params.city || 'Pakistan';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      <FlatList
        data={vehicles}
        keyExtractor={i => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchVehicles(1, true); }}
            tintColor="#e2671b"
          />
        }

        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={27} color={aC.isDark ? "#C8D1E5" : "#010a1f"} />
              </TouchableOpacity>
              <Text style={[styles.logo, { color: aC.isDark ? '#FFFFFF' : '#010a1f' }]}>
                Auto<Text style={styles.logoOrange}>wizor</Text>
              </Text>
              <View style={{ width: 35 }} />
            </View>

            {/* Heading */}
            <View style={styles.headingContainer}>
              <Text style={[styles.heading, { color: aC.isDark ? '#FFFFFF' : '#010a1f' }]}>{isHot ? (params.category === 'bike' ? 'Hot Selling Bikes' : 'Hot Selling Cars') : (params.category === 'bike' ? `Bikes In ${city}` : `Cars In ${city}`)}</Text>
              <Text style={[styles.results, { color: aC.isDark ? '#AEB4C3' : '#64748b' }]}>{total} Results Found</Text>
            </View>

            {/* Filter Bar */}
            <FilterBar onApply={handleFilterApply} activeFilters={activeFilters} />

            {/* Search */}
            <View style={styles.searchWrapper}>
              {aC.isDark ? (
                <LinearGradient
                  colors={['#092354', '#071A3D', '#0A2653']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.searchBox}
                >
                  <Ionicons name="search-outline" size={20} color="#D8E1F2" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search cars, banks & dealers..."
                    placeholderTextColor="#9EA7BA"
                    value={search}
                    onChangeText={handleSearch}
                  />
                </LinearGradient>
              ) : (
                <View style={[styles.searchBox, { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)', shadowColor: 'rgba(3,42,105,0.12)', shadowOpacity: 0.08, elevation: 3, overflow: 'hidden' }]}>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <Ionicons name="search-outline" size={20} color="#64748b" />
                  <TextInput
                    style={[styles.searchInput, { color: '#010a1f' }]}
                    placeholder="Search cars, banks & dealers..."
                    placeholderTextColor="#94a3b8"
                    value={search}
                    onChangeText={handleSearch}
                  />
                </View>
              )}
            </View>

            {loading && <ActivityIndicator color="#e2671b" style={{ marginVertical: 24 }} />}
          </>
        }

        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Ionicons name="car-outline" size={52} color="#929DB1" />
              <Text style={styles.emptyText}>No cars found</Text>
              <Text style={styles.emptySubText}>Try a different search</Text>
            </View>
          ) : null
        }

        ListFooterComponent={
          <>
            {loadingMore && <ActivityIndicator color="#e2671b" style={{ marginVertical: 12 }} />}

            {!loading && (
              <>
                <BrowseMoreServices />
                <LatestVideoSection count={2} />
              </>
            )}

            <View style={{ height: 40 }} />
          </>
        }

        renderItem={({ item }) => (
          <CarCard
            item={item}
            saved={savedIds.has(item.id)}
            onPress={() => router.push({ pathname: '/buy/car-detail', params: { id: item.id } } as any)}
            onSave={() => toggleSave(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: '#020B20' },
  content:   { paddingHorizontal: 20, paddingBottom: 30 },

  /* Header */
  header:     { height: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 35, height: 35, justifyContent: 'center' },
  logo:       { fontSize: 21, fontFamily: 'Poppins_700Bold', color: '#FFFFFF', marginTop: 10 },
  logoOrange: { color: '#FF6A00' },

  /* Heading */
  headingContainer: { marginTop: 10, marginBottom: 20 },
  heading:   { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  results:   { color: '#AEB4C3', fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 3 },

  /* Search — thora neechy (user request) */
  searchWrapper: { marginBottom: 20, marginTop: 10 },
  searchBox: {
    height: 47, borderRadius: 25, borderWidth: 1,
    borderColor: '#6EA7EF', flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 19,
    shadowColor: '#1B74FF', shadowOpacity: 0.25,
    shadowRadius: 8, elevation: 5,
  },
  searchInput: { flex: 1, color: '#f9fafc', fontSize: 12, fontFamily: 'Poppins_400Regular', marginLeft: 12 },

  /* Car Card */
  carCard: {
    borderRadius: 16, borderWidth: 1,
    borderColor: '#5C8ECF', padding: 11,
    marginBottom: 20, overflow: 'hidden',
  },
  carTop:      { flexDirection: 'row', minHeight: 124 },
  carImageWrap:{ width: 129, height: 112, borderRadius: 10, overflow: 'hidden', backgroundColor: '#17243B' },
  carImage:    { width: 129, height: 112 },
  carDetails:  { flex: 1, paddingLeft: 10, paddingRight: 24 },
  carTitle:    { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins_500Medium', marginTop: 2 },
  carColor:    { color: '#FFFFFF', fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  dealerRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dealer:      { color: '#FFFFFF', fontSize: 10, fontFamily: 'Poppins_400Regular' },
  carMeta:     { color: '#929DB1', fontSize: 9, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  availableRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  availableBadge: { backgroundColor: '#003D32', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  availableText:  { color: '#00B982', fontSize: 8, fontFamily: 'Poppins_500Medium' },
  price:          { color: '#FF7200', fontSize: 11, fontFamily: 'Poppins_700Bold' },
  heartButton:    { position: 'absolute', right: 3, top: 44 },

  /* Card buttons */
  cardButtons:   { flexDirection: 'row', gap: 12, marginTop: 10 },
  detailsButton: { flex: 1, height: 34, borderRadius: 18, overflow: 'hidden' },
  gradientButton:{ height: '100%', alignItems: 'center', justifyContent: 'center' },
  contactButton: {
    flex: 1, height: 34, borderRadius: 18,
    borderWidth: 1, borderColor: '#6297DE',
    backgroundColor: '#08204A',
    justifyContent: 'center', alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins_500Medium' },

  /* Empty */
  emptyBox:      { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText:     { color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium' },
  emptySubText:  { color: '#929DB1', fontSize: 13, fontFamily: 'Poppins_400Regular' },

  /* Sections */
  sectionHeader: { marginTop: 16, marginBottom: 14 },
  sectionTitle:  { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_500Medium' },
  utilityRow:    { flexDirection: 'row', gap: 16 },
  utilityCard:   {
    flex: 1, minHeight: 186, borderRadius: 16,
    padding: 12, overflow: 'hidden',
  },
  utilityTitle:      { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold', lineHeight: 20, marginTop: 4 },
  utilityDescription:{ color: '#9BA6B9', fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 14, marginTop: 6 },
  utilityArrow:      { position: 'absolute', right: 10, bottom: 34 },

  /* Video */
  videoHeader:      { marginTop: 28, marginBottom: 14 },
  videoCard:        {
    height: 148, borderRadius: 15, borderWidth: 1,
    borderColor: '#5B8DCE', padding: 10,
    flexDirection: 'row', marginBottom: 15, overflow: 'hidden',
  },
  thumbnailWrapper: { width: 143, height: 126, borderRadius: 12, overflow: 'hidden' },
  thumbnail:        { width: '100%', height: '100%' },
  playButton:       {
    position: 'absolute', left: '50%', top: '50%',
    marginLeft: -19, marginTop: -19,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(12,54,105,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  duration:     {
    position: 'absolute', right: 5, bottom: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  durationText: { color: '#fff', fontSize: 8, fontFamily: 'Poppins_400Regular' },
  videoInfo:    { flex: 1, paddingLeft: 13, paddingTop: 10 },
  videoTitle:   { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  videoSubtitle:{ color: '#A4ABBA', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 8 },
  videoMeta:    { flexDirection: 'row', gap: 9, marginTop: 9 },
  metaItem:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:     { color: '#9099AC', fontSize: 8, fontFamily: 'Poppins_400Regular' },
  watchButton:  { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 18 },
  watchText:    { color: '#FF4E00', fontSize: 9, fontFamily: 'Poppins_600SemiBold' },
});
