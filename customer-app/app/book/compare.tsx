// Figma: Compare Variant (Book flow)
// Params: id + a + b  → two variants of one listing
//         aId + bId   → two different listings
import { useAppColors, withLightStyles, LIGHT_POP_SHADOW } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { CheckBadge, G, Glass, GlassButton, GlowBackground, GradientButton, ScreenHeader } from '@/components/shared/GlowUI';
import { authHeaders, buildVariants, fmtLac, fmtRs, imgUrl } from '@/components/book/common';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 32 - 34) / 2;

type Side = {
  vehicleId: string; variantName: string; vehName: string; title: string; price?: number; img: string | null;
  year?: string; body?: string; fuel?: string; trans?: string; engine?: string; cc?: string;
  hp?: string; torque?: string; mileageCity?: string; mileageHigh?: string; seats?: string; topSpeed?: string;
  features: string[]; airbags?: string; filer?: number; nonFiler?: number; phone?: string; meta: string; delivery: string;
};

const cap = (x?: string) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : undefined);
const str = (x: any, unit = '') => (x || x === 0 ? `${x}${unit}` : undefined);

function toSide(v: any, tax: any, variantIdx?: number): Side {
  const vr = variantIdx != null ? buildVariants(v)[variantIdx] : undefined;
  const price = vr?.price ?? v.price;
  const rate = (k: 'filer_tax' | 'non_filer_tax') => (tax && v.price ? tax[k] / v.price : undefined);
  const fr = rate('filer_tax'), nr = rate('non_filer_tax');
  const cc = vr?.cc || (v.engine_cc ? `${v.engine_cc} cc` : undefined);
  const title = vr && vr.name !== v.title
    ? (vr.name.toLowerCase().includes(String(v.make || '').toLowerCase()) ? vr.name : `${v.make || ''} ${v.model || ''} ${vr.name}`.trim())
    : v.title;
  const feats: string[] = (vr?.features && vr.features.length ? vr.features : v.features) || [];
  const airbagFeat = feats.find(f => /airbag/i.test(f));
  return {
    vehicleId: v.id, variantName: vr?.name || v.variant || v.title, vehName: `${v.make || ''} ${v.model || ''}`.trim() || v.title, title, price,
    img: imgUrl(v.images?.[0]),
    year: str(v.year), body: cap(v.body_type), fuel: vr?.fuel || cap(v.fuel_type), trans: vr?.trans || cap(v.transmission),
    engine: v.engine || v.engine_type || (v.engine_cc ? `${(v.engine_cc / 1000).toFixed(1)}L` : undefined),
    cc, hp: str(v.horsepower, typeof v.horsepower === 'number' ? ' HP' : ''), torque: str(v.torque, typeof v.torque === 'number' ? ' Nm' : ''),
    mileageCity: str(v.mileage_city || v.fuel_average, ' km/L'), mileageHigh: str(v.mileage_highway, ' km/L'),
    seats: str(v.seating || v.seating_capacity), topSpeed: str(v.top_speed, typeof v.top_speed === 'number' ? ' km/h' : ''),
    features: feats,
    airbags: str(v.airbags) || (airbagFeat ? (airbagFeat.match(/\d+/)?.[0] || '✓') : undefined),
    filer: fr != null && price ? Math.round(price * (1 + fr)) : undefined,
    nonFiler: nr != null && price ? Math.round(price * (1 + nr)) : undefined,
    phone: v.contact_phone || v.seller?.phone,
    meta: [cc, vr?.fuel || cap(v.fuel_type), vr?.trans || cap(v.transmission)].filter(Boolean).join(' • '),
    delivery: vr?.delivery || 'Immediate',
  };
}

