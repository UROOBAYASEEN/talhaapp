import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LIGHT_POP_SHADOW, useAppColors, withLightStyles } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import InnerGlow from '@/components/shared/InnerGlow';

const ORANGE = '#e2671b';
const IMG_LOGO = require('@/assets/images/autowizor-logo-text.png');

// Abhi ke liye fixed brands (+ backend `/brands` jo bhi de) — models bhi inke liye fallback
const FALLBACK_MODELS: Record<string, string[]> = {
  Toyota:     ['Corolla', 'Yaris', 'Fortuner', 'Hilux', 'Camry', 'Land Cruiser', 'Prado'],
  Honda:      ['Civic', 'City', 'BR-V', 'HR-V', 'Accord'],
  Suzuki:     ['Alto', 'Cultus', 'Swift', 'Wagon R', 'Mehran', 'Bolan', 'Every'],
  Kia:        ['Sportage', 'Picanto', 'Sorento', 'Stonic'],
  Hyundai:    ['Tucson', 'Elantra', 'Sonata', 'Santa Fe'],
  Changan:    ['Alsvin', 'Oshan X7', 'Karvaan'],
  MG:         ['HS', 'ZS', 'MG 5'],
  Nissan:     ['Sunny', 'Dayz', 'Note'],
  Daihatsu:   ['Mira', 'Cuore', 'Move'],
  Mitsubishi: ['Lancer', 'Pajero', 'Mirage'],
};
const FALLBACK_BRANDS = Object.keys(FALLBACK_MODELS);
// Year dropdown — submit validation (1990–2026) ke mutabiq
const YEARS  = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => String(2026 - i));
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Quetta', 'Peshawar'];
const DOCS   = [
  { key: 'cnic',      label: 'CNIC (Front & Back)',          sub: 'PDF / JPG up to 5MB' },
  { key: 'regBook',   label: 'Vehicle Registration Book',    sub: 'PDF / JPG up to 5MB' },
  { key: 'invoice',   label: 'Vehicle Invoice (Optional)',   sub: 'PDF / JPG up to 5MB' },
  { key: 'insurance', label: 'Existing Insurance (Optional)',sub: 'PDF / JPG up to 5MB' },
];

