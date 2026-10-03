import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import {
  Bell,
  Settings,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Plus,
  Home,
  Megaphone,
  Monitor,
  CreditCard,
  BadgeCheck,
  Car,
  Banknote,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { API_BASE } from '@/constants/api';
import Chatbot from '@/components/shared/Chatbot';
import { Ionicons } from '@expo/vector-icons';
import { DICON, DIcon, GlowCard } from '@/components/dealer/DealerUI';

const ORANGE = '#F97316';
const CARD   = '#111A3F';
const BG     = '#010A1F';
const { width: SCREEN_W } = Dimensions.get('window');

// ── Data ──────────────────────────────────────────────────────────────────────
const overviewStats = [
  { label: 'New Applications', value: 32, delta: '+12 today', trend: 'up'   },
  { label: 'Approved Cases',   value: 45, delta: '+8 today',  trend: 'up'   },
  { label: 'Under Review',     value: 18, delta: '-5 today',  trend: 'down' },
];

const progressPoints = [8, 22, 14, 26, 18, 34, 30, 46, 40, 58];

const quickActions = [
  { Icon: Car,       label: 'Finance Case',      route: '/(bank)/inventory',   icon: <Ionicons name="car" size={30} color="#E2671B" /> },
  { Icon: Plus,      label: 'Add special offer', route: '/bank-special-offer', icon: <Ionicons name="add" size={24} color="#E2671B" /> },
  { Icon: Plus,      label: 'Add Video',         route: '/bank-video-ads',     icon: <Ionicons name="add" size={24} color="#E2671B" /> },
  { Icon: Megaphone, label: 'Advertisement',     route: '/bank-advertisement', icon: <DIcon src={DICON.advertisement} size={28} /> },
];


// ── Chart helpers ─────────────────────────────────────────────────────────────
function buildChartPath(
  values: number[],
  w: number,
  h: number,
  pad = 8,
): { linePath: string; areaPath: string; points: [number, number][] } {
  const max   = Math.max(...values);
  const min   = Math.min(...values);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (values.length - 1);

  const points: [number, number][] = values.map((v, i) => [
    pad + i * stepX,
    h - pad - ((v - min) / range) * (h - pad * 2),
  ]);

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    `${linePath} L ${points[points.length - 1][0].toFixed(1)} ${h - pad} ` +
    `L ${points[0][0].toFixed(1)} ${h - pad} Z`;

  return { linePath, areaPath, points };
}

// ── GlassInset ────────────────────────────────────────────────────────────────
function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function BankHomeScreen() {
  const { user, token } = useAuth();
  const router          = useRouter();
  const [viewMode,      setViewMode]      = useState<'Daily View' | 'Weekly View' | 'Monthly View'>('Weekly View');
  const [showPeriodDrop, setShowPeriodDrop] = useState(false);
  const [metric,      setMetric]      = useState('New Applications');
  const [stats,       setStats]       = useState({ total: 0, submitted: 0, reviewing: 0, approved: 0, rejected: 0, new_today: 0 });
  const [chartPoints,   setChartPoints]   = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [chartDates,    setChartDates]    = useState<string[]>([]);
  const [loadStats,     setLoadStats]     = useState(true);
  const [loadChart,     setLoadChart]     = useState(true);
  const [recentActivity,setRecentActivity]= useState<any[]>([]);
  const [loadActivity,  setLoadActivity]  = useState(true);

  const METRIC_MAP: Record<string, string> = {
    'New Applications': 'applications',
    'Approved':         'approved',
    'Rejected':         'rejected',
  };

  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE}/financing/bank/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setStats(await res.json());
    } catch {}
    finally { setLoadStats(false); }
  }

  async function fetchChart(period = 'weekly', m = metric) {
    setLoadChart(true);
    try {
      const apiMetric = METRIC_MAP[m] || 'applications';
      const res = await fetch(`${API_BASE}/financing/bank/chart-data?period=${period}&metric=${apiMetric}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setChartPoints(data.points.map((p: any) => p.value));
        setChartDates(data.points.map((p: any) => p.date));
      }
    } catch {}
    finally { setLoadChart(false); }
  }

  async function fetchActivity() {
    try {
      const res = await fetch(`${API_BASE}/financing/bank/applications?limit=5`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setRecentActivity(await res.json());
    } catch {}
    finally { setLoadActivity(false); }
  }

  useEffect(() => {
    fetchStats();
    fetchChart();
    fetchActivity();
  }, []);

  useEffect(() => {
    const period = viewMode === 'Daily View' ? 'daily' : viewMode === 'Monthly View' ? 'monthly' : 'weekly';
    fetchChart(period, metric);
  }, [viewMode, metric]);

  const CHART_W = SCREEN_W - 72;
  const CHART_H = 140;
  const safePoints = chartPoints.length > 1 ? chartPoints : [0, 0, 0, 0, 0, 0, 0];
  const { linePath, areaPath, points } = buildChartPath(safePoints, CHART_W, CHART_H);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.logoRow}>
            <View style={s.logoBox}>
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE.replace('/api/v1', '')}${user.avatar_url}` }}
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={s.logoLetter}>
                  {(user?.full_name || 'B').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={s.bankName}>{user?.full_name || 'Bank'}</Text>
          </View>
          <View style={s.headerIcons}>
            <TouchableOpacity onPress={() => router.push('/alert' as any)}>
              <Bell size={20} color={AppColors.textPrimary} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/bank-settings' as any)}>
              <Settings size={20} color={AppColors.textPrimary} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── WELCOME BANNER ── */}
        <View style={s.banner}>
          <LinearGradient
            colors={['#061B4A', '#061B4A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={{ flex: 1 }}>
            <Text style={s.bannerSub}>Welcome Back,</Text>
            <Text style={s.bannerTitle}>{`Let's grow your\ndealership today!`}</Text>
          </View>
          <Image
            source={require('@/screenshot/bankpanelcar.png')}
            style={s.bannerCar}
            resizeMode="contain"
          />
        </View>

        {/* ── OVERVIEW HEADER ── */}
        <View style={s.rowBetween}>
          <Text style={s.sectionTitle}>Overview</Text>
          <TouchableOpacity>
            <Text style={s.analyticsLink}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* ── STAT CARDS ── */}
        <View style={s.statsRow}>
          {loadStats ? (
            <ActivityIndicator color={ORANGE} style={{ paddingVertical: 20 }} />
          ) : (
            [
              { label: 'New Applications', value: stats.submitted,  delta: `+${stats.new_today} today`, trend: 'up'   },
              { label: 'Approved Cases',   value: stats.approved,   delta: 'total',                     trend: 'up'   },
              { label: 'Under Review',     value: stats.reviewing,  delta: 'pending',                   trend: 'down' },
            ].map((stat) => (
              <GlowCard key={stat.label} style={s.statCard} radius={14}>
                <Text style={s.statLabel}>{stat.label}</Text>
                <View style={s.statBottom}>
                  <Text style={s.statValue}>{stat.value}</Text>
                  {stat.trend === 'up'
                    ? <TrendingUp size={20} color={ORANGE} />
                    : <TrendingDown size={20} color="#f87171" />
                  }
                </View>
                <Text style={[s.statDelta, { color: stat.trend === 'up' ? ORANGE : '#f87171' }]}>
                  ({stat.delta})
                </Text>
              </GlowCard>
            ))
          )}
        </View>

        {/* ── PROGRESS / CHART CARD ── */}
        <GlowCard style={s.chartCard} radius={20}>
          <View style={s.rowBetween}>
            <Text style={s.chartSubLabel}>Overview</Text>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <TouchableOpacity style={s.dropBtn} onPress={() => setShowPeriodDrop(p => !p)}>
                <Text style={s.dropText}>{viewMode}</Text>
                <ChevronDown size={14} color={AppColors.textSecondary} style={showPeriodDrop ? { transform: [{ rotate: '180deg' }] } : undefined} />
              </TouchableOpacity>
              <TouchableOpacity
                style={s.dropBtn}
                onPress={() => {
                  const options = ['New Applications', 'Approved', 'Rejected'];
                  const next = options[(options.indexOf(metric) + 1) % options.length];
                  setMetric(next);
                }}
              >
                <Text style={s.dropText}>{metric}</Text>
                <ChevronDown size={14} color={AppColors.textSecondary} />
              </TouchableOpacity>
              {showPeriodDrop && (
                <View style={s.periodMenu}>
                  {(['Daily View', 'Weekly View', 'Monthly View'] as const).map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[s.periodOption, viewMode === opt && s.periodOptionActive]}
                      onPress={() => { setViewMode(opt); setShowPeriodDrop(false); }}
                    >
                      <Text style={[s.periodOptionTxt, viewMode === opt && { color: ORANGE }]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          <Text style={s.chartTitle}>Progress</Text>
          <View style={s.trendRow}>
            <TrendingUp size={14} color={ORANGE} />
            <Text style={s.trendText}>
              {stats.new_today > 0 ? `+${stats.new_today} today` : 'Live data'}
            </Text>
          </View>

          {/* SVG Chart */}
          <View style={s.chartArea}>
            {loadChart && (
              <ActivityIndicator color={ORANGE} style={{ position: 'absolute', top: CHART_H / 2 - 10, left: CHART_W / 2 - 10, zIndex: 1 }} />
            )}
            <Svg width={CHART_W} height={CHART_H}>
              <Defs>
                <SvgGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={ORANGE} stopOpacity="0.55" />
                  <Stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
                </SvgGradient>
              </Defs>
              <Path d={areaPath} fill="url(#areaFill)" />
              <Path d={linePath} fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {points.map(([x, y], i) => {
                const show = i > 0;
                return show ? (
                  <Circle key={i} cx={x} cy={y} r={3.5} fill={BG} stroke={ORANGE} strokeWidth={2} />
                ) : null;
              })}
            </Svg>
          </View>
        </GlowCard>

        {/* ── QUICK ACTIONS ── */}
        <Text style={[s.sectionTitle, { marginTop: 20 }]}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {quickActions.map(({ icon, label, route }) => (
            <TouchableOpacity key={label} style={s.actionCard} activeOpacity={0.75} onPress={() => route && router.push(route as any)}>
              {icon}
              <Text style={s.actionLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── RECENT ACTIVITY ── */}
        <View style={[s.rowBetween, { marginTop: 24 }]}>
          <Text style={s.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(bank)/applications' as any)}>
            <Text style={s.analyticsLink}>View all</Text>
          </TouchableOpacity>
        </View>

        {loadActivity ? (
          <ActivityIndicator color={ORANGE} style={{ paddingVertical: 20 }} />
        ) : recentActivity.length === 0 ? (
          // No applications yet → sample activity (Figma)
          [
            { title: 'New Dealer Registered', sub: 'Al-Ghazi Motors',     icon: <Ionicons name="desktop-outline" size={22} color={ORANGE} /> },
            { title: 'Payment Received',      sub: 'Transaction #8842',   icon: <Ionicons name="cash-outline" size={22} color={ORANGE} /> },
            { title: 'Listing approved',      sub: 'Toyota Corolla 2023', icon: <Ionicons name="checkmark-done-circle-outline" size={22} color={ORANGE} /> },
          ].map(item => (
            <GlowCard key={item.title} style={s.activityCard} radius={16}>
              <View style={s.activityIcon}>{item.icon}</View>
              <View style={s.activityInfo}>
                <Text style={s.activityTitle}>{item.title}</Text>
                <Text style={s.activitySub}>{item.sub}</Text>
              </View>
              <ChevronRight size={24} color={ORANGE} />
            </GlowCard>
          ))
        ) : recentActivity.map((item: any) => {
          const statusColor = item.status === 'approved' ? '#22C55E' : item.status === 'rejected' ? '#f87171' : ORANGE;
          return (
          <GlowCard
            key={item.id}
            style={s.activityCard}
            radius={16}
            onPress={() => router.push({ pathname: '/bank-case-detail', params: { id: item.id } } as any)}
          >
            <View style={s.activityIcon}>
              <CreditCard size={20} color={statusColor} />
            </View>
            <View style={s.activityInfo}>
              <Text style={s.activityTitle}>{item.full_name || 'Applicant'}</Text>
              <Text style={s.activitySub}>{item.vehicle || `${item.brand} ${item.car_model}`} • <Text style={{ color: statusColor }}>{item.status}</Text></Text>
            </View>
            <ChevronRight size={24} color={ORANGE} />
          </GlowCard>
          );
        })}

        {/* Home indicator */}
        <View style={{ height: 100 }} />
      </ScrollView>
      <Chatbot />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4 },

  /* HEADER */
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox:    { width: 44, height: 44, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoLetter: { color: '#4C1D95', fontSize: 20, fontFamily: 'Poppins_700Bold' },
  bankName:   { color: AppColors.textPrimary, fontSize: 18, fontFamily: 'Poppins_500Medium' },
  headerIcons:{ flexDirection: 'row', gap: 18 },

  /* BANNER */
  banner:    { borderRadius: 20, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 20, marginBottom: 22, minHeight: 124 },
  bannerSub: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  bannerTitle:{ color: '#fff', fontSize: 17, fontFamily: 'Poppins_700Bold', lineHeight: 27, marginTop: 8, maxWidth: 200 },
  bannerCar: { width: 150, height: 92, position: 'absolute', right: 8, top: 16 },

  /* SECTION */
  rowBetween:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { color: AppColors.textPrimary, fontSize: 17, fontFamily: 'Poppins_500Medium' },
  analyticsLink:{ color: ORANGE, fontSize: 13, fontFamily: 'Poppins_500Medium' },

  /* STAT CARDS */
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:  { flex: 1, paddingHorizontal: 14, paddingVertical: 14, minHeight: 120 },
  statLabel: { color: '#E6E1E8', fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  statBottom:{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  statValue: { color: AppColors.textPrimary, fontSize: 22, fontFamily: 'Poppins_600SemiBold' },
  statDelta: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },

  /* CHART CARD */
  chartCard:     { padding: 16, marginBottom: 4 },
  chartSubLabel: { color: '#C9BDC4', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  dropBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(230,225,232,0.8)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  dropText:      { color: '#E6E1E8', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  chartTitle:    { color: AppColors.textPrimary, fontSize: 24, fontFamily: 'Poppins_500Medium', marginTop: -4 },
  trendRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  trendText:     { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  dropBtn2:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 10 },

  periodMenu:        { position: 'absolute', top: 36, right: 0, backgroundColor: '#061B4A', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', zIndex: 99, minWidth: 140, overflow: 'hidden' },
  periodOption:      { paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  periodOptionActive:{ backgroundColor: 'rgba(226,103,27,0.1)' },
  periodOptionTxt:   { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  chartArea:     { marginTop: 14 },

  /* QUICK ACTIONS */
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12, marginBottom: 14 },
  actionCard:  { width: (SCREEN_W - 40 - 30) / 4, height: 100, backgroundColor: '#061B4A', borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  actionLabel: { color: '#C9BDC4', fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 6, flexShrink: 1 },

  /* ADVERTISEMENT */
  adBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: CARD, borderRadius: 18, paddingVertical: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  adText: { color: ORANGE, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  /* RECENT ACTIVITY */
  activityCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 10, marginBottom: 14, minHeight: 58 },
  activityIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0B2358', alignItems: 'center', justifyContent: 'center' },
  activityInfo: { flex: 1 },
  activityTitle:{ color: AppColors.textPrimary, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  activitySub:  { color: '#C9BDC4', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },

  activityEmpty:    { alignItems: 'center', paddingVertical: 24, gap: 8 },
  activityEmptyTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'Poppins_400Regular' },

  /* HOME INDICATOR */
  homeIndicator: { alignSelf: 'center', width: 128, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 16 },
});