const COMFORT: [string, RegExp][] = [
  ['Air Conditioning', /air ?condition|climate|\bac\b/i],
  ['Power Steering', /power steering|eps/i],
  ['Power Windows', /power window/i],
  ['Keyless Entry', /keyless|smart key|smart entry/i],
  ['Push Start', /push start|push button|start\/stop/i],
  ['Cruise Control', /cruise/i],
  ['Multimedia System', /multimedia|infotainment|touch ?screen|android auto|carplay/i],
  ['Navigation', /navigation|gps/i],
  ['Rear Camera', /rear camera|reverse camera|back camera|camera/i],
];
const SAFETY: [string, RegExp | null][] = [
  ['ABS', /\babs\b|anti-?lock/i],
  ['Airbags', null],
  ['Electronic Stability Control', /stability|\besc\b|\bvsc\b|\besp\b/i],
  ['Hill Assist', /hill/i],
  ['ISOFIX Child Mount', /isofix/i],
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const aC = useAppColors();
  const s = aC.isDark ? s_dark : s_light;
  const [open, setOpen] = useState(true);
  return (
    <View style={s.section}>
      <TouchableOpacity style={s.secHead} onPress={() => setOpen(o => !o)} activeOpacity={0.8}>
        <Text style={s.secTitle}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={G.orange} />
      </TouchableOpacity>
      {open && children}
    </View>
  );
}

function Row({ l, a, b, head, center }: { l: string; a: React.ReactNode; b: React.ReactNode; head?: boolean; center?: boolean }) {
  const aC = useAppColors();
  const s = aC.isDark ? s_dark : s_light;
  const cell = (x: React.ReactNode) =>
    typeof x === 'string' || x == null
      ? <Text style={[head ? s.headTxt : s.valTxt, center && { textAlign: 'center' }]}>{x ?? '—'}</Text>
      : x;
  return (
    <View style={s.row}>
      <Text style={[s.labelTxt, head && s.headTxt]}>{l}</Text>
      <View style={[s.col, center && { alignItems: 'center' }]}>{cell(a)}</View>
      <View style={[s.col, center && { alignItems: 'center' }]}>{cell(b)}</View>
    </View>
  );
}

