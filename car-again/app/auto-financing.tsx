import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  Modal, FlatList, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronLeft, Car, Bike, Search, X } from 'lucide-react-native';
import { AppColors, useAppColors } from '@/constants/theme';
import AskariBank from '@/components/shared/AskariBank';
import { API_BASE } from '@/constants/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PRIMARY_BTN_COLORS, SavedCardEffect, SearchInputEffect } from '@/components/shared/FigmaEffects';

const C      = AppColors;
const ORANGE = '#e2671b';
const NAVY   = '#032a69';
const SERVER = API_BASE.replace('/api/v1', '');

const CITIES     = ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Rawalpindi'];
const BRANDS     = ['Select Brand', 'Honda', 'Toyota', 'Suzuki', 'Kia', 'Hyundai'];
const COLORS     = ['Select Color', 'White', 'Black', 'Silver', 'Red', 'Grey'];
const YEARS      = ['2026', '2025', '2024', '2023', '2022'];
const DEALERSHIP = ['All (Dealership + Individual)', 'Dealership only', 'Individual only'];

type Vehicle = {
  id: string; title: string; make: string; model: string;
  variant: string; year: number; price: number; color: string; images: string[];
};

// ── Vehicle Picker Modal ──────────────────────────────────────────────────────
function VehiclePickerModal({
  visible, onClose, onSelect,
  vehicleType, condition,
}: {
  visible: boolean; onClose: () => void;
  onSelect: (v: Vehicle) => void;
  vehicleType: string; condition: string;
}) {
  const aC = useAppColors();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');

  const category = vehicleType === 'bikes' ? 'bike' : 'car';

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category,
        condition,
        limit: '100',
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      const res = await fetch(`${API_BASE}/vehicles/?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.items || []);
      }
    } catch {}
    finally { setLoading(false); }
  }, [category, condition, search]);

  useEffect(() => {
    if (visible) fetchVehicles();
  }, [visible, fetchVehicles]);

  function resolveImg(url?: string) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${SERVER}${url}`;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pm.overlay}>
        <View style={[pm.sheet, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)' }]}>

          {/* Header */}
          <View style={pm.header}>
            <Text style={[pm.title, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Select Vehicle</Text>
            <TouchableOpacity onPress={onClose} style={[pm.closeBtn, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.06)' }]}>
              <X size={20} color={aC.isDark ? C.textSecondary : '#64748b'} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[pm.searchBox, { backgroundColor: aC.isDark ? '#061B4A' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)' }]}>
            <Search size={16} color={aC.isDark ? '#64748b' : '#94a3b8'} />
            <TextInput
              style={[pm.searchInput, { color: aC.isDark ? '#fff' : '#010a1f' }]}
              placeholder="Search make, model..."
              placeholderTextColor={aC.isDark ? '#64748b' : '#94a3b8'}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={fetchVehicles}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={14} color={aC.isDark ? '#64748b' : '#94a3b8'} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator color={ORANGE} style={{ marginTop: 40 }} />
          ) : vehicles.length === 0 ? (
            <View style={pm.empty}>
              <Car size={40} color={aC.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(3,42,105,0.2)'} />
              <Text style={[pm.emptyTxt, { color: aC.isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }]}>No vehicles found</Text>
            </View>
          ) : (
            <FlatList
              data={vehicles}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const imgUrl = resolveImg(item.images?.[0]);
                return (
                  <TouchableOpacity style={[pm.item, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.06)' }]} onPress={() => { onSelect(item); onClose(); }} activeOpacity={0.75}>
                    {/* Thumbnail */}
                    <View style={[pm.thumb, { backgroundColor: aC.isDark ? '#061B4A' : '#eef2ff' }]}>
                      {imgUrl ? (
                        <Image source={{ uri: imgUrl }} style={pm.thumbImg} resizeMode="cover" />
                      ) : (
                        <Car size={22} color={aC.isDark ? '#4B5A7A' : '#64748b'} />
                      )}
                    </View>
                    {/* Info */}
                    <View style={pm.itemInfo}>
                      <Text style={[pm.itemTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]} numberOfLines={1}>
                        {item.make} {item.model} {item.variant}
                      </Text>
                      <Text style={[pm.itemSub, { color: aC.isDark ? '#94a3b8' : '#475569' }]}>
                        {item.year} • {item.color || '—'} • PKR {item.price.toLocaleString('en-PK')}
                      </Text>
                    </View>
                    <ChevronDown size={16} color={ORANGE} style={{ transform: [{ rotate: '-90deg' }] }} />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: '#010A1F', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', maxHeight: '80%', paddingBottom: 10 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title:   { color: '#fff', fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  closeBtn:{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  searchBox:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 12, height: 46, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', backgroundColor: '#061B4A', paddingHorizontal: 14 },
  searchInput:{ flex: 1, color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  empty:   { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTxt:{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  item:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  thumb:   { width: 56, height: 44, borderRadius: 10, backgroundColor: '#061B4A', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  thumbImg:{ width: '100%', height: '100%' },
  itemInfo:{ flex: 1 },
  itemTitle:{ color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  itemSub:  { color: '#94a3b8', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },
});

// ── Reusable Dropdown ─────────────────────────────────────────────────────────
function Dropdown({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string;
}) {
  const aC = useAppColors();
  const [open, setOpen] = useState(false);
  const isPlaceholder = value === placeholder || value === options[0];

  return (
    <View style={[dd.wrap, { zIndex: open ? 99 : 1 }]}>
      <TouchableOpacity
        style={[
          dd.btn,
          {
            backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff',
            borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)',
            shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)',
            shadowOpacity: aC.isDark ? 0 : 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: aC.isDark ? 0 : 2,
          },
        ]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.85}
      >
        {aC.isDark ? (
          <SearchInputEffect />
        ) : (
          <>
            <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          </>
        )}
        <Text style={[dd.val, { color: isPlaceholder ? (aC.isDark ? '#F2F1F5' : '#94a3b8') : (aC.isDark ? '#F2F1F5' : '#010a1f') }]} numberOfLines={1}>{value}</Text>
        <ChevronDown size={18} color={ORANGE} style={open ? { transform: [{ rotate: '180deg' }] } : undefined} />
      </TouchableOpacity>
      {open && (
        <View style={[dd.list, { backgroundColor: aC.isDark ? 'rgba(6,18,52,0.99)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.12, shadowRadius: 10, elevation: aC.isDark ? 0 : 8 }]}>
          {aC.isDark ? (
            <>
              <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.7 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          )}
          {options.map(opt => (
            <TouchableOpacity key={opt} style={[dd.option, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.06)' }, value === opt && { backgroundColor: aC.isDark ? 'rgba(226,103,27,0.1)' : 'rgba(226,103,27,0.08)' }]} onPress={() => { onChange(opt); setOpen(false); }}>
              <Text style={[dd.optTxt, { color: value === opt ? ORANGE : (aC.isDark ? '#fff' : '#010a1f') }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const dd = StyleSheet.create({
  wrap:        { marginBottom: 12, zIndex: 1 },
  btn:         { height: 46, borderRadius: 32, borderWidth: 1, borderColor: '#829fd0', backgroundColor: 'rgba(3,12,40,0.6)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, overflow: 'hidden' },
  val:         { color: '#fff', fontSize: 13.5, fontFamily: 'Poppins_400Regular', flex: 1 },
  list:        { position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: 'rgba(6,18,52,0.99)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', overflow: 'hidden', zIndex: 100 },
  option:      { paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  optionActive:{ backgroundColor: 'rgba(226,103,27,0.1)' },
  optTxt:      { color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular' },
});

// ── Toggle Card ───────────────────────────────────────────────────────────────
function ToggleCard({ icon, title, selected, onSelect }: {
  icon: React.ReactNode; title: string; selected: boolean; onSelect: () => void;
}) {
  const aC = useAppColors();
  return (
    <TouchableOpacity
      style={[
        s.toggleCard,
        selected ? s.toggleCardActive : s.toggleCardInactive,
        {
          backgroundColor: aC.isDark ? (selected ? '#010A1F' : '#0B1D4A') : '#ffffff',
          borderColor: aC.isDark ? (selected ? '#82a5d5' : 'transparent') : (selected ? ORANGE : 'rgba(3,42,105,0.12)'),
          shadowColor: aC.isDark ? (selected ? '#638ed0' : 'transparent') : 'rgba(3,42,105,0.08)',
          shadowOpacity: aC.isDark ? (selected ? 0.15 : 0) : 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: aC.isDark ? 0 : 2,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      {selected && (
        aC.isDark ? (
          <SavedCardEffect />
        ) : (
          <>
            <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          </>
        )
      )}
      {icon}
      <Text style={[s.toggleTxt, { color: aC.isDark ? '#F2F1F5' : (selected ? ORANGE : '#010a1f') }]}>{title}</Text>
    </TouchableOpacity>
  );
}

// ── Condition Card ────────────────────────────────────────────────────────────
function ConditionCard({ title, subtitle, selected, onSelect }: {
  title: string; subtitle: string; selected: boolean; onSelect: () => void;
}) {
  const aC = useAppColors();
  return (
    <TouchableOpacity
      style={[
        s.condCard,
        selected ? s.condCardActive : s.condCardInactive,
        {
          backgroundColor: aC.isDark ? (selected ? '#010A1F' : '#0B1D4A') : '#ffffff',
          borderColor: aC.isDark ? (selected ? '#82a5d5' : 'transparent') : (selected ? ORANGE : 'rgba(3,42,105,0.12)'),
          shadowColor: aC.isDark ? (selected ? '#638ed0' : 'transparent') : 'rgba(3,42,105,0.08)',
          shadowOpacity: aC.isDark ? (selected ? 0.15 : 0) : 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: aC.isDark ? 0 : 2,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      {selected && (
        aC.isDark ? (
          <SavedCardEffect />
        ) : (
          <>
            <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          </>
        )
      )}
      <View style={[s.condIcon, { backgroundColor: aC.isDark ? '#12306A' : '#eef2ff' }]}><MaterialCommunityIcons name="car" size={16} color={ORANGE} /></View>
      <View style={{ flex: 1 }}>
        <Text style={[s.condTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>{title}</Text>
        <Text style={[s.condSub, { color: aC.isDark ? '#BAB6C4' : '#64748b' }]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

function FL({ children }: { children: React.ReactNode }) {
  const aC = useAppColors();
  return <Text style={[s.fieldLabel, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>{children}</Text>;
}

function InputField({ value, onChange, placeholder, keyboardType, priceStyle }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; priceStyle?: boolean;
}) {
  const aC = useAppColors();
  return (
    <View style={[s.inputWrap, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: aC.isDark ? 0 : 2 }]}>
      {aC.isDark ? (
        <SearchInputEffect />
      ) : (
        <>
          <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        </>
      )}
      <TextInput
        style={[s.input, { color: priceStyle ? ORANGE : (aC.isDark ? '#F2F1F5' : '#010a1f') }, priceStyle && { color: ORANGE, fontFamily: 'Poppins_500Medium' }]}
        placeholder={placeholder}
        placeholderTextColor={aC.isDark ? C.textPlaceholder : '#94a3b8'}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AutoFinancingScreen() {
  const router = useRouter();
  const aC = useAppColors();

  const [vehicleType,   setVehicleType]   = useState('cars');
  const [condition,     setCondition]     = useState('new');
  const [city,          setCity]          = useState('Karachi');
  const [brand,         setBrand]         = useState('Select Brand');
  const [carModel,      setCarModel]      = useState('');
  const [variant,       setVariant]       = useState('');
  const [color,         setColor]         = useState('Select Color');
  const [year,          setYear]          = useState('2026');
  const [price,         setPrice]         = useState('');
  const [dealership,    setDealership]    = useState(DEALERSHIP[0]);
  const [showPicker,    setShowPicker]    = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [vehicleImage,  setVehicleImage]  = useState('');

  function formatPrice(raw: string) {
    const digits = raw.replace(/\D/g, '');
    return digits ? `PKR ${Number(digits).toLocaleString('en-PK')}` : '';
  }

  function handleVehicleSelect(v: Vehicle) {
    setBrand(v.make || 'Select Brand');
    setCarModel(v.model || '');
    setVariant(v.variant || '');
    setColor(v.color || 'Select Color');
    setYear(String(v.year) || '2026');
    setPrice(String(Math.round(v.price)));
    setSelectedLabel(`${v.make} ${v.model} ${v.variant}`.trim());
    const rawImg = v.images?.[0] || '';
    const resolved = rawImg ? (rawImg.startsWith('http') ? rawImg : `${SERVER}${rawImg}`) : '';
    setVehicleImage(resolved);
  }

  function handleNext() {
    router.push({
      pathname: '/financing-results' as any,
      params: { vehicleType, condition, city, brand, carModel, variant, color, year, price, dealership, vehicleImage },
    });
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* HEADER */}
        <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <ChevronLeft size={26} color={aC.isDark ? '#C9C6D0' : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>
            Auto<Text style={{ color: ORANGE }}>wizor</Text>
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { backgroundColor: aC.bg }]} keyboardShouldPersistTaps="handled">

          {/* PROMO BANNER */}
          <View style={{ marginBottom: 24 }}>
            <AskariBank />
          </View>

          {/* VEHICLE TYPE */}
          <Text style={[s.sectionTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Select Vehicle Type</Text>
          <View style={s.row}>
            <ToggleCard
              icon={<MaterialCommunityIcons name="car" size={26} color={vehicleType === 'cars' ? ORANGE : (aC.isDark ? '#F2F1F5' : '#64748b')} />}
              title="Cars"
              selected={vehicleType === 'cars'}
              onSelect={() => { setVehicleType('cars'); setSelectedLabel(''); setVehicleImage(''); }}
            />
            <ToggleCard
              icon={<MaterialCommunityIcons name="motorbike" size={28} color={vehicleType === 'bikes' ? ORANGE : (aC.isDark ? '#F2F1F5' : '#64748b')} />}
              title="Bikes"
              selected={vehicleType === 'bikes'}
              onSelect={() => { setVehicleType('bikes'); setSelectedLabel(''); setVehicleImage(''); }}
            />
          </View>

          {/* VEHICLE CONDITION */}
          <Text style={[s.sectionTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Vehicle Condition</Text>
          <View style={s.row}>
            <ConditionCard title="New Cars"  subtitle="Brand new Vehicle"  selected={condition === 'new'}  onSelect={() => { setCondition('new');  setSelectedLabel(''); setVehicleImage(''); }} />
            <ConditionCard title="Used Car"  subtitle="Pre-owned Vehicle"  selected={condition === 'used'} onSelect={() => { setCondition('used'); setSelectedLabel(''); setVehicleImage(''); }} />
          </View>

          {/* BASIC DETAILS */}
          <Text style={[s.bigTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Basic Details</Text>

          <FL>City</FL>
          <Dropdown value={city} onChange={setCity} options={CITIES} />

          <FL>Brand</FL>
          <Dropdown value={brand} onChange={setBrand} options={BRANDS} placeholder="Select Brand" />

          {/* SELECT CAR FROM DB */}
          <FL>Select your {vehicleType === 'bikes' ? 'Bike' : 'Car'}</FL>
          <TouchableOpacity
            style={[s.pickerBtn, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: aC.isDark ? 0 : 2 }]}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.85}
          >
            {aC.isDark ? (
              <SearchInputEffect />
            ) : (
              <>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              </>
            )}
            <Text style={[s.pickerTxt, { color: !selectedLabel ? (aC.isDark ? '#BAB6C4' : '#94a3b8') : (aC.isDark ? '#F2F1F5' : '#010a1f') }]} numberOfLines={1}>
              {selectedLabel || `Tap to select from database`}
            </Text>
            <Search size={16} color={ORANGE} />
          </TouchableOpacity>

          <FL>Variant</FL>
          <InputField value={variant} onChange={setVariant} placeholder="e.g. 1.2 Aspire CVT" />

          <FL>Color</FL>
          <Dropdown value={color} onChange={setColor} options={COLORS} placeholder="Select Color" />

          <FL>Year / Model</FL>
          <Dropdown value={year} onChange={setYear} options={YEARS} />

          <FL>Price (Without Holding Tax)</FL>
          <InputField
            value={formatPrice(price)}
            onChange={v => setPrice(v.replace(/\D/g, ''))}
            placeholder="PKR 0"
            keyboardType="numeric"
            priceStyle
          />

          <FL>Select your Car Dealership (Optional)</FL>
          <Dropdown value={dealership} onChange={setDealership} options={DEALERSHIP} />

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* FOOTER BUTTON */}
        <View style={[s.footer, { backgroundColor: aC.bg, borderTopWidth: aC.isDark ? 0 : 1, borderTopColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.88}>
            <LinearGradient
              colors={PRIMARY_BTN_COLORS as any}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={s.nextTxt}>Next</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* VEHICLE PICKER MODAL */}
      <VehiclePickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleVehicleSelect}
        vehicleType={vehicleType}
        condition={condition}
      />

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#010A1F' },
  scroll: { paddingHorizontal: 14, paddingBottom: 16 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10 },
  backBtn:     { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#fff' },

  sectionTitle: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 12, marginTop: 2 },
  bigTitle:     { color: '#fff', fontSize: 19, fontFamily: 'Poppins_500Medium', marginBottom: 12, marginTop: 4 },

  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },

  toggleCard:         { flex: 1, height: 88, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
  toggleCardActive:   { borderColor: ORANGE, backgroundColor: '#16234a' },
  toggleCardInactive: { borderColor: '#1e3a8a', backgroundColor: '#0e1a3d' },
  toggleTxt:          { color: '#fff', fontSize: 15, fontFamily: 'Poppins_500Medium' },

  condCard:         { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 10, height: 60, overflow: 'hidden' },
  condCardActive:   { borderColor: ORANGE, backgroundColor: '#16234a' },
  condCardInactive: { borderColor: '#1e3a8a', backgroundColor: '#0e1a3d' },
  condIcon:         { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1c2c5c', alignItems: 'center', justifyContent: 'center' },
  condTitle:        { color: '#fff', fontSize: 13.5, fontFamily: 'Poppins_500Medium' },
  condSub:          { color: '#94a3b8', fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 1 },

  fieldLabel: { color: '#cbd5e1', fontSize: 13.5, fontFamily: 'Poppins_400Regular', marginBottom: 8 },

  pickerBtn: { height: 46, borderRadius: 32, borderWidth: 1, borderColor: '#829fd0', backgroundColor: 'rgba(3,12,40,0.6)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, overflow: 'hidden', marginBottom: 16 },
  pickerTxt: { color: '#fff', fontSize: 13.5, fontFamily: 'Poppins_400Regular', flex: 1 },

  inputWrap: { height: 46, borderRadius: 32, borderWidth: 1, borderColor: '#829fd0', backgroundColor: 'rgba(3,12,40,0.6)', overflow: 'hidden', justifyContent: 'center', marginBottom: 12 },
  input:     { paddingHorizontal: 20, color: '#fff', fontSize: 13.5, fontFamily: 'Poppins_400Regular' },

  footer:  { paddingHorizontal: 14, paddingBottom: 36, paddingTop: 10 },
  nextBtn: { height: 46, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  nextTxt: { color: '#EDEBF0', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
