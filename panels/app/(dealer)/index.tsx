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
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline } from 'react-native-svg';
import { AppColors } from '@/constants/theme';
import { D, DICON, DIcon, GlowCard, TipBanner, Verified } from '@/components/dealer/DealerUI';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import Chatbot from '@/components/shared/Chatbot';
import { useTabBarSpace } from '@/components/shared/PillTabBar';

const GREEN   = '#2ECC71';

const QUICK_ACTIONS = [
  { title: 'Add Vehicle',       icon: DICON.add,            route: '/dealer-panel/add-vehicle' },
  { title: 'Reservations',      icon: DICON.reservations,   route: '/(dealer)/leads', params: { tab: 'Reservation' } },
  { title: 'Customers',         icon: DICON.customers,      route: '/(dealer)/leads' },
  { title: 'Add Video Ads',     icon: DICON.addVideoAdd,    route: '/dealer-panel/video-ads' },
  { title: 'Add special offer', icon: DICON.addVideoAdd,    route: '/dealer-panel/special-offer' },
  { title: 'Advertisement',     icon: DICON.advertisement,  route: '/dealer-panel/advertisement' },
  { title: 'Promote Vehicle',   icon: DICON.promoteVehicle, route: '/dealer-panel/promote-vehicle' },
];

export default function DealerHomeScreen() {
  const tabSpace = useTabBarSpace(110);
  const { user, token } = useAuth();
  const router = useRouter();

  const [stats, setStats]             = useState<any>(null);
  const [activity, setActivity]       = useState<any[]>([]);
  const [profileMe, setProfileMe]     = useState<any>(null);
  const [refreshing, setRef]          = useState(false);
  const [viewMode, setViewMode]       = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [showViewDrop, setShowViewDrop] = useState(false);
  const [chartBars, setChartBars]     = useState<{ h: number; label: string }[]>([]);

  const BASE_URL = API_BASE.replace('/api/v1', '');
  function resolveUrl(url?: string | null): string | null {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BASE_URL}${url}`;
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { loadChart(viewMode); }, [viewMode, token, user?.id]);

  async function load() {
    if (!token || !user?.id) return;
    try {
      const [sRes, aRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/dealers/${user.id}/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/dealers/${user.id}/activity?limit=3`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/profile/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (aRes.ok) { const d = await aRes.json(); setActivity(d.items || d || []); }
      if (pRes.ok) setProfileMe(await pRes.json());
    } catch { /* offline */ }
  }

  async function loadChart(mode: 'Daily' | 'Weekly' | 'Monthly') {
    if (!token) return;
    try {
      // Real analytics — unit_selling + followers trend per original backend dealers.py:436
      const res = await fetch(`${API_BASE}/dealers/me/analytics`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        let raw: any[] = [];
        if (mode === 'Daily') raw = d.unit_selling || [];
        else if (mode === 'Weekly') raw = d.followers_trend || d.unit_selling || [];
        else raw = d.followers_trend_monthly || d.unit_selling || [];
        if (raw.length > 0) {
          const maxVal = Math.max(...raw.map((r: any) => Number(r.value ?? r.count ?? 0)), 1);
          const bars = raw.map((r: any) => ({
            h: Math.max(8, Math.round((Number(r.value ?? r.count ?? 0) / maxVal) * 95)),
            label: String(r.day ?? r.label ?? r.date ?? '').slice(0, 5),
          }));
          // Ensure 7 bars padded if less
          while (bars.length < 7) bars.unshift({ h: 6, label: '' });
          setChartBars(bars.slice(-7));
          return;
        }
        // Fallback to unit_selling if specific mode empty
        if (d.unit_selling?.length) {
          const maxVal = Math.max(...d.unit_selling.map((r: any) => Number(r.value ?? 0)), 1);
          const bars = d.unit_selling.map((r: any) => ({
            h: Math.max(8, Math.round((Number(r.value ?? 0) / maxVal) * 95)),
            label: String(r.day ?? '').slice(0, 3),
          }));
          setChartBars(bars);
        }
      }
    } catch {}
  }

  async function onRefresh() { setRef(true); await load(); await loadChart(viewMode); setRef(false); }

  const dealerName         = user?.full_name || 'Dealer';
  const totalVehicles      = stats?.total_vehicles      ?? 0;
  const activeReservations = stats?.active_reservations ?? 0;
  const customerEnquiries  = stats?.customer_enquiries  ?? 0;
  const totalSold          = stats?.total_sold          ?? 0;
  const weeklyGrowth       = stats?.weekly_growth       ?? 0;
  const totalLeads         = stats?.total_calls         ?? 0;
  const profileViews       = stats?.profile_views       ?? 0;

  const STATS_DATA = [
    { title: 'Total Vehicles',      value: String(totalVehicles),      change: '2 this month',  icon: DICON.totalVehicles },
    { title: 'Active Reservations', value: String(activeReservations), change: '10 this month', icon: DICON.activeReservations },
    { title: 'Customer Enquiries',  value: String(customerEnquiries),  change: '8 this month',  icon: DICON.chat },
  ];

  function activityMeta(a: any): { icon: React.ReactNode; route: string } {
    const type = (a.type || a.activity_type || '').toLowerCase();
    if (type.includes('reservation') || type.includes('booking'))
      return { icon: <DIcon src={DICON.activeReservations} size={24} />, route: '/dealer-panel/reservations' };
    if (type.includes('enquir') || type.includes('lead') || type.includes('message'))
      return { icon: <Ionicons name="chatbubbles-outline" size={24} color={D.orange} />, route: '/(dealer)/leads' };
    if (type.includes('ad') || type.includes('advertis') || type.includes('banner'))
      return { icon: <DIcon src={DICON.advertisement} size={22} />, route: '/dealer-panel/advertisement' };
    if (type.includes('vehicle') || type.includes('listing'))
      return { icon: <DIcon src={DICON.totalVehicles} size={22} />, route: '/(dealer)/inventory' };
    if (type.includes('review') || type.includes('rating'))
      return { icon: <Ionicons name="star-outline" size={22} color={D.orange} />, route: '/dealer-panel/reviews' };
    return { icon: <Ionicons name="chatbubbles-outline" size={24} color={D.orange} />, route: '/(dealer)/leads' };
  }

  const ACTIVITIES = activity.length > 0
    ? activity.map((a: any) => {
        const meta = activityMeta(a);
        return {
          title:    a.title || a.message || 'Activity',
          subtitle: a.subtitle || a.description || '',
          time:     a.created_at ? new Date(a.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : '',
          icon:     meta.icon,
          route:    meta.route,
        };
      })
    : [] as any[];

  const bars = chartBars.length > 0 ? chartBars : [
    { h: 8, label: '' }, { h: 8, label: '' }, { h: 8, label: '' },
    { h: 8, label: '' }, { h: 8, label: '' }, { h: 8, label: '' },
    { h: 8, label: '' },
  ];
  const CHART_H = 150;
  const [chartW, setChartW] = useState(0);
  const barGap = 8;
  const barW = chartW ? (chartW - barGap * (bars.length - 1)) / bars.length : 0;
  const scale = CHART_H / 100;
  const linePts = chartW
    ? bars.map((b, i) => `${i * (barW + barGap) + barW / 2},${CHART_H - b.h * scale - 8}`).join(' ')
    : '';

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={D.orange} />}
        >

          {/* ── HEADER ── */}
          <View style={s.header}>
            <View style={s.profileRow}>
              {(() => {
                const uri = resolveUrl(profileMe?.avatar_url) || resolveUrl(user?.avatar_url);
                return uri ? (
                  <Image source={{ uri }} style={s.avatarCircle} resizeMode="cover" />
                ) : (
                  <View style={s.avatarFallback}>
                    <Text style={s.avatarLetter}>{dealerName[0]?.toUpperCase()}</Text>
                  </View>
                );
              })()}
              <View style={{ marginLeft: 14 }}>
                <View style={s.nameRow}>
                  <Text style={s.dealerName} numberOfLines={1}>{dealerName}</Text>
                  <Verified size={20} />
                </View>
                <View style={s.planRow}>
                  <Ionicons name="ribbon-outline" size={16} color={D.orange} />
                  <Text style={s.planText}>Premium Plan</Text>
                </View>
              </View>
            </View>
            <View style={s.headerIcons}>
              <TouchableOpacity onPress={() => router.push('/alert' as any)}>
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/profile/settings' as any)}>
                <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── WELCOME BANNER ── */}
          <View style={s.welcomeCard}>
            <View style={s.welcomeText}>
              <Text style={s.smallWelcome}>Welcome Back,</Text>
              <Text style={s.welcomeTitle}>
                {"Let's grow your dealership\ntoday with Autowizor!"}
              </Text>
            </View>
            <Image source={DICON.dealershipCar} style={s.carImage} />
          </View>

          {/* ── PROMOTION CARD ── */}
          <View style={s.promotionWrapper}>
            <TipBanner
              onPress={() => router.push('/dealer-panel/promote-vehicle' as any)}
              text="Promote Vehicle is ideal for getting your listing in front of more buyers for Increased visibility & faster buyer discovery."
            />
          </View>

          {/* ── OVERVIEW HEADER ── */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitleInline}>Overview</Text>
            <TouchableOpacity onPress={() => router.push('/dealer-panel/profile-analytics' as any)}>
              <Text style={s.analyticsLink}>Analytics</Text>
            </TouchableOpacity>
          </View>

          {/* ── STAT CARDS ── */}
          <View style={s.statsRow}>
            {STATS_DATA.map((item, i) => (
              <GlowCard key={i} style={s.statCard}>
                <DIcon src={item.icon} size={26} />
                <Text style={s.statValue}>{item.value}</Text>
                <Text style={s.statTitle} numberOfLines={1}>{item.title}</Text>
                <View style={s.changeBadge}>
                  <Ionicons name="arrow-up" size={14} color={GREEN} />
                  <Text style={s.changeText}>{item.change}</Text>
                </View>
              </GlowCard>
            ))}
          </View>

          {/* ── CHART CARD ── */}
          <GlowCard style={s.chartCard}>
            <View style={s.chartHeader}>
              <View>
                <Text style={s.chartLabel}>TOTAL  UNITS SOLD</Text>
                <Text style={s.chartNumber}>{Number(totalSold).toLocaleString()}</Text>
              </View>
              <View style={s.chartRight}>
                <View style={s.percentBadge}>
                  <Text style={s.percentText}>+{weeklyGrowth}%</Text>
                </View>
                <View>
                  <TouchableOpacity
                    style={s.weekButton}
                    onPress={() => setShowViewDrop(v => !v)}
                  >
                    <Text style={s.weekText}>{viewMode} View</Text>
                    <Ionicons name={showViewDrop ? 'chevron-up' : 'chevron-down'} size={16} color={D.muted} />
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

            <View style={[s.chartArea, { height: CHART_H }]} onLayout={e => setChartW(e.nativeEvent.layout.width)}>
              {bars.map((item, i) => {
                // dark → orange from left to right, like the Figma
                const t = bars.length > 1 ? i / (bars.length - 1) : 1;
                const from = `rgba(226,103,27,${(0.12 + t * 0.88).toFixed(2)})`;
                return (
                  <View key={i} style={[s.barWrapper, { width: barW || undefined, height: item.h * scale, marginLeft: i ? barGap : 0 }]}>
                    <LinearGradient
                      colors={[from, `rgba(226,103,27,${(0.08 + t * 0.8).toFixed(2)})`]}
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
            <View style={s.dateRow}>
              {bars.map((item, i) => (
                <Text key={i} style={[s.chartDate, { width: barW || undefined, marginLeft: i ? barGap : 0 }]} numberOfLines={1}>{item.label}</Text>
              ))}
            </View>
          </GlowCard>

          {/* ── SECONDARY STATS ── */}
          <View style={s.secondaryRow}>
            <GlowCard style={s.secondaryCard}>
              <Ionicons name="call-outline" size={26} color={D.orange} />
              <Text style={s.secondaryNumber}>{totalLeads}</Text>
              <Text style={s.secondaryText}>New Leads</Text>
            </GlowCard>
            <GlowCard style={s.secondaryCard}>
              <DIcon src={DICON.impressions} size={30} />
              <Text style={s.secondaryNumber}>
                {profileViews >= 1000 ? `${(profileViews / 1000).toFixed(1)}K` : profileViews}
              </Text>
              <Text style={s.secondaryText}>Vehicle Views</Text>
            </GlowCard>
          </View>

          {/* ── QUICK ACTIONS ── */}
          <View style={s.quickSection}>
            <Text style={s.sectionTitle}>Quick Actions</Text>
            <View style={s.actionsGrid}>
              {QUICK_ACTIONS.map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.actionCard, i % 4 !== 3 && { marginRight: '2.66%' }]}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push(
                      (action as any).params
                        ? ({ pathname: action.route, params: (action as any).params } as any)
                        : (action.route as any),
                    )
                  }
                >
                  <DIcon src={action.icon} size={22} />
                  <Text style={s.actionText}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── RECENT ACTIVITY ── */}
          <View style={s.activitySection}>
            <Text style={s.sectionTitle}>Recent Activity</Text>
            {ACTIVITIES.length === 0 ? (
              <Text style={{ color: AppColors.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingVertical: 16 }}>
                No recent activity
              </Text>
            ) : (
              ACTIVITIES.map((item, i) => (
                <GlowCard
                  key={i}
                  style={s.activityCard}
                  onPress={() => item.route && router.push(item.route as any)}
                >
                  <View style={s.activityIconWrap}>{item.icon}</View>
                  <View style={s.activityInfo}>
                    <Text style={s.activityMain} numberOfLines={1}>{item.title}</Text>
                    <Text style={s.activitySub} numberOfLines={1}>{[item.subtitle, item.time].filter(Boolean).join(' • ')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={26} color={D.orange} />
                </GlowCard>
              ))
            )}
          </View>

          <View style={{ height: tabSpace }} />
        </ScrollView>
      </View>
      <Chatbot />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: D.bg },
  container:     { flex: 1, backgroundColor: D.bg },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  /* HEADER */
  header:        { height: 84, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileRow:    { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  avatarCircle:  { width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: '#FFFFFF' },
  avatarFallback:{ width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#C8102E', justifyContent: 'center', alignItems: 'center' },
  avatarLetter:  { color: '#fff', fontSize: 28, fontFamily: 'Poppins_700Bold' },
  nameRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dealerName:    { color: D.white, fontSize: 18, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
  planRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  planText:      { color: D.orange, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  headerIcons:   { flexDirection: 'row', gap: 18 },

  /* WELCOME BANNER */
  welcomeCard:  { minHeight: 94, backgroundColor: D.navy, borderRadius: 20, paddingLeft: 18, paddingRight: 8, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  welcomeText:  { flex: 1 },
  smallWelcome: { color: '#FFFFFF', fontSize: 11, marginBottom: 6, fontFamily: 'Poppins_400Regular' },
  welcomeTitle: { color: '#FFFFFF', fontSize: 13, lineHeight: 20, fontFamily: 'Poppins_600SemiBold' },
  carImage:     { width: 116, height: 70, resizeMode: 'contain' },

  /* PROMOTION */
  promotionWrapper: { marginTop: 12 },

  /* SECTION */
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 6 },
  sectionTitle:  { color: D.white, fontSize: 18, fontFamily: 'Poppins_500Medium', marginBottom: 14 },
  sectionTitleInline: { color: D.white, fontSize: 18, fontFamily: 'Poppins_500Medium' },
  analyticsLink: { color: D.orange, fontSize: 14, fontFamily: 'Poppins_400Regular' },

  /* STAT CARDS */
  statsRow:   { flexDirection: 'row', gap: 10 },
  statCard:   { flex: 1, alignItems: 'center', paddingTop: 12, paddingBottom: 10, paddingHorizontal: 4 },
  statValue:  { color: '#C9BDC4', fontSize: 20, marginTop: 4, fontFamily: 'Poppins_600SemiBold' },
  statTitle:  { color: '#C9BDC4', fontSize: 10, textAlign: 'center', fontFamily: 'Poppins_400Regular' },
  changeBadge:{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 2 },
  changeText: { color: GREEN, fontSize: 11, fontFamily: 'Poppins_400Regular' },

  /* CHART */
  chartCard:    { marginTop: 14, padding: 14 },
  chartHeader:  { flexDirection: 'row', justifyContent: 'space-between', zIndex: 5 },
  chartLabel:   { color: '#FFFFFF', fontSize: 12, letterSpacing: 1.2, fontFamily: 'Poppins_400Regular' },
  chartNumber:  { color: '#FFFFFF', fontSize: 24, marginTop: 6, fontFamily: 'Poppins_600SemiBold' },
  chartRight:   { alignItems: 'flex-end', gap: 8 },
  percentBadge: { backgroundColor: '#3A2420', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  percentText:  { color: '#C9713F', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  weekButton:        { borderWidth: 1, borderColor: 'rgba(230,225,232,0.8)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  weekText:          { color: '#E6E1E8', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  viewDropdown:      { position: 'absolute', top: 34, right: 0, backgroundColor: 'rgba(6,18,52,0.98)', borderWidth: 1, borderColor: 'rgba(130,165,213,0.5)', borderRadius: 12, zIndex: 99, minWidth: 120, overflow: 'hidden' },
  viewDropItem:      { paddingHorizontal: 14, paddingVertical: 10 },
  viewDropItemActive:{ backgroundColor: 'rgba(226,103,27,0.15)' },
  viewDropText:      { color: D.muted, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  viewDropTextActive:{ color: D.orange, fontFamily: 'Poppins_600SemiBold' },
  chartArea:    { marginTop: 18, flexDirection: 'row', alignItems: 'flex-end' },
  barWrapper:   { flex: 1, overflow: 'hidden' },
  dateRow:      { flexDirection: 'row', marginTop: 6 },
  chartDate:    { flex: 1, color: 'rgba(230,225,232,0.45)', fontSize: 10, fontFamily: 'Poppins_400Regular', textAlign: 'center' },

  /* SECONDARY STATS */
  secondaryRow:    { flexDirection: 'row', gap: 12, marginTop: 12 },
  secondaryCard:   { flex: 1, height: 100, alignItems: 'center', justifyContent: 'center' },
  secondaryNumber: { color: '#C9BDC4', fontSize: 20, marginTop: 2, fontFamily: 'Poppins_600SemiBold' },
  secondaryText:   { color: D.muted, fontSize: 11, fontFamily: 'Poppins_400Regular' },

  /* QUICK ACTIONS */
  quickSection: { marginTop: 22 },
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  actionCard:   { width: '23%', height: 80, borderRadius: 16, backgroundColor: D.navy, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  actionText:   { color: '#C9BDC4', fontSize: 11, textAlign: 'center', marginTop: 6, lineHeight: 14, fontFamily: 'Poppins_400Regular' },

  /* RECENT ACTIVITY */
  activitySection:  { marginTop: 26 },
  activityCard:     { minHeight: 60, marginBottom: 12, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  activityIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0B2358', alignItems: 'center', justifyContent: 'center' },
  activityInfo:     { flex: 1, marginLeft: 10 },
  activityMain:     { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  activitySub:      { color: D.muted, fontSize: 10, marginTop: 2, fontFamily: 'Poppins_400Regular' },
});
