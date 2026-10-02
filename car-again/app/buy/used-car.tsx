import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  SafeAreaView, View, Text, StyleSheet, ScrollView, Modal,
  TouchableOpacity, Image, Dimensions, StatusBar, ActivityIndicator,
  RefreshControl, TextInput, PanResponder, Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { AppColors, useAppColors } from "@/constants/theme";
import { API_BASE } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import AskariBank from "@/components/shared/AskariBank";
import LatestVideoSection from "@/components/shared/LatestVideoSection";
import { PRIMARY_BTN_COLORS, RingGlow, SavedCardEffect, WARM_CARD_COLORS, WARM_CARD_LOCATIONS } from "@/components/shared/FigmaEffects";

const { width } = Dimensions.get("window");
const BG     = AppColors.bg;
const CARD   = AppColors.glassBg;
const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const WHITE  = AppColors.textPrimary;
const MUTED  = AppColors.textSecondary;
const BORDER = "rgba(100,160,255,0.4)";

const SERVER_BASE = API_BASE.replace("/api/v1", "");
function imgUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${SERVER_BASE}${url}`;
}
function formatPrice(p: number) {
  if (p >= 10_000_000) return `PKR ${(p / 10_000_000).toFixed(1)} Crore`;
  if (p >= 100_000)    return `PKR ${(p / 100_000).toFixed(1)} Lac`;
  return `PKR ${p.toLocaleString()}`;
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

// ── Static data ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { title: "Exotic cars",       icon: "car-sports-outline", search: "exotic",   img: require("@/assets/Icons/exoticCar.png") },
  { title: "Old cars",          icon: "car-outline",         search: "",         img: require("@/assets/Icons/oldCars.png") },
  { title: "Chinese\ncars",     icon: "car-side",            search: "chinese",  img: require("@/assets/Icons/chineseCars.png") },
  { title: "Cheap cars",        icon: "tag-outline",         search: "cheap",    img: require("@/assets/Icons/cheapCars.png") },
  { title: "Electronic\ncars",  icon: "ev-station",          search: "electric", img: require("@/assets/Icons/electronicCars.png") },
  { title: "Cheap cars",        icon: "truck-outline",       search: "suv",      img: require("@/assets/Icons/cheapCars1.png") },
  { title: "Cheap cars",        icon: "car-outline",         search: "sedan",    img: require("@/assets/Icons/cheapCars2.png") },
  { title: "Petrol cars",       icon: "gas-station-outline", search: "petrol",   img: require("@/assets/Icons/petrolCars.png") },
];

// Figma "You May Need This" images
const IMG_NEED_COMPARE = require("@/screenshot/comparevehcile.png");
const IMG_NEED_FINANCE = require("@/screenshot/smartcalculator.png");
const NEED_W = (width - 30 - 14) / 2;

// "5800000" → "5.8M"
function toMillions(v: string) {
  const n = Number(String(v).replace(/[^0-9]/g, ""));
  if (!n) return "";
  return `${Number((n / 1_000_000).toFixed(1))}M`;
}

const CITIES    = ["All Cities","Karachi","Lahore","Islamabad","Rawalpindi","Peshawar","Quetta","Faisalabad","Multan","Hyderabad","Sialkot","Gujranwala"];
const YEARS     = ["Any Year", ...Array.from({ length: 27 }, (_, i) => String(2026 - i))];
const COLORS    = ["Any Color","White","Black","Silver","Grey","Red","Blue","Beige","Green","Brown","Orange","Golden"];
const VARIANTS  = ["Any Variant","1.0 MT","1.0 CVT","1.2 MT","1.2 CVT","1.3 MT","1.3 CVT","1.5 MT","1.5 CVT","1.8 MT","2.0 MT","Standard","GL","GLi","XLi","Grande","Alpha","Sport","AWD"];
const SELLER_TYPES = ["All (Showroom + Sellers)", "Dealership", "Individual"];
const SERVICES  = [
  { title: "Protect Your Vehicle with Insurance",          subtitle: "Pick the Right Coverage and Get Insured Easily.",                    icon: "shield-check-outline", route: "/insurance-search" },
  { title: "Get an Installation Tracker for Your Vehicle", subtitle: "Compare Prices and Schedule Installation.",                         icon: "map-marker-outline",   route: "/tracker-search" },
  { title: "Apply for Auto Financing",                     subtitle: "Submit your financing application online in just a few easy steps.", icon: "bank-outline",          route: "/(tabs)/sellers" },
];

// ── Range Slider ──────────────────────────────────────────────────────────────
const PRICE_MIN = 0;
const PRICE_MAX = 50_000_000;

function RangeSlider({ onChangMin, onChangeMax }: { onChangMin: (v: string) => void; onChangeMax: (v: string) => void }) {
  const THUMB = 26;
  const [, setTrackW] = useState(0); // re-render once the track is measured
  const trackRef  = useRef<View>(null);
  const trackWidth= useRef(0);
  const minPos    = useRef(new Animated.Value(0)).current;
  const maxPos    = useRef(new Animated.Value(1)).current; // 0–1 ratio
  const minRatio  = useRef(0);
  const maxRatio  = useRef(1);

  function ratioToPrice(r: number) {
    return Math.round(PRICE_MIN + r * (PRICE_MAX - PRICE_MIN) / 100_000) * 100_000;
  }
  function priceLabel(p: number) {
    if (p >= 10_000_000) return `${(p / 10_000_000).toFixed(1)}Cr`;
    if (p >= 100_000)    return `${(p / 100_000).toFixed(1)}L`;
    return `${p}`;
  }

  const makePan = (isMin: boolean) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => {
      if (!trackWidth.current) return;
      const tw = trackWidth.current - THUMB;
      const ratio = Math.max(0, Math.min(1, (g.moveX - THUMB / 2) / tw));
      if (isMin) {
        const clamped = Math.min(ratio, maxRatio.current - 0.02);
        minRatio.current = clamped;
        minPos.setValue(clamped);
        onChangMin(String(ratioToPrice(clamped)));
      } else {
        const clamped = Math.max(ratio, minRatio.current + 0.02);
        maxRatio.current = clamped;
        maxPos.setValue(clamped);
        onChangeMax(String(ratioToPrice(clamped)));
      }
    },
  });

  const minPan = useRef(makePan(true)).current;
  const maxPan = useRef(makePan(false)).current;

  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(PRICE_MAX);

  // Re-derive labels
  minPos.addListener(({ value }) => setMinVal(ratioToPrice(value)));
  maxPos.addListener(({ value }) => setMaxVal(ratioToPrice(value)));

  return (
    <View style={{ marginTop: 10, marginBottom: 4 }}>
      {/* Price labels — shown in the Min / Max boxes instead (Figma)
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ color: ORANGE, fontSize: 10, fontFamily: "Poppins_600SemiBold" }}>{priceLabel(minVal)}</Text>
        <Text style={{ color: ORANGE, fontSize: 10, fontFamily: "Poppins_600SemiBold" }}>{priceLabel(maxVal)}</Text>
      </View>
      */}

      {/* Track */}
      <View
        ref={trackRef}
        onLayout={e => { trackWidth.current = e.nativeEvent.layout.width; setTrackW(e.nativeEvent.layout.width); }}
        style={{ height: THUMB, justifyContent: "center" }}
      >
        {/* Background track */}
        <View style={{ height: 6, backgroundColor: "#A7A5AE", borderRadius: 3 }} />

        {/* Active fill */}
        <Animated.View style={{
          position: "absolute", height: 6, borderRadius: 3,
          backgroundColor: "#FF6A1A",
          left:  Animated.add(Animated.multiply(minPos, trackWidth.current - THUMB), THUMB / 2),
          right: Animated.add(Animated.multiply(Animated.subtract(new Animated.Value(1), maxPos), trackWidth.current - THUMB), THUMB / 2),
        }} />

        {/* Min thumb */}
        <Animated.View
          {...minPan.panHandlers}
          style={{
            position: "absolute",
            left: Animated.multiply(minPos, trackWidth.current - THUMB),
            width: THUMB, height: THUMB, borderRadius: THUMB / 2,
            backgroundColor: "#E6E6EA", alignItems: "center", justifyContent: "center",
          }}
        >
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF6A1A" }} />
        </Animated.View>

        {/* Max thumb */}
        <Animated.View
          {...maxPan.panHandlers}
          style={{
            position: "absolute",
            left: Animated.multiply(maxPos, trackWidth.current - THUMB),
            width: THUMB, height: THUMB, borderRadius: THUMB / 2,
            backgroundColor: "#E6E6EA", alignItems: "center", justifyContent: "center",
          }}
        >
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF6A1A" }} />
        </Animated.View>
      </View>
    </View>
  );
}

// ── Select Sheet ──────────────────────────────────────────────────────────────
function SelectSheet({ visible, title, options, selected, onSelect, onClose }: {
  visible: boolean; title: string; options: string[];
  selected: string; onSelect: (v: string) => void; onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered  = q ? options.filter(o => o.toLowerCase().includes(q.toLowerCase())) : options;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sh.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={sh.sheet}>
          <GlassInset />
          <View style={sh.handle} />
          <View style={sh.header}>
            <Text style={sh.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={sh.closeBtn}>
              <Ionicons name="close" size={16} color={MUTED} />
            </TouchableOpacity>
          </View>
          <View style={sh.searchRow}>
            <GlassInset />
            <Ionicons name="search-outline" size={14} color={MUTED} style={{ marginLeft: 12 }} />
            <TextInput style={sh.searchInput} value={q} onChangeText={setQ} placeholder={`Search ${title}...`} placeholderTextColor={MUTED} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
            {filtered.map(opt => (
              <TouchableOpacity key={opt} style={sh.option} onPress={() => { onSelect(opt); onClose(); }}>
                <Text style={[sh.optTxt, opt === selected && { color: ORANGE, fontFamily: "Poppins_600SemiBold" }]}>{opt}</Text>
                {opt === selected && <Ionicons name="checkmark" size={15} color={ORANGE} />}
              </TouchableOpacity>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
const sh = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet:     { backgroundColor: BG, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: BORDER, paddingBottom: 36, overflow: "hidden" },
  handle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginTop: 10, marginBottom: 4 },
  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  title:     { color: WHITE, fontSize: 15, fontFamily: "Poppins_700Bold" },
  closeBtn:  { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  searchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 14, marginVertical: 10, height: 40, borderRadius: 20, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD, overflow: "hidden" },
  searchInput:{ flex: 1, color: WHITE, fontSize: 12, fontFamily: "Poppins_400Regular", paddingHorizontal: 10 },
  option:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  optTxt:    { flex: 1, color: MUTED, fontSize: 13, fontFamily: "Poppins_400Regular" },
});

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Text style={styles.viewAll}>View all</Text><Ionicons name="chevron-forward" size={16} color={ORANGE} /></View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Car Card ──────────────────────────────────────────────────────────────────
function CarCard({ car, onPress, onSave, saved }: { car: any; onPress: () => void; onSave: () => void; saved: boolean }) {
  const aC = useAppColors();
  const uri = imgUrl(car.images?.[0]);
  return (
    <View style={[styles.carCard, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? '#82a5d5' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? '#638ed0' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0.15 : 0.08, shadowRadius: aC.isDark ? 5 : 10, shadowOffset: { width: 0, height: 0 }, elevation: aC.isDark ? 2 : 3 }]}>
      {aC.isDark ? <SavedCardEffect /> : <GlassInset />}
      {uri
        ? <Image source={{ uri }} style={styles.carImage} resizeMode="cover" />
        : <View style={[styles.carImage, { backgroundColor: aC.isDark ? "#0d1e3d" : "#f1f5f9", alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="car-outline" size={32} color={aC.isDark ? MUTED : '#94a3b8'} />
          </View>
      }
      <View style={styles.carInfo}>
        <View style={styles.carNameRow}>
          <Text style={[styles.carName, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={1}>{car.title || `${car.make} ${car.model}`}</Text>
          <Text style={styles.carPrice}>{formatPrice(car.price)}</Text>
        </View>
        <Text style={[styles.carDetails, { color: aC.isDark ? '#BAB6C4' : '#475569' }]} numberOfLines={1}>{car.variant || car.transmission || "—"}</Text>
        <View style={styles.carLocRow}>
          <Ionicons name="location-outline" size={16} color={aC.isDark ? '#BAB6C4' : '#64748b'} />
          <Text style={[styles.carLocation, { color: aC.isDark ? '#BAB6C4' : '#64748b' }]} numberOfLines={1}>{car.city || "Pakistan"} • {car.year} • {car.transmission || "CVT"}</Text>
        </View>
        <View style={styles.carButtonRow}>
          <TouchableOpacity style={styles.viewButton} onPress={onPress} activeOpacity={0.85}>
            <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} />
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.heartButton, { backgroundColor: aC.isDark ? '#0B1D45' : '#f1f5f9' }]} onPress={onSave}>
            <Ionicons name={saved ? "heart" : "heart-outline"} size={20} color={ORANGE} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function BuyUsedCarScreen() {
  const router    = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();

  const [tab,        setTab]        = useState<"Category"|"Brand"|"Model"|"Cities">("Category");
  const [minFocused, setMinFocused] = useState(false);
  const [maxFocused, setMaxFocused] = useState(false);
  const [recent,     setRecent]     = useState<any[]>([]);
  const [hotSelling, setHotSelling] = useState<any[]>([]);
  const [brands,     setBrands]     = useState<any[]>([]);
  const [savedIds,   setSavedIds]   = useState<Set<string>>(new Set());
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search form state
  const [city,       setCity]       = useState("All Cities");
  const [brand,      setBrand]      = useState("All Brands");
  const [year,       setYear]       = useState("Any Year");
  const [carName,    setCarName]    = useState("");
  const [variant,    setVariant]    = useState("Any Variant");
  const [color,      setColor]      = useState("Any Color");
  const [sellerType, setSellerType] = useState("All (Showroom + Sellers)");
  const [minPrice,   setMinPrice]   = useState("");
  const [maxPrice,   setMaxPrice]   = useState("");
  const [openSheet,  setOpenSheet]  = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const h: any = token ? { Authorization: `Bearer ${token}` } : {};
      // Recently Listed = all used cars | Hot Selling = sirf paid ads (AdPromotion success)
      const [a, b, c] = await Promise.all([
        fetch(`${API_BASE}/vehicles?condition=used&category=car&limit=10`, { headers: h }),
        fetch(`${API_BASE}/ads/hot-selling?condition=used&category=car&limit=10`, { headers: h }),
        fetch(`${API_BASE}/vehicles/brands?condition=used&category=car`, { headers: h }),
      ]);
      let recentItems: any[] = [];
      if (a.ok) { const d = await a.json(); recentItems = d.items || d || []; setRecent(recentItems); }
      if (b.ok) {
        const d = await b.json();
        const hot = d.items || d || [];
        // Hot Selling me sirf paid ads wali cars - agar koi paid ad nahi to empty dikhega (no fallback)
        setHotSelling(hot);
      } else {
        // Fallback agar endpoint na ho: purana featured query
        try {
          const fb = await fetch(`${API_BASE}/vehicles?condition=used&category=car&featured=true&limit=10`, { headers: h });
          if (fb.ok) { const d = await fb.json(); setHotSelling(d.items || d || []); }
        } catch {}
      }
      if (c.ok) { const d = await c.json(); setBrands(d || []); }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  async function toggleSave(id: string) {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}/save`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setSavedIds(prev => { const s = new Set(prev); d.saved ? s.add(id) : s.delete(id); return s; });
      }
    } catch {}
  }

  function goDetail(id: string) {
    router.push({ pathname: "/buy/car-detail", params: { id, from: "usedCar" } } as any);
  }

  function goSearch(extra?: Record<string, string>) {
    const params: any = { condition: "used", category: "car", seller_type: "individual", from: "usedCar" };
    if (extra) Object.assign(params, extra);
    router.push({ pathname: "/buy/search-results" as any, params });
  }

  function handleSearch() {
    const params: any = { condition: "used", category: "car", seller_type: "individual", from: "usedCar" };
    if (city && city !== "All Cities")               params.city       = city;
    if (brand && brand !== "All Brands")             params.search     = brand;
    if (carName)                                      params.search     = carName;
    if (year && year !== "Any Year")                  params.year       = year;
    if (variant && variant !== "Any Variant")         params.variant    = variant;
    if (color && color !== "Any Color")               params.color      = color;
    if (minPrice)                                     params.min_price  = minPrice;
    if (maxPrice)                                     params.max_price  = maxPrice;
    router.push({ pathname: "/buy/search-results" as any, params });
  }

  // Dropdown helper
  const fields = {
    city:       { label: "City",         value: city,       options: CITIES,        setter: setCity },
    brand:      { label: "Brand",        value: brand,      options: ["All Brands", ...brands.map((b:any) => b.name || b)], setter: setBrand },
    year:       { label: "Year",         value: year,       options: YEARS,         setter: setYear },
    variant:    { label: "Variant",      value: variant,    options: VARIANTS,      setter: setVariant },
    color:      { label: "Color",        value: color,      options: COLORS,        setter: setColor },
    sellerType: { label: "Seller Type",  value: sellerType, options: SELLER_TYPES,  setter: setSellerType },
  };

  function DropdownField({ fkey, icon, fullWidth = false, label }: { fkey: keyof typeof fields; icon: string; fullWidth?: boolean; label?: string }) {
    const f = fields[fkey];
    return (
      <View style={[styles.dropdownWrapper, fullWidth ? { width: "100%" } : { flex: 1, width: undefined }]}>
        <View style={styles.fieldLabelRow}>
          <MaterialCommunityIcons name={icon as any} size={17} color={ORANGE} />
          <Text style={[styles.fieldLabel, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>{label || f.label}</Text>
        </View>
        <TouchableOpacity style={[styles.dropdown, { backgroundColor: 'transparent', borderColor: aC.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(3,42,105,0.12)' }]} onPress={() => setOpenSheet(fkey)}>
          <Text style={[styles.dropdownText, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={1}>{f.value}</Text>
          <Ionicons name="chevron-down" size={16} color={aC.isDark ? '#F2F1F5' : '#64748b'} />
        </TouchableOpacity>
      </View>
    );
  }

  // Tab content
  function TabContent() {
    if (tab === "Brand") {
      if (loading) return <ActivityIndicator color={ORANGE} style={{ paddingVertical: 16 }} />;
      return (
        <View style={styles.categoryGrid}>
          {brands.slice(0, 8).map((b: any, i: number) => {
            const name = b.name || b;
            return (
              <TouchableOpacity key={i} style={[styles.categoryCard, { backgroundColor: aC.isDark ? CARD : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]} onPress={() => goSearch({ search: name })} activeOpacity={0.82}>
                <GlassInset />
                <MaterialCommunityIcons name="car-outline" size={24} color={ORANGE} />
                <Text style={styles.categoryText}>{name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
    if (tab === "Cities") {
      return (
        <View style={styles.categoryGrid}>
          {CITIES.slice(1).map((c, i) => (
              <TouchableOpacity key={i} style={[styles.categoryCard, { backgroundColor: aC.isDark ? CARD : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]} onPress={() => goSearch({ city: c })} activeOpacity={0.82}>
              <GlassInset />
              <Ionicons name="location-outline" size={22} color={ORANGE} />
              <Text style={styles.categoryText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (tab === "Model") {
      const models = ["Corolla","Civic","City","Alto","Cultus","Wagon R","Swift","Fortuner","Sportage","Tucson","Prado","Land Cruiser","Mehran","Bolan","Ravi"];
      return (
        <View style={styles.categoryGrid}>
          {models.map((m, i) => (
            <TouchableOpacity key={i} style={[styles.categoryCard, { backgroundColor: aC.isDark ? CARD : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]} onPress={() => goSearch({ search: m })} activeOpacity={0.82}>
              <GlassInset />
              <MaterialCommunityIcons name="car-info" size={22} color={ORANGE} />
              <Text style={styles.categoryText}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    // Default: Category
    return (
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((item, index) => (
          <TouchableOpacity key={index} style={[styles.categoryCard, styles.categoryCardFigma, { backgroundColor: aC.isDark ? '#081634' : '#ffffff', borderColor: aC.isDark ? '#6E8FC9' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]} onPress={() => goSearch({ search: item.search || item.title })} activeOpacity={0.82}>
            {aC.isDark ? <RingGlow radius={12} peak={0.45} rings={8} /> : <GlassInset />}
            <View style={styles.categoryImgWrap}>
              <Image source={item.img} style={styles.categoryImg} resizeMode="contain" />
            </View>
            <Text style={[styles.categoryText, styles.categoryTextFigma, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { backgroundColor: aC.bg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={ORANGE} />}
      >
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={27} color={aC.isDark ? WHITE : '#010a1f'} />
          </TouchableOpacity>
          {aC.isDark ? (
            <Image source={require("@/assets/images/autowizor-logo-text.png")} style={styles.logo} resizeMode="contain" />
          ) : (
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Poppins_700Bold' }}><Text style={{ color: '#032a69' }}>Auto</Text><Text style={{ color: '#e2671b' }}>wizor</Text></Text>
          )}
          <View style={{ width: 27 }} />
        </View>

        {/* FIND CAR */}
        <Text style={[styles.findText, { color: aC.isDark ? WHITE : '#010a1f' }]}>Find Your Car By</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {(["Category","Brand","Model","Cities"] as const).map(item => (
            <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.tab, styles.tabFigma, { backgroundColor: aC.isDark ? "#0B1D4A" : '#ffffff', borderColor: aC.isDark ? "transparent" : 'rgba(3,42,105,0.12)', borderWidth: 1, shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }, tab === item && { borderColor: aC.isDark ? '#7E9FD6' : ORANGE, backgroundColor: aC.isDark ? "#0E2456" : 'rgba(226,103,27,0.12)' }]}>
              <Text style={[styles.tabText, styles.tabTextFigma, { color: aC.isDark ? '#F2F1F5' : '#475569' }, tab === item && { color: ORANGE, fontFamily: 'Poppins_700Bold' }]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TabContent />

        {/* DOTS */}
        <View style={[styles.dots, { gap: 10, marginVertical: 10 }]}>
          <View style={[styles.dotFigma, { backgroundColor: aC.isDark ? '#12306A' : ORANGE }]} />
          <View style={[styles.dotFigma, { backgroundColor: aC.isDark ? '#E6E4EA' : 'rgba(3,42,105,0.2)' }]} />
          <View style={[styles.dotFigma, { backgroundColor: aC.isDark ? '#E6E4EA' : 'rgba(3,42,105,0.2)' }]} />
        </View>

        {/* BANK BANNER */}
        <AskariBank />

        {/* SEARCH BOX — border: orange (top) → blue (bottom), navy → brown background */}
        <View style={{ height: 12 }} />
        <LinearGradient
          colors={aC.isDark ? ['#E2671B', '#8A5A55', '#2E4F8E'] : ['rgba(3,42,105,0.12)', 'rgba(3,42,105,0.12)']}
          locations={aC.isDark ? [0, 0.5, 1] : undefined}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={styles.searchBorder}
        >
        <View style={[styles.searchBox, styles.searchBoxFigma, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff' }]}>
          {aC.isDark
            ? <LinearGradient colors={WARM_CARD_COLORS as any} locations={WARM_CARD_LOCATIONS as any} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            : <GlassInset />}

          <Text style={[styles.searchTitle, styles.searchTitleFigma, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Find Your Perfect Car</Text>

          <View style={styles.formRow3}>
            <DropdownField fkey="city"  icon="map-marker" />
            <DropdownField fkey="brand" icon="cube-outline" />
            <DropdownField fkey="year"  icon="calendar-clock-outline" />
          </View>

          <View style={styles.formRow3}>
            <View style={styles.dropdownWrapper3}>
              <View style={styles.fieldLabelRow}>
                <MaterialCommunityIcons name="car-outline" size={17} color={ORANGE} />
                <Text style={[styles.fieldLabel, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Car</Text>
              </View>
              <View style={[styles.dropdown, { backgroundColor: 'transparent', borderColor: aC.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(3,42,105,0.12)' }]}>
                <TextInput
                  style={[styles.dropdownText, { flex: 1, paddingVertical: 0, color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}
                  value={carName}
                  onChangeText={setCarName}
                  placeholder="Honda City"
                  placeholderTextColor={aC.isDark ? '#BAB6C4' : '#94a3b8'}
                />
                <Ionicons name="chevron-down" size={16} color={aC.isDark ? '#F2F1F5' : '#64748b'} />
              </View>
            </View>
            <DropdownField fkey="variant" icon="steering" />
            <DropdownField fkey="color"   icon="palette" />
          </View>

          <DropdownField fkey="sellerType" icon="car-arrow-right" fullWidth label="Non Dealers" />

          {/* PRICE RANGE */}
          <Text style={[styles.rangeLabel, styles.rangeLabelFigma, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Select Your Budget Range (PKR)</Text>
          <View style={styles.priceRowFigma}>
            <Text style={[styles.minMaxFigma, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Min</Text>
            <View style={[styles.priceBoxFigma, { borderColor: aC.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(3,42,105,0.12)' }]}>
              <TextInput
                style={[styles.priceTextFigma, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}
                value={minFocused ? minPrice : toMillions(minPrice)}
                onFocus={() => setMinFocused(true)}
                onBlur={() => setMinFocused(false)}
                onChangeText={setMinPrice}
                placeholder="5.8M"
                placeholderTextColor={aC.isDark ? '#BAB6C4' : '#94a3b8'}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }} />
            <Text style={[styles.minMaxFigma, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Max</Text>
            <View style={[styles.priceBoxFigma, { borderColor: aC.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(3,42,105,0.12)' }]}>
              <TextInput
                style={[styles.priceTextFigma, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}
                value={maxFocused ? maxPrice : toMillions(maxPrice)}
                onFocus={() => setMaxFocused(true)}
                onBlur={() => setMaxFocused(false)}
                onChangeText={setMaxPrice}
                placeholder="5.8M"
                placeholderTextColor={aC.isDark ? '#BAB6C4' : '#94a3b8'}
                keyboardType="numeric"
              />
            </View>
          </View>

          <RangeSlider onChangMin={setMinPrice} onChangeMax={setMaxPrice} />

          <TouchableOpacity style={[styles.searchButton, styles.searchButtonFigma]} onPress={handleSearch} activeOpacity={0.88}>
            <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} />
            <Text style={[styles.searchButtonText, styles.searchButtonTextFigma]}>Search</Text>
          </TouchableOpacity>
        </View>
        </LinearGradient>

        {/* RECENTLY LISTED */}
        <SectionHeader title="Recently Listed" onViewAll={() => goSearch()} />
        {loading ? (
          <ActivityIndicator color={ORANGE} style={{ paddingVertical: 16 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {recent.length === 0
              ? <Text style={{ color: MUTED, fontFamily: "Poppins_400Regular", fontSize: 12, paddingVertical: 16 }}>No used cars listed yet</Text>
              : recent.map(v => (
                  <CarCard key={v.id} car={v} saved={savedIds.has(v.id)} onPress={() => goDetail(v.id)} onSave={() => toggleSave(v.id)} />
                ))
            }
          </ScrollView>
        )}

        {/* HOT SELLING */}
        <SectionHeader title="Hot Selling Cars" onViewAll={() => goSearch({ hot: "true" })} />
        {loading ? (
          <ActivityIndicator color={ORANGE} style={{ paddingVertical: 16 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {hotSelling.length === 0
              ? <Text style={{ color: MUTED, fontFamily: "Poppins_400Regular", fontSize: 12, paddingVertical: 16 }}>No featured used cars yet</Text>
              : hotSelling.map(v => (
                  <CarCard key={v.id} car={v} saved={savedIds.has(v.id)} onPress={() => goDetail(v.id)} onSave={() => toggleSave(v.id)} />
                ))
            }
          </ScrollView>
        )}

        {/* YOU MAY NEED */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>You May Need This</Text>
        </View>
        <View style={styles.needRow}>
          {[
            { img: IMG_NEED_COMPARE, title: "Compare\nVehicle",          desc: "Compare vehicle features, prices, and specifications.",   route: "/compare-vehicle" },
            { img: IMG_NEED_FINANCE, title: "Smart Finance\nCalculator",  desc: "Compare financing plans and calculate your monthly payments.", route: "/auto-financing" },
          ].map((t, i) => (
            <TouchableOpacity key={i} style={[styles.needCard, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderWidth: aC.isDark ? 0 : 1, borderColor: 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]} onPress={() => router.push(t.route as any)} activeOpacity={0.85}>
              {aC.isDark
                ? <LinearGradient colors={['#071B48', '#0A1F4C', '#2B2947', '#80504A']} locations={[0, 0.52, 0.76, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} />
                : <GlassInset />}
              <Image source={t.img} style={styles.needImg} resizeMode="contain" />
              <View style={styles.needTitleRow}>
                <Text style={[styles.needTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>{t.title}</Text>
                <Ionicons name="chevron-forward" size={22} color={ORANGE} />
              </View>
              <Text style={[styles.needSub, { color: aC.isDark ? '#C9BDC1' : '#475569' }]}>{t.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* BROWSE MORE SERVICES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse More Services</Text>
        </View>
        {SERVICES.map((service, index) => (
          <TouchableOpacity style={[styles.serviceCard, styles.serviceCardFigma, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]} key={index} onPress={() => router.push(service.route as any)} activeOpacity={0.85}>
            {!aC.isDark && <GlassInset />}
            <MaterialCommunityIcons name={service.icon as any} size={28} color={ORANGE} />
            <View style={[styles.serviceText, { marginLeft: 16 }]}>
              <Text style={[styles.serviceTitle, styles.serviceTitleFigma, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>{service.title}</Text>
              <Text style={[styles.serviceSubtitle, styles.serviceSubtitleFigma, { color: aC.isDark ? '#BAB6C4' : '#475569' }]}>{service.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={ORANGE} />
          </TouchableOpacity>
        ))}

        {/* LATEST VIDEO — heading comes from LatestVideoSection itself (was showing twice)
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Video</Text>
        </View>
        */}
        <LatestVideoSection count={2} />

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* SELECT SHEETS */}
      {Object.entries(fields).map(([key, f]) => (
        <SelectSheet
          key={key}
          visible={openSheet === key}
          title={f.label}
          options={f.options}
          selected={f.value}
          onSelect={f.setter}
          onClose={() => setOpenSheet(null)}
        />
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: BG },
  container: { paddingHorizontal: 15, paddingTop: 8 },

  header:     { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo:       { flex: 1, height: 22, marginHorizontal: 12, marginTop: 18 },

  findText:     { color: WHITE, fontSize: 17, fontFamily: "Poppins_500Medium", marginTop: 14, marginBottom: 14 },
  tabsScroll:   { marginBottom: 8 },
  tab:          { backgroundColor: "rgba(16,40,88,0.9)", paddingHorizontal: 17, height: 28, borderRadius: 14, justifyContent: "center", marginRight: 9, borderWidth: 1, borderColor: "transparent" },
  activeTab:    { borderColor: ORANGE, backgroundColor: "rgba(226,103,27,0.12)" },
  tabText:      { color: MUTED, fontSize: 11, fontFamily: "Poppins_500Medium" },
  activeTabText:{ color: ORANGE },

  categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 2 },
  categoryCard: { width: "23.5%", height: 60, backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, marginBottom: 6, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  categoryIcon: { height: 28, justifyContent: "center" },
  categoryText: { color: MUTED, fontSize: 8.5, fontFamily: "Poppins_400Regular", textAlign: "center", lineHeight: 11 },

  /* Figma — Find Your Car By */
  tabFigma:          { height: 30, borderRadius: 15, paddingHorizontal: 16, marginRight: 12 },
  tabTextFigma:      { fontSize: 13, fontFamily: "Poppins_500Medium" },
  categoryCardFigma: { height: 76, borderRadius: 12, marginBottom: 8, paddingHorizontal: 2 },
  categoryImgWrap:   { height: 32, width: "100%", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  categoryImg:       { width: 58, height: 32 },
  categoryTextFigma: { fontSize: 10.5, lineHeight: 12.5 },
  dotFigma:          { width: 9, height: 9, borderRadius: 5 },

  /* Figma — Find Your Perfect Car */
  searchBorder:          { borderRadius: 18, padding: 1, marginBottom: 18 },
  searchBoxFigma:        { borderWidth: 0, borderRadius: 17, padding: 12, paddingTop: 16, marginBottom: 0 },
  searchTitleFigma:      { fontSize: 16, fontFamily: "Poppins_500Medium", marginBottom: 14 },
  formRow3:              { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 10 },
  dropdownWrapper3:      { flex: 1 },
  rangeLabelFigma:       { fontSize: 11.5, marginTop: 10, marginBottom: 6 },
  priceRowFigma:         { flexDirection: "row", alignItems: "center", gap: 8 },
  minMaxFigma:           { fontSize: 11.5, fontFamily: "Poppins_400Regular" },
  priceBoxFigma:         { width: 76, height: 32, borderWidth: 1, borderRadius: 6, justifyContent: "center", paddingHorizontal: 8 },
  priceTextFigma:        { fontSize: 12, fontFamily: "Poppins_600SemiBold", paddingVertical: 0 },
  searchButtonFigma:     { height: 44, borderRadius: 22, marginTop: 14 },
  searchButtonTextFigma: { fontSize: 17, fontFamily: "Poppins_600SemiBold", color: "#EDEBF0" },

  /* Figma — You May Need This */
  needRow:      { flexDirection: "row", gap: 14, marginBottom: 18 },
  needCard:     { width: NEED_W, minHeight: 176, borderRadius: 16, overflow: "hidden", paddingHorizontal: 10, paddingTop: 10, paddingBottom: 12, alignItems: "center" },
  needImg:      { width: 112, height: 76, marginBottom: 4 },
  needTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 4 },
  needTitle:    { flex: 1, fontSize: 14, fontFamily: "Poppins_500Medium", lineHeight: 20 },
  needSub:      { width: "100%", fontSize: 10, fontFamily: "Poppins_400Regular", lineHeight: 14 },

  /* Figma — Browse More Services */
  serviceCardFigma:     { minHeight: 60, borderRadius: 16, borderWidth: 0, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 10 },
  serviceTitleFigma:    { fontSize: 12.5, fontFamily: "Poppins_500Medium" },
  serviceSubtitleFigma: { fontSize: 10, lineHeight: 14 },

  dots:      { flexDirection: "row", justifyContent: "center", alignItems: "center", marginVertical: 6, gap: 5 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)" },
  dotActive: { width: 16, height: 6, borderRadius: 3, backgroundColor: ORANGE },

  searchBox:    { backgroundColor: CARD, borderWidth: 1.5, borderColor: ORANGE, borderRadius: 14, padding: 10, marginBottom: 15, overflow: "hidden" },
  searchTitle:  { color: WHITE, fontSize: 13, fontFamily: "Poppins_700Bold", marginBottom: 10 },

  formRow:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  dropdownWrapper:{ width: "48%" },
  fieldLabelRow:  { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 },
  fieldLabel:     { color: MUTED, fontSize: 11.5, fontFamily: "Poppins_400Regular" },
  dropdown:       { height: 34, borderRadius: 8, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 9, overflow: "hidden" },
  dropdownText:   { color: WHITE, fontSize: 11.5, fontFamily: "Poppins_500Medium", flex: 1 },

  rangeLabel:  { color: MUTED, fontSize: 9, fontFamily: "Poppins_400Regular", marginTop: 6, marginBottom: 6 },
  priceInputs: { flexDirection: "row", justifyContent: "space-between" },
  minMax:      { color: MUTED, fontSize: 8, fontFamily: "Poppins_400Regular", marginBottom: 3 },
  priceInput:  { height: 32, borderWidth: 1, borderColor: BORDER, borderRadius: 8, justifyContent: "center", paddingHorizontal: 9, overflow: "hidden" },
  priceText:   { color: WHITE, fontSize: 10, fontFamily: "Poppins_400Regular" },

  presetBtn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD },
  presetBtnActive:{ borderColor: ORANGE, backgroundColor: "rgba(226,103,27,0.1)" },
  presetTxt:      { color: MUTED, fontSize: 9, fontFamily: "Poppins_500Medium" },

  searchButton:     { height: 40, borderRadius: 20, marginTop: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  searchButtonText: { color: WHITE, fontSize: 13, fontFamily: "Poppins_700Bold" },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 4 },
  sectionTitle:  { color: WHITE, fontSize: 16, fontFamily: "Poppins_500Medium" },
  viewAll:       { color: ORANGE, fontSize: 13, fontFamily: "Poppins_500Medium" },

  horizontalList: { paddingBottom: 14 },

  carCard:      { width: 224, backgroundColor: CARD, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: BORDER, marginRight: 14 },
  carImage:     { width: "100%", height: 148 },
  carInfo:      { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 10 },
  carNameRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  carName:      { color: WHITE, fontSize: 12.5, fontFamily: "Poppins_500Medium", flex: 1 },
  carPrice:     { color: ORANGE, fontSize: 14, fontFamily: "Poppins_500Medium" },
  carDetails:   { color: "rgba(255,255,255,0.75)", fontSize: 11.5, fontFamily: "Poppins_400Regular", marginTop: 4 },
  carLocRow:    { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  carLocation:  { color: MUTED, fontSize: 11.5, fontFamily: "Poppins_400Regular", flexShrink: 1 },
  carButtonRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  viewButton:   { flex: 1, height: 30, borderRadius: 15, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  viewButtonText: { color: "#EDEBF0", fontSize: 12.5, fontFamily: "Poppins_500Medium" },
  heartButton:  { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  toolsRow:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, gap: 10 },
  toolCard:        { flex: 1, minHeight: 140, borderRadius: 12, overflow: "hidden", padding: 10, position: "relative" },
  toolImageCircle: { height: 50, alignItems: "center", justifyContent: "center" },
  toolTitle:       { color: WHITE, fontSize: 11, fontFamily: "Poppins_600SemiBold", marginTop: 4 },
  toolDescription: { color: "rgba(255,255,255,0.65)", fontSize: 8, fontFamily: "Poppins_400Regular", lineHeight: 12, marginTop: 4 },
  toolArrow:       { color: ORANGE, fontSize: 24, position: "absolute", right: 8, bottom: 8 },

  serviceCard:     { minHeight: 52, backgroundColor: CARD, borderRadius: 12, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: BORDER },
  serviceText:     { flex: 1, marginLeft: 12 },
  serviceTitle:    { color: WHITE, fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  serviceSubtitle: { color: MUTED, fontSize: 8, fontFamily: "Poppins_400Regular", marginTop: 3, lineHeight: 12 },
});
