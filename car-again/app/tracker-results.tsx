import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Locate, Star, MapPin, Wrench, CheckCircle } from 'lucide-react-native';
import { AppColors, useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import { PRIMARY_BTN_COLORS, RingGlow, SavedCardEffect } from '@/components/shared/FigmaEffects';

const ORANGE = '#e2671b';
const NAVY   = '#032a69';
const C      = AppColors;
const SERVER = API_BASE.replace('/api/v1','');
function resolveUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}

const FILTERS = [
  { key: 'install',  label: 'Lowest Installation' },
  { key: 'monthly',  label: 'Lowest Monthly'      },
  { key: 'rating',   label: 'Highest Rated'       },
  { key: 'price',    label: 'Lowest Price'        },
];

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
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

export default function TrackerResultsScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const C = aC;
  const [sortBy,     setSortBy]     = useState('install');
  const [liked,      setLiked]      = useState<Record<string, boolean>>({});
  const [devices,    setDevices]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchDevices(); }, []);

  async function fetchDevices() {
    try {
      const res = await fetch(`${API_BASE}/tracker-devices/?limit=50`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || [];
        setDevices(items.filter((d: any) => d.is_published !== false));
      }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  }

  function getSorted(list: any[]) {
    const copy = [...list];
    if (sortBy === 'price')   return copy.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortBy === 'install') return copy.sort((a, b) => (a.installation_fee || 0) - (b.installation_fee || 0));
    if (sortBy === 'monthly') return copy.sort((a, b) => (a.monthly_fee || 0) - (b.monthly_fee || 0));
    return copy;
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>

      {/* ── HEADER ── */}
      <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={26} color={aC.isDark ? '#C9C6D0' : '#010a1f'} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Compare Tracker Providers</Text>
      </View>

      {/* ── FILTER PILLS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.filtersRow, { backgroundColor: aC.bg }]}
        style={{ flexGrow: 0, backgroundColor: aC.bg }}
      >
        {FILTERS.map(f => {
          const active = sortBy === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                s.filterPill,
                aC.isDark
                  ? (active ? { backgroundColor: '#0A1838', borderColor: '#7E9FD6' } : { backgroundColor: '#0B1D4A', borderColor: 'transparent' })
                  : { backgroundColor: active ? 'rgba(226,103,27,0.10)' : '#ffffff', borderColor: active ? ORANGE : 'rgba(3,42,105,0.12)' },
              ]}
              onPress={() => setSortBy(f.key)}
              activeOpacity={0.8}
            >
              {active && aC.isDark && <RingGlow radius={14} peak={0.5} rings={8} />}
              <Text style={[s.filterTxt, { color: active ? ORANGE : (aC.isDark ? '#F2F1F5' : '#475569') }, active && { fontFamily: 'Poppins_600SemiBold' }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── DEVICE CARDS ── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: aC.bg }}>
          <ActivityIndicator color={ORANGE} size="large" />
        </View>
      ) : (
        <FlatList
          data={getSorted(devices)}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: aC.bg }}
          contentContainerStyle={[s.list, { backgroundColor: aC.bg }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80, gap: 10 }}>
              <Locate size={40} color={C.textSecondary} />
              <Text style={{ color: C.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular' }}>No tracker devices found</Text>
            </View>
          }
          renderItem={({ item: d }) => {
            const providerName = d.provider_name || 'Tracker Provider';
            const initials     = providerName.slice(0, 3).toUpperCase();
            const ratingVal    = d.rating ?? d.provider_rating;
            const isLiked      = !!liked[String(d.id)];

            return (
              <View style={[s.card, aC.isDark
                ? { backgroundColor: '#010A1F', borderColor: '#82a5d5', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 }
                : { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)', shadowColor: 'rgba(3,42,105,0.12)', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }]}>
                {aC.isDark ? <SavedCardEffect /> : <GlassInset />}

                {/* Top row */}
                <View style={s.cardTop}>
                  <TouchableOpacity
                    style={s.deviceLeft}
                    onPress={() => router.push({ pathname: '/tracker-company-profile' as any, params: { providerId: d.provider_id } })}
                    activeOpacity={0.8}
                  >
                    <View style={s.avatar}>
                      {(() => {
                        const aUrl = resolveUrl((d as any).provider_avatar_url);
                        return aUrl ? (
                          <Image source={{ uri: aUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="cover" />
                        ) : (
                          <Text style={s.avatarTxt}>{initials}</Text>
                        );
                      })()}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.deviceName, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={1}>{providerName}</Text>
                      <Text style={[s.providerName, { color: aC.isDark ? '#BAB6C4' : '#475569' }]} numberOfLines={2}>{d.description || d.name}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={s.iconRow}>
                      <TouchableOpacity><Ionicons name="share-social-outline" size={19} color={ORANGE} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => setLiked(p => ({ ...p, [String(d.id)]: !p[String(d.id)] }))}>
                        <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={ORANGE} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[s.priceLabel, { color: aC.isDark ? '#BAB6C4' : '#64748b' }]}>Yearly</Text>
                    <Text style={s.price}>PKR {Number(d.price || 0).toLocaleString()}</Text>
                  </View>
                </View>

                {/* Rating */}
                <View style={s.ratingRow}>
                  <Ionicons name="star" size={18} color={ORANGE} />
                  <Text style={[s.ratingTxt, { color: aC.isDark ? '#BAB6C4' : '#475569' }]}>{ratingVal != null ? Number(ratingVal).toFixed(1) : '—'}</Text>
                </View>

                {/* Stats row */}
                <View style={s.statsRow}>
                  <View style={s.statItem}>
                    <Text style={[s.statLabel, { color: aC.isDark ? '#E6E4EA' : '#64748b' }]}>Installation</Text>
                    <Text style={[s.statValue, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>
                      {d.installation_fee > 0 ? `Rs ${Number(d.installation_fee).toLocaleString()}` : 'Free'}
                    </Text>
                  </View>
                  <View style={[s.statDiv, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(3,42,105,0.12)' }]} />
                  <View style={s.statItem}>
                    <Text style={[s.statLabel, { color: aC.isDark ? '#E6E4EA' : '#64748b' }]}>Warranty</Text>
                    <Text style={[s.statValue, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>{d.warranty || '—'}</Text>
                  </View>
                  <View style={[s.statDiv, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(3,42,105,0.12)' }]} />
                  <View style={s.statItem}>
                    <Text style={[s.statLabel, { color: aC.isDark ? '#E6E4EA' : '#64748b' }]}>Coverage</Text>
                    <Text style={[s.statValue, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>{d.coverage || 'Nationwide'}</Text>
                  </View>
                </View>

                {/* Select Plan Button -> Addons -> Detail */}
                <TouchableOpacity
                  style={s.bookBtn}
                  activeOpacity={0.85}
                  onPress={() => router.push({
                    pathname: '/tracker-addons' as any,
                    params: {
                      providerId:      d.provider_id,
                      providerName:    providerName,
                      deviceId:        String(d.id),
                      deviceName:      d.name,
                      price:           String(d.price || 0),
                      installationFee: String(d.installation_fee || 0),
                      monthlyFee:      String(d.monthly_fee || 0),
                      deviceImage:     d.images?.[0] || (d as any).image || '',
                    },
                  })}
                >
                  <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject}/>
                  <Text style={s.bookTxt}>Select Plan</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },

  header:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, height: 60 },
  backBtn:     { width: 30, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_500Medium' },

  filtersRow: { paddingHorizontal: 14, gap: 10, paddingBottom: 14 },
  filterPill: { height: 46, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  filterTxt:  { fontSize: 13, fontFamily: 'Poppins_400Regular' },

  list: { paddingHorizontal: 14, paddingBottom: 40, gap: 18 },

  card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14, overflow: 'hidden' },

  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  deviceLeft:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  avatar:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#12306A', borderWidth: 1, borderColor: '#8FAEE3', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  avatarTxt:   { color: '#F2F1F5', fontSize: 11, fontFamily: 'Poppins_500Medium' },
  deviceName:  { fontSize: 16, fontFamily: 'Poppins_500Medium' },
  providerName:{ fontSize: 12.5, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  iconRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },

  priceLabel: { fontSize: 11.5, fontFamily: 'Poppins_400Regular' },
  price:      { color: ORANGE, fontSize: 13.5, fontFamily: 'Poppins_500Medium' },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 12 },
  ratingTxt: { fontSize: 12, fontFamily: 'Poppins_400Regular' },

  statsRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 8 },
  statItem:  { flex: 1, gap: 2 },
  statLabel: { fontSize: 10.5, fontFamily: 'Poppins_400Regular' },
  statValue: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  statDiv:   { width: 1, height: 26, marginHorizontal: 10 },

  bookBtn:  { height: 40, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  bookTxt:  { color: '#EDEBF0', fontSize: 13, fontFamily: 'Poppins_500Medium' },
});
