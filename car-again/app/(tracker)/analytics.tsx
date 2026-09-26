import React, { useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet, Text,
  TouchableOpacity, View, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Bell, TrendingUp, TrendingDown, Heart, Share2, Bookmark, Share } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#e2671b';
const C = AppColors;

// ── Line Chart from real booking data ─────────────────────────────────────

function LineChart({ points }: { points: number[] }) {
  const W = 340;
  const H = 100;
  const normalized = points.length >= 2 ? points : Array(7).fill(0);
  const max = Math.max(...normalized, 1);
  const pts = normalized.map((v, i) => ({
    x: (i / (normalized.length - 1)) * W,
    y: H - (v / max) * H * 0.85 - 8,
  }));

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 3;
    const cp1y = pts[i - 1].y;
    const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) / 3;
    const cp2y = pts[i].y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i].x} ${pts[i].y}`;
  }
  const fillD = d + ` L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  return (
    <Svg width={W} height={H + 10}>
      <Defs>
        <SvgGradient id="fill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ORANGE} stopOpacity="0.35" />
          <Stop offset="1" stopColor={ORANGE} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      <Path d={fillD} fill="url(#fill)" />
      <Path d={d} stroke={ORANGE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r="4" fill={ORANGE} />
      ))}
    </Svg>
  );
}

// ── Donut Chart ────────────────────────────────────────────────────────────

function DonutChart({ active, installed, alerts }: { active: number; installed: number; alerts: number }) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const total = active + installed + alerts || 1;

  const segments = [
    { value: active,    color: ORANGE    },
    { value: installed, color: '#22c55e' },
    { value: alerts,    color: '#fff'    },
  ];

  let offset = 0;
  return (
    <Svg width={size} height={size}>
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference;
        const gap = circumference - dash;
        const rotation = -90 + (offset / total) * 360;
        offset += seg.value;
        return (
          <Circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={16}
            strokeDasharray={[dash, gap]} strokeDashoffset={0}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      })}
    </Svg>
  );
}

function CardShade() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

// ── Build weekly booking counts for line chart ─────────────────────────────

