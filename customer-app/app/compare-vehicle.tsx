import VerifiedIcon from '@/components/shared/VerifiedIcon';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors, useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import LatestVideoSection from '@/components/shared/LatestVideoSection';
import { PRIMARY_BTN_COLORS, RingGlow, SavedCardEffect, SearchInputEffect, WARM_CARD_COLORS, WARM_CARD_LOCATIONS } from '@/components/shared/FigmaEffects';
import InnerGlow from '@/components/shared/InnerGlow';

import SheetModal from '@/components/shared/SheetModal';
const BG = AppColors.bg;
const ORANGE = AppColors.gradientEnd;
const SERVER_BASE = API_BASE.replace('/api/v1', '');
function imgUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER_BASE}${url}`;
}
function formatPrice(p: number) {
  if (!p && p !== 0) return '—';
  if (p >= 10_000_000) return `PKR ${(p / 10_000_000).toFixed(1)} Crore`;
  if (p >= 100_000) return `PKR ${(p / 100_000).toFixed(1)} Lac`;
  return `PKR ${p.toLocaleString()}`;
}

// ── "Selected Car" modal field effect (buy/car-detail.tsx jaisa) ──
function CmpInputEffect() {
  return (
    <>
      <LinearGradient
        colors={['#163565', '#061124', '#061124', '#0D2146']}
        locations={[0, 0.24, 0.76, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['#24518F8F', '#16356552', 'transparent', 'transparent', '#16356552', '#24518F8F']}
        locations={[0, 0.025, 0.075, 0.925, 0.975, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
        pointerEvents="none"
      />
    </>
  );
}

// ── Glass Inset ──
function GlassInset() {
  const aC = useAppColors();
  if (!aC.isDark) {
    return (
      <>
        <LinearGradient colors={["rgba(3,42,105,0.04)","transparent"]} start={{x:0.5,y:0}} end={{x:0.5,y:0.4}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        <LinearGradient colors={["transparent","rgba(226,103,27,0.07)"]} start={{x:0.5,y:0.6}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      </>
    );
  }
  return (
    <>
      <LinearGradient colors={["rgba(22,64,136,0.2)","transparent"]} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={["rgba(13,37,84,0.18)","transparent"]} start={{x:0,y:0.5}} end={{x:0.45,y:0.5}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={["transparent","rgba(29,83,175,0.2)"]} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

// ── Static fallbacks ──
const FALLBACK_VARIANTS = ['Any Variant', '1.0 MT', '1.2 CVT', '1.5 CVT', '1.8 CVT', '2.0 MT', 'Standard', 'GL', 'GLi', 'XLi', 'Grande'];

// ── Select Sheet ──
function SelectSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  const aC = useAppColors();
  const [q, setQ] = useState('');
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options;
  return (
    <SheetModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sh.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[sh.sheet, { backgroundColor: aC.bg, borderColor: aC.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)' }]}>
          <GlassInset />
          <View style={[sh.handle, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(3,42,105,0.15)' }]} />
          <View style={[sh.header, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.08)' }]}>
            <Text style={[sh.title, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={[sh.closeBtn, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.08)' }]}>
              <Ionicons name="close" size={16} color={aC.isDark ? "#baacb6" : '#64748b'} />
            </TouchableOpacity>
          </View>
          <View style={[sh.searchRow, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)' }]}>
            <GlassInset />
            <Ionicons name="search-outline" size={14} color={aC.isDark ? "#baacb6" : '#64748b'} style={{ marginLeft: 12 }} />
            <TextInput
              style={[sh.searchInput, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}
              value={q}
              onChangeText={setQ}
              placeholder={`Search ${title}...`}
              placeholderTextColor={aC.isDark ? "#6b7280" : "#94a3b8"}
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
            {filtered.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[sh.option, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.06)' }]}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
              >
                <Text style={[sh.optTxt, { color: aC.isDark ? '#baacb6' : '#475569' }, opt === selected && { color: ORANGE, fontFamily: 'Poppins_600SemiBold' }]}>{opt}</Text>
                {opt === selected && <Ionicons name="checkmark" size={16} color={ORANGE} />}
              </TouchableOpacity>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </SheetModal>
  );
}
const sh = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.4)',
    paddingBottom: 32,
    overflow: 'hidden',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: { color: '#f9fafc', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginVertical: 10,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.4)',
    backgroundColor: 'rgba(3,12,40,0.6)',
    overflow: 'hidden',
  },
  searchInput: { flex: 1, color: '#f9fafc', fontSize: 12, fontFamily: 'Poppins_400Regular', paddingHorizontal: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  optTxt: { flex: 1, color: '#baacb6', fontSize: 13, fontFamily: 'Poppins_400Regular' },
});

export default function CompareVehicle() {
  const router = useRouter();
  const aC = useAppColors();
  const { category: initialCategory, from, brand: initialBrand, variant: initialVariant } = useLocalSearchParams<{ category?: string; from?: string; brand?: string; variant?: string }>();
  const [vehicleType, setVehicleType] = useState<'Cars' | 'Bikes'>(initialCategory === 'bike' ? 'Bikes' : 'Cars');
  const category = vehicleType === 'Cars' ? 'car' : 'bike';

  const [v1Brand, setV1Brand] = useState(initialBrand || 'All Brands');
  const [v1Car, setV1Car] = useState('All Models');
  const [v1Variant, setV1Variant] = useState(initialVariant || 'Any Variant');

  const [v2Brand, setV2Brand] = useState(initialBrand || 'All Brands');
  const [v2Car, setV2Car] = useState('All Models');
  const [v2Variant, setV2Variant] = useState('Any Variant');

  const [openSheet, setOpenSheet] = useState<string | null>(null);

  const [brands, setBrands] = useState<string[]>(['All Brands']);
  const [v1Models, setV1Models] = useState<string[]>(['All Models']);
  const [v2Models, setV2Models] = useState<string[]>(['All Models']);
  const [variants1, setVariants1] = useState<string[]>(['Any Variant']);
  const [variants2, setVariants2] = useState<string[]>(['Any Variant']);

  const [trending, setTrending] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  // Trending cards ke radio buttons — 2 select hote hi "Selected Car" modal khulta hai
  const [radioSel, setRadioSel] = useState<any[]>([]);
  const [cmpVisible, setCmpVisible] = useState(false);
  const cmpInsets = useSafeAreaInsets();

  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResult, setCompareResult] = useState<{ a: any; b: any } | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);



  // ── Fetch brands by category ──
  const loadBrands = useCallback(async (cat: string) => {
    try {
      const res = await fetch(`${API_BASE}/vehicles?category=${cat}&limit=100`);
      if (!res.ok) return;
      const d = await res.json();
      const items: any[] = d.items || d || [];
      const uniq = Array.from(new Set(items.map((v: any) => (v.make || '').trim()).filter(Boolean))) as string[];
      const formatted = uniq.map((m) => m.charAt(0).toUpperCase() + m.slice(1));
      setBrands(['All Brands', ...formatted.sort()]);
    } catch {}
  }, []);

  // Fetch models for a brand
  const loadModels = useCallback(async (cat: string, brand: string, setter: (v: string[]) => void) => {
    try {
      const q = new URLSearchParams({ category: cat, limit: '100' });
      if (brand && brand !== 'All Brands') q.set('make', brand);
      const res = await fetch(`${API_BASE}/vehicles?${q}`);
      if (!res.ok) { setter(['All Models']); return; }
      const d = await res.json();
      const items: any[] = d.items || d || [];
      const models = Array.from(new Set(items.map((v: any) => (v.model || '').trim()).filter(Boolean))) as string[];
      setter(['All Models', ...models.sort()]);
      // also collect variants
      const vars = new Set<string>(['Any Variant']);
      items.forEach((v: any) => {
        if (v.variant) vars.add(v.variant);
        if (Array.isArray(v.variants)) v.variants.forEach((x: string) => vars.add(x));
      });
      const varList = Array.from(vars);
      // Sirf available variants dikhao — dummy fallback nahi
      if (setter === setV1Models) setVariants1(varList);
      else setVariants2(varList);
    } catch {
      setter(['All Models']);
    }
  }, []);

  // Initial brands + trending
  useEffect(() => {
    loadBrands(category);
  }, [category, loadBrands]);

  useEffect(() => {
    loadModels(category, v1Brand, setV1Models);
  }, [category, v1Brand, loadModels]);

  useEffect(() => {
    loadModels(category, v2Brand, setV2Models);
  }, [category, v2Brand, loadModels]);

  // Trending vehicles — zyada items taake aur bikes/cars show hon
  useEffect(() => {
    (async () => {
      try {
        setTrendingLoading(true);
        const res = await fetch(`${API_BASE}/vehicles?category=${category}&limit=20`);
        if (res.ok) {
          const d = await res.json();
          setTrending(d.items || d || []);
        }
      } catch {}
      finally { setTrendingLoading(false); }
    })();
  }, [category]);

  // Reset car/variant when brand changes
  useEffect(() => { setV1Car('All Models'); setV1Variant('Any Variant'); }, [v1Brand]);
  useEffect(() => { setV2Car('All Models'); setV2Variant('Any Variant'); }, [v2Brand]);
  useEffect(() => {
    // when category changes reset everything
    setV1Brand('All Brands'); setV2Brand('All Brands');
    setV1Car('All Models'); setV2Car('All Models');
    setCompareResult(null);
  }, [category]);

  // Auto-navigate: jesay hi dono vehicles select hon, compare variant page khul jaye
  const autoTimer = useRef<any>(null);
  const lastAutoKey = useRef<string>('');
  useEffect(() => {
    if (v1Car === 'All Models' || v2Car === 'All Models') return;
    if (v1Brand === v2Brand && v1Car === v2Car && v1Variant === v2Variant && v1Brand !== 'All Brands') return;
    const key = `${category}|${v1Brand}|${v1Car}|${v1Variant}||${v2Brand}|${v2Car}|${v2Variant}`;
    if (key === lastAutoKey.current) return;
    lastAutoKey.current = key;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => { handleCompare(); }, 600);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v1Car, v2Car]);

  async function fetchVehicleBySelection(cat: string, brand: string, carName: string, variant: string): Promise<any | null> {
    const q = new URLSearchParams({ category: cat, limit: '20' });
    if (brand && brand !== 'All Brands') q.set('make', brand);
    if (carName && carName !== 'All Models') q.set('model', carName);
    // variant via search fallback
    const res = await fetch(`${API_BASE}/vehicles?${q}`);
    if (!res.ok) return null;
    const d = await res.json();
    let items: any[] = d.items || d || [];
    if (variant && variant !== 'Any Variant') {
      const vLower = variant.toLowerCase();
      const filtered = items.filter(
        (v: any) =>
          (v.variant && String(v.variant).toLowerCase() === vLower) ||
          (Array.isArray(v.variants) && v.variants.some((x: string) => String(x).toLowerCase() === vLower)) ||
          (v.title && String(v.title).toLowerCase().includes(vLower))
      );
      if (filtered.length > 0) items = filtered;
    }
    return items[0] || null;
  }

  async function handleCompare() {
    if (v1Brand === 'All Brands' && v1Car === 'All Models' && v2Brand === 'All Brands' && v2Car === 'All Models') {
      Alert.alert('Select vehicles', 'Please select at least brand/model for both vehicles to compare.');
      return;
    }
    if (v1Brand === v2Brand && v1Car === v2Car && v1Variant === v2Variant && v1Brand !== 'All Brands') {
      Alert.alert('Same vehicle', 'Please select two different vehicles to compare.');
      return;
    }
    setCompareLoading(true);
    setCompareError(null);
    try {
      const [a, b] = await Promise.all([
        fetchVehicleBySelection(category, v1Brand, v1Car, v1Variant),
        fetchVehicleBySelection(category, v2Brand, v2Car, v2Variant),
      ]);
      if (!a || !b) {
        setCompareError(!a && !b ? 'No vehicles found for both selections.' : !a ? 'No vehicle found for Vehicle 1 selection.' : 'No vehicle found for Vehicle 2 selection.');
        return;
      }
      // Navigate to detailed compare page (HTML wala design)
      if (from === 'book') router.push({ pathname: '/book/compare' as any, params: { aId: a.id, bId: b.id } });
      else router.push({ pathname: '/compare-result' as any, params: { aId: a.id, bId: b.id, from: 'compareVehicle', ...(from === 'usedCar' || from === 'newCar' ? { hideBuy: '1' } : {}), ...(from === 'compareSection' ? { hideDealer: '1' } : {}) } });
      // Inline "Comparison Result" section is screen pr show nahi karna (compare-result screen pe hi result dikhta hai)
      // setCompareResult({ a, b });
    } catch (e: any) {
      setCompareError('Failed to fetch comparison. Try again.');
    } finally {
      setCompareLoading(false);
    }
  }

  const trendKey = (v: any) => String(v?.id ?? v?._id ?? '');
  const trendLabel = (v: any) => (v ? (`${v.make || ''} ${v.model || ''} ${v.variant || ''}`.replace(/\s+/g, ' ').trim() || v.title || '—') : '—');
  function toggleTrendRadio(item: any) {
    const k = trendKey(item);
    const exists = radioSel.some(v => trendKey(v) === k);
    const next = exists ? radioSel.filter(v => trendKey(v) !== k) : [...radioSel, item].slice(-2);
    setRadioSel(next);
    if (!exists && next.length === 2) setCmpVisible(true);
  }
  function closeTrendCompare() {
    setCmpVisible(false);
    setRadioSel([]);
  }
  function compareTrendSelection() {
    const [a, b] = radioSel;
    if (!a || !b) return;
    setCmpVisible(false);
    setRadioSel([]);
    // Vehicle compare — upar wale "Compare your Vehicle" jaisa hi navigation
    if (from === 'book') router.push({ pathname: '/book/compare' as any, params: { aId: a.id, bId: b.id } });
    else router.push({ pathname: '/compare-result' as any, params: { aId: a.id, bId: b.id, from: 'compareVehicle', ...(from === 'usedCar' || from === 'newCar' ? { hideBuy: '1' } : {}), ...(from === 'compareSection' ? { hideDealer: '1' } : {}) } });
  }

  // Trending pair (vehicle 1 vs vehicle 2) pe tap — modal nahi, direct comparison screen
  function compareTrendingPair(a: any, b: any) {
    if (!a || !b) return;
    if (from === 'book') router.push({ pathname: '/book/compare' as any, params: { aId: a.id, bId: b.id } });
    else router.push({ pathname: '/compare-result' as any, params: { aId: a.id, bId: b.id, from: 'compareVehicle', ...(from === 'usedCar' || from === 'newCar' ? { hideBuy: '1' } : {}), ...(from === 'compareSection' ? { hideDealer: '1' } : {}) } });
  }

  function fillTrendingPair(idx: number) {
    // Each 2 items = one VS pair
    const left = trending[idx * 2];
    const right = trending[idx * 2 + 1];
    if (!left || !right) return;
    setV1Brand(left.make || 'All Brands');
    setV1Car(left.model || 'All Models');
    setV1Variant(left.variant || 'Any Variant');
    setV2Brand(right.make || 'All Brands');
    setV2Car(right.model || 'All Models');
    setV2Variant(right.variant || 'Any Variant');
    // scroll to top compare card ideally
  }

  const SelectBox = ({ label, icon, value, onPress }: { label: string; icon: any; value: string; onPress: () => void }) => (
    <View style={styles.selectColumn}>
      <View style={styles.selectLabelRow}>
        <MaterialCommunityIcons name={icon} size={16} color="#E2671B" />
        <Text style={[styles.selectLabel, { color: aC.isDark ? '#E6E4EA' : '#475569' }]}>{label}</Text>
      </View>
      <TouchableOpacity style={[styles.selectBox, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(3,42,105,0.12)' }]} onPress={onPress} activeOpacity={0.85}>
        <Text style={[styles.selectValue, { color: aC.isDark ? '#ffffff' : '#010a1f' }]} numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name="chevron-down" size={16} color={aC.isDark ? "#ffffff" : '#64748b'} />
      </TouchableOpacity>
    </View>
  );

  const VehicleSelection = ({
    number,
    prefix,
    brand,
    carName,
    variant,
  }: {
    number: string;
    prefix: 'v1' | 'v2';
    brand: string;
    carName: string;
    variant: string;
  }) => {
    const models = prefix === 'v1' ? v1Models : v2Models;
    const vars = prefix === 'v1' ? variants1 : variants2;
    return (
      <View style={styles.vehicleSection}>
        <Text style={[styles.chooseTitle, { color: aC.isDark ? '#ffffff' : '#010a1f' }]}>Choose Vehicle {number}</Text>
        <View style={styles.selectRow}>
          <SelectBox label="Brand" icon="cube-outline" value={brand} onPress={() => setOpenSheet(`${prefix}-brand`)} />
          <SelectBox label={vehicleType === 'Cars' ? 'Car' : 'Bike'} icon="car-outline" value={carName} onPress={() => setOpenSheet(`${prefix}-car`)} />
          <SelectBox label="Variant" icon="steering" value={variant} onPress={() => setOpenSheet(`${prefix}-variant`)} />
        </View>
      </View>
    );
  };

  function SpecRow({ label, a, b }: { label: string; a: string; b: string }) {
    return (
      <View style={[crStyles.specRow, { borderTopColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.08)' }]}>
        <Text style={[crStyles.specLabel, { color: aC.isDark ? '#baacb6' : '#475569' }]}>{label}</Text>
        <Text style={[crStyles.specVal, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]} numberOfLines={2}>
          {a}
        </Text>
        <Text style={[crStyles.specVal, { color: '#ff6b00' }]} numberOfLines={2}>
          {b}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]} edges={["top"]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.container, { backgroundColor: aC.bg }]}>
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={27} color={aC.isDark ? "#C9C6D0" : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? '#ffffff' : '#010a1f' }]}>Compare Vehicle</Text>
          <View style={{ width: 35 }} />
        </View>

        <Text style={[styles.mainHeading, { color: aC.isDark ? '#ffffff' : '#010a1f' }]}>Find Your Best Match</Text>

        {/* COMPARE BOX */}
        <LinearGradient
          colors={aC.isDark ? ['#E2671B', '#8A5A55', '#2E4F8E'] : ['rgba(3,42,105,0.12)', 'rgba(3,42,105,0.12)']}
          locations={aC.isDark ? [0, 0.5, 1] : undefined}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={styles.compareBorder}
        >
        <View style={[styles.compareCard, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff', borderWidth: 0, shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
          {aC.isDark
            ? <LinearGradient colors={WARM_CARD_COLORS as any} locations={WARM_CARD_LOCATIONS as any} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            : <GlassInset />}
          <Text style={[styles.vehicleTypeTitle, { color: aC.isDark ? '#ffffff' : '#010a1f' }]}>Select Your Vehicle Type</Text>
          <View style={styles.vehicleTypeRow}>
            <TouchableOpacity
              style={[styles.typeButton, { backgroundColor: aC.isDark ? '#071D50' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', borderWidth: 1, shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1 }, vehicleType === 'Cars' && (aC.isDark ? styles.activeTypeButton : { borderColor: '#ff6b00', backgroundColor: 'rgba(226,103,27,0.12)' })]}
              onPress={() => setVehicleType('Cars')}
            >
              {aC.isDark && vehicleType !== 'Cars' && (
                <>
                  <LinearGradient
                    colors={['#071D50', '#08245C', '#071D50']}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                  />
                  <LinearGradient
                    colors={['rgba(20,55,115,0.20)', 'transparent', 'rgba(1,10,31,0.12)']}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                  />
                </>
              )}
              {vehicleType === 'Cars' && aC.isDark && <InnerGlow radius={16} />}
              {/* previous selected-card gradient (replaced by Skia inner shadow)
              {vehicleType === 'Cars' && aC.isDark && (
                <>
                  <LinearGradient
                    colors={[
                      'rgba(80,126,197,0.16)',
                      '#06183F',
                      '#06183F',
                      '#06183F',
                      'rgba(80,126,197,0.10)'
                    ]}
                    locations={[0, 0.18, 0.5, 0.82, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                  />
                </>
              )}
              */}
              <MaterialCommunityIcons name="car" size={26} color={vehicleType === 'Cars' ? '#ff6b00' : (aC.isDark ? '#ffffff' : '#64748b')} />
              <Text style={[styles.typeText, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Cars</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, { backgroundColor: aC.isDark ? '#071D50' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', borderWidth: 1, shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1 }, vehicleType === 'Bikes' && (aC.isDark ? styles.activeTypeButton : { borderColor: '#ff6b00', backgroundColor: 'rgba(226,103,27,0.12)' })]}
              onPress={() => setVehicleType('Bikes')}
            >
              {aC.isDark && vehicleType !== 'Bikes' && (
                <>
                  <LinearGradient
                    colors={['#071D50', '#08245C', '#071D50']}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                  />
                  <LinearGradient
                    colors={['rgba(20,55,115,0.20)', 'transparent', 'rgba(1,10,31,0.12)']}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                  />
                </>
              )}
              {vehicleType === 'Bikes' && aC.isDark && <InnerGlow radius={16} />}
              {/* previous selected-card gradient (replaced by Skia inner shadow)
              {vehicleType === 'Bikes' && aC.isDark && (
                <>
                  <LinearGradient
                    colors={[
                      'rgba(80,126,197,0.16)',
                      '#06183F',
                      '#06183F',
                      '#06183F',
                      'rgba(80,126,197,0.10)'
                    ]}
                    locations={[0, 0.18, 0.5, 0.82, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                  />
                </>
              )}
              */}
              <MaterialCommunityIcons name="motorbike" size={26} color={vehicleType === 'Bikes' ? '#ff6b00' : (aC.isDark ? '#ffffff' : '#64748b')} />
              <Text style={[styles.typeText, { color: aC.isDark ? '#ffffff' : '#010a1f' }]}>Bikes</Text>
            </TouchableOpacity>
          </View>

          <VehicleSelection number="1" prefix="v1" brand={v1Brand} carName={v1Car} variant={v1Variant} />
          <VehicleSelection number="2" prefix="v2" brand={v2Brand} carName={v2Car} variant={v2Variant} />

          {compareError && (
            <View style={{ backgroundColor: 'rgba(255,80,80,0.12)', borderWidth: 1, borderColor: 'rgba(255,80,80,0.3)', borderRadius: 10, padding: 10, marginTop: 8 }}>
              <Text style={{ color: '#ff6467', fontSize: 11, fontFamily: 'Poppins_400Regular' }}>{compareError}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.compareButton} onPress={handleCompare} activeOpacity={0.88} disabled={compareLoading}>
            <LinearGradient
              colors={PRIMARY_BTN_COLORS as any}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            {compareLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.compareButtonText}>Compare your Vehicle</Text>}
          </TouchableOpacity>
        </View>
        </LinearGradient>

        {/* COMPARISON RESULT */}
        {compareResult && (
          <View style={[crStyles.resultCard, { backgroundColor: aC.isDark ? '#071b46' : '#ffffff', borderColor: aC.isDark ? '#ff6500' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
            <GlassInset />
            <Text style={[crStyles.resultTitle, { color: aC.isDark ? '#ffffff' : '#010a1f' }]}>Comparison Result</Text>
            <View style={crStyles.resultImagesRow}>
              {[compareResult.a, compareResult.b].map((v: any, idx: number) => {
                const uri = imgUrl(v.images?.[0]);
                return (
                  <View key={idx} style={[crStyles.resultImgCard, { backgroundColor: aC.isDark ? '#0a2458' : '#f8fafc', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)' }]}>
                    {uri ? (
                      <Image source={{ uri }} style={crStyles.resultImg} resizeMode="cover" />
                    ) : (
                      <View style={[crStyles.resultImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: aC.isDark ? '#0d1e3d' : '#f1f5f9' }]}>
                        <Ionicons name={category === 'car' ? 'car-outline' : 'bicycle-outline'} size={28} color={aC.isDark ? "#baacb6" : '#94a3b8'} />
                      </View>
                    )}
                    <Text style={[crStyles.resultCarName, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]} numberOfLines={1}>
                      {v.title || `${v.make} ${v.model}`}
                    </Text>
                    <Text style={crStyles.resultCarPrice}>{formatPrice(v.price)}</Text>
                    <TouchableOpacity
                      style={[crStyles.viewBtn, { borderColor: aC.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(3,42,105,0.12)' }]}
                      onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: v.id } } as any)}
                    >
                      <Text style={[crStyles.viewBtnTxt, { color: aC.isDark ? '#fff' : '#032a69' }]}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              <View style={crStyles.vsBadge}>
                <Text style={crStyles.vsBadgeTxt}>VS</Text>
              </View>
            </View>

            {/* Spec table */}
            <View style={[crStyles.table, { borderColor: aC.isDark ? 'rgba(100,160,255,0.25)' : 'rgba(3,42,105,0.12)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}>
              <View style={[crStyles.tableHeader, { backgroundColor: aC.isDark ? 'rgba(255,107,0,0.18)' : 'rgba(3,42,105,0.06)' }]}>
                <Text style={[crStyles.thLabel, { color: aC.isDark ? '#ff6b00' : '#032a69' }]}>Feature</Text>
                <Text style={[crStyles.thVal, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Vehicle 1</Text>
                <Text style={[crStyles.thVal, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Vehicle 2</Text>
              </View>
              <SpecRow label="Make" a={compareResult.a.make || '—'} b={compareResult.b.make || '—'} />
              <SpecRow label="Model" a={compareResult.a.model || '—'} b={compareResult.b.model || '—'} />
              <SpecRow label="Variant" a={compareResult.a.variant || '—'} b={compareResult.b.variant || '—'} />
              <SpecRow label="Year" a={String(compareResult.a.year || '—')} b={String(compareResult.b.year || '—')} />
              <SpecRow label="Price" a={formatPrice(compareResult.a.price)} b={formatPrice(compareResult.b.price)} />
              <SpecRow label="Mileage" a={compareResult.a.mileage ? `${Number(compareResult.a.mileage).toLocaleString()} km` : '—'} b={compareResult.b.mileage ? `${Number(compareResult.b.mileage).toLocaleString()} km` : '—'} />
              <SpecRow label="Fuel" a={compareResult.a.fuel_type || '—'} b={compareResult.b.fuel_type || '—'} />
              <SpecRow label="Transmission" a={compareResult.a.transmission || '—'} b={compareResult.b.transmission || '—'} />
              <SpecRow label="Engine" a={compareResult.a.engine_cc ? `${compareResult.a.engine_cc} cc` : '—'} b={compareResult.b.engine_cc ? `${compareResult.b.engine_cc} cc` : '—'} />
              <SpecRow label="Color" a={compareResult.a.color || '—'} b={compareResult.b.color || '—'} />
              <SpecRow label="City" a={compareResult.a.city || '—'} b={compareResult.b.city || '—'} />
            </View>

            <TouchableOpacity style={[crStyles.clearBtn, { borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)' }]} onPress={() => setCompareResult(null)}>
              <Text style={[crStyles.clearTxt, { color: aC.isDark ? '#baacb6' : '#475569' }]}>Clear Comparison</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TRENDING */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 17 }}>
          <Text style={[styles.sectionTitle, { color: aC.isDark ? '#ffffff' : '#010a1f' }]}>Trending Compare Vehicles</Text>
          {trendingLoading && <ActivityIndicator color={ORANGE} size="small" />}
        </View>
        {trending.length === 0 && !trendingLoading ? (
          <Text style={{ color: aC.isDark ? '#baacb6' : '#64748b', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 8 }}>No vehicles available yet</Text>
        ) : (
          <View style={styles.trendingGrid}>
            {(() => {
              const pairs: any[][] = [];
              for (let i = 0; i < trending.length - 1; i += 2) pairs.push([trending[i], trending[i + 1]]);
              return pairs.map((pair, pIdx) => (
                <View key={pIdx} style={styles.pairRow}>
                  {pair.map((item: any, idx: number) => {
                    const uri = imgUrl(item.images?.[0]);
                    const radioOn = radioSel.some(v => trendKey(v) === trendKey(item));
                    return (
                      <TouchableOpacity
                        key={item.id || idx}
                        style={[styles.trendingCard, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff', borderColor: aC.isDark ? 'rgba(143,174,227,0.45)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 2 }]}
                        activeOpacity={0.86}
                        onPress={() => compareTrendingPair(pair[0], pair[1])}
                      >
                        {aC.isDark
                          ? <LinearGradient colors={['#0B1D4A', '#0E2152', '#3A2F4A', '#6E4538']} locations={[0, 0.5, 0.78, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                          : <GlassInset />}
                        {uri ? (
                          <Image source={{ uri }} style={styles.carImage} resizeMode="cover" />
                        ) : (
                          <View style={[styles.carImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: aC.isDark ? '#0a1e3a' : '#f1f5f9' }]}>
                            <Ionicons name={category === 'car' ? 'car-outline' : 'bicycle-outline'} size={24} color={aC.isDark ? "#baacb6" : '#94a3b8'} />
                          </View>
                        )}
                        <Text style={[styles.carName, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={2}>
                          {item.title || `${item.make} ${item.model}`}
                        </Text>
                        {/* variant line — not in Figma
                        <Text style={[styles.carVariant, { color: aC.isDark ? '#baacb6' : '#475569' }]} numberOfLines={1}>
                          {item.variant || item.transmission || '—'}
                        </Text> */}
                        <Text style={[styles.carPrice, { color: aC.isDark ? '#E6E4EA' : '#475569' }]}>{formatPrice(item.price)}</Text>
                        {/* Radio select + "Selected Car" modal — hidden: trending pairs pehle se bane hain, tap pe direct compare
                        <TouchableOpacity
                          style={styles.trendRadioHit}
                          onPress={() => toggleTrendRadio(item)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.trendRadio, { borderColor: radioOn ? ORANGE : (aC.isDark ? '#BAACB6' : '#94a3b8'), backgroundColor: aC.isDark ? 'rgba(1,10,31,0.7)' : '#ffffff' }]}>
                            {radioOn && <View style={styles.trendRadioDot} />}
                          </View>
                        </TouchableOpacity> */}
                      </TouchableOpacity>
                    );
                  })}
                  <View style={styles.vsContainer} pointerEvents="none">
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                  {/* "Use this pair" — hidden (kept for later)
                  <TouchableOpacity style={[styles.pairUseBtn, { backgroundColor: aC.isDark ? 'rgba(255,107,0,0.18)' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,107,0,0.4)' : 'rgba(3,42,105,0.12)' }]} onPress={() => fillTrendingPair(pIdx)}>
                    <Text style={styles.pairUseTxt}>Use this pair</Text>
                  </TouchableOpacity> */}
                </View>
              ));
            })()}
          </View>
        )}

        {/* LATEST VIDEO — Home page wala component reuse */}
        <LatestVideoSection count={2} savedCardStyle />

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* SHEETS */}
      <SelectSheet visible={openSheet === 'v1-brand'} title="Select Brand" options={brands} selected={v1Brand} onSelect={setV1Brand} onClose={() => setOpenSheet(null)} />
      <SelectSheet visible={openSheet === 'v2-brand'} title="Select Brand" options={brands} selected={v2Brand} onSelect={setV2Brand} onClose={() => setOpenSheet(null)} />
      <SelectSheet visible={openSheet === 'v1-car'} title={`Select ${vehicleType === 'Cars' ? 'Car' : 'Bike'} Model`} options={v1Models} selected={v1Car} onSelect={setV1Car} onClose={() => setOpenSheet(null)} />
      <SelectSheet visible={openSheet === 'v2-car'} title={`Select ${vehicleType === 'Cars' ? 'Car' : 'Bike'} Model`} options={v2Models} selected={v2Car} onSelect={setV2Car} onClose={() => setOpenSheet(null)} />
      <SelectSheet visible={openSheet === 'v1-variant'} title="Select Variant" options={variants1} selected={v1Variant} onSelect={setV1Variant} onClose={() => setOpenSheet(null)} />
      {/* ── Selected Car modal (Trending radio se 2 vehicles select hone pe) ── */}
      <SheetModal visible={cmpVisible} transparent animationType="slide" onRequestClose={closeTrendCompare}>
        <View style={styles.cmpOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeTrendCompare} />
          <View style={[styles.cmpCard, { paddingBottom: 28 + (Platform.OS === 'ios' ? cmpInsets.bottom : 0) }]}>
            <LinearGradient
              colors={['#16408880', 'transparent', 'transparent', '#16408880']}
              locations={[0, 0.03, 0.97, 1]}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['#16408880', 'transparent', 'transparent', '#16408880']}
              locations={[0, 0.02, 0.98, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <Text style={styles.cmpTitle}>Selected {category === 'bike' ? 'Bike' : 'Car'}</Text>
            <TouchableOpacity style={styles.cmpClose} onPress={closeTrendCompare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#BAACB6" />
            </TouchableOpacity>

            <View style={styles.cmpBadgeRow}>
              <View style={styles.cmpDash} pointerEvents="none">
                {Array.from({ length: 90 }).map((_, i) => <View key={i} style={styles.cmpDashSeg} />)}
              </View>
              <View style={styles.cmpBadge}>
                <LinearGradient
                  colors={['#16408866', 'transparent', 'transparent', '#16408866']}
                  locations={[0, 0.22, 0.78, 1]}
                  start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={['#16408866', 'transparent', 'transparent', '#16408866']}
                  locations={[0, 0.22, 0.78, 1]}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />
                <Image source={require('@/assets/images/selectedCar.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
              </View>
            </View>

            <View style={[styles.cmpLabelRow, { marginTop: 2 }]}>
              <View style={styles.cmpCarDot}>
                <MaterialCommunityIcons name={category === 'bike' ? 'motorbike' : 'car'} size={10} color="#010B1E" />
              </View>
              <Text style={styles.cmpNameLabel}>First {category === 'bike' ? 'Bike' : 'Car'}</Text>
              <VerifiedIcon size={11} />
            </View>
            <View style={styles.cmpField}>
              <CmpInputEffect />
              <Text style={styles.cmpFieldTxt} numberOfLines={1}>{trendLabel(radioSel[0])}</Text>
            </View>

            <View style={styles.cmpLabelRow}>
              <View style={styles.cmpCarDot}>
                <MaterialCommunityIcons name={category === 'bike' ? 'motorbike' : 'car'} size={10} color="#010B1E" />
              </View>
              <Text style={styles.cmpNameLabel}>Second {category === 'bike' ? 'Bike' : 'Car'}</Text>
              <VerifiedIcon size={11} style={{ marginLeft: 4 }} />
            </View>
            <View style={styles.cmpField}>
              <CmpInputEffect />
              <Text style={styles.cmpFieldTxt} numberOfLines={1}>{trendLabel(radioSel[1])}</Text>
            </View>

            <TouchableOpacity style={styles.cmpBtn} activeOpacity={0.88} onPress={compareTrendSelection}>
              <LinearGradient colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.cmpBtnTxt}>Compare your Vehicle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SheetModal>
      <SelectSheet visible={openSheet === 'v2-variant'} title="Select Variant" options={variants2} selected={v2Variant} onSelect={setV2Variant} onClose={() => setOpenSheet(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020b22' },
  container: { paddingHorizontal: 17, paddingBottom: 35 },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 35, height: 40, justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 21, fontFamily: 'Poppins_500Medium' },
  mainHeading: { color: '#ffffff', fontSize: 17, fontFamily: 'Poppins_500Medium', marginBottom: 14 },
  compareBorder: { borderRadius: 18, padding: 1 },
  compareCard: {
    borderWidth: 1,
    borderColor: '#ff6500',
    borderRadius: 17,
    padding: 12,
    paddingBottom: 18,
    backgroundColor: '#071b46',
    overflow: 'hidden',
  },
  vehicleTypeTitle: { color: '#ffffff', fontSize: 13, fontFamily: 'Poppins_500Medium', marginBottom: 12 },
  vehicleTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  typeButton: { flex: 1, height: 78, borderRadius: 16, backgroundColor: '#092455', justifyContent: 'center', alignItems: 'center', gap: 6, overflow: 'hidden' },
  activeTypeButton: {
    // Fill + border are drawn by <InnerGlow /> (Skia inner shadow)
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    shadowColor: '#6E9DDD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 2,
  },
  typeText: { color: '#ffffff', fontSize: 15, fontFamily: 'Poppins_500Medium' },
  vehicleSection: { marginBottom: 13 },
  chooseTitle: { color: '#ffffff', fontSize: 13.5, fontFamily: 'Poppins_500Medium', marginBottom: 10 },
  selectRow: { flexDirection: 'row', gap: 8 },
  selectColumn: { flex: 1 },
  selectLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7, gap: 5 },
  selectLabel: { color: '#d9ddec', fontSize: 11.5, fontFamily: 'Poppins_400Regular' },
  selectBox: {
    height: 36,
    borderWidth: 1,
    borderColor: '#68728b',
    borderRadius: 8,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: { color: '#ffffff', fontSize: 11.5, fontFamily: 'Poppins_500Medium', flex: 1, marginRight: 4 },
  compareButton: { height: 46, borderRadius: 24, marginTop: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  compareButtonText: { color: '#EDEBF0', fontSize: 16, fontFamily: 'Poppins_400Regular' },
  sectionTitle: { color: '#ffffff', fontSize: 17, fontFamily: 'Poppins_500Medium', marginTop: 17, marginBottom: 13 },
  trendingGrid: { gap: 14 },
  trendRadioHit: { position: 'absolute', top: 6, right: 6, zIndex: 2 },
  trendRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  trendRadioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: ORANGE },
  /* "Selected Car" modal — buy/car-detail.tsx jaisa */
  cmpOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  cmpCard:      { backgroundColor: '#010A1F', borderRadius: 20, borderWidth: 1, borderColor: '#82a5d5', shadowColor: '#638ed0', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 2, paddingHorizontal: 19, paddingTop: 15, paddingBottom: 28, overflow: 'hidden' },
  cmpTitle:     { textAlign: 'center', fontSize: 17, lineHeight: 24, fontFamily: 'Poppins_500Medium', color: '#BAACB6' },
  cmpClose:     { position: 'absolute', top: 14, right: 14, zIndex: 2 },
  cmpBadgeRow:  { height: 72, marginTop: 9, alignItems: 'center', justifyContent: 'center' },
  cmpDash:      { position: 'absolute', left: -19, right: -19, top: 36, height: 1, flexDirection: 'row', gap: 2, overflow: 'hidden' },
  cmpDashSeg:   { width: 2.5, height: 1, backgroundColor: '#BAACB6' },
  cmpBadge:     { width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderStyle: 'dashed', borderColor: '#BAACB6', backgroundColor: '#061433', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cmpLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, marginBottom: 6 },
  cmpCarDot:    { width: 14, height: 14, borderRadius: 7, backgroundColor: '#BAACB6', alignItems: 'center', justifyContent: 'center' },
  cmpNameLabel: { fontSize: 13, lineHeight: 20, fontFamily: 'Poppins_500Medium', color: '#BAACB6' },
  cmpField:     { height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#829fd0', backgroundColor: 'rgba(3,12,40,0.6)', paddingHorizontal: 20, justifyContent: 'center', overflow: 'hidden' },
  cmpFieldTxt:  { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#F9FAFC' },
  cmpBtn:       { height: 44, borderRadius: 22, marginTop: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cmpBtnTxt:    { color: '#fff', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  pairRow: { flexDirection: 'row', gap: 28, position: 'relative', alignItems: 'center', marginBottom: 18 },
  trendingCard: {
    flex: 1,
    height: 150,
    backgroundColor: '#071b46',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#172e57',
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: 8,
  },
  carImage: { width: '100%', height: 78 },
  carName: { color: '#ffffff', fontSize: 12.5, marginTop: 6, textAlign: 'center', paddingHorizontal: 6, fontFamily: 'Poppins_500Medium', lineHeight: 17 },
  carVariant: { color: '#baacb6', fontSize: 11, marginTop: 2, textAlign: 'center', paddingHorizontal: 6, fontFamily: 'Poppins_400Regular' },
  carPrice: { color: '#ff6b00', fontSize: 12, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  vsContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: -14,
    top: 60,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  vsText: { color: '#E2671B', fontSize: 15, fontFamily: 'Poppins_500Medium' },
  pairUseBtn: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -44,
    backgroundColor: 'rgba(255,107,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pairUseTxt: { color: '#ff6b00', fontSize: 9, fontFamily: 'Poppins_500Medium' },
  videoCard: {
    height: 150,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#507ec5',
    backgroundColor: '#061b45',
    marginBottom: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoImageContainer: { width: 143, height: 116, borderRadius: 13, overflow: 'hidden', position: 'relative' },
  videoImage: { width: '100%', height: '100%' },
  playButton: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -18,
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10, 53, 107, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  durationBox: { position: 'absolute', right: 5, bottom: 5, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  durationText: { color: '#ffffff', fontSize: 8 },
  videoInfo: { flex: 1, paddingLeft: 14, justifyContent: 'center' },
  videoTitle: { color: '#ffffff', fontSize: 15, fontWeight: '500', marginBottom: 7 },
  videoSubtitle: { color: '#d5d7df', fontSize: 12, marginBottom: 12 },
  videoMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#b7bbc7', fontSize: 8 },
});

const crStyles = StyleSheet.create({
  resultCard: {
    marginTop: 16,
    backgroundColor: '#071b46',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff6500',
    padding: 12,
    overflow: 'hidden',
  },
  resultTitle: { color: '#ffffff', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 12 },
  resultImagesRow: { flexDirection: 'row', gap: 28, position: 'relative' },
  resultImgCard: { flex: 1, backgroundColor: '#0a2458', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', padding: 8, alignItems: 'center' },
  resultImg: { width: '100%', height: 90, borderRadius: 8, marginBottom: 8 },
  resultCarName: { color: '#f9fafc', fontSize: 11, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  resultCarPrice: { color: '#ff6b00', fontSize: 11, fontFamily: 'Poppins_700Bold', marginTop: 2 },
  viewBtn: { marginTop: 6, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  viewBtnTxt: { color: '#fff', fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  vsBadge: {
    position: 'absolute',
    left: '50%',
    top: 42,
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff6b00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#071b46',
  },
  vsBadgeTxt: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_700Bold' },
  table: { marginTop: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.25)', borderRadius: 10, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: 'rgba(255,107,0,0.18)', paddingVertical: 8, paddingHorizontal: 10 },
  thLabel: { flex: 1, color: '#ff6b00', fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  thVal: { flex: 1, color: '#f9fafc', fontSize: 10, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  specLabel: { flex: 1, color: '#baacb6', fontSize: 10, fontFamily: 'Poppins_500Medium' },
  specVal: { flex: 1, fontSize: 10, fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  clearBtn: { marginTop: 12, height: 38, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  clearTxt: { color: '#baacb6', fontSize: 12, fontFamily: 'Poppins_500Medium' },
});
