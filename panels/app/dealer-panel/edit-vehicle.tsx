import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
  Image, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Save, Upload, X, Trash2 } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { DField, GlowCard } from '@/components/dealer/DealerUI';

const ORANGE = '#ff6900';
const C      = AppColors;
const BASE   = API_BASE.replace('/api/v1', '');

const ALL_FEATURES = [
  'ABS', 'Airbags', 'Alloy Wheels', 'Cruise Control', 'Push Start',
  'Sunroof', 'Navigation', 'Parking Sensors', 'Reverse Camera', 'Climate Control',
];

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

function InputField({ label, placeholder, value, onChangeText, keyboardType = 'default' }: {
  label: string; placeholder: string; value: string;
  onChangeText: (t: string) => void; keyboardType?: 'default' | 'numeric';
}) {
  // Same glass pill as the Vehicle Details (add-vehicle) inputs
  return (
    <DField
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
    />
  );
}

export default function EditVehicleScreen() {
  const router  = useRouter();
  const { token } = useAuth();
  const { id }  = useLocalSearchParams<{ id: string }>();

  const [fetching,  setFetching]  = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  const [brand,     setBrand]     = useState('');
  const [model,     setModel]     = useState('');
  const [variant,   setVariant]   = useState('');
  const [year,      setYear]      = useState('');
  const [bodyType,  setBodyType]  = useState('');
  const [price,     setPrice]     = useState('');
  const [color,     setColor]     = useState('');
  const [city,      setCity]      = useState('');
  const [mileage,   setMileage]   = useState('');
  const [desc,      setDesc]      = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages,      setNewImages]      = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/vehicles/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const v = await res.json();
          setBrand(v.make      || '');
          setModel(v.model     || '');
          setVariant(v.variant || '');
          setYear(String(v.year || ''));
          setBodyType(v.body_type  || '');
          setPrice(String(v.price  || ''));
          setColor(v.color     || '');
          setCity(v.city       || '');
          setMileage(String(v.mileage || ''));
          setDesc(v.description || '');
          setExistingImages(v.images || []);
          setSelectedFeatures(v.features || []);
        }
      } catch {}
      finally { setFetching(false); }
    })();
  }, [id]);

  function toggleFeature(f: string) {
    setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Allow photo access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setNewImages(prev => [...prev, ...uris].slice(0, 10 - existingImages.length));
    }
  }

  async function uploadNewImages(): Promise<string[]> {
    const urls: string[] = [];
    for (const uri of newImages) {
      const form = new FormData();
      form.append('file', { uri, type: 'image/jpeg', name: `img_${Date.now()}.jpg` } as any);
      try {
        const res = await fetch(`${API_BASE}/upload/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (res.ok) { const d = await res.json(); urls.push(`${BASE}${d.url}`); }
      } catch {}
    }
    return urls;
  }

  async function handleSave() {
    if (!brand || !model || !year) {
      Alert.alert('Required', 'Brand, Model and Year are required.');
      return;
    }
    setSaving(true);
    try {
      const newUploaded = await uploadNewImages();
      const allImages   = [...existingImages, ...newUploaded];

      const payload: Record<string, any> = {
        title:    `${brand} ${model}${variant ? ' ' + variant : ''}`,
        make:     brand,
        model,
        variant:  variant || null,
        year:     parseInt(year) || undefined,
        price:    parseFloat(price.replace(/,/g, '')) || undefined,
        color:    color   || null,
        city:     city    || null,
        body_type:bodyType|| null,
        mileage:  mileage ? parseInt(mileage) : null,
        description: desc || null,
        images:   allImages,
        features: selectedFeatures,
      };

      const res = await fetch(`${API_BASE}/vehicles/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert('Updated', 'Vehicle updated successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const err = await res.json();
        Alert.alert('Error', typeof err.detail === 'string' ? err.detail : 'Update failed.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this listing? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const res = await fetch(`${API_BASE}/vehicles/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                Alert.alert('Deleted', 'Vehicle deleted.', [
                  { text: 'OK', onPress: () => router.back() },
                ]);
              } else {
                Alert.alert('Error', 'Could not delete vehicle.');
              }
            } catch {
              Alert.alert('Error', 'Network error.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  if (fetching) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={ORANGE} size="large"/>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={22} color={C.textPrimary} strokeWidth={1.8}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Edit Vehicle</Text>
          <TouchableOpacity style={s.deleteTopBtn} onPress={handleDelete} disabled={deleting}>
            {deleting
              ? <ActivityIndicator color="#ff4444" size="small"/>
              : <Trash2 size={18} color="#ff4444"/>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* EXISTING IMAGES */}
          {existingImages.length > 0 && (
            <View>
              <Text style={s.sectionTitle}>Current Images</Text>
              <FlatList
                data={existingImages}
                keyExtractor={(item, i) => `existing-${i}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
                contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
                renderItem={({ item }) => (
                  <View style={s.imgThumbWrap}>
                    <Image source={{ uri: item }} style={s.imgThumb} resizeMode="cover"/>
                    <TouchableOpacity style={s.imgRemoveBtn} onPress={() => setExistingImages(prev => prev.filter(u => u !== item))}>
                      <X size={12} color="#fff" strokeWidth={2.5}/>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}

          {/* ADD NEW IMAGES */}
          <TouchableOpacity style={s.uploadBox} onPress={pickImages} activeOpacity={0.8}>
            <GlassInset/>
            <Upload size={22} color={ORANGE}/>
            <Text style={s.uploadTitle}>+ Add More Images</Text>
            <Text style={s.uploadSub}>
              {newImages.length > 0 ? `${newImages.length} new image(s) selected` : 'Tap to browse'}
            </Text>
          </TouchableOpacity>

          {newImages.length > 0 && (
            <FlatList
              data={newImages}
              keyExtractor={(item, i) => `new-${i}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
              contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
              renderItem={({ item }) => (
                <View style={s.imgThumbWrap}>
                  <Image source={{ uri: item }} style={s.imgThumb} resizeMode="cover"/>
                  <TouchableOpacity style={s.imgRemoveBtn} onPress={() => setNewImages(prev => prev.filter(u => u !== item))}>
                    <X size={12} color="#fff" strokeWidth={2.5}/>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          {/* FIELDS */}
          <InputField label="Brand"      placeholder="e.g. Honda"     value={brand}    onChangeText={setBrand}  />
          <InputField label="Model"      placeholder="e.g. City"      value={model}    onChangeText={setModel}  />
          <InputField label="Variant"    placeholder="e.g. Aspire CVT" value={variant} onChangeText={setVariant}/>
          <InputField label="Year"       placeholder="2026"            value={year}     onChangeText={setYear}     keyboardType="numeric"/>
          <InputField label="Body Type"  placeholder="e.g. Sedan"     value={bodyType} onChangeText={setBodyType}/>
          <InputField label="Color"      placeholder="e.g. White"     value={color}    onChangeText={setColor}  />
          <InputField label="City"       placeholder="e.g. Karachi"   value={city}     onChangeText={setCity}   />
          <InputField label="Mileage (km)" placeholder="e.g. 15000"  value={mileage}  onChangeText={setMileage}  keyboardType="numeric"/>

          <Text style={s.sectionTitle}>Pricing</Text>
          <InputField label="Price (PKR)" placeholder="e.g. 4,500,000" value={price} onChangeText={setPrice} keyboardType="numeric"/>

          <Text style={s.sectionTitle}>Description</Text>
          <DField
            placeholder="Describe your vehicle..."
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={4}
          />

          {/* FEATURES — saved-file vehicle-card effect */}
          <Text style={s.sectionTitle}>Vehicle Features</Text>
          <GlowCard radius={16} style={s.featureBox}>
            {ALL_FEATURES.map(f => {
              const active = selectedFeatures.includes(f);
              return (
                <TouchableOpacity key={f} style={s.featureRow} onPress={() => toggleFeature(f)}>
                  <View style={[s.featureCheck, active && s.featureCheckActive]}>
                    {active && <View style={s.featureCheckInner}/>}
                  </View>
                  <Text style={[s.featureText, active && { color: C.textPrimary }]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </GlowCard>

          {/* SAVE BUTTON */}
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={[AppColors.gradientStart, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject}/>
            {saving
              ? <ActivityIndicator color="#fff" size="small"/>
              : <><Save size={17} color="#fff"/><Text style={s.saveTxt}>Save Changes</Text></>
            }
          </TouchableOpacity>

          <View style={{ height: 40 }}/>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  deleteTopBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },

  sectionTitle: { color: C.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginTop: 20, marginBottom: 10 },

  uploadBox:   { borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: ORANGE, backgroundColor: C.glassBg, overflow: 'hidden', alignItems: 'center', paddingVertical: 18, gap: 6, marginBottom: 14 },
  uploadTitle: { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  uploadSub:   { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular' },

  imgThumbWrap: { width: 90, height: 70, borderRadius: 10, overflow: 'hidden' },
  imgThumb:     { width: '100%', height: '100%' },
  imgRemoveBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },

  inputWrap: { marginBottom: 12 },
  label:     { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 6 },
  inputBox:  { borderRadius: 30, borderWidth: 1, borderColor: AppColors.glassBorder, backgroundColor: AppColors.glassBg, overflow: 'hidden' },
  input:     { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_400Regular', paddingHorizontal: 18, paddingVertical: 13 },

  featureBox:        { padding: 14, gap: 4 },
  featureRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  featureCheck:      { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  featureCheckActive:{ borderColor: ORANGE },
  featureCheckInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
  featureText:       { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', flex: 1 },

  saveBtn: { height: 52, borderRadius: 30, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  saveTxt: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});
