import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, FileText, AlertTriangle, CheckCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#e2671b';
const C = AppColors;

const INITIAL_ALERTS = [
  {
    id: '1',
    icon: 'policy',
    title: 'New Policy Application',
    time: '2m ago',
    unread: true,
    message: 'James Cooper has submitted a new Comprehensive Plus application for a 2024 Tesla Model Y.',
    tags: ['High Priority', 'Policy ID: #8821'],
  },
  {
    id: '2',
    icon: 'claim',
    title: 'Claim Submitted',
    time: '12m ago',
    unread: true,
    message: 'James Cooper has submitted a new Comprehensive Plus application for a 2024 Tesla Model Y.',
    tags: [],
  },
  {
    id: '3',
    icon: 'claim',
    title: 'Claim Submitted',
    time: '12m ago',
    unread: true,
    message: 'James Cooper has submitted a new Comprehensive Plus application for a 2024 Tesla Model Y.',
    tags: [],
  },
];

function AlertCard({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={['#010A1F', '#010A1F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      {item.unread && <View style={s.unreadDot} />}

      <View style={s.cardRow}>
        <View style={s.iconWrap}>
          {item.icon === 'policy'
            ? <FileText size={18} color="#fff" strokeWidth={2.2} />
            : <AlertTriangle size={18} color="#fff" strokeWidth={2.2} />
          }
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.titleRow}>
            <Text style={s.alertTitle}>{item.title}</Text>
            <Text style={s.alertTime}>{item.time}</Text>
          </View>
          <Text style={s.alertMsg}>{item.message}</Text>
          {item.tags.length > 0 && (
            <View style={s.tagsRow}>
              {item.tags.map((tag: string) => (
                <View key={tag} style={s.tag}>
                  <Text style={s.tagTxt}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function fmtTime(iso: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function AlertsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [alerts,     setAlerts]     = useState<any[]>(INITIAL_ALERTS);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const items = (data.items || data || []).map((n: any) => ({
          id:      n.id,
          icon:    n.type === 'admin_broadcast' ? 'policy' : 'claim',
          title:   n.title || 'Notification',
          time:    fmtTime(n.created_at || ''),
          unread:  !n.is_read,
          message: n.body || n.message || '',
          tags:    [],
        }));
        if (items.length > 0) setAlerts(items);
      }
    } catch { /* offline — keep initial */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  async function markAllRead() {
    setAlerts(prev => prev.map(a => ({ ...a, unread: false })));
    if (token) {
      await fetch(`${API_BASE}/notifications/mark-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <ChevronLeft size={22} color={C.textPrimary} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>System Alerts</Text>
          </View>
          <TouchableOpacity style={s.markAllBtn} onPress={markAllRead}>
            <CheckCheck size={13} color={ORANGE} />
            <Text style={s.markAllTxt}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={ORANGE} size="large" style={{ marginTop: 60 }} />
      ) : (
      <FlatList
        data={alerts}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} tintColor={ORANGE} />}
        renderItem={({ item }) => (
          <AlertCard item={item} onPress={() => setAlerts(prev => prev.map(a => a.id === item.id ? { ...a, unread: false } : a))} />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTxt}>No alerts</Text>
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
  markAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: ORANGE, borderRadius: 30, paddingHorizontal: 9, paddingVertical: 4 },
  markAllTxt:  { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: ORANGE },

  list:        { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100, gap: 12 },

  card:        { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: '#010A1F', padding: 10 },
  unreadDot:   { position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: ORANGE },
  cardRow:     { flexDirection: 'row', gap: 10 },
  iconWrap:    { width: 32, height: 32, borderRadius: 10, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  titleRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  alertTitle:  { fontSize: 11, fontFamily: 'Poppins_700Bold', color: C.textPrimary, flex: 1 },
  alertTime:   { fontSize: 9, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', flexShrink: 0 },
  alertMsg:    { fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.textSecondary, lineHeight: 15, paddingRight: 12 },
  tagsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  tag:         { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 30, paddingHorizontal: 10, paddingVertical: 3 },
  tagTxt:      { fontSize: 9, fontFamily: 'Poppins_500Medium', color: C.textSecondary },

  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyTxt:    { fontSize: 14, fontFamily: 'Poppins_500Medium', color: C.textSecondary },
});
