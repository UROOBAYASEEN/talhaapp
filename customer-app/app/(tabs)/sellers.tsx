import LightGradientBorder from '@/components/shared/LightGradientBorder';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAppColors } from '@/constants/theme';

const BG = '#010a1f';
const WHITE = '#f9fafc';
const SUBTITLE = '#baacb6';
const UNSELECT = '#d2d2d2';
const ORANGE = '#e2671b';
const NAVY = '#032a69';
const DARK_NAV = '#061b4a';
const BORDER = 'rgba(255,255,255,0.2)';


const IMG_COMPARE = require('@/assets/images/compareVehicle.png');
const IMG_INSURANCE = require('@/assets/images/compareInsurance.png');

const IMG_LOGO = require('@/assets/images/autowizor-logo-text.png');
const FALLBACK_CAR = require('@/assets/images/car1.png');
const ADD_MORE_ADS = require('@/assets/images/addmoreAds.png');
const SPEED_ICON = require('@/assets/Icons/speedIcon.png');
const PETROL_ICON = require('@/assets/Icons/petrolIcon.png');

// Dummy ads — shown only when the API returns no vehicles
const DUMMY_ADS = [
  { id: 'dummy-ad-1', isDummy: true, category: 'car', make: 'Honda', model: 'Civic', variant: 'Oriel 1.8 i-VTEC CVT', transmission: 'Automatic', title: 'Honda Civic Oriel 1.8 i-VTEC CVT', price: 6850000, year: 2021, mileage: 42000, fuel_type: 'Petrol', city: 'Karachi' },
  { id: 'dummy-ad-2', isDummy: true, category: 'car', make: 'Toyota', model: 'Corolla', variant: 'Altis Grande 1.8', transmission: 'Automatic', title: 'Toyota Corolla Altis Grande 1.8', price: 5975000, year: 2020, mileage: 58000, fuel_type: 'Petrol', city: 'Karachi' },
  { id: 'dummy-ad-3', isDummy: true, category: 'car', make: 'Suzuki', model: 'Alto', variant: 'VXL AGS', transmission: 'Automatic', title: 'Suzuki Alto VXL AGS', price: 2850000, year: 2022, mileage: 21000, fuel_type: 'Petrol', city: 'Lahore' },
  { id: 'dummy-ad-4', isDummy: true, category: 'car', make: 'Kia', model: 'Sportage', variant: 'AWD', transmission: 'Automatic', title: 'Kia Sportage AWD', price: 8450000, year: 2021, mileage: 35000, fuel_type: 'Petrol', city: 'Islamabad' },
];

function formatPrice(p: number) {
  if (p >= 10000000) return `PKR ${(p / 10000000).toFixed(2)} Crore`;
  if (p >= 100000) return `PKR ${(p / 100000).toFixed(2)} Lacs`;
  return `PKR ${p.toLocaleString()}`;
}

