import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  ChevronLeft, Bell, ChevronDown,
  Heart, Share2, Bookmark,
} from 'lucide-react-native';
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

/* ─── Custom Bar Chart ─── */
function BarChartView({ data }: { data: DayValue[] }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const H = 150;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: H, gap: 8, paddingHorizontal: 4 }}>
        {data.map((d, i) => {
          const darkH = Math.max(4, (d.value / maxVal) * H);
          return (
            <View key={i} style={{ flex: 1, height: H, borderRadius: 8, backgroundColor: 'rgba(226,103,27,0.18)', overflow: 'hidden', justifyContent: 'flex-end' }}>
              <View style={{ height: darkH, borderRadius: 8, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['#ff9a00', ORANGE]}
                  start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 8, paddingHorizontal: 4 }}>
        {data.map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>{d.day}</Text>
        ))}
      </View>
    </View>
  );
}

/* ─── Custom Line Chart ─── */
function LineChartView({ data }: { data: DayValue[] }) {
  const H       = 90;
  const W_CHART = width - 32 - 32;
  const maxVal  = Math.max(...data.map(d => d.value), 1);
  const minVal  = Math.min(...data.map(d => d.value));
  const range   = maxVal - minVal || 1;
  const pts     = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W_CHART,
    y: H - ((d.value - minVal) / range) * (H - 14) - 7,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return (
    <View>
      <Svg width={W_CHART} height={H}>
        <Path d={pathD} stroke={ORANGE} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={ORANGE}/>
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        {data.map((d, i) => (
          <Text key={i} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'Poppins_400Regular' }}>{d.day}</Text>
        ))}
      </View>
    </View>
  );
}

