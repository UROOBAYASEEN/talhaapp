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
  MapPin,
  Lightbulb,
  Car,
  CalendarCheck,
  MessageCircle,
  Crown,
  Plus,
  Megaphone,
  Eye,
  User,
  ChevronRight,
  Star,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import Chatbot from '@/components/shared/Chatbot';

const ORANGE  = '#ff6900';
const GREEN   = '#00d084';
const BLUE    = 'rgba(100,160,255,0.5)';
const CARD_BG = 'rgba(3,12,40,0.6)';

const QUICK_ACTIONS = [
  { title: 'Add Vehicle',       Icon: Car,           route: '/dealer-panel/add-vehicle' },
  { title: 'Reservations',      Icon: CalendarCheck, route: '/(dealer)/leads', params: { tab: 'Reservation' } },
  { title: 'Customers',         Icon: User,          route: '/(dealer)/leads' },
  { title: 'Subscription',      Icon: Crown,         route: '/dealer-panel/subscription' },
  { title: 'Add Video Ads',     Icon: Plus,          route: '/dealer-panel/video-ads' },
  { title: 'Add special offer', Icon: Plus,          route: '/dealer-panel/special-offer' },
  { title: 'Advertisement',     Icon: Megaphone,     route: '/dealer-panel/advertisement' },
  { title: 'Promote Vehicle',   Icon: Megaphone,     route: '/dealer-panel/promote-vehicle' },
];

function GlassInset() {
  return (
    <>
      <LinearGradient
        colors={['rgba(22,64,136,0.2)', 'transparent']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
        style={StyleSheet.absoluteFillObject} pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(13,37,84,0.18)', 'transparent']}
        start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }}
        style={StyleSheet.absoluteFillObject} pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(29,83,175,0.2)']}
        start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject} pointerEvents="none"
      />
    </>
  );
}

