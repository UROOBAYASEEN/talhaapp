import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import SelectSheet from '@/components/shared/SelectSheet';

const { width: W } = Dimensions.get('window');
const FIELD_W = (W - 64 - 16) / 3;

// Same option lists as the Buy Used Car search
const CITIES   = ['All Cities', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta', 'Faisalabad', 'Multan', 'Hyderabad', 'Sialkot', 'Gujranwala'];
const YEARS    = ['Any Year', ...Array.from({ length: 27 }, (_, i) => String(2026 - i))];
const COLORS   = ['All Colors', 'White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Beige', 'Green', 'Brown', 'Orange', 'Golden'];
const VARIANTS = ['Any Variant', '1.0 MT', '1.0 CVT', '1.2 MT', '1.2 CVT', '1.3 MT', '1.3 CVT', '1.5 MT', '1.5 CVT', '1.8 MT', '2.0 MT', 'Standard', 'GL', 'GLi', 'XLi', 'Grande', 'Alpha', 'Sport', 'AWD'];

type FieldKey = 'city' | 'brand' | 'year' | 'car' | 'variant' | 'color' | 'dealer';

export default function VehicleSearch() {
  const router = useRouter();
  const C = useAppColors();
  const { token } = useAuth();
  const [option, setOption] = useState<'Cash' | 'Finance'>('Cash');
  const [vehicle, setVehicle] = useState('New Cars');

  // ── Search form (dynamic, like Buy Used Car) ──
  const [city,    setCity]    = useState('All Cities');
  const [brand,   setBrand]   = useState('All Brands');
  const [year,    setYear]    = useState('Any Year');
  const [car,     setCar]     = useState('All Models');
  const [variant, setVariant] = useState('Any Variant');
  const [color,   setColor]   = useState('All Colors');
  const [dealer,  setDealer]  = useState('All Dealership');
  const [openSheet, setOpenSheet] = useState<FieldKey | null>(null);

  const [brands,   setBrands]   = useState<string[]>([]);
  const [models,   setModels]   = useState<string[]>([]);
  const [dealers,  setDealers]  = useState<{ id: string; name: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const isBike    = vehicle.includes('Bike');
  const condition = vehicle.startsWith('Used') ? 'used' : 'new';
  const category  = isBike ? 'bike' : 'car';
  const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

  // Brands for the selected vehicle type
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/vehicles/brands?condition=${condition}&category=${category}`, { headers });
        if (res.ok) { const d = await res.json(); setBrands((d || []).map((b: any) => b.name || b).filter(Boolean)); }
      } catch { }
    })();
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
    brand:   { label: 'Brand',   value: brand,   options: ['All Brands', ...brands], setter: v => { setBrand(v); setCar('All Models'); } },
    year:    { label: 'Year',    value: year,    options: YEARS, setter: setYear },
    car:     { label: isBike ? 'Bike' : 'Car', value: car, options: ['All Models', ...models], setter: setCar, loading: loadingModels },
    variant: { label: 'Variant', value: variant, options: VARIANTS, setter: setVariant },
    color:   { label: 'Color',   value: color,   options: COLORS, setter: setColor },
    dealer:  { label: 'Dealership', value: dealer, options: ['All Dealership', ...dealers.map(d => d.name)], setter: setDealer },
  };

  const FIELDS: { key: FieldKey; icon: string | null; image?: any }[] = [
    { key: 'city',    icon: 'location-outline' },
    { key: 'brand',   icon: null, image: require('@/screenshot/brand.png') },
    { key: 'year',    icon: null, image: require('@/screenshot/year.png') },
    { key: 'car',     icon: isBike ? 'bicycle-outline' : 'car-outline' },
    { key: 'variant', icon: null, image: require('@/screenshot/varient.png') },
    { key: 'color',   icon: 'color-palette-outline' },
  ];

  function handleSearch() {
    if (option === 'Finance') { router.push('/auto-financing' as any); return; }
    const params: any = { condition, category };
    if (condition === 'used') params.from = 'usedCar';
    else if (!isBike) params.from = 'newCarCash';
    if (city !== 'All Cities')     params.city    = city;
    if (brand !== 'All Brands')    params.search  = brand;
    if (car !== 'All Models')      params.search  = car;
    if (year !== 'Any Year')       params.year    = year;
    if (variant !== 'Any Variant') params.variant = variant;
    if (color !== 'All Colors')    params.color   = color;
    const d = dealers.find(x => x.name === dealer);
    if (d) params.dealerId = d.id;
    router.push({ pathname: '/buy/search-results' as any, params });
  }

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
        {FIELDS.map((f, i) => (
          <View key={f.key} style={styles.fieldWrap}>
            <View style={styles.fieldLabelRow}>
              {f.image ? (
                <Image source={f.image} style={{ width: 16, height: 16, tintColor: '#e2671b' }} resizeMode="contain" />
              ) : (
                <Ionicons name={f.icon as any} size={16} color="#e2671b" />
              )}
              <Text style={[styles.fieldLabel, { color: C.textPrimary }]}>{FIELD_DEFS[f.key].label}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setOpenSheet(f.key)} style={[styles.dropdown, { backgroundColor: C.isDark ? (i < 3 ? 'rgba(6,27,74,0.26)' : 'rgba(72,51,70,0.25)') : C.glassBg, borderColor: C.isDark ? (i < 3 ? '#5f6c8b' : '#797487') : 'rgba(3,12,40,0.12)', overflow: 'hidden' }]}>
              <Text style={[styles.dropdownTxt, { color: C.textPrimary }]} numberOfLines={1}>{FIELD_DEFS[f.key].value}</Text>
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
        <TouchableOpacity activeOpacity={0.8} onPress={() => setOpenSheet('dealer')} style={[styles.fullDropdown, { backgroundColor: C.isDark ? 'rgba(91,54,67,0.27)' : C.glassBg, borderColor: C.isDark ? '#8a7b85' : 'rgba(3,12,40,0.12)', overflow: 'hidden' }]}>
          <Text style={[styles.dropdownTxt, { color: C.textPrimary }]} numberOfLines={1}>{dealer}</Text>
          <Ionicons name="chevron-down" size={14} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

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
        />
      ))}
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
  title: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#f9fafc', lineHeight: 23 },
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
});
