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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { D, DHeader, GlowCard } from '@/components/dealer/DealerUI';

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
    <GlowCard onPress={onPress} style={s.card} radius={20}>
      {!item.is_read && <View style={[s.unreadDot, { backgroundColor: color }]} />}
      <View style={s.cardRow}>
        <View style={s.iconWrap}>
          {item.type === 'tracker_approved' || item.type === 'tracker_rejected' || item.type === 'tracker_request'
            ? <Ionicons name="document-text" size={26} color={ORANGE} />
            : <MaterialCommunityIcons name="clipboard-alert" size={26} color={ORANGE} />}
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.titleRow}>
            <Text style={s.alertTitle}>{item.title}</Text>
            <Text style={s.alertTime}>{timeAgo(item.created_at)}</Text>
          </View>
          <Text style={s.alertMsg}>{item.body}</Text>
        </View>
      </View>
    </GlowCard>
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
        <DHeader
          title="System Alerts"
          titleStyle={{ fontSize: 19 }}
          right={
            <TouchableOpacity style={s.markAllBtn} onPress={markAllRead}>
              <CheckCheck size={16} color={ORANGE} />
              <Text style={s.markAllTxt}>Mark all as read</Text>
            </TouchableOpacity>
          }
        />
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
  root:        { flex: 1, backgroundColor: D.bg },
  markAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: ORANGE, borderRadius: 12, paddingHorizontal: 12, height: 36 },
  markAllTxt:  { fontSize: 12, fontFamily: 'Poppins_500Medium', color: ORANGE },

  list:        { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100, gap: 18 },

  card:        { padding: 18, paddingTop: 16 },
  unreadDot:   { position: 'absolute', top: 20, right: 16, width: 8, height: 8, borderRadius: 4 },
  cardRow:     { flexDirection: 'row', gap: 12 },
  iconWrap:    { width: 30, alignItems: 'center', paddingTop: 4 },
  titleRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4, paddingRight: 14 },
  alertTitle:  { fontSize: 17, fontFamily: 'Poppins_500Medium', color: '#FFFFFF', flex: 1 },
  alertTime:   { fontSize: 11, fontFamily: 'Poppins_400Regular', color: D.muted, flexShrink: 0, paddingTop: 4 },
  alertMsg:    { fontSize: 12, fontFamily: 'Poppins_400Regular', color: D.muted, lineHeight: 19, paddingRight: 10 },

  empty:    { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTxt: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: D.muted },
});