export default function DealerHomeScreen() {
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
  const totalVehicles      = stats?.total_vehicles      ?? 42;
  const activeReservations = stats?.active_reservations ?? 18;
  const customerEnquiries  = stats?.customer_enquiries  ?? 37;
  const totalSold          = stats?.total_sold          ?? 1248;
  const weeklyGrowth       = stats?.weekly_growth       ?? 8.2;
  const totalLeads         = stats?.total_calls         ?? 23;
  const profileViews       = stats?.profile_views       ?? 8600;

  const STATS_DATA = [
    { title: 'Total Vehicles',      value: String(totalVehicles),      change: '2 this month',  Icon: Car },
    { title: 'Active Reservations', value: String(activeReservations), change: '10 this month', Icon: CalendarCheck },
    { title: 'Customer Enquiries',  value: String(customerEnquiries),  change: '8 this month',  Icon: MessageCircle },
  ];

  function activityMeta(a: any): { Icon: any; route: string } {
    const type = (a.type || a.activity_type || '').toLowerCase();
    if (type.includes('reservation') || type.includes('booking'))
      return { Icon: CalendarCheck, route: '/dealer-panel/reservations' };
    if (type.includes('enquir') || type.includes('lead') || type.includes('message'))
      return { Icon: MessageCircle, route: '/(dealer)/leads' };
    if (type.includes('ad') || type.includes('advertis') || type.includes('banner'))
      return { Icon: Megaphone, route: '/dealer-panel/advertisement' };
    if (type.includes('vehicle') || type.includes('listing'))
      return { Icon: Car, route: '/(dealer)/inventory' };
    if (type.includes('review') || type.includes('rating'))
      return { Icon: Star, route: '/dealer-panel/reviews' };
    return { Icon: MessageCircle, route: '/(dealer)/leads' };
  }

  const ACTIVITIES = activity.length > 0
    ? activity.map((a: any) => {
        const meta = activityMeta(a);
        return {
          title:    a.title || a.message || 'Activity',
          subtitle: a.subtitle || a.description || '',
          time:     a.created_at ? new Date(a.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : '',
          Icon:     meta.Icon,
          route:    meta.route,
        };
      })
    : [] as any[];

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
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
              <View style={{ marginLeft: 12 }}>
                <View style={s.nameRow}>
                  <Text style={s.dealerName}>{dealerName}</Text>
                  <View style={s.verifiedBadge}><Text style={s.verifiedTick}>✓</Text></View>
                </View>
                <View style={s.planRow}>
                  <MapPin size={13} color={ORANGE} />
                  <Text style={s.planText}>Premium Plan</Text>
                </View>
              </View>
            </View>
            <View style={s.headerIcons}>
              <TouchableOpacity onPress={() => router.push('/alert' as any)}>
                <Bell size={21} color={AppColors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/profile/settings' as any)}>
                <Settings size={21} color={AppColors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── WELCOME BANNER ── */}
          <View style={s.welcomeCard}>
            <GlassInset />
            <View style={s.welcomeText}>
              <Text style={s.smallWelcome}>Welcome Back,</Text>
              <Text style={s.welcomeTitle}>
                Let's grow your dealership{'\n'}today with Autowizor!
              </Text>
            </View>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=400&q=80' }}
              style={s.carImage}
            />
          </View>

          {/* ── PROMOTION CARD ── */}
          <View style={s.promotionWrapper}>
            <TouchableOpacity
              style={s.promotionCard}
              onPress={() => router.push('/dealer-panel/promote-vehicle' as any)}
            >
              <GlassInset />
              <LinearGradient
                colors={['transparent', 'rgba(255,105,0,0.35)']}
                start={{ x: 0.5, y: 0.4 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <View style={s.lightIcon}>
                <Lightbulb size={22} color="#ffd000" fill="#ffd000" />
              </View>
              <Text style={s.promotionText}>
                Promote Vehicle is ideal for getting your listing in front of more buyers for increased visibility & faster buyer discovery.
              </Text>
            </TouchableOpacity>
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
              <View key={i} style={s.statCard}>
                <GlassInset />
                <item.Icon size={20} color={ORANGE} />
                <Text style={s.statValue}>{item.value}</Text>
                <Text style={s.statTitle}>{item.title}</Text>
                <View style={s.changeBadge}>
                  <Text style={s.arrowUp}>↑</Text>
                  <Text style={s.changeText}>{item.change}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── CHART CARD ── */}
          <View style={s.chartCard}>
            <GlassInset />
            <View style={s.chartHeader}>
              <View>
                <Text style={s.chartLabel}>TOTAL UNITS SOLD</Text>
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
                    <Text style={[s.downArrow, showViewDrop && { transform: [{ rotate: '180deg' }] }]}>⌄</Text>
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

            <View style={s.chartArea}>
              {(chartBars.length > 0 ? chartBars : [
                { h: 38, label: '25' }, { h: 56, label: '26' }, { h: 51, label: '27' },
                { h: 77, label: '28' }, { h: 65, label: '29' }, { h: 91, label: '30' },
                { h: 95, label: 'Today' },
              ]).map((item, i, arr) => {
                const isLast = i === arr.length - 1;
                const alpha  = i < arr.length - 4 ? 0.35 : i < arr.length - 2 ? 0.6 : 1;
                return (
                  <View key={i} style={s.barCol}>
                    <Text style={[s.barTopVal, { opacity: alpha }]}>{item.label}</Text>
                    <View style={[s.barWrapper, { height: item.h }]}>
                      <LinearGradient
                        colors={isLast ? ['#ff6900', '#ff9a00'] : ['rgba(255,105,0,0.8)', 'rgba(255,154,0,0.6)']}
                        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                        style={[StyleSheet.absoluteFillObject, { borderRadius: 4 }]}
                      />
                    </View>
                    <Text style={[s.chartDate, { opacity: isLast ? 1 : 0.6 }]}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── SECONDARY STATS ── */}
          <View style={s.secondaryRow}>
            <View style={s.secondaryCard}>
              <GlassInset />
              <Bell size={24} color={ORANGE} />
              <Text style={s.secondaryNumber}>{totalLeads}</Text>
              <Text style={s.secondaryText}>New Leads</Text>
            </View>
            <View style={s.secondaryCard}>
              <GlassInset />
              <Eye size={24} color={ORANGE} />
              <Text style={s.secondaryNumber}>
                {profileViews >= 1000 ? `${(profileViews / 1000).toFixed(1)}K` : profileViews}
              </Text>
              <Text style={s.secondaryText}>Vehicle Views</Text>
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
                  onPress={() =>
                    router.push(
                      (action as any).params
                        ? ({ pathname: action.route, params: (action as any).params } as any)
                        : (action.route as any),
                    )
                  }
                >
                  <GlassInset />
                  <action.Icon size={22} color={ORANGE} />
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
                <TouchableOpacity
                  key={i}
                  style={s.activityCard}
                  activeOpacity={0.75}
                  onPress={() => item.route && router.push(item.route as any)}
                >
                  <GlassInset />
                  <View style={s.activityIconWrap}>
                    <item.Icon size={20} color={ORANGE} />
                  </View>
                  <View style={s.activityInfo}>
                    <Text style={s.activityMain}>{item.title}</Text>
                    <Text style={s.activitySub}>{item.subtitle}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {item.time ? <Text style={{ color: AppColors.textSecondary, fontSize: 9, fontFamily: 'Poppins_400Regular' }}>{item.time}</Text> : null}
                    <ChevronRight size={18} color={ORANGE} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
      <Chatbot />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: AppColors.bg },
  container:     { flex: 1, backgroundColor: AppColors.bg },
  scrollContent: { paddingHorizontal: 14, paddingTop: 8, marginTop: 10 },

  /* HEADER */
  header:        { height: 72, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileRow:    { flexDirection: 'row', alignItems: 'center' },
  avatarCircle:  { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: AppColors.glassBorder },
  avatarFallback:{ width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: AppColors.glassBorder, backgroundColor: '#d71920', justifyContent: 'center', alignItems: 'center' },
  avatarLetter:  { color: '#fff', fontSize: 26, fontWeight: '900', fontFamily: 'Poppins_700Bold' },
  nameRow:       { flexDirection: 'row', alignItems: 'center' },
  dealerName:    { color: AppColors.textPrimary, fontSize: 16, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  verifiedBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#1686f7', marginLeft: 6, alignItems: 'center', justifyContent: 'center' },
  verifiedTick:  { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  planRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  planText:      { color: ORANGE, fontSize: 11, marginLeft: 3, fontFamily: 'Poppins_500Medium' },
  headerIcons:   { flexDirection: 'row', gap: 16 },

  /* WELCOME BANNER */
  welcomeCard:  { minHeight: 92, backgroundColor: 'rgba(6,27,74,1)', borderWidth: 1, borderColor: AppColors.glassBorder, borderRadius: 20, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  welcomeText:  { flex: 1 },
  smallWelcome: { color: AppColors.textSecondary, fontSize: 9, marginBottom: 4, fontFamily: 'Poppins_400Regular' },
  welcomeTitle: { color: AppColors.textPrimary, fontSize: 11, lineHeight: 17, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  carImage:     { width: 90, height: 55, resizeMode: 'contain' },

  /* PROMOTION */
  promotionWrapper: { marginTop: 12 },
  promotionCard:   { minHeight: 58, backgroundColor: CARD_BG, borderWidth: 1, borderColor: ORANGE, borderRadius: 16, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  lightIcon:     { width: 38, alignItems: 'center' },
  promotionText: { flex: 1, color: AppColors.textPrimary, fontSize: 9, lineHeight: 14, fontFamily: 'Poppins_400Regular' },

  /* SECTION */
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle:  { color: AppColors.textPrimary, fontSize: 15, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', marginLeft: 4, marginBottom: 12 },
  sectionTitleInline: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  analyticsLink: { color: ORANGE, fontSize: 12, fontFamily: 'Poppins_500Medium' },

  /* STAT CARDS */
  statsRow:   { flexDirection: 'row', gap: 8 },
  statCard:   { flex: 1, borderRadius: 16, backgroundColor: CARD_BG, borderWidth: 1, borderColor: BLUE, alignItems: 'center', paddingTop: 12, paddingBottom: 12, paddingHorizontal: 4, overflow: 'hidden' },
  statValue:  { color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 3, fontFamily: 'Poppins_700Bold' },
  statTitle:  { color: AppColors.textSecondary, fontSize: 9, textAlign: 'center', marginTop: 1, fontFamily: 'Poppins_400Regular' },
  changeBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 7, paddingVertical: 4 },
  arrowUp:    { color: GREEN, fontSize: 9, marginRight: 2 },
  changeText: { color: GREEN, fontSize: 7, fontFamily: 'Poppins_500Medium' },

  /* CHART */
  chartCard:    { marginTop: 12, backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1, borderColor: BLUE, padding: 13, overflow: 'hidden' },
  chartHeader:  { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel:   { color: AppColors.textSecondary, fontSize: 10, letterSpacing: 1, fontFamily: 'Poppins_500Medium' },
  chartNumber:  { color: AppColors.textPrimary, fontSize: 24, fontWeight: '700', marginTop: 4, fontFamily: 'Poppins_700Bold' },
  chartRight:   { alignItems: 'flex-end' },
  percentBadge: { backgroundColor: 'rgba(226,103,27,0.2)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(226,103,27,0.4)' },
  percentText:  { color: '#e89c5e', fontSize: 11, fontFamily: 'Poppins_500Medium' },
  weekButton:        { borderWidth: 1, borderColor: AppColors.glassBorder, borderRadius: 17, paddingHorizontal: 9, paddingVertical: 5, marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  weekText:          { color: AppColors.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  downArrow:         { color: AppColors.textSecondary, fontSize: 15, marginLeft: 4 },
  viewDropdown:      { position: 'absolute', top: 44, right: 0, backgroundColor: 'rgba(6,18,52,0.98)', borderWidth: 1, borderColor: BLUE, borderRadius: 12, zIndex: 99, minWidth: 120, overflow: 'hidden' },
  viewDropItem:      { paddingHorizontal: 14, paddingVertical: 10 },
  viewDropItemActive:{ backgroundColor: 'rgba(255,105,0,0.15)' },
  viewDropText:      { color: AppColors.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  viewDropTextActive:{ color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  chartArea:    { marginTop: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barCol:       { flex: 1, alignItems: 'center', marginHorizontal: 2 },
  barTopVal:    { color: AppColors.textPrimary, fontSize: 8, fontFamily: 'Poppins_500Medium', marginBottom: 3 },
  barWrapper:   { width: '100%', borderRadius: 4, overflow: 'hidden' },
  chartDate:    { color: AppColors.textSecondary, fontSize: 8, fontFamily: 'Poppins_400Regular', marginTop: 4, textAlign: 'center' },

  /* SECONDARY STATS */
  secondaryRow:    { flexDirection: 'row', gap: 8, marginTop: 12 },
  secondaryCard:   { flex: 1, height: 100, backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1, borderColor: BLUE, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  secondaryNumber: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 5, fontFamily: 'Poppins_700Bold' },
  secondaryText:   { color: AppColors.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular' },

  /* QUICK ACTIONS */
  quickSection: { marginTop: 16 },
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  actionCard:   { width: '23.5%', height: 78, borderRadius: 14, backgroundColor: '#061B4A', borderWidth: 1, borderColor: AppColors.glassBorder, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  actionText:   { color: AppColors.textSecondary, fontSize: 9, textAlign: 'center', marginTop: 6, lineHeight: 13, fontFamily: 'Poppins_400Regular' },

  /* RECENT ACTIVITY */
  activitySection:  { marginTop: 24 },
  activityCard:     { minHeight: 58, backgroundColor: CARD_BG, borderWidth: 1, borderColor: BLUE, borderRadius: 14, marginBottom: 10, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  activityIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: AppColors.roleIconBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: AppColors.glassBorder },
  activityInfo:     { flex: 1, marginLeft: 10 },
  activityMain:     { color: AppColors.textPrimary, fontSize: 12, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  activitySub:      { color: AppColors.textSecondary, fontSize: 8, marginTop: 2, fontFamily: 'Poppins_400Regular' },
});