export default function BookCompare() {
  const aC = useAppColors();
  const s = aC.isDark ? s_dark : s_light;
  const router = useRouter();
  const { token } = useAuth();
  const p = useLocalSearchParams<{ id?: string; a?: string; b?: string; aId?: string; bId?: string }>();
  const [A, setA] = useState<Side | null>(null);
  const [B, setB] = useState<Side | null>(null);
  const [loading, setLoading] = useState(true);
  const [pref, setPref] = useState<'a' | 'b'>('a');

  useEffect(() => {
    (async () => {
      try {
        const h = authHeaders(token);
        const get = async (id: string) => {
          const [vr, tr] = await Promise.all([fetch(`${API_BASE}/vehicles/${id}`, { headers: h }), fetch(`${API_BASE}/vehicles/${id}/tax`, { headers: h })]);
          return { v: vr.ok ? await vr.json() : null, t: tr.ok ? await tr.json() : null };
        };
        if (p.id) {
          const { v, t } = await get(p.id);
          if (v) { setA(toSide(v, t, Number(p.a ?? 0))); setB(toSide(v, t, Number(p.b ?? 1))); }
        } else if (p.aId && p.bId) {
          const [x, y] = await Promise.all([get(p.aId), get(p.bId)]);
          if (x.v) setA(toSide(x.v, x.t));
          if (y.v) setB(toSide(y.v, y.t));
        }
      } catch { }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <GlowBackground themed><ActivityIndicator color={G.orange} style={{ marginTop: 120 }} /></GlowBackground>;
  if (!A || !B) {
    return (
      <GlowBackground themed>
        <SafeAreaView style={{ flex: 1 }}>
          <ScreenHeader title={!p.id && p.aId && p.bId ? 'Compare Vehicle' : 'Compare Variant'} />
          <Text style={[s.valTxt, { textAlign: 'center', marginTop: 60 }]}>Could not load vehicles to compare.</Text>
        </SafeAreaView>
      </GlowBackground>
    );
  }

  // Compare Vehicle screen se (aId/bId) → vehicle compare; vehicle-detail ke variants se (id/a/b) → variant compare
  const isVehicleCompare = !p.id && !!(p.aId && p.bId);
  const colA = isVehicleCompare ? (A.vehName || 'Vehicle 1') : 'Variant 1';
  const colB = isVehicleCompare ? (B.vehName || 'Vehicle 2') : 'Variant 2';
  const has = (side: Side, re: RegExp) => (side.features.length ? <CheckBadge ok={side.features.some(f => re.test(f))} /> : '—');
  const selected = pref === 'a' ? A : B;

  return (
    <GlowBackground themed>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title={isVehicleCompare ? 'Compare Vehicle' : 'Compare Variant'} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>

          {/* Cards */}
          <View style={s.cards}>
            {[A, B].map((c, i) => (
              <React.Fragment key={i}>
                {i === 1 && <Text style={s.vs}>VS</Text>}
                <LinearGradient colors={['#5E78B0', '#7E86A3', '#9A6E62']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={s.cardBorder}>
                  <LinearGradient colors={['#0A1C4C', '#0E2152', '#3A2F4A', '#704A42']} locations={[0, 0.45, 0.75, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={s.card}>
                    {c.img
                      ? <Image source={{ uri: c.img }} style={s.cardImg} resizeMode="contain" />
                      : <View style={[s.cardImg, { alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="car-sport-outline" size={42} color={aC.isDark ? G.muted : '#4b5563'} /></View>}
                    <Text style={s.cardName} numberOfLines={2}>{c.title}</Text>
                    <Text style={s.cardPrice}>{fmtLac(c.price, true)}</Text>
                  </LinearGradient>
                </LinearGradient>
              </React.Fragment>
            ))}
          </View>

          <Section title="Overview">
            <Row head l="Specification" a={colA} b={colB} />
            <Row l="Price" a={fmtLac(A.price, true)} b={fmtLac(B.price, true)} />
            <Row l="Year" a={A.year} b={B.year} />
            <Row l="Body Type" a={A.body} b={B.body} />
            <Row l="Fuel Type" a={A.fuel} b={B.fuel} />
            <Row l="Transmission" a={A.trans} b={B.trans} />
            <Row l="Engine" a={A.engine} b={B.engine} />
            <Row l="Displacement" a={A.cc} b={B.cc} />
            <Row l="Horsepower" a={A.hp} b={B.hp} />
            <Row l="Torque" a={A.torque} b={B.torque} />
            <Row l="Mileage (City)" a={A.mileageCity} b={B.mileageCity} />
            <Row l="Mileage (Highway)" a={A.mileageHigh} b={B.mileageHigh} />
            <Row l="Seating Capacity" a={A.seats} b={B.seats} />
            <Row l="Top Speed" a={A.topSpeed} b={B.topSpeed} />
          </Section>

          <Section title="Comfort & Convenience">
            <Row head center l="Feature" a={colA} b={colB} />
            {COMFORT.map(([l, re]) => <Row key={l} center l={l} a={has(A, re)} b={has(B, re)} />)}
          </Section>

          <Section title="Safety Features">
            <Row head center l="Feature" a={colA} b={colB} />
            {SAFETY.map(([l, re]) => re
              ? <Row key={l} center l={l} a={has(A, re)} b={has(B, re)} />
              : <Row key={l} center l={l} a={A.airbags} b={B.airbags} />)}
          </Section>

          <Section title="Estimated Total Price">
            <Row head l="Price Details" a={colA} b={colB} />
            <Row l="Estimated Total (Filer)" a={fmtRs(A.filer)} b={fmtRs(B.filer)} />
            <Row l="Estimated Total (Non-Filer)" a={fmtRs(A.nonFiler)} b={fmtRs(B.nonFiler)} />
          </Section>

          {/* Select Preferred Variant */}
          <Text style={s.prefTitle}>Select Preferred Variant</Text>
          {([['a', A], ['b', B]] as const).map(([k, c]) => {
            const sel = pref === k;
            return (
              <TouchableOpacity key={k} activeOpacity={0.88} onPress={() => setPref(k)} style={[s.pref, !sel && { backgroundColor: aC.isDark ? '#0B2358' : '#ffffff' }]}>
                {sel && <Glass radius={18} blur={20} />}
                <View style={{ flex: 1 }}>
                  <Text style={s.prefName} numberOfLines={1}>{c.variantName}</Text>
                  <Text style={s.prefMeta} numberOfLines={1}>{c.meta || '—'}</Text>
                  <Text style={s.prefMeta}>Delivery: {c.delivery}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 10 }}>
                  <View style={[s.radio, sel && s.radioOn]}>{sel && <View style={s.radioDot} />}</View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={s.prefPrice}>{fmtRs(c.price)}</Text>
                    <Ionicons name="chevron-forward" size={18} color={G.orange} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <GradientButton
            title="Call Dealer"
            height={58}
            fontSize={19}
            style={{ marginTop: 14 }}
            icon={<Ionicons name="call-outline" size={24} color={aC.isDark ? '#fff' : '#000000'} />}
            onPress={() => {
              const ph = String(selected.phone || '').replace(/[^\d+]/g, '');
              if (!ph) { Alert.alert('Not Available', 'Dealer phone number is not listed.'); return; }
              Linking.openURL(`tel:${ph}`);
            }}
          />
          <GlassButton
            title="Reserve Selected car"
            height={58}
            fontSize={19}
            style={{ marginTop: 14 }}
            onPress={() => router.push({ pathname: '/book/reserve', params: { id: selected.vehicleId, variantName: selected.variantName } } as any)}
          />
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}

const s_dark = StyleSheet.create({
  cards:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  vs:         { color: G.orange, fontSize: 18, fontFamily: 'Poppins_500Medium', marginHorizontal: 4 },
  cardBorder: { width: CARD_W, borderRadius: 13, padding: 1 },
  card:       { borderRadius: 12, paddingBottom: 14, alignItems: 'center', overflow: 'hidden' },
  cardImg:    { width: CARD_W - 30, height: 70, marginTop: 10 },
  cardName:   { color: G.white, fontSize: 14, fontFamily: 'Poppins_500Medium', textAlign: 'center', marginTop: 12, paddingHorizontal: 8, lineHeight: 21 },
  cardPrice:  { color: G.muted, fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2 },

  section:  { borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingBottom: 10, paddingHorizontal: 6 },
  secHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, paddingBottom: 12 },
  secTitle: { color: G.white, fontSize: 18, fontFamily: 'Poppins_500Medium' },
  row:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  col:      { width: '30%' },
  labelTxt: { width: '40%', color: '#E6E1E8', fontSize: 13, fontFamily: 'Poppins_400Regular', paddingRight: 8 },
  headTxt:  { color: '#E6E1E8', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  valTxt:   { color: G.muted, fontSize: 12, fontFamily: 'Poppins_400Regular' },

  prefTitle: { color: G.white, fontSize: 16, fontFamily: 'Poppins_400Regular', marginTop: 18, marginBottom: 12 },
  pref:      { flexDirection: 'row', alignItems: 'center', borderRadius: 18, overflow: 'hidden', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  prefName:  { color: G.white, fontSize: 15, fontFamily: 'Poppins_500Medium' },
  prefMeta:  { color: G.muted, fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 3 },
  prefPrice: { color: G.orange, fontSize: 16, fontFamily: 'Poppins_500Medium' },
  radio:     { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  radioOn:   { backgroundColor: '#1D3B78', borderColor: '#8FA8D8' },
  radioDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
});
// Light mode layer for `s` — dark mode uses s_dark as is
const s_light = withLightStyles(s_dark, {
  cardName: { color: '#000000' },
  cardPrice: { color: '#4b5563' },
  section: { borderColor: 'rgba(0,0,0,0.12)' },
  secTitle: { color: '#000000' },
  labelTxt: { color: '#000000' },
  headTxt: { color: '#000000' },
  valTxt: { color: '#4b5563' },
  prefTitle: { color: '#000000' },
  pref: { backgroundColor: '#F2F4F8', borderColor: 'rgba(0,0,0,0.04)', boxShadow: LIGHT_POP_SHADOW },
  prefName: { color: '#000000' },
  prefMeta: { color: '#4b5563' },
});

