import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppColors, useAppColors } from '@/constants/theme';
import AskariBank from '@/components/shared/AskariBank';
import { PRIMARY_BTN_COLORS, SavedCardEffect, SearchInputEffect } from '@/components/shared/FigmaEffects';

const ORANGE = '#e2671b';
const C      = AppColors;

const BRANDS  = ['Toyota', 'Honda', 'Suzuki', 'Kia', 'Hyundai', 'Changan', 'MG', 'DFSK'];
const MODELS  = ['Corolla', 'Civic', 'Swift', 'Sportage', 'Tucson', 'Alsvin', 'HS', 'Cultus'];
const YEARS   = Array.from({ length: 15 }, (_, i) => String(2026 - i));
const CITIES  = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta', 'Faisalabad', 'Multan'];
const MARKET_VALUES = ['PKR 30,000', 'PKR 500,000', 'PKR 1,000,000', 'PKR 2,500,000', 'PKR 5,000,000', 'PKR 7,500,000', 'PKR 10,000,000'];

function GlassInset() {
  const aC = useAppColors();
  if (!aC.isDark) {
    return (
      <>
        <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      </>
    );
  }
  return <SearchInputEffect />;
}

// Figma pill dropdown (saved search-input effect)
function Dropdown({ label, value, placeholder, options, onSelect }: {
  label: string; value: string; placeholder?: string; options: string[]; onSelect: (v: string) => void;
}) {
  const aC = useAppColors();
  const [open, setOpen] = useState(false);
  return (
    <View style={[s.fieldWrap, { zIndex: open ? 99 : 1 }]}>
      <Text style={[s.fieldLabel, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>{label}</Text>
      <TouchableOpacity
        style={[s.pill, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)' }]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.85}
      >
        <GlassInset />
        <Text style={[s.pillTxt, { color: aC.isDark ? '#F2F1F5' : (value ? '#010a1f' : '#94a3b8') }]}>
          {value || placeholder || `Select ${label}`}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={aC.isDark ? '#F2F1F5' : '#64748b'} />
      </TouchableOpacity>
      {open && (
        <View style={[s.dropList, { backgroundColor: aC.isDark ? 'rgba(6,18,52,0.98)' : '#ffffff', borderColor: aC.isDark ? 'rgba(126,159,214,0.5)' : 'rgba(3,42,105,0.12)' }]}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[s.dropOption, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.06)' }, value === opt && { backgroundColor: 'rgba(226,103,27,0.1)' }]}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[s.dropOptionTxt, { color: value === opt ? ORANGE : (aC.isDark ? '#f9fafc' : '#010a1f') }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function InsuranceSearchScreen() {
  const router = useRouter();
  const aC = useAppColors();

  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');
  const [condition,   setCondition]   = useState<'new' | 'used'>('new');
  const [registered,  setRegistered]  = useState<'yes' | 'no'>('yes');
  const [brand,       setBrand]       = useState('');
  const [model,       setModel]       = useState('');
  const [year,        setYear]        = useState('');
  const [marketValue, setMarketValue] = useState('');
  const [city,        setCity]        = useState('Karachi');
  const [regNumber,   setRegNumber]   = useState('');
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!brand.trim())     e.brand  = 'Please select a brand';
    if (!model.trim())     e.model  = 'Please select a model';
    if (!year.trim())      e.year   = 'Please select a year';
    if (!regNumber.trim()) e.regNumber = 'Please enter registration number';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSearch() {
    if (!validate()) return;
    router.push({
      pathname: '/insurance/compare-plans' as any,
      params: {
        vehicle_type: vehicleType, brand, model, year, city, reg_number: regNumber,
        condition, registered, market_value: marketValue,
      },
    });
  }

  const dark = aC.isDark;
  const typeCard = (active: boolean) => [
    s.typeCard,
    dark
      ? (active ? { backgroundColor: '#010A1F', borderColor: '#82a5d5', borderWidth: 1, shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 } : { backgroundColor: '#0B1D4A', borderColor: 'transparent', borderWidth: 1 })
      : { backgroundColor: '#ffffff', borderWidth: 1, borderColor: active ? ORANGE : 'rgba(3,42,105,0.12)' },
  ];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { backgroundColor: aC.bg }]} keyboardShouldPersistTaps="handled">

          {/* HEADER */}
          <View style={[s.header, { backgroundColor: dark ? 'transparent' : '#ffffff' }]}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={26} color={dark ? '#C9C6D0' : '#010a1f'} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: dark ? '#F2F1F5' : '#010a1f' }]}>
              Auto<Text style={{ color: ORANGE }}>wizor</Text>
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {/* AD BANNER */}
          <View style={{ marginBottom: 18 }}>
            <AskariBank />
          </View>

          {/* VEHICLE TYPE */}
          <Text style={[s.sectionTitle, { color: dark ? '#F2F1F5' : '#010a1f' }]}>Select Vehicle Type</Text>
          <View style={s.typeRow}>
            <TouchableOpacity style={typeCard(vehicleType === 'car')} onPress={() => setVehicleType('car')} activeOpacity={0.85}>
              {vehicleType === 'car' && (dark ? <SavedCardEffect /> : <GlassInset />)}
              <MaterialCommunityIcons name="car" size={26} color={vehicleType === 'car' ? ORANGE : (dark ? '#F2F1F5' : '#475569')} />
              <Text style={[s.typeTxt, { color: dark ? '#F2F1F5' : '#010a1f' }]}>Cars</Text>
            </TouchableOpacity>
            <TouchableOpacity style={typeCard(vehicleType === 'bike')} onPress={() => setVehicleType('bike')} activeOpacity={0.85}>
              {vehicleType === 'bike' && (dark ? <SavedCardEffect /> : <GlassInset />)}
              <MaterialCommunityIcons name="motorbike" size={28} color={vehicleType === 'bike' ? ORANGE : (dark ? '#F2F1F5' : '#475569')} />
              <Text style={[s.typeTxt, { color: dark ? '#F2F1F5' : '#010a1f' }]}>Bikes</Text>
            </TouchableOpacity>
          </View>

          {/* VEHICLE CONDITION */}
          <Text style={[s.sectionTitle, { color: dark ? '#F2F1F5' : '#010a1f', marginTop: 14 }]}>Vehicle Condition</Text>
          <View style={s.typeRow}>
            {([
              { key: 'new',  title: vehicleType === 'bike' ? 'New Bikes' : 'New Cars', sub: 'Brand new Vehicle' },
              { key: 'used', title: vehicleType === 'bike' ? 'Used Bike' : 'Used Car', sub: 'Pre-owned Vehicle' },
            ] as const).map(c => {
              const active = condition === c.key;
              return (
                <TouchableOpacity key={c.key} style={[...typeCard(active), s.condCard]} onPress={() => setCondition(c.key)} activeOpacity={0.85}>
                  {active && (dark ? <SavedCardEffect /> : <GlassInset />)}
                  <View style={s.condIcon}>
                    <MaterialCommunityIcons name={vehicleType === 'bike' ? 'motorbike' : 'car'} size={16} color={ORANGE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.condTitle, { color: dark ? '#F2F1F5' : '#010a1f' }]}>{c.title}</Text>
                    <Text style={[s.condSub, { color: dark ? '#BAB6C4' : '#64748b' }]}>{c.sub}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* BASIC DETAILS */}
          <Text style={[s.bigTitle, { color: dark ? '#F2F1F5' : '#010a1f' }]}>Basic Details</Text>

          <Dropdown label="Brand" value={brand} placeholder="Select Brand" options={BRANDS} onSelect={v => { setBrand(v); setErrors(p => ({ ...p, brand: '' })); }} />
          {!!errors.brand && <Text style={s.errTxt}>{errors.brand}</Text>}

          <Dropdown label="Model" value={model} placeholder="Select Model" options={MODELS} onSelect={v => { setModel(v); setErrors(p => ({ ...p, model: '' })); }} />
          {!!errors.model && <Text style={s.errTxt}>{errors.model}</Text>}

          <Dropdown label="Year" value={year} placeholder="Select Year" options={YEARS} onSelect={v => { setYear(v); setErrors(p => ({ ...p, year: '' })); }} />
          {!!errors.year && <Text style={s.errTxt}>{errors.year}</Text>}

          <Dropdown label="Estimated Market Value" value={marketValue} placeholder="PKR 30,000" options={MARKET_VALUES} onSelect={setMarketValue} />

          {/* Registered */}
          <View style={s.radioRow}>
            <Text style={[s.radioLabel, { color: dark ? '#C9C6D0' : '#475569' }]}>Registered</Text>
            {(['yes', 'no'] as const).map(opt => {
              const active = registered === opt;
              return (
                <TouchableOpacity key={opt} style={s.radioItem} onPress={() => setRegistered(opt)} activeOpacity={0.8}>
                  <View style={[s.radioOuter, active && s.radioOuterActive]}>
                    <View style={[s.radioInner, active && s.radioInnerActive]} />
                  </View>
                  <Text style={[s.radioTxt, { color: dark ? '#F2F1F5' : '#010a1f' }]}>{opt === 'yes' ? 'Yes' : 'No'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Dropdown label="Registration City" value={city} options={CITIES} onSelect={setCity} />

          {/* Registration Number */}
          <View style={s.fieldWrap}>
            <Text style={[s.fieldLabel, { color: dark ? '#C9C6D0' : '#475569' }]}>Registration Number</Text>
            <View style={[s.pill, { backgroundColor: dark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: dark ? '#829fd0' : 'rgba(3,42,105,0.12)' }]}>
              <GlassInset />
              <TextInput
                style={[s.pillInput, { color: dark ? '#F2F1F5' : '#010a1f' }]}
                placeholder="LEA-22-1234"
                placeholderTextColor={dark ? '#F2F1F5' : '#94a3b8'}
                value={regNumber}
                onChangeText={v => { setRegNumber(v); setErrors(p => ({ ...p, regNumber: '' })); }}
                autoCapitalize="characters"
              />
            </View>
          </View>
          {!!errors.regNumber && <Text style={s.errTxt}>{errors.regNumber}</Text>}

          {/* SEARCH BUTTON */}
          <TouchableOpacity style={s.searchBtn} activeOpacity={0.85} onPress={handleSearch}>
            <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Text style={s.searchTxt}>Search Insurance</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 30 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold' },

  sectionTitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 12 },
  bigTitle:     { fontSize: 19, fontFamily: 'Poppins_500Medium', marginTop: 16, marginBottom: 12 },

  typeRow:  { flexDirection: 'row', gap: 12 },
  typeCard: { flex: 1, height: 88, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  typeTxt:  { fontSize: 15, fontFamily: 'Poppins_500Medium' },

  condCard:  { height: 60, flexDirection: 'row', justifyContent: 'flex-start', gap: 10, paddingHorizontal: 10 },
  condIcon:  { width: 32, height: 32, borderRadius: 16, backgroundColor: '#12306A', alignItems: 'center', justifyContent: 'center' },
  condTitle: { fontSize: 13.5, fontFamily: 'Poppins_500Medium' },
  condSub:   { fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 1 },

  fieldWrap:  { marginBottom: 12, zIndex: 1 },
  fieldLabel: { fontSize: 13.5, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
  pill:       { height: 46, borderRadius: 32, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, overflow: 'hidden' },
  pillTxt:    { flex: 1, fontSize: 13.5, fontFamily: 'Poppins_400Regular' },
  pillInput:  { flex: 1, fontSize: 13.5, fontFamily: 'Poppins_400Regular', paddingVertical: 0 },

  dropList:      { position: 'absolute', top: 82, left: 0, right: 0, borderRadius: 14, borderWidth: 1, overflow: 'hidden', zIndex: 100 },
  dropOption:    { paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1 },
  dropOptionTxt: { fontSize: 13, fontFamily: 'Poppins_400Regular' },

  radioRow:   { flexDirection: 'row', alignItems: 'center', gap: 22, marginTop: 6, marginBottom: 16 },
  radioLabel: { fontSize: 13.5, fontFamily: 'Poppins_400Regular' },
  radioItem:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#1D3B73', borderWidth: 1, borderColor: 'rgba(143,174,227,0.6)', alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: '#8FAEE3', shadowColor: '#8FAEE3', shadowOpacity: 0.7, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  radioInner: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(220,230,247,0.45)' },
  radioInnerActive: { borderWidth: 2, borderColor: '#DCE6F7', backgroundColor: '#0E2552' },
  radioTxt:   { fontSize: 13.5, fontFamily: 'Poppins_400Regular' },

  searchBtn:  { height: 48, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  searchTxt:  { color: '#EDEBF0', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  errTxt:     { color: '#f87171', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: -6, marginBottom: 10, marginLeft: 4 },
});
