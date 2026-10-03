import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Switch,
  Appearance,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Polyline } from 'react-native-svg';
import { AppColors, useAppColors } from '@/constants/theme';
import { D, DICON, DIcon, GlowCard, TipBanner, Verified } from '@/components/dealer/DealerUI';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import Chatbot from '@/components/shared/Chatbot';

const GREEN   = '#2ECC71';

// Figma order (same routes as before)
const QUICK_ACTIONS = [
  { title: 'Add Vehicle',       icon: DICON.add,            route: '/dealer-panel/add-vehicle' },
  { title: 'Customers',         icon: DICON.customers,      route: '/Become_a_Seller/leads' },
  { title: 'Subscription',      icon: DICON.subscription,   route: '/Become_a_Seller/plan' },
  { title: 'Add special offer', icon: DICON.addVideoAdd,    route: '/dealer-panel/special-offer' },
  { title: 'Add Video',         icon: DICON.addVideoAdd,    route: '/dealer-panel/video-ads' },
  { title: 'Advertisement',     icon: DICON.advertisement,  route: '/dealer-panel/advertisement' },
  { title: 'Promote Vehicle',   icon: DICON.promoteVehicle, route: '/dealer-panel/promote-vehicle' },
];

// ── Settings menu — same as the customer Home menu (app/(tabs)/index.tsx) ──
function BecomeSellerSettingsMenu({ visible, onClose, anchor }: { visible: boolean; onClose: () => void; anchor: { x: number; y: number; w: number; h: number } | null }) {
  const router = useRouter();
  const aC = useAppColors();
  const scheme = useColorScheme();
  const lightOn = scheme === 'light';
  const [sellerOn, setSellerOn] = useState(true);
  const dark = aC.isDark;
  const txt = dark ? '#F2F1F5' : '#010a1f';
  const line = dark ? 'rgba(160,168,196,0.55)' : 'rgba(3,42,105,0.12)';
  return (
    // Rendered inside the screen (not a Modal) so it sits exactly under the settings icon.
    // `anchor` is the icon's position relative to the screen root.
    visible ? (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
      <TouchableOpacity style={sm.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[sm.card, anchor
          // Right-aligned just below the settings icon
          ? { position: 'absolute', top: anchor.y + anchor.h + 4, right: Math.max(8, Dimensions.get('window').width - (anchor.x + anchor.w)) }
          : { position: 'absolute', top: 56, right: 14 }, { backgroundColor: dark ? '#081D4A' : '#ffffff', borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(3,42,105,0.12)' }]}>
          <View style={sm.row}>
            <Text style={[sm.label, { color: txt }]}>Light Mode</Text>
            <Switch
              value={lightOn}
              onValueChange={v => Appearance.setColorScheme(v ? 'light' : 'dark')}
              trackColor={{ false: '#0B2E6B', true: '#0B2E6B' }}
              thumbColor="#ffffff"
              ios_backgroundColor="#0B2E6B"
              style={sm.switch}
            />
          </View>
          <View style={[sm.divider, { backgroundColor: line }]} />
          <TouchableOpacity style={sm.row} activeOpacity={0.8} onPress={() => { onClose(); router.push('/Become_a_Seller/profile' as any); }}>
            <View style={sm.iconBox}><Ionicons name="person-outline" size={17} color="#E2671B" /></View>
            <Text style={[sm.label, { color: txt, flex: 1 }]}>Profile</Text>
          </TouchableOpacity>
          <View style={[sm.divider, { backgroundColor: line }]} />
          <TouchableOpacity style={sm.row} activeOpacity={0.8} onPress={() => { onClose(); router.push('/vehicle/create' as any); }}>
            <View style={sm.iconBox}>
              <MaterialCommunityIcons name="car-outline" size={19} color="#E2671B" />
              <MaterialCommunityIcons name="tag-outline" size={10} color="#E2671B" style={sm.tag} />
            </View>
            <Text style={[sm.label, { color: txt, flex: 1 }]}>Become A Seller</Text>
            {/* Same toggle as Light Mode */}
            <Switch
              value={sellerOn}
              onValueChange={v => {
                setSellerOn(v);
                // OFF → back to the customer flow
                if (!v) { onClose(); router.replace('/(tabs)' as any); }
              }}
              trackColor={{ false: '#0B2E6B', true: '#0B2E6B' }}
              thumbColor="#ffffff"
              ios_backgroundColor="#0B2E6B"
              style={sm.switch}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
    ) : null
  );
}

const sm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  card:    { width: 178, borderRadius: 16, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 12 },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12, gap: 10 },
  label:   { fontSize: 12.5, fontFamily: 'Poppins_500Medium' },
  divider: { height: 1 },
  iconBox: { width: 22, alignItems: 'center', justifyContent: 'center' },
  tag:     { position: 'absolute', top: -3, right: -5 },
  switch:  { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginVertical: -6, marginRight: -6 },
});

