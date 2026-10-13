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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { D, DHeader, GlowCard } from '@/components/dealer/DealerUI';

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
    <GlowCard onPress={onPress} style={s.card} radius={20}>
      {item.unread && <View style={s.unreadDot} />}

      <View style={s.cardRow}>
        <View style={s.iconWrap}>
          {item.icon === 'policy'
            ? <Ionicons name="document-text" size={26} color={ORANGE} />
            : <MaterialCommunityIcons name="clipboard-alert" size={26} color={ORANGE} />}
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
    </GlowCard>
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
  root:        { flex: 1, backgroundColor: D.bg },
  markAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: ORANGE, borderRadius: 12, paddingHorizontal: 12, height: 36 },
  markAllTxt:  { fontSize: 12, fontFamily: 'Poppins_500Medium', color: ORANGE },

  list:        { paddingHorizontal: 34, paddingTop: 8, paddingBottom: 100, gap: 18 },

  card:        { padding: 18, paddingTop: 16 },
  unreadDot:   { position: 'absolute', top: 20, right: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE },
  cardRow:     { flexDirection: 'row', gap: 12 },
  iconWrap:    { width: 30, alignItems: 'center', paddingTop: 4 },
  titleRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4, paddingRight: 14 },
  alertTitle:  { fontSize: 17, fontFamily: 'Poppins_500Medium', color: '#FFFFFF', flex: 1 },
  alertTime:   { fontSize: 11, fontFamily: 'Poppins_400Regular', color: D.muted, flexShrink: 0, paddingTop: 4 },
  alertMsg:    { fontSize: 12, fontFamily: 'Poppins_400Regular', color: D.muted, lineHeight: 19, paddingRight: 10 },
  tagsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  tag:         { backgroundColor: '#0B2358', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
  tagTxt:      { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#C9BDC4' },

  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyTxt:    { fontSize: 14, fontFamily: 'Poppins_500Medium', color: D.muted },
});
