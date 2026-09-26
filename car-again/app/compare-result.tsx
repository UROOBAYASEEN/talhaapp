import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { AppColors, useAppColors } from '@/constants/theme';

const BG = '#010A1F';
const BORDER = 'rgba(255,255,255,0.10)';
const DIM = '#8b93ab';
const ORANGE = '#e8792b';
const BLUE = '#2f6fed';

const SERVER = API_BASE.replace('/api/v1', '');
function imgUrl(u?: string) {
  if (!u) return null;
  if (u.startsWith('http')) return u;
  return `${SERVER}${u}`;
}
function fmtPrice(p: any) {
  if (p == null) return '—';
  const n = Number(p);
  if (n >= 10000000) return `PKR ${(n / 10000000).toFixed(1)} Lacacs`;
  if (n >= 100000) return `PKR ${(n / 100000).toFixed(1)} Lacacs`;
  return `PKR ${n.toLocaleString()}`;
}

function GlassInset() {
  const aC = useAppColors();
  if (!aC.isDark) {
    return (
      <>
        <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      </>
    );
  }
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  const aC = useAppColors();
  const [open, setOpen] = useState(true);
  return (
    <View style={[s.section, { borderTopColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}>
      <TouchableOpacity style={s.sectionHeader} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <Text style={[s.sectionTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={ORANGE} />
      </TouchableOpacity>
      {open && <View>{children}</View>}
    </View>
  );
}

function SpecHeader() {
  const aC = useAppColors();
  return (
    <View style={[s.specRow, s.headerRow, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(3,42,105,0.06)' }]}>
      <Text style={[s.headerTxt, { color: aC.isDark ? DIM : '#475569' }]}>Specification</Text>
      <Text style={[s.headerTxt, { textAlign: 'center', color: aC.isDark ? DIM : '#475569' }]}>Honda City</Text>
      <Text style={[s.headerTxt, { textAlign: 'center', color: aC.isDark ? DIM : '#475569' }]}>Toyota Corolla</Text>
    </View>
  );
}

export default function CompareResult() {
  const router = useRouter();
  const aC = useAppColors();
  const params = useLocalSearchParams<{ aId?: string; bId?: string; aData?: string; bData?: string }>();
  const [a, setA] = useState<any>(null);
  const [b, setB] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [taxA, setTaxA] = useState<any>(null);
  const [taxB, setTaxB] = useState<any>(null);
  const [preferred, setPreferred] = useState<'a' | 'b'>('a');

  useEffect(() => {
    (async () => {
      try {
        // Try to parse passed JSON first
        if (params.aData && params.bData) {
          try { setA(JSON.parse(String(params.aData))); } catch {}
          try { setB(JSON.parse(String(params.bData))); } catch {}
          setLoading(false);
          return;
        }
        if (params.aId && params.bId) {
          const [ra, rb] = await Promise.all([fetch(`${API_BASE}/vehicles/${params.aId}`), fetch(`${API_BASE}/vehicles/${params.bId}`)]);
          if (ra.ok) setA(await ra.json());
          if (rb.ok) setB(await rb.json());
          // fetch tax
          try {
            const [ta, tb] = await Promise.all([fetch(`${API_BASE}/vehicles/${params.aId}/tax`), fetch(`${API_BASE}/vehicles/${params.bId}/tax`)]);
            if (ta.ok) setTaxA(await ta.json());
            if (tb.ok) setTaxB(await tb.json());
          } catch {}
        } else {
          // fallback to static demo (HTML ke exact values)
          setA(null);
          setB(null);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const isDemo = !a || !b;
  // Demo static values matching the HTML
  const demoA = {
    title: 'Honda City 1.2 Aspire CVT',
    price: 6300000,
    year: 2024,
    body_type: 'Sedan',
    fuel_type: 'Petrol',
    transmission: 'CVT',
    engine: '1.2L i-VTEC',
    displacement: '1199 cc',
    horsepower: '89 HP',
    torque: '110 Nm',
    mileageCity: '11-13 km/L',
    mileageHigh: '16-18 km/L',
    seating: '5',
    topSpeed: '180 km/h',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/2023_Honda_Civic_Sport_Touring.jpg/640px-2023_Honda_Civic_Sport_Touring.jpg/640px-2023_Honda_Civic_Sport_Touring.jpg',
  };
  const demoB = {
    title: 'Toyota Corolla Altis 1.8',
    price: 5950000,
    year: 2024,
    body_type: 'Sedan',
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    engine: '1.8L Dual VVT-i',
    displacement: '1798 cc',
    horsepower: '138 HP',
    torque: '173 Nm',
    mileageCity: '10-12 km/L',
    mileageHigh: '15-17 km/L',
    seating: '5',
    topSpeed: '195 km/h',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/2020_Toyota_Corolla_Icon_Tech_VVT-i_Hybrid_1.8.jpg/640px-2020_Toyota_Corolla_Icon_Tech_VVT-i_Hybrid_1.8.jpg/640px-2020_Toyota_Corolla_Icon_Tech_VVT-i_Hybrid_1.8.jpg',
  };

  const left = isDemo ? demoA : {
    title: a?.title || `${a?.make || ''} ${a?.model || ''}`.trim() || 'Vehicle 1',
    price: a?.price,
    year: a?.year || '—',
    body_type: a?.body_type || '—',
    fuel_type: a?.fuel_type || '—',
    transmission: a?.transmission || '—',
    engine: a?.engine_cc ? `${(a.engine_cc/1000).toFixed(1)}L` : '—',
    displacement: a?.engine_cc ? `${a.engine_cc} cc` : '—',
    horsepower: a?.horsepower || '—',
    torque: a?.torque || '—',
    mileageCity: a?.mileage ? `${a.mileage} km/L` : '—',
    mileageHigh: '—',
    seating: a?.seating || '5',
    topSpeed: a?.top_speed || '—',
    img: imgUrl(a?.images?.[0]) || demoA.img,
  };
  const right = isDemo ? demoB : {
    title: b?.title || `${b?.make || ''} ${b?.model || ''}`.trim() || 'Vehicle 2',
    price: b?.price,
    year: b?.year || '—',
    body_type: b?.body_type || '—',
    fuel_type: b?.fuel_type || '—',
    transmission: b?.transmission || '—',
    engine: b?.engine_cc ? `${(b.engine_cc/1000).toFixed(1)}L` : '—',
    displacement: b?.engine_cc ? `${b.engine_cc} cc` : '—',
    horsepower: b?.horsepower || '—',
    torque: b?.torque || '—',
    mileageCity: b?.mileage ? `${b.mileage} km/L` : '—',
    mileageHigh: '—',
    seating: b?.seating || '5',
    topSpeed: b?.top_speed || '—',
    img: imgUrl(b?.images?.[0]) || demoB.img,
  };

  const filerA = taxA ? taxA.vehicle_price + taxA.filer_tax : (typeof left.price === 'number' ? Math.round(left.price * 1.015) : null);
  const nonFilerA = taxA ? taxA.vehicle_price + taxA.non_filer_tax : (typeof left.price === 'number' ? Math.round(left.price * 1.03) : null);
  const filerB = taxB ? taxB.vehicle_price + taxB.filer_tax : (typeof right.price === 'number' ? Math.round(right.price * 1.015) : null);
  const nonFilerB = taxB ? taxB.vehicle_price + taxB.non_filer_tax : (typeof right.price === 'number' ? Math.round(right.price * 1.03) : null);
  // demo exact from HTML if isDemo
  const estFilerA = isDemo ? 'Rs 5,782,000' : (filerA ? `Rs ${filerA.toLocaleString()}` : fmtPrice(left.price));
  const estNonFilerA = isDemo ? 'Rs 5,852,000' : (nonFilerA ? `Rs ${nonFilerA.toLocaleString()}` : fmtPrice(left.price));
  const estFilerB = isDemo ? 'Rs 5,906,500' : (filerB ? `Rs ${filerB.toLocaleString()}` : fmtPrice(right.price));
  const estNonFilerB = isDemo ? 'Rs 5,979,500' : (nonFilerB ? `Rs ${nonFilerB.toLocaleString()}` : fmtPrice(right.price));

  // Preferred variant (image wala bottom section)
  const selected = preferred === 'a' ? a : b;
  const selectedIsBike = !isDemo && selected?.category === 'bike';
  const variantRows = isDemo
    ? [
        { key: 'a' as const, name: '1.2 MT', meta: '1199 cc • Petrol • Manual', delivery: 'Immediate', price: 'Rs 5,667,000' },
        { key: 'b' as const, name: '1.5 Aspire MT', meta: '1498 cc • Petrol • Manual', delivery: 'Immediate', price: 'Rs 5,667,000' },
      ]
    : ([
        { key: 'a' as const, v: a },
        { key: 'b' as const, v: b },
      ] as const).map(({ key, v }: any) => ({
        key,
        name: v?.variant || v?.title || `${v?.make || ''} ${v?.model || ''}`.trim() || (key === 'a' ? 'Vehicle 1' : 'Vehicle 2'),
        meta: `${v?.engine_cc ? `${v.engine_cc} cc` : ''}${v?.engine_cc && v?.fuel_type ? ' • ' : ''}${v?.fuel_type ? String(v.fuel_type).charAt(0).toUpperCase() + String(v.fuel_type).slice(1) : ''}${v?.transmission ? ` • ${v.transmission}` : ''}` || '—',
        delivery: 'Immediate',
        price: typeof v?.price === 'number' ? `Rs ${Number(v.price).toLocaleString()}` : fmtPrice(v?.price),
      }));

  function handleCallDealer() {
    const raw = selected?.seller?.phone || selected?.contact_phone || '';
    const ph = String(raw).replace(/\D/g, '');
    if (!ph) {
      Alert.alert('Not Available', 'Dealer phone number is not listed.');
      return;
    }
    Linking.openURL(`tel:${ph}`);
  }

  function handleReserveSelected() {
    const id = selected?.id || (preferred === 'a' ? params.aId : params.bId);
    if (!id) {
      Alert.alert('Not Available', 'Please select a vehicle first.');
      return;
    }
    router.push({ pathname: '/buy/reserve', params: { id: String(id) } } as any);
  }

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]}>
        <ActivityIndicator color={ORANGE} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28, backgroundColor: aC.bg }}>
        {/* Topbar */}
        <View style={[s.topbar, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={aC.isDark ? "#fff" : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[s.topTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Compare Variant</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Cards Row */}
        <View style={s.cardsRow}>
          <View style={[s.vsBadgeWrap, { backgroundColor: aC.bg, borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]}><Text style={s.vsBadge}>VS</Text></View>
          <View style={[s.carCard, { backgroundColor: aC.isDark ? '#16213c' : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
            {!aC.isDark && <GlassInset />}
            {aC.isDark && <LinearGradient colors={['#16213c', '#2a2440', '#3a2f4a']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFillObject} />}
            <Image source={{ uri: left.img }} style={s.carImg} resizeMode="contain" />
            <Text style={[s.carName, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{left.title}</Text>
            <Text style={[s.carPrice, { color: aC.isDark ? DIM : '#475569' }]}>{typeof left.price === 'number' ? fmtPrice(left.price) : left.price}</Text>
          </View>
          <View style={[s.carCard, { backgroundColor: aC.isDark ? '#16213c' : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
            {!aC.isDark && <GlassInset />}
            {aC.isDark && <LinearGradient colors={['#16213c', '#2f2438', '#4a3324']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFillObject} />}
            <Image source={{ uri: right.img }} style={s.carImg} resizeMode="contain" />
            <Text style={[s.carName, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{right.title}</Text>
            <Text style={[s.carPrice, { color: aC.isDark ? DIM : '#475569' }]}>{typeof right.price === 'number' ? fmtPrice(right.price) : right.price}</Text>
          </View>
        </View>

        {/* Overview */}
        <Section title="Overview">
          <View style={[s.specRow, s.headerRow, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(3,42,105,0.06)' }]}>
            <Text style={[s.headerTxt, { color: aC.isDark ? DIM : '#475569' }]}>Specification</Text>
            <Text style={[s.headerTxt, { textAlign: 'center', color: aC.isDark ? DIM : '#475569' }]} numberOfLines={1}>{isDemo ? 'Honda City' : (a?.make || 'Vehicle 1')}</Text>
            <Text style={[s.headerTxt, { textAlign: 'center', color: aC.isDark ? DIM : '#475569' }]} numberOfLines={1}>{isDemo ? 'Toyota Corolla' : (b?.make || 'Vehicle 2')}</Text>
          </View>
          {[
            ['Price', typeof left.price === 'number' ? fmtPrice(left.price) : left.price, typeof right.price === 'number' ? fmtPrice(right.price) : right.price],
            ['Year', String(left.year), String(right.year)],
            ['Body Type', left.body_type, right.body_type],
            ['Fuel Type', left.fuel_type, right.fuel_type],
            ['Transmission', left.transmission, right.transmission],
            ['Engine', left.engine, right.engine],
            ['Displacement', left.displacement, right.displacement],
            ['Horsepower', left.horsepower, right.horsepower],
            ['Torque', left.torque, right.torque],
            ['Mileage (City)', left.mileageCity, right.mileageCity],
            ['Mileage (Highway)', left.mileageHigh, right.mileageHigh],
            ['Seating Capacity', left.seating, right.seating, true],
            ['Top Speed', left.topSpeed, right.topSpeed],
          ].map(([label, v1, v2, strong]: any) => (
            <View key={label} style={[s.specRow, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(3,42,105,0.06)' }]}>
              <Text style={[s.labelTxt, { color: aC.isDark ? DIM : '#475569' }]}>{label}</Text>
              <Text style={[s.valTxt, { color: aC.isDark ? '#fff' : '#010a1f' }, strong && s.strong]}>{v1}</Text>
              <Text style={[s.valTxt, { color: aC.isDark ? '#fff' : '#010a1f' }, strong && s.strong]}>{v2}</Text>
            </View>
          ))}
        </Section>

        {/* Comfort & Convenience */}
        <Section title="Comfort & Convenience">
          <View style={[s.featRow, s.headerRow, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(3,42,105,0.06)' }]}>
            <Text style={[s.headerTxt, { color: aC.isDark ? DIM : '#475569' }]}>Feature</Text>
            <Text style={[s.headerTxt, { textAlign: 'center', color: aC.isDark ? DIM : '#475569' }]}>{isDemo ? 'Honda City' : 'Vehicle 1'}</Text>
            <Text style={[s.headerTxt, { textAlign: 'center', color: aC.isDark ? DIM : '#475569' }]}>{isDemo ? 'Toyota Corolla' : 'Vehicle 2'}</Text>
          </View>
          {[
            'Air Conditioning',
            'Power Steering',
            'Power Windows',
            'Keyless Entry',
            'Push Start',
            'Cruise Control',
            'Multimedia System',
            'Navigation',
            'Rear Camera',
          ].map((f) => (
            <View key={f} style={[s.featRow, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(3,42,105,0.06)' }]}>
              <Text style={[s.labelTxt, { color: aC.isDark ? DIM : '#475569' }]}>{f}</Text>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><View style={s.check}><Ionicons name="checkmark" size={12} color={BLUE} /></View></View>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><View style={s.check}><Ionicons name="checkmark" size={12} color={BLUE} /></View></View>
            </View>
          ))}
        </Section>

        {/* Safety Features */}
        <Section title="Safety Features">
          <View style={[s.featRow, s.headerRow, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(3,42,105,0.06)' }]}>
            <Text style={[s.headerTxt, { color: aC.isDark ? DIM : '#475569' }]}>Feature</Text>
            <Text style={[s.headerTxt, { textAlign: 'center', color: aC.isDark ? DIM : '#475569' }]}>{isDemo ? 'Honda City' : 'Vehicle 1'}</Text>
            <Text style={[s.headerTxt, { textAlign: 'center', color: aC.isDark ? DIM : '#475569' }]}>{isDemo ? 'Toyota Corolla' : 'Vehicle 2'}</Text>
          </View>
          <View style={[s.featRow, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(3,42,105,0.06)' }]}><Text style={[s.labelTxt, { color: aC.isDark ? DIM : '#475569' }]}>ABS</Text><View style={{ flex: 1, alignItems: 'center' }}><View style={s.check}><Ionicons name="checkmark" size={12} color={BLUE} /></View></View><View style={{ flex: 1, alignItems: 'center' }}><View style={s.check}><Ionicons name="checkmark" size={12} color={BLUE} /></View></View></View>
          <View style={[s.featRow, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(3,42,105,0.06)' }]}><Text style={[s.labelTxt, { color: aC.isDark ? DIM : '#475569' }]}>Airbags</Text><Text style={[s.valTxt, { textAlign: 'center', color: aC.isDark ? '#fff' : '#010a1f' }]}>{isDemo ? '2' : (a?.airbags || '2')}</Text><Text style={[s.valTxt, { textAlign: 'center', color: aC.isDark ? '#fff' : '#010a1f' }]}>{isDemo ? '7' : (b?.airbags || '2')}</Text></View>
          <View style={[s.featRow, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(3,42,105,0.06)' }]}><Text style={[s.labelTxt, { color: aC.isDark ? DIM : '#475569' }]}>Electronic Stability Control</Text><View style={{ flex: 1, alignItems: 'center' }}><View style={s.cross}><Ionicons name="close" size={12} color="#ef4444" /></View></View><View style={{ flex: 1, alignItems: 'center' }}><View style={s.check}><Ionicons name="checkmark" size={12} color={BLUE} /></View></View></View>
          <View style={[s.featRow, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(3,42,105,0.06)' }]}><Text style={[s.labelTxt, { color: aC.isDark ? DIM : '#475569' }]}>Hill Assist</Text><View style={{ flex: 1, alignItems: 'center' }}><View style={s.cross}><Ionicons name="close" size={12} color="#ef4444" /></View></View><View style={{ flex: 1, alignItems: 'center' }}><View style={s.check}><Ionicons name="checkmark" size={12} color={BLUE} /></View></View></View>
          <View style={[s.featRow, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(3,42,105,0.06)' }]}><Text style={[s.labelTxt, { color: aC.isDark ? DIM : '#475569' }]}>ISOFIX Child Mount</Text><View style={{ flex: 1, alignItems: 'center' }}><View style={s.check}><Ionicons name="checkmark" size={12} color={BLUE} /></View></View><View style={{ flex: 1, alignItems: 'center' }}><View style={s.check}><Ionicons name="checkmark" size={12} color={BLUE} /></View></View></View>
        </Section>

        {/* Estimated Total Price */}
        <Section title="Estimated Total Price" />
        <View style={[s.priceTable, { borderTopColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}>
          <View style={[s.priceRow, s.headerRow, { borderBottomColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.06)' }]}><Text style={[s.headerTxt, { color: aC.isDark ? DIM : '#475569' }]}>Price Details</Text><Text style={[s.headerTxt, { textAlign: 'center', color: aC.isDark ? DIM : '#475569' }]}>Vehicle 1</Text><Text style={[s.headerTxt, { textAlign: 'center', color: aC.isDark ? DIM : '#475569' }]}>Vehicle 2</Text></View>
          <View style={[s.priceRow, { borderBottomColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.06)' }]}><Text style={[s.labelTxt, { color: aC.isDark ? DIM : '#475569' }]}>Estimated Total (Filer)</Text><Text style={[s.valTxt, { textAlign: 'center', color: aC.isDark ? '#fff' : '#010a1f' }]}>{estFilerA}</Text><Text style={[s.valTxt, { textAlign: 'center', color: aC.isDark ? '#fff' : '#010a1f' }]}>{estFilerB}</Text></View>
          <View style={[s.priceRow, { borderBottomColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.06)' }]}><Text style={[s.labelTxt, { color: aC.isDark ? DIM : '#475569' }]}>Estimated Total (Non-Filer)</Text><Text style={[s.valTxt, { textAlign: 'center', color: aC.isDark ? '#fff' : '#010a1f' }]}>{estNonFilerA}</Text><Text style={[s.valTxt, { textAlign: 'center', color: aC.isDark ? '#fff' : '#010a1f' }]}>{estNonFilerB}</Text></View>
        </View>

        {/* Select Preferred Variant */}
        <Text style={[s.prefTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Select Preferred Variant</Text>
        {variantRows.map((row) => {
          const sel = preferred === row.key;
          return (
            <TouchableOpacity
              key={row.key}
              activeOpacity={0.85}
              onPress={() => setPreferred(row.key)}
              style={[s.variantCard, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: sel ? ORANGE : (aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)') }]}
            >
              <GlassInset />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.variantName, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{row.name}</Text>
                  <Text style={[s.variantMeta, { color: aC.isDark ? DIM : '#475569' }]}>{row.meta}</Text>
                  <Text style={[s.variantMeta, { color: aC.isDark ? DIM : '#475569' }]}>Delivery: {row.delivery}</Text>
                </View>
                <Text style={s.variantPrice}>{row.price}</Text>
                <View style={[s.radioOuter, sel && s.radioOuterSel]}>
                  {sel && <View style={s.radioInner} />}
                </View>
                <Ionicons name="chevron-forward" size={16} color={ORANGE} style={{ marginLeft: 6 }} />
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Call Dealer */}
        <TouchableOpacity style={s.callBtn} activeOpacity={0.88} onPress={handleCallDealer}>
          <LinearGradient colors={[AppColors.gradientStart, AppColors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          <Ionicons name="call-outline" size={18} color="#fff" />
          <Text style={s.callTxt}>Call Dealer</Text>
        </TouchableOpacity>

        {/* Reserve Selected */}
        <TouchableOpacity
          style={[s.reserveBtn, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.14)' }]}
          activeOpacity={0.88}
          onPress={handleReserveSelected}
        >
          <GlassInset />
          <Text style={[s.reserveTxt, { color: aC.isDark ? '#fff' : '#032a69' }]}>Reserve Selected {selectedIsBike ? 'bike' : 'car'}</Text>
        </TouchableOpacity>

        <View style={s.ctaWrap}>
          <TouchableOpacity
            style={s.ctaBtn}
            activeOpacity={0.88}
            onPress={() => {
              const id = a?.id || params.aId;
              if (id) router.push({ pathname: '/buy/car-detail', params: { id: String(id) } } as any);
              else router.push('/buy/used-car' as any);
            }}
          >
            <LinearGradient colors={[AppColors.gradientStart, AppColors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Text style={s.ctaTxt} numberOfLines={1}>
              Buy {isDemo ? 'Honda City' : (a?.title || `${a?.make || ''} ${a?.model || ''}`.trim() || 'Vehicle 1').slice(0, 22)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.ctaBtn}
            activeOpacity={0.88}
            onPress={() => {
              const id = b?.id || params.bId;
              if (id) router.push({ pathname: '/buy/car-detail', params: { id: String(id) } } as any);
              else router.push('/buy/used-car' as any);
            }}
          >
            <LinearGradient colors={[AppColors.gradientStart, AppColors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Text style={s.ctaTxt} numberOfLines={1}>
              Buy {isDemo ? 'Toyota Corolla' : (b?.title || `${b?.make || ''} ${b?.model || ''}`.trim() || 'Vehicle 2').slice(0, 22)}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },
  backBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: '#fff', fontSize: 19, fontFamily: 'Poppins_600SemiBold' },
  cardsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 22, position: 'relative' },
  vsBadgeWrap: { position: 'absolute', top: 52, left: '50%', marginLeft: -18, backgroundColor: BG, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, zIndex: 2, borderWidth: 1, borderColor: BORDER },
  vsBadge: { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_700Bold' },
  carCard: { flex: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  carImg: { width: '100%', height: 70, marginBottom: 10 },
  carName: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', lineHeight: 18 },
  carPrice: { color: DIM, fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  section: { borderTopWidth: 1, borderTopColor: BORDER, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  specRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  featRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  priceRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER, alignItems: 'center' },
  headerRow: { borderBottomWidth: 0, paddingBottom: 8 },
  headerTxt: { flex: 1, color: DIM, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  labelTxt: { flex: 1, color: DIM, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  valTxt: { flex: 1, color: '#fff', fontSize: 12, fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  strong: { fontFamily: 'Poppins_700Bold' },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(47,111,237,0.15)', borderWidth: 1.5, borderColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  cross: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1.5, borderColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  priceTable: { paddingHorizontal: 20, paddingTop: 4, borderTopWidth: 1, borderTopColor: BORDER, marginTop: -1 },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  ctaBtn: { height: 52, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  ctaTxt: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

  /* Select Preferred Variant (image wala bottom) */
  prefTitle: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold', paddingHorizontal: 20, marginTop: 18, marginBottom: 10 },
  variantCard: {
    marginHorizontal: 20, marginBottom: 10, borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12, overflow: 'hidden',
  },
  variantName: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  variantMeta: { fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  variantPrice: { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_700Bold', marginRight: 8 },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  radioOuterSel: { borderColor: '#fff' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  callBtn: {
    marginHorizontal: 20, marginTop: 12, height: 52, borderRadius: 30,
    overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  callTxt: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  reserveBtn: {
    marginHorizontal: 20, marginTop: 12, height: 52, borderRadius: 30,
    borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  reserveTxt: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
});
