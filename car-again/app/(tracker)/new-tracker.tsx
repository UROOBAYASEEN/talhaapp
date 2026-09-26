import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronLeft,
  Save,
  UploadCloud,
  Check,
  Plus,
  Info,
  ChevronDown,
  X,
} from 'lucide-react-native';
import { AppColors, useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#e2671b';

const INITIAL_FEATURES = [
  { id: 'gps',   label: 'Live GPS',    included: true  },
  { id: 'geo',   label: 'Geo-Fencing', included: true  },
  { id: 'lock',  label: 'Engine Lock', included: false },
  { id: 'alert', label: 'Speed Alert', included: false },
];

const CITIES = ['All Cities', 'Karachi', 'Lahore', 'Islamabad'];

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
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

export default function NewTrackerScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const { token } = useAuth();

  const [features, setFeatures]           = useState(INITIAL_FEATURES);
  const [activeCities, setActiveCities]   = useState<string[]>(['All Cities']);
  const [installationOn, setInstallationOn] = useState(true);
  const [agreed, setAgreed]               = useState(false);
  const [trackerName, setTrackerName]     = useState('');
  const [serialNo, setSerialNo]           = useState('');
  const [price, setPrice]                 = useState('');
  const [installFee, setInstallFee]       = useState('');
  const [monthlyFee, setMonthlyFee]       = useState('');
  const [description, setDescription]     = useState('');
  const [images, setImages]               = useState<string[]>([]);
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [loading, setLoading]             = useState(false);

  function validate(isPublish: boolean): boolean {
    const e: Record<string, string> = {};

    if (!trackerName.trim())
      e.trackerName = 'Tracker name is required';

    if (!serialNo.trim())
      e.serialNo = 'Serial number is required';

    const priceNum = parseFloat(price);
    if (!price.trim() || isNaN(priceNum) || priceNum <= 0)
      e.price = 'Please enter a valid price (greater than 0)';

    const installNum = parseFloat(installFee);
    if (installationOn && (!installFee.trim() || isNaN(installNum) || installNum < 0))
      e.installFee = 'Please enter a valid installation fee';

    const monthlyNum = parseFloat(monthlyFee);
    if (!monthlyFee.trim() || isNaN(monthlyNum) || monthlyNum < 0)
      e.monthlyFee = 'Please enter a valid monthly fee';

    if (installationOn && activeCities.length === 0)
      e.cities = 'Please select at least one city';

    if (!description.trim() || description.trim().length < 10)
      e.description = 'Description must be at least 10 characters';

    if (images.length === 0)
      e.images = 'Please add at least one image';

    if (isPublish && !agreed)
      e.agreed = 'You must accept the terms & conditions';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function uploadImages(): Promise<string[]> {
    const urls: string[] = [];
    for (const uri of images) {
      if (uri.startsWith('http')) { urls.push(uri); continue; }
      const formData = new FormData();
      const ext = uri.split('.').pop() || 'jpg';
      formData.append('file', { uri, name: `tracker.${ext}`, type: `image/${ext}` } as any);
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Image upload failed');
      const data = await res.json();
      urls.push(data.url);
    }
    return urls;
  }

  async function submitTracker(isPublish: boolean) {
    if (!validate(isPublish)) return;
    setLoading(true);
    try {
      const imageUrls = await uploadImages();
      const body = {
        name:                   trackerName.trim(),
        serial_no:              serialNo.trim(),
        features:               features.filter(f => f.included).map(f => f.label),
        price:                  parseFloat(price),
        installation_fee:       parseFloat(installFee || '0'),
        monthly_fee:            parseFloat(monthlyFee || '0'),
        installation_available: installationOn,
        available_cities:       installationOn ? activeCities : [],
        coverage:               'Pakistan',
        description:            description.trim(),
        images:                 imageUrls,
        is_published:           isPublish,
      };
      const res = await fetch(`${API_BASE}/tracker-devices/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Server error');
      }
      Alert.alert(
        isPublish ? 'Submitted for Review' : 'Draft Saved',
        isPublish
          ? 'Your tracker has been submitted for review.'
          : 'Your tracker has been saved as a draft.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Kuch masla hua, dobara try karo.');
    } finally {
      setLoading(false);
    }
  }

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.85,
      selectionLimit: 6,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 6));
      setErrors(p => ({ ...p, images: '' }));
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  function toggleCity(city: string) {
    if (city === 'All Cities') {
      setActiveCities(['All Cities']);
    } else {
      setActiveCities(prev => {
        const without = prev.filter(c => c !== 'All Cities');
        return without.includes(city)
          ? without.filter(c => c !== city) || ['All Cities']
          : [...without, city];
      });
    }
  }

  function toggleFeature(id: string) {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, included: !f.included } : f));
  }

  return (
    <View style={[s.root, { backgroundColor: aC.bg }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: aC.bg }}>
        <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={22} color={aC.textPrimary} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: aC.textPrimary }]}>New Tracker Details</Text>
          <TouchableOpacity style={s.saveDraft} onPress={() => submitTracker(false)} disabled={loading}>
            <Save size={16} color={ORANGE} strokeWidth={1.8} />
            <Text style={s.saveDraftText}>{'Save\nDraft'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { backgroundColor: aC.bg }]}>
        <Text style={[s.subtitle, { color: aC.isDark ? '#94a3b8' : '#475569' }]}>Add a tracker product for customers</Text>

        {/* Image Upload */}
        {images.length === 0 ? (
          <TouchableOpacity style={[s.uploadArea, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(255,255,255,0.2)" : "rgba(3,42,105,0.12)" }, errors.images && s.uploadAreaError]} activeOpacity={0.8} onPress={pickImages}>
            <UploadCloud size={24} color={errors.images ? '#f87171' : ORANGE} strokeWidth={1.8} />
            <Text style={[s.uploadTitle, errors.images && { color: '#f87171' }]}>+ Add Tracker Image</Text>
            <Text style={s.uploadSub}>Tap to browse. Up to 6 images.</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.imageGrid}>
            {images.map((uri, i) => (
              <View key={i} style={s.thumbWrap}>
                <Image source={{ uri }} style={s.thumbImg} />
                <TouchableOpacity style={s.removeBtn} onPress={() => removeImage(i)} activeOpacity={0.8}>
                  <X size={11} color="#fff" strokeWidth={2.8} />
                </TouchableOpacity>
                {i === 0 && (
                  <View style={s.mainBadge}>
                    <Text style={s.mainBadgeText}>Main</Text>
                  </View>
                )}
              </View>
            ))}
            {images.length < 6 && (
              <TouchableOpacity style={[s.addMoreBtn, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(255,255,255,0.2)" : "rgba(3,42,105,0.12)" }]} onPress={pickImages} activeOpacity={0.8}>
                <Plus size={22} color={ORANGE} strokeWidth={2} />
                <Text style={s.addMoreText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {errors.images && <Text style={s.errText}>{errors.images}</Text>}

        {/* Tracker Name */}
        <Text style={[s.label, { color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}>Tracker name</Text>
        <View style={[s.inputWrap, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(255,255,255,0.15)" : "rgba(3,42,105,0.12)" }, errors.trackerName && s.inputError]}>
          <GlassInset />
          <TextInput
            style={[s.input, { color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}
            value={trackerName}
            onChangeText={v => { setTrackerName(v); setErrors(p => ({ ...p, trackerName: '' })); }}
            placeholder="e.g AutoTrack Pro"
            placeholderTextColor={aC.isDark ? "#6f7f9c" : "#94a3b8"}
          />
        </View>
        {errors.trackerName && <Text style={s.errText}>{errors.trackerName}</Text>}

        {/* Serial Number */}
        <Text style={[s.label, { color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}>Serial Number</Text>
        <View style={[s.inputWrap, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(255,255,255,0.15)" : "rgba(3,42,105,0.12)" }, errors.serialNo && s.inputError]}>
          <GlassInset />
          <TextInput
            style={[s.input, { color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}
            value={serialNo}
            onChangeText={v => { setSerialNo(v); setErrors(p => ({ ...p, serialNo: '' })); }}
            placeholder="e.g AT500"
            placeholderTextColor={aC.isDark ? "#6f7f9c" : "#94a3b8"}
          />
        </View>
        {errors.serialNo && <Text style={s.errText}>{errors.serialNo}</Text>}

        {/* Features */}
        <Text style={[s.label, { color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}>Features Included</Text>
        <View style={s.chipsWrap}>
          {features.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[s.chip, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(255,255,255,0.1)" : "rgba(3,42,105,0.12)" }, f.included && s.chipActive]}
              onPress={() => toggleFeature(f.id)}
              activeOpacity={0.8}
            >
              {f.included
                ? <Check size={13} color={ORANGE} strokeWidth={2.4} />
                : <Plus  size={13} color="#94a3b8" strokeWidth={2.4} />
              }
              <Text style={[s.chipText, { color: aC.isDark ? "#94a3b8" : "#475569" }, f.included && s.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.chip} activeOpacity={0.8}>
            <Plus size={13} color="#94a3b8" strokeWidth={2.4} />
            <Text style={s.chipText}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Price */}
        <Text style={[s.label, { color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}>Price</Text>
        <View style={[s.inputWrap, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(255,255,255,0.15)" : "rgba(3,42,105,0.12)" }, errors.price && s.inputError]}>
          <GlassInset />
          <Text style={s.pkrPrefix}>PKR</Text>
          <TextInput
            style={[s.input, { color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}
            value={price}
            onChangeText={v => { setPrice(v); setErrors(p => ({ ...p, price: '' })); }}
            placeholder="0.00"
            placeholderTextColor={aC.isDark ? "#6f7f9c" : "#94a3b8"}
            keyboardType="numeric"
          />
        </View>
        {errors.price && <Text style={s.errText}>{errors.price}</Text>}

        {/* Installation + Monthly Fee */}
        <View style={s.rowFields}>
          <View style={{ flex: 1 }}>
            <Text style={[s.label, { color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}>Installation Fee</Text>
            <View style={[s.inputWrap, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(255,255,255,0.15)" : "rgba(3,42,105,0.12)" }, errors.installFee && s.inputError]}>
              <GlassInset />
              <TextInput
                style={s.input}
                value={installFee}
                onChangeText={v => { setInstallFee(v); setErrors(p => ({ ...p, installFee: '' })); }}
                placeholder="0"
                placeholderTextColor={aC.isDark ? "#6f7f9c" : "#94a3b8"}
                keyboardType="numeric"
              />
            </View>
            {errors.installFee && <Text style={s.errText}>{errors.installFee}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.label, { color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}>Monthly Fee</Text>
            <View style={[s.inputWrap, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(255,255,255,0.15)" : "rgba(3,42,105,0.12)" }, errors.monthlyFee && s.inputError]}>
              <GlassInset />
              <TextInput
                style={s.input}
                value={monthlyFee}
                onChangeText={v => { setMonthlyFee(v); setErrors(p => ({ ...p, monthlyFee: '' })); }}
                placeholder="0"
                placeholderTextColor={aC.isDark ? "#6f7f9c" : "#94a3b8"}
                keyboardType="numeric"
              />
            </View>
            {errors.monthlyFee && <Text style={s.errText}>{errors.monthlyFee}</Text>}
          </View>
        </View>

        {/* Installation Available Toggle */}
        <View style={[s.toggleCard, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(255,255,255,0.1)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? "transparent" : "rgba(3,42,105,0.06)", shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.toggleTitle, { color: aC.isDark ? "#fff" : "#010a1f" }]}>Installation Available</Text>
              <Text style={[s.toggleSub, { color: aC.isDark ? "#64748b" : "#475569" }]}>Offer professional installation to customers</Text>
            </View>
            <Switch
              value={installationOn}
              onValueChange={setInstallationOn}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: ORANGE }}
              thumbColor="#fff"
            />
          </View>

          {installationOn && (
            <>
              <Text style={[s.label, { marginTop: 14, color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}>Available Cities</Text>
              <View style={s.chipsWrap}>
                {CITIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[s.chip, activeCities.includes(c) && s.chipActive]}
                    onPress={() => toggleCity(c)}
                    activeOpacity={0.8}
                  >
                    {activeCities.includes(c) && <Check size={13} color={ORANGE} strokeWidth={2.4} />}
                    <Text style={[s.chipText, { color: aC.isDark ? "#94a3b8" : "#475569" }, activeCities.includes(c) && s.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={s.chip} activeOpacity={0.8}>
                  <Plus size={13} color="#94a3b8" strokeWidth={2.4} />
                  <Text style={s.chipText}>Cities</Text>
                </TouchableOpacity>
              </View>
              {errors.cities && <Text style={s.errText}>{errors.cities}</Text>}

              <Text style={[s.label, { marginTop: 14, color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}>Coverage</Text>
              <View style={[s.inputWrap, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(255,255,255,0.15)" : "rgba(3,42,105,0.12)" }]}>
                <GlassInset />
                <Text style={[s.input, { color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}>Pakistan</Text>
                <ChevronDown size={16} color="#6f7f9c" />
              </View>
            </>
          )}
        </View>

        {/* Description */}
        <Text style={[s.label, { color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}>Short Tracker Description</Text>
        <View style={[s.textAreaWrap, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(255,255,255,0.15)" : "rgba(3,42,105,0.12)" }]}>
          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <TextInput
            style={[s.textArea, { color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}
            value={description}
            onChangeText={v => { setDescription(v); setErrors(p => ({ ...p, description: '' })); }}
            placeholder="Enter product details, specifications, and warranty info..."
            placeholderTextColor={aC.isDark ? "#6f7f9c" : "#94a3b8"}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        {errors.description && <Text style={s.errText}>{errors.description}</Text>}

        {/* Terms */}
        <TouchableOpacity style={s.checkRow} onPress={() => { setAgreed(v => !v); setErrors(p => ({ ...p, agreed: '' })); }} activeOpacity={0.8}>
          <View style={[s.checkbox, agreed && s.checkboxActive]}>
            {agreed && <Check size={11} color="#fff" strokeWidth={3} />}
          </View>
          <Text style={[s.checkText, { color: aC.isDark ? "#94a3b8" : "#475569" }]}>
            I confirm that I have read and accept the terms and conditions and privacy policy.
          </Text>
        </TouchableOpacity>
        {errors.agreed && <Text style={s.errText}>{errors.agreed}</Text>}

        <View style={{ height: 200 }} />
      </ScrollView>

      {/* Bottom Sheet */}
      <View style={[s.bottomSheet, { backgroundColor: aC.isDark ? "rgba(10,18,32,0.98)" : "#ffffff", borderColor: aC.isDark ? "rgba(255,255,255,0.1)" : "rgba(3,42,105,0.12)" }]}>
        <LinearGradient colors={['rgba(10,18,32,0.6)', 'rgba(10,18,32,0.98)']} style={StyleSheet.absoluteFillObject} />
        <View style={s.infoRow}>
          <Info size={14} color="#94a3b8" />
          <Text style={[s.infoText, { color: aC.isDark ? "#94a3b8" : "#475569" }]}>Tracker listings are reviewed before being published.</Text>
        </View>
        <TouchableOpacity
          style={[s.publishWrap, loading && { opacity: 0.6 }]}
          activeOpacity={0.85}
          disabled={loading}
          onPress={() => submitTracker(true)}
        >
          <LinearGradient colors={['#1b3a63', ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 30 }]} />
          <Text style={s.publishText}>{loading ? 'Publishing...' : 'Publish Tracker'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.draftBtn, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(255,255,255,0.15)" : "rgba(3,42,105,0.12)" }]}
          activeOpacity={0.85}
          disabled={loading}
          onPress={() => submitTracker(false)}
        >
          <Text style={[s.draftText, { color: aC.isDark ? "#e2e8f0" : "#010a1f" }]}>Save as Draft</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: AppColors.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 },

  /* HEADER */
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: AppColors.textPrimary },
  saveDraft:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  saveDraftText: { color: ORANGE, fontSize: 10, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },

  subtitle: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#94a3b8', marginBottom: 14 },

  /* UPLOAD */
  uploadArea:  { borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed', paddingVertical: 32, alignItems: 'center', marginBottom: 4, backgroundColor: '#010A1F' },
  uploadTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: ORANGE, marginTop: 8 },
  uploadSub:   { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#64748b', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },

  /* IMAGE GRID */
  imageGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  thumbWrap:    { width: 96, height: 96, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', position: 'relative' },
  thumbImg:     { width: '100%', height: '100%' },
  removeBtn:    { position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  mainBadge:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(226,103,27,0.85)', paddingVertical: 3, alignItems: 'center' },
  mainBadgeText:{ fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  addMoreBtn:   { width: 96, height: 96, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#010A1F' },
  addMoreText:  { fontSize: 11, fontFamily: 'Poppins_500Medium', color: ORANGE },

  /* INPUTS */
  label:      { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#e2e8f0', marginTop: 16, marginBottom: 8 },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 30, paddingHorizontal: 18, backgroundColor: AppColors.bg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  input:      { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#e2e8f0', padding: 0 },
  pkrPrefix:  { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#64748b', marginRight: 8 },
  rowFields:  { flexDirection: 'row', gap: 12 },

  /* CHIPS */
  chipsWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: AppColors.bg },
  chipActive:    { borderColor: 'rgba(226,103,27,0.6)', backgroundColor: 'rgba(226,103,27,0.1)' },
  chipText:      { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#94a3b8' },
  chipTextActive:{ color: ORANGE },

  /* TOGGLE CARD */
  toggleCard:  { marginTop: 16, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#010A1F', padding: 16 },
  toggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  toggleTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  toggleSub:   { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#64748b', marginTop: 2 },

  /* TEXTAREA */
  textAreaWrap: { borderRadius: 18, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: '#010A1F', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  textArea:     { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#e2e8f0', minHeight: 96 },

  /* CHECKBOX */
  checkRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 18 },
  checkbox:      { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkboxActive:{ backgroundColor: ORANGE, borderColor: ORANGE },
  checkText:     { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#94a3b8', lineHeight: 18 },

  /* ERRORS */
  errText:      { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#f87171', marginTop: 4, marginLeft: 4 },
  inputError:   { borderColor: 'rgba(248,113,113,0.6)' },
  uploadAreaError: { borderColor: 'rgba(248,113,113,0.6)' },

  /* BOTTOM SHEET */
  bottomSheet:  { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 10 },
  infoRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  infoText:     { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#94a3b8' },
  publishWrap:  { borderRadius: 30, overflow: 'hidden', paddingVertical: 14, alignItems: 'center' },
  publishText:  { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  draftBtn:     { borderRadius: 30, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: AppColors.bg },
  draftText:    { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#e2e8f0' },
});