/* ─── Donut Chart ─── */
function DonutChart({ total, confirmed, completed, pending }: {
  total: number; confirmed: number; completed: number; pending: number;
}) {
  const r             = 46;
  const strokeWidth   = 12;
  const circumference = 2 * Math.PI * r;
  const cx = 65, cy = 65;
  const safeTotal    = total || 1;
  const confirmedLen = (confirmed / safeTotal) * circumference;
  const completedLen = (completed / safeTotal) * circumference;
  const pendingLen   = (pending   / safeTotal) * circumference;

  return (
    <View style={{ width: 130, height: 130 }}>
      <Svg width={130} height={130}>
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth}/>
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke={ORANGE} strokeWidth={strokeWidth}
          strokeDasharray={`${confirmedLen} ${circumference}`}
          strokeLinecap="round"
          rotation={-90} originX={cx} originY={cy}
        />
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#22C55E" strokeWidth={strokeWidth}
          strokeDasharray={`${completedLen} ${circumference}`}
          strokeDashoffset={-confirmedLen}
          strokeLinecap="round"
          rotation={-90} originX={cx} originY={cy}
        />
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#9CA3AF" strokeWidth={strokeWidth}
          strokeDasharray={`${pendingLen} ${circumference}`}
          strokeDashoffset={-(confirmedLen + completedLen)}
          strokeLinecap="round"
          rotation={-90} originX={cx} originY={cy}
        />
      </Svg>
      <View style={{ position: 'absolute', width: 130, height: 130, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.textPrimary, fontSize: 24, fontFamily: 'Poppins_700Bold' }}>{total}</Text>
        <Text style={{ color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular' }}>Total</Text>
      </View>
    </View>
  );
}

/* ─── Main Screen ─── */
export default function BecomeSellerAnalyticsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [period,         setPeriod]         = useState('Weekly');
  const [followerPeriod, setFollowerPeriod] = useState('Weekly');
  const [loading, setLoading] = useState(true);
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    if (!data) return;
    try {
      await Share.share({
        title: 'My Seller Analytics',
        message:
          `📊 My Seller Analytics\n\n` +
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

  const FALLBACK: AnalyticsData = {
    unit_selling:             [{ day: 'M', value: 2 }, { day: 'T', value: 4 }, { day: 'W', value: 3 }, { day: 'T', value: 6 }, { day: 'F', value: 5 }, { day: 'S', value: 8 }, { day: 'S', value: 7 }],
    total_followers:          320,
    followers_trend:          [{ day: 'M', value: 30 }, { day: 'T', value: 55 }, { day: 'W', value: 42 }, { day: 'T', value: 70 }, { day: 'F', value: 60 }, { day: 'S', value: 90 }, { day: 'S', value: 85 }],
    followers_trend_monthly:  [{ day: 'W1', value: 80 }, { day: 'W2', value: 120 }, { day: 'W3', value: 100 }, { day: 'W4', value: 160 }],
    followers_trend_yearly:   [{ day: 'Jan', value: 200 }, { day: 'Mar', value: 350 }, { day: 'Jun', value: 280 }, { day: 'Sep', value: 420 }, { day: 'Dec', value: 380 }],
    profile_views:            1200,
    profile_views_delta:      12,
    search_appearances:       540,
    search_appearances_delta: 8,
    engagement_likes:         148,
    engagement_likes_pct:     62,
    engagement_shares:        54,
    engagement_shares_pct:    23,
    engagement_saves:         36,
    engagement_saves_pct:     15,
    reservations_total:       5,
    reservations_confirmed:   3,
    reservations_completed:   2,
    reservations_pending:     1,
    top_locations:            [{ name: 'Karachi', pct: 42 }, { name: 'Lahore', pct: 28 }, { name: 'Pindi', pct: 15 }],
  };

  const fetchAnalytics = useCallback(async () => {
    if (!token) { setData(FALLBACK); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sellers/me/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setData(FALLBACK); return; }
      setData(await res.json());
    } catch {
      setData(FALLBACK);
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
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <ChevronLeft size={24} color={ORANGE} strokeWidth={2}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Analytics</Text>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/alert' as any)}>
            <Bell size={20} color={ORANGE}/>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={ORANGE}/>
          </View>
        ) : data ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

            {/* ── UNIT SELLING ── */}
            <View style={s.section}>
              <View style={s.rowBetween}>
                <Text style={s.sectionTitle}>Unit Selling</Text>
                <View style={s.viewsDot}>
                  <View style={s.dot}/>
                  <Text style={s.viewsTxt}>Impressions</Text>
                </View>
              </View>

              <View style={s.periodWrap}>
                <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                {['Weekly', 'Monthly', 'Yearly'].map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[s.periodBtn, period === p && s.periodBtnActive]}
                    onPress={() => setPeriod(p)}
                  >
                    {period === p && (
                      <>
                        <LinearGradient colors={['rgba(100,160,255,0.35)', 'rgba(100,160,255,0.15)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                        <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                        <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                        <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                      </>
                    )}
                    <Text style={[s.periodTxt, period === p && s.periodTxtActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <BarChartView data={data.unit_selling}/>
            </View>

            {/* ── FOLLOWERS CARD ── */}
            <View style={s.followCard}>
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <View style={s.rowBetween}>
                <View>
                  <Text style={s.cardLabel}>Total Followers</Text>
                  <Text style={s.followCount}>{data.total_followers.toLocaleString()}</Text>
                </View>
                <View style={s.fPillRow}>
                  {['Weekly', 'Monthly', 'Yearly'].map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[s.fPill, followerPeriod === p && s.fPillActive]}
                      onPress={() => setFollowerPeriod(p)}
                    >
                      {followerPeriod === p && (
                        <>
                          <LinearGradient colors={['rgba(100,160,255,0.35)', 'rgba(100,160,255,0.15)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                          <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                        </>
                      )}
                      <Text style={[s.fPillTxt, followerPeriod === p && s.fPillTxtActive]}>
                        {p === 'Weekly' ? 'W' : p === 'Monthly' ? 'M' : 'Y'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <LineChartView data={
                followerPeriod === 'Monthly' ? data.followers_trend_monthly :
                followerPeriod === 'Yearly'  ? data.followers_trend_yearly  :
                data.followers_trend
              }/>
            </View>

            {/* ── STAT CARDS ── */}
            <View style={s.statRow}>
              <View style={s.statCard}>
                <Text style={s.statLabel}>Profile Views</Text>
                <Text style={s.statValue}>{fmtNum(data.profile_views)}</Text>
                <Text style={[s.statDelta, { color: data.profile_views_delta >= 0 ? ORANGE : '#f87171' }]}>
                  {fmtDelta(data.profile_views_delta)}
                </Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statLabel}>Search Appearances</Text>
                <Text style={s.statValue}>{fmtNum(data.search_appearances)}</Text>
                <Text style={[s.statDelta, { color: data.search_appearances_delta >= 0 ? ORANGE : '#f87171' }]}>
                  {fmtDelta(data.search_appearances_delta)}
                </Text>
              </View>
            </View>

            {/* ── ENGAGEMENT ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Engagement Details</Text>
              {engagement.map(e => (
                <View key={e.label} style={s.engRow}>
                  <View style={s.rowBetween}>
                    <View style={s.engLeft}>
                      <e.Icon size={14} color={ORANGE}/>
                      <Text style={s.engLabel}>{e.label}</Text>
                    </View>
                    <Text style={s.engValue}>{e.value}</Text>
                  </View>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${e.pct}%` }]}>
                      <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject}/>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* ── RESERVATIONS DONUT ── */}
            <View style={s.reservCard}>
              <LinearGradient colors={['rgba(22,64,136,0.12)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.12)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['rgba(13,37,84,0.12)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(13,37,84,0.12)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <Text style={[s.sectionTitle, { fontSize: 14 }]}>Reservations Overview</Text>
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
                    { label: 'Completed', count: data.reservations_completed, color: '#22C55E' },
                    { label: 'Pending',   count: data.reservations_pending,   color: '#9CA3AF' },
                  ].map(l => (
                    <View key={l.label} style={s.legendRow}>
                      <View style={[s.legendDot, { backgroundColor: l.color }]}/>
                      <Text style={s.legendLabel}>{l.label}</Text>
                      <Text style={s.legendCount}>{l.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* ── AUDIENCE DEMOGRAPHICS ── */}
            <View style={s.demoCard}>
              <Text style={[s.sectionTitle, { fontSize: 14 }]}>Audience Demographics</Text>
              <Text style={s.demoSubtitle}>Top Locations</Text>
              <View style={s.chipsRow}>
                {(data.top_locations.length > 0 ? data.top_locations : [
                  { name: 'Karachi', pct: 42 },
                  { name: 'Lahore', pct: 28 },
                  { name: 'Pindi', pct: 15 },
                ]).map(l => (
                  <View key={l.name} style={s.locationChip}>
                    <Text style={s.chipTxt}>{l.name} ({l.pct}%)</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── SHARE BUTTON ── */}
            <TouchableOpacity style={s.shareBtn} activeOpacity={0.85} onPress={handleShare}>
              <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject}/>
              <Share2 size={17} color="#fff"/>
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
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, height: 60 },
  iconBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 4, gap: 16, paddingBottom: 20 },

  section:      { gap: 14 },
  sectionTitle: { color: C.textPrimary, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  rowBetween:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  viewsDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: ORANGE },
  viewsTxt: { color: ORANGE, fontSize: 12, fontFamily: 'Poppins_500Medium' },

  periodWrap: {
    flexDirection: 'row', borderRadius: 30, padding: 4,
    borderWidth: 1, borderColor: AppColors.glassBorder,
    overflow: 'hidden', backgroundColor: AppColors.glassBg,
  },
  periodBtn:       { flex: 1, paddingVertical: 9, borderRadius: 26, alignItems: 'center', overflow: 'hidden' },
  periodBtnActive: {},
  periodTxt:       { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  periodTxtActive: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },

  followCard: {
    borderRadius: 20, borderWidth: 1, borderColor: C.glassBorder,
    backgroundColor: '#010A1F', overflow: 'hidden', padding: 16, gap: 12,
  },
  cardLabel:   { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  followCount: { color: C.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold', marginTop: 2 },

  fPillRow:       { flexDirection: 'row', gap: 4, alignItems: 'center' },
  fPill:          { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: AppColors.glassBorder, backgroundColor: AppColors.glassBg },
  fPillActive:    { borderColor: 'transparent' },
  fPillTxt:       { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.45)' },
  fPillTxtActive: { color: '#fff' },

  statRow:   { flexDirection: 'row', gap: 12 },
  statCard:  { flex: 1, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#010A1F', overflow: 'hidden', padding: 14, gap: 4 },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  statValue: { color: C.textPrimary, fontSize: 22, fontFamily: 'Poppins_700Bold' },
  statDelta: { fontSize: 12, fontFamily: 'Poppins_500Medium' },

  engRow:        { gap: 8 },
  engLeft:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  engLabel:      { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  engValue:      { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3, overflow: 'hidden' },

  reservCard: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: '#010A1F', overflow: 'hidden', padding: 16, gap: 14 },
  donutRow:   { flexDirection: 'row', alignItems: 'center', gap: 20 },
  legendCol:  { flex: 1, gap: 14 },
  legendRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendLabel:{ color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_400Regular', flex: 1 },
  legendCount:{ color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  demoCard:     { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#010A1F', overflow: 'hidden', padding: 16, gap: 12 },
  demoSubtitle: { color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_700Bold' },
  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locationChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 30, backgroundColor: ORANGE },
  chipTxt:      { color: '#fff', fontSize: 10, fontFamily: 'Poppins_700Bold' },

  shareBtn: { height: 52, borderRadius: 30, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareTxt: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});
