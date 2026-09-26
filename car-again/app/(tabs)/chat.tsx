/**
 * Chat Screen — Figma pixel-perfect (node 399:269)
 * bg #010a1f | Glass Button cards | filter tabs
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

const { width: W } = Dimensions.get('window');

const FILTER_W = W - 40;
const TAB_ALL  = Math.round(FILTER_W * (66 / 350));
const TAB_REST = Math.round((FILTER_W - TAB_ALL) / 4);

const FILTER_TABS = ['All', 'Call', 'Message', 'Ads', 'Support'];
const SERVER = API_BASE.replace('/api/v1', '');
function resolveUrl(u?: string | null) { if (!u) return null; if (u.startsWith('http')) return u.replace(/http:\/\/[\d.]+:\d+/, SERVER); return `${SERVER}${u}`; }


function makeStyles(aC: ReturnType<typeof useAppColors>) {
  const glassBg = aC.glassBg;
  const border  = aC.glassBorder;
  return StyleSheet.create({
    safe:  { flex: 1, backgroundColor: aC.bg },
    title: { fontSize: 20, fontFamily: 'Poppins_500Medium', color: aC.textPrimary, marginTop: 8, marginBottom: 12, paddingHorizontal: 20 },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: 12, height: 48,
      borderRadius: 32, borderWidth: 1, borderColor: border,
      backgroundColor: glassBg, paddingHorizontal: 20,
      marginHorizontal: 20, marginBottom: 20,
      shadowColor: '#1D53AF', shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
    },
    searchPh:    { fontSize: 12, fontFamily: 'Poppins_400Regular', color: aC.textSecondary },
    searchInput: { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', color: aC.textPrimary, padding: 0 },
    filterWrap: {
      flexDirection: 'row', backgroundColor: 'transparent',
      marginHorizontal: 20, marginBottom: 20, gap: 6,
    },
    filterTab: {
      flex: 1, height: 40, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, borderWidth: 1,
      borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.2)',
      backgroundColor: aC.isDark ? '#061B4A' : '#d8e4ff',
    },
    filterTabActive: {
      borderColor: aC.isDark ? 'rgba(100,160,255,0.9)' : 'rgba(3,42,105,0.5)',
      backgroundColor: aC.isDark ? 'rgba(6,27,74,0.9)' : 'rgba(196,215,255,0.9)',
    },
    filterTxtActive:    { fontSize: 10, fontFamily: 'Poppins_700Bold',   color: '#e2671b' },
    filterTxtInactive:  { fontSize: 10, fontFamily: 'Poppins_500Medium', color: aC.textPrimary },
    listContent:        { paddingHorizontal: 20, gap: 12, paddingBottom: 90 },
    convCard: {
      flexDirection: 'row', alignItems: 'center', gap: 10, height: 70,
      borderRadius: 16, borderWidth: 1,
      borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.2)',
      backgroundColor: aC.glassBg,
      paddingHorizontal: 15, paddingVertical: 11,
      overflow: 'hidden',
    },
    avatarWrap:  { position: 'relative', width: 46, height: 46, flexShrink: 0 },
    avatar:      { width: 46, height: 46, borderRadius: 23, backgroundColor: aC.gradientStart, alignItems: 'center', justifyContent: 'center' },
    avatarTxt:   { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#f9fafc' },
    onlineDot:   { position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: 5, backgroundColor: '#34c759', borderWidth: 1, borderColor: aC.gradientStart },
    convContent: { flex: 1, gap: 2 },
    convRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
    convName:    { fontSize: 12, fontFamily: 'Poppins_500Medium', color: aC.textPrimary, flex: 1 },
    convTime:    { fontSize: 10, fontFamily: 'Poppins_400Regular', color: aC.textSecondary, flexShrink: 0 },
    convMsg:     { fontSize: 10, fontFamily: 'Poppins_400Regular', color: aC.textRole, flex: 1 },
    badge:       { width: 18, height: 18, borderRadius: 9, backgroundColor: '#e2671b', alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
    badgeTxt:    { fontSize: 9, fontFamily: 'Poppins_700Bold', color: '#fff' },
    emptyWrap:   { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40, gap: 12 },
    emptyTitle:  { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: aC.textPrimary },
    emptySub:    { fontSize: 13, fontFamily: 'Poppins_400Regular', color: aC.textSecondary, textAlign: 'center', lineHeight: 20 },
  });
}

export default function ChatListScreen() {
  const router     = useRouter();
  const { token }  = useAuth();
  const aC         = useAppColors();
  const styles     = useMemo(() => makeStyles(aC), [aC.isDark]);

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setConversations(d.items || []);
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function formatTime(iso: string | null) {
    if (!iso) return '';
    let normalized = iso;
    if (!/[Z+-]/.test(iso.slice(-6)) && !iso.endsWith('Z')) normalized = iso.replace(' ', 'T') + 'Z';
    let d = new Date(normalized);
    if (isNaN(d.getTime())) d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const now = new Date(), diff = now.getTime() - d.getTime();
    if (diff < 0) return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
    return d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
  }
  function getInitials(name: string) { return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }
  function getName(item: any)    { return item.name || item.participant_info?.[0]?.full_name || 'User'; }
  function getLastMsg(item: any) { return item.lastMsg || item.last_message || 'Say hello!'; }
  function getTime(item: any)    { return item.time || formatTime(item.last_message_at); }

  const filteredConversations = conversations.filter(item => {
    const name = getName(item).toLowerCase();
    const msg  = getLastMsg(item).toLowerCase();
    const q    = searchQuery.toLowerCase().trim();
    return q === '' || name.includes(q) || msg.includes(q);
  });

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Chat</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={aC.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search buyer, seller, & dealer..."
          placeholderTextColor={aC.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={aC.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterWrap}>
        {FILTER_TABS.map(tab => {
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              android_ripple={null}
              style={[styles.filterTab, { width: tab === 'All' ? TAB_ALL : TAB_REST }, active && styles.filterTabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={active ? styles.filterTxtActive : styles.filterTxtInactive}>{tab}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color="#e2671b" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={i => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#e2671b" />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={56} color={aC.textSecondary} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySub}>Message a seller from a vehicle listing to start chatting</Text>
            </View>
          }
          renderItem={({ item }) => {
            const name    = getName(item);
            const lastMsg = getLastMsg(item);
            const time    = getTime(item);
            const unread  = item.unread || item.unread_count || 0;
            return (
              <LinearGradient
                colors={aC.isDark ? ['rgba(100,160,255,0.5)', 'rgba(100,160,255,0.5)'] : ['#032a69', '#e2671b']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 1, shadowColor: aC.isDark ? 'rgba(0,0,0,0.25)' : 'rgba(3,42,105,0.12)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: aC.isDark ? 0.2 : 0.08, shadowRadius: 10, elevation: 3 }}
              >
                <TouchableOpacity
                  style={[styles.convCard, { backgroundColor: aC.isDark ? 'rgba(1,6,20,1)' : '#ffffff', borderWidth: 0, overflow: 'hidden' }]}
                  onPress={() => router.push({ pathname: '/chat-room/[id]', params: { id: item.id, name, otherId: item.participant_info?.[0]?.id ?? '' } })}
                  activeOpacity={0.92}
                >
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
                      <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    </>
                  )}
                <View style={styles.avatarWrap}>
                  {(() => {
                    const raw = item.participant_info?.[0]?.avatar_url || (item as any).avatar_url;
                    const uri = resolveUrl(raw);
                    return uri ? (
                      <Image source={{ uri }} style={styles.avatar} resizeMode="cover" />
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarTxt}>{getInitials(name)}</Text>
                      </View>
                    );
                  })()}
                  {item.online !== false && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.convContent}>
                  <View style={styles.convRow}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.convName, { color: aC.textPrimary }]} numberOfLines={1}>{name}</Text>
                      {item.verified && <Ionicons name="checkmark-circle" size={14} color="#0088ff" />}
                    </View>
                    <Text style={[styles.convTime, { color: aC.textSecondary }]}>{time}</Text>
                  </View>
                  <View style={styles.convRow}>
                    <Text style={[styles.convMsg, { color: aC.textSecondary }]} numberOfLines={2}>{lastMsg}</Text>
                    {unread > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeTxt}>{unread > 9 ? '9+' : unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </LinearGradient>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
