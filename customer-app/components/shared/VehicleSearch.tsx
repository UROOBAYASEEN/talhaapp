import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import SelectSheet from '@/components/shared/SelectSheet';
import { getBrandLogo } from '@/components/book/common';

// NOTE: fields grid `width: '31.5%'` (percentage) use karta hai taake har
// screen size pe same proportion rahe — fixed pixel width nahi.

// Same option lists as the Buy Used Car search
const CURRENT_YEAR = String(new Date().getFullYear());
const CITIES   = ['All Cities', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot', 'Gujranwala', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Gujrat', 'Jhang', 'Sahiwal', 'Sukkur', 'Larkana', 'Mardan', 'Sheikhupura', 'Kasur', 'Okara', 'Dera Ghazi Khan', 'Jhelum', 'Wah Cantt', 'Muzaffarabad', 'Gilgit', 'Gwadar'];
const ALL_YEARS = ['Any Year', ...Array.from({ length: 27 }, (_, i) => String(2026 - i))];
const COLORS   = ['All Colors', 'White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Beige', 'Green', 'Brown', 'Orange', 'Golden'];
const VARIANTS = ['Any Variant', '1.0 MT', '1.0 CVT', '1.2 MT', '1.2 CVT', '1.3 MT', '1.3 CVT', '1.5 MT', '1.5 CVT', '1.8 MT', '2.0 MT', 'Standard', 'GL', 'GLi', 'XLi', 'Grande', 'Alpha', 'Sport', 'AWD'];
// Financing budget options (Used Car + Finance pe show hota hai)
const BUDGETS = ['PKR 5 Lac', 'PKR 10 Lac', 'PKR 15 Lac', 'PKR 20 Lac', 'PKR 25 Lac', 'PKR 30 Lac', 'PKR 40 Lac', 'PKR 50 Lac', 'PKR 75 Lac', 'PKR 1 Crore'];
// Seller options + budget range (Used + Cash wali image ke mutabiq)
const SELLER_OPTS = ['All (Non Dealer + Individual)', 'Non Dealer', 'Individual'];
const RANGE_MIN = 100000;
const RANGE_MAX = 20000000;
function fmtM(v: number) {
  if (v >= 1000000) {
    const m = v / 1000000;
    return `${Number(m.toFixed(1))}M`;
  }
  return `${Math.round(v / 1000)}K`;
}
function parseBudgetTxt(t: string): number | null {
  const s = t.trim().toUpperCase().replace(/,/g, '').replace(/PKR/g, '').trim();
  const m = s.match(/^([\d.]+)\s*([A-Z]*)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (isNaN(n)) return null;
  const suf = m[2];
  if (suf.startsWith('M')) return n * 1000000;
  if (suf.startsWith('K')) return n * 1000;
  if (suf.startsWith('LAC')) return n * 100000;
  if (suf.startsWith('CR')) return n * 10000000;
  return n;
}
const round50k = (v: number) => Math.round(v / 50000) * 50000;

type FieldKey = 'city' | 'brand' | 'year' | 'car' | 'variant' | 'color' | 'dealer';

export default function VehicleSearch() {
  const router = useRouter();
  const C = useAppColors();
  const { token } = useAuth();
  const [option, setOption] = useState<'Cash' | 'Finance'>('Cash');
  const [vehicle, setVehicle] = useState('New Cars');

  // ── Search form (dynamic, like Buy Used Car) ──
  const [city,    setCity]    = useState('Karachi');
  const [brand,   setBrand]   = useState('All Brands');
  const [year,    setYear]    = useState('Any Year');
  const [car,     setCar]     = useState('All Models');
  const [variant, setVariant] = useState('Any Variant');
  const [color,   setColor]   = useState('All Colors');
  const [dealer,  setDealer]  = useState('All Dealership');
  const [budget,  setBudget]  = useState('PKR 25 Lac');
  const [sellerType, setSellerType] = useState('All (Non Dealer + Individual)');
  const [minV, setMinV] = useState(500000);
  const [maxV, setMaxV] = useState(5800000);
  const [minTxt, setMinTxt] = useState('0.5M');
  const [maxTxt, setMaxTxt] = useState('5.8M');
  const [barW, setBarW] = useState(0);
  const [openSheet, setOpenSheet] = useState<string | null>(null);

  const [apiBrands, setApiBrands] = useState<{ name: string; logo_url?: string | null }[]>([]);
  const [models,   setModels]   = useState<string[]>([]);
  const [dealers,  setDealers]  = useState<{ id: string; name: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const SERVER = API_BASE.replace('/api/v1', '');

  const isBike    = vehicle.includes('Bike');
  const condition = vehicle.startsWith('Used') ? 'used' : 'new';
  const category  = isBike ? 'bike' : 'car';
  const isNew = condition === 'new';
  // New vehicle → sirf current running year, koi option nahi
  const YEAR_OPTIONS = isNew ? [CURRENT_YEAR] : ALL_YEARS;
  // Brand hamesha backend `/brands` API se (logo ke sath) — koi static option nahi.
  const BRAND_OPTIONS = ['All Brands', ...apiBrands.map(b => b.name)];
  // Backend logo (remote URL) pehle, warna local PNG, warna kuch nahi
  function brandLogo(name?: string | null) {
    if (!name) return undefined;
    const hit = apiBrands.find(b => b.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (hit?.logo_url) {
      return { uri: hit.logo_url.startsWith('http') ? hit.logo_url : `${SERVER}${hit.logo_url}` };
    }
    return getBrandLogo(name);
  }
  // Financing budget slider (sirf New + Finance pe — Used pe neeche wale same options)
  const showBudget = option === 'Finance' && isNew;
  const showUsedExtras = !isNew;
  const budgetIdx = Math.max(0, BUDGETS.indexOf(budget));
  const budgetPct = budgetIdx / (BUDGETS.length - 1);
  function setBudgetByX(x: number) {
    if (!barW) return;
    const p = Math.min(1, Math.max(0, x / barW));
    const idx = Math.round(p * (BUDGETS.length - 1));
    setBudget(BUDGETS[idx]);
  }
  // Dual range slider (Used wali image ke mutabiq — Cash aur Finance dono mein same)
  const minPct = (minV - RANGE_MIN) / (RANGE_MAX - RANGE_MIN);
  const maxPct = (maxV - RANGE_MIN) / (RANGE_MAX - RANGE_MIN);
  function setRangeByX(x: number) {
    if (!barW) return;
    const p = Math.min(1, Math.max(0, x / barW));
    const raw = round50k(RANGE_MIN + p * (RANGE_MAX - RANGE_MIN));
    if (Math.abs(p - minPct) <= Math.abs(p - maxPct)) {
      const v = Math.min(raw, maxV);
      setMinV(v); setMinTxt(fmtM(v));
    } else {
      const v = Math.max(raw, minV);
      setMaxV(v); setMaxTxt(fmtM(v));
    }
  }
  function commitMinTxt() {
    const n = parseBudgetTxt(minTxt);
    if (n == null) { setMinTxt(fmtM(minV)); return; }
    const v = Math.min(Math.max(round50k(n), RANGE_MIN), maxV);
    setMinV(v); setMinTxt(fmtM(v));
  }
  function commitMaxTxt() {
    const n = parseBudgetTxt(maxTxt);
    if (n == null) { setMaxTxt(fmtM(maxV)); return; }
    const v = Math.max(Math.min(round50k(n), RANGE_MAX), minV);
    setMaxV(v); setMaxTxt(fmtM(v));
  }
  const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

  // New select hote hi year ko current year pe lock karo + dealership All pe lock
  useEffect(() => {
    if (isNew) {
      setYear(CURRENT_YEAR);
      setDealer('All Dealership');
    } else {
      setYear((prev) => (prev === CURRENT_YEAR ? 'Any Year' : prev));
    }
  }, [isNew]);

  // Backend `/brands` se brands + logos (public API) — charo vehicle types
  // (New/Used Cars/Bikes) mein YAHE same list aati hai, koi static option nahi.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/brands`);
        if (res.ok) {
          const d = await res.json();
          if (alive && Array.isArray(d)) {
            setApiBrands(d.filter((b: any) => b?.name).map((b: any) => ({ name: b.name, logo_url: b.logo_url ?? null })));
          }
        }
      } catch { /* offline → sirf All Brands */ }
    })();
    return () => { alive = false; };
  }, []);

  // Vehicle type badalne pe brand/model reset (brands `/brands` API se aate hain)
  useEffect(() => {
    setBrand('All Brands'); setCar('All Models');
  }, [condition, category]);

  // Models (car / bike names) for the selected brand
  useEffect(() => {
    (async () => {
      setLoadingModels(true);
      try {
        const q = new URLSearchParams({ limit: '100', condition, category });
        if (brand !== 'All Brands') q.set('make', brand);
        const res = await fetch(`${API_BASE}/vehicles?${q}`, { headers });
        if (res.ok) {
          const d = await res.json();
          const names = Array.from(new Set((d.items || []).map((v: any) => `${v.make || ''} ${v.model || ''}`.trim() || v.title).filter(Boolean))).sort() as string[];
          setModels(names);
        }
      } catch { }
      finally { setLoadingModels(false); }
    })();
  }, [brand, condition, category]);

  // Dealerships
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/dealers/?limit=50`, { headers });
        if (res.ok) {
          const d = await res.json();
          setDealers((d || []).map((x: any) => ({ id: x.id, name: x.dealership_name || x.full_name || 'Dealer' })));
        }
      } catch { }
    })();
  }, []);

  const FIELD_DEFS: Record<FieldKey, { label: string; value: string; options: string[]; setter: (v: string) => void; loading?: boolean }> = {
    city:    { label: 'City',    value: city,    options: CITIES, setter: setCity },
    brand:   { label: 'Brand',   value: brand,   options: BRAND_OPTIONS, setter: v => { setBrand(v); setCar('All Models'); } },
    year:    { label: 'Year',    value: year,    options: YEAR_OPTIONS, setter: setYear },
    car:     { label: isBike ? 'Bike' : 'Car', value: car, options: ['All Models', ...models], setter: setCar, loading: loadingModels },
    variant: { label: 'Variant', value: variant, options: VARIANTS, setter: setVariant },
    color:   { label: 'Color',   value: color,   options: COLORS, setter: setColor },
    dealer:  { label: 'Dealership', value: dealer, options: ['All Dealership', ...dealers.map(d => d.name)], setter: setDealer },
  };

  const FIELDS: { key: FieldKey; icon: string | null; image?: any }[] = [
    { key: 'car',     icon: isBike ? 'bicycle-outline' : 'car-outline' },
    { key: 'brand',   icon: null, image: require('@/screenshot/brand.png') },
    { key: 'year',    icon: null, image: require('@/screenshot/year.png') },
    { key: 'city',    icon: 'location-outline' },
    { key: 'variant', icon: null, image: require('@/screenshot/varient.png') },
    { key: 'color',   icon: 'color-palette-outline' },
  ];

  function handleSearch() {
    if (option === 'Finance') {
      if (showUsedExtras) {
        router.push({ pathname: '/auto-financing' as any, params: { min_price: String(minV), max_price: String(maxV), sellerType } } as any);
      } else {
        router.push({ pathname: '/auto-financing' as any, params: { budget } } as any);
      }
      return;
    }
    const params: any = { condition, category };
    if (condition === 'used') params.from = 'usedCar';
    else if (!isBike) params.from = 'newCarCash';
    if (city !== 'All Cities')     params.city    = city;
    if (brand !== 'All Brands')    params.search  = brand;
    if (car !== 'All Models')      params.search  = car;
    if (year !== 'Any Year')       params.year    = year;
    if (variant !== 'Any Variant') params.variant = variant;
    if (color !== 'All Colors')    params.color   = color;
    if (showUsedExtras) {
      params.min_price = String(minV);
      params.max_price = String(maxV);
      if (sellerType === 'Non Dealer') params.sellerType = 'dealership';
      else if (sellerType === 'Individual') params.sellerType = 'individual';
    }
    const d = dealers.find(x => x.name === dealer);
    if (d) params.dealerId = d.id;
    router.push({ pathname: '/buy/search-results' as any, params });
  }

  return (
    <View style={styles.wrapper}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.title, { color: C.textPrimary }]}>
            Search smart,{' '}
            <Text style={styles.orange}>Drive Better</Text>
          </Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>Find the best deals from verified dealers</Text>
        </View>
        <Image
          source={require('@/screenshot/smarticon.png')}
          style={styles.headerImage}
          resizeMode="contain"
        />
      </View>

      {/* Select Option */}
      <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Select The Option</Text>
      <View style={styles.optionRow}>
        {(['Cash', 'Finance'] as const).map(opt => (
          <TouchableOpacity
            key={opt}
            activeOpacity={0.8}
            onPress={() => setOption(opt)}
            style={[styles.optionBtn, { backgroundColor: C.isDark ? '#071b42' : C.glassBg, borderColor: C.isDark ? 'rgba(60,99,165,0.25)' : 'rgba(3,12,40,0.12)' }, option === opt && { backgroundColor: C.isDark ? '#0B2452' : 'rgba(3,42,105,0.08)', borderColor: C.isDark ? '#8AA6D6' : 'rgba(3,42,105,0.25)' }, { overflow: 'hidden' }]}
          >
            {option === opt && C.isDark && <LinearGradient colors={['#173871', '#0C2048', '#0B214C', '#0F2556']} locations={[0, 0.35, 0.68, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
            <Text style={[styles.optionTxt, { color: C.textPrimary }, option === opt && { color: '#e2671b' }]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Vehicle Type */}
      <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Vehicle Type</Text>
      <View style={styles.vehicleRow}>
        {[
          { label: 'New Cars', icon: 'car-outline', image: null },
          { label: 'Used Cars', icon: null, image: require('@/screenshot/usedcar.png') },
          { label: 'New Bikes', icon: null, image: require('@/screenshot/bikelogo.png') },
          { label: 'Used Bikes', icon: null, image: require('@/screenshot/usedBikeLogo.png') },
        ].map(v => (
          <TouchableOpacity
            key={v.label}
            activeOpacity={0.8}
            onPress={() => setVehicle(v.label)}
            style={[styles.vehicleCard, { backgroundColor: C.isDark ? '#071b42' : 'rgba(255,255,255,0.7)', borderColor: C.isDark ? 'rgba(70,108,175,0.25)' : 'rgba(3,12,40,0.12)' }, vehicle === v.label && { backgroundColor: C.isDark ? '#0B2452' : 'rgba(3,42,105,0.08)', borderColor: C.isDark ? '#8AA6D6' : 'rgba(3,42,105,0.25)' }, { overflow: 'hidden' }]}
          >
            {vehicle === v.label && C.isDark && (
              <>
                <LinearGradient colors={['#173871', '#0C2048', '#0B214C', '#0F2556']} locations={[0, 0.35, 0.68, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              </>
            )}
            {v.image ? (
              <Image source={v.image} style={{ width: 24, height: 24, tintColor: vehicle === v.label ? '#e2671b' : C.textPrimary }} resizeMode="contain" />
            ) : (
              <Ionicons name={v.icon as any} size={26} color={vehicle === v.label ? '#e2671b' : C.textPrimary} />
            )}
            <Text style={[styles.vehicleTxt, { color: C.textPrimary }, vehicle === v.label && { color: '#f9fafc' }]}>{v.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fields Grid */}
      <View style={styles.fieldsGrid}>
        {FIELDS.map((f, i) => {
          const val = FIELD_DEFS[f.key].value;
          const isPlaceholder = val.startsWith('All ') || val.startsWith('Any ');
          const valColor = f.key === 'year' && isNew ? '#f9fafc' : isPlaceholder ? '#c9cedb' : '#ffffff';
          return (
          <View key={f.key} style={styles.fieldWrap}>
            <View style={styles.fieldLabelRow}>
              {f.image ? (
                <Image source={f.image} style={{ width: 16, height: 16, tintColor: '#e2671b' }} resizeMode="contain" />
              ) : (
                <Ionicons name={f.icon as any} size={16} color="#e2671b" />
              )}
              <Text style={[styles.fieldLabel, { color: C.textPrimary }]}>{FIELD_DEFS[f.key].label}</Text>
            </View>
            <TouchableOpacity activeOpacity={f.key === 'year' && isNew ? 1 : 0.8} disabled={f.key === 'year' && isNew} onPress={() => setOpenSheet(f.key)} style={[styles.dropdown, { backgroundColor: C.isDark ? (i < 3 ? 'rgba(6,27,74,0.26)' : 'rgba(72,51,70,0.25)') : C.glassBg, borderColor: C.isDark ? (i < 3 ? '#5f6c8b' : '#797487') : 'rgba(3,12,40,0.12)', overflow: 'hidden' }]}>
              {f.key === 'brand' && !isPlaceholder && brandLogo(val) ? (
                <Image source={brandLogo(val)} style={{ width: 22, height: 22, borderRadius: 4 }} resizeMode="contain" />
              ) : null}
              {f.key === 'year' && isNew ? (
                <Text style={[styles.fieldLabel, { flex: 1 }]} numberOfLines={1}>{val}</Text>
              ) : (
                <Text style={[styles.dropdownTxt, { color: valColor }]} numberOfLines={1}>{val}</Text>
              )}
              {!(f.key === 'year' && isNew) && (
                <Ionicons name="chevron-down" size={14} color={C.textPrimary} />
              )}
            </TouchableOpacity>
          </View>
          );
        })}
      </View>

      {/* Dealership — sirf New + Cash pe. Used pe sirf Non Dealers, New + Finance pe Budget */}
      {!showBudget && !showUsedExtras && (
      <View style={styles.fullField}>
        <View style={styles.fieldLabelRow}>
          <Image source={require('@/screenshot/dealershiplogo.png')} style={{ width: 16, height: 16, tintColor: '#e2671b' }} resizeMode="contain" />
          <Text style={[styles.fieldLabel, { color: C.textPrimary }]}>Dealership</Text>
        </View>
        <TouchableOpacity activeOpacity={isNew ? 1 : 0.8} disabled={isNew} onPress={() => setOpenSheet('dealer')} style={[styles.fullDropdown, { backgroundColor: C.isDark ? 'rgba(91,54,67,0.27)' : C.glassBg, borderColor: C.isDark ? '#8a7b85' : 'rgba(3,12,40,0.12)', overflow: 'hidden', opacity: isNew ? 0.7 : 1 }]}>
          <Text style={[styles.dropdownTxt, { color: (isNew || dealer.startsWith('All ')) ? '#c9cedb' : '#ffffff' }]} numberOfLines={1}>{isNew ? 'All Dealership' : dealer}</Text>
          {!isNew && (
            <Ionicons name="chevron-down" size={14} color={C.textPrimary} />
          )}
        </TouchableOpacity>
      </View>
      )}

      {/* Financing Budget — sirf New + Finance pe */}
      {showBudget && (
        <View style={styles.fullField}>
          <View style={styles.fieldLabelRow}>
            <Ionicons name="wallet-outline" size={16} color="#e2671b" />
            <Text style={[styles.fieldLabel, { color: C.textPrimary }]}>Select Your Financing Budget (PKR)</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setOpenSheet('budget')} style={[styles.fullDropdown, { backgroundColor: C.isDark ? 'rgba(91,54,67,0.27)' : C.glassBg, borderColor: C.isDark ? '#8a7b85' : 'rgba(3,12,40,0.12)', overflow: 'hidden' }]}>
            <Text style={[styles.dropdownTxt, { color: '#ffffff' }]} numberOfLines={1}>{budget}</Text>
            <Ionicons name="chevron-down" size={14} color={C.textPrimary} />
          </TouchableOpacity>
          {/* Slider */}
          <View
            style={styles.sliderHit}
            onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onResponderGrant={(e) => setBudgetByX(e.nativeEvent.locationX)}
            onResponderMove={(e) => setBudgetByX(e.nativeEvent.locationX)}
          >
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${budgetPct * 100}%` }]} />
            </View>
            <View style={[styles.sliderThumb, { left: `${budgetPct * 100}%` }]}>
              <View style={styles.sliderDot} />
            </View>
          </View>
        </View>
      )}

      {/* Non Dealers + Budget Range — Used (Cash aur Finance dono) mein same options */}
      {showUsedExtras && (
        <>
          <View style={styles.fullField}>
            <View style={styles.fieldLabelRow}>
              <Ionicons name="car-outline" size={16} color="#e2671b" />
              <Text style={[styles.fieldLabel, { color: C.textPrimary }]}>Non Dealers</Text>
            </View>
            <TouchableOpacity activeOpacity={1} disabled onPress={() => setOpenSheet('sellerType')} style={[styles.fullDropdown, { backgroundColor: C.isDark ? 'rgba(91,54,67,0.27)' : C.glassBg, borderColor: C.isDark ? '#8a7b85' : 'rgba(3,12,40,0.12)', overflow: 'hidden', opacity: 0.7 }]}>
              <Text style={[styles.dropdownTxt, { color: '#c9cedb' }]} numberOfLines={1}>{sellerType}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.fullField}>
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Select Your Budget Range (PKR)</Text>
            <View style={styles.rangeRow}>
              <Text style={[styles.rangeLbl, { color: C.textPrimary }]}>Min</Text>
              <TextInput
                value={minTxt}
                onChangeText={setMinTxt}
                onEndEditing={commitMinTxt}
                onBlur={commitMinTxt}
                keyboardType="default"
                style={[styles.rangeBox, { color: '#ffffff', borderColor: C.isDark ? '#8a7b85' : 'rgba(3,12,40,0.12)', backgroundColor: C.isDark ? 'rgba(91,54,67,0.27)' : C.glassBg }]}
              />
              <Text style={[styles.rangeLbl, { color: C.textPrimary }]}>Max</Text>
              <TextInput
                value={maxTxt}
                onChangeText={setMaxTxt}
                onEndEditing={commitMaxTxt}
                onBlur={commitMaxTxt}
                keyboardType="default"
                style={[styles.rangeBox, { color: '#ffffff', borderColor: C.isDark ? '#8a7b85' : 'rgba(3,12,40,0.12)', backgroundColor: C.isDark ? 'rgba(91,54,67,0.27)' : C.glassBg }]}
              />
            </View>
            {/* Dual slider */}
            <View
              style={styles.sliderHit}
              onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e) => setRangeByX(e.nativeEvent.locationX)}
              onResponderMove={(e) => setRangeByX(e.nativeEvent.locationX)}
            >
              <View style={styles.sliderTrack} />
              <View style={[styles.sliderRange, { left: `${minPct * 100}%`, width: `${Math.max(0, maxPct - minPct) * 100}%` }]} />
              <View style={[styles.sliderThumb, { left: `${minPct * 100}%` }]}>
                <View style={styles.sliderDot} />
              </View>
              <View style={[styles.sliderThumb, { left: `${maxPct * 100}%` }]}>
                <View style={styles.sliderDot} />
              </View>
            </View>
          </View>
        </>
      )}

      {/* Search Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSearch}
      >
        <LinearGradient
          colors={['#032a69', '#e2671b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.searchBtn}
        >
          <Text style={styles.searchTxt}>Search</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Dropdown sheets (same as Buy Used Car) */}
      {(Object.keys(FIELD_DEFS) as FieldKey[]).map(key => (
        <SelectSheet
          key={key}
          visible={openSheet === key}
          title={FIELD_DEFS[key].label}
          options={FIELD_DEFS[key].options}
          selected={FIELD_DEFS[key].value}
          onSelect={FIELD_DEFS[key].setter}
          onClose={() => setOpenSheet(null)}
          loading={FIELD_DEFS[key].loading}
          getIcon={key === 'brand' ? (opt: string) => brandLogo(opt) : undefined}
        />
      ))}
      <SelectSheet
        visible={openSheet === 'budget'}
        title="Financing Budget"
        options={BUDGETS}
        selected={budget}
        onSelect={setBudget}
        onClose={() => setOpenSheet(null)}
      />
      <SelectSheet
        visible={openSheet === 'sellerType'}
        title="Non Dealers"
        options={SELLER_OPTS}
        selected={sellerType}
        onSelect={setSellerType}
        onClose={() => setOpenSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 10,
    gap: 10,
    backgroundColor: 'rgba(6,27,74,0)',
    paddingVertical: 16,
    borderRadius: 16,
  },


  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

  },


  headerText: { flex: 1 },
  title: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#f9fafc', lineHeight: 25 },
  orange: { color: '#e2671b' },
  subtitle: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: '#baacb6', marginTop: 2 },
  headerImage: { width: 112, height: 67 },

  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#f9fafc' },

  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: {
    flex: 1, height: 44, borderRadius: 15,
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  optionBtnActive: { backgroundColor: 'rgba(50,100,200,0.35)', borderColor: 'rgba(100,160,255,0.9)' },
  optionTxt: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#f9fafc' },
  optionTxtActive: { color: '#e2671b', fontFamily: 'Poppins_600SemiBold' },

  vehicleRow: { flexDirection: 'row', gap: 4 },
  vehicleCard: {
    flex: 1, height: 58, borderRadius: 15,
    backgroundColor: 'rgba(20,40,80,0.5)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  vehicleCardActive: { backgroundColor: 'rgba(50,100,200,0.35)', borderColor: 'rgba(100,160,255,0.9)' },
  vehicleTxt: { fontSize: 9, fontFamily: 'Poppins_400Regular', color: '#f9fafc', textAlign: 'center' },
  vehicleTxtActive: { color: '#a8caff' },

  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 12 },
  fieldWrap: { width: '31.5%', gap: 4 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: '#f9fafc' },
  dropdown: {
    height: 32, borderRadius: 7,
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    paddingHorizontal: 7,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dropdownTxt: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: '#f9fafc', flex: 1 },

  fullField: { gap: 4 },
  fullDropdown: {
    height: 32, borderRadius: 7,
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    paddingHorizontal: 9,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },

  searchBtn: { height: 43, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  searchTxt: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  sliderHit: { height: 28, justifyContent: 'center', marginTop: 6 },
  sliderTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  sliderFill: { height: 6, borderRadius: 3, backgroundColor: '#e2671b' },
  sliderRange: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: '#e2671b' },
  sliderThumb: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginLeft: -11, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, elevation: 3 },
  sliderDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e2671b' },

  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangeLbl: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  rangeBox: { flex: 1, height: 36, borderRadius: 7, borderWidth: 1, textAlign: 'center', textAlignVertical: 'center', paddingVertical: 0, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
});
