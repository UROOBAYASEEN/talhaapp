// Figma: Book a vehicle
import { useAppColors, withLightStyles, LIGHT_POP_SHADOW } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AskariBank from '@/components/shared/AskariBank';
import { G, GlowBackground, ScreenHeader } from '@/components/shared/GlowUI';
import { SavedCardEffect } from '@/components/shared/FigmaEffects';
import { BIKE_BRANDS, Brand, CAR_BRANDS, SearchModal } from '@/components/book/common';
import LatestVideoSection from '@/components/shared/LatestVideoSection';
import LightGradientBorder from '@/components/shared/LightGradientBorder';

// NOTE: grid widths har phone size + rotation pe reactive hain —
// har tile apni width `useWindowDimensions()` se khud calculate karta hai.
// Module-level frozen `Dimensions.get` use nahi hota.
const PAD = 16;
const GAP = 12;

const IMG_COMPARE_VEHICLE   = require('@/assets/images/compareVehicle.png');
const IMG_BIKE              = require('@/assets/Icons/bikeWhite.png');
const IMG_COMPARE_INSURANCE = require('@/assets/images/compareInsurance.png');

// Light mode tile surface: hairline gradient border + soft white → grey-blue fill (premium raised look).
// Always mounted with the same structure — only colours change on select.
function LightTileBg({ radius, on }: { radius: number; on: boolean }) {
  return (
    <>
      <LightGradientBorder
        radius={radius}
        fill="#FFFFFF"
        colors={on ? ['rgba(226,103,27,0.9)', 'rgba(3,42,105,0.9)'] : ['rgba(226,103,27,0.22)', 'rgba(3,42,105,0.22)']}
      />
      <LinearGradient
        colors={on ? ['#FFFFFF', '#FFF6F0'] : ['#FFFFFF', '#EEF1F6']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 1, left: 1, right: 1, bottom: 1, borderRadius: radius - 1 }}
        pointerEvents="none"
      />
    </>
  );
}

// Same effect as the Insurance screen's "Select Vehicle Type" cards — gradient glow, no Skia canvas,
// so switching Cars/Bikes and brand pages re-renders instantly.

const BrandTile = memo(function BrandTile({ b, onPress }: { b: Brand; onPress: (name: string) => void }) {
  const aC = useAppColors();
  const st = aC.isDark ? st_dark : st_light;
  const { width: W } = useWindowDimensions();
  const tileW = (W - PAD * 2 - GAP * 3) / 4;
  return (
    <TouchableOpacity style={[st.tile, st.tileOn, { width: tileW }]} activeOpacity={0.85} onPress={() => onPress(b.name)}>
      {aC.isDark ? <SavedCardEffect band={12} /> : <LightTileBg radius={18} on={false} />}
      {b.logo
        ? <Image source={b.logo} style={[st.tileLogo, { width: tileW * 0.52 }]} resizeMode="contain" />
        : <Text style={st.tileInitial}>{b.name[0]}</Text>}
      <Text style={st.tileName} numberOfLines={1}>{b.name.toUpperCase()}</Text>
    </TouchableOpacity>
  );
});

