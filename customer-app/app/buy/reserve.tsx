import { useAppColors, withLightStyles, LIGHT_POP_SHADOW } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { SavedCardEffect, SearchInputEffect, savedCardOuter } from '@/components/shared/FigmaEffects';

const BG      = '#010A1F';
const CARD    = '#131d38';
const ORANGE  = '#e2671b';
const NAVY    = '#032a69';
const WHITE   = '#f9fafc';
const MUTED   = '#baacb6';
const BORDER  = 'rgba(255,255,255,0.1)';
const BLUE_B  = 'rgba(100,160,255,0.4)';

const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Peshawar','Multan','Faisalabad','Quetta','Sialkot','Gujranwala'];

const SERVER_BASE = API_BASE.replace('/api/v1', '');
function imgUrl(url?: string) {
  if (!url || url.startsWith('file://')) return null;
  if (url.startsWith('http')) return url.replace(/http:\/\/[\d.]+:\d+/, SERVER_BASE);
  return `${SERVER_BASE}${url}`;
}
function formatPrice(p: number) {
  if (p >= 10_000_000) return `PKR ${(p / 10_000_000).toFixed(2)} Crore`;
  if (p >= 100_000)    return `PKR ${(p / 100_000).toFixed(2)} Lacs`;
  return `PKR ${p.toLocaleString()}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const aC = useAppColors();
  const s = aC.isDark ? s_dark : s_light;
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function ReserveScreen() {
  const aC = useAppColors();
  const s = aC.isDark ? s_dark : s_light;
  const router = useRouter();
  const { id, variantName } = useLocalSearchParams<{ id: string; variantName?: string }>();
  const { token, user } = useAuth();

  const [vehicle,       setVehicle]       = useState<any>(null);
  const [cityOpen,      setCityOpen]       = useState(false);
  const [form, setForm] = useState({
    fullName: (user as any)?.full_name || '',
    phone:    (user as any)?.phone     || '',
    city:     (user as any)?.city      || 'Karachi',
    cnic:     (user as any)?.cnic      || '',
    notes:    '',
  });

  useEffect(() => { if (id) loadVehicle(); }, [id]);

  async function loadVehicle() {
    try {
      const h: any = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/vehicles/${id}`, { headers: h });
      if (res.ok) setVehicle(await res.json());
    } catch { }
  }

  function set(field: string) {
    return (val: string) => setForm(f => ({ ...f, [field]: val }));
  }

  function handleSubmit() {
    if (!form.fullName.trim()) { Alert.alert('Required', 'Please enter your full name.'); return; }
    if (!form.phone.trim())    { Alert.alert('Required', 'Please enter your phone number.'); return; }
    router.push({
      pathname: '/buy/review-reservation' as any,
      params: {
        id,
        variantName,
        fullName: form.fullName,
        phone:    form.phone,
        city:     form.city,
        cnic:     form.cnic,
        notes:    form.notes,
      },
    });
  }

  const carImg  = vehicle ? imgUrl(vehicle.images?.[0]) : null;
  const carName = vehicle ? vehicle.title : '—';
  const carCity = vehicle?.city || '—';
  const carYear = vehicle?.year || '';
  const carTrans= vehicle?.transmission || '';
  const carPrice= vehicle ? formatPrice(vehicle.price) : '—';

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: aC.isDark ? BG : '#ffffff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={aC.isDark ? WHITE : '#000000'} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{vehicle?.category === 'bike' ? 'Reserve Your Bike' : 'Reserve Your Car'}</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: aC.isDark ? BG : '#ffffff' }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, backgroundColor: aC.isDark ? BG : '#ffffff' }} keyboardShouldPersistTaps="handled">

          {/* Car Summary Card */}
          <TouchableOpacity style={s.carCard} activeOpacity={0.85} onPress={() => router.back()}>
            {aC.isDark && <SavedCardEffect />}
            {carImg
              ? <Image source={{ uri: carImg }} style={s.carImg} resizeMode="cover" />
              : <View style={[s.carImg, { backgroundColor: aC.isDark ? '#0d1e3d' : '#ffffff', alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="car-outline" size={28} color={aC.isDark ? MUTED : '#4b5563'} />
                </View>
            }
            <View style={{ flex: 1 }}>
              <Text style={s.carName} numberOfLines={1}>{carName}</Text>
              <View style={s.carMeta}>
                <Ionicons name="location-outline" size={12} color={aC.isDark ? MUTED : '#4b5563'} />
                <Text style={s.carMetaTxt}>{carCity}  •  {carYear}  •  {carTrans}</Text>
              </View>
              <Text style={s.carPrice}>{carPrice}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={ORANGE} />
          </TouchableOpacity>

          {/* Form */}
          <View style={{ marginTop: 24, gap: 20 }}>

            <Field label="Full Name">
              <View style={s.inputWrap}>
                {aC.isDark && <SearchInputEffect />}
                <TextInput style={s.input} value={form.fullName} onChangeText={set('fullName')} placeholder="Enter your full name" placeholderTextColor={aC.isDark ? MUTED : '#8f8f8f'} />
              </View>
            </Field>

            <Field label="Phone Number">
              <View style={s.inputWrap}>
                {aC.isDark && <SearchInputEffect />}
                <TextInput style={s.input} value={form.phone} onChangeText={set('phone')} placeholder="+92 3XX XXXXXXX" placeholderTextColor={aC.isDark ? MUTED : '#8f8f8f'} keyboardType="phone-pad" />
              </View>
            </Field>

            <Field label="City">
              <TouchableOpacity style={s.inputWrap} onPress={() => setCityOpen(o => !o)} activeOpacity={0.85}>
                {aC.isDark && <SearchInputEffect />}
                <Text style={[s.input, { paddingTop: 14 }]}>{form.city}</Text>
                <Ionicons name={cityOpen ? 'chevron-up' : 'chevron-down'} size={16} color={aC.isDark ? MUTED : '#4b5563'} style={{ position: 'absolute', right: 20, top: 14 }} />
              </TouchableOpacity>
              {cityOpen && (
                <View style={s.cityDropdown}>
                  {CITIES.map(c => (
                    <TouchableOpacity key={c} style={s.cityOption} onPress={() => { set('city')(c); setCityOpen(false); }}>
                      <Text style={[s.cityOptionTxt, form.city === c && { color: ORANGE }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Field>

            <Field label="CNIC">
              <View style={s.inputWrap}>
                {aC.isDark && <SearchInputEffect />}
                <TextInput style={s.input} value={form.cnic} onChangeText={set('cnic')} placeholder="XXXXX-XXXXXXX-X" placeholderTextColor={aC.isDark ? MUTED : '#8f8f8f'} keyboardType="numeric" />
              </View>
            </Field>

            <Field label="Reservation Notes (Optional)">
              <View style={[s.inputWrap, s.textareaWrap, s.notesCard]}>
                {aC.isDark && <SavedCardEffect />}
                <TextInput
                  style={[s.input, s.textarea]}
                  value={form.notes}
                  onChangeText={set('notes')}
                  placeholder="Any specific requests or notes..."
                  placeholderTextColor={aC.isDark ? MUTED : '#8f8f8f'}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </Field>

          </View>

          {/* Submit Button */}
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} activeOpacity={0.88}>
            <LinearGradient colors={aC.isDark ? [NAVY, ORANGE] : ['#27467F', '#FF9654']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Text style={s.submitTxt}>Review your Reservation</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s_dark = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: WHITE, fontSize: 18, fontFamily: 'Poppins_700Bold' },

  carCard:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, marginTop: 8, backgroundColor: '#010A1F', borderWidth: 1, borderColor: '#82a5d5', borderRadius: 16, overflow: 'hidden', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  carImg:    { width: 48, height: 38, borderRadius: 7 },
  carName:   { color: WHITE, fontSize: 13, fontFamily: 'Poppins_700Bold' },
  carMeta:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 0 },
  carMetaTxt:{ color: MUTED, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  carPrice:  { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_700Bold', marginTop: 0 },

  fieldWrap:  { gap: 8 },
  fieldLabel: { color: '#cbd5e1', fontSize: 13, fontFamily: 'Poppins_400Regular' },

  inputWrap:  { height: 52, borderRadius: 32, borderWidth: 1, borderColor: '#829fd0', backgroundColor: 'rgba(3,12,40,0.6)', overflow: 'hidden', justifyContent: 'center' },
  input:      { color: WHITE, fontSize: 14, fontFamily: 'Poppins_400Regular', paddingHorizontal: 20 },

  textareaWrap:{ height: 110, borderRadius: 16 },
  notesCard:   { ...savedCardOuter },
  textarea:    { height: 100, paddingTop: 14 },

  cityDropdown:  { marginTop: 6, backgroundColor: '#061b4a', borderRadius: 14, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  cityOption:    { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderColor: BORDER },
  cityOptionTxt: { color: WHITE, fontSize: 14, fontFamily: 'Poppins_400Regular' },

  submitBtn: { height: 54, borderRadius: 30, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 32 },
  submitTxt: { color: WHITE, fontSize: 15, fontFamily: 'Poppins_700Bold' },
});
// Light mode layer for `s` — dark mode uses s_dark as is
const s_light = withLightStyles(s_dark, {
  root: { backgroundColor: '#ffffff' },
  headerTitle: { color: '#000000' },
  carCard: { backgroundColor: '#F2F4F8', borderColor: 'rgba(0,0,0,0.04)', boxShadow: LIGHT_POP_SHADOW },
  carName: { color: '#000000' },
  carMetaTxt: { color: '#4b5563' },
  fieldLabel: { color: '#000000' },
  inputWrap: { backgroundColor: '#E8EAEF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.18)', boxShadow: LIGHT_POP_SHADOW },
  input: { color: '#000000' },
  notesCard: { backgroundColor: '#E8EAEF', borderColor: 'rgba(0,0,0,0.18)', shadowOpacity: 0, elevation: 0, boxShadow: LIGHT_POP_SHADOW },
  cityDropdown: { backgroundColor: '#E8EAEF', borderColor: 'rgba(0,0,0,0.18)', boxShadow: LIGHT_POP_SHADOW },
  cityOption: { borderColor: 'rgba(0,0,0,0.12)' },
  cityOptionTxt: { color: '#000000' },
});

