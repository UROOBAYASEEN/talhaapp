/**
 * Home Screen — Pixel-perfect Figma match
 * File: HZwQxuVoCIhM2m1s9GfV3B  •  Nodes: 1986:11101 → 1986:11792
 */
import AskariBank from '@/components/shared/AskariBank';
import BrowseMoreServices from '@/components/shared/BrowseMoreServices';
import Chatbot from '@/components/shared/Chatbot';
import DiscoverMore from '@/components/shared/DiscoverMore';
import FeaturedVehicleCard from '@/components/shared/FeaturedVehicleCard';
import LatestVideoSection from '@/components/shared/LatestVideoSection';
import VehicleSearch from '@/components/shared/VehicleSearch';
import YouMayNeedThis from '@/components/shared/YouMayNeedThis';
import { API_BASE } from '@/constants/api';
import { useAppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appearance, Switch, useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: W } = Dimensions.get('window');

// ─── Figma exact colors (static — used in StyleSheet) ─────────────────────
const C = {
  bg: '#010a1f',
  glass: 'rgba(6,27,74,0.6)',
  glassDark: '#061b4a',
  navy: '#032a69',
  textPrimary: '#f9fafc',
  textSec: '#baacb6',
  textDim: '#d2d2d2',
  orange: '#e2671b',
  divider: 'rgba(255,255,255,0.13)',
  red: '#ff383c',
  blue: '#0088ff',
};

// ─── Figma exact data ──────────────────────────────────────────────────────

// node 1986:11101  — inline mini-stats under search
const MINI_STATS = [
  { value: '1,200+', label: 'Vehicles' },
  { value: '5,000+', label: 'Dealership' },
  { value: '45+', label: 'Banks' },
  { value: '20+', label: 'Insurance' },
  { value: '20+', label: 'Tracker' },
];

// node 1986:11189  — horizontal 4-card stats scroll
const SCROLL_STATS = [
  { icon: 'bicycle', target: 5000, suffix: '+', label: 'Bikes Available', verified: false },
  { icon: 'handshake-outline', target: 1800, suffix: '+', label: 'Verified Dealers', verified: true },
  { icon: 'car', target: 10000, suffix: '+', label: 'Cars Available', verified: false },
  { icon: 'shield-checkmark', target: 11800, suffix: '+', label: 'Trusted Partners', verified: true },
];

// node 1986:11312  — All Services (8 items, 4 per row)
const ALL_SERVICES = [
  { icon: 'car-outline', label: 'Buy New\nCar', route: '/(tabs)/explore', p: { condition: 'new' } },
  { icon: 'car-outline', label: 'Buy Used\nCar', route: '/buy/used-car', p: {} },
  { icon: 'bicycle-outline', image: require('@/screenshot/bikelogo.png'), label: 'Buy New\nBike', route: '/buy/new-bike', p: null },
  { icon: 'bicycle', image: require('@/screenshot/bikelogo.png'), label: 'Buy Used\nBike', route: '/buy/used-bike', p: null },
  { icon: 'git-compare-outline', image: require('@/screenshot/compare.png'), label: 'Compare\nVehicle', route: '/compare-vehicle', p: {} },
  { icon: 'cash-outline', image: require('@/screenshot/finance.png'), imageSize: 24, imageMarginTop: 6, label: 'Auto\nFinancing', route: '/auto-financing', p: {} },
  { icon: 'shield-checkmark-outline', label: 'Insurance', route: '/insurance-search', p: {} },
  { icon: 'locate-outline', image: require('@/screenshot/location.png'), label: 'Tracker', route: '/tracker-search', p: {} },
];

// node 1986:11634  — Explore More (2×2 grid)
const EXPLORE_MORE = [
  { title: 'Compare\nVehicle', desc: 'Compare specs and prices across vehicles easily', route: '/(tabs)/explore' },
  { title: 'Smart Finance\nCalculator', desc: 'Calculate your monthly installments instantly', route: '/(tabs)/explore' },
  { title: 'Book your\nvehicle', desc: 'Reserve your preferred vehicle online by selecting your date', route: '/(tabs)/explore' },
  { title: 'Compare\nInsurance', desc: 'Get the best insurance deal for your vehicle', route: '/(tabs)/sellers' },
];

// node 1986:11674  — Browse more services (3 list items)
const MORE_SERVICES = [
  { icon: 'business-outline', title: 'Find Dealers Near Me', sub: 'Locate verified dealerships in your city' },
  { icon: 'shield-outline', title: 'Compare Insurance Plans', sub: 'Get quotes from top insurance providers' },
  { icon: 'locate-outline', title: 'Track My Vehicle', sub: 'Real-time GPS tracking for your vehicle' },
];

// node 1986:11792  — Recent Activity
const RECENT_ACTIVITY = [
  { icon: 'business-outline', title: 'Financing Application Submitted', sub: 'Toyota Corolla • 2 hrs ago' },
  { icon: 'calendar-outline', title: 'Insurance Renewal Due', sub: 'Toyota Corolla • 2 hrs ago' },
  { icon: 'calendar-outline', title: 'Tracker Installation Pending', sub: 'Toyota Corolla • 1 day ago' },
];

// Visual cards used only when the bike API has fewer entries than Featured Cars.
const FEATURED_BIKE_PREVIEWS = [
  { title: 'Honda CG 125', price: 238900, variant: 'Self Start', city: 'Karachi', year: 2024, transmission: 'Manual' },
  { title: 'Yamaha YBR 125', price: 466000, variant: '125G', city: 'Lahore', year: 2024, transmission: 'Manual' },
  { title: 'Suzuki GS 150', price: 382000, variant: '150cc', city: 'Islamabad', year: 2025, transmission: 'Manual' },
  { title: 'Honda CD 70', price: 157900, variant: '70cc', city: 'Karachi', year: 2025, transmission: 'Manual' },
  { title: 'Suzuki GR 150', price: 547000, variant: '150cc', city: 'Lahore', year: 2024, transmission: 'Manual' },
  { title: 'Yamaha YB 125Z', price: 424000, variant: '125cc', city: 'Rawalpindi', year: 2025, transmission: 'Manual' },
];

