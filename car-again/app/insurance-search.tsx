import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, Car, Bike } from 'lucide-react-native';
import { AppColors, useAppColors } from '@/constants/theme';
import AskariBank from '@/components/shared/AskariBank';

const ORANGE = '#e2671b';
const NAVY   = '#032a69';
const C      = AppColors;

const BRANDS  = ['Toyota', 'Honda', 'Suzuki', 'Kia', 'Hyundai', 'Changan', 'MG', 'DFSK'];
const MODELS  = ['Corolla', 'Civic', 'Swift', 'Sportage', 'Tucson', 'Alsvin', 'HS', 'Cultus'];
const YEARS   = Array.from({ length: 15 }, (_, i) => String(2026 - i));
const CITIES  = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta', 'Faisalabad', 'Multan'];

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
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

function Dropdown({ label, value, options, onSelect }: {
  label: string; value: string; options: string[]; onSelect: (v: string) => void;
}) {
  const aC = useAppColors();
  const [open, setOpen] = useState(false);
  return (
    <View style={[s.fieldWrap, { zIndex: open ? 99 : 1 }]}>
      <Text style={[s.fieldLabel, { color: aC.isDark ? '#baacb6' : '#475569' }]}>{label}</Text>
      <TouchableOpacity
        style={[s.dropBtn, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.85}
      >
        <GlassInset />
        <Text style={[s.dropVal, { color: !value ? (aC.isDark ? '#8f8f8f' : '#94a3b8') : (aC.isDark ? '#f9fafc' : '#010a1f') }]}>
          {value || `Select ${label}`}
        </Text>
        <ChevronDown
          size={16}
          color={aC.isDark ? '#baacb6' : '#64748b'}
          style={open ? { transform: [{ rotate: '180deg' }] } : undefined}
        />
      </TouchableOpacity>
      {open && (
        <View style={[s.dropList, { backgroundColor: aC.isDark ? 'rgba(6,18,52,0.98)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.12, elevation: aC.isDark ? 0 : 8 }]}>
          {aC.isDark ? (
            <>
              <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.03)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.7 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          )}
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[s.dropOption, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.06)' }, value === opt && { backgroundColor: aC.isDark ? 'rgba(226,103,27,0.1)' : 'rgba(226,103,27,0.08)' }]}
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
  const [registered,  setRegistered]  = useState<'yes' | 'no'>('yes');
  const [brand,       setBrand]       = useState('');
  const [model,       setModel]       = useState('');
  const [year,        setYear]        = useState('');
  const [city,        setCity]        = useState('Karachi');
  const [regNumber,   setRegNumber]   = useState('');
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!brand.trim())     e.brand  = 'Please enter a brand';
    if (!model.trim())     e.model  = 'Please enter a model';
    if (!year.trim())      e.year   = 'Please enter a year';
    if (!regNumber.trim()) e.regNumber = 'Please enter registration number';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSearch() {
    if (!validate()) return;
    router.push({
      pathname: '/insurance/compare-plans' as any,
      params: { vehicle_type: vehicleType, brand, model, year, city, reg_number: regNumber },
    });
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { backgroundColor: aC.bg }]}>

          {/* HEADER */}
          <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <ChevronLeft size={24} color={aC.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: aC.textPrimary }]}>
              Auto<Text style={{ color: ORANGE }}>wizor</Text>
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {/* AD BANNER */}
          <View style={{ marginBottom: 24 }}>
            <AskariBank />
          </View>

          {/* VEHICLE TYPE */}
          <Text style={[s.sectionTitle, { color: aC.textPrimary }]}>Select Vehicle Type</Text>
          <View style={s.typeRow}>
            <TouchableOpacity
              style={[s.typeCard, { backgroundColor: aC.isDark ? (vehicleType === 'car' ? 'rgba(19,34,66,1)' : '#061B4A') : '#ffffff', borderColor: aC.isDark ? (vehicleType === 'car' ? 'rgba(226,103,27,0.6)' : 'rgba(255,255,255,0.1)') : (vehicleType === 'car' ? ORANGE : 'rgba(3,42,105,0.12)'), shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}
              onPress={() => setVehicleType('car')}
              activeOpacity={0.85}
            >
              {vehicleType === 'car' ? (
                aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                    <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                    <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                    <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                  </>
                )
              ) : null}
              <Car size={26} color={vehicleType === 'car' ? ORANGE : aC.textSecondary} />
              <Text style={[s.typeTxt, { color: vehicleType === 'car' ? ORANGE : aC.textSecondary }]}>Cars</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.typeCard, { backgroundColor: aC.isDark ? (vehicleType === 'bike' ? 'rgba(19,34,66,1)' : '#061B4A') : '#ffffff', borderColor: aC.isDark ? (vehicleType === 'bike' ? 'rgba(226,103,27,0.6)' : 'rgba(255,255,255,0.1)') : (vehicleType === 'bike' ? ORANGE : 'rgba(3,42,105,0.12)'), shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}
              onPress={() => setVehicleType('bike')}
              activeOpacity={0.85}
            >
              {vehicleType === 'bike' ? (
                aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                    <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                    <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                    <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                  </>
                )
              ) : null}
              <Bike size={26} color={vehicleType === 'bike' ? ORANGE : aC.textSecondary} />
              <Text style={[s.typeTxt, { color: vehicleType === 'bike' ? ORANGE : aC.textSecondary }]}>Bikes</Text>
            </TouchableOpacity>
          </View>

          {/* BASIC DETAILS */}
          <Text style={[s.sectionTitle, { color: aC.textPrimary, marginTop: 24 }]}>Vehicle Details</Text>
          <View style={s.fieldWrap}>
            <Text style={[s.fieldLabel, { color: aC.isDark ? '#baacb6' : '#475569' }]}>Brand</Text>
            <View style={[s.inputBox, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
              <GlassInset />
              <TextInput style={[s.input, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]} placeholder="e.g. Toyota, Honda, Suzuki" placeholderTextColor={aC.isDark ? '#8f8f8f' : '#94a3b8'} value={brand} onChangeText={v => { setBrand(v); setErrors(p => ({ ...p, brand: '' })); }} />
            </View>
          </View>
          {errors.brand && <Text style={s.errTxt}>{errors.brand}</Text>}

          <View style={s.fieldWrap}>
            <Text style={[s.fieldLabel, { color: aC.isDark ? '#baacb6' : '#475569' }]}>Model</Text>
            <View style={[s.inputBox, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
              <GlassInset />
              <TextInput style={[s.input, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]} placeholder="e.g. Corolla, Civic, Alto" placeholderTextColor={aC.isDark ? '#8f8f8f' : '#94a3b8'} value={model} onChangeText={v => { setModel(v); setErrors(p => ({ ...p, model: '' })); }} />
            </View>
          </View>
          {errors.model && <Text style={s.errTxt}>{errors.model}</Text>}

          <View style={s.fieldWrap}>
            <Text style={[s.fieldLabel, { color: aC.isDark ? '#baacb6' : '#475569' }]}>Year</Text>
            <View style={[s.inputBox, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
              <GlassInset />
              <TextInput style={[s.input, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]} placeholder="e.g. 2024" placeholderTextColor={aC.isDark ? '#8f8f8f' : '#94a3b8'} value={year} onChangeText={v => { setYear(v); setErrors(p => ({ ...p, year: '' })); }} keyboardType="numeric" maxLength={4} />
            </View>
          </View>
          {errors.year && <Text style={s.errTxt}>{errors.year}</Text>}

          {/* Registered */}
          <View style={s.fieldWrap}>
            <Text style={[s.fieldLabel, { color: aC.isDark ? '#baacb6' : '#475569' }]}>Registered</Text>
            <View style={s.radioRow}>
              {(['yes', 'no'] as const).map(opt => (
                <TouchableOpacity key={opt} style={s.radioItem} onPress={() => setRegistered(opt)} activeOpacity={0.8}>
                  <View style={[s.radioCircle, { borderColor: aC.isDark ? '#baacb6' : 'rgba(3,42,105,0.18)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }, registered === opt && { borderColor: '#60a5fa', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}>
                    {registered === opt && <View style={s.radioDot} />}
                  </View>
                  <Text style={[s.radioTxt, { color: aC.isDark ? '#baacb6' : '#475569' }]}>{opt === 'yes' ? 'Yes' : 'No'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Dropdown label="City" value={city} options={CITIES} onSelect={setCity} />

          {/* Registration Number */}
          <View style={s.fieldWrap}>
            <Text style={[s.fieldLabel, { color: aC.isDark ? '#baacb6' : '#475569' }]}>Registration Number</Text>
            <View style={[s.inputBox, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
              <GlassInset />
              <TextInput style={[s.input, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]} placeholder="e.g. LEA-22-1234" placeholderTextColor={aC.isDark ? '#8f8f8f' : '#94a3b8'} value={regNumber} onChangeText={v => { setRegNumber(v); setErrors(p => ({ ...p, regNumber: '' })); }} autoCapitalize="characters" />
            </View>
          </View>
          {errors.regNumber && <Text style={s.errTxt}>{errors.regNumber}</Text>}

          {/* SEARCH BUTTON */}
          <TouchableOpacity style={s.searchBtn} activeOpacity={0.85} onPress={handleSearch}>
            <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Text style={s.searchTxt}>Get Insurance Quotes</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  sectionTitle: { color: C.textPrimary, fontSize: 15, fontFamily: 'Poppins_500Medium', marginBottom: 14 },
  typeRow:         { flexDirection: 'row', gap: 14, marginBottom: 4 },
  typeCard:        { flex: 1, height: 96, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden' },
  typeCardActive:  { borderColor: 'rgba(226,103,27,0.6)', backgroundColor: 'rgba(19,34,66,1)' },
  typeCardInactive:{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#061B4A' },
  typeTxt:      { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  fieldWrap:  { marginBottom: 18, zIndex: 1 },
  fieldLabel: { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
  dropBtn:    { height: 52, borderRadius: 30, borderWidth: 1, borderColor: C.glassBorder, backgroundColor: C.glassBg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, overflow: 'hidden' },
  dropVal:    { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_400Regular', flex: 1 },
  dropList:   { position: 'absolute', top: 88, left: 0, right: 0, backgroundColor: 'rgba(6,18,52,0.98)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', overflow: 'hidden', zIndex: 100 },
  dropOption: { paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  dropOptionActive: { backgroundColor: 'rgba(226,103,27,0.1)' },
  dropOptionTxt:{ color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  radioRow:   { flexDirection: 'row', gap: 28 },
  radioItem:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioCircle:{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: C.textSecondary, alignItems: 'center', justifyContent: 'center' },
  radioCircleActive: { borderColor: '#60a5fa' },
  radioDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: '#60a5fa' },
  radioTxt:   { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  inputBox: { height: 52, borderRadius: 30, borderWidth: 1, borderColor: C.glassBorder, backgroundColor: C.glassBg, overflow: 'hidden', justifyContent: 'center' },
  input:    { paddingHorizontal: 20, color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  searchBtn:  { height: 52, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  searchTxt:  { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold', letterSpacing: 0.3 },
  errTxt:     { color: '#f87171', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: -12, marginBottom: 10, marginLeft: 4 },
});