function buildLinePoints(bookings: any[], mode: 'Daily' | 'Weekly' | 'Monthly'): { counts: number[]; labels: string[] } {
  const now    = new Date();
  const slots  = 7;
  const counts = Array(slots).fill(0);
  const labels: string[] = [];

  for (let i = slots - 1; i >= 0; i--) {
    const d = new Date(now);
    if (mode === 'Daily') {
      d.setDate(d.getDate() - i);
      labels[slots - 1 - i] = i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 3).toUpperCase();
    } else if (mode === 'Weekly') {
      d.setDate(d.getDate() - i * 7);
      labels[slots - 1 - i] = i === 0 ? 'Now' : `W${slots - i}`;
    } else {
      d.setMonth(d.getMonth() - i);
      labels[slots - 1 - i] = d.toLocaleString('default', { month: 'short' }).toUpperCase();
    }
  }

  bookings.forEach(b => {
    if (!b.created_at) return;
    const date = new Date(b.created_at);
    for (let i = 0; i < slots; i++) {
      const s = new Date(now);
      if (mode === 'Daily') {
        s.setDate(s.getDate() - (slots - 1 - i));
        if (date.toDateString() === s.toDateString()) { counts[i]++; break; }
      } else if (mode === 'Weekly') {
        const ws = new Date(now); ws.setDate(ws.getDate() - (slots - 1 - i) * 7);
        const we = new Date(ws); we.setDate(we.getDate() + 7);
        if (date >= ws && date < we) { counts[i]++; break; }
      } else {
        const m = new Date(now.getFullYear(), now.getMonth() - (slots - 1 - i));
        if (date.getMonth() === m.getMonth() && date.getFullYear() === m.getFullYear()) { counts[i]++; break; }
      }
    }
  });

  return { counts, labels };
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function TrackerAnalyticsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [viewMode,   setViewMode]   = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [showDrop,   setShowDrop]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics,  setAnalytics]  = useState<any>(null);
  const [dashboard,  setDashboard]  = useState<any>(null);
  const [bookings,   setBookings]   = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!token || !user?.id) return;
    try {
      const [aRes, dRes, bRes] = await Promise.all([
        fetch(`${API_BASE}/tracker-providers/me/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/tracker-providers/${user.id}/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/tracker-bookings/mine?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (aRes.ok) setAnalytics(await aRes.json());
      if (dRes.ok) setDashboard(await dRes.json());
      if (bRes.ok) setBookings(await bRes.json());
    } catch { /* offline */ }
    finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const { counts: linePoints, labels: lineLabels } = buildLinePoints(bookings, viewMode);

  // Stats
  const totalBookings    = bookings.length;
  const activeDevices    = dashboard?.active_devices    ?? 0;
  const totalDevices     = dashboard?.total_devices     ?? 0;
  const alertsCount      = dashboard?.alerts_count      ?? 0;
  const profileViews     = analytics?.profile_views     ?? dashboard?.profile_views ?? 0;
  const profileDelta     = analytics?.profile_views_delta ?? dashboard?.weekly_growth ?? 0;
  const searchApp        = analytics?.search_appearances ?? 0;
  const searchDelta      = analytics?.search_appearances_delta ?? 0;
  const likes            = analytics?.engagement_likes  ?? 0;
  const shares           = analytics?.engagement_shares ?? 0;
  const saves            = analytics?.engagement_saves  ?? 0;
  const maxEngage        = Math.max(likes, shares, saves, 1);

  const confirmed   = bookings.filter(b => b.status === 'confirmed').length;
  const installed   = bookings.filter(b => b.status === 'installation' || b.status === 'completed').length;

  // Top cities from bookings
  const cityMap: Record<string, number> = {};
  bookings.forEach(b => { if (b.city) cityMap[b.city] = (cityMap[b.city] || 0) + 1; });
  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city, count]) => `${city} (${Math.round((count / totalBookings) * 100)}%)`);

  if (loading) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={ORANGE} size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Profile Analytics</Text>
          <TouchableOpacity style={s.bellBtn}>
            <Bell size={20} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
      >

        {/* Line Chart — Bookings Over Time */}
        <View style={s.chartCard}>
          <CardShade />
          <View style={s.chartTopRow}>
            <View>
              <Text style={s.chartSubLabel}>TOTAL BOOKINGS</Text>
              <Text style={s.chartNum}>{totalBookings}</Text>
            </View>
            <TouchableOpacity style={s.viewDropBtn} onPress={() => setShowDrop(v => !v)}>
              <Text style={s.viewDropTxt}>{viewMode} View</Text>
              <Text style={s.downArrow}>⌄</Text>
            </TouchableOpacity>
          </View>
          {showDrop && (
            <View style={s.dropdown}>
              {(['Daily', 'Weekly', 'Monthly'] as const).map(opt => (
                <TouchableOpacity key={opt} style={[s.dropItem, viewMode === opt && s.dropItemActive]} onPress={() => { setViewMode(opt); setShowDrop(false); }}>
                  <Text style={[s.dropTxt, viewMode === opt && { color: ORANGE }]}>{opt} View</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={{ marginVertical: 10 }}>
            <LineChart points={linePoints} />
          </View>
          <View style={s.daysRow}>
            {lineLabels.map((d, i) => <Text key={i} style={s.dayTxt}>{d}</Text>)}
          </View>
        </View>

        {/* Profile Views + Search */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <CardShade />
            <Text style={s.statCardLabel}>Profile Views</Text>
            <Text style={s.statCardNum}>{Number(profileViews).toLocaleString()}</Text>
            <View style={s.changeRow}>
              {profileDelta >= 0
                ? <TrendingUp size={12} color="#22c55e" />
                : <TrendingDown size={12} color="#ef4444" />
              }
              <Text style={[s.changeTxt, { color: profileDelta >= 0 ? '#22c55e' : '#ef4444' }]}>
                {profileDelta >= 0 ? '↑' : '↓'} {Math.abs(profileDelta)}%
              </Text>
            </View>
          </View>
          <View style={s.statCard}>
            <CardShade />
            <Text style={s.statCardLabel}>Search{'\n'}Appearances</Text>
            <Text style={s.statCardNum}>{Number(searchApp).toLocaleString()}</Text>
            <View style={s.changeRow}>
              {searchDelta >= 0
                ? <TrendingUp size={12} color="#22c55e" />
                : <TrendingDown size={12} color="#ef4444" />
              }
              <Text style={[s.changeTxt, { color: searchDelta >= 0 ? '#22c55e' : '#ef4444' }]}>
                {searchDelta >= 0 ? '↑' : '↓'} {Math.abs(searchDelta)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Engagement Details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Engagement Details</Text>
          <View style={s.engageCard}>
            <CardShade />
            {[
              { Icon: Heart,    label: 'Likes',  val: likes,  pct: likes  / maxEngage },
              { Icon: Share2,   label: 'Shares', val: shares, pct: shares / maxEngage },
              { Icon: Bookmark, label: 'Saves',  val: saves,  pct: saves  / maxEngage },
            ].map(({ Icon, label, val, pct }) => (
              <View key={label} style={s.engageRow}>
                <View style={s.engageLabelRow}>
                  <Icon size={14} color={ORANGE} />
                  <Text style={s.engageLabel}>{label}</Text>
                  <Text style={s.engageVal}>{Number(val).toLocaleString()}</Text>
                </View>
                <View style={s.barTrack}>
                  <LinearGradient
                    colors={[ORANGE, '#ff9a00']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[StyleSheet.absoluteFillObject, { width: `${Math.max(pct * 100, 2)}%` as any, borderRadius: 4 }]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Devices / Bookings Overview */}
        <View style={s.section}>
          <View style={s.salesCard}>
            <CardShade />
            <Text style={s.sectionTitle}>Bookings Overview</Text>
            <View style={s.salesBody}>
              <View style={s.donutWrap}>
                <DonutChart active={confirmed} installed={installed} alerts={alertsCount} />
                <View style={s.donutCenter}>
                  <Text style={s.donutNum}>{totalBookings}</Text>
                  <Text style={s.donutLabel}>Total</Text>
                </View>
              </View>
              <View style={s.salesLegend}>
                {[
                  { color: ORANGE,    label: 'Confirmed',    val: confirmed  },
                  { color: '#22c55e', label: 'Installed',    val: installed  },
                  { color: '#fff',    label: 'New',          val: bookings.filter(b => b.status === 'new').length },
                ].map(({ color, label, val }) => (
                  <View key={label} style={s.legendRow}>
                    <View style={[s.legendDot, { backgroundColor: color }]} />
                    <Text style={s.legendLabel}>{label}</Text>
                    <Text style={s.legendVal}>{val}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Audience Demographics — from booking cities */}
        <View style={s.section}>
          <View style={s.demoCard}>
            <CardShade />
            <Text style={s.sectionTitle}>Audience Demographics</Text>
            <Text style={s.demoSub}>Top Booking Cities</Text>
            <View style={s.chipsRow}>
              {topCities.length > 0
                ? topCities.map(loc => (
                    <View key={loc} style={s.chip}>
                      <Text style={s.chipTxt}>{loc}</Text>
                    </View>
                  ))
                : <Text style={{ color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' }}>No bookings yet</Text>
              }
            </View>
          </View>
        </View>

        {/* Share Button */}
        <View style={s.bottomWrap}>
          <TouchableOpacity style={s.shareBtn} activeOpacity={0.85}>
            <LinearGradient colors={['#032a69', ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Share size={18} color="#fff" />
            <Text style={s.shareTxt}>Share Analytics</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bellBtn:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  scroll: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 },

  chartCard:    { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', padding: 16, marginBottom: 14 },
  chartTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chartSubLabel:{ fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.textSecondary, marginBottom: 4 },
  chartNum:     { fontSize: 22, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  viewDropBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  viewDropTxt:  { fontSize: 10, fontFamily: 'Poppins_500Medium', color: C.textSecondary },
  downArrow:    { fontSize: 12, color: C.textSecondary },
  dropdown:     { position: 'absolute', top: 46, right: 0, backgroundColor: 'rgba(6,18,52,0.98)', borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', borderRadius: 12, zIndex: 99, minWidth: 120 },
  dropItem:     { paddingHorizontal: 12, paddingVertical: 8 },
  dropItemActive:{ backgroundColor: 'rgba(226,103,27,0.15)' },
  dropTxt:      { fontSize: 11, fontFamily: 'Poppins_400Regular', color: C.textSecondary },
  daysRow:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dayTxt:       { fontSize: 9, fontFamily: 'Poppins_400Regular', color: '#8f9cb5' },

  statsRow:     { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statCard:     { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', padding: 12 },
  statCardLabel:{ fontSize: 9, fontFamily: 'Poppins_400Regular', color: C.textSecondary, marginBottom: 4 },
  statCardNum:  { fontSize: 20, fontFamily: 'Poppins_700Bold', color: C.textPrimary, marginBottom: 4 },
  changeRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  changeTxt:    { fontSize: 10, fontFamily: 'Poppins_500Medium' },

  section:      { marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary, marginBottom: 12 },

  engageCard:    { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', padding: 14, gap: 14 },
  engageRow:     { gap: 6 },
  engageLabelRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  engageLabel:   { flex: 1, fontSize: 11, fontFamily: 'Poppins_500Medium', color: C.textPrimary },
  engageVal:     { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  barTrack:      { height: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },

  salesCard:   { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', padding: 14 },
  salesBody:   { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutWrap:   { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutNum:    { fontSize: 18, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  donutLabel:  { fontSize: 9, fontFamily: 'Poppins_400Regular', color: C.textSecondary },
  salesLegend: { flex: 1, gap: 10 },
  legendRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: 11, fontFamily: 'Poppins_400Regular', color: C.textPrimary },
  legendVal:   { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },

  demoCard:  { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', padding: 14 },
  demoSub:   { fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.textSecondary, marginBottom: 10 },
  chipsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 30, backgroundColor: ORANGE },
  chipTxt:   { fontSize: 10, fontFamily: 'Poppins_500Medium', color: '#fff' },

  bottomWrap: { marginTop: 8 },
  shareBtn:   { borderRadius: 30, overflow: 'hidden', paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareTxt:   { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
});
