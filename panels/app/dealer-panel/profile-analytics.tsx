import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Circle, Defs, Path, Stop, LinearGradient as SvgGrad } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { D, DHeader, GlowCard, OutlineCard } from '@/components/dealer/DealerUI';
import { Heart, Share2, Bookmark } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/constants/api';

const { width } = Dimensions.get('window');
const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;

/* ─── Types ─── */
interface DayValue { day: string; value: number }
interface Location { name: string; pct: number }
interface AnalyticsData {
  unit_selling:              DayValue[];
  total_followers:           number;
  followers_trend:           DayValue[];
  followers_trend_monthly:   DayValue[];
  followers_trend_yearly:    DayValue[];
  profile_views:             number;
  profile_views_delta:       number;
  search_appearances:        number;
  search_appearances_delta:  number;
  engagement_likes:          number;
  engagement_likes_pct:      number;
  engagement_shares:         number;
  engagement_shares_pct:     number;
  engagement_saves:          number;
  engagement_saves_pct:      number;
  reservations_total:        number;
  reservations_confirmed:    number;
  reservations_completed:    number;
  reservations_pending:      number;
  top_locations:             Location[];
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtDelta(d: number): string {
  return d >= 0 ? `↑ ${Math.abs(d)}%` : `↓ ${Math.abs(d)}%`;
}

/* ─── Custom Bar Chart (Figma: peach top + orange bottom) ─── */
function BarChartView({ data }: { data: DayValue[] }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const H = 190;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: H, gap: 18, paddingHorizontal: 6 }}>
        {data.map((d, i) => {
          const orangeH = Math.max(6, (d.value / maxVal) * H * 0.62);
          const totalH  = Math.min(H, orangeH + 40 + (H - orangeH) * 0.25);
          return (
            <View key={i} style={{ flex: 1, height: totalH, backgroundColor: '#EBC3A9', justifyContent: 'flex-end' }}>
              <View style={{ height: orangeH, backgroundColor: ORANGE }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 12, paddingHorizontal: 6, gap: 18 }}>
        {data.map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold' }}>{String(d.day).charAt(0)}</Text>
        ))}
      </View>
    </View>
  );
}

