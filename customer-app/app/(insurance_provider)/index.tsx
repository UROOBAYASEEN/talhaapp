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

const ORANGE = '#e2671b';
const DARK_BLUE = '#061B4A';
const BLUE_BORDER = 'rgba(255,255,255,0.15)';

const QUICK_ACTIONS = [
  { title: 'Tracker Req',        icon: <Ionicons name="locate-outline" size={24} color="#E2671B" />, route: '/(insurance_provider)/tracker-requests' },
  { title: 'Customers',          icon: <DIcon src={DICON.customers} size={24} />,     route: '/(insurance_provider)/customers' },
  { title: 'New Special\nOffer', icon: <DIcon src={DICON.addVideoAdd} size={20} />,   route: '/(insurance_provider)/special-offer' },
  { title: 'Add Video',          icon: <DIcon src={DICON.addVideoAdd} size={20} />,   route: '/(insurance_provider)/video-ads' },
  { title: 'Advertisement',      icon: <DIcon src={DICON.advertisement} size={24} />, route: '/(insurance_provider)/advertisement' },
];

const TILE_W = (Dimensions.get('window').width - 32 - 30) / 4;

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
        icon: <Ionicons name="chatbubbles-outline" size={24} color="#E2671B" />,
      }))
    : [
        { title: 'New reservation received', subtitle: 'Honda Civic RS 2026 • Black', icon: <DIcon src={DICON.activeReservations} size={24} /> },
        { title: 'New enquiry',              subtitle: 'Yamaha YBR 125 • Blue',       icon: <Ionicons name="chatbubbles-outline" size={24} color="#E2671B" /> },
        { title: 'Advertisement approved',   subtitle: 'Homepage Banner • 7 Days',    icon: <DIcon src={DICON.advertisement} size={22} /> },
      ];

  const CHART_H = 150;
  const bars: any[] = chartData.length > 0
    ? (() => {
        const maxCount = Math.max(...chartData.map((d: any) => d.count), 1);
        return chartData.map((d: any) => ({ h: Math.max(8, (d.count / maxCount) * 100), label: d.label || '' }));
      })()
    : FALLBACK_BAR_DATA.map((b, i) => ({ h: (b.h / 112) * 100, label: ['1 May', '', '3 May', '', '5 May', '', 'Today'][i] }));
  const [chartW, setChartW] = useState(0);
  const barGap = 8;
  const barW = chartW ? (chartW - barGap * (bars.length - 1)) / bars.length : 0;
  const scale = CHART_H / 100;
  const linePts = chartW ? bars.map((b, i) => `${i * (barW + barGap) + barW / 2},${CHART_H - b.h * scale - 8}`).join(' ') : '';

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
            <View style={{ marginLeft: 14, flexShrink: 1 }}>
              <View style={s.nameRow}>
                <Text style={s.companyName} numberOfLines={1}>{companyName}</Text>
                <Verified size={20} />
              </View>
              <View style={s.planRow}>
                <Ionicons name="ribbon-outline" size={16} color={ORANGE} />
                <Text style={s.planText}>Premium Plan</Text>
              </View>
            </View>
          </View>
          <View style={s.headerIcons}>
            <TouchableOpacity onPress={() => router.push('/alert' as any)}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(insurance_provider)/settings' as any)}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── WELCOME BANNER ── */}
        <View style={s.welcomeCard}>
          <View style={s.welcomeText}>
            <Text style={s.welcomeSub}>Welcome Back,</Text>
            <Text style={s.welcomeTitle}>{"Let's grow your dealership\ntoday with Autowizor!"}</Text>
          </View>
          <Image source={DICON.dealershipCar} style={s.carImage} resizeMode="contain" />
        </View>

        {/* ── OVERVIEW HEADER ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitleInline}>Overview</Text>
          <TouchableOpacity onPress={() => router.push('/(insurance_provider)/analytics' as any)}>
            <Text style={s.analyticsLink}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* ── POLICIES CHART CARD ── */}
        <GlowCard style={s.chartCard}>
          <View style={s.chartTopRow}>
            <View>
              <Text style={s.chartLabel}>TOTAL POLICIES</Text>
              <Text style={s.chartNumber}>{Number(totalPolicies).toLocaleString()}</Text>
            </View>
            <View style={s.chartTopRight}>
              <View style={s.percentBadge}>
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

          {/* Bar chart + trend line (dark → orange) */}
          <View style={[s.chartArea, { height: CHART_H }]} onLayout={e => setChartW(e.nativeEvent.layout.width)}>
            {bars.map((b, i) => {
              const t = bars.length > 1 ? i / (bars.length - 1) : 1;
              return (
                <View key={i} style={{ width: barW || undefined, flex: barW ? undefined : 1, height: b.h * scale, marginLeft: i ? barGap : 0, overflow: 'hidden' }}>
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
              <Text style={s.statNumber}>{Number(activePolicies).toLocaleString()}</Text>
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
              <Text style={s.statNumber}>{pendingPolicies}</Text>
            </View>
            <Text style={s.statLabel}>Pending</Text>
            <View style={s.statChange}>
              <Ionicons name="arrow-up" size={14} color="#E0363A" />
              <Text style={[s.statChangeText, { color: '#E0363A' }]}>{pendingChange}%</Text>
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
      <Chatbot />
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
  companyName:   { color: D.white, fontSize: 18, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
  planRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  planText:      { color: ORANGE, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  headerIcons:   { flexDirection: 'row', gap: 18 },

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
  percentBadge:  { backgroundColor: '#3A2420', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
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
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 12 },
  actionCard:   { width: TILE_W, height: 80, borderRadius: 16, backgroundColor: D.navy, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 2 },
  actionText:   { color: '#C9BDC4', fontSize: 11, textAlign: 'center', lineHeight: 14, fontFamily: 'Poppins_400Regular' },

  activitySection:  { marginTop: 26 },
  activityCard:     { minHeight: 60, marginBottom: 12, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  activityIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0B2358', alignItems: 'center', justifyContent: 'center' },
  activityInfo:     { flex: 1, marginLeft: 10 },
  activityTitle:    { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  activitySub:      { color: D.muted, fontSize: 10, marginTop: 2, fontFamily: 'Poppins_400Regular' },
});
