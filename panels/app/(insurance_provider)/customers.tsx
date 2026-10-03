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
import { D, DHeader, FilterPills, GlowCard, SearchBar, Verified } from '@/components/dealer/DealerUI';

const ORANGE = '#e2671b';
const C = AppColors;

const TABS = ['All', 'Chat'] as const;

function CustomerCard({ item, onPress }: { item: any; onPress?: () => void }) {
  return (
    <GlowCard style={s.card} onPress={onPress} radius={20}>

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
            {item.verified && <Verified size={18} />}
          </View>
          <Text style={s.time}>{item.time}</Text>
        </View>
        <Text style={s.message} numberOfLines={2}>{item.message}</Text>
      </View>
    </GlowCard>
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
  const [activeTab,  setActiveTab]  = useState<typeof TABS[number]>('All');
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
        <DHeader title="Customers" center />

        {/* Search */}
        <View style={s.searchWrap}>
          <SearchBar placeholder="Search reservation by CNIC or ID" value={search} onChangeText={setSearch} />
        </View>

        {/* Tabs */}
        <Text style={s.sectionTitle}>Requests</Text>
        <FilterPills small items={TABS} value={activeTab} onChange={setActiveTab} style={s.tabRow} />
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
  root:        { flex: 1, backgroundColor: D.bg },
  searchWrap:  { marginHorizontal: 16, marginBottom: 14 },
  sectionTitle:{ fontSize: 16, fontFamily: 'Poppins_400Regular', color: D.muted, paddingHorizontal: 16, marginBottom: 12 },
  tabRow:      { paddingHorizontal: 16, marginBottom: 20 },

  list:        { paddingHorizontal: 22, paddingBottom: 100, gap: 16 },

  card:        { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap:  { position: 'relative' },
  avatar:      { width: 66, height: 66, borderRadius: 33, backgroundColor: '#1a2a4a' },
  onlineDot:   { position: 'absolute', bottom: 2, right: 0, width: 13, height: 13, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#010A1F' },
  cardInfo:    { flex: 1 },
  nameRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  name:        { fontSize: 16, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  time:        { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#E6E1E8' },
  message:     { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#E6E1E8', lineHeight: 20 },

  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyTxt:    { fontSize: 14, fontFamily: 'Poppins_500Medium', color: D.muted },
});