/* ─── Custom Line Chart (smooth curve + orange area fill) ─── */
function LineChartView({ data }: { data: DayValue[] }) {
  const H       = 120;
  const W_CHART = width - 32 - 2;
  const maxVal  = Math.max(...data.map(d => d.value), 1);
  const minVal  = Math.min(...data.map(d => d.value));
  const range   = maxVal - minVal || 1;
  const pts     = data.map((d, i) => ({
    x: data.length > 1 ? (i / (data.length - 1)) * W_CHART : 0,
    y: H - ((d.value - minVal) / range) * (H - 24) - 12,
  }));
  let line = pts.length ? `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}` : '';
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i], cx = (p0.x + p1.x) / 2;
    line += ` C ${cx.toFixed(1)} ${p0.y.toFixed(1)} ${cx.toFixed(1)} ${p1.y.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  const area = pts.length ? `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${H} L ${pts[0].x.toFixed(1)} ${H} Z` : '';
  return (
    <View style={{ marginHorizontal: -16 }}>
      <Svg width={W_CHART} height={H}>
        <Defs>
          <SvgGrad id="fArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ORANGE} stopOpacity="0.35" />
            <Stop offset="1" stopColor={ORANGE} stopOpacity="0" />
          </SvgGrad>
        </Defs>
        <Path d={area} fill="url(#fArea)" />
        <Path d={line} stroke={ORANGE} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        {pts.filter((_, i) => i === 1 || i === 4).map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={ORANGE}/>
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 8 }}>
        {data.map((d, i) => (
          <Text key={i} style={{ color: 'rgba(230,225,232,0.85)', fontSize: 12, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.5 }}>{String(d.day).toUpperCase()}</Text>
        ))}
      </View>
    </View>
  );
}

/* ─── Donut Chart ─── */
function DonutChart({ total, confirmed, completed, pending }: {
  total: number; confirmed: number; completed: number; pending: number;
}) {
  const r            = 52;
  const strokeWidth  = 10;
  const circumference = 2 * Math.PI * r;
  const cx = 65, cy = 65;
  const safeTotal = total || 1;
  const confirmedLen = (confirmed / safeTotal) * circumference;
  const completedLen = (completed / safeTotal) * circumference;
  const pendingLen   = (pending   / safeTotal) * circumference;

  return (
    <View style={{ width: 130, height: 130 }}>
      <Svg width={130} height={130}>
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#E6E1E8" strokeWidth={strokeWidth}/>
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke={ORANGE} strokeWidth={strokeWidth}
          strokeDasharray={`${confirmedLen} ${circumference}`}
          strokeLinecap="round"
          rotation={-90} originX={cx} originY={cy}
        />
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#1BA35E" strokeWidth={strokeWidth}
          strokeDasharray={`${completedLen} ${circumference}`}
          strokeDashoffset={-confirmedLen}
          strokeLinecap="round"
          rotation={-90} originX={cx} originY={cy}
        />
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#E6E1E8" strokeWidth={strokeWidth}
          strokeDasharray={`${pendingLen} ${circumference}`}
          strokeDashoffset={-(confirmedLen + completedLen)}
          strokeLinecap="round"
          rotation={-90} originX={cx} originY={cy}
        />
      </Svg>
      <View style={{ position: 'absolute', width: 130, height: 130, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 26, fontFamily: 'Poppins_600SemiBold' }}>{total}</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_500Medium' }}>Total</Text>
      </View>
    </View>
  );
}

/* ─── Main Screen ─── */
export default function ProfileAnalyticsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [period,         setPeriod]         = useState('Weekly');
  const [followerPeriod, setFollowerPeriod] = useState('Weekly');
  const [followerMenu,   setFollowerMenu]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    if (!data) return;
    try {
      await Share.share({
        title: 'My Dealership Analytics',
        message:
          `📊 My Dealership Analytics\n\n` +
          `👥 Followers: ${data.total_followers.toLocaleString()}\n` +
          `👁️ Profile Views: ${fmtNum(data.profile_views)}\n` +
          `🔍 Search Appearances: ${fmtNum(data.search_appearances)}\n` +
          `❤️ Likes: ${fmtNum(data.engagement_likes)}\n` +
          `🔗 Shares: ${fmtNum(data.engagement_shares)}\n` +
          `🔖 Saves: ${fmtNum(data.engagement_saves)}\n\n` +
          `📦 Total Listings: ${data.reservations_total}`,
      });
    } catch {
      // user cancelled or share failed
    }
  }, [data]);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/dealers/me/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json: AnalyticsData = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const engagement = data ? [
    { label: 'Likes',  value: fmtNum(data.engagement_likes),  pct: data.engagement_likes_pct,  Icon: Heart    },
    { label: 'Shares', value: fmtNum(data.engagement_shares), pct: data.engagement_shares_pct, Icon: Share2   },
    { label: 'Saves',  value: fmtNum(data.engagement_saves),  pct: data.engagement_saves_pct,  Icon: Bookmark },
  ] : [];

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>

        {/* HEADER */}
        <DHeader
          title="Profile Analytics"
          center
          titleStyle={{ fontFamily: 'Poppins_600SemiBold', fontSize: 19 }}
          right={
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/alert' as any)}>
              <Ionicons name="notifications-outline" size={26} color={ORANGE} />
            </TouchableOpacity>
          }
        />

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={ORANGE}/>
          </View>
        ) : error ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <Text style={{ color: C.textSecondary, textAlign: 'center', fontFamily: 'Poppins_400Regular', marginBottom: 16 }}>{error}</Text>
            <TouchableOpacity onPress={fetchAnalytics} style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 30, overflow: 'hidden' }}>
              <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject}/>
              <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : data ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

            {/* ── UNIT SELLING ── */}
            <View style={s.section}>
              <View style={s.rowBetween}>
                <Text style={[s.sectionTitle, { fontSize: 24, fontFamily: 'Poppins_600SemiBold' }]}>Unit selling</Text>
                <View style={s.viewsDot}>
                  <View style={s.dot}/>
                  <Text style={s.viewsTxt}>Views</Text>
                </View>
              </View>

              <View style={s.periodWrap}>
                {['Weekly', 'Monthly', 'Yearly'].map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[s.periodBtn, period === p && s.periodBtnActive]}
                    onPress={() => setPeriod(p)}
                  >
                    <Text style={[s.periodTxt, period === p && s.periodTxtActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <BarChartView data={data.unit_selling}/>
            </View>

            {/* ── FOLLOWERS CARD ── */}
            <GlowCard style={s.followCard}>
              <View style={[s.rowBetween, { alignItems: 'flex-start', zIndex: 5 }]}>
                <View>
                  <Text style={s.cardLabel}>Total Followers</Text>
                  <Text style={s.followCount}>{data.total_followers.toLocaleString()}</Text>
                </View>
                {/* "Weekly View ⌄" — tap to switch Weekly / Monthly / Yearly */}
                <View>
                  <TouchableOpacity style={s.viewSel} onPress={() => setFollowerMenu(m => !m)}>
                    <Text style={s.viewSelTxt}>{followerPeriod} View</Text>
                    <Ionicons name={followerMenu ? 'chevron-up' : 'chevron-down'} size={16} color={ORANGE} />
                  </TouchableOpacity>
                  {followerMenu && (
                    <View style={s.viewMenu}>
                      {['Weekly', 'Monthly', 'Yearly'].map(p => (
                        <TouchableOpacity key={p} style={s.viewMenuItem} onPress={() => { setFollowerPeriod(p); setFollowerMenu(false); }}>
                          <Text style={[s.viewMenuTxt, followerPeriod === p && { color: ORANGE }]}>{p} View</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <LineChartView data={
                followerPeriod === 'Monthly' ? data.followers_trend_monthly :
                followerPeriod === 'Yearly'  ? data.followers_trend_yearly  :
                data.followers_trend
              }/>
            </GlowCard>

            {/* ── STAT CARDS ── */}
            <View style={s.statRow}>
              <OutlineCard style={s.statCard}>
                <Text style={s.statLabel}>Profile Views</Text>
                <Text style={s.statValue}>{fmtNum(data.profile_views)}</Text>
                <Text style={[s.statDelta, { color: data.profile_views_delta >= 0 ? ORANGE : '#E0363A' }]}>
                  {fmtDelta(data.profile_views_delta)}
                </Text>
              </OutlineCard>
              <OutlineCard style={s.statCard}>
                <Text style={s.statLabel}>Search Appearances</Text>
                <Text style={s.statValue}>{fmtNum(data.search_appearances)}</Text>
                <Text style={[s.statDelta, { color: data.search_appearances_delta >= 0 ? ORANGE : '#E0363A' }]}>
                  {fmtDelta(data.search_appearances_delta)}
                </Text>
              </OutlineCard>
            </View>

            {/* ── ENGAGEMENT ── */}
            <View style={s.section}>
              <Text style={[s.sectionTitle, { fontFamily: 'Poppins_400Regular' }]}>Engagement Details</Text>
              {engagement.map(e => (
                <View key={e.label} style={s.engRow}>
                  <View style={s.rowBetween}>
                    <View style={s.engLeft}>
                      <e.Icon size={18} color={ORANGE}/>
                      <Text style={s.engLabel}>{e.label}</Text>
                    </View>
                    <Text style={s.engValue}>{e.value}</Text>
                  </View>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${e.pct}%` }]} />
                  </View>
                </View>
              ))}
            </View>

            {/* ── RESERVATIONS DONUT ── */}
            <GlowCard style={s.reservCard}>
              <Text style={[s.sectionTitle, { fontSize: 22, fontFamily: 'Poppins_500Medium' }]}>Reservations Overview</Text>
              <View style={s.donutRow}>
                <DonutChart
                  total={data.reservations_total}
                  confirmed={data.reservations_confirmed}
                  completed={data.reservations_completed}
                  pending={data.reservations_pending}
                />
                <View style={s.legendCol}>
                  {[
                    { label: 'Confirmed', count: data.reservations_confirmed, color: ORANGE    },
                    { label: 'Completed', count: data.reservations_completed, color: '#1BA35E' },
                    { label: 'Pending',   count: data.reservations_pending,   color: '#E6E1E8' },
                  ].map(l => (
                    <View key={l.label} style={s.legendRow}>
                      <View style={[s.legendDot, { backgroundColor: l.color }]}/>
                      <Text style={s.legendLabel}>{l.label}</Text>
                      <Text style={s.legendCount}>{l.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </GlowCard>

            {/* ── AUDIENCE DEMOGRAPHICS ── */}
            <OutlineCard style={s.demoCard}>
              <Text style={[s.sectionTitle, { fontSize: 17, fontFamily: 'Poppins_400Regular' }]}>Audience Demographics</Text>
              <Text style={s.demoSubtitle}>Top Locations</Text>
              {data.top_locations.length > 0 ? (
                <View style={s.chipsRow}>
                  {data.top_locations.map(l => (
                    <View key={l.name} style={s.locationChip}>
                      <Text style={s.chipTxt}>{l.name} ({l.pct}%)</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' }}>No location data yet.</Text>
              )}
            </OutlineCard>

            {/* ── SHARE BUTTON ── */}
            <TouchableOpacity style={s.shareBtn} activeOpacity={0.85} onPress={handleShare}>
              <LinearGradient colors={['#0B3585', '#7E4F5C', '#E8702A']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject}/>
              <Ionicons name="share-social" size={26} color="#fff" />
              <Text style={s.shareTxt}>Share</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }}/>
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: D.bg },
  container: { flex: 1, backgroundColor: D.bg },

  iconBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 4, gap: 18, paddingBottom: 20 },

  section:      { gap: 14 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  rowBetween:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  viewsDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE },
  viewsTxt: { color: ORANGE, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  periodWrap:      { flexDirection: 'row', borderRadius: 26, padding: 4, backgroundColor: D.navy },
  periodBtn:       { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  periodBtnActive: { borderColor: 'rgba(200,210,230,0.7)', backgroundColor: '#0A1A45' },
  periodTxt:       { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  periodTxtActive: { color: '#BFC6DE', fontFamily: 'Poppins_500Medium' },

  followCard:  { padding: 16, gap: 10 },
  cardLabel:   { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  followCount: { color: '#FFFFFF', fontSize: 28, fontFamily: 'Poppins_700Bold', marginTop: 2 },
  viewSel:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6 },
  viewSelTxt:  { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  viewMenu:    { position: 'absolute', top: 32, right: 0, minWidth: 130, backgroundColor: '#061234', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(130,165,213,0.5)', zIndex: 20, overflow: 'hidden' },
  viewMenuItem:{ paddingHorizontal: 14, paddingVertical: 9 },
  viewMenuTxt: { color: '#E6E1E8', fontSize: 13, fontFamily: 'Poppins_400Regular' },

  statRow:   { flexDirection: 'row', gap: 16 },
  statCard:  { flex: 1, paddingVertical: 18, gap: 2 },
  statLabel: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  statValue: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Poppins_600SemiBold' },
  statDelta: { fontSize: 13, fontFamily: 'Poppins_500Medium' },

  engRow:        { gap: 8 },
  engLeft:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  engLabel:      { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  engValue:      { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: '#C9BDC4', overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 5, backgroundColor: ORANGE },

  reservCard: { padding: 20, gap: 16 },
  donutRow:   { flexDirection: 'row', alignItems: 'center', gap: 24 },
  legendCol:  { flex: 1, gap: 12 },
  legendRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendLabel:{ color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_400Regular', flex: 1 },
  legendCount:{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },

  demoCard:     { padding: 20, gap: 12 },
  demoSubtitle: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.3 },
  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  locationChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, backgroundColor: ORANGE },
  chipTxt:      { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  shareBtn: { height: 58, borderRadius: 29, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  shareTxt: { color: '#fff', fontSize: 19, fontFamily: 'Poppins_500Medium' },
});
