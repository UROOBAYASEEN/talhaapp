import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList, StyleSheet, Text, TouchableOpacity,
  View, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, CheckCheck, Bell, Cpu, ShieldCheck, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#e2671b';
const C = AppColors;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function notifColor(type: string) {
  if (type === 'tracker_approved') return '#34D399';
  if (type === 'tracker_rejected') return '#f87171';
  return ORANGE;
}

function NotifIcon({ type }: { type: string }) {
  const color = notifColor(type);
  if (type === 'tracker_approved' || type === 'tracker_rejected' || type === 'tracker_request')
    return <Cpu size={18} color="#fff" strokeWidth={2} />;
  if (type === 'insurance') return <ShieldCheck size={18} color="#fff" strokeWidth={2} />;
  return <Info size={18} color="#fff" strokeWidth={2} />;
}

function AlertCard({ item, onPress }: { item: any; onPress: () => void }) {
  const color = notifColor(item.type);
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      {!item.is_read && <View style={[s.unreadDot, { backgroundColor: color }]} />}

      <View style={s.cardRow}>
        <View style={[s.iconWrap, { backgroundColor: color }]}>
          <NotifIcon type={item.type} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.titleRow}>
            <Text style={[s.alertTitle, !item.is_read && { color: '#fff' }]}>{item.title}</Text>
            <Text style={s.alertTime}>{timeAgo(item.created_at)}</Text>
          </View>
          <Text style={s.alertMsg}>{item.body}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TrackerAlertsScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [alerts,     setAlerts]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unread,     setUnread]     = useState(0);

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.items || []);
        setUnread(data.unread_count || 0);
      }
    } catch { /* offline */ }
  }, [token]);

  useEffect(() => {
    fetchAlerts().finally(() => setLoading(false));
  }, [fetchAlerts]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  }

  async function markAllRead() {
    await fetch(`${API_BASE}/notifications/mark-read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    setUnread(0);
  }

  async function markOneRead(id: string) {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    setUnread(prev => Math.max(0, prev - 1));
  }

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <ChevronLeft size={22} color={C.textPrimary} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Notifications</Text>
            {unread > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeTxt}>{unread}</Text>
              </View>
            )}
          </View>
          {unread > 0 && (
            <TouchableOpacity style={s.markAllBtn} onPress={markAllRead}>
              <CheckCheck size={13} color={ORANGE} />
              <Text style={s.markAllTxt}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
          renderItem={({ item }) => (
            <AlertCard item={item} onPress={() => markOneRead(item.id)} />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Bell size={40} color={C.textSecondary} strokeWidth={1.4} />
              <Text style={s.emptyTxt}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  badge:       { backgroundColor: ORANGE, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeTxt:    { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#fff' },
  markAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: ORANGE, borderRadius: 30, paddingHorizontal: 9, paddingVertical: 4 },
  markAllTxt:  { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: ORANGE },

  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100, gap: 12 },

  card:       { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: '#010A1F', padding: 10, position: 'relative' },
  unreadDot:  { position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderRadius: 4 },
  cardRow:    { flexDirection: 'row', gap: 10 },
  iconWrap:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  titleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  alertTitle: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: C.textSecondary, flex: 1 },
  alertTime:  { fontSize: 9, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', flexShrink: 0 },
  alertMsg:   { fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.textSecondary, lineHeight: 15, paddingRight: 12 },

  empty:    { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTxt: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: C.textSecondary },
});
