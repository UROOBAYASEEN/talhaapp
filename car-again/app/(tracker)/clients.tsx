import React, { useState, useCallback, useEffect } from 'react';
import {
  FlatList,
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
import { ChevronLeft, Search, MessageSquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#e2671b';
const C = AppColors;

const TABS = ['All', 'Chat', 'Call'];

function getInitials(name: string) {
  return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getName(item: any) {
  return item.name || item.participant_info?.[0]?.full_name || 'User';
}

function getLastMsg(item: any) {
  return item.last_message || item.lastMsg || 'Say hello!';
}

function formatTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso), now = new Date(), diff = now.getTime() - d.getTime();
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
}

function ClientCard({ item, onPress }: { item: any; onPress: () => void }) {
  const name     = getName(item);
  const lastMsg  = getLastMsg(item);
  const time     = formatTime(item.last_message_at || item.time);
  const unread   = item.unread_count || 0;
  const initials = getInitials(name);

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={onPress}>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      <View style={s.avatarWrap}>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{initials}</Text>
        </View>
      </View>

      <View style={s.cardInfo}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>{name}</Text>
          <Text style={s.time}>{time}</Text>
        </View>
        <View style={s.msgRow}>
          <Text style={s.message} numberOfLines={1}>{lastMsg}</Text>
          {unread > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeTxt}>{unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TrackerClientsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [activeTab,    setActiveTab]    = useState('All');
  const [search,       setSearch]       = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setConversations(d.items || []);
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() { setRefreshing(true); await load(); }

  const filtered = conversations.filter(item => {
    const matchSearch = !search || getName(item).toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Clients</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={s.searchWrap}>
          <LinearGradient colors={['rgba(22,64,136,0.5)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.5)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.5)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <Search size={16} color="#8f9cb5" />
          <TextInput
            style={s.searchInput}
            placeholder="Search client by name"
            placeholderTextColor={C.textPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={s.sectionTitle}>Messages</Text>
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
        <View style={s.center}>
          <ActivityIndicator color={ORANGE} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
          renderItem={({ item }) => (
            <ClientCard
              item={item}
              onPress={() => router.push({
                pathname: '/chat-room/[id]' as any,
                params: { id: item.id, name: getName(item), otherId: item.participant_info?.[0]?.id ?? '' },
              })}
            />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <MessageSquare size={40} color={C.textSecondary} />
              <Text style={s.emptyTxt}>No clients yet</Text>
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
  list:        { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  card:        { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap:  { position: 'relative' },
  avatar:      { width: 50, height: 50, borderRadius: 25, backgroundColor: '#09265A', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { color: '#E7EBF4', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  cardInfo:    { flex: 1 },
  nameRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  msgRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name:        { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary, flex: 1 },
  time:        { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8f9cb5' },
  message:     { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary, flex: 1 },
  badge:       { backgroundColor: ORANGE, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 6 },
  badgeTxt:    { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#fff' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:       { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTxt:    { fontSize: 14, fontFamily: 'Poppins_500Medium', color: C.textSecondary },
});
