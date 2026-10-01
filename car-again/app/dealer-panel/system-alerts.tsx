import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CheckCheck, Car, FileText,
  Banknote, AlertTriangle, Bell,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { D, DHeader, FilterPills, GlowCard } from '@/components/dealer/DealerUI';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/constants/api';

const ORANGE = AppColors.gradientEnd;
const C      = AppColors;

const FILTERS = ['All', 'New', 'Unread', 'System'] as const;

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

function getIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('financ') || t.includes('car') || t.includes('vehicle')) return Car;
  if (t.includes('doc'))     return FileText;
  if (t.includes('pay') || t.includes('bank')) return Banknote;
  if (t.includes('over') || t.includes('alert') || t.includes('warn')) return AlertTriangle;
  return Bell;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)    return 'Just now';
  if (mins < 60)   return `${mins} min ago`;
  if (hours < 24)  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function AlertCard({ item, onRead }: { item: Notif; onRead: (id: string) => void }) {
  const Icon = getIcon(item.type);
  return (
    <GlowCard onPress={() => !item.is_read && onRead(item.id)} style={s.card}>
      {/* Unread dot */}
      {!item.is_read && <View style={s.unreadDot}/>}

      <View style={s.cardInner}>
        {/* Icon (orange, Figma) */}
        <View style={s.iconWrap}>
          <Icon size={26} color={ORANGE} fill={ORANGE} strokeWidth={1.5}/>
        </View>

        {/* Text */}
        <View style={s.textWrap}>
          <View style={s.titleRow}>
            <Text style={s.alertTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={s.timeText}>{timeAgo(item.created_at)}</Text>
          </View>
          <Text style={s.alertBody} numberOfLines={3}>{item.body}</Text>
        </View>
      </View>
    </GlowCard>
  );
}

export default function SystemAlertsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [filter,     setFilter]     = useState<typeof FILTERS[number]>('All');
  const [notifs,     setNotifs]     = useState<Notif[]>([]);
  const [unread,     setUnread]     = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking,    setMarking]    = useState(false);

  const fetchNotifs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setNotifs(d.items || []);
        setUnread(d.unread_count || 0);
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const markAllRead = async () => {
    if (!token || marking) return;
    setMarking(true);
    try {
      await fetch(`${API_BASE}/notifications/mark-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch { /* offline */ }
    finally { setMarking(false); }
  };

  const markOneRead = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* offline */ }
  };

  const filtered = notifs.filter(n => {
    if (filter === 'Unread') return !n.is_read;
    if (filter === 'System') return n.type.toLowerCase().includes('system');
    if (filter === 'New') {
      const diffH = (Date.now() - new Date(n.created_at).getTime()) / 3600000;
      return diffH < 24;
    }
    return true;
  });

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>

        {/* HEADER */}
        <DHeader
          title="System Alerts"
          titleStyle={{ fontSize: 19 }}
          right={
            <TouchableOpacity
              onPress={markAllRead}
              disabled={marking || unread === 0}
              style={[s.markBtn, (marking || unread === 0) && { opacity: 0.5 }]}
            >
              <CheckCheck size={16} color={ORANGE}/>
              <Text style={s.markTxt}>Mark all as read</Text>
            </TouchableOpacity>
          }
        />

        {/* FILTER TABS */}
        <FilterPills items={FILTERS} value={filter as typeof FILTERS[number]} onChange={setFilter} style={s.filterRow} />

        {/* LIST */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={ORANGE}/>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchNotifs(); }}
                tintColor={ORANGE}
              />
            }
            renderItem={({ item }) => (
              <AlertCard item={item} onRead={markOneRead}/>
            )}
            ListEmptyComponent={() => (
              <View style={s.empty}>
                <Bell size={44} color={C.textSecondary}/>
                <Text style={s.emptyTxt}>No alerts</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: D.bg },
  container: { flex: 1, backgroundColor: D.bg },

  markBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: 12, borderWidth: 1, borderColor: ORANGE },
  markTxt: { color: ORANGE, fontSize: 12, fontFamily: 'Poppins_500Medium' },

  filterRow: { paddingHorizontal: 16, paddingBottom: 18, paddingTop: 8 },

  list: { paddingHorizontal: 34, paddingBottom: 40, gap: 16 },

  card:      { padding: 16, paddingTop: 12 },
  unreadDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE },

  cardInner: { flexDirection: 'row', gap: 12 },
  iconWrap:  { width: 32, alignItems: 'center', paddingTop: 4 },
  textWrap:  { flex: 1 },
  titleRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  alertTitle:{ color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_500Medium', flex: 1 },
  timeText:  { color: D.muted, fontSize: 12, fontFamily: 'Poppins_400Regular', flexShrink: 0, paddingTop: 2 },
  alertBody: { color: D.muted, fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 21, marginTop: 2 },

  center:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:    { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTxt: { color: D.muted, fontSize: 14, fontFamily: 'Poppins_500Medium' },
});
