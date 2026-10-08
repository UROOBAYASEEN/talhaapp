import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import BasicDetailsModal from './BasicDetailsModal';
import BrowseMoreServices from '@/components/shared/BrowseMoreServices';
import LatestVideoSection from '@/components/shared/LatestVideoSection';
import AskariBank from '@/components/shared/AskariBank';
import { useAppColors } from '@/constants/theme';

const { width: W } = Dimensions.get('window');

const BG       = '#010a1f';
const WHITE    = '#f9fafc';
const SUBTITLE = '#baacb6';
const ORANGE   = '#e2671b';
const NAVY     = '#032a69';
const DARK_NAV = '#061b4a';

const IMG_COMPARE  = require('@/screenshot/comparevehcile.png');
const IMG_FINANCE  = require('@/screenshot/smartcalculator.png');

const BROWSE_SERVICES = [
  {
    icon: 'business-outline' as const,
    title: 'Apply for Auto Financing',
    sub: 'Submit your financing application online in just a few easy steps.',
    route: '/(tabs)/sellers',
    params: { role: 'bank_representative' },
  },
  {
    icon: 'location-outline' as const,
    title: 'Get an Installation Tracker for Your Vehicle',
    sub: 'Compare Prices and Schedule Installation.',
    route: '/(tabs)/sellers',
    params: { role: 'tracker_provider' },
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Protect Your Vehicle with Insurance',
    sub: 'Pick the Right Coverage and Get Insured Easily.',
    route: '/(tabs)/sellers',
    params: { role: 'insurance_provider' },
  },
];

function formatPrice(p: number) {
  if (p >= 10000000) return `PKR ${(p / 10000000).toFixed(1)} Crore`;
  if (p >= 100000)   return `PKR ${(p / 100000).toFixed(1)} Lacs`;
  return `PKR ${p.toLocaleString()}`;
}

