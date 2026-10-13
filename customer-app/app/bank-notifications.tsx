import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList, StyleSheet, Text, TouchableOpacity,
  View, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCheck } from 'lucide-react-native';
import { D, DHeader, FilterPills, GlowCard } from '@/components/dealer/DealerUI';
import { ScrollView } from 'react-native';

const TABS = ['All', 'New', 'Unread', 'System'] as const;

const BG     = '#010a1f';
const WHITE  = '#f9fafc';
const SUB    = '#baacb6';
const ORANGE = '#e2671b';

function iconForType(type: string) {
  switch (type) {
    case 'message':  return { name: 'chatbubble-ellipses', color: '#34c759', bg: 'rgba(52,199,89,0.15)'  };
    case 'call':     return { name: 'call',                color: '#0088ff', bg: 'rgba(0,136,255,0.15)'  };
    case 'follow':   return { name: 'person-add',          color: '#0088ff', bg: 'rgba(0,136,255,0.15)'  };
    case 'financing':return { name: 'cash-outline',        color: ORANGE,    bg: 'rgba(226,103,27,0.15)' };
    default:         return { name: 'notifications',       color: ORANGE,    bg: 'rgba(226,103,27,0.15)' };
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  return `${days}d ago`;
}

export default function BankNotificationsScreen() {
  const router     = useRouter();
  const { token }  = useAuth();

  const [items,      setItems]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState<typeof TABS[number]>('All');

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/notifications/?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setItems(d.items || []); }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const unreadCount = items.filter(n => !n.is_read).length;

  // Menu filter (view only)
  const shown = items.filter(n => {
    if (tab === 'Unread') return !n.is_read;
    if (tab === 'New')    return n.created_at && Date.now() - new Date(n.created_at).getTime() < 86400000;
    if (tab === 'System') return !['message', 'call', 'follow', 'financing'].includes(n.type);
    return true;
  });

  async function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await fetch(`${API_BASE}/notifications/mark-read`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }

  async function markOneRead(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <DHeader
        title="System Alerts"
        titleStyle={{ fontSize: 19 }}
        right={
          <TouchableOpacity style={s.markAllBtn} onPress={markAllRead}>
            <CheckCheck size={16} color={ORANGE} />
            <Text style={s.markAll}>Mark all as read</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6 }} style={{ flexGrow: 0 }}>
        <FilterPills items={TABS} value={tab} onChange={setTab} style={{ flexWrap: 'nowrap', gap: 10 }} badges={unreadCount > 0 ? { Unread: unreadCount } as any : undefined} />
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={ORANGE} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={n => n.id}
          style={{ flex: 1 }}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={ORANGE} />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="notifications-off-outline" size={52} color={SUB} />
              <Text style={s.emptyTxt}>No notifications yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const icon = iconForType(item.type);
            return (
              <GlowCard style={s.card} radius={18} onPress={() => markOneRead(item.id)}>
                <View style={s.iconBox}>
                  <Ionicons name={icon.name as any} size={24} color={ORANGE} />
                </View>
                <View style={s.body}>
                  <View style={s.titleRow2}>
                    <Text style={s.notifTitle}>{item.title}</Text>
                    <Text style={s.notifTime}>{timeAgo(item.created_at)}</Text>
                  </View>
                  <Text style={s.notifBody} numberOfLines={2}>{item.body}</Text>
                </View>
                {!item.is_read && <View style={s.dot} />}
              </GlowCard>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },

  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: ORANGE, borderRadius: 12, paddingHorizontal: 12, height: 36 },
  markAll:    { fontSize: 12, fontFamily: 'Poppins_500Medium', color: ORANGE },

  list: { paddingHorizontal: 30, paddingTop: 14, paddingBottom: 80, gap: 18 },

  card:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  iconBox:    { width: 30, alignItems: 'center', paddingTop: 2, flexShrink: 0 },
  body:       { flex: 1, gap: 2 },
  titleRow2:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
  notifTitle: { flex: 1, fontSize: 16, fontFamily: 'Poppins_500Medium', color: WHITE },
  notifBody:  { fontSize: 13, fontFamily: 'Poppins_400Regular', color: SUB, lineHeight: 20 },
  notifTime:  { fontSize: 11, fontFamily: 'Poppins_400Regular', color: D.muted, paddingTop: 3 },
  dot:        { position: 'absolute', top: 18, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE },

  empty:    { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTxt: { fontSize: 15, fontFamily: 'Poppins_500Medium', color: SUB },
});
