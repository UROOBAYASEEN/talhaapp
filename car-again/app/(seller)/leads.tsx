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

const ORANGE = '#ff6900';
const BLUE   = 'rgba(100,160,255,0.5)';
const C      = AppColors;

const AVATAR_COLORS = ['#1a7a4a', '#7b2fa0', '#1a5fb4', '#c0392b', '#0e7490', '#b45309'];

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
    <TouchableOpacity style={lc.card} activeOpacity={0.85} onPress={onPress}>
      <GlassInset />
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
        <GlassInset />
        <Image
          source={{ uri: lead.vehicle_image || 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=300&q=80' }}
          style={lc.vehicleImg}
          resizeMode="cover"
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={lc.vehicleName} numberOfLines={2}>{vehicle}</Text>
          <View style={lc.colorRow}>
            <View style={[lc.colorDot, { backgroundColor: colorDot }]} />
            <Text style={lc.colorName}>{color}</Text>
          </View>
        </View>
        <ChevronRight size={18} color={C.textSecondary} />
      </TouchableOpacity>

      <View style={lc.bottomRow}>
        <View style={lc.timeRow}>
          <Clock size={12} color={ORANGE} />
          <Text style={lc.timeText}>{dateStr}  {timeStr}</Text>
        </View>
        <Text style={lc.resId}>{resId}</Text>
      </View>
    </TouchableOpacity>
  );
}

const lc = StyleSheet.create({
  card:          { borderRadius: 16, borderWidth: 1, borderColor: BLUE, backgroundColor: C.glassBg, overflow: 'hidden', padding: 13, marginBottom: 12, gap: 10 },
  topRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:     { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#fff' },
  name:          { fontSize: 14, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  locationPhone: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.textSecondary, marginTop: 1 },
  confirmedBadge:{ backgroundColor: 'rgba(0,200,100,0.15)', borderWidth: 1, borderColor: 'rgba(0,200,100,0.35)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  confirmedTxt:  { color: '#00d084', fontSize: 9, fontFamily: 'Poppins_600SemiBold' },
  vehicleCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(3,12,40,0.5)', borderRadius: 12, borderWidth: 1, borderColor: C.glassBorder, padding: 8, overflow: 'hidden' },
  vehicleImg:    { width: 72, height: 50, borderRadius: 8 },
  vehicleName:   { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },
  colorRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  colorDot:      { width: 8, height: 8, borderRadius: 4 },
  colorName:     { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  bottomRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeText:      { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  resId:         { color: ORANGE, fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
});

export default function SellerLeadsScreen() {
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

        <View style={s.searchWrap}>
          <GlassInset />
          <Search size={16} color={C.textSecondary} strokeWidth={1.5} />
          <TextInput
            style={s.searchInput}
            placeholder="Search reservation by CNIC or ID"
            placeholderTextColor={C.textPlaceholder}
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
          contentContainerStyle={s.list}
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
  root:    { flex: 1, backgroundColor: C.bg },
  header:  { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 },
  title:   { fontSize: 18, fontFamily: 'Poppins_700Bold', color: C.textPrimary },

  searchWrap:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 16, borderRadius: 30, borderWidth: 1, borderColor: BLUE, backgroundColor: C.glassBg, paddingHorizontal: 16, paddingVertical: 12, overflow: 'hidden' },
  searchInput:   { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textPrimary, paddingVertical: 0 },

  requestsLabel: { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold', paddingHorizontal: 16, marginBottom: 10 },
  tabsRow:       { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 14 },
  tab:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.glassBg, borderWidth: 1, borderColor: C.glassBorder },
  tabActive:     { borderColor: ORANGE, backgroundColor: 'rgba(255,105,0,0.1)' },
  tabText:       { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  tabTextActive: { color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  tabBadge:      { backgroundColor: ORANGE, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeTxt:   { color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold' },

  list:     { paddingHorizontal: 16, paddingBottom: 110 },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:    { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTxt: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  emptySub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary },
});
