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
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={s.titleRow}>
          <Text style={s.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeTxt}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={s.markAll}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={ORANGE} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={items}
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
              <TouchableOpacity
                style={[s.card, !item.is_read && s.cardUnread]}
                activeOpacity={0.8}
                onPress={() => markOneRead(item.id)}
              >
                <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <View style={[s.iconBox, { backgroundColor: icon.bg }]}>
                  <Ionicons name={icon.name as any} size={22} color={icon.color} />
                </View>
                <View style={s.body}>
                  <Text style={s.notifTitle}>{item.title}</Text>
                  <Text style={s.notifBody} numberOfLines={2}>{item.body}</Text>
                  <Text style={s.notifTime}>{timeAgo(item.created_at)}</Text>
                </View>
                {!item.is_read && <View style={s.dot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(49,95,173,0.4)',
  },
  backBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: '#061230', alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:    { fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: WHITE },
  badge:    { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeTxt: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: WHITE },
  markAll:  { fontSize: 12, fontFamily: 'Poppins_500Medium', color: ORANGE },

  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 80, gap: 10, backgroundColor: BG },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    backgroundColor: 'rgba(3,12,40,0.6)', padding: 12, overflow: 'hidden',
  },
  cardUnread: { borderColor: 'rgba(100,160,255,0.9)' },
  iconBox:    { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  body:       { flex: 1, gap: 2 },
  notifTitle: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: WHITE },
  notifBody:  { fontSize: 11, fontFamily: 'Poppins_400Regular', color: SUB, lineHeight: 16 },
  notifTime:  { fontSize: 9, fontFamily: 'Poppins_400Regular', color: 'rgba(186,172,182,0.55)', marginTop: 2 },
  dot:        { width: 9, height: 9, borderRadius: 5, backgroundColor: ORANGE, alignSelf: 'center', flexShrink: 0 },

  empty:    { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTxt: { fontSize: 15, fontFamily: 'Poppins_500Medium', color: SUB },
});
