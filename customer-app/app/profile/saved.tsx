import LightGradientBorder from '@/components/shared/LightGradientBorder';
import VerifiedIcon from '@/components/shared/VerifiedIcon';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

const IMG_LOGO     = "https://www.figma.com/api/mcp/asset/fbad5a3c-8eef-483c-bb33-5892c13d28ae.png";
const IMG_CAR_DEMO = "https://www.figma.com/api/mcp/asset/151147df-8089-4233-ba37-acce385e1107.png";

const FILTERS = ['All', 'Car', 'Bike', 'Tracker', 'Insurance'] as const;
type Filter = typeof FILTERS[number];
const FILTER_CATEGORY: Record<Filter, string> = { All: '', Car: 'car', Bike: 'bike', Tracker: '', Insurance: '' };

function makeStyles(aC: ReturnType<typeof useAppColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: aC.bg },
    header: { height: 94, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 14 },
    headerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: aC.textPrimary },
    iconBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    logoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    logo: { width: 120, height: 36 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    content: { paddingHorizontal: 20, gap: 20 },
    searchBar: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 32, borderWidth: 1, borderColor: aC.isDark ? '#829fd0' : 'rgba(0,0,0,0.1)', backgroundColor: aC.isDark ? aC.glassBg : '#ffffff', paddingHorizontal: 20, overflow: 'hidden', ...(aC.isDark ? null : { boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }) },
    searchInput: { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', color: aC.isDark ? aC.textPrimary : '#010a1f', padding: 0 },
    filterRow: { gap: 12, paddingVertical: 4 },
    filterChip: { height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, overflow: 'hidden', borderWidth: 0, backgroundColor: aC.isDark ? '#08245C' : '#F7F8FA' },
    filterChipActive: { borderWidth: aC.isDark ? 1.35 : 0, borderColor: aC.isDark ? '#6F89AF' : 'transparent', backgroundColor: aC.isDark ? '#15386A' : '#F2F4F8', overflow: 'hidden', ...(aC.isDark ? null : { boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }) },
    filterChipInactive: {},
    filterTxt: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
    filterTxtActive:   { color: '#e2671b' },
    filterTxtInactive: { color: aC.isDark ? aC.textPrimary : '#010a1f', fontFamily: 'Poppins_500Medium' },
    cardList: { gap: 14 },
    outerCard: { borderRadius: 20, backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderWidth: 1, borderColor: aC.isDark ? '#82a5d5' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? '#638ed0' : 'rgba(3,42,105,0.12)', shadowOffset: { width: 0, height: 0 }, shadowOpacity: aC.isDark ? 0.15 : 0.08, shadowRadius: aC.isDark ? 5 : 10, elevation: aC.isDark ? 2 : 0, overflow: 'hidden', ...(aC.isDark ? null : { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }) },
    card: { borderRadius: 18, padding: 14, paddingBottom: 14, overflow: 'hidden', backgroundColor: aC.isDark ? '#010A1F' : '#ffffff' },
    cardTop: { flexDirection: 'row', gap: 12 },
    cardImg: { width: 120, height: 120, borderRadius: 14 },
    cardInfo: { flex: 1, gap: 4 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
    cardTitle: { flex: 1, fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: aC.textPrimary, lineHeight: 18 },
    heartBtn: { marginLeft: 6 },
    cardColor: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: aC.textPrimary },
    dealerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dealerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dealerName: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: aC.textPrimary },
    cardMeta: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: aC.textSecondary },
    badgePriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    availBadge: { backgroundColor: aC.isDark ? '#002d32' : '#d4f5e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    availTxt: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#19d865' },
    price: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#e2671b' },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    viewBtnWrap: { flex: 1, borderRadius: 28, overflow: 'hidden', ...(aC.isDark ? null : { boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }) },
    viewBtn: { height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 28 },
    viewBtnTxt: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
    contactBtn: { flex: 1, height: 40, borderRadius: 28, borderWidth: 2, borderColor: aC.isDark ? '#477bc4' : '#a0b8e8', backgroundColor: aC.isDark ? '#102c5b' : '#dde8ff', alignItems: 'center', justifyContent: 'center' },
    contactBtnTxt: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: aC.textPrimary },
    emptyWrap: { alignItems: 'center', paddingVertical: 80, gap: 12 },
    emptyTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: aC.textPrimary },
    emptySub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: aC.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  });
}

