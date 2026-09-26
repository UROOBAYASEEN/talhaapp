import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

function makeStyles(aC: ReturnType<typeof useAppColors>) {
  return StyleSheet.create({
    safe:          { flex: 1, backgroundColor: '#010a1f' },
    header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: aC.divider },
    backBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: aC.glassBg, alignItems: 'center', justifyContent: 'center' },
    headerTitle:   { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: aC.textPrimary },
    list:          { padding: 16, gap: 12, paddingBottom: 40 },
    loadingRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
    loadingTxt:    { fontSize: 13, fontFamily: 'Poppins_400Regular', color: aC.textSecondary },
    card:          { flexDirection: 'row', backgroundColor: 'rgba(3,12,40,0.6)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', overflow: 'hidden' },
    cardImg:       { width: 110, height: 110 },
    cardImgPh:     { backgroundColor: aC.roleIconBg, alignItems: 'center', justifyContent: 'center' },
    cardBody:      { flex: 1, padding: 12, gap: 4 },
    cardTitle:     { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: aC.textPrimary },
    cardPrice:     { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#e2671b' },
    metaRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaTxt:       { fontSize: 11, fontFamily: 'Poppins_400Regular', color: aC.textSecondary },
    dot:           { color: aC.textSecondary, fontSize: 10 },
    statusBadge:   { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1, marginTop: 2 },
    statusTxt:     { fontSize: 10, fontFamily: 'Poppins_500Medium' },
    empty:         { alignItems: 'center', paddingVertical: 80, gap: 10 },
    emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: aC.glassBg, alignItems: 'center', justifyContent: 'center' },
    emptyTitle:    { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: aC.textPrimary },
    emptySub:      { fontSize: 13, fontFamily: 'Poppins_400Regular', color: aC.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
    emptyBtn:      { paddingHorizontal: 28, paddingVertical: 14 },
    emptyBtnTxt:   { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  });
}

export default function MyActivityScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const aC     = useAppColors();
  const s      = useMemo(() => makeStyles(aC), [aC.isDark]);

  const [listings,   setListings]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/vehicles/my`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setListings(d.items || []); }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color={aC.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Activity</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={listings}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#e2671b" />}
        ListHeaderComponent={loading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator color="#e2671b" size="small" />
            <Text style={s.loadingTxt}>Loading activity...</Text>
          </View>
        ) : null}
        ListEmptyComponent={!loading ? (
          <View style={s.empty}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="time-outline" size={44} color={aC.textSecondary} />
            </View>
            <Text style={s.emptyTitle}>No Activity Yet</Text>
            <Text style={s.emptySub}>Your vehicle listings and reservations will appear here</Text>
            <TouchableOpacity style={{ borderRadius: 32, overflow: 'hidden', marginTop: 12 }} onPress={() => router.push('/(tabs)/explore' as any)}>
              <LinearGradient colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.emptyBtn}>
                <Text style={s.emptyBtnTxt}>Browse Vehicles</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: item.id } })} activeOpacity={0.87}>
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            {item.images?.[0]
              ? <Image source={{ uri: item.images[0] }} style={s.cardImg} resizeMode="cover" />
              : <View style={[s.cardImg, s.cardImgPh]}><Ionicons name="car" size={28} color={aC.textSecondary} /></View>
            }
            <View style={s.cardBody}>
              <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={s.cardPrice}>PKR {Number(item.price).toLocaleString()}</Text>
              <View style={s.metaRow}>
                <Ionicons name="location-outline" size={12} color={aC.textSecondary} />
                <Text style={s.metaTxt}>{item.city || 'Pakistan'}</Text>
                <Text style={s.dot}>•</Text>
                <Text style={s.metaTxt}>{item.year}</Text>
              </View>
              <View style={[s.statusBadge, {
                borderColor: item.status === 'active' ? '#27ae60' : '#e2671b',
                backgroundColor: item.status === 'active' ? 'rgba(39,174,96,0.1)' : 'rgba(226,103,27,0.1)',
              }]}>
                <Text style={[s.statusTxt, { color: item.status === 'active' ? '#27ae60' : '#e2671b' }]}>
                  {item.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