const SERVER_BASE = API_BASE.replace('/api/v1', '');
function imgUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith('file://')) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER_BASE}${url}`;
}

// ── Section header ───────────────────────────────────────────────────────────
function SH({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  const aC = useAppColors();
  return (
    <View style={sh.row}>
      <Text style={[sh.title, { color: aC.isDark ? WHITE : '#010a1f' }]}>{title}</Text>
      {onViewAll && (
        <TouchableOpacity style={sh.right} onPress={onViewAll}>
          <Text style={sh.viewAll}>View all</Text>
          <Ionicons name="chevron-forward" size={14} color={ORANGE} />
        </TouchableOpacity>
      )}
    </View>
  );
}
const sh = StyleSheet.create({
  row:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:   { color: WHITE, fontSize: 16, fontFamily: 'Poppins_500Medium', textTransform: 'capitalize' },
  right:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAll: { color: ORANGE, fontSize: 12, fontFamily: 'Poppins_500Medium' },
});

// ── Vehicle Card — HTML structure ke exact match ─────────────────────────────
function VehicleCard({
  item, onPress, onSave, saved,
}: {
  item: any; onPress: () => void; onSave: () => void; saved: boolean;
}) {
  const aC = useAppColors();
  const carName  = item.make
    ? `${item.make} ${item.model || ''}`.trim()
    : item.title?.split(' ').slice(0, 2).join(' ') || 'Vehicle';
  const variant  = item.variant || item.transmission || item.fuel_type || '—';
  const city     = item.city || 'Pakistan';
  const year     = String(item.year || '');
  const trans    = item.transmission || 'CVT';

  return (
    // .car-card — light: white + orange shade, dark: navy glass
    <TouchableOpacity style={[vc.carCard, { backgroundColor: aC.isDark ? BG : '#ffffff', borderColor: aC.isDark ? '#82a5d5' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? '#1D53AF' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0.5 : 0.08, elevation: aC.isDark ? 8 : 3 }]} activeOpacity={0.88} onPress={onPress}>
      {!aC.isDark && <><LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /><LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /></>}
      {/* .car-image */}
      <View style={[vc.carImage, { overflow: 'hidden' }]}>
        {imgUrl(item.images?.[0]) ? (
          <Image source={{ uri: imgUrl(item.images[0])! }} style={vc.carImg} resizeMode="cover" />
        ) : (
          <View style={[vc.carImg, vc.carImgPh, { backgroundColor: aC.isDark ? DARK_NAV : '#f1f5f9' }]}>
            <Ionicons name="car-outline" size={40} color={aC.isDark ? SUBTITLE : '#94a3b8'} />
          </View>
        )}
      </View>

      {/* .car-content */}
      <View style={vc.carContent}>

        {/* .car-header  →  h2 + .price */}
        <View style={vc.carHeader}>
          <Text style={[vc.h2, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={1}>{carName}</Text>
          <Text style={vc.price}>{formatPrice(item.price)}</Text>
        </View>

        {/* .variant */}
        <Text style={[vc.variantTxt, { color: aC.isDark ? SUBTITLE : '#64748b' }]} numberOfLines={1}>{variant}</Text>

        {/* .car-info  →  ⌖ city • year • CVT */}
        <View style={vc.carInfo}>
          <Ionicons name="location-outline" size={14} color={aC.isDark ? SUBTITLE : '#94a3b8'} />
          <Text style={[vc.carInfoTxt, { color: aC.isDark ? SUBTITLE : '#64748b' }]}>{city}</Text>
          <Text style={[vc.dot, { color: aC.isDark ? SUBTITLE : '#94a3b8' }]}>•</Text>
          <Text style={[vc.carInfoTxt, { color: aC.isDark ? SUBTITLE : '#64748b' }]}>{year}</Text>
          <Text style={[vc.dot, { color: aC.isDark ? SUBTITLE : '#94a3b8' }]}>•</Text>
          <Text style={[vc.carInfoTxt, { color: aC.isDark ? SUBTITLE : '#64748b' }]}>{trans}</Text>
        </View>

        {/* .card-actions  →  .view-btn + .favorite-btn */}
        <View style={vc.cardActions}>
          <TouchableOpacity style={vc.viewBtnWrap} activeOpacity={0.85} onPress={onPress}>
            <LinearGradient
              colors={[NAVY, ORANGE]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={vc.viewBtn}
            >
              <Text style={vc.viewBtnTxt}>View</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[vc.favoriteBtn, { backgroundColor: aC.isDark ? 'rgba(3,42,105,0.24)' : '#ffffff', borderWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)' }]} activeOpacity={0.8} onPress={onSave}>
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={20}
              color={saved ? '#ff4d6d' : (aC.isDark ? WHITE : '#032a69')}
            />
          </TouchableOpacity>
        </View>

      </View>
    </TouchableOpacity>
  );
}

const vc = StyleSheet.create({
  /* .car-card */
  carCard: {
    width: 220, height: 278,
    borderRadius: 16,
    borderWidth: 1, borderColor: '#ffffff',
    overflow: 'hidden',
    backgroundColor: BG,
    shadowColor: '#1D53AF',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },

  /* .car-image */
  carImage: { width: 220, height: 144 },
  carImg:   { width: 220, height: 144 },
  carImgPh: { backgroundColor: DARK_NAV, alignItems: 'center', justifyContent: 'center' },

  /* .car-content */
  carContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20, gap: 3 },

  /* .car-header */
  carHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h2:        { color: WHITE,    fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1 },
  price:     { color: ORANGE,   fontSize: 14, fontFamily: 'Poppins_500Medium', marginLeft: 4 },

  /* .variant */
  variantTxt: { color: SUBTITLE, fontSize: 12, fontFamily: 'Poppins_400Regular' },

  /* .car-info */
  carInfo:    { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'nowrap' },
  carInfoTxt: { color: SUBTITLE, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  dot:        { color: SUBTITLE, fontSize: 11 },

  /* .card-actions */
  cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 0 },

  /* .view-btn */
  viewBtnWrap: { flex: 1, height: 32, borderRadius: 32, overflow: 'hidden' },
  viewBtn:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewBtnTxt:  { color: WHITE, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  /* .favorite-btn */
  favoriteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(3,42,105,0.24)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 2,
  },
});



// ── Main Screen ──────────────────────────────────────────────────────────────
export default function BuyNewCarScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();

  const [brands,      setBrands]      = useState<any[]>([]);
  const [hotCars,    setHotCars]    = useState<any[]>([]);
  const [recentCars, setRecentCars] = useState<any[]>([]);
  const [savedIds,   setSavedIds]   = useState<Set<string>>(new Set());
  const [loading,    setLoading]    = useState(true);

  const [modalVisible,  setModalVisible]  = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [dealerPage,    setDealerPage]    = useState(0);
  const dealerScrollRef = useRef<ScrollView>(null);

  function openBrandModal(brandName: string) {
    setSelectedBrand(brandName);
    setModalVisible(true);
  }

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
      const [a, b, c] = await Promise.all([
        // Admin panel (database) wale SARE brands — bike/car filter nahi
        fetch(`${API_BASE}/brands`, { headers }),
        // Hot Selling = sirf paid ads (AdPromotion success) — promote vehicle ke baad yahan show ho
        fetch(`${API_BASE}/ads/hot-selling?condition=new&category=car&limit=10`, { headers }),
        fetch(`${API_BASE}/vehicles?category=car&condition=new&seller_type=dealership&limit=8`, { headers }),
      ]);
      if (a.ok) { const r = await a.json(); setBrands(Array.isArray(r) ? r : []); }
      if (b.ok) {
        const r = await b.json();
        // New Car page: only dealership vehicles (skip individual-seller paid ads)
        const hot = (r.items || r || []).filter((v: any) => v?.seller?.role === 'dealership_owner');
        if (hot.length > 0) {
          setHotCars(hot);
        } else {
          // Fallback agar koi paid ad nahi: purana featured query
          try {
            const fb = await fetch(`${API_BASE}/vehicles?category=car&condition=new&seller_type=dealership&limit=8&featured=true`, { headers });
            if (fb.ok) { const d = await fb.json(); setHotCars(d.items || []); }
            else setHotCars([]);
          } catch { setHotCars([]); }
        }
      } else {
        // Fallback agar endpoint na ho: purana featured query
        try {
          const fb = await fetch(`${API_BASE}/vehicles?category=car&condition=new&seller_type=dealership&limit=8&featured=true`, { headers });
          if (fb.ok) { const d = await fb.json(); setHotCars(d.items || []); }
        } catch {}
      }
      if (c.ok) { const r = await c.json(); setRecentCars(r.items || []); }
    } catch { /* offline */ }
    finally { setLoading(false); }
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color={aC.isDark ? WHITE : '#010a1f'} />
        </TouchableOpacity>
        {aC.isDark ? (
          <Image source={require('@/assets/images/autowizor-logo-text.png')} style={styles.logo} resizeMode="contain" />
        ) : (
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Poppins_700Bold' }}>
            <Text style={{ color: '#032a69' }}>Auto</Text><Text style={{ color: '#e2671b' }}>wizor</Text>
          </Text>
        )}
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ══════════════════════════════════════════
            1 · SELECT YOUR BRAND  (dynamic from DB)
        ══════════════════════════════════════════ */}
        <View style={styles.sec}>
          <Text style={[styles.secTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Select Your Brand</Text>
          {loading ? (
            <ActivityIndicator color={ORANGE} style={{ paddingVertical: 20 }}/>
          ) : brands.length === 0 ? (
            <Text style={{ color: aC.isDark ? SUBTITLE : '#64748b', fontSize: 13, fontFamily: 'Poppins_400Regular' }}>No brands available</Text>
          ) : (() => {
              const PAGE       = 8;
              const totalPages = Math.ceil(brands.length / PAGE);
              const pageW      = W - 40;
              const chunks     = Array.from({ length: totalPages }, (_, i) =>
                brands.slice(i * PAGE, i * PAGE + PAGE)
              );
              return (
                <>
                  <ScrollView
                    ref={dealerScrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={e => {
                      const page = Math.round(e.nativeEvent.contentOffset.x / pageW);
                      setDealerPage(page);
                    }}
                  >
                    {chunks.map((chunk, pi) => (
                      <View key={pi} style={{ width: pageW, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {chunk.map((b: any) => {
                          const name = b.name || 'Brand';
                          const logo = imgUrl(b.logo_url);
                          return (
                            <TouchableOpacity
                              key={b.id || name}
                              style={[styles.brandBtn, { backgroundColor: aC.isDark ? BG : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? '#1D53AF' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0.5 : 0.08, elevation: aC.isDark ? 6 : 3 }]}
                              activeOpacity={0.82}
                              onPress={() => openBrandModal(name)}
                            >
                              {aC.isDark ? (
                                <>
                                  <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                                  <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                                  <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                                  <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                                </>
                              ) : (
                                <>
                                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                                </>
                              )}
                              {logo ? (
                                <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: ORANGE, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                                  <Image source={{ uri: logo }} style={{ width: 32, height: 32 }} resizeMode="contain" />
                                </View>
                              ) : (
                                <View style={styles.brandInitialBox}>
                                  <Text style={styles.brandInitial}>{name[0]?.toUpperCase()}</Text>
                                </View>
                              )}
                              <Text style={[styles.brandName, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={1}>{name.toUpperCase()}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </ScrollView>
                  {totalPages > 1 && (
                    <View style={styles.dotsRow}>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <View key={i} style={[styles.dot, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(3,42,105,0.18)' }, i === dealerPage && styles.dotActive]} />
                      ))}
                    </View>
                  )}
                </>
              );
            })()
          }
        </View>

        {/* ══════════════════════════════════════════
            2 · FINANCE BANNER
        ══════════════════════════════════════════ */}
        <View style={styles.sec}>
          <AskariBank />
        </View>

        {/* ══════════════════════════════════════════
            3 · HOT SELLING CARS  (horizontal FlatList)
        ══════════════════════════════════════════ */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.padH}>
            <SH title="Hot Selling Cars" onViewAll={() => router.push({ pathname: '/buy/search-results', params: { condition: 'new', category: 'car', hot: 'true', from: 'newCarCash' } } as any)} />
          </View>
          {loading ? (
            <ActivityIndicator color={ORANGE} style={{ paddingVertical: 28 }} />
          ) : hotCars.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: aC.isDark ? 'rgba(6,27,74,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)' }]}>
              <Ionicons name="car-outline" size={40} color={aC.isDark ? SUBTITLE : '#94a3b8'} />
              <Text style={[styles.emptyTxt, { color: aC.isDark ? SUBTITLE : '#64748b' }]}>No new cars listed yet</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={hotCars}
              keyExtractor={i => i.id}
              showsHorizontalScrollIndicator={false}
              style={{ height: 300 }}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12, alignItems: 'flex-start' }}
              renderItem={({ item }) => (
                <VehicleCard
                  item={item}
                  saved={savedIds.has(item.id)}
                  onPress={() => router.push({ pathname: '/buy/car-detail', params: { id: item.id } } as any)}
                  onSave={() => toggleSave(item.id)}
                />
              )}
            >
            </FlatList>
          )}
        </View>

        {/* ══════════════════════════════════════════
            4 · RECENTLY LISTED  (horizontal FlatList)
        ══════════════════════════════════════════ */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.padH}>
            <SH title="Recently Listed" onViewAll={() => router.push({ pathname: '/buy/search-results', params: { condition: 'new', from: 'newCarCash' } } as any)} />
          </View>
          {recentCars.length === 0 && !loading ? (
            <View style={[styles.emptyBox, { backgroundColor: aC.isDark ? 'rgba(6,27,74,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)' }]}>
              <Ionicons name="car-outline" size={40} color={aC.isDark ? SUBTITLE : '#94a3b8'} />
              <Text style={[styles.emptyTxt, { color: aC.isDark ? SUBTITLE : '#64748b' }]}>No new cars listed yet</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={recentCars}
              keyExtractor={i => `r-${i.id}`}
              showsHorizontalScrollIndicator={false}
              style={{ height: 300 }}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12, alignItems: 'flex-start' }}
              renderItem={({ item }) => (
                <VehicleCard
                  item={item}
                  saved={savedIds.has(item.id)}
                  onPress={() => router.push({ pathname: '/buy/car-detail', params: { id: item.id, from: 'newCarCash' } } as any)}
                  onSave={() => toggleSave(item.id)}
                />
              )}
            >
            </FlatList>
          )}
        </View>

        {/* ══════════════════════════════════════════
            5 · YOU MAY NEED THIS  (2 gradient cards)
        ══════════════════════════════════════════ */}
        <View style={styles.sec}>
          <SH title="You May Need This" />
          <View style={styles.needRow}>
            {/* Compare Vehicle */}
            <TouchableOpacity style={[styles.needCard, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]} activeOpacity={0.85} onPress={() => router.push({ pathname: '/compare-vehicle', params: { category: 'car', from: 'newCar' } } as any)}>
              {aC.isDark ? (
                <LinearGradient
                  colors={['#071B48', '#0A1F4C', '#2B2947', '#80504A']}
                  locations={[0, 0.52, 0.76, 1]}
                  start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                  style={styles.needGrad}
                >
                  <Image source={IMG_COMPARE} style={styles.needImgCompare} resizeMode="contain" />
                  <View style={styles.needTitleRow}>
                    <Text style={styles.needTitle}>{'Compare\nVehicle'}</Text>
                    <Ionicons name="chevron-forward" size={24} color={ORANGE} />
                  </View>
                  <Text style={styles.needSub}>Compare vehicle features, prices, and specifications.</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.needGrad, { backgroundColor: '#ffffff' }]}>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.10)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <Image source={IMG_COMPARE} style={styles.needImgCompare} resizeMode="contain" />
                  <View style={styles.needTitleRow}>
                    <Text style={[styles.needTitle, { color: '#010a1f' }]}>{'Compare\nVehicle'}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#032a69" />
                  </View>
                  <Text style={[styles.needSub, { color: '#475569' }]}>Compare vehicle features, prices, and specifications.</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Smart Finance Calculator */}
            <TouchableOpacity style={[styles.needCard, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]} activeOpacity={0.85}>
              {aC.isDark ? (
                <LinearGradient
                  colors={['#071B48', '#0A1F4C', '#2B2947', '#80504A']}
                  locations={[0, 0.52, 0.76, 1]}
                  start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                  style={styles.needGrad}
                >
                  <Image source={IMG_FINANCE} style={styles.needImgFinance} resizeMode="contain" />
                  <View style={styles.needTitleRow}>
                    <Text style={styles.needTitle}>{'Smart Finance\nCalculator'}</Text>
                    <Ionicons name="chevron-forward" size={24} color={ORANGE} />
                  </View>
                  <Text style={styles.needSub}>Compare financing plans and calculate your monthly payments.</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.needGrad, { backgroundColor: '#ffffff' }]}>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.10)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <Image source={IMG_FINANCE} style={styles.needImgFinance} resizeMode="contain" />
                  <View style={styles.needTitleRow}>
                    <Text style={[styles.needTitle, { fontSize: 12, color: '#010a1f' }]}>{'Smart Finance\nCalculator'}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#032a69" />
                  </View>
                  <Text style={[styles.needSub, { fontSize: 9, color: '#475569' }]}>Calculate your monthly payments.</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ 6 · BROWSE MORE SERVICES ══ */}
        <View style={styles.sec}>
          <BrowseMoreServices />
        </View>

        {/* ══ 7 · LATEST VIDEO ══ */}
        <View style={styles.sec}>
          <LatestVideoSection count={2} savedCardStyle />
        </View>

      </ScrollView>
      {/* ── Basic Details Modal ── */}
      <BasicDetailsModal
        visible={modalVisible}
        brandName={selectedBrand}
        category="car"
        onClose={() => setModalVisible(false)}
        onSearch={(data) => {
          setModalVisible(false);
          router.push({
            pathname: '/buy/search-results' as any,
            params: {
              search: data.car || '',
              make: data.make || selectedBrand || '',
              variant: data.variant || '',
              year: data.year || '',
              color: data.color || '',
              city: data.city || '',
              condition: 'new',
              category: 'car',
              seller_type: 'dealership',
              from: 'newCarCash',
            },
          });
        }}
      />

    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const NEED_W = (W - 40 - 16) / 2;

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  padH:   { paddingHorizontal: 20 },
  sec:    { marginTop: 20, paddingHorizontal: 20 },
  secTitle: {
    color: WHITE, fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    textTransform: 'capitalize', marginBottom: 12,
  },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, height: 56,
  },
  backBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  logo:    { flex: 1, height: 22, marginHorizontal: 12 },

  brandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  brandBtn: {
    width: (W - 40 - 30) / 4, height: 88, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)',
    alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: BG,
    overflow: 'hidden',
    shadowColor: '#1D53AF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 18, height: 6, borderRadius: 3,
    backgroundColor: ORANGE,
  },

  brandInitialBox: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(226,103,27,0.2)',
    borderWidth: 1, borderColor: ORANGE,
    alignItems: 'center', justifyContent: 'center',
  },
  brandInitial: { color: ORANGE, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  brandName:    { color: WHITE, fontSize: 8, fontFamily: 'Poppins_500Medium', textTransform: 'uppercase' },
  brandCount:   { color: SUBTITLE, fontSize: 7, fontFamily: 'Poppins_400Regular' },

  /* Finance Banner */
  finBanner: {
    borderRadius: 16, height: 110,
    flexDirection: 'row', paddingLeft: 20,
    paddingVertical: 14, overflow: 'hidden',
  },
  finLeft:   { flex: 1, gap: 4, justifyContent: 'center' },
  finTitle:  { color: WHITE, fontSize: 14, fontFamily: 'Poppins_600SemiBold', lineHeight: 20 },
  finSub:    { color: 'rgba(249,250,252,0.85)', fontSize: 7, fontFamily: 'Poppins_400Regular', lineHeight: 11, maxWidth: 130 },
  finBtn:    { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5, marginTop: 6 },
  finBtnTxt: { color: WHITE, fontSize: 9, fontFamily: 'Poppins_600SemiBold' },
  bankLogo:  { position: 'absolute', top: 10, right: 10, width: 64, height: 18 },
  bankCar:   { position: 'absolute', bottom: -8, right: 0, width: 170, height: 125 },

  /* You May Need This — matched to supplied Figma */
  needRow:       { flexDirection: 'row', gap: 16 },
  needCard:      { width: NEED_W, height: 186, borderRadius: 16, overflow: 'hidden' },
  needGrad:      {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  needImgCompare:{ width: 112, height: 78, marginBottom: 2 },
  needImgFinance:{ width: 124, height: 78, marginBottom: 2 },
  needTitleRow:  {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  needTitle:     {
    color: WHITE,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
    lineHeight: 20,
  },
  needSub:       {
    color: '#c9bdc1',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 14,
    width: '100%',
  },

  /* Browse More Services */
  serviceItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: DARK_NAV, borderRadius: 16,
    paddingHorizontal: 17, paddingVertical: 12, marginBottom: 10,
  },
  serviceIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: DARK_NAV,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  serviceTxt:   { flex: 1 },
  serviceTitle: { color: WHITE, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  serviceSub:   { color: SUBTITLE, fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 14 },

  /* Latest Video */
  videoCard: {
    flexDirection: 'row', gap: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 10, marginBottom: 10,
    backgroundColor: 'rgba(6,27,74,0.6)',
  },
  videoThumb:   { width: 144, height: 117, borderRadius: 16, overflow: 'hidden', flexShrink: 0 },
  videoImg:     { width: 144, height: 117 },
  playBtn: {
    position: 'absolute', top: 43, left: 56,
    width: 32, height: 32, borderRadius: 17,
    backgroundColor: 'rgba(3,42,105,0.83)',
    alignItems: 'center', justifyContent: 'center',
  },
  durBadge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 17,
  },
  durTxt:       { color: WHITE, fontSize: 8, fontFamily: 'Poppins_400Regular' },
  videoInfo:    { flex: 1, justifyContent: 'center', gap: 6 },
  videoTitle:   { color: WHITE,    fontSize: 14, fontFamily: 'Poppins_500Medium' },
  videoSub:     { color: SUBTITLE, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  videoDivider: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.2)' },
  videoMeta:    { flexDirection: 'row', gap: 8 },
  videoMetaItem:{ flexDirection: 'row', alignItems: 'center', gap: 3 },
  videoMetaTxt: { color: SUBTITLE, fontSize: 8, fontFamily: 'Poppins_400Regular' },

  /* Empty */
  emptyBox: {
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(6,27,74,0.6)',
    alignItems: 'center', paddingVertical: 28, gap: 8, marginHorizontal: 20,
  },
  emptyTxt: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: SUBTITLE },
});
