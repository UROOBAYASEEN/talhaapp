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
  Clock,
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
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import Chatbot from '@/components/shared/Chatbot';

const ORANGE = '#e2671b';
const DARK_BLUE = '#061B4A';
const BLUE_BORDER = 'rgba(255,255,255,0.15)';

const QUICK_ACTIONS = [
  { title: 'Tracker\nReq',     Icon: MapPin,    route: '/(insurance_provider)/tracker-requests' },
  { title: 'Customers',        Icon: Users,     route: '/(insurance_provider)/customers' },
  { title: 'Subscription',     Icon: Crown,     route: '/(insurance_provider)/plan' },
  { title: 'New Special\nOffer', Icon: Plus,    route: '/(insurance_provider)/special-offer' },
  { title: 'Add Video',        Icon: Video,     route: '/(insurance_provider)/video-ads' },
  { title: 'Advertisement',    Icon: Megaphone, route: '/(insurance_provider)/advertisement' },
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

const FALLBACK_BAR_DATA = [
  { h: 38, label: '',       opacity: 0.1 },
  { h: 57, label: '',       opacity: 0.1 },
  { h: 52, label: '',       opacity: 0.2 },
  { h: 76, label: '',       opacity: 0.4 },
  { h: 67, label: '',       opacity: 0.6 },
  { h: 91, label: '',       opacity: 0.8 },
  { h: 112, label: 'Today', opacity: 1.0 },
];

export default function InsuranceHomeScreen() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [stats,    setStats]    = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [refreshing, setRef]   = useState(false);
  const [viewMode,   setViewMode]   = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [showViewDrop, setShowViewDrop] = useState(false);

  useEffect(() => { load(); }, []);

  const modeParam: Record<string, string> = { Daily: 'daily', Weekly: 'weekly', Monthly: 'monthly' };

  async function load(mode = viewMode) {
    if (!token || !user?.id) return;
    try {
      const [sRes, aRes] = await Promise.all([
        fetch(`${API_BASE}/insurance/${user.id}/dashboard?mode=${modeParam[mode]}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/insurance/${user.id}/activity?limit=3`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (sRes.ok) {
        const d = await sRes.json();
        setStats(d);
        if (d.chart_data?.length) setChartData(d.chart_data);
      }
      if (aRes.ok) { const d = await aRes.json(); setActivity(d.items || d || []); }
    } catch { /* offline */ }
  }

  useEffect(() => { load(viewMode); }, [viewMode]);

  async function onRefresh() { setRef(true); await load(viewMode); setRef(false); }

  const companyName    = user?.full_name || 'Insurance Co.';
  const totalPolicies  = stats?.total_policies  ?? 1248;
  const activePolicies = stats?.active_policies ?? 985;
  const pendingPolicies= stats?.pending_policies?? 63;
  const weeklyGrowth   = stats?.weekly_growth   ?? 8.2;
  const activeGrowth   = stats?.active_growth   ?? 15.3;
  const pendingChange  = stats?.pending_change  ?? -5.2;

  const ACTIVITIES = activity.length > 0
    ? activity.map((a: any) => ({
        title: a.title || a.message || 'Activity',
        subtitle: a.subtitle || a.description || '',
        Icon: MessageCircle,
      }))
    : [
        { title: 'New reservation received', subtitle: 'Honda Civic RS 2026 • Black', Icon: CalendarCheck },
        { title: 'New enquiry',              subtitle: 'Yamaha YBR 125 • Blue',       Icon: MessageCircle },
        { title: 'Advertisement approved',   subtitle: 'Homepage Banner • 7 Days',    Icon: Megaphone },
      ];

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
              <Image source={{ uri: user.avatar_url }} style={s.avatar} />
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
            <TouchableOpacity onPress={() => router.push('/alert' as any)}>
              <Bell size={20} color={AppColors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(insurance_provider)/settings' as any)}>
              <Settings size={20} color={AppColors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── WELCOME BANNER ── */}
        <View style={s.welcomeCard}>
          <View style={s.welcomeText}>
            <Text style={s.welcomeSub}>Welcome Back,</Text>
            <Text style={s.welcomeTitle}>
              Let's grow your insurance{'\n'}business with Autowizor!
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
          <TouchableOpacity onPress={() => router.push('/(insurance_provider)/analytics' as any)}>
            <Text style={s.analyticsLink}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* ── POLICIES CHART CARD ── */}
        <View style={s.chartCard}>
          <GlassInset />

          {/* Chart top row */}
          <View style={s.chartTopRow}>
            <View>
              <Text style={s.chartLabel}>TOTAL POLICIES</Text>
              <Text style={s.chartNumber}>{Number(totalPolicies).toLocaleString()}</Text>
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

          {/* Bar chart */}
          {(() => {
            const bars = chartData.length > 0
              ? (() => {
                  const maxCount = Math.max(...chartData.map((d: any) => d.count), 1);
                  return chartData.map((d: any, i: number) => ({
                    h: Math.max(8, (d.count / maxCount) * 112),
                    label: d.label || '',
                    opacity: 0.2 + (i / (chartData.length - 1)) * 0.8,
                    isLast: i === chartData.length - 1,
                  }));
                })()
              : FALLBACK_BAR_DATA.map((b, i) => ({ ...b, isLast: i === FALLBACK_BAR_DATA.length - 1 }));
            return (
              <>
                <View style={s.chartArea}>
                  {bars.map((bar: any, i: number) => (
                    <View key={i} style={s.barCol}>
                      <View style={[s.bar, { height: bar.h }]}>
                        <LinearGradient
                          colors={bar.isLast
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
                  {bars.filter((b: any) => b.label).map((bar: any, i: number) => (
                    <Text key={i} style={[s.chartDateText, bar.isLast && s.chartDateToday]}>
                      {bar.label}
                    </Text>
                  ))}
                </View>
              </>
            );
          })()}
        </View>

        {/* ── ACTIVE / PENDING STATS ── */}
        <View style={s.statsRow}>
          {/* Active */}
          <View style={s.statCard}>
            <GlassInset />
            <View style={s.statTop}>
              <CheckCircle2 size={17} color={ORANGE} />
              <Text style={s.statNumber}>{Number(activePolicies).toLocaleString()}</Text>
            </View>
            <Text style={s.statLabel}>Active</Text>
            <View style={s.statChange}>
              <TrendingUp size={12} color="#009759" />
              <Text style={[s.statChangeText, { color: '#009759' }]}>+{activeGrowth}%</Text>
            </View>
          </View>

          {/* Pending */}
          <View style={s.statCard}>
            <GlassInset />
            <View style={s.statTop}>
              <Clock size={16} color={ORANGE} />
              <Text style={s.statNumber}>{pendingPolicies}</Text>
            </View>
            <Text style={s.statLabel}>Pending</Text>
            <View style={s.statChange}>
              <TrendingDown size={12} color="#ba1a1a" />
              <Text style={[s.statChangeText, { color: '#ba1a1a' }]}>{pendingChange}%</Text>
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
                <GlassInset />
                <View style={s.actionIconWrap}>
                  <action.Icon size={20} color={ORANGE} />
                </View>
                <Text style={s.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── RECENT ACTIVITY ── */}
        <View style={s.activitySection}>
          <Text style={s.sectionTitle}>Recent Activity</Text>
          {ACTIVITIES.map((item, i) => (
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
          ))}
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

  /* WELCOME BANNER */
  welcomeCard:   { backgroundColor: '#061B4A', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', minHeight: 90, marginBottom: 16 },
  welcomeText:   { flex: 1 },
  welcomeSub:    { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Poppins_400Regular', marginBottom: 4 },
  welcomeTitle:  { color: '#fff', fontSize: 12, lineHeight: 18, fontFamily: 'Poppins_700Bold' },
  carImage:      { width: 110, height: 68 },

  /* SECTION HEADER */
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:   { color: AppColors.textPrimary, fontSize: 15, fontFamily: 'Poppins_500Medium', marginBottom: 12 },
  analyticsLink:  { color: ORANGE, fontSize: 12, fontFamily: 'Poppins_500Medium' },

  /* CHART CARD */
  chartCard:      { backgroundColor: '#010A1F', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', borderRadius: 16, padding: 12, overflow: 'hidden', marginBottom: 12 },
  chartTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  chartLabel:     { color: AppColors.textSecondary, fontSize: 10, letterSpacing: 0.6, fontFamily: 'Poppins_400Regular', textTransform: 'uppercase' },
  chartNumber:    { color: AppColors.textPrimary, fontSize: 24, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },
  chartTopRight:  { alignItems: 'flex-end', gap: 8 },
  percentBadge:   { backgroundColor: 'rgba(226,103,27,0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  percentText:    { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  weekButton:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: AppColors.textSecondary, borderRadius: 16, paddingHorizontal: 9, paddingVertical: 4 },
  weekText:       { color: AppColors.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  downArrow:      { color: AppColors.textSecondary, fontSize: 14, marginLeft: 3 },
  viewDropdown:   { position: 'absolute', top: 36, right: 0, backgroundColor: 'rgba(6,18,52,0.98)', borderWidth: 1, borderColor: BLUE_BORDER, borderRadius: 12, zIndex: 99, minWidth: 120 },
  viewDropItem:   { paddingHorizontal: 14, paddingVertical: 10 },
  viewDropItemActive: { backgroundColor: 'rgba(226,103,27,0.15)' },
  viewDropText:   { color: AppColors.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  viewDropTextActive: { color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  chartArea:      { flexDirection: 'row', alignItems: 'flex-end', height: 112, gap: 6 },
  barCol:         { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar:            { width: '100%', borderRadius: 3, overflow: 'hidden' },
  chartDates:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 2 },
  chartDateText:  { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'Poppins_400Regular' },
  chartDateToday: { color: 'rgba(255,255,255,0.8)' },

  /* STAT CARDS */
  statsRow:       { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:       { flex: 1, backgroundColor: '#010A1F', borderWidth: 1, borderColor: BLUE_BORDER, borderRadius: 16, alignItems: 'center', paddingVertical: 12, overflow: 'hidden', gap: 4 },
  statTop:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statNumber:     { color: AppColors.textSecondary, fontSize: 20, fontFamily: 'Poppins_600SemiBold' },
  statLabel:      { color: AppColors.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  statChange:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statChangeText: { fontSize: 11, fontFamily: 'Poppins_400Regular' },

  /* QUICK ACTIONS */
  quickSection:   { marginBottom: 20 },
  actionsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard:     { width: '22%', flexGrow: 1, minWidth: 78, height: 80, backgroundColor: '#061B4A', borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  actionIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionText:     { color: AppColors.textSecondary, fontSize: 9.5, textAlign: 'center', lineHeight: 14, fontFamily: 'Poppins_400Regular' },

  /* RECENT ACTIVITY */
  activitySection:  { marginBottom: 10 },
  activityCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#010A1F', borderWidth: 1, borderColor: BLUE_BORDER, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, overflow: 'hidden' },
  activityIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#010A1F', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  activityInfo:     { flex: 1 },
  activityTitle:    { color: AppColors.textPrimary, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  activitySub:      { color: AppColors.textSecondary, fontSize: 8, marginTop: 2, fontFamily: 'Poppins_400Regular' },
});
