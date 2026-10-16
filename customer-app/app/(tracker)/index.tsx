import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Polyline } from 'react-native-svg';
import { D, DICON, DIcon, GlowCard, Verified } from '@/components/dealer/DealerUI';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import Chatbot from '@/components/shared/Chatbot';
import WelcomeBanner from '@/components/shared/WelcomeBanner';

const SERVER = API_BASE.replace('/api/v1', '');
function resolveUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}

const ORANGE = '#e2671b';

const QUICK_ACTIONS = [
  { title: 'New Tracker',        icon: <Ionicons name="add" size={30} color={ORANGE} />,     route: '/(tracker)/new-tracker' },
  { title: 'New Special\nOffer', icon: <Ionicons name="add" size={30} color={ORANGE} />,     route: '/(tracker)/special-offer' },
  { title: 'Add Video',          icon: <Ionicons name="add" size={30} color={ORANGE} />,     route: '/(tracker)/video-ads' },
  { title: 'Advertisement',      icon: <DIcon src={DICON.advertisement} size={26} />,        route: '/(tracker)/advertisement' },
  { title: 'Clients',            icon: <DIcon src={DICON.customers} size={24} />,            route: '/(tracker)/clients' },
];

const TILE_W = (Dimensions.get('window').width - 32 - 24) / 4;

const MAX_BAR_H = 112;

function buildBarData(bookings: any[], mode: 'Daily' | 'Weekly' | 'Monthly') {
  const now   = new Date();
  const slots = 7;
  const counts: number[] = Array(slots).fill(0);
  const labels: string[] = [];

  for (let i = slots - 1; i >= 0; i--) {
    const d = new Date(now);
    if (mode === 'Daily') {
      d.setDate(d.getDate() - i);
      labels[slots - 1 - i] = i === 0 ? 'Today' : `${d.getDate()}/${d.getMonth() + 1}`;
    } else if (mode === 'Weekly') {
      d.setDate(d.getDate() - i * 7);
      labels[slots - 1 - i] = i === 0 ? 'This Wk' : `W${slots - i}`;
    } else {
      d.setMonth(d.getMonth() - i);
      labels[slots - 1 - i] = i === 0 ? d.toLocaleString('default', { month: 'short' }) : d.toLocaleString('default', { month: 'short' });
    }
  }

  bookings.forEach(b => {
    if (!b.created_at) return;
    const date = new Date(b.created_at);
    for (let i = 0; i < slots; i++) {
      const slotDate = new Date(now);
      if (mode === 'Daily') {
        slotDate.setDate(slotDate.getDate() - (slots - 1 - i));
        if (date.toDateString() === slotDate.toDateString()) { counts[i]++; break; }
      } else if (mode === 'Weekly') {
        const ws = new Date(now); ws.setDate(ws.getDate() - (slots - 1 - i) * 7);
        const we = new Date(ws); we.setDate(we.getDate() + 7);
        if (date >= ws && date < we) { counts[i]++; break; }
      } else {
        if (date.getMonth() === new Date(now.getFullYear(), now.getMonth() - (slots - 1 - i)).getMonth() &&
            date.getFullYear() === new Date(now.getFullYear(), now.getMonth() - (slots - 1 - i)).getFullYear()) {
          counts[i]++; break;
        }
      }
    }
  });

  const maxCount = Math.max(...counts, 1);
  return counts.map((count, i) => ({
    h:       Math.max(8, Math.round((count / maxCount) * MAX_BAR_H)),
    label:   labels[i],
    opacity: i === slots - 1 ? 1.0 : 0.2 + (i / slots) * 0.6,
    count,
  }));
}

