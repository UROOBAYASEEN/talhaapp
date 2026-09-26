import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, CheckCheck, Car, FileText,
  Banknote, AlertTriangle, Bell,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/constants/api';

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;

const FILTERS = ['All', 'New', 'Unread', 'System'];

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
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => !item.is_read && onRead(item.id)}
      style={[s.card, !item.is_read && s.cardUnread]}
    >
      <LinearGradient
        colors={['rgba(22,64,136,0.2)', 'transparent']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
        style={StyleSheet.absoluteFillObject} pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(13,37,84,0.18)', 'transparent']}
        start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }}
        style={StyleSheet.absoluteFillObject} pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(29,83,175,0.2)']}
        start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject} pointerEvents="none"
      />

      {/* Unread dot */}
      {!item.is_read && <View style={s.unreadDot}/>}

      <View style={s.cardInner}>
        {/* Icon circle */}
        <View style={s.iconWrap}>
          <LinearGradient
            colors={[NAVY, ORANGE]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Icon size={18} color="#fff"/>
        </View>

        {/* Text */}
        <View style={s.textWrap}>
          <View style={s.titleRow}>
            <Text style={s.alertTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={s.timeText}>{timeAgo(item.created_at)}</Text>
          </View>
          <Text style={s.alertBody} numberOfLines={2}>{item.body}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function SystemAlertsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [filter,     setFilter]     = useState('All');
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
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <ChevronLeft size={24} color={ORANGE} strokeWidth={2}/>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>System Alerts</Text>
            {unread > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeTxt}>{unread}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={markAllRead}
            disabled={marking || unread === 0}
            style={[s.markBtn, (marking || unread === 0) && { opacity: 0.4 }]}
          >
            <LinearGradient
              colors={['rgba(226,103,27,0.15)', 'rgba(226,103,27,0.05)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <CheckCheck size={13} color={ORANGE}/>
            <Text style={s.markTxt}>Read all</Text>
          </TouchableOpacity>
        </View>

        {/* FILTER TABS */}
        <View style={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[s.filterTab, filter === f && s.filterTabActive]}
            >
              {filter === f && (
                <LinearGradient
                  colors={['rgba(226,103,27,0.15)', 'rgba(226,103,27,0.05)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <Text style={[s.filterTxt, filter === f && s.filterTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

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
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
  iconBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:  { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  badge:        { backgroundColor: ORANGE, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeTxt:     { color: '#fff', fontSize: 11, fontFamily: 'Poppins_700Bold' },

  markBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(226,103,27,0.4)', overflow: 'hidden',
  },
  markTxt: { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_500Medium' },

  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: C.glassBorder,
    backgroundColor: C.glassBg, overflow: 'hidden',
  },
  filterTabActive: { borderColor: ORANGE },
  filterTxt:       { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  filterTxtActive: { color: ORANGE },

  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },

  card: {
    borderRadius: 16, borderWidth: 1, borderColor: C.glassBorder,
    backgroundColor: C.glassBg, overflow: 'hidden', padding: 14,
  },
  cardUnread: { borderColor: 'rgba(226,103,27,0.35)' },
  unreadDot:  {
    position: 'absolute', top: 12, right: 12,
    width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE,
  },

  cardInner: { flexDirection: 'row', gap: 12 },
  iconWrap:  {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    flexShrink: 0,
  },
  textWrap:  { flex: 1 },
  titleRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  alertTitle:{ color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', flex: 1 },
  timeText:  { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Poppins_400Regular', flexShrink: 0 },
  alertBody: { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18, marginTop: 3 },

  center:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:    { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTxt: { color: C.textSecondary, fontSize: 14, fontFamily: 'Poppins_500Medium' },
});
