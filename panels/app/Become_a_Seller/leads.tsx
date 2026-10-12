import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Search, Clock, ChevronRight, Users } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { D, GlowCard, PillGlow } from '@/components/dealer/DealerUI';
import { SavedCardEffect, savedCardOuter } from '@/components/shared/FigmaEffects';
import { useTabBarSpace } from '@/components/shared/PillTabBar';

const ORANGE = '#E2671B';
const BLUE   = 'rgba(100,160,255,0.5)';
const C      = AppColors;

const AVATAR_COLORS = ['#138A5E', '#8B3FD9', '#2E63E0', '#C0392B', '#0E7490', '#B45309'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.1)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.08)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.1)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

function LeadCard({ lead, onPress }: { lead: any; onPress: () => void }) {
  const name        = lead.buyer_name || 'Unknown User';
  const initials    = getInitials(name);
  const avatarColor = getAvatarColor(name);
  const location    = lead.location || 'Lahore';
  const phone       = lead.phone || '0333 9876543';
  const status      = lead.status || 'confirmed';
  const vehicle     = lead.vehicle_title || 'Toyota Corolla Altis 1.8 CVT';
  const color       = lead.vehicle_color || 'Silver Metallic';
  const colorDot    = lead.color_hex || '#9ca3af';
  const resId       = lead.reservation_id || `#RES-${2900 + (lead.id || 0)}`;
  const isToday     = !lead.created_at || new Date(lead.created_at).toDateString() === new Date().toDateString();
  const timeStr     = lead.created_at
    ? new Date(lead.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '04:15 PM';
  const dateStr     = isToday ? 'Today' : lead.created_at
    ? new Date(lead.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
    : '09 May 2024';
  const isConfirmed = status.toLowerCase() === 'confirmed' || status.toLowerCase() === 'new';

  return (
    <GlowCard style={lc.card} onPress={onPress} radius={22}>
      <View style={lc.topRow}>
        <View style={[lc.avatar, { backgroundColor: avatarColor }]}>
          <Text style={lc.avatarTxt}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={lc.name}>{name}</Text>
          <Text style={lc.locationPhone}>{location} • {phone}</Text>
        </View>
        <View style={lc.confirmedBadge}>
          <Text style={lc.confirmedTxt}>{isConfirmed ? 'CONFIRMED' : status.toUpperCase()}</Text>
        </View>
      </View>

      <TouchableOpacity style={lc.vehicleCard} activeOpacity={0.8} onPress={onPress}>
        <Image
          source={{ uri: lead.vehicle_image || 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=300&q=80' }}
          style={lc.vehicleImg}
          resizeMode="cover"
        />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={lc.vehicleName} numberOfLines={2}>{vehicle}</Text>
          <View style={lc.colorRow}>
            <View style={[lc.colorDot, { backgroundColor: colorDot }]} />
            <Text style={lc.colorName}>{color}</Text>
          </View>
        </View>
        <ChevronRight size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={lc.bottomRow}>
        <View style={lc.timeRow}>
          <Clock size={18} color={ORANGE} />
          <Text style={lc.timeText}>{dateStr}  {timeStr}</Text>
        </View>
        <Text style={lc.resId}>{resId}</Text>
      </View>
    </GlowCard>
  );
}

const lc = StyleSheet.create({
  card:          { padding: 16, marginBottom: 16, gap: 12 },
  topRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:        { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#0B2358', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:     { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  name:          { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF' },
  locationPhone: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#FFFFFF', marginTop: 1 },
  confirmedBadge:{ alignSelf: 'flex-start', backgroundColor: '#0B2A22', borderWidth: 1, borderColor: 'rgba(46,204,113,0.45)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 3 },
  confirmedTxt:  { color: '#2ECC71', fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.5 },
  vehicleCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: D.navy, borderRadius: 14, padding: 14, paddingRight: 16 },
  vehicleImg:    { width: 104, height: 58, borderRadius: 4 },
  vehicleName:   { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_600SemiBold', lineHeight: 21 },
  colorRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  colorDot:      { width: 12, height: 12, borderRadius: 6 },
  colorName:     { color: D.muted, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  bottomRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText:      { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  resId:         { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_400Regular' },
});

export default function BecomeSellerLeadsScreen() {
  const tabSpace = useTabBarSpace(110);
  const { user, token } = useAuth();
  const router = useRouter();

  const [leads,     setLeads]     = useState<any[]>([]);
  const [chatConvs, setChatConvs] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRef]      = useState(false);
  const [search,    setSearch]    = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const callCount = leads.filter(l => l.type === 'call').length || 12;

  useEffect(() => { fetchLeads(); fetchChats(); }, []);

  async function fetchChats() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        const items = d.items || [];
        const SERVER_BASE = API_BASE.replace('/api/v1', '');
        setChatConvs(items.map((c: any) => {
          const p = c.participant_info?.[0];
          const av = p?.avatar_url ? (p.avatar_url.startsWith('http') ? p.avatar_url.replace(/http:\/\/[\d.]+:\d+/, SERVER_BASE) : `${SERVER_BASE}${p.avatar_url}`) : null;
          return {
            id: c.id,
            buyer_name: p?.full_name || 'Customer',
            location: '',
            phone: '',
            status: 'chat',
            type: 'chat',
            vehicle_title: c.last_message || 'Chat',
            vehicle_color: '',
            reservation_id: `Chat • ${new Date(c.last_message_at || c.created_at).toLocaleDateString()}`,
            vehicle_image: av,
            created_at: c.last_message_at || c.created_at,
            avatar: av,
            last_message: c.last_message,
          };
        }));
      }
    } catch {}
  }

  async function fetchLeads() {
    if (!token || !user?.id) { setLeads([]); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/sellers/${user.id}/leads?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        const items = d.items || d || [];
        setLeads(items);
      } else {
        setLeads([]);
      }
    } catch { setLeads([]); }
    finally { setLoading(false); }
  }

  async function onRefresh() { setRef(true); await Promise.all([fetchLeads(), fetchChats()]); setRef(false); }

  function applyFilter(list: any[]) {
    // Chat tab shows real chat conversations
    if (activeTab === 'Chat') {
      let c = [...chatConvs];
      if (search) c = c.filter(x => (x.buyer_name || '').toLowerCase().includes(search.toLowerCase()) || (x.last_message || '').toLowerCase().includes(search.toLowerCase()));
      return c;
    }
    // All tab shows BOTH leads + chat participants' names (whoever chatted appears)
    if (activeTab === 'All') {
      let merged = [...list, ...chatConvs];
      // dedupe by buyer_name
      const seen = new Set<string>();
      merged = merged.filter(x => {
        const key = (x.buyer_name || '').toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (search) merged = merged.filter(l =>
        (l.buyer_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.cnic || '').includes(search) ||
        (l.reservation_id || '').includes(search)
      );
      return merged;
    }
    let result = list;
    if (search) result = result.filter(l =>
      (l.buyer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.cnic || '').includes(search) ||
      (l.reservation_id || '').includes(search)
    );
    if      (activeTab === 'Call')         result = result.filter(l => l.type === 'call');
    else if (activeTab === 'Availability') result = result.filter(l => l.type === 'availability');
    return result;
  }

  const filtered = applyFilter(leads);

  const TABS = [
    { key: 'All',          label: 'All' },
    { key: 'Call',         label: 'Call',         badge: callCount },
    { key: 'Chat',         label: 'Chat' },
    { key: 'Availability', label: 'Availability' },
  ];

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <Text style={s.title}>Customer Enquiries</Text>
        </View>

        <View style={[savedCardOuter, s.searchWrap]}>
          <SavedCardEffect band={10} />
          <Search size={20} color="#C9C6D0" strokeWidth={1.5} />
          <TextInput
            style={s.searchInput}
            placeholder="Search reservation by CNIC or ID"
            placeholderTextColor="#9C96A2"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={s.requestsLabel}>Requests</Text>

        <View style={s.tabsRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              {activeTab === tab.key && <PillGlow />}
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
              {tab.badge ? (
                <View style={s.tabBadge}>
                  <Text style={s.tabBadgeTxt}>{tab.badge}</Text>
                </View>
              ) : null}
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
          keyExtractor={item => String(item.id || Math.random())}
          contentContainerStyle={[s.list, { paddingBottom: tabSpace }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onPress={() => router.push({ pathname: '/chat-room/[id]', params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={() => (
            <View style={s.empty}>
              <Users size={48} color={C.textSecondary} />
              <Text style={s.emptyTxt}>No enquiries yet</Text>
              <Text style={s.emptySub}>Customer enquiries will appear here</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: D.bg },
  header:  { height: 56, paddingHorizontal: 16, justifyContent: 'center' },
  title:   { fontSize: 20, fontFamily: 'Poppins_500Medium', color: D.white },

  searchWrap:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 16, height: 46, borderRadius: 23, paddingLeft: 16, paddingRight: 12 },
  searchInput:   { flex: 1, height: '100%', fontSize: 14, fontFamily: 'Poppins_400Regular', color: D.white, paddingVertical: 0 },

  requestsLabel: { color: D.muted, fontSize: 16, fontFamily: 'Poppins_400Regular', paddingHorizontal: 16, marginBottom: 12 },
  tabsRow:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 18, marginTop: 4 },
  tab:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, minWidth: 56, paddingHorizontal: 18, borderRadius: 17, borderWidth: 1, backgroundColor: D.navy, borderColor: D.navy },
  tabActive:     { backgroundColor: '#05122A', borderColor: '#7F98C4', overflow: 'hidden' },
  tabText:       { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  tabTextActive: { color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  tabBadge:      { backgroundColor: ORANGE, borderRadius: 11, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeTxt:   { color: '#fff', fontSize: 10, fontFamily: 'Poppins_600SemiBold' },

  list:     { paddingHorizontal: 16, paddingBottom: 110 },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:    { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTxt: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  emptySub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary },
});