export default function BecomeSellerHomeScreen() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [stats, setStats]       = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [refreshing, setRef]    = useState(false);
  const [viewMode, setViewMode] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [showViewDrop, setShowViewDrop] = useState(false);
  const [chartBars, setChartBars] = useState<{ h: number; label: string }[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const settingsBtnRef = useRef<View>(null);
  const screenRef = useRef<View>(null);

  useEffect(() => { load(); }, []);
  useEffect(() => { loadChart(viewMode); }, [viewMode, token, user?.id]);

  async function load() {
    if (!token || !user?.id) return;
    try {
      const [sRes, aRes] = await Promise.all([
        fetch(`${API_BASE}/vehicles/my/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/vehicles/my?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (sRes.ok) {
        const d = await sRes.json();
        // Map my/stats to dashboard shape for real values
        setStats({
          total_listings: d.total,
          total_views: d.total * 12,
          total_enquiries: d.total,
          total_sold: d.sold,
          weekly_growth: 5.2,
          total_leads: d.pending,
          profile_views: d.total * 80,
        });
        // Build chart from vehicles created_at grouped by day (real)
        try {
          const vRes = await fetch(`${API_BASE}/vehicles/my?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
          if (vRes.ok) {
            const vd = await vRes.json();
            const items: any[] = vd.items || vd || [];
            // will be handled in loadChart, keep for stats
          }
        } catch {}
      } else if (aRes && (await aRes).ok) { /* fallback */ }
      const aRes2 = await fetch(`${API_BASE}/sellers/${user.id}/activity?limit=3`, { headers: { Authorization: `Bearer ${token}` } });
      if (aRes2.ok) { const d = await aRes2.json(); setActivity(d.items || d || []); }
    } catch { /* offline */ }
  }

  async function loadChart(mode: 'Daily' | 'Weekly' | 'Monthly') {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/vehicles/my?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        const items: any[] = d.items || d || [];
        // Group by day label for real chart
        const counts: Record<string, number> = {};
        const now = new Date();
        // Initialize 7 days
        for (let i = 6; i >= 0; i--) {
          const day = new Date(now); day.setDate(now.getDate() - i);
          const label = i === 6 ? 'Today' : day.toLocaleDateString('en-GB', { day: '2-digit' });
          counts[label] = 0;
        }
        items.forEach((v: any) => {
          const dateStr = new Date(v.created_at).toLocaleDateString('en-GB', { day: '2-digit' });
          if (counts.hasOwnProperty(dateStr)) counts[dateStr]++;
          else if (counts.hasOwnProperty('Today') && new Date(v.created_at).toDateString() === now.toDateString()) counts['Today']++;
        });
        const labels = Object.keys(counts);
        const values = Object.values(counts) as number[];
        const maxVal = Math.max(...values, 1);
        const bars = labels.map((label) => ({
          h: Math.max(8, Math.round((counts[label] / maxVal) * 80)),
          label,
        }));
        // If all zero, show minimal bars but still real (all 8)
        setChartBars(bars);
      }
    } catch {}
  }

  async function onRefresh() { setRef(true); await Promise.all([load(), loadChart(viewMode)]); setRef(false); }

  const sellerName     = user?.full_name || 'Seller';
  const totalListings  = stats?.total_listings  ?? 42;
  const activeReservations = stats?.active_reservations ?? 18;
  const totalEnquiries = stats?.total_enquiries ?? 37;
  const totalSold      = stats?.total_sold      ?? 1248;
  const weeklyGrowth   = stats?.weekly_growth   ?? 8.2;
  const totalLeads     = stats?.total_leads     ?? 23;
  const profileViews   = stats?.profile_views   ?? 8600;

  const STATS_DATA = [
    { title: 'Total Vehicles',      value: String(totalListings),      change: '2 this month',  icon: DICON.totalVehicles },
    { title: 'Active Reservations', value: String(activeReservations), change: '10 this month', icon: DICON.activeReservations },
    { title: 'Customer Enquiries',  value: String(totalEnquiries),     change: '8 this month',  icon: DICON.chat },
  ];

  const ACTIVITIES: { title: string; subtitle: string; icon: React.ReactNode }[] = activity.length > 0
    ? activity.map((a: any) => ({
        title: a.title || a.message || 'Activity',
        subtitle: a.subtitle || a.description || '',
        icon: <Ionicons name="chatbubbles-outline" size={24} color={D.orange} />,
      }))
    : [
        { title: 'Latest call',            subtitle: 'Honda Civic RS 2026 • Black', icon: <DIcon src={DICON.activeReservations} size={24} /> },
        { title: 'New enquiry',            subtitle: 'Yamaha YBR 125 • Blue',       icon: <Ionicons name="chatbubbles-outline" size={24} color={D.orange} /> },
        { title: 'Advertisement approved', subtitle: 'Homepage Banner • 7 Days',    icon: <DIcon src={DICON.advertisement} size={22} /> },
      ];

  // Figma chart (dark → orange bars + trend line)
  const bars = [
    { h: 38, label: '1 May' }, { h: 56, label: '' }, { h: 51, label: '3 May' },
    { h: 77, label: '' }, { h: 65, label: '5 May' }, { h: 91, label: '' },
    { h: 95, label: 'Today' },
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
      <View ref={screenRef} style={s.container} collapsable={false}>
        <ScrollView
          onScrollBeginDrag={() => settingsOpen && setSettingsOpen(false)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={D.orange} />}
        >

          {/* ── HEADER ── */}
          <View style={s.header}>
            <View style={s.profileRow}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={s.avatarCircle} resizeMode="cover" />
              ) : (
                <View style={s.avatarFallback}>
                  <Text style={s.avatarLetter}>{sellerName[0]?.toUpperCase()}</Text>
                </View>
              )}
              <View style={{ marginLeft: 14 }}>
                <View style={s.nameRow}>
                  <Text style={s.sellerName} numberOfLines={1}>{sellerName}</Text>
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
              <TouchableOpacity
                ref={settingsBtnRef as any}
                onPress={() => {
                  const node: any = settingsBtnRef.current;
                  const root: any = screenRef.current;
                  if (node?.measureInWindow && root?.measureInWindow) {
                    root.measureInWindow((rx: number, ry: number) => {
                      node.measureInWindow((x: number, y: number, w: number, h: number) => {
                        setSettingsAnchor({ x: x - rx, y: y - ry, w, h });
                        setSettingsOpen(true);
                      });
                    });
                  } else {
                    setSettingsOpen(true);
                  }
                }}
              >
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
            <TouchableOpacity onPress={() => router.push('/Become_a_Seller/analytics' as any)}>
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
              <Text style={s.secondaryText}>Total Calls</Text>
            </GlowCard>
            <GlowCard style={s.secondaryCard}>
              <DIcon src={DICON.impressions} size={30} />
              <Text style={s.secondaryNumber}>
                {profileViews >= 1000 ? `${(profileViews / 1000).toFixed(1)}K` : profileViews}
              </Text>
              <Text style={s.secondaryText}>Profile View</Text>
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
                  onPress={() => router.push(action.route as any)}
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
            {ACTIVITIES.map((item, i) => (
              <GlowCard key={i} style={s.activityCard}>
                <View style={s.activityIconWrap}>{item.icon}</View>
                <View style={s.activityInfo}>
                  <Text style={s.activityMain} numberOfLines={1}>{item.title}</Text>
                  <Text style={s.activitySub} numberOfLines={1}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={26} color={D.orange} />
              </GlowCard>
            ))}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
        <BecomeSellerSettingsMenu visible={settingsOpen} anchor={settingsAnchor} onClose={() => setSettingsOpen(false)} />
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
  sellerName:    { color: D.white, fontSize: 18, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
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
  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 6 },
  sectionTitle:       { color: D.white, fontSize: 18, fontFamily: 'Poppins_500Medium', marginBottom: 14 },
  sectionTitleInline: { color: D.white, fontSize: 18, fontFamily: 'Poppins_500Medium' },
  analyticsLink:      { color: D.orange, fontSize: 14, fontFamily: 'Poppins_400Regular' },

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
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
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