// Both tiles always keep the same structure/style keys — only colours and the glow's opacity change.
// (Mounting/unmounting the glow layer and toggling the border made the other tile's icon/text vanish.)
function TypeTile({ k, label, sel, onPress }: { k: 'car' | 'bike'; label: string; sel: boolean; onPress: (k: 'car' | 'bike') => void }) {
  const aC = useAppColors();
  const st = aC.isDark ? st_dark : st_light;
  const { width: W } = useWindowDimensions();
  const typeW = (W - PAD * 2 - 16) / 2;
  return (
    <TouchableOpacity
      style={[st.typeTile, sel ? st.typeTileOn : st.typeTileOff, { width: typeW }]}
      activeOpacity={0.88}
      onPress={() => onPress(k)}
    >
      <View style={[StyleSheet.absoluteFillObject, { opacity: sel ? 1 : 0 }]} pointerEvents="none">
        {aC.isDark && <SavedCardEffect />}
      </View>
      {!aC.isDark && <LightTileBg radius={20} on={sel} />}
      <View style={st.typeContent}>
        {k === 'car'
          ? <MaterialCommunityIcons name="car" size={26} color={sel ? G.orange : (aC.isDark ? '#FFFFFF' : '#000000')} />
          : <Image source={IMG_BIKE} style={[st.bikeIcon, !aC.isDark && { tintColor: '#000000' }, sel && { tintColor: G.orange }]} resizeMode="contain" />}
        <Text style={[st.typeTxt, !aC.isDark && sel && { color: G.orange, fontFamily: 'Poppins_600SemiBold' }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function BookVehicleScreen() {
  const aC = useAppColors();
  const st = aC.isDark ? st_dark : st_light;
  const router = useRouter();
  const { width: W } = useWindowDimensions();
  const pageW = W - PAD * 2;
  const needW = (W - PAD * 2 - 16) / 2;
  const [type, setType] = useState<'car' | 'bike'>('car');
  const [page, setPage] = useState(0);
  const [brand, setBrand] = useState('');
  const [modal, setModal] = useState(false);

  const pages = useMemo(() => {
    const brands = type === 'car' ? CAR_BRANDS : BIKE_BRANDS;
    return Array.from({ length: Math.ceil(brands.length / 8) }, (_, i) => brands.slice(i * 8, i * 8 + 8));
  }, [type]);

  const selectType = useCallback((k: 'car' | 'bike') => {
    setType(k);
    setPage(0);
  }, []);

  const openBrand = useCallback((name: string) => { setBrand(name); setModal(true); }, []);

  return (
    <GlowBackground themed>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Book a vehicle" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Select Vehicle Type */}
          <Text style={st.sec}>Select Vehicle Type</Text>
          <View style={st.typeRow}>
            <TypeTile k="car" label="Cars" sel={type === 'car'} onPress={selectType} />
            <TypeTile k="bike" label="Bikes" sel={type === 'bike'} onPress={selectType} />
          </View>

          {/* Select Your Brand */}
          <Text style={st.sec}>Select Your Brand</Text>
          {/* Fixed grid (no scrolling) — tap a dot to show the next set of brands */}
          <View style={[st.page, { marginHorizontal: PAD, width: pageW }]}>
            {(pages[page] || pages[0]).map(b => (
              <BrandTile key={`${type}-${b.name}`} b={b} onPress={openBrand} />
            ))}
          </View>
          {pages.length > 1 && (
            <View style={st.dots}>
              {pages.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setPage(i)} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
                  <View style={[st.dot, i === page && st.dotOn]} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Askari Bank banner */}
          <View style={{ paddingHorizontal: PAD, marginTop: 14 }}>
            <AskariBank />
          </View>

          {/* You May Need This */}
          <Text style={[st.sec, { fontSize: 20, marginTop: 8 }]}>You May Need This</Text>
          <View style={st.needRow}>
            {[
              { img: IMG_COMPARE_VEHICLE, title: 'Compare\nVehicle', sub: 'Compare vehicle features, prices, and specifications.', go: () => router.push({ pathname: '/compare-vehicle', params: { category: type, from: 'book' } } as any) },
              { img: IMG_COMPARE_INSURANCE, title: 'Compare\nInsurance Plans', sub: 'Compare coverage, benefits, and prices to find the right plan.', go: () => router.push('/insurance-search' as any) },
            ].map(c => (
              <TouchableOpacity key={c.title} style={[st.needCard, { width: needW }, !aC.isDark && st.needCardLight]} activeOpacity={0.88} onPress={c.go}>
                <LinearGradient colors={aC.isDark ? ['#061845', '#0A1F4C', '#2B2947', '#7E5048'] : ['#F4F7FA', '#F4F7FA', '#FFB5875C']} locations={aC.isDark ? [0, 0.5, 0.76, 1] : [0, 0.45, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={st.needGrad}>
                  <Image source={c.img} style={st.needImg} resizeMode="contain" />
                  <View style={st.needTitleRow}>
                    <Text style={st.needTitle}>{c.title}</Text>
                    <Ionicons name="chevron-forward" size={20} color={G.orange} />
                  </View>
                  <Text style={st.needSub} numberOfLines={3}>{c.sub}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Latest Video */}
          <Text style={[st.sec, { fontSize: 18, marginTop: 22 }]}>Latest Video</Text>
          <View style={{ paddingHorizontal: PAD }}>
            <LatestVideoSection count={2} savedCardStyle hideHeading noTopMargin />
          </View>
        </ScrollView>
      </SafeAreaView>

      <SearchModal
        visible={modal}
        brand={brand}
        category={type}
        onClose={() => setModal(false)}
        onSearch={d => {
          setModal(false);
          router.push({
            pathname: '/book/search-results',
            params: { category: type, make: brand, car: d.car, transmission: d.transmission, color: d.color, year: d.year, sellerType: d.sellerType },
          } as any);
        }}
      />
    </GlowBackground>
  );
}

const st_dark = StyleSheet.create({
  needCardLight: {},
  sec:      { color: G.white, fontSize: 16, fontFamily: 'Poppins_400Regular', marginTop: 10, marginBottom: 12, paddingHorizontal: PAD },
  typeRow:  { flexDirection: 'row', gap: 16, paddingHorizontal: PAD, marginBottom: 8 },
  typeTile:    { height: 94, borderRadius: 20, overflow: 'hidden', borderWidth: 1, elevation: 0 },
  // Same as app/insurance-search.tsx typeCard: selected = #010A1F + #82a5d5 border + soft shadow + glow,
  // unselected = flat #0B1D4A (same border width, transparent, so nothing shifts when toggling)
  typeTileOn:  { backgroundColor: '#010A1F', borderColor: '#82a5d5', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  typeTileOff: { backgroundColor: '#0B1D4A', borderColor: '#0B1D4A', shadowOpacity: 0 },
  bikeIcon:    { width: 32, height: 32 },
  typeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  typeTxt:  { color: G.white, fontSize: 18, fontFamily: 'Poppins_400Regular' },

  page:        { flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: 18 },
  tileOn:      { backgroundColor: '#010A1F', borderWidth: 1, borderColor: '#82a5d5', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  tile:        { height: 76, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tileLogo:    { height: 30 },
  tileInitial: { color: '#D8DCE6', fontSize: 24, fontFamily: 'Poppins_700Bold', lineHeight: 30 },
  tileName:    { color: '#FFFFFF', fontSize: 9, fontFamily: 'Poppins_500Medium', paddingHorizontal: 2 },
  dots:        { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 14 },
  dot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9D93A0' },
  dotOn:       { backgroundColor: '#FFFFFF' },

  needRow:      { flexDirection: 'row', gap: 16, paddingHorizontal: PAD },
  needCard:     { height: 190, borderRadius: 16, overflow: 'hidden' },
  needGrad:     { flex: 1, paddingHorizontal: 11, paddingTop: 10, paddingBottom: 12 },
  needImg:      { width: 96, height: 68, alignSelf: 'center', marginBottom: 4 },
  needTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  needTitle:    { flex: 1, color: G.white, fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
  needSub:      { color: G.muted, fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 14.5 },
});
// Light mode layer for `st` — dark mode uses st_dark as is
const st_light = withLightStyles(st_dark, {
  sec: { color: '#0B1220', fontFamily: 'Poppins_500Medium' },
  // Selected: white raised tile + orange↔navy border + orange icon/text; unselected: flat grey-blue, faint border
  typeTile: { borderWidth: 0 },
  typeTileOn: { backgroundColor: 'transparent', boxShadow: LIGHT_POP_SHADOW },
  typeTileOff: { backgroundColor: 'transparent', boxShadow: '1px 2px 3px rgba(0,0,0,0.10)' },
  typeTxt: { color: '#000000' },
  tile: { borderRadius: 18, boxShadow: LIGHT_POP_SHADOW },
  tileOn: { backgroundColor: 'transparent', borderWidth: 0, elevation: 0 },
  tileName: { color: '#111827', fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.3 },
  tileInitial: { color: '#C9D1DE' },
  dot: { backgroundColor: '#C7CCD6' },
  dotOn: { width: 18, backgroundColor: G.orange },
  needCardLight: { backgroundColor: '#FFFFFF', boxShadow: LIGHT_POP_SHADOW },
  // Tighter spacing (same card size) so 3-line titles like "Compare Insurance Plans" don't clip the subtitle
  needGrad: { paddingTop: 8, paddingBottom: 8 },
  needImg: { marginBottom: 0 },
  needTitleRow: { marginBottom: 2 },
  needTitle: { color: '#000000', lineHeight: 18 },
  needSub: { color: '#4b5563', lineHeight: 13.5 },
});
