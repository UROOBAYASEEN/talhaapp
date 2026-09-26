import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#e2671b';
const C = AppColors;

const TABS = ['All', 'Chat'];

function CustomerCard({ item, onPress }: { item: any; onPress?: () => void }) {
  return (
    <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={onPress}>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      <View style={s.avatarWrap}>
        {item.img ? (
          <Image source={{ uri: item.img }} style={s.avatar} resizeMode="cover" />
        ) : (
          <View style={[s.avatar, { backgroundColor: '#e2671b', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 16 }}>{String(item.name || 'C').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        {item.online && <View style={s.onlineDot} />}
      </View>

      <View style={s.cardInfo}>
        <View style={s.nameRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={s.name}>{item.name}</Text>
            {item.verified && (
              <View style={s.verifiedBadge}>
                <Text style={{ color: '#fff', fontSize: 8 }}>✓</Text>
              </View>
            )}
          </View>
          <Text style={s.time}>{item.time}</Text>
        </View>
        <Text style={s.message} numberOfLines={2}>{item.message}</Text>
      </View>
    </TouchableOpacity>
  );
}

function fmtTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${m}${ampm}`;
}

export default function CustomersScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [activeTab,  setActiveTab]  = useState('All');
  const [search,     setSearch]     = useState('');
  const [convs,      setConvs]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConvs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data.conversations || [];
        const SERVER_BASE = API_BASE.replace('/api/v1', '');
        setConvs(items.map((c: any) => {
          const p = c.participant_info?.[0];
          const rawAv = p?.avatar_url || c.other_user_avatar || null;
          const av = rawAv ? (rawAv.startsWith('http') ? rawAv.replace(/http:\/\/[\d.]+:\d+/, SERVER_BASE) : `${SERVER_BASE}${rawAv}`) : null;
          return {
            id:      c.id || c._id,
            name:    p?.full_name || c.other_user_name || c.participant_name || 'Customer',
            message: c.last_message || c.lastMessage || 'No messages yet',
            time:    fmtTime(c.last_message_at || c.updated_at || c.created_at || ''),
            online:  false,
            type:    'Chat',
            img:     av,
            raw:     c,
          };
        }));
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchConvs(); }, [fetchConvs]);

  const filtered = convs.filter(c => {
    const matchTab    = activeTab === 'All' || c.type === activeTab;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Customers</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <LinearGradient colors={['rgba(22,64,136,0.5)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.5)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.5)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <Search size={16} color="#8f9cb5" />
          <TextInput
            style={s.searchInput}
            placeholder="Search reservation by CNIC or ID"
            placeholderTextColor={C.textPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Tabs */}
        <Text style={s.sectionTitle}>Conversations</Text>
        <View style={s.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabTxt, activeTab === tab && s.tabTxtActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={ORANGE} size="large" style={{ marginTop: 40 }} />
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchConvs(); }} tintColor={ORANGE} />}
        renderItem={({ item }) => (
          <CustomerCard
            item={item}
            onPress={() => router.push({ pathname: '/chat-room/[id]' as any, params: { id: item.id, name: item.name, otherId: item.raw?.participant_info?.[0]?.id || '' } })}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTxt}>No conversations yet</Text>
            <Text style={[s.emptyTxt, { fontSize: 11, marginTop: 6, color: '#8f9cb5' }]}>Customer will appear here after Contact Company message</Text>
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
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 14, borderRadius: 30, paddingHorizontal: 14, paddingVertical: 11, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: C.bg },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: C.textPrimary, padding: 0 },

  sectionTitle:{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary, paddingHorizontal: 16, marginBottom: 10 },

  tabRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  tab:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 30, paddingVertical: 5, borderRadius: 30, backgroundColor: 'rgba(6,27,74,1)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  tabActive:   { backgroundColor: 'rgba(6,27,74,1)', borderColor: ORANGE },
  tabTxt:      { fontSize: 13, fontFamily: 'Poppins_500Medium', color: C.textSecondary },
  tabTxtActive:{ color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  badge:       { backgroundColor: ORANGE, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeTxt:    { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#fff' },

  list:        { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },

  card:        { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap:  { position: 'relative' },
  avatar:      { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1a2a4a' },
  onlineDot:   { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: 'rgba(1,6,20,1)' },
  cardInfo:    { flex: 1 },
  nameRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name:        { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  time:        { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8f9cb5' },
  message:     { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary, lineHeight: 18 },
  verifiedBadge:{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },

  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyTxt:    { fontSize: 14, fontFamily: 'Poppins_500Medium', color: C.textSecondary },
});
