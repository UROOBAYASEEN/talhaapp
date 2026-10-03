import React, { useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAppColors } from "@/constants/theme";
import { PRIMARY_BTN_COLORS, RingGlow, SearchInputEffect } from "@/components/shared/FigmaEffects";

const BG     = "#010a1f";
const GLASS  = "rgba(3,12,40,0.6)";
const BORDER = "rgba(100,160,255,0.5)";
const BDIM   = "rgba(255,255,255,0.12)";
const ORANGE = "#e2671b";
const NAVY   = "#032a69";
const WHITE  = "#f9fafc";
const MUTED  = "#baacb6";
const PH     = "#8f8f8f";

function GlassInset() {
  const aC = useAppColors();
  if (!aC.isDark) {
    return (
      <>
        <LinearGradient colors={["rgba(3,42,105,0.04)","transparent"]} start={{x:0.5,y:0}} end={{x:0.5,y:0.4}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        <LinearGradient colors={["transparent","rgba(226,103,27,0.06)"]} start={{x:0.5,y:0.6}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
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

// ── Dual Range Slider ─────────────────────────────────────────────────────────
function DualSlider({ min, max, low, high, format, onChangeLow, onChangeHigh, figma = false }: {
  min: number; max: number; low: number; high: number;
  format: "money" | "year";
  onChangeLow: (v: number) => void;
  onChangeHigh: (v: number) => void;
  figma?: boolean;
}) {
  const THUMB   = 24;
  const [, setMeasured] = useState(0);
  const trackW  = useRef(0);
  const loPos   = useRef(new Animated.Value((low  - min) / (max - min))).current;
  const hiPos   = useRef(new Animated.Value((high - min) / (max - min))).current;
  const loRatio = useRef((low  - min) / (max - min));
  const hiRatio = useRef((high - min) / (max - min));

  const ratioToVal = (r: number) =>
    format === "year"
      ? Math.round(min + r * (max - min))
      : Math.round((min + r * (max - min)) / 100_000) * 100_000;

  const makePan = (isLo: boolean) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (!trackW.current) return;
        const travel = trackW.current - THUMB;
        const ratio  = Math.max(0, Math.min(1, (g.moveX - THUMB / 2) / travel));
        if (isLo) {
          const c = Math.min(ratio, hiRatio.current - 0.02);
          loRatio.current = c; loPos.setValue(c); onChangeLow(ratioToVal(c));
        } else {
          const c = Math.max(ratio, loRatio.current + 0.02);
          hiRatio.current = c; hiPos.setValue(c); onChangeHigh(ratioToVal(c));
        }
      },
    });

  const loPan = useRef(makePan(true)).current;
  const hiPan = useRef(makePan(false)).current;

  return (
    <View style={sl.wrap} onLayout={e => { trackW.current = e.nativeEvent.layout.width; setMeasured(e.nativeEvent.layout.width); }}>
      <View style={[sl.rail, figma && { height: 5, backgroundColor: "#A7A5AE" }]} />
      <Animated.View style={[sl.fill, figma && { height: 5, backgroundColor: "#FF6A1A" }, {
        left:  Animated.multiply(loPos, trackW.current - THUMB),
        right: Animated.multiply(Animated.subtract(new Animated.Value(1), hiPos), trackW.current - THUMB),
      }]} />
      {([["lo", loPan, loPos], ["hi", hiPan, hiPos]] as const).map(([k, pan, pos]) => (
        <Animated.View key={k} {...pan.panHandlers}
          style={[sl.thumb, figma && { backgroundColor: "#E6E6EA" }, { left: Animated.multiply(pos, trackW.current - THUMB) }]}>
          <View style={[sl.dot, figma && { backgroundColor: "#FF6A1A" }]} />
        </Animated.View>
      ))}
    </View>
  );
}
const sl = StyleSheet.create({
  wrap:  { height: 28, justifyContent: "center", marginVertical: 14, marginHorizontal: 2 },
  rail:  { height: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2, position: "absolute", left: 0, right: 0 },
  fill:  { height: 4, backgroundColor: ORANGE, borderRadius: 2, position: "absolute" },
  thumb: { position: "absolute", width: 24, height: 24, borderRadius: 12, backgroundColor: "#f1f1f1", alignItems: "center", justifyContent: "center", elevation: 4, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 3 },
  dot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
});

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const aC = useAppColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={[ch.chip, active ? (aC.isDark ? ch.chipActive : { backgroundColor: 'rgba(226,103,27,0.12)', borderColor: ORANGE }) : (aC.isDark ? ch.chipInactive : { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)' }), aC.isDark ? {} : { shadowColor: 'rgba(3,42,105,0.06)', shadowOpacity: 0.06, elevation: 1 }]}>
      {active && <GlassInset />}
      <Text style={[ch.txt, { color: active ? (aC.isDark ? WHITE : ORANGE) : (aC.isDark ? MUTED : '#475569') }]}>{label}</Text>
      {active && <Ionicons name="close-circle" size={12} color={ORANGE} />}
    </TouchableOpacity>
  );
}
const ch = StyleSheet.create({
  chip:        { flexDirection: "row", alignItems: "center", gap: 4, height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1, overflow: "hidden" },
  chipActive:  { backgroundColor: GLASS, borderColor: BORDER },
  chipInactive:{ backgroundColor: "rgba(3,12,40,0.3)", borderColor: BDIM },
  txt:         { color: WHITE, fontSize: 11, fontFamily: "Poppins_500Medium" },
  txtMuted:    { color: MUTED },
});

// ── Add Chip ──────────────────────────────────────────────────────────────────
function AddChip({ onPress }: { onPress: () => void }) {
  const aC = useAppColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[ch.chip, aC.isDark ? ch.chipInactive : { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)' }, { paddingHorizontal: 10 }]}>
      <Ionicons name="add" size={14} color={ORANGE} />
      <Text style={[ch.txt, { color: ORANGE }]}>Add</Text>
    </TouchableOpacity>
  );
}

// ── Year Picker ───────────────────────────────────────────────────────────────
const YEARS = Array.from({ length: 27 }, (_, i) => String(2026 - i));

function YearPickerSheet({ visible, selected, onSelect, onClose }: {
  visible: boolean; selected: string[]; onSelect: (y: string) => void; onClose: () => void;
}) {
  const aC = useAppColors();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={yp.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[yp.sheet, { backgroundColor: aC.isDark ? BG : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]}>
          <GlassInset />
          <View style={[yp.handle, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(3,42,105,0.15)' }]} />
          <View style={[yp.hdr, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(3,42,105,0.08)' }]}>
            <Text style={[yp.ttl, { color: aC.isDark ? WHITE : '#010a1f' }]}>Select Year</Text>
            <TouchableOpacity onPress={onClose} style={[yp.closeBtn, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }]}>
              <Ionicons name="close" size={16} color={aC.isDark ? MUTED : '#64748b'} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
            {YEARS.map(y => (
              <TouchableOpacity key={y} style={[yp.row, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(3,42,105,0.06)' }]} onPress={() => { onSelect(y); onClose(); }}>
                <Text style={[yp.rowTxt, { color: selected.includes(y) ? ORANGE : (aC.isDark ? MUTED : '#475569') }, selected.includes(y) && { fontFamily: "Poppins_600SemiBold" }]}>{y}</Text>
                {selected.includes(y) && <Ionicons name="checkmark-circle" size={14} color={ORANGE} />}
              </TouchableOpacity>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
const yp = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  sheet:    { backgroundColor: BG, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: BORDER, paddingBottom: 32, overflow: "hidden" },
  handle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)", alignSelf: "center", marginTop: 10, marginBottom: 2 },
  hdr:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  ttl:      { color: WHITE, fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  row:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  rowTxt:   { flex: 1, color: MUTED, fontSize: 12, fontFamily: "Poppins_400Regular" },
});

// ── Section Label ─────────────────────────────────────────────────────────────
function SLabel({ text }: { text: string }) {
  const aC = useAppColors();
  return (
    <View style={s.sLabelRow}>
      <View style={[s.sLabelLine, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.12)' }]} />
      <Text style={[s.sLabelTxt, { color: aC.isDark ? MUTED : '#475569' }]}>{text}</Text>
      <View style={[s.sLabelLine, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.12)' }]} />
    </View>
  );
}

// ── Range Row ─────────────────────────────────────────────────────────────────
function RangeBox({ label, value }: { label: string; value: string }) {
  const aC = useAppColors();
  return (
    <View style={s.rangeField}>
      <Text style={[s.rangeLabel, { color: aC.isDark ? MUTED : '#475569' }]}>{label}</Text>
      <View style={[s.rangeBox, { backgroundColor: aC.isDark ? GLASS : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]}>
        <GlassInset />
        <Text style={[s.rangeVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>{value}</Text>
      </View>
    </View>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  /** Figma design (Buy Used Car flow) */
  figma?: boolean;
}

// "5800000" → "5.8M"
function fmtM(v: number) {
  if (!v) return "0";
  return `${Number((v / 1_000_000).toFixed(1))}M`;
}

const CITIES   = ["Islamabad", "Karachi", "Lahore", "Rawalpindi", "Peshawar", "Quetta", "Multan", "Faisalabad"];
const FEATURES = ["Alarm", "Bluetooth", "Cruise Control", "Parking Sensor", "Sunroof", "ABS", "Navigation", "Heated Seats"];

function fmtMoney(v: number) {
  if (v >= 10_000_000) return `${(v / 10_000_000).toFixed(1)} Cr`;
  if (v >= 100_000)    return `${(v / 100_000).toFixed(1)} L`;
  return `PKR ${v}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FilterModal({ visible, onClose, onApply, figma = false }: Props) {
  const aC = useAppColors();
  const [locationQ,      setLocationQ]      = useState("");
  const [selCities,      setSelCities]      = useState<string[]>(["Islamabad"]);
  const [modelChips,     setModelChips]     = useState<string[]>(["2024"]);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [selFeatures,    setSelFeatures]    = useState<string[]>(["Alarm", "Bluetooth"]);
  const [budgetLow,      setBudgetLow]      = useState(0);
  const [budgetHigh,     setBudgetHigh]     = useState(50_000_000);
  const [yearLow,        setYearLow]        = useState(2000);
  const [yearHigh,       setYearHigh]       = useState(2026);
  const [addFeatureOpen, setAddFeatureOpen] = useState(false);

  const filteredCities = locationQ
    ? CITIES.filter(c => c.toLowerCase().includes(locationQ.toLowerCase()))
    : CITIES;

  function toggleCity(c: string)    { setSelCities(p  => p.includes(c) ? p.filter(x => x !== c) : [...p, c]); }
  function toggleFeature(f: string) { setSelFeatures(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]); }

  function handleReset() {
    setLocationQ(""); setSelCities([]); setModelChips(["2024"]);
    setSelFeatures([]); setBudgetLow(0); setBudgetHigh(50_000_000);
    setYearLow(2000); setYearHigh(2026);
  }

  function handleApply() {
    onApply({
      cities:    selCities,
      models:    modelChips,
      features:  selFeatures,
      minBudget: budgetLow,
      maxBudget: budgetHigh,
      minYear:   yearLow,
      maxYear:   yearHigh,
    });
  }

  if (figma) {
    const citySuggestions = locationQ ? filteredCities.filter(c => !selCities.includes(c)) : [];
    const moreFeatures = FEATURES.filter(f => !selFeatures.includes(f));
    return (
      <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={f.sheet}>
            <View style={f.header}>
              <Text style={f.title}>Filter</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.8} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={26} color="#C9C6D0" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={f.scroll} keyboardShouldPersistTaps="handled">
              {/* Location */}
              <Text style={f.sTitle}>Location</Text>
              <View style={f.searchBar}>
                <SearchInputEffect />
                <Ionicons name="search-outline" size={20} color="#D8E1F2" />
                <TextInput style={f.searchInput} placeholder="Location" placeholderTextColor="#9EA7BA" value={locationQ} onChangeText={setLocationQ} />
              </View>
              <View style={f.chips}>
                {selCities.map(c => (
                  <TouchableOpacity key={c} style={f.chip} onPress={() => toggleCity(c)} activeOpacity={0.8}>
                    <Text style={f.chipTxt}>{c}</Text>
                  </TouchableOpacity>
                ))}
                {citySuggestions.map(c => (
                  <TouchableOpacity key={c} style={[f.chip, f.chipDim]} onPress={() => { toggleCity(c); setLocationQ(""); }} activeOpacity={0.8}>
                    <Text style={[f.chipTxt, { color: "#BAB6C4" }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Model */}
              <Text style={f.sTitle}>Model</Text>
              <View style={f.chips}>
                {modelChips.map(m => (
                  <TouchableOpacity key={m} style={f.chip} onPress={() => setModelChips(p => p.filter(x => x !== m))} activeOpacity={0.8}>
                    <Text style={f.chipTxt}>{m}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={f.plus} onPress={() => setYearPickerOpen(true)} activeOpacity={0.8}>
                  <Ionicons name="add" size={20} color="#F2F1F5" />
                </TouchableOpacity>
              </View>

              {/* Features */}
              <Text style={f.sTitle}>Features</Text>
              <View style={f.chips}>
                {selFeatures.map(ft => (
                  <TouchableOpacity key={ft} style={f.chip} onPress={() => toggleFeature(ft)} activeOpacity={0.8}>
                    <Text style={f.chipTxt}>{ft}</Text>
                  </TouchableOpacity>
                ))}
                {addFeatureOpen && moreFeatures.map(ft => (
                  <TouchableOpacity key={ft} style={[f.chip, f.chipDim]} onPress={() => toggleFeature(ft)} activeOpacity={0.8}>
                    <Text style={[f.chipTxt, { color: "#BAB6C4" }]}>{ft}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={f.plus} onPress={() => setAddFeatureOpen(o => !o)} activeOpacity={0.8}>
                  <Ionicons name={addFeatureOpen ? "remove" : "add"} size={20} color="#F2F1F5" />
                </TouchableOpacity>
              </View>

              {/* Budget */}
              <Text style={f.sTitle}>Select Your Budget Range (PKR)</Text>
              <View style={f.rangeRow}>
                <Text style={f.minMax}>Min</Text>
                <View style={f.box}><Text style={f.boxTxt}>{fmtM(budgetLow)}</Text></View>
                <View style={{ flex: 1 }} />
                <Text style={f.minMax}>Max</Text>
                <View style={f.box}><Text style={f.boxTxt}>{fmtM(budgetHigh)}</Text></View>
              </View>
              <DualSlider figma min={0} max={50_000_000} low={budgetLow} high={budgetHigh}
                format="money" onChangeLow={setBudgetLow} onChangeHigh={setBudgetHigh} />

              {/* Year range */}
              <Text style={f.sTitle}>Model year range</Text>
              <View style={f.rangeRow}>
                <Text style={f.minMax}>Min</Text>
                <View style={f.box}><Text style={f.boxTxt}>{yearLow}</Text></View>
                <View style={{ flex: 1 }} />
                <Text style={f.minMax}>Max</Text>
                <View style={f.box}><Text style={f.boxTxt}>{yearHigh}</Text></View>
              </View>
              <DualSlider figma min={1970} max={2026} low={yearLow} high={yearHigh}
                format="year" onChangeLow={setYearLow} onChangeHigh={setYearHigh} />
            </ScrollView>

            <View style={f.actions}>
              <TouchableOpacity onPress={handleApply} activeOpacity={0.86} style={f.applyBtn}>
                <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                <Text style={f.applyTxt}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReset} activeOpacity={0.86} style={f.resetBtn}>
                <RingGlow radius={26} peak={0.5} rings={12} />
                <Text style={f.resetTxt}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <YearPickerSheet
          visible={yearPickerOpen}
          selected={modelChips}
          onSelect={y => { if (!modelChips.includes(y)) setModelChips(p => [...p, y]); }}
          onClose={() => setYearPickerOpen(false)}
        />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, { backgroundColor: aC.isDark ? BG : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]}>
          <GlassInset />

          {/* Handle + Header */}
          <View style={[s.handle, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(3,42,105,0.15)' }]} />
          <View style={[s.header, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(3,42,105,0.08)' }]}>
            <Text style={[s.title, { color: aC.isDark ? WHITE : '#010a1f' }]}>Filter</Text>
            <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', borderWidth: 1 }]} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color={aC.isDark ? MUTED : '#64748b'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

            {/* ── Location ── */}
            <SLabel text="Location" />
            <View style={[s.searchBar, { backgroundColor: aC.isDark ? GLASS : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
              <GlassInset />
              <Ionicons name="search-outline" size={15} color={PH} />
              <TextInput
                style={[s.searchInput, { color: aC.isDark ? WHITE : '#010a1f' }]}
                placeholder="Search city..."
                placeholderTextColor={PH}
                value={locationQ}
                onChangeText={setLocationQ}
              />
            </View>
            <View style={s.chips}>
              {filteredCities.map(c => (
                <Chip key={c} label={c} active={selCities.includes(c)} onPress={() => toggleCity(c)} />
              ))}
            </View>

            {/* ── Model Year ── */}
            <SLabel text="Model" />
            <View style={s.chips}>
              {modelChips.map(m => (
                <Chip key={m} label={m} active onPress={() => setModelChips(p => p.filter(x => x !== m))} />
              ))}
              <AddChip onPress={() => setYearPickerOpen(true)} />
            </View>

            {/* ── Features ── */}
            <SLabel text="Features" />
            <View style={s.chips}>
              {FEATURES.map(f => (
                <Chip key={f} label={f} active={selFeatures.includes(f)} onPress={() => toggleFeature(f)} />
              ))}
            </View>

            {/* ── Budget ── */}
            <SLabel text="Budget Range (PKR)" />
            <View style={s.rangeRow}>
              <RangeBox label="Min" value={fmtMoney(budgetLow)} />
              <View style={s.rangeDivider}><Text style={s.rangeDash}>—</Text></View>
              <RangeBox label="Max" value={fmtMoney(budgetHigh)} />
            </View>
            <DualSlider min={0} max={50_000_000} low={budgetLow} high={budgetHigh}
              format="money" onChangeLow={setBudgetLow} onChangeHigh={setBudgetHigh} />

            {/* ── Year Range ── */}
            <SLabel text="Model Year Range" />
            <View style={s.rangeRow}>
              <RangeBox label="From" value={String(yearLow)} />
              <View style={s.rangeDivider}><Text style={s.rangeDash}>—</Text></View>
              <RangeBox label="To"   value={String(yearHigh)} />
            </View>
            <DualSlider min={1990} max={2026} low={yearLow} high={yearHigh}
              format="year" onChangeLow={setYearLow} onChangeHigh={setYearHigh} />

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Buttons */}
          <View style={s.actions}>
            <TouchableOpacity onPress={handleApply} activeOpacity={0.86} style={s.applyBtn}>
              <LinearGradient colors={[NAVY, ORANGE]} start={{x:0,y:0}} end={{x:1,y:0}} style={s.btnGrad}>
                <Text style={s.btnTxt}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset} activeOpacity={0.86} style={s.resetBtn}>
              <GlassInset />
              <Text style={[s.btnTxt, { color: MUTED }]}>Reset</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>

      <YearPickerSheet
        visible={yearPickerOpen}
        selected={modelChips}
        onSelect={y => { if (!modelChips.includes(y)) setModelChips(p => [...p, y]); }}
        onClose={() => setYearPickerOpen(false)}
      />
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: BORDER,
    maxHeight: "92%",
    overflow: "hidden",
  },

  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)", alignSelf: "center", marginTop: 12 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)",
  },
  title:    { color: WHITE, fontSize: 15, fontFamily: "Poppins_700Bold" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center" },

  scroll: { paddingHorizontal: 18, paddingBottom: 8 },

  // Section label with lines
  sLabelRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20, marginBottom: 10 },
  sLabelLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  sLabelTxt:  { color: MUTED, fontSize: 11, fontFamily: "Poppins_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },

  // Search bar — pill style
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    height: 42, borderRadius: 30, borderWidth: 1, borderColor: BORDER,
    backgroundColor: GLASS, paddingHorizontal: 16,
    overflow: "hidden", marginBottom: 10,
  },
  searchInput: { flex: 1, color: WHITE, fontSize: 12, fontFamily: "Poppins_400Regular" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  // Range row
  rangeRow:     { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  rangeField:   { flex: 1, gap: 5 },
  rangeLabel:   { color: MUTED, fontSize: 10, fontFamily: "Poppins_400Regular" },
  rangeBox:     { height: 38, borderRadius: 10, borderWidth: 1, borderColor: BORDER, backgroundColor: GLASS, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  rangeVal:     { color: WHITE, fontSize: 12, fontFamily: "Poppins_500Medium" },
  rangeDivider: { paddingBottom: 10 },
  rangeDash:    { color: MUTED, fontSize: 14 },

  // Buttons
  actions: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 30, gap: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  applyBtn: { borderRadius: 30, overflow: "hidden" },
  btnGrad:  { height: 46, alignItems: "center", justifyContent: "center" },
  resetBtn: { height: 46, borderRadius: 30, borderWidth: 1, borderColor: BORDER, backgroundColor: GLASS, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  btnTxt:   { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold" },
});

// ── Figma (Buy Used Car) filter styles ──
const f = StyleSheet.create({
  sheet:      { backgroundColor: "#010A1F", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "94%", overflow: "hidden", borderWidth: 1, borderColor: "rgba(126,159,214,0.35)" },
  header:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 20, paddingBottom: 4 },
  title:      { color: "#F2F1F5", fontSize: 20, fontFamily: "Poppins_600SemiBold" },
  scroll:     { paddingHorizontal: 18, paddingBottom: 8 },
  sTitle:     { color: "#F2F1F5", fontSize: 15, fontFamily: "Poppins_600SemiBold", marginTop: 16, marginBottom: 10 },
  searchBar:  { flexDirection: "row", alignItems: "center", gap: 12, height: 50, borderRadius: 32, borderWidth: 1, borderColor: "#829fd0", backgroundColor: "rgba(3,12,40,0.6)", paddingHorizontal: 18, overflow: "hidden", marginBottom: 12 },
  searchInput:{ flex: 1, color: "#F2F1F5", fontSize: 14, fontFamily: "Poppins_400Regular" },
  chips:      { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  chip:       { height: 32, paddingHorizontal: 14, borderRadius: 16, backgroundColor: "#0B2A63", alignItems: "center", justifyContent: "center" },
  chipDim:    { backgroundColor: "rgba(11,42,99,0.45)" },
  chipTxt:    { color: "#F2F1F5", fontSize: 13, fontFamily: "Poppins_400Regular" },
  plus:       { width: 34, height: 34, borderRadius: 17, backgroundColor: "#0B2A63", alignItems: "center", justifyContent: "center" },
  rangeRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  minMax:     { color: "#E6E4EA", fontSize: 12, fontFamily: "Poppins_400Regular" },
  box:        { width: 92, height: 40, borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", borderRadius: 6, justifyContent: "center", paddingHorizontal: 10 },
  boxTxt:     { color: "#F2F1F5", fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  actions:    { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28, gap: 12 },
  applyBtn:   { height: 52, borderRadius: 26, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  applyTxt:   { color: "#EDEBF0", fontSize: 17, fontFamily: "Poppins_500Medium" },
  resetBtn:   { height: 52, borderRadius: 26, borderWidth: 1, borderColor: "#7E9FD6", backgroundColor: "#07142F", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  resetTxt:   { color: "#C9C6D0", fontSize: 17, fontFamily: "Poppins_500Medium" },
});
