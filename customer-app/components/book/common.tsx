// Shared pieces for the Book-Vehicle flow (app/book/*)
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { G, Glass, GlassField, GlassSelect, GradientButton } from '@/components/shared/GlowUI';
import { SavedCardEffect, savedCardOuter } from '@/components/shared/FigmaEffects';

const SERVER_BASE = API_BASE.replace('/api/v1', '');
export function imgUrl(url?: string | null) {
  if (!url || url.startsWith('file://')) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER_BASE}${url}`;
}

// PKR 63 Lac / PKR 56.67 Lacs / PKR 1.2 Crore
export function fmtLac(p?: number, plural = false) {
  if (!p && p !== 0) return '—';
  if (p >= 10_000_000) return `PKR ${+(p / 10_000_000).toFixed(2)} Crore`;
  if (p >= 100_000)    return `PKR ${+(p / 100_000).toFixed(2)} ${plural ? 'Lacs' : 'Lac'}`;
  return `PKR ${p.toLocaleString()}`;
}
export const fmtPKR = (p?: number) => (p || p === 0 ? `PKR ${Math.round(p).toLocaleString()}` : '—');
export const fmtRs  = (p?: number) => (p || p === 0 ? `Rs ${Math.round(p).toLocaleString()}` : '—');

export function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function sellerName(v: any) {
  return v?.seller?.dealership_name || v?.seller?.full_name || v?.dealership_name || 'Dealer';
}

// ── Brands (logos cropped from the Figma "Book a vehicle" frame) ──
export type Brand = { name: string; logo?: any };
const L = {
  suzuki:     require('@/assets/images/brands/suzuki.png'),
  honda:      require('@/assets/images/brands/honda.png'),
  toyota:     require('@/assets/images/brands/toyota.png'),
  hyundai:    require('@/assets/images/brands/hyundai.png'),
  bmw:        require('@/assets/images/brands/bmw.png'),
  audi:       require('@/assets/images/brands/audi.png'),
  nissan:     require('@/assets/images/brands/nissan.png'),
  mitsubishi: require('@/assets/images/brands/mitsubishi.png'),
};
export const CAR_BRANDS: Brand[] = [
  { name: 'Suzuki', logo: L.suzuki }, { name: 'Honda', logo: L.honda }, { name: 'Toyota', logo: L.toyota }, { name: 'Hyundai', logo: L.hyundai },
  { name: 'BMW', logo: L.bmw }, { name: 'Audi', logo: L.audi }, { name: 'Nissan', logo: L.nissan }, { name: 'Mitsubishi', logo: L.mitsubishi },
  { name: 'KIA' }, { name: 'Changan' }, { name: 'MG' }, { name: 'Haval' },
  { name: 'Mercedes' }, { name: 'Proton' }, { name: 'DFSK' }, { name: 'Prince' },
  { name: 'Chery' }, { name: 'BAIC' }, { name: 'Lexus' }, { name: 'Peugeot' },
  { name: 'Tesla' }, { name: 'Isuzu' }, { name: 'FAW' }, { name: 'JAC' },
];
export const BIKE_BRANDS: Brand[] = [
  { name: 'Honda', logo: L.honda }, { name: 'Suzuki', logo: L.suzuki }, { name: 'Yamaha' }, { name: 'United' },
  { name: 'Road Prince' }, { name: 'Super Power' }, { name: 'Unique' }, { name: 'Hi Speed' },
  { name: 'Crown' }, { name: 'Super Star' }, { name: 'Metro' }, { name: 'Jolta' },
];

const COLORS = ['White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Beige', 'Green', 'Brown', 'Maroon', 'Gold', 'Orange'];
const YEARS  = Array.from({ length: 27 }, (_, i) => String(2026 - i));
const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT'];
const SELLER_TYPES  = ['All (Dealership + Individual)', 'Dealership', 'Individual'];

export type SearchData = {
  car: string; variant: string; transmission: string; color: string; year: string; sellerType: string;
};

// ── Figma "Select your Car" sheet ──
export function SearchModal({
  visible, brand, category, onClose, onSearch,
}: {
  visible: boolean; brand: string; category: 'car' | 'bike'; onClose: () => void; onSearch: (d: SearchData) => void;
}) {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [cars, setCars] = useState<string[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState<SearchData>({ car: '', variant: '', transmission: 'Automatic', color: 'Black', year: '2026', sellerType: SELLER_TYPES[0] });

  useEffect(() => {
    if (!visible || !brand) return;
    setOpen(null);
    setForm(f => ({ ...f, car: '', variant: '' }));
    (async () => {
      setLoadingCars(true);
      try {
        const q = new URLSearchParams({ limit: '100', category, make: brand });
        const res = await fetch(`${API_BASE}/vehicles?${q}`, { headers: authHeaders(token) });
        if (res.ok) {
          const d = await res.json();
          const names = Array.from(new Set((d.items || []).map((v: any) =>
            `${v.make || ''} ${v.model || ''}`.trim() || v.title).filter(Boolean))).sort() as string[];
          setCars(names);
          const first = (d.items || [])[0];
          setForm(f => ({ ...f, car: names[0] || '', variant: first?.variant || '' }));
        }
      } catch { }
      finally { setLoadingCars(false); }
    })();
  }, [visible, brand, category]);

  const set = (k: keyof SearchData) => (v: string) => { setForm(f => ({ ...f, [k]: v })); setOpen(null); };
  const chevron = <Ionicons name="chevron-down" size={20} color={G.orange} />;

  function OptionList({ field, options }: { field: string; options: string[] }) {
    if (open !== field) return null;
    return (
      <View style={m.list}>
        <Glass radius={18} blur={12} />
        <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
          {options.length === 0 ? (
            <Text style={[m.opt, { color: G.muted }]}>{loadingCars ? 'Loading…' : `No ${category === 'bike' ? 'bikes' : 'cars'} listed for ${brand}`}</Text>
          ) : options.map(o => (
            <TouchableOpacity key={o} onPress={() => set(field as keyof SearchData)(o)} style={m.optRow}>
              <Text style={[m.opt, (form as any)[field] === o && { color: G.orange }]}>{o}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose} />
      <View style={[m.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <TouchableOpacity style={m.close} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={28} color="#C9C6D0" />
        </TouchableOpacity>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 28 }}>
          <Text style={m.label}>Select your {category === 'bike' ? 'Bike' : 'Car'}</Text>
          <GlassSelect value={form.car} placeholder={loadingCars ? 'Loading…' : brand} onPress={() => setOpen(open === 'car' ? null : 'car')} />
          <OptionList field="car" options={cars} />

          <Text style={m.label}>Variant</Text>
          <GlassField value={form.variant} onChangeText={v => setForm(f => ({ ...f, variant: v }))} placeholder="Variant" />

          <Text style={m.label}>Transmission</Text>
          <GlassSelect value={form.transmission} onPress={() => setOpen(open === 'transmission' ? null : 'transmission')} />
          <OptionList field="transmission" options={TRANSMISSIONS} />

          <View style={m.row2}>
            <View style={{ flex: 1 }}>
              <Text style={m.label}>Color</Text>
              <GlassSelect value={form.color} right={chevron} onPress={() => setOpen(open === 'color' ? null : 'color')} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={m.label}>Year/Model</Text>
              <GlassSelect value={form.year} right={chevron} onPress={() => setOpen(open === 'year' ? null : 'year')} />
            </View>
          </View>
          <OptionList field="color" options={COLORS} />
          <OptionList field="year" options={YEARS} />

          <Text style={m.label}>Select your {category === 'bike' ? 'Bike' : 'Car'} Dealership (Optional)</Text>
          <GlassSelect value={form.sellerType} right={chevron} onPress={() => setOpen(open === 'sellerType' ? null : 'sellerType')} />
          <OptionList field="sellerType" options={SELLER_TYPES} />

          <GradientButton title="Search Vehicles" height={50} fontSize={18} style={{ marginTop: 26, marginHorizontal: 4 }} onPress={() => onSearch(form)} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    maxHeight: '88%', backgroundColor: G.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 16,
  },
  close:  { position: 'absolute', top: 12, right: 16, zIndex: 3 },
  label:  { color: G.muted, fontSize: 15, fontFamily: 'Poppins_400Regular', marginTop: 14, marginBottom: 8, marginLeft: 2 },
  row2:   { flexDirection: 'row', gap: 16 },
  list:   { marginTop: 8, borderRadius: 18, overflow: 'hidden', paddingVertical: 6 },
  optRow: { paddingHorizontal: 22, paddingVertical: 9 },
  opt:    { color: G.white, fontSize: 14, fontFamily: 'Poppins_400Regular', paddingHorizontal: 0 },
});

// ── Figma "Latest Video" section ──
const VIDEO_FALLBACK = require('@/assets/images/video-thumb.png');
function timeAgo(d?: string) {
  if (!d) return '2 days ago';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}
function fmtViews(n?: number) {
  if (!n) return '245k';
  return n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(n);
}

export const LatestVideos = memo(function LatestVideos({ count = 2 }: { count?: number }) {
  const [videos, setVideos] = useState<any[] | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/video-ads`);
        if (res.ok) {
          const d = await res.json();
          setVideos((Array.isArray(d) ? d : d.items || []).slice(0, count));
          return;
        }
      } catch { }
      setVideos([]);
    })();
  }, [count]);

  if (videos === null) return <ActivityIndicator color={G.orange} style={{ marginTop: 12 }} />;
  const list = videos.length ? videos : Array.from({ length: count }).map((_, i) => ({ id: `f${i}` }));
  return (
    <View style={{ gap: 12 }}>
      {list.map((v: any, i: number) => {
        const thumb = imgUrl(v.thumbnail_url || (v.media_url && !/\.(mp4|mov|webm)$/i.test(v.media_url) ? v.media_url : null));
        return (
          <View key={v.id || v._id || i} style={[savedCardOuter, vs.card]}>
            <SavedCardEffect />
            <View style={vs.thumb}>
              <Image source={thumb ? { uri: thumb } : VIDEO_FALLBACK} style={vs.thumbImg} resizeMode="cover" />
              <View style={vs.play}><Ionicons name="play" size={16} color="#fff" style={{ marginLeft: 2 }} /></View>
              <View style={vs.dur}><Text style={vs.durTxt}>{v.duration || '12:45'}</Text></View>
            </View>
            <View style={vs.info}>
              <Text style={vs.title} numberOfLines={1}>{v.title || '2026 Honda Civic'}</Text>
              <Text style={vs.sub} numberOfLines={1}>{v.subtitle || v.description || '4K Walkaround Review'}</Text>
              <View style={vs.divider} />
              <View style={vs.meta}>
                <Ionicons name="eye" size={11} color={G.orange} />
                <Text style={vs.metaTxt}>{fmtViews(v.views)} Views</Text>
                <Ionicons name="calendar-outline" size={11} color={G.orange} style={{ marginLeft: 8 }} />
                <Text style={vs.metaTxt}>{timeAgo(v.created_at)}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
});

const vs = StyleSheet.create({
  card:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 9, borderRadius: 18, overflow: 'hidden' },
  thumb:    { width: 138, height: 112, borderRadius: 16, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  play:     { position: 'absolute', top: 38, left: 51, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(22,58,130,0.92)', alignItems: 'center', justifyContent: 'center' },
  dur:      { position: 'absolute', right: 6, bottom: 6, backgroundColor: 'rgba(40,40,40,0.75)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  durTxt:   { color: '#fff', fontSize: 9, fontFamily: 'Poppins_400Regular' },
  info:     { flex: 1, gap: 4 },
  title:    { color: G.white, fontSize: 15, fontFamily: 'Poppins_500Medium' },
  sub:      { color: G.muted, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  divider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginVertical: 4 },
  meta:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:  { color: G.muted, fontSize: 9, fontFamily: 'Poppins_400Regular' },
});

// ── Small vehicle summary card (Book vehicle / Test drive) ──
export function VehicleStrip({ v, onPress, warm, chevron }: { v: any; onPress?: () => void; warm?: boolean; chevron?: boolean }) {
  const img = imgUrl(v?.images?.[0]);
  const Box: any = onPress ? TouchableOpacity : View;
  const meta = [v?.city, v?.year, v?.transmission].filter(Boolean).join(' • ') || '—';
  return (
    <Box onPress={onPress} activeOpacity={0.88} style={vst.card}>
      {warm ? (
        <View style={[StyleSheet.absoluteFillObject, vst.warmWrap]}>
          <WarmFill />
        </View>
      ) : <Glass radius={16} blur={16} />}
      {img
        ? <Image source={{ uri: img }} style={vst.img} resizeMode="cover" />
        : <View style={[vst.img, vst.imgPh]}><Ionicons name="car-outline" size={28} color={G.muted} /></View>}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={vst.title} numberOfLines={1}>{v?.title || '—'}</Text>
        <View style={vst.metaRow}>
          <Ionicons name="location-outline" size={14} color={G.muted} />
          <Text style={vst.meta} numberOfLines={1}>{meta}</Text>
        </View>
        <Text style={vst.price}>{fmtLac(v?.price)}</Text>
      </View>
      {chevron && <Ionicons name="chevron-forward" size={22} color={G.orange} />}
    </Box>
  );
}

function WarmFill() {
  return (
    <LinearGradient colors={['#0B1D4A', '#0E2152', '#3A2F4A', '#7D4B3C']} locations={[0, 0.45, 0.75, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} />
  );
}

const vst = StyleSheet.create({
  card:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingRight: 14, borderRadius: 16, overflow: 'hidden' },
  warmWrap: { borderRadius: 16, borderWidth: 1, borderColor: '#B8683E', overflow: 'hidden' },
  img:      { width: 104, height: 66, borderRadius: 8 },
  imgPh:    { backgroundColor: '#0B1D4A', alignItems: 'center', justifyContent: 'center' },
  title:    { color: G.white, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta:     { color: G.muted, fontSize: 12, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  price:    { color: G.orange, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});

// ── Party-popper success hero ──
export function SuccessHero({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <Image source={require('@/assets/images/successful.png')} style={{ width: 84, height: 84 }} resizeMode="contain" />
      <Text style={{ color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', lineHeight: 30, marginTop: 6 }}>{title}</Text>
      {sub ? <Text style={{ color: G.muted, fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 21, paddingHorizontal: 20 }}>{sub}</Text> : null}
    </View>
  );
}

// ── Variants of a listing (falls back to the listing itself when none are stored) ──
export type Variant = { name: string; cc?: string; fuel?: string; trans?: string; delivery?: string; price?: number; features?: string[] };
export function buildVariants(v: any): Variant[] {
  if (!v) return [];
  const cap = (x?: string) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : undefined);
  if (Array.isArray(v.variants) && v.variants.length) {
    return v.variants.map((x: any) => ({
      name: x.name || v.variant || v.title,
      cc: x.cc || (x.engine_cc ? `${x.engine_cc} cc` : v.engine_cc ? `${v.engine_cc} cc` : undefined),
      fuel: cap(x.fuel || x.fuel_type || v.fuel_type),
      trans: cap(x.trans || x.transmission || v.transmission),
      delivery: x.delivery || 'Immediate',
      price: Number(x.price) || v.price,
      features: x.features,
    }));
  }
  return [{
    name: v.variant || v.title,
    cc: v.engine_cc ? `${v.engine_cc} cc` : undefined,
    fuel: cap(v.fuel_type),
    trans: cap(v.transmission),
    delivery: 'Immediate',
    price: v.price,
  }];
}
