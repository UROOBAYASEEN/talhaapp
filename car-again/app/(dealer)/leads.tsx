import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Search,
  Clock,
  ChevronRight,
  Users,
  Phone,
  MapPin,
  X,
  Calendar,
  Hash,
} from 'lucide-react-native';
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
  // AGENTS.md — Card 4-Side Border Shade Design (0.35 opacity, 4 gradients)
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

/* ── Lead Card ── */
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

      {/* TOP ROW — avatar + name + status */}
      <View style={lc.topRow}>
        <View style={[lc.avatar, { backgroundColor: avatarColor }]}>
          <Text style={lc.avatarTxt}>{initials}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={lc.name}>{name}</Text>
          <Text style={lc.locationPhone}>{location} • {phone}</Text>
        </View>

        <View style={lc.confirmedBadge}>
          <Text style={lc.confirmedTxt}>
            {isConfirmed ? 'CONFIRMED' : status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* VEHICLE CARD */}
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

      {/* BOTTOM ROW — time + res ID */}
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
  card:          { borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(1,6,20,1)', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', padding: 13, marginBottom: 12, gap: 10 },

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

/* ── User Profile Modal ── */
function UserProfileModal({ lead, visible, onClose }: {
  lead: any; visible: boolean; onClose: () => void;
}) {
  if (!lead) return null;
  const name        = lead.buyer_name || 'Unknown User';
  const initials    = getInitials(name);
  const avatarColor = getAvatarColor(name);
  const phone       = lead.phone || '—';
  const location    = lead.location || '—';
  const vehicle     = lead.vehicle_title || '—';
  const color       = lead.vehicle_color || '—';
  const resId       = lead.reservation_id || `#RES-${2900 + (lead.id || 0)}`;
  const status      = lead.status || 'confirmed';
  const isConfirmed = status.toLowerCase() === 'confirmed' || status.toLowerCase() === 'new';
  const dateStr     = lead.created_at
    ? new Date(lead.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pm.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={pm.sheet}>
          <LinearGradient colors={['rgba(22,64,136,0.3)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

          {/* Handle */}
          <View style={pm.handle} />

          {/* Close btn */}
          <TouchableOpacity style={pm.closeBtn} onPress={onClose}>
            <X size={18} color={C.textSecondary} />
          </TouchableOpacity>

          {/* Avatar + Name */}
          <View style={pm.avatarSection}>
            <View style={[pm.avatar, { backgroundColor: avatarColor }]}>
              <Text style={pm.avatarTxt}>{initials}</Text>
            </View>
            <Text style={pm.userName}>{name}</Text>
            <View style={[pm.statusBadge, { backgroundColor: isConfirmed ? 'rgba(0,200,100,0.12)' : 'rgba(255,105,0,0.12)', borderColor: isConfirmed ? 'rgba(0,200,100,0.35)' : 'rgba(255,105,0,0.35)' }]}>
              <Text style={[pm.statusTxt, { color: isConfirmed ? '#00d084' : ORANGE }]}>
                {isConfirmed ? 'CONFIRMED' : status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Info rows */}
          <View style={pm.infoCard}>
            <GlassInset />
            <InfoRow icon={<Phone size={14} color={ORANGE} />}     label="Phone"       value={phone} />
            <View style={pm.divider} />
            <InfoRow icon={<MapPin size={14} color={ORANGE} />}    label="Location"    value={location} />
            <View style={pm.divider} />
            <InfoRow icon={<Calendar size={14} color={ORANGE} />}  label="Date"        value={dateStr} />
            <View style={pm.divider} />
            <InfoRow icon={<Hash size={14} color={ORANGE} />}      label="Reservation" value={resId} />
          </View>

          {/* Vehicle of interest */}
          <Text style={pm.sectionLabel}>Vehicle of Interest</Text>
          <View style={pm.vehicleCard}>
            <GlassInset />
            <Image
              source={{ uri: lead.vehicle_image || 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=300&q=80' }}
              style={pm.vehicleImg}
              resizeMode="cover"
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={pm.vehicleName} numberOfLines={2}>{vehicle}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <View style={[pm.colorDot, { backgroundColor: lead.color_hex || '#9ca3af' }]} />
                <Text style={pm.colorTxt}>{color}</Text>
              </View>
            </View>
          </View>


        </View>
      </View>
    </Modal>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={pm.infoRow}>
      <View style={pm.infoIcon}>{icon}</View>
      <Text style={pm.infoLabel}>{label}</Text>
      <Text style={pm.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const pm = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#060f2e', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36, borderWidth: 1, borderColor: 'rgba(100,160,255,0.2)', overflow: 'hidden' },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  closeBtn:     { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },

  avatarSection:{ alignItems: 'center', marginBottom: 20, gap: 8 },
  avatar:       { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  avatarTxt:    { fontSize: 24, fontFamily: 'Poppins_700Bold', color: '#fff' },
  userName:     { fontSize: 18, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  statusBadge:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  statusTxt:    { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },

  infoCard:     { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.2)', backgroundColor: 'rgba(3,12,40,0.6)', overflow: 'hidden', marginBottom: 16 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  infoIcon:     { width: 28 },
  infoLabel:    { width: 90, color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  infoValue:    { flex: 1, color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_500Medium', textAlign: 'right' },
  divider:      { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 14 },

  sectionLabel: { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 10 },
  vehicleCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(3,12,40,0.6)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(100,160,255,0.2)', padding: 10, overflow: 'hidden', marginBottom: 20 },
  vehicleImg:   { width: 80, height: 56, borderRadius: 8 },
  vehicleName:  { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },
  colorDot:     { width: 8, height: 8, borderRadius: 4 },
  colorTxt:     { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular' },

  actionRow:    { gap: 10 },
  chatBtn:      { height: 50, borderRadius: 25, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chatBtnTxt:   { color: '#fff', fontSize: 14, fontFamily: 'Poppins_700Bold' },
});

/* ── Main Screen ── */
export default function LeadsScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();

  const [leads, setLeads]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRef]      = useState(false);
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    if (tab === 'Reservation') setActiveTab('Reservation');
  }, [tab]);

  const callCount = leads.filter(l => l.type === 'call').length || 12;

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    if (!token || !user?.id) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/dealers/${user.id}/leads?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setLeads(d.items || d || []);
      }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }

  async function onRefresh() { setRef(true); await fetchLeads(); setRef(false); }

  function applyFilter(list: any[]) {
    let result = list;
    if (search) result = result.filter(l =>
      (l.buyer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.cnic || '').includes(search) ||
      (l.reservation_id || '').includes(search)
    );
    if (activeTab === 'Reservation') result = result.filter(l => l.type === 'reservation' || !l.type);
    else if (activeTab === 'Call')       result = result.filter(l => l.type === 'call');
    else if (activeTab === 'Test Drive') result = result.filter(l => l.type === 'test_drive');
    return result;
  }

  const filtered = applyFilter(leads);

  const testDriveCount = leads.filter(l => l.type === 'test_drive').length || 0;

  const TABS = [
    { key: 'All',         label: 'All' },
    { key: 'Reservation', label: 'Reservation' },
    { key: 'Call',        label: 'Call',       badge: callCount },
    { key: 'Test Drive',  label: 'Test Drive', badge: testDriveCount > 0 ? testDriveCount : undefined },
  ];

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={22} color={C.textPrimary} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={s.title}>Customer Enquiries</Text>
        </View>

        {/* SEARCH */}
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

        {/* REQUESTS LABEL */}
        <Text style={s.requestsLabel}>Requests</Text>

        {/* TABS */}
        <View style={s.tabsRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
                {tab.label}
              </Text>
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
              onPress={() => {
                if (activeTab === 'Reservation' || item.type === 'reservation' || !item.type) {
                  router.push({
                    pathname: '/dealer-panel/reservation-detail',
                    params: {
                      reservation_id:  item.reservation_id || `AWZ-2026-${String(item.id).padStart(6, '0')}`,
                      status:          item.status || 'Confirmed',
                      buyer_id:        item.buyer_id || item.user_id || item.id,
                      buyer_name:      item.buyer_name,
                      phone:           item.phone,
                      cnic:            item.cnic,
                      email:           item.email,
                      location:        item.location,
                      vehicle_title:   item.vehicle_title,
                      vehicle_image:   item.vehicle_image,
                      vehicle_color:   item.vehicle_color,
                      price:           item.price,
                      reserved_amount: item.reserved_amount,
                      created_at:      item.created_at,
                    },
                  } as any);
                } else {
                  setSelectedLead(item);
                }
              }}
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

      {/* User Profile Modal */}
      <UserProfileModal
        lead={selectedLead}
        visible={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.bg },

  /* HEADER */
  header:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 },
  backBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: C.glassBg, borderWidth: 1, borderColor: C.glassBorder, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 18, fontFamily: 'Poppins_700Bold', color: C.textPrimary },

  /* SEARCH */
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 16, borderRadius: 30, borderWidth: 1, borderColor: BLUE, backgroundColor: C.glassBg, paddingHorizontal: 16, paddingVertical: 12, overflow: 'hidden' },
  searchInput: { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textPrimary, paddingVertical: 0 },

  /* LABELS + TABS */
  requestsLabel: { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold', paddingHorizontal: 16, marginBottom: 10 },
  tabsRow:       { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 14 },
  tab:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.glassBg, borderWidth: 1, borderColor: C.glassBorder },
  tabActive:     { borderColor: ORANGE, backgroundColor: 'rgba(255,105,0,0.1)' },
  tabText:       { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  tabTextActive: { color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  tabBadge:      { backgroundColor: ORANGE, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeTxt:   { color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold' },

  /* LIST */
  list:     { paddingHorizontal: 16, paddingBottom: 110 },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:    { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTxt: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  emptySub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary },
});
