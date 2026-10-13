// Figma: vehicle detail (Book flow) — bottom shows only Contact Dealer + Test Drive
import { useAppColors, withLightStyles, LIGHT_POP_SHADOW } from '@/constants/theme';
import VerifiedIcon from '@/components/shared/VerifiedIcon';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList, Image, ScrollView, Share, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { G, Glass, GlassButton, GradientButton, GlowThemed } from '@/components/shared/GlowUI';
import { CtaPanelGlass } from '@/components/shared/FigmaEffects';
import { authHeaders, buildVariants, fmtLac, fmtPKR, fmtRs, imgUrl, sellerName } from '@/components/book/common';

const { width: W } = Dimensions.get('window');

function BookVehicleDetailInner() {
  const aC = useAppColors();
  const s = aC.isDark ? s_dark : s_light;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [v, setV] = useState<any>(null);
  const [tax, setTax] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [idx, setIdx] = useState(0);
  const [openFeat, setOpenFeat] = useState('exterior');
  const [ctaH, setCtaH] = useState(150);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const h = authHeaders(token);
        const [vr, tr] = await Promise.all([
          fetch(`${API_BASE}/vehicles/${id}`, { headers: h }),
          fetch(`${API_BASE}/vehicles/${id}/tax`, { headers: h }),
        ]);
        if (vr.ok) { const d = await vr.json(); setV(d); setSaved(!!d.is_saved); }
        if (tr.ok) setTax(await tr.json());
      } catch { }
      finally { setLoading(false); }
    })();
  }, [id]);

  async function toggleSave() {
    if (!token) { Alert.alert('Login Required', 'Please login to save.'); return; }
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}/save`, { method: 'POST', headers: authHeaders(token) });
      if (res.ok) { const d = await res.json(); setSaved(d.saved); }
    } catch { }
  }

  if (loading) {
    return <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={G.orange} size="large" /></View>;
  }
  if (!v) {
    return (
      <SafeAreaView style={[s.root, { alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={aC.isDark ? G.muted : '#4b5563'} />
        <Text style={s.sec}>Vehicle not found</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: G.orange, fontFamily: 'Poppins_500Medium' }}>Go Back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const images = (v.images || []).map((i: string) => imgUrl(i)).filter(Boolean) as string[];
  const isDealer = v.seller?.role === 'dealership_owner';
  const variants = buildVariants(v);
  const selVariant = 0; // first variant is the listing's own; tap another to compare
  const rating = v.average_rating > 0 ? v.average_rating : 4.9;
  const reviews = v.review_count > 0 ? `${v.review_count} Reviews` : '250+ Reviews';

  const filerTax = tax?.filer_tax;
  const nonFilerTax = tax?.non_filer_tax;
  const priceRows = [
    { l: 'Vehicle price', val: fmtPKR(v.price) },
    { l: 'Withholding Tax (Filer)', val: filerTax != null ? fmtPKR(filerTax) : '—' },
    { l: 'Withholding Tax (non-Filer)', val: nonFilerTax != null ? fmtPKR(nonFilerTax) : '—' },
    { l: 'Estimated Total (Filer)', val: filerTax != null ? fmtPKR(v.price + filerTax) : '—' },
    { l: 'Estimated Total (Non-Filer)', val: nonFilerTax != null ? fmtPKR(v.price + nonFilerTax) : '—' },
  ];

  const specs = [
    { l: 'City', val: v.city },
    { l: 'Assembly', val: v.assembly || 'Local' },
    { l: 'Engine Capacity', val: v.engine_cc ? `${v.engine_cc} cc` : undefined },
    { l: 'Body Type', val: v.body_type },
    { l: 'Color', val: v.color },
    { l: 'Mileage', val: v.mileage != null ? `${Number(v.mileage).toLocaleString()} km` : undefined },
  ].filter(r => r.val);

  const safetyKw = ['abs', 'airbag', 'brake', 'belt', 'stability', 'traction', 'parking', 'isofix', 'hill'];
  const interiorKw = ['sunroof', 'leather', 'screen', 'display', 'ambient', 'speaker', 'audio', 'seat'];
  const feats: string[] = v.features || [];
  const has = (f: string, kw: string[]) => kw.some(k => f.toLowerCase().includes(k));
  const featureSections = [
    { key: 'exterior', title: 'Exterior', items: feats.filter(f => !has(f, safetyKw) && !has(f, interiorKw)) },
    { key: 'interior', title: 'Interior', items: feats.filter(f => has(f, interiorKw)) },
    { key: 'safety', title: 'Safety Features', items: feats.filter(f => has(f, safetyKw)) },
  ].filter(x => x.items.length);

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: ctaH + 12 }}>
        {/* Hero */}
        <View>
          {images.length ? (
            <FlatList
              ref={listRef}
              horizontal pagingEnabled
              data={images}
              keyExtractor={(_, i) => String(i)}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
              renderItem={({ item }) => <Image source={{ uri: item }} style={s.hero} resizeMode="cover" />}
            />
          ) : (
            <View style={[s.hero, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff', alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="car-outline" size={64} color={aC.isDark ? G.muted : '#4b5563'} />
            </View>
          )}
          <View style={[s.heroTop, { top: insets.top + 4 }]}>
            <TouchableOpacity onPress={() => router.back()} style={s.heroBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
            <Image source={require('@/assets/images/autowizor-logo-text.png')} style={s.heroLogo} resizeMode="contain" />
          </View>
          {images.length > 1 && (
            <>
              <TouchableOpacity style={[s.arrow, { left: 6, backgroundColor: 'rgba(30,58,110,0.55)' }]} onPress={() => { const n = Math.max(idx - 1, 0); listRef.current?.scrollToIndex({ index: n }); setIdx(n); }}>
                <Ionicons name="chevron-back" size={16} color={aC.isDark ? '#fff' : '#000000'} />
              </TouchableOpacity>
              <TouchableOpacity style={[s.arrow, { right: 6 }]} onPress={() => { const n = Math.min(idx + 1, images.length - 1); listRef.current?.scrollToIndex({ index: n }); setIdx(n); }}>
                <Ionicons name="chevron-forward" size={16} color={aC.isDark ? '#fff' : '#000000'} />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={s.body}>
          {/* Title */}
          <View style={s.titleRow}>
            <Text style={s.title} numberOfLines={2}>
              {v.title}
              <Text style={s.titleSub}>{`  •${v.year || ''} ${v.condition === 'new' ? 'Brand New' : 'Used'}`}</Text>
            </Text>
            <View style={s.icons}>
              <TouchableOpacity onPress={() => Share.share({ message: `${v.title} — ${fmtLac(v.price, true)}` })}>
                <Ionicons name="share-social-outline" size={20} color={G.orange} />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleSave}>
                <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={G.orange} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dealer */}
          <TouchableOpacity style={s.dealerRow} activeOpacity={0.8} onPress={() => router.push({ pathname: '/book/dealer-profile', params: { id: v.seller_id, category: v.category || 'car' } } as any)}>
            <Text style={s.dealer}>{sellerName(v)}</Text>
            {isDealer && <VerifiedIcon size={22} />}
          </TouchableOpacity>

          {/* Rating */}
          <View style={s.ratingRow}>
            <Ionicons name="star" size={20} color={G.orange} />
            <Text style={s.ratingTxt}>{rating} ({reviews})</Text>
          </View>

          {/* Location + price */}
          <View style={s.locRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Ionicons name="location-outline" size={17} color={aC.isDark ? G.muted : '#4b5563'} />
              <Text style={s.locTxt} numberOfLines={1}>{v.address || v.location || v.city || 'Pakistan'}</Text>
            </View>
            <Text style={s.price}>{fmtLac(v.price, true)}</Text>
          </View>

          {/* Spec strip */}
          <View style={s.strip}>
            {[
              { icon: <MaterialCommunityIcons name="car-shift-pattern" size={17} color={G.orange} />, t: v.transmission ? v.transmission.charAt(0).toUpperCase() + v.transmission.slice(1) : 'Automatic' },
              { icon: <MaterialCommunityIcons name="gas-station-outline" size={17} color={G.orange} />, t: v.fuel_type ? v.fuel_type.charAt(0).toUpperCase() + v.fuel_type.slice(1) : 'Petrol' },
              { icon: <MaterialCommunityIcons name="speedometer" size={17} color={G.orange} />, t: v.engine_cc ? `${v.engine_cc} cc` : '—' },
            ].map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={s.stripSep} />}
                <View style={s.stripCell}>{c.icon}<Text style={s.stripTxt}>{c.t}</Text></View>
              </React.Fragment>
            ))}
          </View>

          {/* Price Breakdown */}
          <Text style={s.sec}>Price Breakdown</Text>
          {priceRows.map((r, i) => (
            <View key={r.l} style={[s.row, i < priceRows.length - 1 && s.rowLine]}>
              <Text style={s.rowL}>{r.l}</Text>
              <Text style={s.rowV}>{r.val}</Text>
            </View>
          ))}

          {/* Variants */}
          {variants.length > 1 && (
            <>
              <Text style={s.sec}>Compare Variants</Text>
              {variants.map((vr, i) => {
                const sel = i === selVariant;
                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.88}
                    style={[s.variant, !sel && { backgroundColor: aC.isDark ? '#0B2358' : '#ffffff' }]}
                    onPress={() => {
                      if (sel) return;
                      router.push({ pathname: '/book/compare', params: { id: String(id), a: String(selVariant), b: String(i) } } as any);
                    }}
                  >
                    {sel && <Glass radius={16} blur={18} />}
                    <View style={{ flex: 1 }}>
                      <Text style={s.vName}>{vr.name}</Text>
                      <Text style={s.vMeta}>{[vr.cc, vr.fuel, vr.trans].filter(Boolean).join(' • ')}</Text>
                      <Text style={s.vMeta}>Delivery: {vr.delivery || 'Immediate'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 12 }}>
                      <View style={[s.radio, sel && s.radioOn]}>{sel && <View style={s.radioDot} />}</View>
                      <Text style={s.vPrice}>{fmtRs(vr.price)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Specification */}
          {specs.length > 0 && (
            <>
              <Text style={s.sec}>Specification</Text>
              {specs.map((r, i) => (
                <View key={r.l} style={[s.row, i < specs.length - 1 && s.rowLine]}>
                  <Text style={s.rowL}>{r.l}</Text>
                  <Text style={s.rowV}>{r.val}</Text>
                </View>
              ))}
            </>
          )}

          {/* Features */}
          {featureSections.length > 0 && (
            <>
              <Text style={s.sec}>Features</Text>
              {featureSections.map(f => (
                <View key={f.key} style={s.rowLine}>
                  <TouchableOpacity style={s.accRow} onPress={() => setOpenFeat(openFeat === f.key ? '' : f.key)}>
                    <Text style={s.accTitle}>{f.title}</Text>
                    <Ionicons name={openFeat === f.key ? 'chevron-up' : 'chevron-down'} size={16} color={G.orange} />
                  </TouchableOpacity>
                  {openFeat === f.key && f.items.map(it => (
                    <View key={it} style={s.featRow}>
                      <Ionicons name="checkmark-circle" size={16} color={G.orange} />
                      <Text style={s.featTxt}>{it}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Fixed bottom: Contact Dealer + Test Drive */}
      <View style={[s.cta, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]} onLayout={e => setCtaH(Math.ceil(e.nativeEvent.layout.height))}>
        <Glass radius={0} blur={26} fill="#030B22" />
        {aC.isDark && <CtaPanelGlass radius={0} />}
        <GradientButton
          title="Contact Dealer"
          height={48}
          onPress={() => router.push({ pathname: '/book/dealer-profile', params: { id: v.seller_id, category: v.category || 'car' } } as any)}
        />
        <GlassButton
          title="Test Drive"
          height={46}
          onPress={() => router.push({ pathname: '/book/test-drive', params: { id: String(id) } } as any)}
        />
      </View>
    </View>
  );
}

const s_dark = StyleSheet.create({
  root:     { flex: 1, backgroundColor: G.bg },
  hero:     { width: W, height: 262 },
  heroTop:  { position: 'absolute', left: 0, right: 0, height: 36, alignItems: 'center', justifyContent: 'center' },
  heroBack: { position: 'absolute', left: 12 },
  heroLogo: { width: 112, height: 22 },
  arrow:    { position: 'absolute', top: 136, width: 26, height: 26, borderRadius: 13, backgroundColor: '#1E3A6E', alignItems: 'center', justifyContent: 'center' },

  body:      { paddingHorizontal: 16, paddingTop: 14 },
  titleRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title:     { flex: 1, color: G.white, fontSize: 16, fontFamily: 'Poppins_500Medium', lineHeight: 24 },
  titleSub:  { color: G.muted, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  icons:     { flexDirection: 'row', gap: 12, paddingTop: 2 },
  dealerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  dealer:    { color: G.white, fontSize: 19, fontFamily: 'Poppins_500Medium' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  ratingTxt: { color: G.muted, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  locRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 },
  locTxt:    { color: G.muted, fontSize: 13, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  price:     { color: G.orange, fontSize: 17, fontFamily: 'Poppins_500Medium' },

  strip:     { flexDirection: 'row', alignItems: 'center', marginTop: 22, height: 44 },
  stripCell: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  stripSep:  { width: 1, height: 42, backgroundColor: 'rgba(255,255,255,0.14)' },
  stripTxt:  { color: G.white, fontSize: 12, fontFamily: 'Poppins_400Regular' },

  sec:     { color: G.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginTop: 24, marginBottom: 6 },
  row:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
  rowLine: { borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rowL:    { color: '#C9BDC4', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  rowV:    { color: '#C9BDC4', fontSize: 11, fontFamily: 'Poppins_400Regular' },

  variant:  { flexDirection: 'row', alignItems: 'center', borderRadius: 16, overflow: 'hidden', paddingHorizontal: 16, paddingVertical: 12, marginTop: 10 },
  vName:    { color: G.white, fontSize: 15, fontFamily: 'Poppins_500Medium' },
  vMeta:    { color: G.muted, fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  vPrice:   { color: G.orange, fontSize: 16, fontFamily: 'Poppins_500Medium' },
  radio:    { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  radioOn:  { backgroundColor: '#1D3B78', borderColor: '#8FA8D8' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },

  accRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
  accTitle: { color: G.white, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  featRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 10 },
  featTxt:  { color: G.muted, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 14, gap: 10, overflow: 'hidden' },
});
// Light mode layer for `s` — dark mode uses s_dark as is
const s_light = withLightStyles(s_dark, {
  root: { backgroundColor: '#ffffff' },
  title: { color: '#000000' },
  titleSub: { color: '#4b5563' },
  dealer: { color: '#000000' },
  ratingTxt: { color: '#4b5563' },
  locTxt: { color: '#4b5563' },
  stripTxt: { color: '#000000' },
  sec: { color: '#000000' },
  rowLine: { borderColor: 'rgba(0,0,0,0.12)' },
  rowL: { color: '#4b5563' },
  rowV: { color: '#4b5563' },
  vName: { color: '#000000' },
  vMeta: { color: '#4b5563' },
  accTitle: { color: '#000000' },
  featTxt: { color: '#4b5563' },
  cta: { backgroundColor: '#F2F4F8', borderColor: 'rgba(0,0,0,0.04)', boxShadow: LIGHT_POP_SHADOW },
});


// Follows the app theme (light mode) — see GlowThemed in components/shared/GlowUI
export default function BookVehicleDetail() {
  const aC = useAppColors();
  const s = aC.isDark ? s_dark : s_light;
  return <GlowThemed><BookVehicleDetailInner /></GlowThemed>;
}
