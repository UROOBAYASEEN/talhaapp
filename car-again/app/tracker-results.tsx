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
  { key: 'price',    label: 'Lowest Price'    },
  { key: 'install',  label: 'Lowest Install'  },
  { key: 'rating',   label: 'Highest Rated'   },
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
  const [sortBy,     setSortBy]     = useState('price');
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
    return copy;
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>

      {/* ── HEADER ── */}
      <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={C.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: C.textPrimary }]}>Available Trackers</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── FILTER PILLS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.filtersRow, { backgroundColor: aC.bg }]}
        style={{ flexGrow: 0, backgroundColor: aC.bg }}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[
              s.filterPill,
              { backgroundColor: aC.isDark ? C.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 },
              sortBy === f.key && { borderColor: ORANGE, backgroundColor: aC.isDark ? C.glassBg : 'rgba(226,103,27,0.10)' },
            ]}
            onPress={() => setSortBy(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.filterTxt, { color: sortBy === f.key ? ORANGE : (aC.isDark ? C.textSecondary : '#475569') }, sortBy === f.key && { fontFamily: 'Poppins_500Medium' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
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
            const initials     = providerName.slice(0, 2).toUpperCase();

            return (
              <View style={[s.card, { backgroundColor: aC.isDark ? 'rgba(1,6,20,1)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
                <GlassInset />

                {/* Top row */}
                <View style={s.cardTop}>
                  <TouchableOpacity
                    style={s.deviceLeft}
                    onPress={() => router.push({ pathname: '/tracker-company-profile' as any, params: { providerId: d.provider_id } })}
                    activeOpacity={0.8}
                  >
                    <View style={[s.avatar, { overflow: 'hidden', backgroundColor: aC.isDark ? 'rgba(19,34,66,1)' : '#eef2ff', borderColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)' }]}>
                      {(() => {
                        const aUrl = resolveUrl((d as any).provider_avatar_url);
                        return aUrl ? (
                          <Image source={{ uri: aUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="cover" />
                        ) : (
                          <Locate size={18} color={ORANGE} />
                        );
                      })()}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.deviceName, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>{d.name}</Text>
                      <Text style={[s.providerName, { color: aC.isDark ? C.textSecondary : '#475569' }]}>{providerName}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.priceLabel, { color: aC.isDark ? C.textSecondary : '#64748b' }]}>Yearly</Text>
                    <Text style={s.price}>PKR {Number(d.price || 0).toLocaleString()}</Text>
                  </View>
                </View>

                {/* Description */}
                {d.description ? (
                  <Text style={[s.description, { color: aC.isDark ? C.textSecondary : '#475569' }]} numberOfLines={2}>{d.description}</Text>
                ) : null}

                {/* Stats row */}
                <View style={s.statsRow}>
                  <View style={s.statItem}>
                    <Wrench size={13} color={ORANGE} />
                    <Text style={[s.statLabel, { color: aC.isDark ? C.textSecondary : '#64748b' }]}>Install</Text>
                    <Text style={[s.statValue, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>
                      {d.installation_fee > 0 ? `PKR ${Number(d.installation_fee).toLocaleString()}` : 'Free'}
                    </Text>
                  </View>
                  <View style={[s.statDiv, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)' }]} />
                  <View style={s.statItem}>
                    <MapPin size={13} color={ORANGE} />
                    <Text style={[s.statLabel, { color: aC.isDark ? C.textSecondary : '#64748b' }]}>Coverage</Text>
                    <Text style={[s.statValue, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>{d.coverage || 'Nationwide'}</Text>
                  </View>
                  <View style={[s.statDiv, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)' }]} />
                  <View style={s.statItem}>
                    <Text style={[s.statLabel, { color: aC.isDark ? C.textSecondary : '#64748b' }]}>Monthly</Text>
                    <Text style={[s.statValue, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>
                      {d.monthly_fee > 0 ? `PKR ${Number(d.monthly_fee).toLocaleString()}` : '—'}
                    </Text>
                  </View>
                </View>

                {/* Features */}
                {d.features?.length > 0 && (
                  <View style={s.featuresRow}>
                    {d.features.slice(0, 3).map((f: string, i: number) => (
                      <View key={i} style={[s.featureChip, { backgroundColor: aC.isDark ? 'rgba(226,103,27,0.1)' : '#ffffff', borderWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)' }]}>
                        <CheckCircle size={10} color={ORANGE} />
                        <Text style={[s.featureTxt, { color: aC.isDark ? C.textSecondary : '#475569' }]} numberOfLines={1}>{f}</Text>
                      </View>
                    ))}
                    {d.features.length > 3 && (
                      <Text style={[s.moreFeatures, { color: aC.isDark ? C.textSecondary : '#64748b' }]}>+{d.features.length - 3} more</Text>
                    )}
                  </View>
                )}

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
                  <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject}/>
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

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 56 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', flex: 1, textAlign: 'center' },

  filtersRow:      { paddingHorizontal: 20, gap: 10, paddingBottom: 16 },
  filterPill:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: C.glassBg },
  filterPillActive:{ borderColor: ORANGE, backgroundColor: C.glassBg },
  filterTxt:       { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  filterTxtActive: { color: ORANGE, fontFamily: 'Poppins_500Medium' },

  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },

  card: {
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.4)',
    backgroundColor: 'rgba(1,6,20,1)',
    padding: 16, overflow: 'hidden',
  },

  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  deviceLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  avatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(19,34,66,1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  deviceName: { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  providerName:{ color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },

  priceLabel: { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  price:      { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  description: { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16, marginBottom: 12 },

  statsRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statItem:  { flex: 1, alignItems: 'center', gap: 3 },
  statLabel: { color: C.textSecondary, fontSize: 9, fontFamily: 'Poppins_400Regular' },
  statValue: { color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  statDiv:   { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 },

  featuresRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  featureChip:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(226,103,27,0.1)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  featureTxt:   { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular', maxWidth: 90 },
  moreFeatures: { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular', alignSelf: 'center' },

  bookBtn:  { height: 46, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  bookTxt:  { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});
