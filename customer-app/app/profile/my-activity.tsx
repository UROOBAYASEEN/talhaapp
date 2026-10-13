import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, RefreshControl,
  ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

function makeStyles(aC: ReturnType<typeof useAppColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#010a1f' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: aC.divider },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: aC.glassBg, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontFamily: aC.isDark ? 'Poppins_600SemiBold' : 'Poppins_500Medium', color: aC.textPrimary },
    list: { padding: 16, gap: 12, paddingBottom: 40 },
    tabsWrap: { marginBottom: 18 },
    tabsRow: { flexDirection: 'row', gap: 10, paddingRight: 4, paddingBottom: aC.isDark ? 0 : 8 },
    tab: { height: 50, paddingHorizontal: 17, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1 },
    tabText: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
    loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
    loadingTxt: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: aC.textSecondary },
    card: { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: aC.isDark ? '#82a5d5' : 'rgba(226,103,27,0.28)', overflow: 'hidden', shadowColor: aC.isDark ? '#638ed0' : 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: aC.isDark ? 0.15 : 0, shadowRadius: 5, elevation: aC.isDark ? 2 : 0, ...(aC.isDark ? null : { marginBottom: 4, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }) },
    cardTop: { paddingTop: 18 },
    cardImg: { width: '78%', height: 145, alignSelf: 'center' },
    cardImgPh: { backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
    cardBody: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
    cardTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: aC.textPrimary, marginBottom: 5 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
    metaTxt: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: aC.isDark ? aC.textSecondary : '#000000' },
    dot: { color: aC.textSecondary, fontSize: 11 },
    purchasedBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, backgroundColor: aC.isDark ? 'rgba(16,185,129,0.14)' : '#DDF5E5' },
    purchasedTxt: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: aC.isDark ? '#22c55e' : '#16a34a' },
    cardDivider: { height: 1, width: '100%', backgroundColor: aC.isDark ? 'rgba(120,153,201,0.55)' : 'rgba(0,0,0,0.1)' },
    purchaseInfo: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 13, paddingBottom: 17 },
    purchaseCol: { width: '50%' },
    purchaseLabel: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: aC.isDark ? '#b8b0c1' : '#6b7280', marginBottom: 2 },
    purchaseValue: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: aC.textPrimary },
    empty: { alignItems: 'center', paddingVertical: 80, gap: 10 },
    emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: aC.glassBg, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: aC.textPrimary },
    emptySub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: aC.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
    emptyBtn: { paddingHorizontal: 28, paddingVertical: 14 },
    emptyBtnTxt: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  });
}

function fmtDate(value: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suffix} ${d.toLocaleString('en-GB', { month: 'long' })} ${d.getFullYear()}`;
}

export default function MyActivityScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();
  const s = useMemo(() => makeStyles(aC), [aC.isDark]);

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'purchased' | 'finance' | 'insurance'>('purchased');

  const activityTabs = [
    { key: 'purchased' as const, label: 'Purchased (2)' },
    { key: 'finance' as const, label: 'Finance (1)' },
    { key: 'insurance' as const, label: 'Insurance (1)' },
  ];

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/vehicles/my`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setListings(d.items || []); }
    } catch { }
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
        ListHeaderComponent={
          <View style={s.tabsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tabsRow}
            >
              {activityTabs.map(tab => {
                const active = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    activeOpacity={0.85}
                    onPress={() => setActiveTab(tab.key)}
                    style={[
                      s.tab,
                      active
                        ? {
                          backgroundColor: aC.isDark ? '#15386A' : '#F2F4F8',
                          borderColor: aC.isDark ? '#6F89AF' : 'transparent',
                          borderWidth: aC.isDark ? 1.35 : 1,
                          ...(aC.isDark ? null : { boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }),
                        }
                        : {
                          backgroundColor: aC.isDark ? '#06235A' : '#F7F8FA',
                          borderColor: 'transparent',
                        },
                    ]}
                  >
                    {aC.isDark && active && (
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
                    )}
                    <Text style={[s.tabText, { color: aC.isDark ? (active ? aC.textPrimary : aC.textSecondary) : (active ? '#e2671b' : '#000000') }, !aC.isDark && active && { fontFamily: 'Poppins_700Bold' }]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {loading && (
              <View style={s.loadingRow}>
                <ActivityIndicator color="#e2671b" size="small" />
                <Text style={s.loadingTxt}>Loading activity...</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={!loading ? (
          <View style={s.empty}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="time-outline" size={44} color={aC.textSecondary} />
            </View>
            <Text style={s.emptyTitle}>No Activity Yet</Text>
            <Text style={s.emptySub}>Your vehicle listings and reservations will appear here</Text>
            <TouchableOpacity style={{ borderRadius: 32, overflow: 'hidden', marginTop: 12 }} onPress={() => router.push('/(tabs)/explore' as any)}>
              <LinearGradient colors={aC.isDark ? ['#032a69', '#e2671b'] : ['#27467F', '#FF9654']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.emptyBtn}>
                <Text style={s.emptyBtnTxt}>Browse Vehicles</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: item.id } })}
            activeOpacity={0.87}
          >
            {aC.isDark && <LinearGradient
              colors={['#16408880', 'transparent', 'transparent', '#16408880']}
              locations={[0, 0.08, 0.92, 1]}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />}
            {aC.isDark && <LinearGradient
              colors={['#16408880', 'transparent', 'transparent', '#16408880']}
              locations={[0, 0.05, 0.95, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />}

            <View style={s.cardTop}>
              {item.images?.[0]
                ? <Image source={{ uri: item.images[0] }} style={s.cardImg} resizeMode="contain" />
                : <View style={[s.cardImg, s.cardImgPh]}><Ionicons name="car" size={42} color={aC.textSecondary} /></View>
              }

              <View style={s.cardBody}>
                <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={s.metaRow}>
                  <Ionicons name="location-outline" size={16} color={aC.isDark ? aC.textSecondary : '#000000'} />
                  <Text style={s.metaTxt}>{item.city || 'Pakistan'}</Text>
                  <Text style={s.dot}>•</Text>
                  <Text style={s.metaTxt}>{item.year}</Text>
                  {item.transmission ? (
                    <>
                      <Text style={s.dot}>•</Text>
                      <Text style={s.metaTxt}>{item.transmission}</Text>
                    </>
                  ) : null}
                </View>

                <View style={s.purchasedBadge}>
                  <Text style={s.purchasedTxt}>Purchased</Text>
                </View>
              </View>
            </View>

            <View style={s.cardDivider} />

            <View style={s.purchaseInfo}>
              <View style={s.purchaseCol}>
                <Text style={s.purchaseLabel}>Purchase Date</Text>
                <Text style={s.purchaseValue}>
                  {item.purchased_at ? fmtDate(item.purchased_at) : '27th July 2026'}
                </Text>
              </View>
              <View style={s.purchaseCol}>
                <Text style={s.purchaseLabel}>Price</Text>
                <Text style={s.purchaseValue}>Rs {Number(item.price).toLocaleString()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
