import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#e2671b';
const C = AppColors;

const STATUS_TABS = ['All', 'Pending', 'Confirmed', 'Cancelled'];

function ReservationCard({
  res,
  onConfirm,
  onDecline,
}: {
  res: any;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  const statusColor = res.status === 'confirmed' ? '#34c759' : res.status === 'cancelled' ? '#ff4444' : '#f59e0b';
  return (
    <View style={rc.card}>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      <View style={rc.header}>
        <View style={{ flex: 1 }}>
          <Text style={rc.vehicle}>{res.vehicle_title || 'Vehicle Reservation'}</Text>
          <Text style={rc.buyer}>{res.buyer_name || 'Customer'}</Text>
        </View>
        <View style={[rc.badge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[rc.badgeTxt, { color: statusColor }]}>{res.status || 'pending'}</Text>
        </View>
      </View>

      <View style={rc.details}>
        <View style={rc.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={C.textSecondary} />
          <Text style={rc.detailTxt}>{res.date || 'Date not set'}</Text>
        </View>
        <View style={rc.detailRow}>
          <Ionicons name="time-outline" size={14} color={C.textSecondary} />
          <Text style={rc.detailTxt}>{res.time_slot || 'Time TBD'}</Text>
        </View>
        <View style={rc.detailRow}>
          <Ionicons name="cash-outline" size={14} color={C.textSecondary} />
          <Text style={rc.detailTxt}>PKR {Number(res.deposit || 0).toLocaleString()} deposit</Text>
        </View>
      </View>

      {res.status === 'pending' && (
        <View style={rc.actions}>
          <TouchableOpacity style={rc.confirmBtn} onPress={onConfirm}>
            <Text style={rc.confirmTxt}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={rc.cancelBtn} onPress={onDecline}>
            <Text style={rc.cancelTxt}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const rc = StyleSheet.create({
  card:       { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: C.glassBg, overflow: 'hidden', padding: 14, marginBottom: 10, gap: 10 },
  header:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  vehicle:    { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  buyer:      { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary, marginTop: 2 },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeTxt:   { fontSize: 10, fontFamily: 'Poppins_500Medium', textTransform: 'capitalize' },
  details:    { gap: 6 },
  detailRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailTxt:  { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary },
  actions:    { flexDirection: 'row', gap: 10 },
  confirmBtn: { flex: 1, paddingVertical: 9, borderRadius: 20, backgroundColor: ORANGE, alignItems: 'center' },
  confirmTxt: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  cancelBtn:  { flex: 1, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,68,68,0.4)', alignItems: 'center' },
  cancelTxt:  { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#ff4444' },
});

export default function ReservationsScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRef]  = useState(false);
  const [activeTab, setTab]   = useState('All');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    if (!token || !user?.id) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/dealers/${user.id}/reservations?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setData(d.items || d || []);
      }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }

  async function updateReservation(resId: string, status: 'confirmed' | 'cancelled') {
    if (!token || !user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/dealers/${user.id}/reservations/${resId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setData(prev => prev.map(r => r.id === resId ? { ...r, status } : r));
      }
    } catch { /* offline */ }
  }

  const filtered = activeTab === 'All' ? data : data.filter(r => r.status?.toLowerCase() === activeTab.toLowerCase());

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={s.title}>Reservations</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.filterRow}>
          {STATUS_TABS.map(tab => (
            <TouchableOpacity key={tab} style={[s.filterTab, activeTab === tab && s.filterTabActive]} onPress={() => setTab(tab)}>
              <Text style={[s.filterTxt, activeTab === tab && s.filterTxtActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={ORANGE} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id || String(Math.random())}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRef(true); await fetchData(); setRef(false); }} tintColor={ORANGE} />}
          renderItem={({ item }) => (
            <ReservationCard
              res={item}
              onConfirm={() => updateReservation(item.id, 'confirmed')}
              onDecline={() => updateReservation(item.id, 'cancelled')}
            />
          )}
          ListEmptyComponent={() => (
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={48} color={C.textSecondary} />
              <Text style={s.emptyTxt}>No reservations yet</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  back:           { width: 36, height: 36, borderRadius: 18, backgroundColor: C.glassBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)' },
  title:          { fontSize: 18, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  filterRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  filterTab:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: C.glassBg },
  filterTabActive:{ borderColor: ORANGE, backgroundColor: 'rgba(226,103,27,0.15)' },
  filterTxt:      { fontSize: 12, fontFamily: 'Poppins_500Medium', color: C.textSecondary },
  filterTxtActive:{ color: ORANGE },
  list:           { paddingHorizontal: 16, paddingBottom: 40 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:          { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTxt:       { fontSize: 15, fontFamily: 'Poppins_500Medium', color: C.textSecondary },
});
