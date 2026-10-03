import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList,
  Image, Modal, ScrollView, StyleSheet, Text, Linking,
  TouchableOpacity, View, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors, useAppColors } from '@/constants/theme';
import DealerConfirmationModal from '@/components/shared/DealerConfirmationModal';
import { CtaPanelGlass, PRIMARY_BTN_COLORS, RingGlow } from '@/components/shared/FigmaEffects';

const { width: W } = Dimensions.get('window');

const BG     = '#010A1F';
const CARD   = '#131d38';
const ORANGE = '#e2671b';
const BLUE   = '#2563eb';
const WHITE  = '#f9fafc';
const MUTED  = '#baacb6';
const BORDER = 'rgba(255,255,255,0.1)';
const AMBER  = '#f59e0b';

// Exact vehicle-card effect from app/profile/saved.tsx
function SavedCardEffect() {
  const aC = useAppColors();
  if (aC.isDark) {
    return (
      <>
        <LinearGradient colors={['#16408880', 'transparent', 'transparent', '#16408880']} locations={[0, 0.08, 0.92, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <LinearGradient colors={['#16408880', 'transparent', 'transparent', '#16408880']} locations={[0, 0.05, 0.95, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      </>
    );
  }
  return (
    <>
      <LinearGradient colors={['rgba(3,42,105,0.03)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

// Selected variant glow: same navy tone as the saved card, equal on all four sides and rounded.
function SelectedVariantGlow({ radius = 18 }: { radius?: number }) {
  const aC = useAppColors();
  if (!aC.isDark) return <SavedCardEffect />;
  const RINGS = 10;
  const PEAK = 0.4; // slightly lighter than the saved card's 0.5 (#16408880)
  return (
    <>
      {Array.from({ length: RINGS }).map((_, i) => {
        const a = PEAK * Math.pow(1 - i / RINGS, 1.6);
        return (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute', top: i, left: i, right: i, bottom: i,
              borderRadius: Math.max(radius - i, 0),
              borderWidth: 1,
              borderColor: `rgba(22,64,136,${a.toFixed(3)})`,
            }}
          />
        );
      })}
    </>
  );
}

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

const SERVER_BASE = API_BASE.replace('/api/v1', '');
function imgUrl(url?: string) {
  if (!url || url.startsWith('file://')) return null;
  if (url.startsWith('http')) return url.replace(/http:\/\/[\d.]+:\d+/, SERVER_BASE);
  return `${SERVER_BASE}${url.startsWith('/') ? url : '/' + url}`;
}
function formatPrice(p: number) {
  if (p >= 10_000_000) return `PKR ${(p / 10_000_000).toFixed(2)} Crore`;
  if (p >= 100_000)    return `PKR ${(p / 100_000).toFixed(2)} Lacs`;
  return `PKR ${p.toLocaleString()}`;
}

const SERVICES = [
  { icon: 'business-outline'        as const, title: 'Apply for Auto Financing',             desc: 'Submit your financing application online in just a few easy steps.' },
  { icon: 'calendar-outline'        as const, title: 'Book Your Dream Car',                  desc: 'Reserve your preferred vehicle before delivery.' },
  { icon: 'shield-checkmark-outline'as const, title: 'Protect Your Vehicle with Insurance',  desc: 'Pick the Right Coverage and Get Insured Easily.' },
];

export default function CarDetailScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  // Came from Buy Used Car → Contact Dealer + Test Drive (Figma)
  const fromUsedCar = from === 'usedCar';
  // Came from Book a vehicle → same screen, bottom shows Contact Dealer + Test Drive (Book flow screens)
  const fromBook = from === 'book';
  const { token, user } = useAuth();

  const [vehicle,         setVehicle]         = useState<any>(null);
  const [loading,         setLoading]         = useState(true);
  const [imgIdx,          setImgIdx]          = useState(0);
  const [saved,           setSaved]           = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  // Other cars (different vehicles) to compare against the current one.
  const [otherCars, setOtherCars] = useState<any[]>([]);
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [openFeature,     setOpenFeature]     = useState<string>('exterior');
  const [tax,             setTax]             = useState<any>(null);
  const [reserving,       setReserving]       = useState(false);
  const [testDriving,     setTestDriving]     = useState(false);
  const [contacting,      setContacting]      = useState(false);
  const [confirmVisible,  setConfirmVisible]  = useState(false);
  const [callDone,        setCallDone]        = useState(false);
  const [ctaHeight,       setCtaHeight]       = useState(210);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    try {
      const h: any = token ? { Authorization: `Bearer ${token}` } : {};
      const [vRes, tRes] = await Promise.all([
        fetch(`${API_BASE}/vehicles/${id}`, { headers: h }),
        fetch(`${API_BASE}/vehicles/${id}/tax`, { headers: h }),
      ]);
      if (vRes.ok) { const d = await vRes.json(); setVehicle(d); setSaved(d.is_saved ?? false); loadOtherCars(d); }
      if (tRes.ok) setTax(await tRes.json());
    } catch { }
    finally { setLoading(false); }
  }

  // Other vehicles of the same category (excluding this one) for compare
  async function loadOtherCars(v: any) {
    try {
      const h: any = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/vehicles?category=${v.category || 'car'}&limit=10`, { headers: h });
      if (res.ok) {
        const d = await res.json();
        const items = d.items || d || [];
        setOtherCars(items.filter((o: any) => String(o.id) !== String(id)).slice(0, 6));
      }
    } catch { }
  }

  async function toggleSave() {
    if (!token) { Alert.alert('Login Required', 'Please login to save.'); return; }
    const res = await fetch(`${API_BASE}/vehicles/${id}/save`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setSaved(d.saved); }
  }

  async function handleContact() {
    if (!token) { Alert.alert('Login Required', 'Please login to contact dealer.'); return; }
    if (user?.id === vehicle?.seller_id) { Alert.alert('Info', 'This is your own listing.'); return; }
    setContacting(true);
    try {
      const res = await fetch(`${API_BASE}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to_user_id: vehicle.seller_id, content: `Hi! I'm interested in your ${vehicle.title}`, vehicle_id: id }),
      });
      const d = await res.json();
      if (res.ok && d.conversation_id)
        router.push({ pathname: '/chat-room/[id]', params: { id: d.conversation_id, name: vehicle.seller?.full_name || 'Dealer', vehicleId: String(id) } });
      else Alert.alert('Error', d.detail || 'Could not open chat.');
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setContacting(false); }
  }

  async function handleReserve() {
    if (!token) { Alert.alert('Login Required', 'Please login to reserve.'); return; }
    setReserving(true);
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ variant_name: vehicle?.variants?.[selectedVariant]?.name }),
      });
      const d = await res.json();
      Alert.alert('Reserved!', d.message || 'Vehicle reserved successfully.');
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setReserving(false); }
  }

  async function handleTestDrive() {
    if (!token) { Alert.alert('Login Required', 'Please login.'); return; }
    setTestDriving(true);
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}/test-drive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const d = await res.json();
      Alert.alert('Booked!', d.message || 'Test drive booked.');
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setTestDriving(false); }
  }

  function handleCall() {
    const ph = vehicle?.contact_phone || vehicle?.seller?.phone;
    if (!ph) { Alert.alert('Not Available', 'No phone number listed.'); return; }
    Linking.openURL(`tel:${ph}`);
  }

  if (loading)
    return <View style={{ flex: 1, backgroundColor: aC.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={ORANGE} size="large" /></View>;

  if (!vehicle)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: aC.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Ionicons name="alert-circle-outline" size={48} color={aC.isDark ? MUTED : '#64748b'} />
        <Text style={{ color: aC.isDark ? WHITE : '#010a1f', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }}>Vehicle not found</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: ORANGE, fontFamily: 'Poppins_500Medium' }}>Go Back</Text></TouchableOpacity>
      </SafeAreaView>
    );

  const images     = (vehicle.images || []).map((i: string) => imgUrl(i)).filter(Boolean);
  const hasImgs    = images.length > 0;
  const variants = (vehicle.variants && vehicle.variants.length > 0)
    ? vehicle.variants
    : [
        { name: vehicle.variant ? `${vehicle.variant} (Base)` : '1.2 MT',       cc: vehicle.engine_cc ? `${vehicle.engine_cc} cc` : '1199 cc', fuel: vehicle.fuel_type || 'Petrol', trans: 'Manual',    delivery: 'Immediate', price: vehicle.price },
        { name: vehicle.variant ? `${vehicle.variant} (Mid)` : '1.5 Aspire MT', cc: vehicle.engine_cc ? `${vehicle.engine_cc} cc` : '1498 cc', fuel: vehicle.fuel_type || 'Petrol', trans: 'Manual',    delivery: 'Immediate', price: vehicle.price },
        { name: vehicle.variant ? `${vehicle.variant} (Top)` : '1.5 Aspire CVT',cc: vehicle.engine_cc ? `${vehicle.engine_cc} cc` : '1498 cc',fuel: vehicle.fuel_type || 'Petrol', trans: 'Automatic', delivery: 'Immediate', price: vehicle.price },
      ];
  const isDealer   = vehicle.seller?.role === 'dealership_owner';
  const dealerName = vehicle.seller?.dealership_name || vehicle.seller?.full_name || 'Dealer';
  const sellerId   = vehicle?.seller_id ?? vehicle?.seller?.id;

  const safetyKw   = ['abs','airbag','brake','belt','stability','traction','parking'];
  const interiorKw = ['sunroof','leather','screen','display','ambient','speakers','audio'];
  const safetyF    = (vehicle.features || []).filter((f: string) => safetyKw.some(k => f.toLowerCase().includes(k)));
  const interiorF  = (vehicle.features || []).filter((f: string) => interiorKw.some(k => f.toLowerCase().includes(k)));
  const exteriorF  = (vehicle.features || []).filter((f: string) => !safetyKw.some(k => f.toLowerCase().includes(k)) && !interiorKw.some(k => f.toLowerCase().includes(k)));

  const featureSections = [
    { key: 'exterior', title: 'Exterior',              items: exteriorF.length ? exteriorF : ['Alloy Wheels'] },
    { key: 'interior', title: 'Interior',              items: interiorF.length ? interiorF : ['Leather Seats'] },
    { key: 'comfort',  title: 'Comfort & Convenience', items: exteriorF.length ? exteriorF : ['Cruise Control'] },
    { key: 'safety',   title: 'Safety Features',       items: safetyF.length   ? safetyF   : ['ABS Brakes'] },
  ];

  const filerTotal    = tax ? vehicle.price + tax.filer_tax     : null;
  const nonFilerTotal = tax ? vehicle.price + tax.non_filer_tax : null;

  const priceRows = [
    { label: 'Vehicle Price',                  value: formatPrice(vehicle.price),                             highlight: false },
    { label: 'Withholding Tax (Filer)',        value: tax ? formatPrice(tax.filer_tax)     : '—',             highlight: false },
    { label: 'Estimated Total (Filer)',        value: filerTotal    ? formatPrice(filerTotal)    : '—',       highlight: true  },
    { label: 'Withholding Tax (Non-Filer)',    value: tax ? formatPrice(tax.non_filer_tax) : '—',             highlight: false },
    { label: 'Estimated Total (Non-Filer)',    value: nonFilerTotal ? formatPrice(nonFilerTotal) : '—',       highlight: true  },
  ];

  const specs = [
    { label: 'City',            value: vehicle.city            || '—' },
    { label: 'Owner',           value: 'Open Invoice' },
    { label: 'Assembly',        value: vehicle.assembly        || 'Local' },
    { label: 'Engine Capacity', value: vehicle.engine_cc ? String(vehicle.engine_cc) : '—' },
    { label: 'Body Type',       value: vehicle.body_type       || '—' },
    { label: 'Color',           value: vehicle.color           || '—' },
    ...(vehicle.chassis_no ? [{ label: 'Chasis No.', value: vehicle.chassis_no }] : []),
  ];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: aC.bg }]} edges={["top"]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: ctaHeight, backgroundColor: aC.bg }}>

        {/* ── Hero Image ── */}
        <View style={s.heroWrap}>
          {hasImgs ? (
            <FlatList
              ref={flatRef} horizontal pagingEnabled
              data={images} keyExtractor={(_, i) => String(i)}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
              renderItem={({ item }) => <Image source={{ uri: item }} style={s.heroImg} resizeMode="cover" />}
            />
          ) : (
            <LinearGradient colors={aC.isDark ? ['#1a2440', '#0e1526'] : ['#eef2ff', '#f8fafc']} style={[s.heroImg, { alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="car-outline" size={64} color={aC.isDark ? MUTED : '#94a3b8'} />
            </LinearGradient>
          )}

          {/* Logo */}
          <View style={s.logoRow}>
            {aC.isDark ? (
              <>
                <Text style={s.logoW}>Auto</Text>
                <Text style={s.logoO}>wizor</Text>
              </>
            ) : (
              <Text style={{ fontSize: 18, fontFamily: 'Poppins_700Bold' }}><Text style={{ color: '#032a69' }}>Auto</Text><Text style={{ color: '#e2671b' }}>wizor</Text></Text>
            )}
          </View>

          {/* Back */}
          <TouchableOpacity style={[s.backBtn, { backgroundColor: aC.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={aC.isDark ? WHITE : '#010a1f'} />
          </TouchableOpacity>

          {/* Arrows */}
          {hasImgs && images.length > 1 && (
            <>
              <TouchableOpacity style={[s.arrowL, { backgroundColor: aC.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]} onPress={() => { const p = Math.max(imgIdx-1,0); flatRef.current?.scrollToIndex({index:p}); setImgIdx(p); }}>
                <Ionicons name="chevron-back" size={18} color={aC.isDark ? WHITE : '#010a1f'} />
              </TouchableOpacity>
              <TouchableOpacity style={[s.arrowR, { backgroundColor: aC.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]} onPress={() => { const p = Math.min(imgIdx+1,images.length-1); flatRef.current?.scrollToIndex({index:p}); setImgIdx(p); }}>
                <Ionicons name="chevron-forward" size={18} color={aC.isDark ? WHITE : '#010a1f'} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Body ── */}
        <View style={[s.body, { backgroundColor: aC.bg }]}>

          {/* Title */}
          <View style={s.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: aC.isDark ? WHITE : '#010a1f' }]}>
                {vehicle.title}
                <Text style={[s.yearBadge, { color: aC.isDark ? MUTED : '#475569' }]}> •{vehicle.year} {vehicle.condition === 'new' ? 'Brand New' : 'Used'}</Text>
              </Text>
            </View>
            <View style={s.iconRow}>
              <TouchableOpacity><Ionicons name="share-social-outline" size={18} color={ORANGE} /></TouchableOpacity>
              <TouchableOpacity onPress={toggleSave}>
                <Ionicons name={saved ? 'heart' : 'heart-outline'} size={18} color={ORANGE} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dealer + Verified */}
          <View style={s.dealerRow}>
            <Text style={[s.dealerName, { color: aC.isDark ? WHITE : '#010a1f' }]}>{dealerName}</Text>
            {isDealer && <Ionicons name="checkmark-circle" size={16} color="#3b82f6" style={{ marginLeft: 4 }} />}
          </View>

          {/* Rating */}
          <View style={s.ratingRow}>
            <Ionicons name="star" size={14} color={AMBER} />
            <Text style={s.ratingVal}>{vehicle.average_rating > 0 ? vehicle.average_rating : '4.9'}</Text>
            <Text style={[s.ratingCount, { color: aC.isDark ? MUTED : '#475569' }]}>({vehicle.review_count > 0 ? `${vehicle.review_count} Reviews` : '250+ Reviews'})</Text>
          </View>

          {/* Location + Price */}
          <View style={s.locPriceRow}>
            <View style={s.locRow}>
              <Ionicons name="location-outline" size={14} color={aC.isDark ? MUTED : '#64748b'} />
              <Text style={[s.locTxt, { color: aC.isDark ? MUTED : '#475569' }]}>{vehicle.city || 'Pakistan'}</Text>
            </View>
            <Text style={s.price}>{formatPrice(vehicle.price)}</Text>
          </View>

          {/* Spec Strip */}
          <View style={[s.specStrip, { borderTopColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)', borderBottomColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]}>
            <View style={s.specItem}>
              <View style={[s.specIconBox, { backgroundColor: aC.isDark ? 'rgba(226,103,27,0.1)' : '#eef2ff' }]}><Ionicons name="git-branch-outline" size={14} color={ORANGE} /></View>
              <Text style={[s.specTxt, { color: aC.isDark ? WHITE : '#010a1f' }]}>{vehicle.transmission || 'Automatic'}</Text>
            </View>
            <View style={[s.specSep, { backgroundColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]} />
            <View style={s.specItem}>
              <View style={[s.specIconBox, { backgroundColor: aC.isDark ? 'rgba(226,103,27,0.1)' : '#eef2ff' }]}><Ionicons name="water-outline" size={14} color={ORANGE} /></View>
              <Text style={[s.specTxt, { color: aC.isDark ? WHITE : '#010a1f' }]}>{vehicle.fuel_type || 'Petrol'}</Text>
            </View>
            <View style={[s.specSep, { backgroundColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]} />
            <View style={s.specItem}>
              <View style={[s.specIconBox, { backgroundColor: aC.isDark ? 'rgba(226,103,27,0.1)' : '#eef2ff' }]}><Ionicons name="speedometer-outline" size={14} color={ORANGE} /></View>
              <Text style={[s.specTxt, { color: aC.isDark ? WHITE : '#010a1f' }]}>{vehicle.engine_cc ? `${vehicle.engine_cc} cc` : '—'}</Text>
            </View>
          </View>

          {/* Price Breakdown */}
          <Text style={[s.secTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Price Breakdown</Text>
          {priceRows.map((row, i) => (
            <View key={i} style={[
              s.row,
              i < priceRows.length - 1 && [s.rowBorder, { borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }],
              row.highlight && { backgroundColor: aC.isDark ? 'rgba(226,103,27,0.08)' : 'rgba(226,103,27,0.08)', borderRadius: 10, paddingHorizontal: 10 },
            ]}>
              <Text style={[s.rowLabel, { color: aC.isDark ? MUTED : '#475569' }, row.highlight && { color: ORANGE, fontFamily: 'Poppins_600SemiBold' }]}>
                {row.label}
              </Text>
              <Text style={[s.rowVal, { color: aC.isDark ? WHITE : '#010a1f' }, row.highlight && { color: ORANGE, fontSize: 12, fontFamily: 'Poppins_700Bold' }]}>
                {row.value}
              </Text>
            </View>
          ))}

          {/* ── Compare Variants ── */}
          {variants.length > 0 && (
            <Text style={[s.secTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Compare Variants</Text>
          )}


          {/* ── Variant Cards ── */}
          {variants.length > 0 && variants.map((v: any, i: number) => {
            const sel = selectedVariant === i;
            return (
              <TouchableOpacity key={i} onPress={() => setSelectedVariant(i)} activeOpacity={0.85} style={{ marginTop: 10 }}>
                {/* Saved-card effect only on selected variants; others keep the original card look */}
                <View style={sel ? [s.savedOuterCard, {
                  backgroundColor: aC.isDark ? '#010A1F' : '#ffffff',
                  borderColor: aC.isDark ? '#82a5d5' : ORANGE,
                  shadowColor: aC.isDark ? '#638ed0' : 'rgba(3,42,105,0.12)',
                  shadowOpacity: aC.isDark ? 0.15 : 0.08,
                  shadowRadius: aC.isDark ? 5 : 10,
                  elevation: aC.isDark ? 2 : 8,
                }] : undefined}>
                <View style={sel
                  ? [s.variantCard2, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderWidth: 0, borderRadius: 18, overflow: 'hidden' }]
                  : [s.variantCard2, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2, overflow: 'hidden' }]}>
                  {sel ? <SelectedVariantGlow radius={18} /> : <GlassInset />}
                  {/* Radio top-right */}
                  <View style={[s.radio2, { borderColor: aC.isDark ? MUTED : 'rgba(3,42,105,0.2)' }, sel && s.radio2Sel]}>
                    {sel && <View style={s.radio2Dot} />}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.variantName2, { color: aC.isDark ? WHITE : '#010a1f' }]}>{v.name}</Text>
                      <Text style={[s.variantMeta, { color: aC.isDark ? MUTED : '#475569' }]}>{v.cc}  •  {v.fuel}  •  {v.trans}</Text>
                      <Text style={[s.variantMeta, { color: aC.isDark ? MUTED : '#475569' }]}>Delivery: {v.delivery || 'Immediate'}</Text>
                    </View>
                    <Text style={[s.variantPrice2, { paddingBottom: 2 }]}>{v.price ? `Rs ${Number(v.price).toLocaleString()}` : formatPrice(vehicle.price)}</Text>
                  </View>
                </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* ── Compare with a different car ── */}
          <TouchableOpacity style={s.selBtn} activeOpacity={0.88} onPress={() => setShowCarPicker(true)}>
            <LinearGradient colors={['#0b3a82', '#7a4a4a', '#e2671b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Text style={s.selBtnTxt}>Compare with Another Car</Text>
          </TouchableOpacity>

          {/* ── Specification ── */}
          <Text style={[s.secTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Specification</Text>
          {specs.map((row, i) => (
            <View key={i} style={[s.row, i < specs.length - 1 && [s.rowBorder, { borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]]}>
              <Text style={[s.rowLabel, { color: aC.isDark ? MUTED : '#475569' }]}>{row.label}</Text>
              <Text style={[s.rowVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>{row.value}</Text>
            </View>
          ))}

          {/* ── Featured Accordion ── */}
          <Text style={[s.secTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Featured</Text>
          {featureSections.map((sec, i) => (
            <View key={sec.key} style={i < featureSections.length - 1 ? [s.rowBorder, { borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }] : undefined}>
              <TouchableOpacity
                style={s.accordRow}
                onPress={() => setOpenFeature(openFeature === sec.key ? '' : sec.key)}
              >
                <Text style={[s.accordTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>{sec.title}</Text>
                <Ionicons name={openFeature === sec.key ? 'chevron-up' : 'chevron-down'} size={16} color={aC.isDark ? MUTED : '#64748b'} />
              </TouchableOpacity>
              {openFeature === sec.key && sec.items.map((f: string, fi: number) => (
                <View key={fi} style={s.featRow}>
                  <View style={[s.featDot, { backgroundColor: aC.isDark ? '#16213f' : '#eef2ff' }]}><View style={s.featDotInner} /></View>
                  <Text style={[s.featTxt, { color: aC.isDark ? WHITE : '#010a1f' }]}>{f}</Text>
                </View>
              ))}
            </View>
          ))}

          {/* ── Browse More Services ── */}
          <Text style={[s.secTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Browse More Services</Text>
          {SERVICES.map(sv => (vehicle?.category === 'bike' ? { ...sv, title: sv.title.replace('Dream Car', 'Dream Bike') } : sv)).map((item, i) => (
            <TouchableOpacity key={i} style={[s.serviceCard, { backgroundColor: aC.isDark ? '#061B4A' : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2, overflow: 'hidden' }]} activeOpacity={0.85}>
              <GlassInset />
              <View style={[s.serviceIcon, { backgroundColor: aC.isDark ? 'rgba(226,103,27,0.1)' : '#eef2ff' }]}>
                <Ionicons name={item.icon} size={20} color={ORANGE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.serviceTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>{item.title}</Text>
                <Text style={[s.serviceDesc, { color: aC.isDark ? MUTED : '#475569' }]}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={aC.isDark ? MUTED : '#64748b'} />
            </TouchableOpacity>
          ))}


        </View>
      </ScrollView>
      {/* ── Fixed Bottom CTA ── */}
      <View onLayout={(e) => setCtaHeight(Math.ceil(e.nativeEvent.layout.height))} style={[s.ctaBox, { backgroundColor: aC.isDark ? '#0f1830' : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)', shadowColor: aC.isDark ? '#000' : 'rgba(3,42,105,0.12)' }]}>
        {aC.isDark && <CtaPanelGlass />}
        <View style={[s.ctaHandle, { backgroundColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]} />

        {fromUsedCar || fromBook ? (
          /* ── USED CAR / BOOK A VEHICLE: Contact Dealer + Test Drive ── */
          <>
            <TouchableOpacity style={[s.ctaPrimary, s.dealerCtaBtn]} onPress={() => sellerId && (fromBook
              ? router.push({ pathname: '/book/dealer-profile', params: { id: sellerId, category: vehicle?.category || 'car' } } as any)
              : router.push({ pathname: '/buy/dealer-profile', params: { id: sellerId, from: 'usedCar', category: vehicle?.category || '' } } as any))} activeOpacity={0.88}>
              <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
              <Text style={[s.ctaPrimaryTxt, s.dealerCtaTxt, { color: '#F2F1F5' }]}>Contact Dealer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.ctaSecondary, s.dealerCtaBtn, { backgroundColor: aC.isDark ? '#07142F' : '#ffffff', borderColor: aC.isDark ? '#7E9FD6' : 'rgba(3,42,105,0.12)' }]} onPress={() => router.push({ pathname: fromBook ? '/book/test-drive' : '/buy/test-drive', params: { id } } as any)} activeOpacity={0.88}>
              {aC.isDark ? <RingGlow radius={26} peak={0.5} rings={12} /> : <GlassInset />}
              <Text style={[s.ctaSecondaryTxt, { fontSize: 16, fontFamily: 'Poppins_400Regular', color: aC.isDark ? '#C9C6D0' : '#010a1f' }]}>Test Drive</Text>
            </TouchableOpacity>
          </>
        ) : isDealer ? (
          /* ── DEALER: Contact Dealer + Reserve + Test Drive ── */
          <>
            <TouchableOpacity style={[s.ctaPrimary, s.dealerCtaBtn]} onPress={() => sellerId && router.push({ pathname: '/buy/dealer-profile', params: { id: sellerId, category: vehicle?.category || '' } } as any)} activeOpacity={0.88}>
              <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
              {contacting ? <ActivityIndicator color={WHITE} /> : <Text style={[s.ctaPrimaryTxt, s.dealerCtaTxt, { color: '#F2F1F5' }]}>Contact Dealer</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[s.ctaSecondary, s.dealerCtaBtn, { backgroundColor: aC.isDark ? '#07142F' : '#ffffff', borderColor: aC.isDark ? '#7E9FD6' : 'rgba(3,42,105,0.12)' }]} onPress={() => {
              if (callDone) {
                router.push({ pathname: '/buy/reserve', params: { id, variantName: variants[selectedVariant]?.name } } as any);
              } else {
                setConfirmVisible(true);
              }
            }} activeOpacity={0.88}>
              {aC.isDark ? <RingGlow radius={26} peak={0.5} rings={12} /> : <GlassInset />}
              {reserving ? <ActivityIndicator color={aC.isDark ? WHITE : '#010a1f'} /> : <Text style={[s.ctaSecondaryTxt, s.dealerCtaTxt, { color: aC.isDark ? '#C9C6D0' : '#010a1f' }]}>{vehicle?.category === 'bike' ? 'Reserve your bike' : 'Reserve your car'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[s.ctaSecondary, s.dealerCtaBtn, { backgroundColor: aC.isDark ? '#07142F' : '#ffffff', borderColor: aC.isDark ? '#7E9FD6' : 'rgba(3,42,105,0.12)' }]} onPress={() => router.push({ pathname: '/buy/test-drive', params: { id } } as any)} activeOpacity={0.88}>
              {aC.isDark ? <RingGlow radius={26} peak={0.5} rings={12} /> : <GlassInset />}
              <Text style={[s.ctaSecondaryTxt, s.dealerCtaTxt, { color: aC.isDark ? '#C9C6D0' : '#010a1f' }]}>Test Drive</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ── INDIVIDUAL SELLER: same as vehicle/[id].tsx footer ── */
          <>
            <TouchableOpacity activeOpacity={0.85} onPress={handleCall}>
              <LinearGradient
                colors={['#0d2f7a', '#7a3f5a', '#e25500']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.sellerCallBtn}
              >
                <Text style={s.ctaPrimaryTxt}>Call Seller</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.sellerContactRow}>
              <TouchableOpacity style={s.sellerContactItem} onPress={() => {
                const ph = vehicle?.contact_phone || vehicle?.seller?.phone;
                if (!ph) { Alert.alert('Not Available', 'No phone number listed.'); return; }
                Linking.openURL(`sms:${ph}`);
              }}>
                <Ionicons name="chatbubble-ellipses-outline" size={26} color={ORANGE} />
                <Text style={[s.sellerContactTxt, { color: aC.isDark ? MUTED : '#475569' }]}>SMS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.sellerContactItem} onPress={() => {
                const ph = vehicle?.contact_phone || vehicle?.seller?.phone;
                if (!ph) { Alert.alert('Not Available', 'No WhatsApp number listed.'); return; }
                Linking.openURL(`https://wa.me/${ph.replace(/\D/g, '')}`);
              }}>
                <View style={s.waCircle}>
                  <Ionicons name="logo-whatsapp" size={16} color={WHITE} />
                </View>
                <Text style={[s.sellerContactTxt, { color: aC.isDark ? MUTED : '#475569' }]}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.sellerContactItem} onPress={() => {
                const email = vehicle?.seller?.email;
                if (!email) { Alert.alert('Not Available', 'No email listed.'); return; }
                Linking.openURL(`mailto:${email}?subject=Inquiry about ${vehicle?.title}`);
              }}>
                <Ionicons name="mail-outline" size={26} color={ORANGE} />
                <Text style={[s.sellerContactTxt, { color: aC.isDark ? MUTED : '#475569' }]}>Email</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ── Dealer confirmation — shows first on Reserve press ── */}
      <DealerConfirmationModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        onCancel={() => {
          setConfirmVisible(false);
          router.push({ pathname: '/buy/reserve', params: { id, variantName: variants[selectedVariant]?.name } } as any);
        }}
        onCallDealer={() => {
          const ph = vehicle?.contact_phone || vehicle?.seller?.phone;
          setCallDone(true);
          setConfirmVisible(false);
          if (ph) {
            Linking.openURL(`tel:${String(ph).replace(/\D/g, '')}`);
          } else {
            Alert.alert('Not Available', 'No dealer phone number listed. You can continue with reservation.');
          }
        }}
      />

      {/* ── Pick another car to compare with ── */}
      <Modal visible={showCarPicker} transparent animationType="fade" onRequestClose={() => setShowCarPicker(false)}>
        <View style={s.selOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowCarPicker(false)} />
          <View style={[s.selCard, {
            backgroundColor: aC.isDark ? '#010A1F' : '#ffffff',
            borderColor: aC.isDark ? '#82a5d5' : 'rgba(3,42,105,0.12)',
            shadowColor: aC.isDark ? '#638ed0' : 'rgba(3,42,105,0.12)',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: aC.isDark ? 0.15 : 0.08,
            shadowRadius: aC.isDark ? 5 : 10,
            elevation: aC.isDark ? 2 : 8,
          }]}>
            <SavedCardEffect />

            <Text style={[s.selTitle, { color: aC.isDark ? '#d6cfd6' : '#010a1f' }]}>Select Car to Compare</Text>
            <TouchableOpacity style={s.selClose} onPress={() => setShowCarPicker(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={26} color={aC.isDark ? '#d6cfd6' : '#010a1f'} />
            </TouchableOpacity>

            {otherCars.length === 0 ? (
              <Text style={{ color: aC.isDark ? '#BAB6C4' : '#64748b', fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginVertical: 24 }}>
                No other cars found to compare.
              </Text>
            ) : (
              <ScrollView style={{ marginTop: 12, maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {otherCars.map((o: any) => {
                  const oImg = imgUrl(o.images?.[0]);
                  return (
                    <TouchableOpacity
                      key={String(o.id)}
                      activeOpacity={0.85}
                      style={[s.pickRow, { borderColor: aC.isDark ? 'rgba(120,160,225,0.35)' : 'rgba(3,42,105,0.12)', backgroundColor: aC.isDark ? '#07142f' : '#f8fafc' }]}
                      onPress={() => {
                        setShowCarPicker(false);
                        router.push({ pathname: '/compare-result', params: { aId: String(id), bId: String(o.id) } } as any);
                      }}
                    >
                      {oImg
                        ? <Image source={{ uri: oImg }} style={s.pickImg} resizeMode="cover" />
                        : <View style={[s.pickImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: aC.isDark ? '#0d1e3d' : '#eef2f7' }]}>
                            <Ionicons name="car-outline" size={22} color="#929DB1" />
                          </View>}
                      <View style={{ flex: 1 }}>
                        <Text style={[s.pickTitle, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={1}>{o.title || `${o.make || ''} ${o.model || ''}`.trim()}</Text>
                        <Text style={[s.pickPrice, { color: aC.isDark ? '#BAB6C4' : '#64748b' }]}>{o.price ? `Rs ${Number(o.price).toLocaleString()}` : ''}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#e2671b" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  selOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  selCard:      { width: '100%', maxWidth: 400, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 34, overflow: 'hidden' },
  selTitle:     { textAlign: 'center', fontSize: 19, fontFamily: 'Poppins_500Medium' },
  selClose:     { position: 'absolute', top: 10, right: 12, zIndex: 2 },
  selBadgeRow:  { height: 80, marginTop: 8, marginHorizontal: -14, alignItems: 'center', justifyContent: 'center' },
  selDash:      { position: 'absolute', left: 0, right: 0, top: '50%', borderTopWidth: 1, borderStyle: 'dashed' },
  selBadge:     { width: 78, height: 78, borderRadius: 39, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  selLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  selLabelIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#c9c2cc', alignItems: 'center', justifyContent: 'center' },
  selLabel:     { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  selField:     { height: 48, borderRadius: 24, borderWidth: 1, paddingHorizontal: 20, justifyContent: 'center', overflow: 'hidden' },
  selFieldTxt:  { fontSize: 12.5, fontFamily: 'Poppins_500Medium' },
  selBtn:       { height: 48, borderRadius: 24, marginTop: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  selBtnTxt:    { color: '#f2eef2', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  pickRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 10, marginTop: 10 },
  pickImg:      { width: 64, height: 48, borderRadius: 10, overflow: 'hidden' },
  pickTitle:    { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  pickPrice:    { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },

  root: { flex: 1, backgroundColor: BG },

  heroWrap: { position: 'relative' },
  heroImg:  { width: W, height: 230 },
  logoRow:  { position: 'absolute', top: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  logoW:    { color: WHITE,  fontSize: 18, fontFamily: 'Poppins_700Bold' },
  logoO:    { color: ORANGE, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  backBtn:  { position: 'absolute', left: 8, top: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  arrowL:   { position: 'absolute', left: 8, top: '42%', width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  arrowR:   { position: 'absolute', right: 8, top: '42%', width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },

  body: { paddingHorizontal: 16, paddingTop: 14 },

  titleRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title:     { color: WHITE, fontSize: 18, fontFamily: 'Poppins_700Bold', lineHeight: 26, flex: 1 },
  yearBadge: { color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  iconRow:   { flexDirection: 'row', gap: 14, paddingTop: 2 },

  dealerRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  dealerName: { color: WHITE, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  ratingVal:  { color: AMBER, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  ratingCount:{ color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  locPriceRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  locRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locTxt:     { color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  price:      { color: ORANGE, fontSize: 16, fontFamily: 'Poppins_700Bold' },

  specStrip:  { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER, marginTop: 14, paddingVertical: 10 },
  specItem:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  specIconBox:{ width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(226,103,27,0.1)', alignItems: 'center', justifyContent: 'center' },
  specTxt:    { color: WHITE, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  specSep:    { width: 1, height: 18, backgroundColor: BORDER },

  secTitle: { color: WHITE, fontSize: 16, fontFamily: 'Poppins_700Bold', marginTop: 20, marginBottom: 10 },

  row:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11 },
  rowBorder: { borderBottomWidth: 1, borderColor: BORDER },
  rowLabel:  { color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  rowVal:    { color: WHITE, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  /* Fixed bottom CTA */
  ctaBox:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0f1830', borderTopWidth: 1, borderColor: BORDER, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 20 },
  ctaHandle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 4 },
  ctaPrimary:          { height: 52, borderRadius: 30, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexDirection: 'row' },
  sellerCallBtn:       { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  sellerContactRow:    { flexDirection: 'row', justifyContent: 'space-around' },
  sellerContactItem:   { alignItems: 'center', gap: 4 },
  sellerContactTxt:    { color: MUTED, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  waCircle:            { width: 28, height: 28, borderRadius: 14, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
  ctaPrimaryTxt:   { color: WHITE, fontSize: 15, fontFamily: 'Poppins_700Bold' },
  ctaSecondary:    { height: 52, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', backgroundColor: 'rgba(3,12,40,0.6)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ctaSecondaryTxt: { color: WHITE, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  dealerCtaBtn:    { borderRadius: 26 },
  dealerCtaTxt:    { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },

  /* Variant cards new */
  savedOuterCard:  { borderRadius: 20, borderWidth: 1, shadowOffset: { width: 0, height: 0 }, overflow: 'hidden' },
  variantCard2:    { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, position: 'relative', backgroundColor: 'rgba(3,12,40,0.6)', borderWidth: 1, overflow: 'hidden' },
  variantName2:    { color: WHITE, fontSize: 13, fontFamily: 'Poppins_700Bold', marginBottom: 1, marginRight: 30 },
  variantMeta:     { color: MUTED, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  variantPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  variantPrice2:   { color: ORANGE, fontSize: 14, fontFamily: 'Poppins_700Bold' },
  radio2:          { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: MUTED, alignItems: 'center', justifyContent: 'center' },
  radio2Sel:       { borderColor: '#3b82f6' },
  radio2Dot:       { width: 9, height: 9, borderRadius: 5, backgroundColor: '#3b82f6' },

  /* Accordion */
  accordRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
  accordTitle: { color: WHITE, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  featRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 12 },
  featDot:     { width: 30, height: 30, borderRadius: 15, backgroundColor: '#16213f', alignItems: 'center', justifyContent: 'center' },
  featDotInner:{ width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE },
  featTxt:     { color: WHITE, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  /* Services */
  serviceCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#061B4A', borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  serviceIcon:  { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(226,103,27,0.1)', alignItems: 'center', justifyContent: 'center' },
  serviceTitle: { color: WHITE, fontSize: 13, fontFamily: 'Poppins_700Bold' },
  serviceDesc:  { color: MUTED, fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16, marginTop: 2 },

  /* Compare table */
  cmpRow:          { flexDirection: 'row', borderBottomWidth: 1, borderColor: BORDER },
  cmpLabelCell:    { width: 100, paddingHorizontal: 12, paddingVertical: 11, justifyContent: 'center', backgroundColor: 'rgba(3,12,40,0.9)' },
  cmpLabel:        { color: MUTED, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  cmpHeaderCell:   { width: 130, paddingHorizontal: 12, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: CARD, borderLeftWidth: 1, borderColor: BORDER },
  cmpHeaderCellSel:{ backgroundColor: 'rgba(59,130,246,0.12)' },
  cmpHeaderTxt:    { color: WHITE, fontSize: 11, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  cmpCell:         { width: 130, paddingHorizontal: 12, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderColor: BORDER },
  cmpCellSel:      { backgroundColor: 'rgba(59,130,246,0.05)' },
  cmpVal:          { color: WHITE, fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center' },

  dealerBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 10, marginBottom: 6 },
  dealerBtnTxt: { flex: 1, color: ORANGE, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});
