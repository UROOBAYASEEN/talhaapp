import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, RefreshControl,
  StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors, useAppColors } from '@/constants/theme';

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;
const BORDER = 'rgba(100,160,255,0.4)';

const SERVER_BASE = API_BASE.replace('/api/v1', '');
function imgUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER_BASE}${url}`;
}
function formatPrice(p: number) {
  if (p >= 10_000_000) return `PKR ${(p / 10_000_000).toFixed(1)} Crore`;
  if (p >= 100_000)    return `PKR ${(p / 100_000).toFixed(1)} Lac`;
  return `PKR ${p.toLocaleString()}`;
}

function GlassInset() {
  const aC = useAppColors();
  if (!aC.isDark) {
    return (
      <>
        <LinearGradient colors={['rgba(3,42,105,0.04)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.4}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        <LinearGradient colors={['transparent','rgba(226,103,27,0.07)']} start={{x:0.5,y:0.6}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
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

export default function UsedBikeScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();

  const [bikes,      setBikes]      = useState<any[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,       setPage]       = useState(1);
  const [hasNext,    setHasNext]    = useState(false);
  const [search,     setSearch]     = useState('');
  const [savedIds,   setSavedIds]   = useState<Set<string>>(new Set());

  const fetchBikes = useCallback(async (p = 1, replace = true, q = search) => {
    try {
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
      const params = new URLSearchParams({
        category:  'bike',
        condition: 'used',
        page:      String(p),
        limit:     '12',
      });
      if (q.trim()) params.set('search', q.trim());

      const res = await fetch(`${API_BASE}/vehicles?${params}`, { headers });
      if (res.ok) {
        const d = await res.json();
        setBikes(prev => replace ? (d.items || []) : [...prev, ...(d.items || [])]);
        setTotal(d.total ?? 0);
        setHasNext(d.has_next ?? false);
        setPage(p);
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, [token, search]);

  useEffect(() => { fetchBikes(1, true); }, []);

  function loadMore() {
    if (!hasNext || loadingMore) return;
    setLoadingMore(true);
    fetchBikes(page + 1, false);
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

  // ── Bike Card — used-car wala div design ───────────────────────────────
  function BikeCard({ item, onPress, onSave, saved }: {
    item: any; onPress: () => void; onSave: () => void; saved: boolean;
  }) {
    const aC = useAppColors();
    const bikeImg = imgUrl(item.images?.[0]);

    if (aC.isDark) {
      return (
        <LinearGradient
          colors={['#0A285B', '#071A3B', '#071B3D']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.bikeCard}
        >
        <View style={s.bikeTop}>
          {/* Image */}
          <View style={s.bikeImageWrap}>
            {bikeImg ? (
              <Image source={{ uri: bikeImg }} style={s.bikeImage} resizeMode="cover" />
            ) : (
              <View style={[s.bikeImage, { alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="bicycle-outline" size={32} color="#929DB1" />
              </View>
            )}
          </View>

          {/* Details */}
          <View style={s.bikeDetails}>
            <Text style={s.bikeTitle} numberOfLines={2}>
              {item.title || `${item.make} ${item.model}`}
            </Text>
            <Text style={s.bikeColor}>{item.color || '—'}</Text>

            <View style={s.dealerRow}>
              <Text style={s.dealer}>
                {item.seller?.full_name || 'Seller'}
              </Text>
              <Ionicons name="checkmark-circle" size={16} color="#05AFFF" />
            </View>

            <Text style={s.bikeMeta}>
              {item.city || 'Pakistan'} • {item.year} • {item.transmission || 'Manual'}
            </Text>

            <View style={s.availableRow}>
              <View style={s.availableBadge}>
                <Text style={s.availableText}>Available</Text>
              </View>
              <Text style={s.price}>{formatPrice(item.price)}</Text>
            </View>
          </View>

          {/* Heart */}
          <TouchableOpacity style={s.heartButton} onPress={onSave}>
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={22}
              color={saved ? '#ff4d6d' : '#FF7600'}
            />
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={s.cardButtons}>
          <TouchableOpacity style={s.detailsButton} onPress={onPress} activeOpacity={0.85}>
            <LinearGradient
              colors={['#073C8E', '#F46A19']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.gradientButton}
            >
              <Text style={s.buttonText}>View Details</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.contactButton} activeOpacity={0.85}>
            <Text style={s.buttonText}>Contact Dealer</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      );
    }
    // Light — white card with subtle blue/orange shade
    return (
      <View style={[s.bikeCard, { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)', shadowColor: 'rgba(3,42,105,0.12)', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, overflow: 'hidden' }]}>
        <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View style={s.bikeTop}>
          <View style={[s.bikeImageWrap, { backgroundColor: '#f1f5f9' }]}>
            {bikeImg ? (
              <Image source={{ uri: bikeImg }} style={s.bikeImage} resizeMode="cover" />
            ) : (
              <View style={[s.bikeImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="bicycle-outline" size={32} color="#94a3b8" />
              </View>
            )}
          </View>
          <View style={s.bikeDetails}>
            <Text style={[s.bikeTitle, { color: '#010a1f' }]} numberOfLines={2}>{item.title || `${item.make} ${item.model}`}</Text>
            <Text style={[s.bikeColor, { color: '#475569' }]}>{item.color || '—'}</Text>
            <View style={s.dealerRow}>
              <Text style={[s.dealer, { color: '#010a1f' }]}>{item.seller?.full_name || 'Seller'}</Text>
              <Ionicons name="checkmark-circle" size={16} color="#05AFFF" />
            </View>
            <Text style={[s.bikeMeta, { color: '#64748b' }]}>{item.city || 'Pakistan'} • {item.year} • {item.transmission || 'Manual'}</Text>
            <View style={s.availableRow}>
              <View style={s.availableBadge}>
                <Text style={s.availableText}>Available</Text>
              </View>
              <Text style={s.price}>{formatPrice(item.price)}</Text>
            </View>
          </View>
          <TouchableOpacity style={[s.heartButton, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(3,42,105,0.12)' }]} onPress={onSave}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? '#ff4d6d' : '#e2671b'} />
          </TouchableOpacity>
        </View>
        <View style={s.cardButtons}>
          <TouchableOpacity style={s.detailsButton} onPress={onPress} activeOpacity={0.85}>
            <LinearGradient colors={['#073C8E', '#F46A19']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.gradientButton}>
              <Text style={s.buttonText}>View Details</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[s.contactButton, { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)' }]} activeOpacity={0.85}>
            <Text style={[s.buttonText, { color: '#032a69' }]}>Contact Dealer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? 'light-content' : 'dark-content'} backgroundColor={aC.bg} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color={aC.isDark ? C.textPrimary : '#010a1f'} />
        </TouchableOpacity>
        {aC.isDark ? (
          <Image source={require('@/assets/images/autowizor-logo-text.png')} style={s.logo} resizeMode="contain" />
        ) : (
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Poppins_700Bold' }}><Text style={{ color: '#032a69' }}>Auto</Text><Text style={{ color: '#e2671b' }}>wizor</Text></Text>
        )}
        <View style={{ width: 36 }} />
      </View>

      {/* Title */}
      <Text style={[s.pageTitle, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>Buy Used Bike</Text>
      <Text style={[s.pageSub, { color: aC.isDark ? C.textSecondary : '#475569' }]}>{total} used bikes available</Text>

      {/* Search */}
      <View style={[s.searchWrap, { backgroundColor: aC.isDark ? C.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
        <GlassInset />
        <Ionicons name="search-outline" size={18} color={aC.isDark ? C.textSecondary : '#64748b'} />
        <TextInput
          style={[s.searchInput, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}
          placeholder="Search bikes..."
          placeholderTextColor={aC.isDark ? C.textPlaceholder : '#94a3b8'}
          value={search}
          onChangeText={v => { setSearch(v); fetchBikes(1, true, v); }}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); fetchBikes(1, true, ''); }}>
            <Ionicons name="close-circle" size={18} color={aC.isDark ? C.textSecondary : '#94a3b8'} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={ORANGE} size="large" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={bikes}
          keyExtractor={i => i.id}
          contentContainerStyle={[s.list, { backgroundColor: aC.bg }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBikes(1, true); }} tintColor={ORANGE} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={ORANGE} style={{ paddingVertical: 16 }} /> : null}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="bicycle-outline" size={56} color={aC.isDark ? C.textSecondary : '#94a3b8'} />
              <Text style={[s.emptyTxt, { color: aC.isDark ? C.textSecondary : '#64748b' }]}>No used bikes found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <BikeCard
              item={item}
              saved={savedIds.has(item.id)}
              onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: item.id } })}
              onSave={() => toggleSave(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  backBtn:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  logo:   { flex: 1, height: 24 },

  pageTitle: { color: C.textPrimary, fontSize: 20, fontFamily: 'Poppins_600SemiBold', paddingHorizontal: 16, marginTop: 4 },
  pageSub:   { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', paddingHorizontal: 16, marginBottom: 12 },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 14, height: 46, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: C.glassBg, paddingHorizontal: 14, overflow: 'hidden' },
  searchInput: { flex: 1, color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_400Regular', paddingVertical: 0 },

  list: { paddingHorizontal: 16, paddingBottom: 100 },

  /* Bike Card — used-car wala div design */
  bikeCard: {
    borderRadius: 16, borderWidth: 1,
    borderColor: '#5C8ECF', padding: 11,
    marginBottom: 20, overflow: 'hidden',
  },
  bikeTop:      { flexDirection: 'row', minHeight: 124 },
  bikeImageWrap:{ width: 129, height: 112, borderRadius: 10, overflow: 'hidden', backgroundColor: '#17243B' },
  bikeImage:    { width: 129, height: 112 },
  bikeDetails:  { flex: 1, paddingLeft: 10, paddingRight: 24 },
  bikeTitle:    { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins_500Medium', marginTop: 2 },
  bikeColor:    { color: '#FFFFFF', fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  dealerRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dealer:      { color: '#FFFFFF', fontSize: 10, fontFamily: 'Poppins_400Regular' },
  bikeMeta:     { color: '#929DB1', fontSize: 9, fontFamily: 'Poppins_400Regular', marginTop: 4 },
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

  empty:    { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTxt: { color: C.textSecondary, fontSize: 14, fontFamily: 'Poppins_500Medium' },
});