export default function ClaimScreen() {
  const router     = useRouter();
  const T          = useAppColors();
  const st         = T.isDark ? s : sLight;
  const { token }  = useAuth();

  const [brand,      setBrand]      = useState('');
  const [model,      setModel]      = useState('');
  const [year,       setYear]       = useState('');
  const [value,      setValue]      = useState('PKR 30,000');
  const [registered, setRegistered] = useState<'yes' | 'no'>('yes');
  const [city,       setCity]       = useState('Karachi');
  const [regNum,     setRegNum]     = useState('');
  const [photos,     setPhotos]     = useState<string[]>([]);
  const [docStatus,  setDocStatus]  = useState<Record<string, boolean>>({});
  const [docUploading, setDocUploading] = useState<Record<string, boolean>>({});
  const [docFileUrls, setDocFileUrls] = useState<Record<string, string>>({});
  const [cityOpen,   setCityOpen]   = useState(false);
  // Brand / Model / Year dropdowns
  const [openField,  setOpenField]  = useState<'brand' | 'model' | 'year' | null>(null);
  const [brandOpts,  setBrandOpts]  = useState<string[]>(FALLBACK_BRANDS);
  const [modelOpts,  setModelOpts]  = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Brands — backend `/brands` (same as VehicleSearch)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/brands`);
        if (res.ok) {
          const d = await res.json();
          if (alive && Array.isArray(d)) setBrandOpts(Array.from(new Set([...FALLBACK_BRANDS, ...d.map((b: any) => b?.name).filter(Boolean)])) as string[]);
        }
      } catch { }
    })();
    return () => { alive = false; };
  }, []);

  // Models — selected brand ki vehicles se (`/vehicles?make=`)
  useEffect(() => {
    if (!brand) { setModelOpts([]); return; }
    setModelOpts(FALLBACK_MODELS[brand] || []);
    let alive = true;
    (async () => {
      setModelsLoading(true);
      try {
        const q = new URLSearchParams({ limit: '100', make: brand });
        const res = await fetch(`${API_BASE}/vehicles?${q}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (res.ok) {
          const d = await res.json();
          const names = Array.from(new Set((d.items || []).map((v: any) => (v.model || '').trim()).filter(Boolean))).sort() as string[];
          if (alive) setModelOpts(Array.from(new Set([...(FALLBACK_MODELS[brand] || []), ...names])));
        }
      } catch { }
      finally { if (alive) setModelsLoading(false); }
    })();
    return () => { alive = false; };
  }, [brand]);

  const toggleField = (f: 'brand' | 'model' | 'year') => setOpenField(v => (v === f ? null : f));
  const [submitting, setSubmitting] = useState(false);

  async function pickPhoto() {
    if (photos.length >= 5) { Alert.alert('Max 5 photos allowed'); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Allow photo library access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setPhotos(p => [...p, result.assets[0].uri]);
  }

  async function handleUploadDoc(key: string) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
        copyToCacheDirectory: true, multiple: false,
      });
      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0];
      if (file.size && file.size > 5 * 1024 * 1024) { Alert.alert("File too large", "Max 5MB allowed."); return; }
      setDocUploading(p => ({ ...p, [key]: true }));
      const SERVER = API_BASE.replace('/api/v1','');
      const form = new FormData();
      const ext = file.name.split('.').pop() || 'pdf';
      form.append('file', { uri: file.uri, name: file.name, type: file.mimeType || `application/${ext}` } as any);
      const upRes = await fetch(`${API_BASE}/upload/image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      if (!upRes.ok) throw new Error('Upload failed');
      const { url } = await upRes.json();
      const doc = DOCS.find(d=>d.key===key)!;
      await fetch(`${API_BASE}/documents/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: doc.label, desc: doc.sub, file_url: url }),
      });
      setDocFileUrls(p=> ({...p, [key]: `${SERVER}${url}`}));
      setDocStatus(p => ({ ...p, [key]: true }));
    } catch { Alert.alert("Error","Unable to upload document."); }
    finally { setDocUploading(p => ({ ...p, [key]: false })); }
  }

  async function uploadPhotos(): Promise<string[]> {
    const urls: string[] = [];
    const BASE = API_BASE.replace('/api/v1', '');
    for (const uri of photos) {
      try {
        const form = new FormData();
        form.append('file', { uri, name: `photo_${Date.now()}.jpg`, type: 'image/jpeg' } as any);
        const res = await fetch(`${API_BASE}/upload/image`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
        });
        if (res.ok) { const d = await res.json(); urls.push(`${BASE}${d.url}`); }
      } catch { /* skip failed uploads */ }
    }
    return urls;
  }

  async function handleSubmit() {
    if (!brand.trim() || !model.trim() || !year.trim()) {
      Alert.alert('Required', 'Please enter Brand, Model and Year'); return;
    }
    const yearNum = parseInt(year.trim());
    if (isNaN(yearNum) || yearNum < 1990 || yearNum > 2026) {
      Alert.alert('Invalid Year', 'Please enter a valid year (1990–2026)'); return;
    }
    try {
      setSubmitting(true);

      // Upload photos first
      const photoUrls = photos.length > 0 ? await uploadPhotos() : [];

      // Parse estimated value (remove PKR, commas)
      const numValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;

      const res = await fetch(`${API_BASE}/insurance/claims`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand:               brand.trim(),
          model:               model.trim(),
          year:                yearNum,
          estimated_value:     numValue,
          registered:          registered === 'yes',
          registration_city:   registered === 'yes' ? city : '',
          registration_number: registered === 'yes' ? regNum.trim() : '',
          photos:              photoUrls,
        }),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail ?? 'Failed to create claim');
      }

      const claim = await res.json();
      router.push({ pathname: '/insurance/compare-plans', params: { claimId: claim.id } } as any);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Styled helpers ─────────────────────────────────────────────────────────
  const inputStyle = [st.glassInput];

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: T.bg }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()} style={st.iconBtn}>
          <Ionicons name="arrow-back-outline" size={24} color={T.textPrimary} />
        </TouchableOpacity>
        <View style={st.logoWrap} pointerEvents="none">
          {T.isDark ? (
            <Image source={IMG_LOGO} style={st.logo} resizeMode="contain" />
          ) : (
            <Text style={{ fontSize: 20, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 }}>
              <Text style={{ color: '#032a69' }}>Auto</Text>
              <Text style={{ color: '#e2671b' }}>wizor</Text>
            </Text>
          )}
        </View>
        <View style={st.headerRight}>
          <TouchableOpacity style={st.iconBtn} onPress={() => router.push('/alert' as any)}>
            <Ionicons name="notifications-outline" size={20} color={T.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={st.iconBtn} onPress={() => router.push('/profile/settings' as any)}>
            <Ionicons name="settings-outline" size={20} color={T.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Page title ── */}
      <View style={st.pageTitleWrap}>
        <Text style={[st.pageTitle, { color: T.textPrimary }]}>Insurance Claim</Text>
        <Text style={[st.pageSubtitle, { color: T.textSecondary }]}>Fill in your vehicle details to get insurance quotes</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Vehicle Info Section ── */}
          <Text style={[st.sectionLabel, { color: T.textSecondary }]}>VEHICLE INFORMATION</Text>

          <View style={st.fieldWrap}>
            <Text style={[st.fieldLabel, { color: T.isDark ? T.textSecondary : '#9a8f98' }]}>Brand</Text>
            <TouchableOpacity style={[st.glassInput, st.selectInput]} onPress={() => toggleField('brand')} activeOpacity={0.8}>
              {T.isDark && <InnerGlow radius={25} fill="#030817" glowColor="#1E4593" blur={16} borderColors={['#6F8CC0', '#5873A6']} borderWidth={1} />}
              <Text style={[st.inputTxt, { flex: 1, color: T.isDark ? '#F9FAFC' : '#000000' }]} numberOfLines={1}>{brand || 'Select Brand'}</Text>
              <Ionicons name={openField === 'brand' ? 'chevron-up' : 'chevron-down'} size={20} color={T.isDark ? '#F9FAFC' : '#000000'} />
            </TouchableOpacity>
            {openField === 'brand' && (
              <View style={[st.dropList, { backgroundColor: T.glassBg, borderColor: T.glassBorder }]}>
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {brandOpts.length === 0 ? (
                    <Text style={[st.dropItemTxt, st.dropItem, { color: T.textSecondary, borderBottomWidth: 0 }]}>{'Loading brands...'}</Text>
                  ) : brandOpts.map((o, i) => (
                    <TouchableOpacity key={`${o}-${i}`} style={[st.dropItem, { borderBottomColor: T.divider }]} onPress={() => { if (o !== brand) setModel(''); setBrand(o); setOpenField(null); }}>
                      <Text style={[st.dropItemTxt, { color: o === brand ? ORANGE : T.textPrimary }]}>{o}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={st.fieldWrap}>
            <Text style={[st.fieldLabel, { color: T.isDark ? T.textSecondary : '#9a8f98' }]}>Model</Text>
            <TouchableOpacity style={[st.glassInput, st.selectInput]} onPress={() => toggleField('model')} activeOpacity={0.8}>
              {T.isDark && <InnerGlow radius={25} fill="#030817" glowColor="#1E4593" blur={16} borderColors={['#6F8CC0', '#5873A6']} borderWidth={1} />}
              <Text style={[st.inputTxt, { flex: 1, color: T.isDark ? '#F9FAFC' : '#000000' }]} numberOfLines={1}>{model || 'Select Model'}</Text>
              <Ionicons name={openField === 'model' ? 'chevron-up' : 'chevron-down'} size={20} color={T.isDark ? '#F9FAFC' : '#000000'} />
            </TouchableOpacity>
            {openField === 'model' && (
              <View style={[st.dropList, { backgroundColor: T.glassBg, borderColor: T.glassBorder }]}>
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {modelOpts.length === 0 ? (
                    <Text style={[st.dropItemTxt, st.dropItem, { color: T.textSecondary, borderBottomWidth: 0 }]}>{!brand ? 'Select a brand first' : modelsLoading ? 'Loading models...' : 'No models found'}</Text>
                  ) : modelOpts.map((o, i) => (
                    <TouchableOpacity key={`${o}-${i}`} style={[st.dropItem, { borderBottomColor: T.divider }]} onPress={() => { setModel(o); setOpenField(null); }}>
                      <Text style={[st.dropItemTxt, { color: o === model ? ORANGE : T.textPrimary }]}>{o}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={st.fieldWrap}>
            <Text style={[st.fieldLabel, { color: T.isDark ? T.textSecondary : '#9a8f98' }]}>Year</Text>
            <TouchableOpacity style={[st.glassInput, st.selectInput]} onPress={() => toggleField('year')} activeOpacity={0.8}>
              {T.isDark && <InnerGlow radius={25} fill="#030817" glowColor="#1E4593" blur={16} borderColors={['#6F8CC0', '#5873A6']} borderWidth={1} />}
              <Text style={[st.inputTxt, { flex: 1, color: T.isDark ? '#F9FAFC' : '#000000' }]} numberOfLines={1}>{year || 'Select Year'}</Text>
              <Ionicons name={openField === 'year' ? 'chevron-up' : 'chevron-down'} size={20} color={T.isDark ? '#F9FAFC' : '#000000'} />
            </TouchableOpacity>
            {openField === 'year' && (
              <View style={[st.dropList, { backgroundColor: T.glassBg, borderColor: T.glassBorder }]}>
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {YEARS.length === 0 ? (
                    <Text style={[st.dropItemTxt, st.dropItem, { color: T.textSecondary, borderBottomWidth: 0 }]}>{''}</Text>
                  ) : YEARS.map((o, i) => (
                    <TouchableOpacity key={`${o}-${i}`} style={[st.dropItem, { borderBottomColor: T.divider }]} onPress={() => { setYear(o); setOpenField(null); }}>
                      <Text style={[st.dropItemTxt, { color: o === year ? ORANGE : T.textPrimary }]}>{o}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Estimated Market Value */}
          <View style={st.fieldWrap}>
            <Text style={[st.fieldLabel, { color: T.isDark ? T.textSecondary : '#9a8f98' }]}>Estimated Market Value</Text>
            <View style={inputStyle}>
              {T.isDark && <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
              {T.isDark && <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
              {T.isDark && <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
              <TextInput style={[st.inputTxt, { flex: 1, color: T.textPrimary }]} value={value} onChangeText={setValue} placeholderTextColor={T.textSecondary} keyboardType="default" />
            </View>
          </View>

          {/* ── Registration Section ── */}
          <Text style={[st.sectionLabel, { color: T.textSecondary }]}>REGISTRATION DETAILS</Text>

          {/* Registered Yes/No */}
          <View style={st.fieldWrap}>
            <Text style={[st.fieldLabel, { color: T.isDark ? T.textSecondary : '#9a8f98' }]}>Registered</Text>
            <View style={st.radioRow}>
              {(['yes', 'no'] as const).map(opt => (
                <TouchableOpacity key={opt} style={st.radioItem} onPress={() => setRegistered(opt)}>
                  <View style={[st.radioCircle, { borderColor: registered === opt ? ORANGE : T.textSecondary }, registered === opt && st.radioSelected]}>
                    {registered === opt && <View style={st.radioDot} />}
                  </View>
                  <Text style={[st.radioTxt, { color: T.textPrimary }]}>{opt === 'yes' ? 'Yes' : 'No'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Registered = No → Registration City / Number hide */}
          {registered === 'yes' && (
            <>
            <View style={st.fieldWrap}>
              <Text style={[st.fieldLabel, { color: T.isDark ? T.textSecondary : '#9a8f98' }]}>Registration City</Text>
              <TouchableOpacity style={inputStyle} onPress={() => setCityOpen(v => !v)} activeOpacity={0.8}>
                {T.isDark && <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                {T.isDark && <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                {T.isDark && <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                <Text style={[st.inputTxt, { color: city ? T.textPrimary : T.textSecondary }]}>{city || 'Select City'}</Text>
                <Ionicons name={cityOpen ? 'chevron-up' : 'chevron-down'} size={16} color={T.textSecondary} />
              </TouchableOpacity>
              {cityOpen && (
                <View style={[st.dropList, { backgroundColor: T.glassBg, borderColor: T.glassBorder }]}>
                  {CITIES.map(c => (
                    <TouchableOpacity key={c} style={[st.dropItem, { borderBottomColor: T.divider }]} onPress={() => { setCity(c); setCityOpen(false); }}>
                      <Text style={[st.dropItemTxt, { color: c === city ? ORANGE : T.textPrimary }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Registration Number */}
            <View style={st.fieldWrap}>
              <Text style={[st.fieldLabel, { color: T.isDark ? T.textSecondary : '#9a8f98' }]}>Registration Number</Text>
              <View style={inputStyle}>
                {T.isDark && <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                {T.isDark && <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                {T.isDark && <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                <TextInput style={[st.inputTxt, { flex: 1, color: T.textPrimary }]} value={regNum} onChangeText={setRegNum} placeholder="LEA-22-1234" placeholderTextColor={T.textSecondary} autoCapitalize="characters" />
              </View>
            </View>
            </>
          )}

          {/* ── Photos Section ── */}
          <Text style={[st.sectionLabel, { color: T.textSecondary }]}>VEHICLE PHOTOS</Text>

          <View style={st.fieldWrap}>
            <View style={st.photosHeader}>
              <Text style={[st.photosNote, { color: T.textSecondary }]}>Add up to 5 photos of your vehicle</Text>
              <Text style={[st.photosCount, { color: ORANGE }]}>{photos.length}/5</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.photosRow}>
              <TouchableOpacity style={[st.addPhotoBtn, { borderColor: T.textSecondary }]} onPress={pickPhoto} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={24} color={ORANGE} />
                <Text style={[st.addPhotoTxt, { color: T.textSecondary }]}>Add Photo</Text>
              </TouchableOpacity>
              {photos.map((uri, i) => (
                <TouchableOpacity key={i} style={st.photoThumb} onLongPress={() => setPhotos(p => p.filter((_, j) => j !== i))}>
                  <Image source={{ uri }} style={st.photoImg} resizeMode="cover" />
                  <View style={st.photoDeleteOverlay}>
                    <Ionicons name="close-circle" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
              {Array.from({ length: Math.max(0, 3 - photos.length) }).map((_, i) => (
                <View key={`ph-${i}`} style={[st.photoThumb, st.photoPlaceholder, { backgroundColor: T.glassBg, borderColor: T.divider }]}>
                  <Ionicons name="image-outline" size={22} color={T.textSecondary} />
                </View>
              ))}
            </ScrollView>
            <Text style={[st.photoHint, { color: T.textSecondary }]}>Long press a photo to remove it</Text>
          </View>

          {/* ── Documents Section ── */}
          <Text style={[st.sectionLabel, { color: T.textSecondary }]}>REQUIRED DOCUMENTS</Text>

          <View style={st.docsWrap}>
            {DOCS.map(doc => (
              <View key={doc.key} style={st.docRow}>
                {T.isDark && <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                {T.isDark && <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                {T.isDark && <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                <View style={st.docIconWrap}>
                  {docUploading[doc.key] ? <ActivityIndicator size="small" color={ORANGE} />
                  : <Ionicons name={docStatus[doc.key] ? 'checkmark-circle' : 'cloud-upload-outline'} size={22} color={docStatus[doc.key] ? '#27ae60' : ORANGE} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[st.docLabel, { color: T.textPrimary }]}>{doc.label}</Text>
                  <Text style={[st.docSub, { color: T.textSecondary }]} numberOfLines={1}>{docStatus[doc.key] && docFileUrls[doc.key] ? '✓ Uploaded' : doc.sub}</Text>
                </View>
                <TouchableOpacity
                  style={[st.uploadBtn, docStatus[doc.key] ? st.uploadedBtn : { backgroundColor: T.isDark ? 'rgba(186,172,182,0.1)' : 'rgba(3,12,40,0.07)' }, docUploading[doc.key] && { opacity: 0.6 }]}
                  onPress={() => handleUploadDoc(doc.key)}
                  disabled={!!docUploading[doc.key]}
                >
                  <Text style={[st.uploadTxt, { color: docStatus[doc.key] ? '#27ae60' : T.textPrimary }]}>
                    {docUploading[doc.key] ? '...' : docStatus[doc.key] ? '✓ Done' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* ── Submit ── */}
          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.87} style={st.submitWrap} disabled={submitting}>
            <LinearGradient colors={T.isDark ? ['#032a69', ORANGE] : ['#27467F', '#FF9654']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[st.submitBtn, submitting && { opacity: 0.7 }]}>
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                  <Text style={st.submitTxt}>Search Insurance</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#010a1f' },

  // Header
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 56, position: 'relative' },
  iconBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  logoWrap:     { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  logo:         { width: 120, height: 28 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', zIndex: 1 },

  // Page title
  pageTitleWrap:{ paddingHorizontal: 20, paddingBottom: 8 },
  pageTitle:    { fontSize: 20, fontFamily: 'Poppins_600SemiBold' },
  pageSubtitle: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2 },

  scroll:       { paddingHorizontal: 20, paddingTop: 8, gap: 14, paddingBottom: 20 },

  sectionLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 1.2, marginBottom: -4 },

  // Field
  fieldWrap:    { gap: 8 },
  fieldLabel:   { fontSize: 14, fontFamily: 'Poppins_500Medium' },

  // Glass input
  glassInput:   {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 48, paddingHorizontal: 20, borderRadius: 32,
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    backgroundColor: 'rgba(3,12,40,0.6)',
    overflow: 'hidden',
  },
  inputTxt:     { fontSize: 14, fontFamily: 'Poppins_400Regular' },
  // Brand / Model / Year select (Figma): dark centre, blue inner glow, light-blue border
  selectInput:  { height: 50, borderRadius: 25, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 22 },

  // Dropdown list
  dropList:     { borderRadius: 16, borderWidth: 1, overflow: 'hidden', maxHeight: 200 },
  dropItem:     { paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 0.5 },
  dropItemTxt:  { fontSize: 14, fontFamily: 'Poppins_400Regular' },

  // Radio
  radioRow:     { flexDirection: 'row', alignItems: 'center', gap: 28 },
  radioItem:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioCircle:  { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioSelected:{ borderColor: ORANGE },
  radioDot:     { width: 11, height: 11, borderRadius: 6, backgroundColor: ORANGE },
  radioTxt:     { fontSize: 14, fontFamily: 'Poppins_500Medium' },

  // Photos
  photosHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photosNote:   { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  photosCount:  { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  photosRow:    { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  addPhotoBtn:  {
    width: 88, height: 88, borderRadius: 14,
    borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  addPhotoTxt:  { fontSize: 10, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.3 },
  photoThumb:   { width: 88, height: 88, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  photoImg:     { width: '100%', height: '100%' },
  photoDeleteOverlay: { position: 'absolute', top: 4, right: 4 },
  photoPlaceholder: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  photoHint:    { fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 4 },

  // Documents
  docsWrap:     { gap: 10 },
  docRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12, overflow: 'hidden', backgroundColor: 'rgba(3,12,40,0.6)', borderColor: 'rgba(100,160,255,0.5)' },
  docIconWrap:  { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(226,103,27,0.12)', alignItems: 'center', justifyContent: 'center' },
  docLabel:     { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  docSub:       { fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  uploadBtn:    { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, minWidth: 68, alignItems: 'center' },
  uploadedBtn:  { backgroundColor: 'rgba(39,174,96,0.15)' },
  uploadTxt:    { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },

  // Submit
  submitWrap:   { borderRadius: 32, overflow: 'hidden', marginTop: 4 },
  submitBtn:    { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitTxt:    { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
});

// ── Light mode overrides (Figma light) — dark mode uses `s` as is ──────────
const sLight = withLightStyles(s, {
  glassInput:  { backgroundColor: '#E8EAEF', borderColor: 'rgba(0,0,0,0.18)', boxShadow: LIGHT_POP_SHADOW },
  selectInput: { backgroundColor: '#E8EAEF', borderWidth: 1 },
  dropList:    { backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.12)' },
  docRow:      { backgroundColor: '#F5F6F8', borderColor: 'rgba(0,0,0,0.08)' },
  submitWrap:  { boxShadow: LIGHT_POP_SHADOW },
});
