import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Bell,
  Settings,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Users,
  Crown,
  Plus,
  Video,
  Megaphone,
  CalendarCheck,
  MessageCircle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import Chatbot from '@/components/shared/Chatbot';

const SERVER = API_BASE.replace('/api/v1', '');
function resolveUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}

const ORANGE     = '#e2671b';
const DARK_BLUE  = '#061B4A';
const BLUE_BORDER = 'rgba(255,255,255,0.15)';

const QUICK_ACTIONS = [
  { title: 'New\nTracker',      Icon: Plus,          route: '/(tracker)/new-tracker' },
  { title: 'Clients',           Icon: Users,         route: '/(tracker)/clients' },
  { title: 'Subscription',      Icon: Crown,         route: '/(tracker)/plan' },
  { title: 'Add Special\nOffer',Icon: Plus,          route: '/(tracker)/special-offer' },
  { title: 'Add Video',         Icon: Video,         route: '/(tracker)/video-ads' },
  { title: 'Advertisement',     Icon: Megaphone,     route: '/(tracker)/advertisement' },
];

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

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

  const ACTIVITIES = activity.map((a: any) => ({
    title:    a.title    || a.message     || 'Activity',
    subtitle: a.subtitle || a.description || '',
    Icon: MessageCircle,
  }));

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
            <View style={{ marginLeft: 12 }}>
              <View style={s.nameRow}>
                <Text style={s.companyName}>{companyName}</Text>
                <View style={s.verifiedBadge}>
                  <Text style={s.verifiedTick}>✓</Text>
                </View>
              </View>
              <View style={s.planRow}>
                <MapPin size={11} color={ORANGE} />
                <Text style={s.planText}>Premium Plan</Text>
              </View>
            </View>
          </View>
          <View style={s.headerIcons}>
            <TouchableOpacity onPress={() => router.push('/alert' as any)} style={{ position: 'relative' }}>
              <Bell size={20} color={AppColors.textPrimary} />
              {unreadCount > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tracker)/profile' as any)}>
              <Settings size={20} color={AppColors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── WELCOME BANNER ── */}
        <View style={s.welcomeCard}>
          <View style={s.welcomeText}>
            <Text style={s.welcomeSub}>Welcome Back,</Text>
            <Text style={s.welcomeTitle}>
              Monitor. Protect. Track{'\n'}with Autowizor!
            </Text>
          </View>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=400&q=80' }}
            style={s.carImage}
            resizeMode="contain"
          />
        </View>

        {/* ── OVERVIEW HEADER ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Overview</Text>
          <TouchableOpacity onPress={() => router.push('/(tracker)/analytics' as any)}>
            <Text style={s.analyticsLink}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* ── DEVICES CHART CARD ── */}
        <View style={s.chartCard}>
          <GlassInset />

          <View style={s.chartTopRow}>
            <View>
              <Text style={s.chartLabel}>TOTAL DEVICES</Text>
              <Text style={s.chartNumber}>{Number(totalDevices).toLocaleString()}</Text>
            </View>
            <View style={s.chartTopRight}>
              <View style={s.percentBadge}>
                <Text style={s.percentText}>+{weeklyGrowth}%</Text>
              </View>
              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  style={s.weekButton}
                  onPress={() => setShowViewDrop(v => !v)}
                >
                  <Text style={s.weekText}>{viewMode} View</Text>
                  <Text style={s.downArrow}>⌄</Text>
                </TouchableOpacity>
                {showViewDrop && (
                  <View style={s.viewDropdown}>
                    {(['Daily', 'Weekly', 'Monthly'] as const).map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={[s.viewDropItem, viewMode === opt && s.viewDropItemActive]}
                        onPress={() => { setViewMode(opt); setShowViewDrop(false); }}
                      >
                        <Text style={[s.viewDropText, viewMode === opt && s.viewDropTextActive]}>
                          {opt} View
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {(() => {
            const barData = buildBarData(bookings, viewMode);
            return (
              <>
                <View style={s.chartArea}>
                  {barData.map((bar, i) => (
                    <View key={i} style={s.barCol}>
                      <Text style={s.barCount}>{bar.count > 0 ? bar.count : ''}</Text>
                      <View style={[s.bar, { height: bar.h }]}>
                        <LinearGradient
                          colors={bar.opacity === 1
                            ? ['#e2671b', '#ff9a00']
                            : [`rgba(226,103,27,${bar.opacity})`, `rgba(226,103,27,${bar.opacity * 0.7})`]
                          }
                          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                          style={[StyleSheet.absoluteFillObject, { borderRadius: 3 }]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
                <View style={s.chartDates}>
                  {barData.map((bar, i) => (
                    <Text key={i} style={[s.chartDateText, (bar.label === 'Today' || bar.label === 'This Wk') && s.chartDateToday]}>
                      {bar.label}
                    </Text>
                  ))}
                </View>
              </>
            );
          })()}
        </View>

        {/* ── ACTIVE / ALERTS STATS ── */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <GlassInset />
            <View style={s.statTop}>
              <CheckCircle2 size={17} color={ORANGE} />
              <Text style={s.statNumber}>{Number(activeDevices).toLocaleString()}</Text>
            </View>
            <Text style={s.statLabel}>Active</Text>
            <View style={s.statChange}>
              <TrendingUp size={12} color="#009759" />
              <Text style={[s.statChangeText, { color: '#009759' }]}>+{activeGrowth}%</Text>
            </View>
          </View>

          <View style={s.statCard}>
            <GlassInset />
            <View style={s.statTop}>
              <AlertTriangle size={16} color={ORANGE} />
              <Text style={s.statNumber}>{alertsCount}</Text>
            </View>
            <Text style={s.statLabel}>Alerts</Text>
            <View style={s.statChange}>
              <TrendingDown size={12} color="#ba1a1a" />
              <Text style={[s.statChangeText, { color: '#ba1a1a' }]}>{alertsChange}%</Text>
            </View>
          </View>
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
                {/* CLAUDE.md 4-side glass shade */}
                <LinearGradient colors={['rgba(22,64,136,0.35)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.25}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent','rgba(29,83,175,0.35)']} start={{x:0.5,y:0.75}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['rgba(13,37,84,0.35)','transparent']} start={{x:0,y:0.5}} end={{x:0.25,y:0.5}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent','rgba(13,37,84,0.35)']} start={{x:0.75,y:0.5}} end={{x:1,y:0.5}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <action.Icon size={22} color={ORANGE} />
                <Text style={s.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── RECENT ACTIVITY ── */}
        <View style={s.activitySection}>
          <Text style={s.sectionTitle}>Recent Activity</Text>
          {ACTIVITIES.length === 0 ? (
            <View style={s.emptyBox}>
              <Activity size={32} color={AppColors.textSecondary} />
              <Text style={s.emptyTxt}>No recent activity</Text>
            </View>
          ) : (
            ACTIVITIES.map((item, i) => (
              <TouchableOpacity key={i} style={s.activityCard} activeOpacity={0.8}>
                <GlassInset />
                <View style={s.activityIconWrap}>
                  <item.Icon size={20} color={ORANGE} />
                </View>
                <View style={s.activityInfo}>
                  <Text style={s.activityTitle}>{item.title}</Text>
                  <Text style={s.activitySub}>{item.subtitle}</Text>
                </View>
                <ChevronRight size={18} color={ORANGE} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      <Chatbot />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.bg },
  scroll:   { flex: 1 },
  content:  { paddingHorizontal: 16, paddingTop: 6 },

  /* HEADER */
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  profileRow:    { flexDirection: 'row', alignItems: 'center' },
  avatar:        { width: 58, height: 58, borderRadius: 29, borderWidth: 1.2, borderColor: '#fff' },
  avatarFallback:{ width: 58, height: 58, borderRadius: 29, borderWidth: 1.2, borderColor: '#fff', backgroundColor: '#d71920', alignItems: 'center', justifyContent: 'center' },
  avatarLetter:  { color: '#fff', fontSize: 24, fontFamily: 'Poppins_700Bold' },
  nameRow:       { flexDirection: 'row', alignItems: 'center' },
  companyName:   { color: AppColors.textPrimary, fontSize: 15, fontFamily: 'Poppins_500Medium' },
  verifiedBadge: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#1686f7', marginLeft: 6, alignItems: 'center', justifyContent: 'center' },
  verifiedTick:  { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  planRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  planText:      { color: ORANGE, fontSize: 11, marginLeft: 4, fontFamily: 'Poppins_400Regular' },
  headerIcons:   { flexDirection: 'row', gap: 14 },
  notifBadge:    { position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifBadgeTxt: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: '#fff' },

  /* WELCOME BANNER */
  welcomeCard:  { backgroundColor: '#061B4A', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', minHeight: 90, marginBottom: 16 },
  welcomeText:  { flex: 1 },
  welcomeSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Poppins_400Regular', marginBottom: 4 },
  welcomeTitle: { color: '#fff', fontSize: 12, lineHeight: 18, fontFamily: 'Poppins_700Bold' },
  carImage:     { width: 110, height: 68 },

  /* SECTION HEADER */
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { color: AppColors.textPrimary, fontSize: 15, fontFamily: 'Poppins_500Medium' },
  analyticsLink: { color: ORANGE, fontSize: 12, fontFamily: 'Poppins_500Medium' },

  /* CHART CARD */
  chartCard:     { backgroundColor: '#010A1F', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', borderRadius: 16, padding: 12, overflow: 'hidden', marginBottom: 12 },
  chartTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  chartLabel:    { color: AppColors.textSecondary, fontSize: 10, letterSpacing: 0.6, fontFamily: 'Poppins_400Regular', textTransform: 'uppercase' },
  chartNumber:   { color: AppColors.textPrimary, fontSize: 24, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },
  chartTopRight: { alignItems: 'flex-end', gap: 8 },
  percentBadge:  { backgroundColor: 'rgba(226,103,27,0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  percentText:   { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  weekButton:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: AppColors.textSecondary, borderRadius: 16, paddingHorizontal: 9, paddingVertical: 4 },
  weekText:      { color: AppColors.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  downArrow:     { color: AppColors.textSecondary, fontSize: 14, marginLeft: 3 },
  viewDropdown:  { position: 'absolute', top: 36, right: 0, backgroundColor: 'rgba(6,18,52,0.98)', borderWidth: 1, borderColor: BLUE_BORDER, borderRadius: 12, zIndex: 99, minWidth: 120 },
  viewDropItem:  { paddingHorizontal: 14, paddingVertical: 10 },
  viewDropItemActive: { backgroundColor: 'rgba(226,103,27,0.15)' },
  viewDropText:  { color: AppColors.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  viewDropTextActive: { color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  chartArea:     { flexDirection: 'row', alignItems: 'flex-end', height: 130, gap: 6 },
  barCol:        { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar:           { width: '100%', borderRadius: 3, overflow: 'hidden' },
  barCount:      { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: ORANGE, marginBottom: 3 },
  chartDates:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 2 },
  chartDateText: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'Poppins_400Regular' },
  chartDateToday:{ color: 'rgba(255,255,255,0.8)' },

  /* STAT CARDS */
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:      { flex: 1, backgroundColor: '#010A1F', borderWidth: 1, borderColor: BLUE_BORDER, borderRadius: 16, alignItems: 'center', paddingVertical: 12, overflow: 'hidden', gap: 4 },
  statTop:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statNumber:    { color: AppColors.textSecondary, fontSize: 20, fontFamily: 'Poppins_600SemiBold' },
  statLabel:     { color: AppColors.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  statChange:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statChangeText:{ fontSize: 11, fontFamily: 'Poppins_400Regular' },

  /* QUICK ACTIONS */
  quickSection:  { marginBottom: 20 },
  actionsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  actionCard:    { width: '22%', flexGrow: 1, minWidth: 78, height: 100, backgroundColor: '#061B4A', borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.2)', paddingHorizontal: 4 },
  actionText:    { color: '#ffffff', fontSize: 9, textAlign: 'center', lineHeight: 13, fontFamily: 'Poppins_400Regular', width: '100%', paddingHorizontal: 4 },

  /* RECENT ACTIVITY */
  activitySection:  { marginBottom: 10 },
  activityCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#010A1F', borderWidth: 1, borderColor: BLUE_BORDER, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, overflow: 'hidden' },
  activityIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#010A1F', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  activityInfo:     { flex: 1 },
  activityTitle:    { color: AppColors.textPrimary, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  activitySub:      { color: AppColors.textSecondary, fontSize: 8, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  emptyBox:         { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyTxt:         { color: AppColors.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
});