function VehicleCard({ item, onViewDetails, onContact, onUnsave, aC, s }: {
  item: any; onViewDetails: () => void; onContact: () => void; onUnsave: () => void;
  aC: ReturnType<typeof useAppColors>; s: ReturnType<typeof makeStyles>;
}) {
  const imgSrc = item.images?.[0] ? { uri: item.images[0] } : { uri: IMG_CAR_DEMO };
  return (
    <View style={s.outerCard}>
      <View
        style={[s.card, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff' }]}
      >
        {aC.isDark ? (
          <>
              <LinearGradient
                colors={['#16408880', 'transparent', 'transparent', '#16408880']}
                locations={[0, 0.08, 0.92, 1]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['#16408880', 'transparent', 'transparent', '#16408880']}
                locations={[0, 0.05, 0.95, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
            </>
        ) : (
          <>
            <LinearGradient colors={['rgba(3,42,105,0.03)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        )}
        {/* Top Section */}
        <View style={s.cardTop}>
          <Image source={imgSrc} style={s.cardImg} resizeMode="cover" />
          <View style={s.cardInfo}>
            {/* Title + Heart */}
            <View style={s.titleRow}>
              <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
              <TouchableOpacity onPress={onUnsave} style={s.heartBtn}>
                <Ionicons name="heart" size={22} color="#e2671b" />
              </TouchableOpacity>
            </View>
            {/* Color */}
            <Text style={s.cardColor}>{item.color || '—'}</Text>
            {/* Dealer */}
            <View style={s.dealerRow}>
              <Text style={s.dealerName} numberOfLines={1}>{item.seller?.full_name || 'Seller'}</Text>
              <VerifiedIcon size={16} />
            </View>
            {/* Meta */}
            <Text style={s.cardMeta}>{item.city || 'Pakistan'} • {item.year} • {item.transmission || 'CVT'}</Text>
            {/* Badge + Price */}
            <View style={s.badgePriceRow}>
              <View style={s.availBadge}><Text style={s.availTxt}>Available</Text></View>
              <Text style={s.price}>PKR {(item.price / 100000).toFixed(0)} Lac</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={s.btnRow}>
          <TouchableOpacity style={s.viewBtnWrap} onPress={onViewDetails} activeOpacity={0.85}>
            <LinearGradient colors={aC.isDark ? ['#153c87', '#ee5d13'] : ['#27467F', '#FF9654']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.viewBtn}>
              <Text style={s.viewBtnTxt}>View Details</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[s.contactBtn, { borderColor: aC.isDark ? '#477bc4' : 'transparent', backgroundColor: aC.isDark ? '#102c5b' : '#ffffff' }, !aC.isDark && { borderWidth: 0, overflow: 'hidden' }]} onPress={onContact} activeOpacity={0.85}>
            {!aC.isDark && <LightGradientBorder radius={20} fill="#ffffff" colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />}
            <Text style={s.contactBtnTxt}>Contact Dealer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function MyFavoritesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();
  const s  = useMemo(() => makeStyles(aC), [aC.isDark]);

  const [vehicles,   setVehicles]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState<Filter>('All');

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/vehicles/saved/list?limit=50`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setVehicles(data.items || []); }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = vehicles.filter(v => {
    const matchCat    = !FILTER_CATEGORY[filter] || v.category === FILTER_CATEGORY[filter];
    const matchSearch = !search || v.title?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  async function unsave(vehicleId: string) {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/vehicles/${vehicleId}/save`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    } catch { /* offline */ }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={[]}>
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color={aC.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Favorites</Text>
        <View style={s.iconBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <View style={s.searchBar}>
            {aC.isDark ? (
              <>
              <LinearGradient
                colors={['#163565', '#061124', '#061124', '#0D2146']}
                locations={[0, 0.24, 0.76, 1]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['#24518F8F', '#16356552', 'transparent', 'transparent', '#16356552', '#24518F8F']}
                locations={[0, 0.025, 0.075, 0.925, 0.975, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]}
                pointerEvents="none"
              />
            </>
            ) : (
              <>
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              </>
            )}
            <Ionicons name="search-outline" size={20} color={aC.textSecondary} />
            <TextInput style={s.searchInput} placeholder="Search cars, banks & dealers..." placeholderTextColor={aC.textSecondary} value={search} onChangeText={setSearch} returnKeyType="search" />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={aC.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            {FILTERS.map(f => {
              const active = filter === f;
              return (
                <TouchableOpacity key={f} style={[s.filterChip, active ? s.filterChipActive : s.filterChipInactive]} onPress={() => setFilter(f)} activeOpacity={0.8}>
                  {aC.isDark ? (
                    active ? (
                      <>
                        <LinearGradient
                          colors={['#173B70', '#102A52', '#102A52', '#173B70']}
                          locations={[0, 0.18, 0.82, 1]}
                          style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
                          pointerEvents="none"
                        />
                        <LinearGradient
                          colors={['transparent', '#08162DCC', '#08162DCC', 'transparent']}
                          locations={[0, 0.23, 0.77, 1]}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={[StyleSheet.absoluteFillObject, { borderRadius: 13, marginHorizontal: 3, marginVertical: 3 }]}
                          pointerEvents="none"
                        />
                      </>
                    ) : null
                  ) : (
                    <>
                      <LinearGradient colors={['rgba(3,42,105,0.03)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                      <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    </>
                  )}
                  <Text style={[s.filterTxt, active ? s.filterTxtActive : s.filterTxtInactive]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {loading ? (
            <ActivityIndicator color="#e2671b" style={{ marginTop: 60 }} size="large" />
          ) : filtered.length === 0 ? (
            <View style={s.emptyWrap}>
              <Ionicons name="heart-outline" size={56} color={aC.textSecondary} />
              <Text style={s.emptyTitle}>No favorites yet</Text>
              <Text style={s.emptySub}>Save vehicles you like and they'll appear here</Text>
            </View>
          ) : (
            <View style={s.cardList}>
              {filtered.map(item => (
                <VehicleCard
                  key={item.id}
                  item={item}
                  aC={aC}
                  s={s}
                  onViewDetails={() => router.push({ pathname: '/vehicle/[id]', params: { id: item.id } })}
                  onContact={()    => router.push({ pathname: '/vehicle/[id]', params: { id: item.id } })}
                  onUnsave={() => unsave(item.id)}
                />
              ))}
            </View>
          )}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
