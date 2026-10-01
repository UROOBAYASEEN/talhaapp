import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { AppColors, useAppColors } from '@/constants/theme';
import DealerConfirmationModal from '@/components/shared/DealerConfirmationModal';

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

// Figma text colours
const TXT_HEAD  = '#E6E4EA';
const TXT_LABEL = '#D2CFD8';
const TXT_VAL   = '#BAB6C4';

// Rounded inner glow, equal on all four sides (selected cards / glass buttons)
function RingGlow({ radius = 16, peak = 0.45, rings = 10 }: { radius?: number; peak?: number; rings?: number }) {
  return (
    <>
      {Array.from({ length: rings }).map((_, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute', top: i, left: i, right: i, bottom: i,
            borderRadius: Math.max(radius - i, 0), borderWidth: 1,
            borderColor: `rgba(40,86,168,${(peak * Math.pow(1 - i / rings, 1.6)).toFixed(3)})`,
          }}
        />
      ))}
    </>
  );
}

function CheckIcon() {
  return <View style={s.check}><Ionicons name="checkmark" size={13} color="#ffffff" /></View>;
}
function CrossIcon() {
  return <View style={s.cross}><Ionicons name="close" size={14} color="#E5374B" /></View>;
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
        <Text style={[s.sectionTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>{title}</Text>
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
  const params = useLocalSearchParams<{ aId?: string; bId?: string; aData?: string; bData?: string; from?: string }>();
  const fromCompareVehicle = params.from === 'compareVehicle';
  const [a, setA] = useState<any>(null);
  const [b, setB] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [taxA, setTaxA] = useState<any>(null);
  const [taxB, setTaxB] = useState<any>(null);
  const [preferred, setPreferred] = useState<'a' | 'b'>('a');
  const [confirmVisible, setConfirmVisible] = useState(false);

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
          <Text style={[s.topTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Compare Variant</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Cards Row */}
        <View style={s.cardsRow}>
          {[left, right].map((car, idx) => (
            <LinearGradient key={idx} colors={aC.isDark ? ['#1A3268', '#9FAAC4', '#B07A66'] : ['rgba(3,42,105,0.12)', 'rgba(3,42,105,0.12)']} locations={aC.isDark ? [0, 0.55, 1] : undefined} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={s.carCardBorder}>
            <View style={[s.carCard, { borderWidth: 0, borderRadius: 13, backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
              {aC.isDark
                ? <LinearGradient colors={['#0B1D4A', '#0E2152', '#3A2F4A', '#7D4B3C']} locations={[0, 0.45, 0.75, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} />
                : <GlassInset />}
              <Image source={{ uri: car.img }} style={s.carImg} resizeMode="cover" />
              <View style={s.carBody}>
                <Text style={[s.carName, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={2}>{car.title}</Text>
                <View style={[s.carDivider, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.28)' : 'rgba(3,42,105,0.12)' }]} />
                <Text style={[s.carPrice, { color: aC.isDark ? '#CFCAD3' : '#475569' }]}>{typeof car.price === 'number' ? fmtPrice(car.price) : car.price}</Text>
              </View>
            </View>
            </LinearGradient>
          ))}
          <View style={s.vsWrap} pointerEvents="none"><Text style={s.vsBadge}>VS</Text></View>
        </View>

        {/* Overview */}
        <Section title="Overview">
          <View style={s.specRow}>
            <Text style={[s.specLabelCol, s.headTxt, { color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>Specification</Text>
            <Text style={[s.specValCol, s.headTxt, { color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>Variant 1</Text>
            <Text style={[s.specValCol, s.headTxt, { color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>Variant 2</Text>
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
            ['Seating Capacity', left.seating, right.seating],
            ['Top Speed', left.topSpeed, right.topSpeed],
          ].map(([label, v1, v2]: any) => (
            <View key={label} style={s.specRow}>
              <Text style={[s.specLabelCol, s.labelTxt, { color: aC.isDark ? TXT_LABEL : '#334155' }]}>{label}</Text>
              <Text style={[s.specValCol, s.valTxt, { color: aC.isDark ? TXT_VAL : '#475569' }]}>{v1}</Text>
              <Text style={[s.specValCol, s.valTxt, { color: aC.isDark ? TXT_VAL : '#475569' }]}>{v2}</Text>
            </View>
          ))}
        </Section>

        {/* Comfort & Convenience */}
        <Section title="Comfort & Convenience">
          <View style={s.featRow}>
            <Text style={[s.featLabelCol, s.headTxt, { color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>Feature</Text>
            <Text style={[s.featValCol, s.headTxt, { textAlign: 'center', color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>Variant 1</Text>
            <Text style={[s.featValCol, s.headTxt, { textAlign: 'center', color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>Variant 2</Text>
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
            <View key={f} style={s.featRow}>
              <Text style={[s.featLabelCol, s.labelTxt, { color: aC.isDark ? TXT_LABEL : '#334155' }]}>{f}</Text>
              <View style={s.featValCol}><CheckIcon /></View>
              <View style={s.featValCol}><CheckIcon /></View>
            </View>
          ))}
        </Section>

        {/* Safety Features */}
        <Section title="Safety Features">
          <View style={s.featRow}>
            <Text style={[s.featLabelCol, s.headTxt, { color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>Feature</Text>
            <Text style={[s.featValCol, s.headTxt, { textAlign: 'center', color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>Variant 1</Text>
            <Text style={[s.featValCol, s.headTxt, { textAlign: 'center', color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>Variant 2</Text>
          </View>
          {[
            { f: 'ABS', a: <CheckIcon />, b: <CheckIcon /> },
            { f: 'Airbags', a: <Text style={[s.airbagTxt, { color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>{isDemo ? '2' : (a?.airbags || '2')}</Text>, b: <Text style={[s.airbagTxt, { color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>{isDemo ? '7' : (b?.airbags || '2')}</Text> },
            { f: 'Electronic Stability Control', a: <CrossIcon />, b: <CheckIcon /> },
            { f: 'Hill Assist', a: <CrossIcon />, b: <CheckIcon /> },
            { f: 'ISOFIX Child Mount', a: <CheckIcon />, b: <CheckIcon /> },
          ].map((row) => (
            <View key={row.f} style={s.featRow}>
              <Text style={[s.featLabelCol, s.labelTxt, { color: aC.isDark ? TXT_LABEL : '#334155' }]}>{row.f}</Text>
              <View style={s.featValCol}>{row.a}</View>
              <View style={s.featValCol}>{row.b}</View>
            </View>
          ))}
        </Section>

        {/* Estimated Total Price */}
        <Section title="Estimated Total Price">
          <View style={s.priceRow}>
            <Text style={[s.priceLabelCol, s.priceHeadTxt, { color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>Price Details</Text>
            <Text style={[s.priceValCol, s.headTxt, { color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>Variant 1</Text>
            <Text style={[s.priceValCol, s.headTxt, { color: aC.isDark ? TXT_HEAD : '#010a1f' }]}>Variant 2</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={[s.priceLabelCol, s.priceLabelTxt, { color: aC.isDark ? TXT_VAL : '#334155' }]}>{'Estimated Total\n(Filer)'}</Text>
            <Text style={[s.priceValCol, s.priceValTxt, { color: aC.isDark ? TXT_VAL : '#475569' }]}>{estFilerA}</Text>
            <Text style={[s.priceValCol, s.priceValTxt, { color: aC.isDark ? TXT_VAL : '#475569' }]}>{estFilerB}</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={[s.priceLabelCol, s.priceLabelTxt, { color: aC.isDark ? TXT_VAL : '#334155' }]}>{'Estimated Total\n(Non-Filer)'}</Text>
            <Text style={[s.priceValCol, s.priceValTxt, { color: aC.isDark ? TXT_VAL : '#475569' }]}>{estNonFilerA}</Text>
            <Text style={[s.priceValCol, s.priceValTxt, { color: aC.isDark ? TXT_VAL : '#475569' }]}>{estNonFilerB}</Text>
          </View>
        </Section>

        {/* Select Preferred Variant */}
        <View style={[s.prefDivider, { backgroundColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]} />
        <Text style={[s.prefTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Select Preferred Variant</Text>
        {variantRows.map((row) => {
          const sel = preferred === row.key;
          return (
            <TouchableOpacity
              key={row.key}
              activeOpacity={0.85}
              onPress={() => setPreferred(row.key)}
              style={[s.variantCard, aC.isDark
                ? (sel
                    ? { backgroundColor: '#07122C', borderColor: '#8FAEE3', shadowColor: '#4F7FD0', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 }
                    : { backgroundColor: '#0D2152', borderColor: 'rgba(120,160,225,0.25)' })
                : { backgroundColor: '#ffffff', borderColor: sel ? ORANGE : 'rgba(3,42,105,0.12)' }]}
            >
              {aC.isDark ? (sel && <RingGlow radius={16} />) : <GlassInset />}
              <View style={[s.radioOuter, sel ? s.radioOuterSel : { borderColor: aC.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(3,42,105,0.3)' }]}>
                {sel && <View style={s.radioInner} />}
              </View>
              <Text style={[s.variantName, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>{row.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.variantMeta, { color: aC.isDark ? '#B9B6C3' : '#475569' }]}>{row.meta}</Text>
                  <Text style={[s.variantMeta, { color: aC.isDark ? '#B9B6C3' : '#475569' }]}>Delivery: {row.delivery}</Text>
                </View>
                <Text style={s.variantPrice}>{row.price}</Text>
                <Ionicons name="chevron-forward" size={18} color={ORANGE} style={{ marginLeft: 8, marginBottom: 1 }} />
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Call Dealer */}
        <TouchableOpacity style={s.callBtn} activeOpacity={0.88} onPress={handleCallDealer}>
          <LinearGradient colors={['#0B3585', '#7E4F5C', '#E8702A']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          <Ionicons name="call-outline" size={22} color="#fff" />
          <Text style={s.callTxt}>Call Dealer</Text>
        </TouchableOpacity>

        {/* Reserve Selected — shows dealer confirmation first */}
        <TouchableOpacity
          style={[s.reserveBtn, { backgroundColor: aC.isDark ? '#07142F' : '#ffffff', borderColor: aC.isDark ? '#7E9FD6' : 'rgba(3,42,105,0.14)' }]}
          activeOpacity={0.88}
          onPress={() => setConfirmVisible(true)}
        >
          {aC.isDark ? <RingGlow radius={28} peak={0.5} rings={14} /> : <GlassInset />}
          <Text style={[s.reserveTxt, { color: aC.isDark ? '#C9C6D0' : '#032a69' }]}>Reserve Selected {selectedIsBike ? 'bike' : 'car'}</Text>
        </TouchableOpacity>

        {/* Compare Vehicle flow — Buy New Car / Buy Used Car (Figma) */}
        {fromCompareVehicle && (
          <View style={s.buyWrap}>
            {[
              { label: 'Buy New Car',  route: '/buy/new-car' },
              { label: 'Buy Used Car', route: '/buy/used-car' },
            ].map(btn => (
              <TouchableOpacity key={btn.label} style={s.buyBtn} activeOpacity={0.88} onPress={() => router.push(btn.route as any)}>
                <LinearGradient colors={['#0B3585', '#7E4F5C', '#E8702A']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                <Text style={s.buyTxt}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Buy buttons — hidden per Figma (kept for later)
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
        */}
      </ScrollView>

      {/* Reserve confirmation — Call Dealer uses the existing call flow */}
      <DealerConfirmationModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        onCallDealer={() => { setConfirmVisible(false); handleCallDealer(); }}
        onCancel={() => { setConfirmVisible(false); handleReserveSelected(); }}
      />
    </SafeAreaView>
  );
}

const CARD_GAP = 34;

const s = StyleSheet.create({
  safe: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 },
  backBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 19, fontFamily: 'Poppins_500Medium' },

  /* Top car cards */
  cardsRow: { flexDirection: 'row', gap: CARD_GAP, paddingHorizontal: 16, paddingBottom: 22, position: 'relative' },
  carCardBorder: { flex: 1, borderRadius: 14, padding: 1 },
  carCard: { flex: 1, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  carImg: { width: '100%', height: 92 },
  carBody: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 10, alignItems: 'center' },
  carName: { fontSize: 12.5, fontFamily: 'Poppins_500Medium', textAlign: 'center', lineHeight: 17, minHeight: 34 },
  carDivider: { alignSelf: 'stretch', height: 1, marginTop: 8, marginBottom: 7 },
  carPrice: { fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  vsWrap: { position: 'absolute', left: 0, right: 0, top: 108, alignItems: 'center' },
  vsBadge: { color: ORANGE, fontSize: 15, fontFamily: 'Poppins_700Bold' },

  /* Sections */
  section: { borderTopWidth: 1, borderTopColor: BORDER, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium' },
  headTxt: { fontSize: 12.5, fontFamily: 'Poppins_400Regular' },
  headerRow: { borderBottomWidth: 0, paddingBottom: 8 },
  headerTxt: { flex: 1, color: DIM, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  labelTxt: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  valTxt: { fontSize: 12, fontFamily: 'Poppins_400Regular' },

  /* Overview — 3 left-aligned columns */
  specRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  specLabelCol: { flex: 1.45, paddingRight: 8 },
  specValCol: { flex: 1, paddingRight: 4 },

  /* Feature tables */
  featRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  featLabelCol: { flex: 1.45, paddingRight: 8 },
  featValCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#1D3B73', borderWidth: 1.5, borderColor: '#7393CC', alignItems: 'center', justifyContent: 'center' },
  cross: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#132A5C', alignItems: 'center', justifyContent: 'center' },
  airbagTxt: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },

  /* Estimated Total Price */
  priceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  priceLabelCol: { flex: 1.3, paddingRight: 8 },
  priceValCol: { flex: 1, paddingRight: 4 },
  priceHeadTxt: { fontSize: 14.5, fontFamily: 'Poppins_400Regular' },
  priceLabelTxt: { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 17 },
  priceValTxt: { fontSize: 12, fontFamily: 'Poppins_400Regular' },

  ctaWrap: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  ctaBtn: { height: 52, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  ctaTxt: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

  /* Select Preferred Variant */
  prefDivider: { height: 1, marginHorizontal: 20 },
  prefTitle: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_500Medium', paddingHorizontal: 20, marginTop: 14, marginBottom: 10 },
  variantCard: {
    marginHorizontal: 20, marginBottom: 12, borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, overflow: 'hidden',
  },
  variantName: { fontSize: 13.5, fontFamily: 'Poppins_500Medium', marginBottom: 2, marginRight: 34 },
  variantMeta: { fontSize: 9.5, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  variantPrice: { color: ORANGE, fontSize: 15, fontFamily: 'Poppins_500Medium' },
  radioOuter: {
    position: 'absolute', top: 10, right: 12, zIndex: 2,
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterSel: { borderWidth: 2, borderColor: '#DCE6F7', backgroundColor: '#1D3B73', shadowColor: '#8FB0E6', shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#ffffff' },
  callBtn: {
    marginHorizontal: 20, marginTop: 4, height: 54, borderRadius: 27,
    overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  callTxt: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  reserveBtn: {
    marginHorizontal: 20, marginTop: 12, height: 54, borderRadius: 27,
    borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  reserveTxt: { fontSize: 15, fontFamily: 'Poppins_500Medium' },
  buyWrap: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  buyBtn: { height: 50, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  buyTxt: { color: '#F2F1F5', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
