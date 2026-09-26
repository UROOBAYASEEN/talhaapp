import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';
import { AppColors } from '@/constants/theme';

const ORANGE = '#e2671b';
const BG = AppColors.bg;

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AlertPage() {
  const router = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/notifications/?limit=50`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setAlerts(d.items || d || []);
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: BG }]}>
      <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', borderColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.12)' }]}>
          <Ionicons name="chevron-back" size={22} color={aC.isDark ? '#fff' : '#010a1f'} />
        </TouchableOpacity>
        <Text style={[s.title, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Alerts</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(i) => String(i.id || i._id || Math.random())}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={ORANGE} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="notifications-outline" size={48} color={aC.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(3,42,105,0.18)'} />
              <Text style={[s.emptyTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>No alerts</Text>
              <Text style={[s.emptySub, { color: aC.isDark ? 'rgba(255,255,255,0.45)' : '#64748b' }]}>You're all caught up</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[s.card, { backgroundColor: aC.isDark ? 'rgba(1,6,20,1)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
              {aC.isDark ? (
                <>
                  <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              ) : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              <View style={s.cardTop}>
                <View style={[s.iconWrap, { backgroundColor: item.type === 'message' ? (aC.isDark ? 'rgba(52,211,153,0.15)' : 'rgba(52,211,153,0.12)') : (aC.isDark ? 'rgba(226,103,27,0.15)' : 'rgba(226,103,27,0.12)'), borderColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.08)' }]}>
                  <Ionicons name={item.type === 'message' ? 'chatbubble-ellipses-outline' : 'notifications-outline'} size={16} color={item.type === 'message' ? '#34d399' : ORANGE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cardTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]} numberOfLines={1}>{item.title || 'Notification'}</Text>
                  <Text style={[s.cardBody, { color: aC.isDark ? 'rgba(255,255,255,0.65)' : '#475569' }]} numberOfLines={2}>{item.body || item.message || '—'}</Text>
                </View>
                {!item.is_read && <View style={s.dot} />}
              </View>
              <Text style={[s.time, { color: aC.isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8' }]}>{item.created_at ? timeAgo(item.created_at) : ''}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  title: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  list: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40, gap: 8 },
  card: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', paddingHorizontal: 12, paddingVertical: 10, overflow: 'hidden', gap: 6, minHeight: 64 },
  cardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardTitle: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  cardBody: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2, lineHeight: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE, marginTop: 6 },
  time: { color: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: 'Poppins_400Regular', marginLeft: 42 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  emptySub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontFamily: 'Poppins_400Regular' },
});
