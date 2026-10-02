import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const { width: W } = Dimensions.get('window');
const FIELD_W = (W - 64 - 16) / 3;

const VEHICLE_TYPES = [
  { label: 'New Cars',   category: 'car',  condition: 'new',  icon: 'car-outline', image: null },
  { label: 'Used Cars',  category: 'car',  condition: 'used', icon: null,          image: require('@/screenshot/usedcar.png') },
  { label: 'New Bikes',  category: 'bike', condition: 'new',  icon: null,          image: require('@/screenshot/bikelogo.png') },
  { label: 'Used Bikes', category: 'bike', condition: 'used', icon: null,          image: require('@/screenshot/bikelogo.png') },
] as const;

const ALL_CITY   = 'All Cities';
const ALL_BRAND  = 'All Brands';
const ALL_YEAR   = 'Any Year';
const ALL_MODEL  = 'All Models';
const ALL_VAR    = 'Any Variant';
const ALL_COLOR  = 'All Colors';
const ALL_DEALER = 'All Dealership';

// ── Option select sheet ──
function OptionSheet({ visible, title, options, selected, onSelect, onClose }: {
  visible: boolean; title: string; options: string[];
  selected: string; onSelect: (v: string) => void; onClose: () => void;
}) {
  const C = useAppColors();
  const [q, setQ] = useState('');
  useEffect(() => { if (visible) setQ(''); }, [visible]);
  const filtered = q ? options.filter(o => o.toLowerCase().includes(q.toLowerCase())) : options;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={os.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[os.sheet, { backgroundColor: C.isDark ? '#061b4a' : '#ffffff', borderColor: C.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)' }]}>
          <View style={[os.handle, { backgroundColor: C.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(3,42,105,0.15)' }]} />
          <View style={os.header}>
            <Text style={[os.title, { color: C.isDark ? '#f9fafc' : '#010a1f' }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={[os.closeBtn, { backgroundColor: C.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.08)' }]}>
              <Ionicons name="close" size={16} color={C.isDark ? '#baacb6' : '#64748b'} />
            </TouchableOpacity>
          </View>
          <View style={[os.searchRow, { backgroundColor: C.isDark ? 'rgba(3,12,40,0.6)' : '#f1f5f9' }]}>
            <Ionicons name="search-outline" size={14} color="#8f8f8f" style={{ marginLeft: 12 }} />
            <TextInput
              style={[os.searchInput, { color: C.isDark ? '#f9fafc' : '#010a1f' }]}
              value={q} onChangeText={setQ}
              placeholder={`Search ${title}...`} placeholderTextColor="#8f8f8f"
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }} keyboardShouldPersistTaps="handled">
            {filtered.map(opt => (
              <TouchableOpacity
                key={opt} style={os.option}
                onPress={() => { onSelect(opt); onClose(); }}
              >
                <Text style={[os.optTxt, { color: C.isDark ? '#baacb6' : '#475569' }, opt === selected && { color: '#e2671b', fontFamily: 'Poppins_600SemiBold' }]}>{opt}</Text>
                {opt === selected && <Ionicons name="checkmark" size={16} color="#e2671b" />}
              </TouchableOpacity>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
const os = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, paddingBottom: 32, overflow: 'hidden' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  title: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginVertical: 10, height: 40, borderRadius: 20, overflow: 'hidden' },
  searchInput: { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', paddingHorizontal: 10 },
  option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  optTxt: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular' },
});

export default function VehicleSearch() {
  const router = useRouter();
  const C = useAppColors();
  const { token } = useAuth();
  const [option,  setOption]  = useState<'Cash' | 'Finance'>('Cash');
  const [vehicle, setVehicle] = useState<(typeof VEHICLE_TYPES)[number]['label']>('New Cars');

  const [city, setCity]       = useState(ALL_CITY);
  const [brand, setBrand]     = useState(ALL_BRAND);
  const [year, setYear]       = useState(ALL_YEAR);
  const [model, setModel]     = useState(ALL_MODEL);
  const [variant, setVariant] = useState(ALL_VAR);
  const [color, setColor]     = useState(ALL_COLOR);
  const [dealerId, setDealerId]     = useState('');
  const [dealerName, setDealerName] = useState(ALL_DEALER);

  const [openSheet, setOpenSheet] = useState<string | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);

  const activeType = VEHICLE_TYPES.find(v => v.label === vehicle)!;
  const isBike = activeType.category === 'bike';

  // DB se is type ki listings lao
  useEffect(() => {
    (async () => {
      setLoadingOpts(true);
      try {
        const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(
          `${API_BASE}/vehicles?category=${activeType.category}&condition=${activeType.condition}&limit=100`,
          { headers },
        );
        if (res.ok) {
          const d = await res.json();
          setInventory(d.items || d || []);
        } else setInventory([]);
      } catch { setInventory([]); }
      finally { setLoadingOpts(false); }
    })();
    // type badalte hi selections reset
    setCity(ALL_CITY); setBrand(ALL_BRAND); setYear(ALL_YEAR);
    setModel(ALL_MODEL); setVariant(ALL_VAR); setColor(ALL_COLOR);
    setDealerId(''); setDealerName(ALL_DEALER);
  }, [vehicle]);

  const uniq = (arr: (string | undefined | null)[]) =>
    Array.from(new Set(arr.map(v => (v || '').trim()).filter(Boolean))).sort();

  // Cascading options — har agla dropdown pichli selection se filter
  const cityOpts   = useMemo(() => [ALL_CITY, ...uniq(inventory.map(v => v.city))], [inventory]);
  const brandOpts  = useMemo(() => {
    const list = city === ALL_CITY ? inventory : inventory.filter(v => (v.city || '') === city);
    return [ALL_BRAND, ...uniq(list.map(v => v.make))];
  }, [inventory, city]);
  const yearOpts   = useMemo(() => {
    const list = inventory.filter(v =>
      (city === ALL_CITY || (v.city || '') === city) &&
      (brand === ALL_BRAND || (v.make || '') === brand));
    return [ALL_YEAR, ...uniq(list.map(v => String(v.year || '')))];
  }, [inventory, city, brand]);
  const modelOpts  = useMemo(() => {
    const list = inventory.filter(v =>
      (city === ALL_CITY || (v.city || '') === city) &&
      (brand === ALL_BRAND || (v.make || '') === brand) &&
      (year === ALL_YEAR || String(v.year || '') === year));
    return [ALL_MODEL, ...uniq(list.map(v => v.model))];
  }, [inventory, city, brand, year]);
  const variantOpts = useMemo(() => {
    const list = inventory.filter(v =>
      (city === ALL_CITY || (v.city || '') === city) &&
      (brand === ALL_BRAND || (v.make || '') === brand) &&
      (year === ALL_YEAR || String(v.year || '') === year) &&
      (model === ALL_MODEL || (v.model || '') === model));
    return [ALL_VAR, ...uniq(list.map(v => v.variant))];
  }, [inventory, city, brand, year, model]);
  const colorOpts  = useMemo(() => {
    const list = inventory.filter(v =>
      (city === ALL_CITY || (v.city || '') === city) &&
      (brand === ALL_BRAND || (v.make || '') === brand) &&
      (year === ALL_YEAR || String(v.year || '') === year) &&
      (model === ALL_MODEL || (v.model || '') === model) &&
      (variant === ALL_VAR || (v.variant || '') === variant));
    return [ALL_COLOR, ...uniq(list.map(v => v.color))];
  }, [inventory, city, brand, year, model, variant]);
  const dealerOpts = useMemo(() => {
    const list = inventory.filter(v =>
      (city === ALL_CITY || (v.city || '') === city) &&
      (brand === ALL_BRAND || (v.make || '') === brand) &&
      (year === ALL_YEAR || String(v.year || '') === year) &&
      (model === ALL_MODEL || (v.model || '') === model) &&
      (variant === ALL_VAR || (v.variant || '') === variant) &&
      (color === ALL_COLOR || (v.color || '') === color));
    const seen = new Map<string, string>();
    list.forEach(v => {
      const sid = v.seller_id || v.seller?.id;
      const nm = v.seller?.full_name || '';
      if (sid && nm && !seen.has(sid)) seen.set(sid, nm);
    });
    return [{ id: '', name: ALL_DEALER }, ...[...seen.entries()].map(([id, name]) => ({ id, name }))];
  }, [inventory, city, brand, year, model, variant, color]);

  function pick(setter: (v: string) => void, resets: (() => void)[]) {
    return (v: string) => { setter(v); resets.forEach(r => r()); };
  }

  function handleSearch() {
    const params: any = {
      condition: activeType.condition,
      category: activeType.category,
    };
    if (city !== ALL_CITY)     params.city = city;
    if (brand !== ALL_BRAND)   params.make = brand;
    if (model !== ALL_MODEL)   params.search = model;
    if (year !== ALL_YEAR)     params.year = year;
    if (variant !== ALL_VAR)   params.variant = variant;
    if (color !== ALL_COLOR)   params.color = color;
    if (dealerId)              params.dealerId = dealerId;
    router.push({ pathname: '/buy/search-results' as any, params });
  }

  const FIELDS = [
    { key: 'city',    icon: 'location-outline',      image: null,                                label: 'City',    value: city,    options: cityOpts },
    { key: 'brand',   icon: null,                    image: require('@/screenshot/brand.png'),   label: 'Brand',   value: brand,   options: brandOpts },
    { key: 'year',    icon: null,                    image: require('@/screenshot/year.png'),    label: 'Year',    value: year,    options: yearOpts },
    { key: 'model',   icon: 'car-outline',           image: null,                                label: isBike ? 'Bike' : 'Car', value: model, options: modelOpts },
    { key: 'variant', icon: null,                    image: require('@/screenshot/varient.png'), label: 'Variant', value: variant, options: variantOpts },
    { key: 'color',   icon: 'color-palette-outline', image: null,                                label: 'Color',   value: color,   options: colorOpts },
  ];

  const SETTERS: Record<string, (v: string) => void> = {
    city:    pick(setCity, [() => setBrand(ALL_BRAND), () => setYear(ALL_YEAR), () => setModel(ALL_MODEL), () => setVariant(ALL_VAR), () => setColor(ALL_COLOR), () => { setDealerId(''); setDealerName(ALL_DEALER); }]),
    brand:   pick(setBrand, [() => setYear(ALL_YEAR), () => setModel(ALL_MODEL), () => setVariant(ALL_VAR), () => setColor(ALL_COLOR), () => { setDealerId(''); setDealerName(ALL_DEALER); }]),
    year:    pick(setYear, [() => setModel(ALL_MODEL), () => setVariant(ALL_VAR), () => setColor(ALL_COLOR), () => { setDealerId(''); setDealerName(ALL_DEALER); }]),
    model:   pick(setModel, [() => setVariant(ALL_VAR), () => setColor(ALL_COLOR), () => { setDealerId(''); setDealerName(ALL_DEALER); }]),
    variant: pick(setVariant, [() => setColor(ALL_COLOR), () => { setDealerId(''); setDealerName(ALL_DEALER); }]),
    color:   pick(setColor, []),
  };

  return (
    <View style={styles.wrapper}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: C.textPrimary }]}>
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
            style={[styles.optionBtn, { backgroundColor: C.glassBg, borderColor: C.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,12,40,0.12)' }, option === opt && { backgroundColor: C.isDark ? 'rgba(50,100,200,0.35)' : 'rgba(3,42,105,0.08)', borderColor: C.isDark ? 'rgba(100,160,255,0.9)' : 'rgba(3,42,105,0.25)' }, { overflow: 'hidden' }]}
          >
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <Text style={[styles.optionTxt, { color: C.textPrimary }, option === opt && { color: '#e2671b' }]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Vehicle Type */}
      <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Vehicle Type</Text>
      <View style={styles.vehicleRow}>
        {VEHICLE_TYPES.map(v => (
          <TouchableOpacity
            key={v.label}
            activeOpacity={0.8}
            onPress={() => setVehicle(v.label)}
            style={[styles.vehicleCard, { backgroundColor: C.isDark ? 'rgba(20,40,80,0.5)' : 'rgba(255,255,255,0.7)', borderColor: C.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,12,40,0.12)' }, vehicle === v.label && { backgroundColor: C.isDark ? 'rgba(50,100,200,0.35)' : 'rgba(3,42,105,0.08)', borderColor: C.isDark ? 'rgba(100,160,255,0.9)' : 'rgba(3,42,105,0.25)' }, { overflow: 'hidden' }]}
          >
            {vehicle === v.label && (
              <>
                <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              </>
            )}
            {v.image ? (
                <Image source={v.image} style={{ width: 24, height: 24, tintColor: vehicle === v.label ? '#e2671b' : C.textPrimary }} resizeMode="contain" />
              ) : (
                <Ionicons name={v.icon as any} size={26} color={vehicle === v.label ? '#e2671b' : C.textPrimary} />
              )}
            <Text style={[styles.vehicleTxt, { color: C.textPrimary }, vehicle === v.label && { color: '#a8caff' }]}>{v.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fields Grid — DB-driven cascading options */}
      <View style={styles.fieldsGrid}>
        {FIELDS.map(f => (
          <View key={f.key} style={styles.fieldWrap}>
            <View style={styles.fieldLabelRow}>
              {f.image ? (
                <Image source={f.image} style={{ width: 16, height: 16, tintColor: '#e2671b' }} resizeMode="contain" />
              ) : (
                <Ionicons name={f.icon as any} size={16} color="#e2671b" />
              )}
              <Text style={[styles.fieldLabel, { color: C.textPrimary }]}>{f.label}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setOpenSheet(f.key)}
              style={[styles.dropdown, { backgroundColor: C.glassBg, borderColor: C.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,12,40,0.12)', overflow: 'hidden' }]}
            >
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <Text style={[styles.dropdownTxt, { color: C.textPrimary }]} numberOfLines={1}>{f.value}</Text>
              <Ionicons name="chevron-down" size={14} color={C.textPrimary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Dealership */}
      <View style={styles.fullField}>
        <View style={styles.fieldLabelRow}>
          <Image source={require('@/screenshot/dealershiplogo.png')} style={{ width: 16, height: 16, tintColor: '#e2671b' }} resizeMode="contain" />
          <Text style={[styles.fieldLabel, { color: C.textPrimary }]}>Dealership</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setOpenSheet('dealership')}
          style={[styles.fullDropdown, { backgroundColor: C.glassBg, borderColor: C.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', overflow: 'hidden' }]}
        >
          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0.5, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <Text style={[styles.dropdownTxt, { color: C.textPrimary }]} numberOfLines={1}>{dealerName}</Text>
          <Ionicons name="chevron-down" size={14} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Button */}
      <TouchableOpacity activeOpacity={0.85} onPress={handleSearch}>
        <LinearGradient
          colors={['#032a69', '#e2671b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.searchBtn}
        >
          <Text style={styles.searchTxt}>Search</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Option sheets */}
      {FIELDS.map(f => (
        <OptionSheet
          key={f.key}
          visible={openSheet === f.key}
          title={`Select ${f.label}`}
          options={f.options}
          selected={f.value}
          onSelect={SETTERS[f.key]}
          onClose={() => setOpenSheet(null)}
        />
      ))}
      <OptionSheet
        visible={openSheet === 'dealership'}
        title="Select Dealership"
        options={dealerOpts.map(d => d.name)}
        selected={dealerName}
        onSelect={v => {
          const d = dealerOpts.find(x => x.name === v);
          setDealerId(d?.id || '');
          setDealerName(v);
        }}
        onClose={() => setOpenSheet(null)}
      />
      {loadingOpts && (
        <Text style={{ color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center' }}>
          Loading options from database...
        </Text>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: 'rgba(6,27,74,0)',
    paddingVertical: 8,
    borderRadius: 16,
  },


  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

  },


  headerText: { flex: 1 },
  title:    { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#f9fafc', lineHeight: 22 },
  orange:   { color: '#e2671b' },
  subtitle: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#baacb6', marginTop: 3 },
  headerImage: { width: 110, height: 68 },

  sectionTitle: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#f9fafc' },

  optionRow: { flexDirection: 'row', gap: 12 },
  optionBtn: {
    flex: 1, height: 44, borderRadius: 32,
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  optionBtnActive: { backgroundColor: 'rgba(50,100,200,0.35)', borderColor: 'rgba(100,160,255,0.9)' },
  optionTxt:       { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#f9fafc' },
  optionTxtActive: { color: '#e2671b', fontFamily: 'Poppins_600SemiBold' },

  vehicleRow: { flexDirection: 'row', gap: 4 },
  vehicleCard: {
    flex: 1, height: 80, borderRadius: 16,
    backgroundColor: 'rgba(20,40,80,0.5)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  vehicleCardActive: { backgroundColor: 'rgba(50,100,200,0.35)', borderColor: 'rgba(100,160,255,0.9)' },
  vehicleTxt:        { fontSize: 8, fontFamily: 'Poppins_500Medium', color: '#f9fafc', textAlign: 'center' },
  vehicleTxtActive:  { color: '#a8caff' },

  fieldsGrid:    { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 12 },
  fieldWrap:     { width: '31.5%', gap: 4 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldLabel:    { fontSize: 10, fontFamily: 'Poppins_500Medium', color: '#f9fafc' },
  dropdown: {
    height: 40, borderRadius: 12,
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    paddingHorizontal: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dropdownTxt: { fontSize: 9, fontFamily: 'Poppins_500Medium', color: '#f9fafc', flex: 1 },

  fullField:    { gap: 4 },
  fullDropdown: {
    height: 48, borderRadius: 0,
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },

  searchBtn: { height: 46, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  searchTxt: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
});
