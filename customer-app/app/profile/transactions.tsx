import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppColors } from '@/constants/theme';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const BG       = '#010a1f';
const WHITE    = '#f9fafc';
const SUBTITLE = '#baacb6';
const ORANGE   = '#e2671b';
const NAVY     = '#061b4a';
const CARD_BG  = 'rgba(6,17,60,0.85)';
const SHADOW   = '#1D53AF';

type Status = 'Refunded' | 'Success' | 'Pending' | 'Failed';
type Filter  = 'All' | 'Pending' | 'Success' | 'Failed';

const FILTERS: Filter[] = ['All', 'Pending', 'Success', 'Failed'];

const STATUS_COLOR: Record<Status, string> = {
  Refunded: '#34c759',
  Success:  '#0088ff',
  Pending:  '#f0c040',
  Failed:   '#ff383c',
};
const STATUS_BG: Record<Status, string> = {
  Refunded: 'rgba(52,199,89,0.15)',
  Success:  'rgba(0,136,255,0.15)',
  Pending:  'rgba(240,192,64,0.15)',
  Failed:   'rgba(255,56,60,0.15)',
};

const TRANSACTIONS = [
  { id: '1', initials: 'IB', title: 'Down Payment — Honda City',   sub: 'IBFT',          time: '20d ago', amount: 97576, status: 'Refunded' as Status },
  { id: '2', initials: 'De', title: 'Processing Fee — Meezan',     sub: 'Debit Card',    time: '20d ago', amount: 97576, status: 'Success'  as Status },
  { id: '3', initials: 'Cr', title: 'Insurance Premium — EFU',     sub: 'Credit Card',   time: '20d ago', amount: 97576, status: 'Pending'  as Status },
  { id: '4', initials: 'Ba', title: 'Tracker Installation — TPL',  sub: 'Bank transfer', time: '20d ago', amount: 97576, status: 'Failed'   as Status },
];

export default function TransactionsScreen() {
  const router = useRouter();
  const C      = useAppColors();
  const { token }  = useAuth();
  const [filter,     setFilter]     = useState<Filter>('All');
  const [allData,    setAllData]    = useState<any[]>(TRANSACTIONS);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const q = filter !== 'All' ? `?status=${filter}` : '';
      const res = await fetch(`${API_BASE}/transactions${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) setAllData(data);
      }
    } catch { /* offline — use mock */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token, filter]);

  useEffect(() => { load(); }, [load]);

  const data = filter === 'All'
    ? allData
    : allData.filter(t => t.status === filter);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: C.textPrimary }]}>Transactions</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* ── Filter chips ── */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[
              s.chip,
              filter === f
                ? {
                    borderWidth: 1.35,
                    borderColor: C.isDark ? '#6F89AF' : 'transparent',
                    backgroundColor: C.isDark ? '#15386A' : '#F2F4F8',
                    overflow: 'hidden',
                    ...(C.isDark ? null : { boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }),
                  }
                : {
                    borderWidth: 0,
                    backgroundColor: C.isDark ? NAVY : '#F7F8FA',
                    borderColor: 'transparent',
                    overflow: 'hidden',
                  },
            ]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            {C.isDark ? (
              filter === f ? (
                <>
                  <LinearGradient
                    colors={['#173B70', '#102A52', '#102A52', '#173B70']}
                    locations={[0, 0.18, 0.82, 1]}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]}
                    pointerEvents="none"
                  />
                  <LinearGradient
                    colors={['transparent', '#08162DCC', '#08162DCC', 'transparent']}
                    locations={[0, 0.23, 0.77, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 29, marginHorizontal: 3, marginVertical: 3 }]}
                    pointerEvents="none"
                  />
                </>
              ) : null
            ) : (
              filter !== f ? (
                <LinearGradient
                  colors={['rgba(3,42,105,0.03)', 'transparent']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 0.5 }}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />
              ) : null
            )}
            <Text style={[s.chipTxt, filter === f ? s.chipTxtOn : { fontFamily: 'Poppins_500Medium', color: C.isDark ? WHITE : '#000000', fontSize: 10 }]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ── */}
      {loading ? <ActivityIndicator color={ORANGE} style={{ flex: 1 }} size="large" /> : null}
      <FlatList
        data={data}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={ORANGE} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={52} color={SUBTITLE} />
            <Text style={s.emptyTitle}>No {filter} transactions</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.card, { backgroundColor: C.isDark ? '#010A1F' : '#ffffff', borderColor: C.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowColor: C.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: C.isDark ? 0 : 0.08, shadowRadius: 10, elevation: C.isDark ? 0 : 3, overflow: 'hidden' }, !C.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]} activeOpacity={0.85}>
            {C.isDark ? (
              <>
                <LinearGradient
                  colors={['#163565', '#061124', '#061124', '#0D2146']}
                  locations={[0, 0.24, 0.76, 1]}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={['#24518F8F', '#16356552', 'transparent', 'transparent', '#16356552', '#24518F8F']}
                  locations={[0, 0.025, 0.075, 0.925, 0.975, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
                  pointerEvents="none"
                />
              </>
            ) : (
              <>
              </>
            )}
            {/* Initials box */}
            <View style={[s.avatar, { backgroundColor: C.isDark ? '#0d1f4a' : '#F2F4F8', borderColor: C.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)' }]}>
              <Text style={[s.avatarTxt, { color: C.isDark ? WHITE : '#032a69' }]}>{item.initials}</Text>
            </View>

            {/* Info */}
            <View style={s.info}>
              <Text style={[s.txTitle, { color: C.textPrimary }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[s.txSub, { color: C.textSecondary }]}>{item.sub} • {item.time}</Text>
            </View>

            {/* Amount + badge */}
            <View style={s.right}>
              <Text style={s.amount}>Rs {item.amount.toLocaleString()}</Text>
              <View style={[s.badge, { backgroundColor: STATUS_BG[item.status] }]}>
                <Text style={[s.badgeTxt, { color: STATUS_COLOR[item.status] }]}>
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_500Medium',
    color: WHITE,
  },

  // Filter chips
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  chip: {
    flex: 1,
    height: 42,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn:  { backgroundColor: ORANGE },
  chipOff: { backgroundColor: NAVY   },
  chipTxt: { fontSize: 10 },
  chipTxtOn:  { fontFamily: 'Poppins_700Bold',   color: ORANGE },
  chipTxtOff: { fontFamily: 'Poppins_500Medium', color: WHITE },

  // List
  list: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    gap: 12,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)',
    backgroundColor: 'rgba(3,12,40,0.6)',
    padding: 14,
    overflow: 'hidden',
  },

  // Avatar
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0d1f4a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarTxt: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: WHITE,
  },

  // Info
  info: { flex: 1 },
  txTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: WHITE,
    marginBottom: 3,
  },
  txSub: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: SUBTITLE,
  },

  // Right
  right: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  amount: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: ORANGE,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeTxt: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: SUBTITLE,
  },
});