export default function TrackerHomeScreen() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [stats,     setStats]    = useState<any>(null);
  const [activity,  setActivity] = useState<any[]>([]);
  const [bookings,  setBookings] = useState<any[]>([]);
  const [refreshing, setRef]     = useState(false);
  const [viewMode,  setViewMode] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [showViewDrop, setShowViewDrop] = useState(false);
  const [unreadCount,  setUnreadCount]  = useState(0);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!token || !user?.id) return;
    try {
      const [sRes, aRes, nRes, bRes] = await Promise.all([
        fetch(`${API_BASE}/tracker-providers/${user.id}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/tracker-providers/${user.id}/activity?limit=3`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/notifications/?limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/tracker-bookings/mine?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (aRes.ok) { const d = await aRes.json(); setActivity(d.items || d || []); }
      if (nRes.ok) { const d = await nRes.json(); setUnreadCount(d.unread_count || 0); }
      if (bRes.ok) setBookings(await bRes.json());
    } catch { /* offline */ }
  }

  async function onRefresh() { setRef(true); await load(); setRef(false); }

  const companyName    = user?.full_name || 'Tracker Co.';
  const totalDevices   = stats?.total_devices   ?? 0;
  const activeDevices  = stats?.active_devices  ?? 0;
  const alertsCount    = stats?.alerts_count    ?? 0;
  const weeklyGrowth   = stats?.weekly_growth   ?? 0;
  const activeGrowth   = stats?.active_growth   ?? 0;
  const alertsChange   = stats?.alerts_change   ?? 0;

  const ACTIVITIES = activity.length > 0
    ? activity.map((a: any) => ({
        title:    a.title    || a.message     || 'Activity',
        subtitle: a.subtitle || a.description || '',
        icon: <Ionicons name="chatbubbles-outline" size={24} color={ORANGE} />,
      }))
    : [
        { title: 'New tracker application received', subtitle: 'Honda Civic RS 2026 • Black', icon: <DIcon src={DICON.activeReservations} size={24} /> },
        { title: 'New enquiry',                      subtitle: 'Yamaha YBR 125 • Blue',       icon: <Ionicons name="chatbubbles-outline" size={24} color={ORANGE} /> },
        { title: 'Advertisement approved',           subtitle: 'Homepage Banner • 7 Days',    icon: <DIcon src={DICON.advertisement} size={22} /> },
      ];

  // Bar chart + trend line (Figma) — same data as before
  const barData = buildBarData(bookings, viewMode);
  const CHART_H = 150;
  const maxH = Math.max(...barData.map(b => b.h), 1);
  const bars = barData.map(b => ({ ...b, pct: (b.h / maxH) * 100 }));
  const [chartW, setChartW] = useState(0);
  const barGap = 8;
  const barW = chartW ? (chartW - barGap * (bars.length - 1)) / bars.length : 0;
  const scale = CHART_H / 100;
  const linePts = chartW ? bars.map((b, i) => `${i * (barW + barGap) + barW / 2},${CHART_H - b.pct * scale - 8}`).join(' ') : '';


  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
      >
        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.profileRow}>
            {user?.avatar_url ? (
              <Image source={{ uri: resolveUrl(user.avatar_url) }} style={s.avatar} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarLetter}>{companyName[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={{ marginLeft: 14, flexShrink: 1 }}>
              <View style={s.nameRow}>
                <Text style={s.companyName} numberOfLines={1}>{companyName}</Text>
                <Verified size={20} />
              </View>
            </View>
          </View>
          <View style={s.headerIcons}>
            <TouchableOpacity onPress={() => router.push('/alert' as any)} style={{ position: 'relative' }}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tracker)/profile' as any)}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── WELCOME BANNER ── */}
        <WelcomeBanner style={{ marginTop: 4 }} />

        {/* ── OVERVIEW HEADER ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitleInline}>Overview</Text>
          <TouchableOpacity onPress={() => router.push('/(tracker)/analytics' as any)}>
            <Text style={s.analyticsLink}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* ── TRACKER SELL CHART CARD ── */}
        <GlowCard style={s.chartCard}>
          <View style={s.chartTopRow}>
            <View>
              <Text style={s.chartLabel}>TOTAL TRACKER SELL</Text>
              <Text style={s.chartNumber}>{Number(totalDevices).toLocaleString()}</Text>
            </View>
            <View style={s.chartTopRight}>
              <View style={s.percentBadge}>
                <Ionicons name="trending-up" size={14} color="#C9713F" />
                <Text style={s.percentText}>+{weeklyGrowth}%</Text>
              </View>
              <View>
                <TouchableOpacity style={s.weekButton} onPress={() => setShowViewDrop(v => !v)}>
                  <Text style={s.weekText}>{viewMode} View</Text>
                  <Ionicons name={showViewDrop ? 'chevron-up' : 'chevron-down'} size={16} color="#E6E1E8" />
                </TouchableOpacity>
                {showViewDrop && (
                  <View style={s.viewDropdown}>
                    {(['Daily', 'Weekly', 'Monthly'] as const).map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={[s.viewDropItem, viewMode === opt && s.viewDropItemActive]}
                        onPress={() => { setViewMode(opt); setShowViewDrop(false); }}
                      >
                        <Text style={[s.viewDropText, viewMode === opt && s.viewDropTextActive]}>{opt} View</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={[s.chartArea, { height: CHART_H }]} onLayout={e => setChartW(e.nativeEvent.layout.width)}>
            {bars.map((b, i) => {
              const t = bars.length > 1 ? i / (bars.length - 1) : 1;
              return (
                <View key={i} style={{ width: barW || undefined, flex: barW ? undefined : 1, height: b.pct * scale, marginLeft: i ? barGap : 0, overflow: 'hidden' }}>
                  <LinearGradient
                    colors={[`rgba(226,103,27,${(0.12 + t * 0.88).toFixed(2)})`, `rgba(226,103,27,${(0.08 + t * 0.8).toFixed(2)})`]}
                    start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </View>
              );
            })}
            {chartW > 0 && (
              <Svg style={StyleSheet.absoluteFill} width={chartW} height={CHART_H} pointerEvents="none">
                <Polyline points={linePts} fill="none" stroke="rgba(160,72,30,0.9)" strokeWidth={3} strokeLinejoin="round" />
              </Svg>
            )}
          </View>
          <View style={s.chartDates}>
            {bars.map((b, i) => (
              <Text key={i} style={[s.chartDateText, { width: barW || undefined, marginLeft: i ? barGap : 0 }]} numberOfLines={1}>{b.label}</Text>
            ))}
          </View>
        </GlowCard>

        {/* ── ACTIVE / PENDING STATS ── */}
        <View style={s.statsRow}>
          <GlowCard style={s.statCard}>
            <View style={s.statTop}>
              <Ionicons name="checkmark-circle-outline" size={20} color={ORANGE} />
              <Text style={s.statNumber}>{Number(activeDevices).toLocaleString()}</Text>
            </View>
            <Text style={s.statLabel}>Active</Text>
            <View style={s.statChange}>
              <Ionicons name="arrow-up" size={14} color="#2ECC71" />
              <Text style={[s.statChangeText, { color: '#2ECC71' }]}>+{activeGrowth}%</Text>
            </View>
          </GlowCard>
          <GlowCard style={s.statCard}>
            <View style={s.statTop}>
              <MaterialCommunityIcons name="monitor-dashboard" size={20} color="#E0363A" />
              <Text style={s.statNumber}>{alertsCount}</Text>
            </View>
            <Text style={s.statLabel}>Pending</Text>
            <View style={s.statChange}>
              <Ionicons name="arrow-up" size={14} color="#E0363A" />
              <Text style={[s.statChangeText, { color: '#E0363A' }]}>{alertsChange}%</Text>
            </View>
          </GlowCard>
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View style={s.quickSection}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.actionsGrid}>
            {QUICK_ACTIONS.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={s.actionCard}
                activeOpacity={0.75}
                onPress={() => action.route && router.push(action.route as any)}
              >
                {action.icon}
                <Text style={s.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── RECENT ACTIVITY ── */}
        <View style={s.activitySection}>
          <Text style={s.sectionTitle}>Recent Activity</Text>
          {ACTIVITIES.map((item, i) => (
            <GlowCard key={i} style={s.activityCard} onPress={() => {}}>
              <View style={s.activityIconWrap}>{item.icon}</View>
              <View style={s.activityInfo}>
                <Text style={s.activityTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.activitySub} numberOfLines={1}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={26} color={ORANGE} />
            </GlowCard>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      <Chatbot aboveTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.bg },
  scroll:   { flex: 1 },
  content:  { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },

  header:        { height: 84, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileRow:    { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  avatar:        { width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: '#FFFFFF' },
  avatarFallback:{ width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#C8102E', justifyContent: 'center', alignItems: 'center' },
  avatarLetter:  { color: '#fff', fontSize: 28, fontFamily: 'Poppins_700Bold' },
  nameRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  companyName:   { color: D.white, fontSize: 18, lineHeight: 26, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
  planRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 0, gap: 6 },
  planText:      { color: ORANGE, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  headerIcons:   { flexDirection: 'row', gap: 18, marginBottom: 24 },
  notifBadge:    { position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifBadgeTxt: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: '#fff' },

  welcomeCard:  { minHeight: 94, backgroundColor: D.navy, borderRadius: 20, paddingLeft: 18, paddingRight: 8, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  welcomeText:  { flex: 1 },
  welcomeSub:   { color: '#FFFFFF', fontSize: 11, marginBottom: 6, fontFamily: 'Poppins_400Regular' },
  welcomeTitle: { color: '#FFFFFF', fontSize: 13, lineHeight: 20, fontFamily: 'Poppins_600SemiBold' },
  carImage:     { width: 116, height: 70 },

  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 6 },
  sectionTitle:       { color: D.white, fontSize: 18, fontFamily: 'Poppins_500Medium', marginBottom: 14 },
  sectionTitleInline: { color: D.white, fontSize: 18, fontFamily: 'Poppins_500Medium' },
  analyticsLink:      { color: ORANGE, fontSize: 14, fontFamily: 'Poppins_400Regular' },

  chartCard:     { marginTop: 8, padding: 14 },
  chartTopRow:   { flexDirection: 'row', justifyContent: 'space-between', zIndex: 5 },
  chartLabel:    { color: '#FFFFFF', fontSize: 12, letterSpacing: 1.2, fontFamily: 'Poppins_400Regular' },
  chartNumber:   { color: '#FFFFFF', fontSize: 24, marginTop: 6, fontFamily: 'Poppins_600SemiBold' },
  chartTopRight: { alignItems: 'flex-end', gap: 8 },
  percentBadge:  { backgroundColor: '#3A2420', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 4 },
  percentText:   { color: '#C9713F', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  weekButton:    { borderWidth: 1, borderColor: 'rgba(230,225,232,0.8)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  weekText:      { color: '#E6E1E8', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  viewDropdown:      { position: 'absolute', top: 34, right: 0, backgroundColor: 'rgba(6,18,52,0.98)', borderWidth: 1, borderColor: 'rgba(130,165,213,0.5)', borderRadius: 12, zIndex: 99, minWidth: 120, overflow: 'hidden' },
  viewDropItem:      { paddingHorizontal: 14, paddingVertical: 10 },
  viewDropItemActive:{ backgroundColor: 'rgba(226,103,27,0.15)' },
  viewDropText:      { color: D.muted, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  viewDropTextActive:{ color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  chartArea:     { marginTop: 18, flexDirection: 'row', alignItems: 'flex-end' },
  chartDates:    { flexDirection: 'row', marginTop: 6 },
  chartDateText: { color: 'rgba(230,225,232,0.45)', fontSize: 10, fontFamily: 'Poppins_400Regular', textAlign: 'center' },

  statsRow:       { flexDirection: 'row', gap: 14, marginTop: 12 },
  statCard:       { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statTop:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statNumber:     { color: '#C9BDC4', fontSize: 20, fontFamily: 'Poppins_600SemiBold' },
  statLabel:      { color: '#C9BDC4', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  statChange:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statChangeText: { fontSize: 12, fontFamily: 'Poppins_400Regular' },

  quickSection: { marginTop: 22 },
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 8 },
  actionCard:   { width: TILE_W, height: 92, borderRadius: 16, backgroundColor: D.navy, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 2 },
  actionText:   { color: '#C9BDC4', fontSize: 11, textAlign: 'center', lineHeight: 14, fontFamily: 'Poppins_400Regular' },

  activitySection:  { marginTop: 26 },
  activityCard:     { minHeight: 60, marginBottom: 12, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  activityIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0B2358', alignItems: 'center', justifyContent: 'center' },
  activityInfo:     { flex: 1, marginLeft: 10 },
  activityTitle:    { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  activitySub:      { color: D.muted, fontSize: 10, marginTop: 2, fontFamily: 'Poppins_400Regular' },
});
