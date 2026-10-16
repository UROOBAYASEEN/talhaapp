/**
 * Home Screen — Pixel-perfect Figma match
 * File: HZwQxuVoCIhM2m1s9GfV3B  •  Nodes: 1986:11101 → 1986:11792
 */
import LightGradientBorder from '@/components/shared/LightGradientBorder';
import VerifiedIcon from '@/components/shared/VerifiedIcon';
import AskariBank from '@/components/shared/AskariBank';
import BrowseMoreServices from '@/components/shared/BrowseMoreServices';
import Chatbot from '@/components/shared/Chatbot';
import DiscoverMore from '@/components/shared/DiscoverMore';
import FeaturedVehicleCard from '@/components/shared/FeaturedVehicleCard';
import LatestVideoSection from '@/components/shared/LatestVideoSection';
import VehicleSearch from '@/components/shared/VehicleSearch';
import YouMayNeedThis from '@/components/shared/YouMayNeedThis';
import { API_BASE } from '@/constants/api';
import { logApi, logApiError } from '@/constants/apiLog';
import { useAppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appearance, Switch, useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// NOTE: screen width `useWindowDimensions()` se (component ke andar) li jati hai
// taake har phone size + rotation pe widths dobara calculate hon.
// Module-level `Dimensions.get` frozen rehta hai — is liye use nahi kiya.

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
  { icon: 'git-compare-outline', image: require('@/screenshot/compare.png'), label: 'Compare\nVehicle', route: '/compare-vehicle', p: { from: 'compareSection' } },
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

// ─── Recent Activity (real data only) ─────────────────────────────────────
type Activity = { id: string; icon: string; title: string; sub: string; at: number; route: string };

function timeAgo(iso?: string): string {
  const t = iso ? new Date(iso).getTime() : NaN;
  if (!isFinite(t)) return '';
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusLabel(st?: string): string {
  const v = String(st || '').replace(/_/g, ' ').trim();
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : '';
}

const joinParts = (...parts: (string | undefined | null | false)[]) =>
  parts.map(p => (typeof p === 'string' ? p.trim() : '')).filter(Boolean).join(' • ');

// User ki apni activity — financing, insurance, tracker orders aur posted ads (newest first)
async function fetchRecentActivity(token: string): Promise<Activity[]> {
  const headers = { Authorization: `Bearer ${token}` };
  const get = async (path: string) => {
    const url = `${API_BASE}${path}`;
    const t0 = Date.now();
    try {
      const r = await fetch(url, { headers });
      const body = await r.json().catch(() => undefined);
      logApi('Home › Recent Activity', 'GET', url, r, body, t0);
      if (!r.ok) throw new Error(`${path} ${r.status}`);
      return body;
    } catch (e) {
      logApiError('Home › Recent Activity', 'GET', url, e, t0);
      throw e;
    }
  };
  const [fin, insApps, claims, trackers, ads] = await Promise.allSettled([
    get('/financing/applications/my'),
    get('/insurance/my-applications'),
    get('/insurance/my-claims'),
    get('/tracker-bookings/my-orders'),
    get('/vehicles/my?limit=5'),
  ]);
  // Sab requests fail hon to error dikhayein (khali list nahi)
  if ([fin, insApps, claims, trackers, ads].every(r => r.status === 'rejected')) throw new Error('activity unavailable');
  const val = (r: PromiseSettledResult<any>) => {
    if (r.status !== 'fulfilled') return [];
    const v = r.value;
    return Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : [];
  };

  const out: Activity[] = [];
  const claimList = val(claims);
  const claimById = new Map<string, any>(claimList.map((c: any) => [String(c.id), c]));
  const appliedClaimIds = new Set<string>();

  for (const a of val(fin)) out.push({
    id: `fin-${a.id}`, icon: 'bank',
    title: 'Financing Application',
    sub: joinParts(statusLabel(a.status), a.bank_name, `${a.brand || ''} ${a.car_model || ''}`, timeAgo(a.created_at)),
    at: new Date(a.created_at).getTime() || 0, route: '/alert',
  });
  for (const a of val(insApps)) {
    const c = claimById.get(String(a.claim_id));
    if (a.claim_id) appliedClaimIds.add(String(a.claim_id));
    out.push({
      id: `ins-${a.id}`, icon: 'shield-checkmark-outline',
      title: 'Insurance Application',
      sub: joinParts(statusLabel(a.status), c ? `${c.brand || ''} ${c.model || ''}` : '', timeAgo(a.created_at)),
      at: new Date(a.created_at).getTime() || 0, route: '/alert',
    });
  }
  for (const c of claimList) {
    if (appliedClaimIds.has(String(c.id))) continue;
    out.push({
      id: `claim-${c.id}`, icon: 'shield-outline',
      title: 'Insurance Request',
      sub: joinParts(statusLabel(c.status), `${c.brand || ''} ${c.model || ''} ${c.year || ''}`, timeAgo(c.created_at)),
      at: new Date(c.created_at).getTime() || 0, route: '/alert',
    });
  }
  for (const b of val(trackers)) out.push({
    id: `trk-${b.id}`, icon: 'locate-outline',
    title: 'Tracker Booking',
    sub: joinParts(statusLabel(b.status), b.device_name, b.vehicle, timeAgo(b.created_at)),
    at: new Date(b.created_at).getTime() || 0, route: '/alert',
  });
  for (const v of val(ads)) out.push({
    id: `ad-${v.id}`, icon: 'megaphone-outline',
    title: 'Ad Posted',
    sub: joinParts(statusLabel(v.status), v.title || `${v.make || ''} ${v.model || ''}`, timeAgo(v.created_at)),
    at: new Date(v.created_at).getTime() || 0, route: '/profile/my-listings',
  });

  const recent = out.sort((x, y) => y.at - x.at).slice(0, 5);
  if (__DEV__) console.log(`[API] Home › Recent Activity — showing ${recent.length} of ${out.length}:`, recent.map(a => `${a.title} | ${a.sub}`));
  return recent;
}

// Har activity ke hisab se icon (bank/insurance/tracker/...)
const ACT_FALLBACK_ICONS = ['business-outline', 'shield-checkmark-outline', 'locate-outline', 'calendar-outline', 'cash-outline'];
function actIconName(a: any, index: number): string {
  if (a?.icon) return a.icon;
  const t = `${a?.title || ''} ${a?.sub || ''}`.toLowerCase();
  if (t.includes('financ') || t.includes('bank') || t.includes('loan')) return 'bank';
  if (t.includes('insur')) return 'shield-checkmark-outline';
  if (t.includes('track') || t.includes('gps')) return 'locate-outline';
  if (t.includes('payment') || t.includes('transaction') || t.includes('reserved') || t.includes('book')) return 'cash-outline';
  if (t.includes('message') || t.includes('chat')) return 'chatbubble-outline';
  if (t.includes('test') && t.includes('drive')) return 'car-outline';
  return ACT_FALLBACK_ICONS[index % ACT_FALLBACK_ICONS.length];
}

// Featured = promoted (is_featured) pehle, phir latest listings — sirf API data, max 6
async function fetchFeatured(category: 'car' | 'bike', headers: Record<string, string>): Promise<any[]> {
  const base = `${API_BASE}/vehicles/?category=${category}&condition=new&limit=6`;
  const label = `Home › Featured ${category === 'car' ? 'Cars' : 'Bikes'}`;
  // Ek request — response JSON parse karke log karta hai
  const call = async (url: string) => {
    const t0 = Date.now();
    try {
      const r = await fetch(url, { headers });
      const body = await r.json().catch(() => undefined);
      logApi(label, 'GET', url, r, body, t0);
      return { ok: r.ok, status: r.status, items: r.ok ? ((body as any)?.items ?? []) : [] };
    } catch (e) {
      logApiError(label, 'GET', url, e, t0);
      return { ok: false, status: 0, items: [] };
    }
  };
  const [promoted, latest] = await Promise.all([call(`${base}&featured=true`), call(base)]);
  if (!promoted.ok && !latest.ok) throw new Error(`featured ${category} ${latest.status}`);
  const seen = new Set<string>();
  const result = [...promoted.items, ...latest.items]
    .filter((v: any) => v?.id && !seen.has(v.id) && seen.add(v.id))
    .slice(0, 6);
  if (__DEV__) console.log(`[API] ${label} — showing ${result.length} (promoted ${promoted.items.length}, latest ${latest.items.length}); images:`, result.map((v: any) => v.images?.[0] ?? '<no image>'));
  return result;
}

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
              <VerifiedIcon size={10} />
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
  const { width: _w } = useWindowDimensions();
  const _dropW = (_w - 56 - 16) / 3;   // 3 columns, 2×gap-8 — har screen pe reactive
  return (
    <View style={[styles.findDropItem, { width: _dropW }]}>
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
  card: { width: 178, borderRadius: 16, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12, gap: 10 },
  label: { fontSize: 12.5, fontFamily: 'Poppins_500Medium' },
  divider: { height: 1 },
  iconBox: { width: 22, alignItems: 'center', justifyContent: 'center' },
  tag: { position: 'absolute', top: -3, right: -5 },
  switch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginVertical: -6, marginRight: -6 },
});

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth() as any;
  const aC = useAppColors();
  // Reactive screen width — har phone size + rotation pe grid widths dobara banti hain
  const { width: W } = useWindowDimensions();
  const servW = (W - 40 - 36) / 4;   // All Services: 4 per row, 20px section padding (baaki sections jaisa) and gaps
  const findDropW = (W - 56 - 16) / 3;   // 3 columns, 2×gap-8

  const [featured, setFeatured] = useState<any[]>([]);
  const [bikes, setBikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [unread, setUnread] = useState(0);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState(false);

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

  async function loadFeatured() {
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const [cars, bikeList] = await Promise.allSettled([fetchFeatured('car', headers), fetchFeatured('bike', headers)]);
    if (cars.status === 'fulfilled') setFeatured(cars.value);
    if (bikeList.status === 'fulfilled') setBikes(bikeList.value);
    setFeaturedError(cars.status === 'rejected' && bikeList.status === 'rejected');
    setLoading(false);
  }

  // Bell badge — server ka unread_count
  async function loadUnread() {
    if (!token) { setUnread(0); return; }
    const url = `${API_BASE}/notifications/?limit=1`;
    const t0 = Date.now();
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => undefined);
      logApi('Home › Notification badge', 'GET', url, res, body, t0);
      if (res.ok) setUnread(Number((body as any)?.unread_count) || 0);
    } catch (e) { logApiError('Home › Notification badge', 'GET', url, e, t0); /* badge pichli value pe rehta hai */ }
  }

  async function loadActivity() {
    if (!token) { setActivity([]); return; }
    setActivityLoading(true);
    try {
      setActivity(await fetchRecentActivity(token));
      setActivityError(false);
    } catch {
      setActivityError(true);
    } finally {
      setActivityLoading(false);
    }
  }

  async function onRefresh() {
    setRefresh(true);
    await Promise.all([loadFeatured(), loadUnread(), loadActivity()]);
    setRefresh(false);
  }

  useEffect(() => { loadFeatured(); }, [token]);

  // Screen pe wapas aane par (e.g. Alerts parh kar) badge aur activity fresh karo
  useFocusEffect(useCallback(() => {
    loadUnread();
    loadActivity();
  }, [token]));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg }]}>
      <View ref={screenRef} style={{ flex: 1 }} collapsable={false}>
        <ScrollView
          onScrollBeginDrag={() => settingsOpen && setSettingsOpen(false)}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor="#e2671b" />}
        >

          {/* ════════════════════════════════════════════════════
            1 · HEADER + HERO (upper section) — bg #061B4A
        ════════════════════════════════════════════════════ */}
          <View style={[styles.upperBg, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}>
            {aC.isDark && <View pointerEvents="none" style={styles.upperBgShape} />}
            {/* Light (Figma): grey-blue → peach header shape, rounded bottom + soft shadow */}
            {!aC.isDark && (
              <>
                <LinearGradient pointerEvents="none" colors={['#F3F5F9', '#F3F5F9', '#FBE0D0']} locations={[0, 0.4, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.upperBgShapeLight} />
              </>
            )}
            <View style={[styles.header, { backgroundColor: aC.isDark ? '#071c49' : 'transparent' }]}>

              {/* ── Top row: logo (left) · notification + settings (right) ── */}
              {/* Home root tab hai — back arrow nahi */}
              <View style={[styles.logoRow, !aC.isDark && { marginHorizontal: 0 }]}>

                {/* LEFT: Autowizor logo — Figma node 259:2027 exact image */}
                <View style={styles.brandLogoWrap}>
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
                    accessibilityRole="button"
                    accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
                  >
                    <Ionicons name="notifications-outline" size={20} color={aC.isDark ? '#e2deea' : aC.textPrimary} />
                    {unread > 0 && (
                      <View style={[styles.notifBadge, { borderColor: aC.isDark ? '#071c49' : '#F3F5F9' }]}>
                        <Text style={styles.notifBadgeTxt}>{unread > 99 ? '99+' : unread}</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    ref={settingsBtnRef as any}
                    style={styles.headerIconBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Settings"
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
                    <Ionicons name="settings-outline" size={20} color={aC.isDark ? '#e2deea' : aC.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── [FRAME] Frame 1686558744  343×51 — greeting block ── */}
              <View style={[styles.greetBlock, !aC.isDark && { marginHorizontal: 0 }]}>
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
                style={[styles.searchBar, { backgroundColor: aC.isDark ? '#142c59' : '#ffffff', borderColor: aC.isDark ? '#87a3cc' : 'rgba(0,0,0,0.1)' }, !aC.isDark && styles.searchBarLight]}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.85}
              >
                {aC.isDark && <LinearGradient colors={['#20467f', '#182e59', '#122650', '#1a366a']} locations={[0, 0.32, 0.72, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                <Ionicons name="search-outline" size={20} color={aC.isDark ? '#d2d2d2' : '#000000'} />
                <Text style={[styles.searchPh, { color: aC.isDark ? aC.textSecondary : '#000000' }]}>Search cars, banks & dealers...</Text>
              </TouchableOpacity>

            </View>

            {/* ════════════════════════════════════════════════════
            2 · HERO BANNER  (node 1986:11122 — Glass Button 350×229)
            Figma: bg=rgba(6,27,74,0.6), border=rgba(255,255,255,0.15)
        ════════════════════════════════════════════════════ */}
            <View style={styles.pad}>
              <LinearGradient
                colors={['#E2671B', '#032A69']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={[styles.heroBorder, !aC.isDark && { boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}
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
                    {aC.isDark ? (
                      <Text style={[styles.heroTitle, { color: aC.isDark ? '#ffffff' : '#032a69' }]}>
                        Pakistan's First{'\n'}Connected{' '}
                        <Text style={{ color: '#e2671b' }}>Auto{'\n'}Ecosystem</Text>
                      </Text>
                    ) : (
                      <Text style={[styles.heroTitle, { color: '#1f2f63' }]}>
                        Pakistan's <Text style={{ color: '#e2671b' }}>First</Text>{'\n'}Connected{' '}
                        <Text style={{ color: '#e2671b' }}>Auto</Text>{'\n'}Ecosystem
                      </Text>
                    )}
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
                <View style={[styles.heroDot, { backgroundColor: aC.isDark ? '#ffffff' : '#9a94a0' }]} />
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
                  style={[styles.servCard, { width: servW, backgroundColor: aC.isDark ? '#010a1f' : '#F2F4F8', borderColor: aC.isDark ? '#8ba7d2' : 'transparent' }, !aC.isDark && styles.servCardLight]}
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
                      {/* Top shade */}
                      <LinearGradient
                        colors={['rgba(22,64,136,0.55)', 'transparent']}
                        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.2 }}
                        style={StyleSheet.absoluteFillObject} pointerEvents="none"
                      />
                      {/* Bottom shade */}
                      <LinearGradient
                        colors={['transparent', 'rgba(29,83,175,0.45)']}
                        start={{ x: 0.5, y: 0.8 }} end={{ x: 0.5, y: 1 }}
                        style={StyleSheet.absoluteFillObject} pointerEvents="none"
                      />
                      {/* Left shade */}
                      <LinearGradient
                        colors={['rgba(13,37,84,0.6)', 'transparent']}
                        start={{ x: 0, y: 0.5 }} end={{ x: 0.2, y: 0.5 }}
                        style={StyleSheet.absoluteFillObject} pointerEvents="none"
                      />
                      {/* Right shade */}
                      <LinearGradient
                        colors={['transparent', 'rgba(13,37,84,0.6)']}
                        start={{ x: 0.8, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFillObject} pointerEvents="none"
                      />
                    </>
                  ) : (
                    <LightGradientBorder radius={16} fill="#F2F4F8" colors={['rgba(226,103,27,0.45)', 'rgba(3,42,105,0.4)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  )}
                  {(s as any).image ? (
                    <Image source={(s as any).image} style={{ width: (s as any).imageSize || 26, height: (s as any).imageSize || 26, marginTop: (s as any).imageMarginTop || 0 }} resizeMode="contain" />
                  ) : (
                    <Ionicons name={s.icon as any} size={22} color="#e2671b" />
                  )}
                  <Text style={[styles.servLabel, { color: aC.isDark ? aC.textSecondary : '#000000' }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Pagination dots */}
            <View style={styles.servDots}>
              <View style={[styles.servDot, { backgroundColor: aC.isDark ? '#fff' : '#9a94a0' }]} />
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
              colors={['#E2671B', '#032A69']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.vehicleSearchWrapper}
            >
              <View style={[styles.vehicleSearchSurface, { backgroundColor: aC.isDark ? '#010A1F' : '#F1F4F8' }]}>
                {/* background: linear-gradient(2.51deg, #E2671B -59.87%, #061B4A 49.25%, #010A1F 158.37%) */}
                {aC.isDark && <LinearGradient colors={['#693D35', '#061B4A', '#041336']} locations={[0, 0.4925, 1]} start={{ x: 0.5, y: 1 }} end={{ x: 0.5, y: 0 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                <VehicleSearch lightPeachBg />
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
            <SH title="Featured Cars" onViewAll={() => router.push({ pathname: '/buy/search-results', params: { category: 'car', condition: 'new', title: 'Featured Cars' } } as any)} />
            {loading ? (
              <ActivityIndicator color="#e2671b" style={{ paddingVertical: 28 }} />
            ) : featured.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: aC.glassBg, borderColor: aC.divider }]}>
                <Ionicons name={featuredError ? 'cloud-offline-outline' : 'car-outline'} size={40} color={aC.textSecondary} />
                <Text style={[styles.emptyTxt, { color: aC.textSecondary }]}>{featuredError ? "Couldn't load cars. Pull down to retry." : 'No cars listed yet'}</Text>
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
                    onPress={() => router.push({ pathname: '/buy/car-detail', params: { id: item.id } } as any)}
                  />
                )}
              />
            )}
          </View>

          {/* ════════════════════════════════════════════════════
            9 · FEATURED BIKES
        ════════════════════════════════════════════════════ */}
          <View style={[styles.sec, styles.pad]}>
            <SH title="Featured Bikes" onViewAll={() => router.push({ pathname: '/buy/search-results', params: { category: 'bike', condition: 'new', title: 'Featured Bikes' } } as any)} />
            {loading ? (
              <ActivityIndicator color="#e2671b" style={{ paddingVertical: 28 }} />
            ) : bikes.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: aC.glassBg, borderColor: aC.divider }]}>
                <Ionicons name={featuredError ? 'cloud-offline-outline' : 'bicycle-outline'} size={40} color={aC.textSecondary} />
                <Text style={[styles.emptyTxt, { color: aC.textSecondary }]}>{featuredError ? "Couldn't load bikes. Pull down to retry." : 'No bikes listed yet'}</Text>
              </View>
            ) : (
              <FlatList
                horizontal
                data={bikes}
                keyExtractor={i => String(i.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 16 }}
                renderItem={({ item, index }) => (
                  <FeaturedVehicleCard
                    item={item}
                    category="bike"
                    fallbackIndex={index}
                    onPress={() => router.push({ pathname: '/buy/car-detail', params: { id: item.id } } as any)}
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
          <View style={[styles.sec, styles.pad]} collapsable={false}>
            {/* Data load hone pe upar ke sections ki height badalti hai — section ko fresh mount karo taake draw miss na ho */}
            <YouMayNeedThis key={loading ? 'loading' : 'ready'} />
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
            <BrowseMoreServices hideIconCircle directRoutes />
          </View>

          {/* ════════════════════════════════════════════════════
            15 · LATEST VIDEO
        ════════════════════════════════════════════════════ */}
          <View style={[styles.sec, styles.pad]}>
            <LatestVideoSection count={2} savedCardStyle />
          </View>

          {/* ════════════════════════════════════════════════════
            13 · RECENT ACTIVITY  (node 1986:11792) — real if available
        ════════════════════════════════════════════════════ */}
          <View style={[styles.sec, styles.pad]}>
            <SH title="Recent Activity" />
            {!token ? (
              <View style={[styles.emptyBox, { backgroundColor: aC.glassBg, borderColor: aC.divider }]}>
                <Ionicons name="time-outline" size={36} color={aC.textSecondary} />
                <Text style={[styles.emptyTxt, { color: aC.textSecondary }]}>Log in to see your recent activity</Text>
              </View>
            ) : activityLoading && activity.length === 0 ? (
              <ActivityIndicator color="#e2671b" style={{ paddingVertical: 24 }} />
            ) : activity.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: aC.glassBg, borderColor: aC.divider }]}>
                <Ionicons name={activityError ? 'cloud-offline-outline' : 'time-outline'} size={36} color={aC.textSecondary} />
                <Text style={[styles.emptyTxt, { color: aC.textSecondary, textAlign: 'center' }]}>
                  {activityError
                    ? "Couldn't load your activity. Pull down to retry."
                    : 'No recent activity yet.\nYour applications, bookings and ads will appear here.'}
                </Text>
              </View>
            ) : (
            <View style={{ gap: 8 }}>
              {activity.map((a, index) => {
                const iconName = actIconName(a, index);
                return (
                  <TouchableOpacity key={a.id} style={[styles.actItem, { backgroundColor: aC.isDark ? '#010b1e' : '#F5F6F8', borderColor: aC.isDark ? '#7D96C0' : 'transparent' }, !aC.isDark && { borderWidth: 0, borderRadius: 18 }]} activeOpacity={0.84} onPress={() => router.push(a.route as any)}>
                    {aC.isDark ? (
                      <>
                        {/* Top shade (All Services wali) */}
                        <LinearGradient
                          colors={['rgba(22,64,136,0.68)', 'transparent']}
                          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }}
                          style={StyleSheet.absoluteFillObject} pointerEvents="none"
                        />
                        {/* Bottom shade */}
                        <LinearGradient
                          colors={['transparent', 'rgba(29,83,175,0.28)']}
                          start={{ x: 0.5, y: 0.65 }} end={{ x: 0.5, y: 1 }}
                          style={StyleSheet.absoluteFillObject} pointerEvents="none"
                        />
                        {/* Left shade */}
                        <LinearGradient
                          colors={['rgba(30,60,110,0.72)', 'transparent']}
                          start={{ x: 0, y: 0.5 }} end={{ x: 0.085, y: 0.5 }}
                          style={StyleSheet.absoluteFillObject} pointerEvents="none"
                        />
                        {/* Right shade */}
                        <LinearGradient
                          colors={['transparent', 'rgba(30,60,110,0.7)']}
                          start={{ x: 0.935, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                          style={StyleSheet.absoluteFillObject} pointerEvents="none"
                        />
                      </>
                    ) : (
                      <LightGradientBorder radius={18} fill="#F5F6F8" />
                    )}
                    <View style={[styles.actIcon, { backgroundColor: aC.isDark ? '#061b4a' : 'transparent', borderColor: 'transparent' }]}>
                      {iconName === 'bank' ? (
                        <Image source={require('@/assets/images/hugeicons_bank.png')} style={styles.activityBankIcon} resizeMode="contain" />
                      ) : (
                        <Ionicons name={iconName as any} size={20} color="#e2671b" />
                      )}
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={[styles.actTitle, { color: aC.textPrimary }]} numberOfLines={1}>{a.title}</Text>
                      <Text style={[styles.actSub, { color: aC.textSecondary }]} numberOfLines={1}>{a.sub}</Text>
                    </View>
                    <View style={styles.actArrow}>
                      <Ionicons name="chevron-forward" size={24} color={aC.isDark ? '#e2671b' : '#000000'} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            )}
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
// NOTE: grid widths (servCard, findDropItem) component mein `useWindowDimensions()`
// se reactive calculate hote hain — yahan frozen module-level widths nahi rakhi gayin.

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'rgba(1,10,31,1)' },
  pad: { paddingHorizontal: 20 },
  sec: { marginTop: 20 },
  servicesSection: { paddingHorizontal: 20, marginTop: 6 },

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

  // Light mode header shape — hero banner ke center se thoda neeche tak (Figma)
  upperBgShapeLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 75,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    boxShadow: '2px 4px 5px rgba(0,0,0,0.24)',
  },
  searchBarLight: {
    overflow: 'visible',
    boxShadow: '2px 4px 5px rgba(0,0,0,0.24)',
  },
  servCardLight: {
    borderWidth: 0, overflow: 'visible',
    boxShadow: '2px 4px 5px rgba(0,0,0,0.24)',
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
    textAlign: 'left',
  },

  /* [FRAME] Frame 1686559183 — notification + settings */
  brandLogoWrap: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  topIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Unread count badge on the bell */
  notifBadge: {
    position: 'absolute',
    top: -4, right: -5,
    minWidth: 18, height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#e1131f',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeTxt: {
    color: '#ffffff',
    fontSize: 10,
    lineHeight: 12,
    fontFamily: 'Poppins_600SemiBold',
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
  /* Figma: Glass Button bg=#061b4a, blue glow shadow, orange border tint — compact size
     width har screen pe reactive (component mein useWindowDimensions se) */
  servCard: {
    height: 82,
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
  /* Options row — fixed gap, buttons use flex exact width */
  findRow2: { flexDirection: 'row', gap: 9 },

  /* Cash/Finance — dead style (unused, kept for reference, no frozen width) */
  findOptBtn: {
    height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  findOptBtnActive: { borderWidth: 1, borderColor: 'rgba(255,255,255,1)' },
  findOptBtnInactive: {},
  findOptTxtActive: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#e2671b' },
  findOptTxtInactive: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#f9fafc' },

  /* Cars/Bikes — dead style (unused, kept for reference, no frozen width) */
  findTypeCardBtn: {
    height: 67, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  findTypeTxtLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#fff' },

  /* New/Used Cars — dead style (unused, kept for reference, no frozen width) */
  findCondBtn: {
    height: 58, borderRadius: 14,
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

  /* 3×3 Dropdown grid — column width har screen pe reactive (DropField mein) */
  findDropGrid: { gap: 12 },
  findDropRow: { flexDirection: 'row', gap: 8 },
  findDropItem: { gap: 8 },
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
    borderRadius: 14,
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
    backgroundColor: 'rgba(3,12,40,0.6)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    paddingLeft: 16, paddingRight: 12, paddingVertical: 12,
    overflow: 'hidden',
  },
  actIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.glassDark,
    borderWidth: 0, borderColor: C.divider,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  activityBankIcon: { width: 21, height: 21 },
  actTitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Poppins_500Medium', color: C.textPrimary },
  actSub: { fontSize: 8, lineHeight: 12, marginTop: 3, fontFamily: 'Poppins_400Regular', color: C.textSec },
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
