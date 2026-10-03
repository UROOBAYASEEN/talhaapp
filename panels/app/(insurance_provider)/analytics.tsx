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
import { Ionicons } from '@expo/vector-icons';
import { D, DHeader, GlowCard, OutlineCard } from '@/components/dealer/DealerUI';

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
    { value: reviewing, color: '#1BA35E' },
    { value: pending,   color: '#E6E1E8' },
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
            strokeWidth={10}
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
        <DHeader
          title="Profile Analytics"
          center
          titleStyle={{ fontFamily: 'Poppins_600SemiBold', fontSize: 19 }}
          right={<TouchableOpacity style={s.bellBtn}><Bell size={24} color={ORANGE} /></TouchableOpacity>}
        />
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={ORANGE} size="large" style={{ marginTop: 60 }} />
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Line Chart Card */}
        <GlowCard style={s.chartCard}>
          <View style={s.chartTopRow}>
            <View>
              <Text style={s.chartSubLabel}>Total Followers</Text>
              <Text style={s.chartNum}>{(data?.followers_total ?? 0).toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={s.viewDropBtn} onPress={() => setShowDrop(v => !v)}>
              <Text style={s.viewDropTxt}>{viewMode} View</Text>
              <Ionicons name={showDrop ? 'chevron-up' : 'chevron-down'} size={16} color={ORANGE} />
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
        </GlowCard>

        {/* Profile Views + Search Appearances */}
        <View style={s.statsRow}>
          <OutlineCard style={s.statCard}>
            <Text style={s.statCardLabel}>Profile Views</Text>
            <Text style={s.statCardNum}>{(data?.profile_views ?? 0).toLocaleString()}</Text>
            <View style={s.changeRow}>
              <TrendingUp size={12} color={ORANGE} />
              <Text style={[s.changeTxt, { color: ORANGE }]}>Live</Text>
            </View>
          </OutlineCard>
          <OutlineCard style={s.statCard}>
            <Text style={s.statCardLabel}>Applications</Text>
            <Text style={s.statCardNum}>{(data?.search_appearances ?? 0).toLocaleString()}</Text>
            <View style={s.changeRow}>
              <TrendingUp size={12} color={ORANGE} />
              <Text style={[s.changeTxt, { color: ORANGE }]}>Total</Text>
            </View>
          </OutlineCard>
        </View>

        {/* Engagement Details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Engagement Details</Text>
          <View style={s.engageCard}>
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
                  <View style={{ height: '100%', width: `${pct * 100}%` as any, borderRadius: 5, backgroundColor: ORANGE }} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Sales Overview */}
        <View style={s.section}>
          <GlowCard style={s.salesCard}>
            <Text style={[s.sectionTitle, { fontSize: 22, fontFamily: 'Poppins_500Medium' }]}>Sales Overview</Text>
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
                  { color: '#1BA35E', label: 'Reviewing', val: data?.reviewing ?? 0 },
                  { color: '#E6E1E8', label: 'Pending',   val: data?.pending   ?? 0 },
                ].map(({ color, label, val }) => (
                  <View key={label} style={s.legendRow}>
                    <View style={[s.legendDot, { backgroundColor: color }]} />
                    <Text style={s.legendLabel}>{label}</Text>
                    <Text style={s.legendVal}>{val}</Text>
                  </View>
                ))}
              </View>
            </View>
          </GlowCard>
        </View>

        {/* Audience Demographics */}
        <View style={s.section}>
          <OutlineCard style={s.demoCard}>
            <Text style={s.sectionTitle}>Audience Demographics</Text>
            <Text style={s.demoSub}>Top Locations</Text>
            <View style={s.chipsRow}>
              {(data?.top_cities ?? ['No data yet']).map((loc: string) => (
                <View key={loc} style={s.chip}>
                  <Text style={s.chipTxt}>{loc}</Text>
                </View>
              ))}
            </View>
          </OutlineCard>
        </View>

        {/* Share Button */}
        <View style={s.bottomWrap}>
          <TouchableOpacity style={s.shareBtn} activeOpacity={0.85}>
            <LinearGradient colors={['#0B3585', '#7E4F5C', '#E8702A']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="share-social" size={24} color="#fff" />
            <Text style={s.shareTxt}>Share</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: D.bg },
  bellBtn:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 },

  chartCard:    { padding: 16, marginBottom: 16 },
  chartTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 5 },
  chartSubLabel:{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', marginBottom: 2 },
  chartNum:     { fontSize: 28, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  viewDropBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6 },
  viewDropTxt:  { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#FFFFFF' },
  dropdown:     { position: 'absolute', top: 40, right: 16, backgroundColor: '#061234', borderWidth: 1, borderColor: 'rgba(130,165,213,0.5)', borderRadius: 12, zIndex: 99, minWidth: 130, overflow: 'hidden' },
  dropItem:     { paddingHorizontal: 14, paddingVertical: 9 },
  dropItemActive:{ backgroundColor: 'rgba(226,103,27,0.15)' },
  dropTxt:      { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#E6E1E8' },
  daysRow:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dayTxt:       { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: 'rgba(230,225,232,0.85)' },

  statsRow:     { flexDirection: 'row', gap: 16, marginBottom: 18 },
  statCard:     { flex: 1, paddingVertical: 18, gap: 2 },
  statCardLabel:{ fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  statCardNum:  { fontSize: 22, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF' },
  changeRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  changeTxt:    { fontSize: 13, fontFamily: 'Poppins_500Medium' },

  section:      { marginBottom: 18 },
  sectionTitle: { fontSize: 18, fontFamily: 'Poppins_400Regular', color: '#FFFFFF', marginBottom: 14 },

  engageCard:    { gap: 16, paddingHorizontal: 6 },
  engageRow:     { gap: 8 },
  engageLabelRow:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  engageLabel:   { flex: 1, fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  engageVal:     { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  barTrack:      { height: 10, backgroundColor: '#C9BDC4', borderRadius: 5, overflow: 'hidden' },

  salesCard:    { padding: 20 },
  salesBody:    { flexDirection: 'row', alignItems: 'center', gap: 24 },
  donutWrap:    { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  donutCenter:  { position: 'absolute', alignItems: 'center' },
  donutNum:     { fontSize: 26, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF' },
  donutLabel:   { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  salesLegend:  { flex: 1, gap: 12 },
  legendRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendDot:    { width: 10, height: 10, borderRadius: 5 },
  legendLabel:  { flex: 1, fontSize: 16, fontFamily: 'Poppins_400Regular', color: '#FFFFFF' },
  legendVal:    { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },

  demoCard:     { padding: 20 },
  demoSub:      { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', marginBottom: 12 },
  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip:         { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, backgroundColor: ORANGE },
  chipTxt:      { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  bottomWrap:   { marginTop: 8 },
  shareBtn:     { height: 58, borderRadius: 29, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  shareTxt:     { fontSize: 19, fontFamily: 'Poppins_500Medium', color: '#fff' },
});