const SERVER_BASE = API_BASE.replace('/api/v1', '');
function imgUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith('file://')) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER_BASE}${url}`;
}

export default function AdsScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const insets = useSafeAreaInsets();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [openFilter, setOpenFilter] = useState<'Price' | 'Location' | 'Model' | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchVehicles = useCallback(async (p = 1, replace = true, filters = activeFilters, q_search = search) => {
    try {
      const q = new URLSearchParams({ page: String(p), limit: '10' });
      // Ads page: only non-dealership (individual seller) vehicles — no official dealership ads
      q.set('seller_type', 'individual');
      if (q_search) q.set('search', q_search);
      if (filters.cities?.length) q.set('city', filters.cities[0]);
      if (filters.models?.length) q.set('search', filters.models[0]);
      if (filters.minBudget > 0) q.set('min_price', String(filters.minBudget));
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

  const showDummy = !loading && vehicles.length === 0;

  const VehicleCard = ({ item }: { item: any }) => {
    const mileage = item.mileage ?? item.mileage_km ?? item.km_driven ?? item.distance_km ?? item.kilometers;
    const mileageNumber = Number(String(mileage ?? '').replace(/[^\d.]/g, ''));
    const mileageLabel = mileage != null && String(mileage).trim() ? `${Number.isFinite(mileageNumber) ? mileageNumber.toLocaleString() : String(mileage)}Km` : '210,000Km';
    const photo = imgUrl(item.images?.[0]);
    return (
      <View style={[styles.card, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? '#82a5d5' : 'transparent', shadowColor: aC.isDark ? '#638ed0' : 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: aC.isDark ? 0.15 : 0, shadowRadius: 5, elevation: aC.isDark ? 2 : 0 }, !aC.isDark && { borderWidth: 0, marginBottom: 16, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
        {aC.isDark ? (
          <>
            <LinearGradient colors={['#16408880', 'transparent', 'transparent', '#16408880']} locations={[0, 0.12, 0.88, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['#16408880', 'transparent', 'transparent', '#16408880']} locations={[0, 0.05, 0.95, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        ) : (
          <LightGradientBorder radius={16} fill="#ffffff" colors={['rgba(3,42,105,0.45)', 'rgba(226,103,27,0.55)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        )}
        <View style={styles.cardTop}>
          {/* Image — database photo, fallback to local asset */}
          <View style={styles.cardImgBox}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.cardCarImage} resizeMode="cover" />
            ) : (
              <Image source={FALLBACK_CAR} style={styles.cardCarImage} resizeMode="contain" />
            )}
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: aC.textPrimary }]} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>

            {/* Year + KM */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar" size={14} color={ORANGE} />
                <Text style={[styles.metaTxt, { color: aC.isDark ? aC.textSecondary : '#000000' }]}>{item.year}</Text>
              </View>
              <View style={styles.metaItem}>
                <Image source={SPEED_ICON} style={styles.metaIcon} resizeMode="contain" />
                <Text style={[styles.metaTxt, { color: aC.isDark ? aC.textSecondary : '#000000' }]} numberOfLines={1}>{mileageLabel}</Text>
              </View>
            </View>

            {/* Fuel + City */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Image source={PETROL_ICON} style={styles.metaIcon} resizeMode="contain" />
                <Text style={[styles.metaTxt, { color: aC.isDark ? aC.textSecondary : '#000000' }]}>{item.fuel_type || 'Petrol'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={15} color={ORANGE} />
                <Text style={[styles.metaTxt, { color: aC.isDark ? aC.textSecondary : '#000000' }]}>{item.city || 'Pakistan'}</Text>
              </View>
            </View>

            {/* Available badge */}
            <View style={styles.statusRow}>
              <View style={[styles.availBadge, !aC.isDark && { backgroundColor: '#DDF5E5' }]}>
                <Ionicons name="checkmark-circle" size={13} color="#28c76f" />
                <Text style={styles.availTxt}>Available</Text>
              </View>
              <Text numberOfLines={1} style={[styles.deliveryTxt, { color: aC.isDark ? aC.textSecondary : '#000000' }]}>Delivery: Immediate</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.cardBtns}>
          <TouchableOpacity
            style={[styles.viewBtn, !aC.isDark && { boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/buy/car-detail', params: { id: item.id, from: 'usedCar', ...(item.isDummy ? { dummy: JSON.stringify(item) } : {}) } } as any)}
          >
            <LinearGradient
              colors={aC.isDark ? [NAVY, ORANGE] : ['#27467F', '#FF9654']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.viewGrad}
            >
              <Text style={styles.viewTxt}>View Details</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.contactBtn, { backgroundColor: aC.isDark ? '#081b3c' : '#ffffff', borderColor: aC.isDark ? '#83a8db' : 'transparent' }, !aC.isDark && { borderWidth: 0, shadowOpacity: 0, elevation: 0 }]} activeOpacity={0.85}>
            {!aC.isDark && <LightGradientBorder radius={16} fill="#ffffff" colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />}
            {aC.isDark && <LinearGradient colors={['rgba(40,86,158,0.72)', 'rgba(0,0,0,0.22)', 'rgba(21,54,110,0.32)']} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
            <Text style={[styles.contactTxt, { color: aC.isDark ? '#f9fafc' : '#000000' }]}>Contact Seller</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={25} color={aC.isDark ? '#baacb6' : aC.textPrimary} />
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
          <Ionicons name="heart" size={25} color={ORANGE} />
          <Text style={[styles.heartCount, !aC.isDark && { color: '#032a69' }]}>3</Text>
        </View>
      </View>

      <FlatList
        data={showDummy ? DUMMY_ADS : vehicles}
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
              <Text style={[styles.resultSub, { color: aC.isDark ? aC.textSecondary : '#000000' }]}>{(showDummy ? DUMMY_ADS.length : total).toLocaleString()} Results Found in karachi</Text>
            </View>


            {/* Search */}
            <View style={[styles.searchBox, { backgroundColor: aC.isDark ? '#0a1b3a' : '#ffffff', borderColor: aC.isDark ? '#82a5d5' : 'rgba(0,0,0,0.1)', shadowColor: aC.isDark ? '#7ba8ed' : 'transparent', shadowOpacity: aC.isDark ? 0.18 : 0, shadowRadius: 4, elevation: aC.isDark ? 2 : 0 }, !aC.isDark && { marginBottom: 16, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
              {aC.isDark ? (
                <>
                  <LinearGradient colors={['rgba(53,105,186,0.42)', 'rgba(14,34,75,0.16)', 'rgba(0,0,0,0.16)', 'rgba(14,34,75,0.16)', 'rgba(53,105,186,0.34)']} locations={[0, 0.14, 0.5, 0.86, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['rgba(52,104,184,0.22)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.12)', 'rgba(52,104,184,0.22)']} locations={[0, 0.12, 0.88, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              ) : null}
              <Ionicons name="search-outline" size={18} color={aC.isDark ? aC.textSecondary : '#000000'} />
              <TextInput
                style={[styles.searchInput, { color: aC.textPrimary }]}
                placeholder="Search cars, banks & dealers..."
                placeholderTextColor={aC.isDark ? aC.textSecondary : '#000000'}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
            </View>

            {/* Ads filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
              {(['All', 'Price', 'Location', 'Model'] as const).map(label => {
                const selected = selectedFilter === label;
                return (
                  <TouchableOpacity
                    key={label}
                    activeOpacity={0.85}
                    style={[styles.filterChip, selected ? styles.filterChipActive : styles.filterChipInactive, !aC.isDark && (selected ? { backgroundColor: '#F2F4F8', borderColor: 'transparent', boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' } : { backgroundColor: '#F7F8FA', borderColor: 'transparent' })]}
                    onPress={() => {
                      if (label === 'All') {
                        setOpenFilter(null);
                        setSelectedFilter('All');
                        handleFilterApply({});
                      } else {
                        // Highlight the tapped menu right away, then show its options
                        setSelectedFilter(label);
                        setOpenFilter(openFilter === label ? null : label);
                      }
                    }}
                  >
                    {aC.isDark && <LinearGradient colors={['#214779', '#071733', '#0a1d40']} style={[StyleSheet.absoluteFillObject, { opacity: selected ? 1 : 0 }]} pointerEvents="none" />}
                    <Text style={[styles.filterTxt, !aC.isDark && { color: '#000000' }, selected && styles.filterTxtActive]}>{label}</Text>
                    <Ionicons name="chevron-down" size={17} color={aC.isDark ? WHITE : selected ? ORANGE : '#000000'} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {openFilter && (
              <View style={[styles.filterOptions, { backgroundColor: aC.isDark ? '#071a3b' : '#ffffff' }]}>
                {(openFilter === 'Price'
                  ? ['Any Price', 'Under 10 Lacs', '10–30 Lacs', '30–50 Lacs', '50 Lacs and above']
                  : openFilter === 'Location'
                    ? ['All Locations', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi']
                    : ['All Models', 'Civic', 'City', 'Corolla', 'Alto', 'Cultus']
                ).map((option, index) => (
                  <TouchableOpacity key={option} style={styles.filterOption} onPress={() => {
                    const next = { ...activeFilters };
                    if (openFilter === 'Price') {
                      const ranges = [[0, 50_000_000], [0, 999_999], [1_000_000, 3_000_000], [3_000_000, 5_000_000], [5_000_000, 50_000_000]];
                      [next.minBudget, next.maxBudget] = ranges[index];
                    } else if (openFilter === 'Location') {
                      next.cities = index === 0 ? [] : [option];
                    } else {
                      next.models = index === 0 ? [] : [option];
                    }
                    setSelectedFilter(index === 0 ? 'All' : openFilter);
                    setOpenFilter(null);
                    handleFilterApply(next);
                  }}>
                    <Text style={[styles.filterOptionText, { color: aC.textPrimary }]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}


            {loading && <ActivityIndicator color={ORANGE} style={{ marginVertical: 24 }} />}
          </>
        }
        ListFooterComponent={
          !loading ? (
            <>
              {loadingMore && <ActivityIndicator color={ORANGE} style={{ marginVertical: 16 }} />}

              {/* You May Need This */}
              <Text style={[styles.sectionTitle, { color: aC.textPrimary, fontSize: 17, marginBottom: 14 }]}>You May Need This</Text>
              <View style={styles.needsRow}>
                <TouchableOpacity style={[styles.needCard, { backgroundColor: aC.isDark ? '#010A1F' : '#FFFFFF' }, !aC.isDark && { borderRadius: 16, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]} activeOpacity={0.85}>
                  <LinearGradient
                    colors={aC.isDark ? ['#051539', '#061A44', '#0D1E47', '#2A2941', '#4E343A', '#653D37'] : ['#F4F7FA', '#F4F7FA', '#FFB5875C']}
                    locations={aC.isDark ? [0, 0.36, 0.52, 0.68, 0.86, 1] : [0, 0.4, 1]}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    style={[StyleSheet.absoluteFillObject, styles.needGradBg, !aC.isDark && { borderRadius: 16 }]}
                    pointerEvents="none"
                  />
                  <View style={styles.needGrad}>
                    <View style={styles.needImgWrap}>
                      <Image source={IMG_COMPARE} style={styles.needImg} resizeMode="contain" />
                    </View>
                    <View style={styles.needTitleRow}>
                      <Text style={[styles.needTitle, { color: aC.isDark ? '#f9fafc' : '#000000' }]} numberOfLines={2}>{'Compare\nVehicle'}</Text>
                      <Ionicons name="chevron-forward" size={18} color="#e2671b" />
                    </View>
                    <Text style={[styles.needSub, { color: aC.isDark ? '#c9c1cb' : '#000000' }]} numberOfLines={3}>Compare and choose the vehicle that best fits your needs.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.needCard, { backgroundColor: aC.isDark ? '#010A1F' : '#FFFFFF' }, !aC.isDark && { borderRadius: 16, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]} activeOpacity={0.85}>
                  <LinearGradient
                    colors={aC.isDark ? ['#051539', '#061A44', '#0D1E47', '#2A2941', '#4E343A', '#653D37'] : ['#F4F7FA', '#F4F7FA', '#FFB5875C']}
                    locations={aC.isDark ? [0, 0.36, 0.52, 0.68, 0.86, 1] : [0, 0.4, 1]}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    style={[StyleSheet.absoluteFillObject, styles.needGradBg, !aC.isDark && { borderRadius: 16 }]}
                    pointerEvents="none"
                  />
                  <View style={styles.needGrad}>
                    <View style={styles.needImgWrap}>
                      <Image source={IMG_INSURANCE} style={styles.needImg} resizeMode="contain" />
                    </View>
                    <View style={styles.needTitleRow}>
                      <Text style={[styles.needTitle, { color: aC.isDark ? '#f9fafc' : '#000000' }]} numberOfLines={2}>{'Compare\nInsurance'}</Text>
                      <Ionicons name="chevron-forward" size={18} color="#e2671b" />
                    </View>
                    <Text style={[styles.needSub, { color: aC.isDark ? '#c9c1cb' : '#000000' }]} numberOfLines={3}>Compare plans, coverage, and benefits to find the right insurance.</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <BrowseMoreServices />
              <LatestVideoSection count={2} savedCardStyle />
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
      <TouchableOpacity
        // Pill tab bar: bottom = inset + 4, height 63 — button uske thora uper
        style={[styles.addMoreAdsButton, { bottom: insets.bottom + 4 + 63 + 14 }, !aC.isDark && { elevation: 0 }]}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Add new ad"
        onPress={() => router.push('/vehicle/create')}
      >
        <Image source={ADD_MORE_ADS} style={styles.addMoreAdsImage} resizeMode="contain" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  addMoreAdsButton: {
    position: 'absolute', right: 16, bottom: 88,
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10, elevation: 8,
  },
  addMoreAdsImage: { width: 60, height: 60 },

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
  heartWrap: { width: 28, height: 29, alignItems: 'center', justifyContent: 'center' },
  heartCount: { position: 'absolute', right: 0, bottom: 0, color: WHITE, fontSize: 9, fontFamily: 'Poppins_600SemiBold' },

  list: { paddingHorizontal: 20, paddingBottom: 110 },

  titleBox: { marginBottom: 12, marginTop: 4, paddingHorizontal: 0 },
  pageTitle: { color: WHITE, fontSize: 18, fontFamily: 'Poppins_500Medium' },
  resultSub: { color: SUBTITLE, fontSize: 14, fontFamily: 'Poppins_500Medium' },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    borderRadius: 32, paddingHorizontal: 20, height: 50,
    marginBottom: 12, backgroundColor: 'rgba(3,12,40,0.6)',
    overflow: 'hidden',
  },
  searchInput: { flex: 1, color: WHITE, fontSize: 12, fontFamily: 'Poppins_400Regular' },

  filterScroll: { flexGrow: 0, marginBottom: 6, marginHorizontal: -20 },
  filterContent: { gap: 12, paddingHorizontal: 20, paddingBottom: 8 },
  filterChipActive: {
    borderWidth: 1, borderColor: '#7298cf', backgroundColor: '#0b2048', overflow: 'hidden',
  },
  filterChipInactive: {
    // same border width as the active chip (transparent) so toggling doesn't change the layout
    borderWidth: 1, borderColor: 'transparent', backgroundColor: '#061b4a', overflow: 'hidden',
  },
  filterChip: { height: 48, paddingHorizontal: 17, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden' },
  filterTxt: { color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  filterTxtActive: { color: ORANGE, fontFamily: 'Poppins_700Bold' },
  filterOptions: { borderWidth: 1, borderColor: '#7298cf', borderRadius: 14, marginBottom: 14, overflow: 'hidden' },
  filterOption: { paddingHorizontal: 16, paddingVertical: 10 },
  filterOptionText: { fontSize: 13, fontFamily: 'Poppins_500Medium' },

  /* Vehicle card */
  card: {
    borderWidth: 1, borderColor: '#82a5d5',
    backgroundColor: '#020d25',
    borderRadius: 16, overflow: 'hidden', marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  cardImgBox: {
    width: 122, height: 108, flexShrink: 0,
    marginLeft: 10, marginTop: 10, borderRadius: 13, overflow: 'hidden', backgroundColor: '#07152d',
  },
  cardCarImage: { width: '100%', height: '100%' },
  cardImgPh: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 5, paddingTop: 9, paddingRight: 10 },
  cardTitle: { color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium', lineHeight: 19 },
  cardPrice: { color: ORANGE, fontSize: 12, fontFamily: 'Poppins_700Bold', marginBottom: 4 },

  metaRow: { flexDirection: 'row', gap: 4 },
  metaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaIcon: { width: 15, height: 15 },
  metaTxt: { color: UNSELECT, fontSize: 11, fontFamily: 'Poppins_400Regular', flexShrink: 1 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'nowrap' },
  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,65,57,0.42)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 18, flexShrink: 0,
  },
  availTxt: { color: '#28c76f', fontSize: 9, fontFamily: 'Poppins_500Medium' },
  deliveryTxt: { color: SUBTITLE, fontSize: 8, fontFamily: 'Poppins_400Regular', flexShrink: 1 },

  cardBtns: { flexDirection: 'row', gap: 11, paddingHorizontal: 10, paddingBottom: 11, paddingTop: 12 },
  viewBtn: { flex: 1, borderRadius: 24, overflow: 'hidden' },
  viewGrad: { height: 31, alignItems: 'center', justifyContent: 'center' },
  viewTxt: { color: WHITE, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  contactBtn: {
    flex: 1, height: 31, borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(29,83,175,1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  contactTxt: { color: WHITE, fontSize: 12, fontFamily: 'Poppins_500Medium' },

  sectionTitle: {
    color: WHITE, fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    textTransform: 'capitalize',
    marginBottom: 12, marginTop: 8,
  },

  // "You May Need This" — Home (components/shared/YouMayNeedThis.tsx) jaisa styling
  needsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  needCard: { flex: 1, height: 190, borderRadius: 12 },
  needGradBg: { borderRadius: 12 },
  needGrad: { flex: 1, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8, justifyContent: 'flex-start' },
  needImgWrap: { height: 74, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  needTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 2,
  },
  needTitle: { color: WHITE, fontSize: 13, lineHeight: 19, fontFamily: 'Poppins_500Medium', flex: 1 },
  needImg: { width: 96, height: 70 },
  needSub: { color: '#c9c1cb', fontSize: 9.5, fontFamily: 'Poppins_400Regular', lineHeight: 14 },

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
  durationTxt: { color: WHITE, fontSize: 8, fontFamily: 'Poppins_400Regular' },
  videoInfo: { flex: 1, justifyContent: 'center', gap: 6 },
  videoTitle: { color: WHITE, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  videoSub: { color: SUBTITLE, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  videoDivider: { height: 0.5, backgroundColor: BORDER },
  videoMeta: { flexDirection: 'row', gap: 8 },
  videoMetaTxt: { color: SUBTITLE, fontSize: 8, fontFamily: 'Poppins_400Regular' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTxt: { color: SUBTITLE, fontSize: 15, fontFamily: 'Poppins_500Medium' },
});