// ─── Marquee auto-scroll stats ticker ─────────────────────────────────────
const CARD_W = 178;   // must match scrollStatCard width
const CARD_GAP = 0;
const TOTAL_W = (CARD_W + CARD_GAP) * SCROLL_STATS.length;

function MarqueeStats() {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Infinite loop: slide from 0 → -TOTAL_W, then jump back to 0
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -TOTAL_W,
          duration: SCROLL_STATS.length * 2200,   // speed per card ~2.2s
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  // Duplicate cards so the loop looks seamless
  const doubled = [...SCROLL_STATS, ...SCROLL_STATS];

  return (
    <View style={{ marginTop: 16, overflow: 'hidden' }}>
      <Animated.View
        style={{ flexDirection: 'row', transform: [{ translateX }] }}
      >
        {doubled.map((item, index) => (
          <AnimatedStatCard
            key={`${item.label}-${index}`}
            item={item}
            index={index % SCROLL_STATS.length}
            noSlide   // already in marquee, skip slide-in
          />
        ))}
      </Animated.View>
    </View>
  );
}

// ─── Animated stat card (count-up + optional slide-in) ────────────────────
function AnimatedStatCard({
  item, index, noSlide = false,
}: {
  item: { icon: string; target: number; suffix: string; label: string; verified: boolean };
  index: number;
  noSlide?: boolean;
}) {
  const aC = useAppColors();
  const [count, setCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(noSlide ? 0 : 60)).current;
  const fadeAnim = useRef(new Animated.Value(noSlide ? 1 : 0)).current;

  useEffect(() => {
    if (!noSlide) {
      // Slide + fade in with stagger delay
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          delay: index * 120,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          delay: index * 120,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Count-up animation
    const duration = 1400;
    const steps = 60;
    const interval = duration / steps;
    let current = 0;
    const step = item.target / steps;
    const timer = setInterval(() => {
      current += step;
      if (current >= item.target) {
        setCount(item.target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, interval);
    return () => clearInterval(timer);
  }, []);

  function fmt(n: number) {
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
    return String(n);
  }

  return (
    <Animated.View
      style={[
        styles.scrollStatCard,
        {
          backgroundColor: aC.isDark ? '#032a69' : '#dde8ff',
          borderColor: aC.isDark ? 'rgba(226,103,27,0.3)' : 'rgba(3,42,105,0.2)',
          transform: [{ translateX: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.scrollStatInner}>
        <View style={styles.scrollStatIconDiv}>
          <Ionicons name={item.icon as any} size={20} color="#fff" />
        </View>
        <View style={styles.scrollStatTextDiv}>
          <View style={[styles.scrollStatValBox, { backgroundColor: aC.isDark ? 'rgba(249,250,252,0.07)' : 'rgba(3,12,40,0.07)' }]}>
            <Text style={[styles.scrollStatVal, { color: aC.textPrimary }]}>
              {fmt(count)}{item.suffix}
            </Text>
            {item.verified && (
              <Ionicons name="checkmark-circle" size={10} color="#0088ff" />
            )}
          </View>
          <View style={[styles.scrollStatLabelBox, { backgroundColor: aC.isDark ? 'rgba(186,172,182,0.08)' : 'rgba(3,12,40,0.06)' }]}>
            <Text style={[styles.scrollStatLabel, { color: aC.textSecondary }]}>{item.label}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Vehicle card (Featured Cars / Bikes style, 240×285) ──────────────────
function VehicleCard({ item, onPress }: { item: any; onPress: () => void }) {
  const aC = useAppColors();
  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress}
      style={[vcStyles.vc, { backgroundColor: aC.glassBg, borderColor: aC.divider }]}>
      {item.images?.[0] ? (
        <Image source={{ uri: item.images[0] }} style={vcStyles.vcImg} resizeMode="cover" />
      ) : (
        <View style={[vcStyles.vcImg, vcStyles.vcImgEmpty, { backgroundColor: aC.roleIconBg }]}>
          <Ionicons name="car-outline" size={36} color={aC.textSecondary} />
        </View>
      )}
      <View style={vcStyles.vcBody}>
        <Text style={[vcStyles.vcYear, { color: aC.textSecondary }]}>{item.year} • {item.color || item.fuel_type}</Text>
        <Text style={[vcStyles.vcTitle, { color: aC.textPrimary }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[vcStyles.vcCity, { color: aC.textSecondary }]}>{item.city || 'Pakistan'}</Text>
        <View style={vcStyles.vcBottom}>
          <TouchableOpacity style={vcStyles.vcBtn}>
            <LinearGradient colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={vcStyles.vcBtnGrad}>
              <Text style={vcStyles.vcBtnTxt}>PKR {Number(item.price).toLocaleString()}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[vcStyles.vcChat, { backgroundColor: '#032a69' }]}>
            <Ionicons name="chatbubble-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
const vcStyles = StyleSheet.create({
  vc: { width: 240, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  vcImg: { width: 240, height: 158 },
  vcImgEmpty: { alignItems: 'center', justifyContent: 'center' },
  vcBody: { padding: 12, gap: 4 },
  vcYear: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  vcTitle: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  vcCity: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  vcBottom: { flexDirection: 'row', gap: 8, marginTop: 4 },
  vcBtn: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  vcBtnGrad: { height: 32, alignItems: 'center', justifyContent: 'center' },
  vcBtnTxt: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  vcChat: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

// ─── Section header helper (exact Figma style) ────────────────────────────
function SH({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  const aC = useAppColors();
  return (
    <View style={shStyles.sh}>
      <Text style={[shStyles.shTitle, { color: aC.textPrimary }]}>{title}</Text>
      {onViewAll && (
        <TouchableOpacity style={shStyles.shRight} onPress={onViewAll}>
          <Text style={shStyles.shViewAll}>View all</Text>
          <Ionicons name="chevron-forward" size={12} color="#e2671b" />
        </TouchableOpacity>
      )}
    </View>
  );
}
const shStyles = StyleSheet.create({
  sh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  shTitle: { fontSize: 16, fontFamily: 'Poppins_500Medium', textTransform: 'capitalize' },
  shRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  shViewAll: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#e2671b' },
});

// ─── DropField helper (Find Your Perfect Vehicle 3×3 grid) ──────────────────
function DropField({
  label,
  value,
  showChevron = true,
}: {
  label: string;
  value: string;
  showChevron?: boolean;
}) {
  return (
    <View style={styles.findDropItem}>
      <Text style={styles.findDropLabel}>{label}</Text>
      <View style={styles.findDropField}>
        <Text style={styles.findDropValue} numberOfLines={1}>{value}</Text>
        {showChevron && <Ionicons name="chevron-down" size={9} color="#f9fafc" />}
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
// ── Settings menu (Figma) — opens from the header settings icon ──────────────
function SettingsMenu({ visible, onClose, anchor }: { visible: boolean; onClose: () => void; anchor: { x: number; y: number; w: number; h: number } | null }) {
  const router = useRouter();
  const aC = useAppColors();
  const scheme = useColorScheme();
  const lightOn = scheme === 'light';
  const [sellerOn, setSellerOn] = useState(false);
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
          <TouchableOpacity style={sm.row} activeOpacity={0.8} onPress={() => { onClose(); router.push('/(tabs)/profile' as any); }}>
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
                // ON → Become_a_Seller panel (API logic will come later)
                if (v) { onClose(); router.replace('/Become_a_Seller' as any); }
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

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth() as any;
  const aC = useAppColors();

  const [featured, setFeatured] = useState<any[]>([]);
  const [bikes, setBikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [recentReal, setRecentReal] = useState<any[] | null>(null);

  // ── Find Your Perfect Vehicle interactive state ──
  const [payOption, setPayOption] = useState<'Cash' | 'Finance'>('Cash');
  const [vType, setVType] = useState<'Cars' | 'Bikes'>('Cars');
  const [vCond, setVCond] = useState<'New' | 'Used'>('New');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const settingsBtnRef = useRef<View>(null);
  const screenRef = useRef<View>(null);

  const rawFirstName = user?.full_name?.trim().split(/\s+/)[0] || 'there';
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1);
  const BASE_URL = API_BASE.replace('/api/v1', '');
  const resolvedAvatar = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${BASE_URL}${user.avatar_url}`)
    : null;

  async function load() {
    try {
      const [a, b] = await Promise.all([
        fetch(`${API_BASE}/vehicles?category=car&limit=6`),
        fetch(`${API_BASE}/vehicles?category=bike&limit=6`),
      ]);
      const sortAds = (items: any[]) => [...items].sort((x, y) => {
        const priceDiff = Number(y.price || 0) - Number(x.price || 0);
        if (priceDiff !== 0) return priceDiff;
        const dx = new Date(y.created_at || y.createdAt || 0).getTime();
        const dy = new Date(x.created_at || x.createdAt || 0).getTime();
        return dx - dy;
      });
      if (a.ok) { const d = await a.json(); setFeatured(sortAds(d.items || d || [])); }
      if (b.ok) { const d = await b.json(); setBikes(sortAds(d.items || d || [])); }
    } catch { /* offline */ }
    finally { setLoading(false); setRefresh(false); }
  }
  useEffect(() => { load(); }, []);

  // Real recent activity — from notifications (if any) otherwise fallback to static
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/notifications/?limit=5`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const d = await res.json();
          const items = d.items || d || [];
          if (items.length) {
            const mapped = items.slice(0, 5).map((n: any) => ({
              icon: n.type === 'payment' ? 'business-outline' : n.type === 'message' ? 'chatbubble-outline' : 'shield-outline',
              title: n.title || 'Notification',
              sub: (n.body || n.message || '').slice(0, 50) || '—',
            }));
            setRecentReal(mapped);
          }
        }
      } catch { }
    })();
  }, [token]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg }]}>
      <View ref={screenRef} style={{ flex: 1 }} collapsable={false}>
      <ScrollView
        onScrollBeginDrag={() => settingsOpen && setSettingsOpen(false)}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} tintColor="#e2671b" />}
      >

        {/* ════════════════════════════════════════════════════
            1 · HEADER + HERO (upper section) — bg #061B4A
        ════════════════════════════════════════════════════ */}
        <View style={[styles.upperBg, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}> 
          {aC.isDark && <View pointerEvents="none" style={styles.upperBgShape} />}
          <View style={[styles.header, { backgroundColor: aC.isDark ? '#071c49' : '#ffffff' }]}>

            {/* ── Top row: back-arrow · company name · icons ── */}
            <View style={styles.logoRow}>

              {/* LEFT: arrow-left 24×24 */}
              <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
                <Ionicons name="arrow-back-outline" size={24} color={aC.isDark ? '#c5bdc9' : aC.textPrimary} />
              </TouchableOpacity>

              {/* CENTER: Autowizor logo — Figma node 259:2027 exact image */}
              <View style={styles.companyNameWrap}>
                {aC.isDark ? (
                  <Image
                    source={require('@/assets/images/autowizor-logo-text.png')}
                    style={styles.companyNameImg}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.companyNameTextLight}>
                    <Text style={{ color: '#032a69' }}>Auto</Text>
                    <Text style={{ color: '#e2671b' }}>wizor</Text>
                  </Text>
                )}
              </View>

              {/* RIGHT: notification + settings — fixed width row */}
              <View style={styles.topIcons}>
                <TouchableOpacity
                  style={styles.headerIconBtn}
                  onPress={() => router.push('/alert' as any)}
                >
                  <Ionicons name="notifications-outline" size={21} color={aC.isDark ? '#e2deea' : aC.textPrimary} />
                  <View style={[styles.notifDot, { borderColor: aC.bg }]} />
                </TouchableOpacity>

                <TouchableOpacity
                  ref={settingsBtnRef as any}
                  style={styles.headerIconBtn}
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
                  <Ionicons name="settings-outline" size={21} color={aC.isDark ? '#e2deea' : aC.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── [FRAME] Frame 1686558744  343×51 — greeting block ── */}
            <View style={styles.greetBlock}>
              <View style={styles.greetRow}>
                <TouchableOpacity
                  onPress={() => router.push('/profile/edit' as any)}
                  style={styles.greetAvatarPlaceholder}
                >
                  {resolvedAvatar ? (
                    <Image
                      source={{ uri: resolvedAvatar }}
                      style={styles.greetAvatar}
                      resizeMode="cover"
                    />
                  ) : (
                    <Image source={require('@/assets/images/profileDummyImage.png')} style={styles.greetAvatar} resizeMode="cover" />
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.greetName, { color: aC.textPrimary }]}>Hello, {firstName}👋</Text>
                  <Text style={[styles.greetSub, { color: aC.textSecondary }]}>How can we help today?</Text>
                </View>
              </View>
            </View>

            {/* ── [FRAME] Frame 1686559043 — search bar 350×48 / radius=32 ── */}
            <TouchableOpacity
              style={[styles.searchBar, { backgroundColor: aC.isDark ? '#142c59' : aC.glassBg, borderColor: aC.isDark ? '#87a3cc' : 'rgba(3,42,105,0.2)' }]}
              onPress={() => router.push('/(tabs)/explore')}
              activeOpacity={0.85}
            >
              {aC.isDark && <LinearGradient colors={['#20467f', '#182e59', '#122650', '#1a366a']} locations={[0, 0.32, 0.72, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
              <Ionicons name="search-outline" size={20} color={aC.isDark ? '#d2d2d2' : aC.textSecondary} />
              <Text style={[styles.searchPh, { color: aC.textSecondary }]}>Search cars, banks & dealers...</Text>
            </TouchableOpacity>

          </View>

          {/* ════════════════════════════════════════════════════
            2 · HERO BANNER  (node 1986:11122 — Glass Button 350×229)
            Figma: bg=rgba(6,27,74,0.6), border=rgba(255,255,255,0.15)
        ════════════════════════════════════════════════════ */}
          <View style={styles.pad}>
            <LinearGradient
              colors={aC.isDark ? ['#E2671B', '#032A69'] : ['rgba(3,42,105,0.12)', 'rgba(3,42,105,0.12)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.heroBorder}
            >
            <View style={[styles.heroBanner, { backgroundColor: aC.isDark ? '#061538' : '#ffffff', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 10, elevation: aC.isDark ? 0 : 2 }]}> 
              {/* Light mood: pure white, no shade — Dark: orange + 4-side shade */}
              {aC.isDark ? (
                <>
                  <LinearGradient colors={['#061538', '#061538', '#24243a', '#52343b']} locations={[0, 0.58, 0.78, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              ) : null}

              {/* Figma node 1986:11227 — hero car image */}
              <Image
                source={require('@/screenshot/realllogo.png')}
                style={styles.heroCarImg}
                resizeMode="contain"
              />

              {/* Existing title and statistics, positioned to match the Figma banner */}
              <View style={styles.heroLeft}>
                {/* Title — #ffffff, 18px, 600 */}
                <Text style={[styles.heroTitle, { color: aC.isDark ? '#ffffff' : '#032a69' }]}>
                  Pakistan's First{'\n'}Connected{' '}
                  <Text style={{ color: '#e2671b' }}>Auto{'\n'}Ecosystem</Text>
                </Text>
                {/* Stats at the bottom — values #e2671b, labels #d2d2d2 (light: black) */}
                <View style={styles.heroBannerStats}>
                  {MINI_STATS.map((s, i) => (
                    <React.Fragment key={s.label}>
                      <View>
                        <Text style={styles.heroBannerVal}>{s.value}</Text>
                        <Text style={[styles.heroBannerLabel, { color: aC.isDark ? '#d2d2d2' : '#000000' }]}>{s.label}</Text>
                      </View>
                      {i < MINI_STATS.length - 1 && (
                        <View style={styles.heroStatDiv} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            </View>
            </LinearGradient>
            <View style={styles.heroDots} pointerEvents="none">
              <View style={[styles.heroDot, { backgroundColor: aC.isDark ? '#ffffff' : '#032a69' }]} />
              <View style={[styles.heroDot, { backgroundColor: aC.isDark ? '#baacb6' : 'rgba(3,42,105,0.35)' }]} />
              <View style={[styles.heroDot, { backgroundColor: aC.isDark ? '#baacb6' : 'rgba(3,42,105,0.35)' }]} />
            </View>
          </View>
        </View>

        {/* ════════════════════════════════════════════════════
            4 · ALL SERVICES  (node 1986:11312)  ← FIRST
            "All services" title + 2 rows × 4 items = 8
        ════════════════════════════════════════════ */}
        <View style={[styles.sec, styles.pad, styles.servicesSection]}>
          <SH title="All services" />
          <View style={styles.servGrid}>
            {ALL_SERVICES.map(s => (
              <TouchableOpacity
                key={s.label}
                style={[styles.servCard, { backgroundColor: aC.isDark ? '#010a1f' : aC.glassBg, borderColor: aC.isDark ? '#8ba7d2' : 'rgba(100,160,255,0.6)' }]}
                onPress={() => {
                  if (s.p && Object.keys(s.p).length > 0) {
                    router.push({ pathname: s.route as any, params: s.p });
                  } else {
                    router.push(s.route as any);
                  }
                }}
                activeOpacity={0.82}
              >
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['#16408880', '#0D255480', '#010a1f', '#010a1f', '#0D255480', '#16408880']} locations={[0, 0.09, 0.23, 0.77, 0.91, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['rgba(22,64,136,0.30)', 'rgba(13,37,84,0.10)', 'transparent', 'transparent', 'rgba(13,37,84,0.10)', 'rgba(22,64,136,0.30)']} locations={[0, 0.08, 0.22, 0.78, 0.92, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.05)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.55 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                {(s as any).image ? (
                  <Image source={(s as any).image} style={{ width: (s as any).imageSize || 26, height: (s as any).imageSize || 26, marginTop: (s as any).imageMarginTop || 0 }} resizeMode="contain" />
                ) : (
                  <Ionicons name={s.icon as any} size={22} color="#e2671b" />
                )}
                <Text style={[styles.servLabel, { color: aC.textSecondary }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Pagination dots */}
          <View style={styles.servDots}>
            <View style={[styles.servDot, { backgroundColor: aC.isDark ? '#fff' : '#032a69' }]} />
            <View style={[styles.servDot, { backgroundColor: aC.isDark ? C.textSec : 'rgba(3,42,105,0.22)' }]} />
          </View>
        </View>

        {/* ════════════════════════════════════════════════════
            5 · FINANCE BANNER
        ════════════════════════════════════════════════════ */}
        <View style={[styles.sec, styles.pad]}>
          <AskariBank />
        </View>

        {/* ════════════════════════════════════════════════════
            6 · VEHICLE SEARCH
        ════════════════════════════════════════════════════ */}
        <View style={[styles.sec, styles.pad]}>
          <LinearGradient
            colors={aC.isDark ? ['#E2671B', '#032A69'] : ['#b7c7df', '#b7c7df']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.vehicleSearchWrapper}
          >
            <View style={[styles.vehicleSearchSurface, { backgroundColor: aC.isDark ? '#061538' : '#dde8ff' }]}>
              {aC.isDark && <LinearGradient colors={['#061538', '#071a42', '#292b45', '#72433e']} locations={[0, 0.55, 0.76, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
              <VehicleSearch />
            </View>
          </LinearGradient>
        </View>

        {/* ════════════════════════════════════════════════════
            6 · LATEST VIDEO — commented out temporarily
        ════════════════════════════════════════════════════ */}
        {/* <View style={[styles.sec, styles.pad]}>
          <SH title="Latest Video" onViewAll={() => {}} />
          ...
        </View> */}


        {/* ════════════════════════════════════════════════════
            8 · FEATURED CARS
        ════════════════════════════════════════════════════ */}
        <View style={[styles.sec, styles.pad]}>
          <SH title="Featured Cars" onViewAll={() => router.push({ pathname: '/buy/search-results', params: { category: 'car', title: 'Featured Cars' } } as any)} />
          {loading ? (
            <ActivityIndicator color="#e2671b" style={{ paddingVertical: 28 }} />
          ) : featured.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: aC.glassBg, borderColor: aC.divider }]}>
              <Ionicons name="car-outline" size={40} color={aC.textSecondary} />
              <Text style={[styles.emptyTxt, { color: aC.textSecondary }]}>No vehicles listed yet</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={featured}
              keyExtractor={i => i.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16 }}
              renderItem={({ item, index }) => (
                <FeaturedVehicleCard
                  item={item}
                  fallbackIndex={index}
                  onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: item.id } })}
                />
              )}
            />
          )}
        </View>

        {/* ════════════════════════════════════════════════════
            9 · FEATURED BIKES
        ════════════════════════════════════════════════════ */}
        <View style={[styles.sec, styles.pad]}>
          <SH title="Featured Bikes" onViewAll={() => router.push({ pathname: '/buy/search-results', params: { category: 'bike', title: 'Featured Bikes' } } as any)} />
          {bikes.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: aC.glassBg, borderColor: aC.divider }]}>
              <Ionicons name="bicycle-outline" size={40} color={aC.textSecondary} />
              <Text style={[styles.emptyTxt, { color: aC.textSecondary }]}>No bikes listed yet</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={Array.from({ length: featured.length || 6 }, (_, index) => bikes[index] ?? { ...FEATURED_BIKE_PREVIEWS[index % FEATURED_BIKE_PREVIEWS.length], id: `featured-bike-placeholder-${index}`, isPlaceholder: true })}
              keyExtractor={i => String(i.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16 }}
              renderItem={({ item, index }) => (
                <FeaturedVehicleCard
                  item={item}
                  category="bike"
                  fallbackIndex={index}
                  onPress={() => item.isPlaceholder ? router.push({ pathname: '/(tabs)/explore', params: { category: 'bike' } } as any) : router.push({ pathname: '/vehicle/[id]', params: { id: item.id } })}
                />
              )}
            />
          )}
        </View>


        {/* ════════════════════════════════════════════════════
            10 · DISCOVER MORE
        ════════════════════════════════════════════════════ */}
        <View style={styles.sec}>
          <DiscoverMore />
        </View>

        {/* ════════════════════════════════════════════════════
            11 · YOU MAY NEED THIS
        ════════════════════════════════════════════════════ */}
        <View style={[styles.sec, styles.pad]}>
          <YouMayNeedThis />
        </View>


        {/* ════════════════════════════════════════════════════
            12 · LATEST VIDEO — commented out temporarily
        ════════════════════════════════════════════════════ */}
        {/* <View style={[styles.sec, styles.pad]}>
          <SH title="Latest Video" onViewAll={() => {}} />
          ...
        </View> */}

        {/* ════════════════════════════════════════════════════
            14 · BROWSE MORE SERVICES
        ════════════════════════════════════════════════════ */}
        <View style={[styles.sec, styles.pad]}>
          <BrowseMoreServices />
        </View>

        {/* ════════════════════════════════════════════════════
            15 · LATEST VIDEO
        ════════════════════════════════════════════════════ */}
        <View style={[styles.sec, styles.pad]}>
          <LatestVideoSection count={2} />
        </View>

        {/* ════════════════════════════════════════════════════
            13 · RECENT ACTIVITY  (node 1986:11792) — real if available
        ════════════════════════════════════════════════════ */}
        <View style={[styles.sec, styles.pad]}>
          <SH title="Recent Activity" />
          <View style={{ gap: 10 }}>
            {(recentReal && recentReal.length ? recentReal : RECENT_ACTIVITY).map((a: any, index: number) => (
              <TouchableOpacity key={a.title + a.sub} style={[styles.actItem, { backgroundColor: aC.isDark ? '#010b1e' : aC.glassBg, borderColor: aC.isDark ? '#829fd0' : aC.glassBorder }]} activeOpacity={0.84}>
                {aC.isDark && <LinearGradient colors={['#173668', '#010b1e', '#071a3a']} locations={[0, 0.24, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                {aC.isDark && <LinearGradient colors={['rgba(35,81,157,0.13)', 'transparent', 'transparent', 'rgba(35,81,157,0.13)']} locations={[0, 0.09, 0.91, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                <View style={[styles.actIcon, { backgroundColor: aC.isDark ? '#061b4a' : '#e8eeff', borderColor: aC.isDark ? 'transparent' : aC.divider }]}>
                  {index === 0 && a.title === 'Financing Application Submitted' ? (
                    <Image source={require('@/assets/images/hugeicons_bank.png')} style={styles.activityBankIcon} resizeMode="contain" />
                  ) : (
                    <Ionicons name={a.icon as any} size={24} color="#e2671b" />
                  )}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.actTitle, { color: aC.textPrimary }]}>{a.title}</Text>
                  <Text style={[styles.actSub, { color: aC.textSecondary }]}>{a.sub}</Text>
                </View>
                <View style={styles.actArrow}>
                  <Ionicons name="chevron-forward" size={24} color="#e2671b" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
      {/* Chatbot FAB — corner company logo (icon) */}
      <Chatbot />
      <SettingsMenu visible={settingsOpen} anchor={settingsAnchor} onClose={() => setSettingsOpen(false)} />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles (exact Figma values) ──────────────────────────────────────────
const SERV_W = (W - 24 - 36) / 4;   // 4 per row, 12px section padding and gaps
const EXPL_W = (W - 32 - 10) / 2;   // 2 per row

// Find Your Perfect Vehicle — exact widths to prevent overflow
// Card inner width = screen - pad(16×2) - cardPadH(12×2) = W - 56
const FIND_INNER = W - 56;
const FIND_BTN = (FIND_INNER - 9) / 2;   // 2 buttons, gap-9
const FIND_DROP = (FIND_INNER - 16) / 3;   // 3 columns, 2×gap-8

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'rgba(1,10,31,1)' },
  pad: { paddingHorizontal: 16 },
  sec: { marginTop: 20 },
  servicesSection: { paddingHorizontal: 12, marginTop: 6 },

  /* ── Header ── */
  header: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 14,
  },

  upperBg: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
  },
  upperBgShape: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 20,
    backgroundColor: '#071c49',
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
  },

  /* Top row — position:relative so company name can center absolutely */
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    position: 'relative',
    marginHorizontal: 5,
  },

  /* [INSTANCE] arrow-left 24×24 */
  backArrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  /* [RECTANGLE] Autowizor Logo Files 3 — centered via absolute */
  companyNameWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyNameImg: {
    width: 122,
    height: 26,
  },
  companyNameTextLight: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  /* [FRAME] Frame 1686559183 — notification + settings */
  topIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  topIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconBtn: {
    width: 32,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Notification red dot */
  notifDot: {
    position: 'absolute',
    top: 5, right: 5,
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: '#e1131f',
    borderWidth: 1, borderColor: '#010a1f',
  },

  /* [FRAME] Frame 1686558744  343×51 */
  greetBlock: { gap: 2, marginHorizontal: 5, marginTop: 6, marginBottom: -6 },
  greetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetAvatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  greetAvatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#e2671b',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  greetAvatarText: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#ffffff' },
  /* "Hello, Talha👋"  20px/w500/#f9fafc */
  greetName: {
    fontSize: 20,
    fontFamily: 'Poppins_500Medium',
    color: '#f9fafc',
  },
  /* "How can we help today?"  14px/w500/#baacb6 */
  greetSub: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: '#baacb6',
    marginTop: -4,
  },

  /* [FRAME] Frame 1686559043 — Glass Button 350×48 / radius=32 */
  /* Figma: Glass Text Field Button bg=#061b4a, radius=32, blue glow shadow */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    borderRadius: 32,
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)',
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  /* "Search cars, banks & dealers..."  12px/w400/#baacb6 */
  searchPh: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#baacb6',
  },
  miniStatRow: { gap: 0, paddingRight: 4 },
  miniStat: { alignItems: 'center', paddingHorizontal: 10 },
  miniStatVal: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: C.orange },
  miniStatLabel: { fontSize: 8, fontFamily: 'Poppins_500Medium', color: C.textDim },
  miniStatDiv: { width: 1, height: 20, backgroundColor: C.divider, alignSelf: 'center' },

  /* ── Hero Banner — Figma Glass Button exact ── */
  heroBorder: { borderRadius: 18, padding: 1, overflow: 'hidden' },
  heroBanner: {
    backgroundColor: '#010A1F',
    borderRadius: 17,
    padding: 18,
    overflow: 'hidden',
    height: 164,
  },
  heroCarImg: {
    position: 'absolute',
    width: '53%',
    height: 94,
    right: 6,
    top: 12,
    opacity: 1,
  },
  heroC1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    right: -50, top: -60,
    backgroundColor: 'rgba(226,103,27,0.12)',
  },
  heroC2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    right: 40, bottom: -40,
    backgroundColor: 'rgba(3,42,105,0.4)',
  },
  heroLeft: { flex: 1, justifyContent: 'space-between' },
  // Figma: #ffffff, 18px, weight 600
  heroTitle: {
    width: '56%',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    lineHeight: 21,
  },
  // Figma: #baacb6, 12px, weight 400
  heroDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#baacb6',
    lineHeight: 18,
  },
  heroBannerStats: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'nowrap', gap: 0,
  },
  // Figma: #e2671b, 12px, weight 600
  heroBannerVal: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#e2671b',
  },
  // Figma: #d2d2d2, 8px, weight 500
  heroBannerLabel: {
    fontSize: 8,
    fontFamily: 'Poppins_500Medium',
    color: '#d2d2d2',
  },
  heroStatDiv: {
    display: 'none',
  },
  heroDots: { flexDirection: 'row', alignSelf: 'center', gap: 9, marginTop: 7, marginBottom: 6 },
  heroDot: { width: 6, height: 6, borderRadius: 3 },

  /* ── Scroll Stats — Figma exact (node 1986:11189) ── */
  scrollStatsRow: { paddingHorizontal: 0, gap: 0 },

  /* CARD — Figma: 175×56, bg=#032a69, radius=16, orange border halka */
  scrollStatCard: {
    width: 175,
    height: 56,
    backgroundColor: '#032a69',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,103,27,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* INNER FRAME — Figma: 139×42, gap=12 */
  scrollStatInner: {
    width: 139,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  /* ICON DIV — Figma: 32×32, bg=#e2671b, radius=22, pad=6 */
  scrollStatIconDiv: {
    width: 32,
    height: 32,
    borderRadius: 22,
    backgroundColor: '#e2671b',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /* TEXT FRAME — Figma: 95×36 */
  scrollStatTextDiv: {
    width: 95,
    height: 36,
    justifyContent: 'center',
    gap: 0,
  },

  scrollStatValRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },

  /* VALUE BOX — Figma: 95×21, text color=#f9fafc, 14px/500
     alag bg: faint white pill */
  scrollStatValBox: {
    width: 95,
    height: 21,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249,250,252,0.07)',
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  scrollStatVal: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#f9fafc',
  },

  /* LABEL BOX — Figma: 95×15, text color=#baacb6, 10px/500
     alag bg: faint gray pill */
  scrollStatLabelBox: {
    width: 95,
    height: 15,
    justifyContent: 'center',
    backgroundColor: 'rgba(186,172,182,0.08)',
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 0,
  },
  scrollStatLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#baacb6',
  },

  /* ── Video card ── */
  videoCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: C.glass,
    borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    overflow: 'hidden',
  },
  videoThumb: { width: 144, height: 117, position: 'relative' },
  videoThumbGrad: { width: 144, height: 117, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    position: 'absolute', top: '50%', left: '50%',
    width: 32, height: 32, borderRadius: 16, backgroundColor: C.navy,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  durBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  durTxt: { fontSize: 8, fontFamily: 'Poppins_400Regular', color: '#fff' },
  videoInfo: { flex: 1, padding: 10, gap: 3 },
  videoTitle: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: C.textPrimary },
  videoSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSec },
  videoChannel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  videoChannelTxt: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: C.textPrimary },
  videoDivider: { height: 1, backgroundColor: C.divider, marginVertical: 4 },
  videoMeta: { flexDirection: 'row', gap: 10 },
  videoMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  videoMetaTxt: { fontSize: 8, fontFamily: 'Poppins_400Regular', color: C.textSec },
  watchBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  watchBtnTxt: { fontSize: 8, fontFamily: 'Poppins_600SemiBold', color: C.red },

  /* ── Finance Banner (node 1986:11386) ── */
  finBanner: {
    borderRadius: 16, padding: 20, overflow: 'hidden',
    flexDirection: 'row', minHeight: 130,
  },
  finLeft: { flex: 1, gap: 8, justifyContent: 'center' },
  finTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary, lineHeight: 24 },
  finSub: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: C.textPrimary, lineHeight: 15 },
  finBtn: { alignSelf: 'flex-start', borderRadius: 20, overflow: 'hidden' },
  finBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 7 },
  finBtnTxt: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  finArrow: {
    position: 'absolute', top: '50%',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
    transform: [{ translateY: -16 }],
  },

  /* ── All Services (node 1986:11312) ── */
  servGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: -5 },
  /* Figma: Glass Button bg=#061b4a, blue glow shadow, orange border tint — compact size */
  servCard: {
    width: SERV_W, height: 82,
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)',
    alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingHorizontal: 3,
    paddingVertical: 7,
    overflow: 'hidden',
  },
  servLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#baacb6', textAlign: 'center', lineHeight: 17 },
  servDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  servDot: { width: 5, height: 5, borderRadius: 3 },

  /* ── Find Your Perfect Vehicle (node 1986:11402) ── */
  /* Card: Glass Button — white border 1px, rounded-16, px-12 py-16, gap-10 */
  findCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 10,
    overflow: 'hidden',
  },
  /* Block: label + options, gap-3 between label and row */
  findBlock: { gap: 3 },
  /* Label: capitalize 12px Poppins Medium #f9fafc */
  findLabel: {
    fontSize: 12, fontFamily: 'Poppins_500Medium',
    color: '#f9fafc', textTransform: 'capitalize',
  },
  /* Options row — fixed gap, buttons use FIND_BTN exact width */
  findRow2: { flexDirection: 'row', gap: 9 },

  /* Cash/Finance — FIND_BTN exact width prevents overflow */
  findOptBtn: {
    width: FIND_BTN, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  findOptBtnActive: { borderWidth: 1, borderColor: 'rgba(255,255,255,1)' },
  findOptBtnInactive: {},
  findOptTxtActive: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#e2671b' },
  findOptTxtInactive: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#f9fafc' },

  /* Cars/Bikes — FIND_BTN exact width, h-67, icon+label gap-2 */
  findTypeCardBtn: {
    width: FIND_BTN, height: 67, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  findTypeTxtLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#fff' },

  /* New/Used Cars — FIND_BTN exact width, h-58, rounded-14, px-20 */
  findCondBtn: {
    width: FIND_BTN, height: 58, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, gap: 12,
  },
  findCondActive: { borderWidth: 1, borderColor: 'rgba(255,255,255,1)' },
  findCondInactive: {},
  findCondIcon: {
    width: 30, height: 30, borderRadius: 20,
    backgroundColor: '#032a69',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  findCondTxt: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#f9fafc' },

  /* 3×3 Dropdown grid — FIND_DROP exact column width prevents overflow */
  findDropGrid: { gap: 12 },
  findDropRow: { flexDirection: 'row', gap: 8 },
  findDropItem: { width: FIND_DROP, gap: 8 },
  /* Drop label: 10px Poppins Regular #baacb6 */
  findDropLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: '#baacb6' },
  /* Drop field: bg #061b4a rounded-8 p-10, row, justify-between */
  findDropField: {
    backgroundColor: '#061b4a', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  /* Drop value: 10px Poppins Medium #f9fafc */
  findDropValue: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: '#f9fafc', flex: 1 },

  /* Search button: gradient navy→orange, rounded-32, h-48, full width */
  findSearchBtn: {
    height: 48, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  /* Search text: 16px Poppins SemiBold #fff */
  findSearchTxt: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  /* ── Vehicle card (240×285) ── */
  vc: {
    width: 240, borderRadius: 14,
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.divider,
    overflow: 'hidden',
  },
  vcImg: { width: 240, height: 158 },
  vcImgEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#082052' },
  vcBody: { padding: 12, gap: 4 },
  vcMeta: { flexDirection: 'row', alignItems: 'center' },
  vcYear: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSec },
  vcTitle: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: C.textPrimary },
  vcCity: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: C.textSec },
  vcBottom: { flexDirection: 'row', gap: 8, marginTop: 4 },
  vcBtn: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  vcBtnGrad: { height: 32, alignItems: 'center', justifyContent: 'center' },
  vcBtnTxt: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  vcChat: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  /* ── Explore More (node 1986:11634) ── */
  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  exploreCard: {
    width: EXPL_W, borderRadius: 14,
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.divider,
    overflow: 'hidden', padding: 12, gap: 8,
  },
  exploreImg: { height: 80, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  exploreTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  exploreTitle: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: C.textPrimary, flex: 1 },
  exploreDesc: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.textDim, lineHeight: 15 },

  /* ── Browse More Services (node 1986:11674) ── */
  moreServList: { gap: 10 },
  moreServItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.glassDark, borderRadius: 12,
    borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  moreServIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: C.glassDark,
    borderWidth: 1, borderColor: C.divider,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  moreServText: { flex: 1, gap: 2 },
  moreServTitle: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: C.textPrimary },
  moreServSub: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.textSec },

  /* ── Recent Activity (node 1986:11792) ── */
  actItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(3,12,40,0.6)', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    paddingHorizontal: 16, paddingVertical: 13,
    overflow: 'hidden',
  },
  actIcon: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: C.glassDark,
    borderWidth: 0, borderColor: C.divider,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  activityBankIcon: { width: 24, height: 24 },
  actTitle: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: C.textPrimary },
  actSub: { fontSize: 9, fontFamily: 'Poppins_400Regular', color: C.textSec },
  actArrow: {
    width: 24, alignItems: 'center', justifyContent: 'center',
  },

  vehicleSearchWrapper: {
    borderRadius: 16,
    padding: 1,
    overflow: 'hidden',
  },
  vehicleSearchSurface: { borderRadius: 15, overflow: 'hidden' },

  /* ── Empty ── */
  emptyBox: {
    borderRadius: 14, borderWidth: 1, borderColor: C.divider,
    backgroundColor: C.glass, alignItems: 'center',
    paddingVertical: 28, gap: 8,
  },
  emptyTxt: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: C.textSec },

  // Section header
  sh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  shTitle: { fontSize: 16, fontFamily: 'Poppins_500Medium', color: C.textPrimary },
  shRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  shViewAll: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: C.orange },
});
