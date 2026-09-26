import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
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

const FALLBACK_POINTS = [0.55, 0.35, 0.45, 0.3, 0.5, 0.65, 0.55];

function LineChart({ points = FALLBACK_POINTS }: { points?: number[] }) {
  const W = 340;
  const H = 100;
  const data = points.length > 1 ? points : FALLBACK_POINTS;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - Math.max(0.02, v) * H,
  }));

  // Smooth curve using cubic bezier
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 3;
    const cp1y = pts[i - 1].y;
    const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) / 3;
    const cp2y = pts[i].y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i].x} ${pts[i].y}`;
  }

  // Fill path
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

function DonutChart({ approved = 24, pending = 6, reviewing = 12 }: { approved?: number; pending?: number; reviewing?: number }) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 44;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { value: approved,  color: ORANGE    },
    { value: reviewing, color: '#22c55e' },
    { value: pending,   color: '#fff'    },
  ];
  const total = segments.reduce((acc, seg) => acc + seg.value, 0);

  let offset = 0;
  return (
    <Svg width={size} height={size}>
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference;
        const gap = circumference - dash;
        const rotation = -90 + (offset / total) * 360;
        offset += seg.value;
        return (
          <Circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={16}
            strokeDasharray={[dash, gap]}
            strokeDashoffset={0}
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

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [viewMode, setViewMode] = useState<'Weekly' | 'Monthly' | 'Daily'>('Weekly');
  const [showDrop, setShowDrop] = useState(false);
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const modeParam: Record<string, string> = { Daily: 'daily', Weekly: 'weekly', Monthly: 'monthly' };

  const fetchAnalytics = useCallback(async (mode: string) => {
    if (!token || !user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/insurance/${user.id}/analytics?mode=${modeParam[mode]}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, [token, user?.id]);

  useEffect(() => { fetchAnalytics(viewMode); }, [viewMode]);

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

      {loading ? (
        <ActivityIndicator color={ORANGE} size="large" style={{ marginTop: 60 }} />
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Line Chart Card */}
        <View style={s.chartCard}>
          <CardShade />
          <View style={s.chartTopRow}>
            <View>
              <Text style={s.chartSubLabel}>Total Followers</Text>
              <Text style={s.chartNum}>{(data?.followers_total ?? 0).toLocaleString()}</Text>
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
            <LineChart points={data?.follow_points} />
          </View>
          <View style={s.daysRow}>
            {(data?.day_labels ?? ['MON','TUE','WED','THU','FRI','SAT','SUN']).map((d: string) => (
              <Text key={d} style={s.dayTxt}>{d}</Text>
            ))}
          </View>
        </View>

        {/* Profile Views + Search Appearances */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <CardShade />
            <Text style={s.statCardLabel}>Profile Views</Text>
            <Text style={s.statCardNum}>{(data?.profile_views ?? 0).toLocaleString()}</Text>
            <View style={s.changeRow}>
              <TrendingUp size={12} color="#22c55e" />
              <Text style={[s.changeTxt, { color: '#22c55e' }]}>Live</Text>
            </View>
          </View>
          <View style={s.statCard}>
            <CardShade />
            <Text style={s.statCardLabel}>Applications</Text>
            <Text style={s.statCardNum}>{(data?.search_appearances ?? 0).toLocaleString()}</Text>
            <View style={s.changeRow}>
              <TrendingUp size={12} color="#22c55e" />
              <Text style={[s.changeTxt, { color: '#22c55e' }]}>Total</Text>
            </View>
          </View>
        </View>

        {/* Engagement Details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Engagement Details</Text>
          <View style={s.engageCard}>
            <CardShade />
            {[
              { Icon: Heart,    label: 'Likes',  val: '4.2k', pct: 0.85 },
              { Icon: Share2,   label: 'Shares', val: '1.8k', pct: 0.45 },
              { Icon: Bookmark, label: 'Saves',  val: '2.9k', pct: 0.70 },
            ].map(({ Icon, label, val, pct }) => (
              <View key={label} style={s.engageRow}>
                <View style={s.engageLabelRow}>
                  <Icon size={14} color={ORANGE} />
                  <Text style={s.engageLabel}>{label}</Text>
                  <Text style={s.engageVal}>{val}</Text>
                </View>
                <View style={s.barTrack}>
                  <LinearGradient
                    colors={[ORANGE, '#ff9a00']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[StyleSheet.absoluteFillObject, { width: `${pct * 100}%` as any, borderRadius: 4 }]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Sales Overview */}
        <View style={s.section}>
          <View style={s.salesCard}>
            <CardShade />
            <Text style={s.sectionTitle}>Sales Overview</Text>
            <View style={s.salesBody}>
              <View style={s.donutWrap}>
                <DonutChart approved={data?.approved} pending={data?.pending} reviewing={data?.reviewing} />
                <View style={s.donutCenter}>
                  <Text style={s.donutNum}>{(data?.approved ?? 0) + (data?.pending ?? 0) + (data?.reviewing ?? 0)}</Text>
                  <Text style={s.donutLabel}>Total</Text>
                </View>
              </View>
              <View style={s.salesLegend}>
                {[
                  { color: ORANGE,    label: 'Approved',  val: data?.approved  ?? 0 },
                  { color: '#22c55e', label: 'Reviewing', val: data?.reviewing ?? 0 },
                  { color: '#fff',    label: 'Pending',   val: data?.pending   ?? 0 },
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

        {/* Audience Demographics */}
        <View style={s.section}>
          <View style={s.demoCard}>
            <CardShade />
            <Text style={s.sectionTitle}>Audience Demographics</Text>
            <Text style={s.demoSub}>Top Locations</Text>
            <View style={s.chipsRow}>
              {(data?.top_cities ?? ['No data yet']).map((loc: string) => (
                <View key={loc} style={s.chip}>
                  <Text style={s.chipTxt}>{loc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Share Button */}
        <View style={s.bottomWrap}>
          <TouchableOpacity style={s.shareBtn} activeOpacity={0.85}>
            <LinearGradient colors={['#032a69', ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Share size={18} color="#fff" />
            <Text style={s.shareTxt}>Share</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      )}
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

  engageCard:   { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', padding: 14, gap: 14 },
  engageRow:    { gap: 6 },
  engageLabelRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  engageLabel:  { flex: 1, fontSize: 11, fontFamily: 'Poppins_500Medium', color: C.textPrimary },
  engageVal:    { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  barTrack:     { height: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },

  salesCard:    { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', padding: 14 },
  salesBody:    { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutWrap:    { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  donutCenter:  { position: 'absolute', alignItems: 'center' },
  donutNum:     { fontSize: 18, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  donutLabel:   { fontSize: 9, fontFamily: 'Poppins_400Regular', color: C.textSecondary },
  salesLegend:  { flex: 1, gap: 10 },
  legendRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendLabel:  { flex: 1, fontSize: 11, fontFamily: 'Poppins_400Regular', color: C.textPrimary },
  legendVal:    { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },

  demoCard:     { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', padding: 14 },
  demoSub:      { fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.textSecondary, marginBottom: 10 },
  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 30, backgroundColor: ORANGE },
  chipTxt:      { fontSize: 10, fontFamily: 'Poppins_500Medium', color: '#fff' },

  bottomWrap:   { marginTop: 8 },
  shareBtn:     { borderRadius: 30, overflow: 'hidden', paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareTxt:     { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
});
