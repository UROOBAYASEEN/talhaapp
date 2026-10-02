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
import { BottomActions, Chip as DChip, D, DField, DHeader, DSelect, SaveDraftAction, TermsRow, UploadBox, dk } from '@/components/dealer/DealerUI';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';
import { savedCardOuter, SavedCardEffect } from '@/components/shared/FigmaEffects';
import { GlowPublishButton, GlowDraftButton } from "@/components/shared/ActionFooterGlow";

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
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <DHeader title="New Tracker Details" center right={<SaveDraftAction onPress={() => !loading && submitTracker(false)} />} />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.subtitle}>Add a tracker product for customers</Text>

        {/* Image Upload */}
        {images.length === 0 ? (
          <UploadBox title="+ Add Tracker Image" sub="Drag & drop or click to browse. Recommended 1:1 ratio." onPress={pickImages} />
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
              <TouchableOpacity style={s.addMoreBtn} onPress={pickImages} activeOpacity={0.8}>
                <Plus size={22} color={ORANGE} strokeWidth={2} />
                <Text style={s.addMoreText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {errors.images ? <Text style={s.errText}>{errors.images}</Text> : null}

        {/* Tracker Name */}
        <Text style={dk.label}>Tracker name</Text>
        <DField
          value={trackerName}
          onChangeText={v => { setTrackerName(v); setErrors(p => ({ ...p, trackerName: '' })); }}
          placeholder="e.g AutoTrack Pro"
        />
        {errors.trackerName ? <Text style={s.errText}>{errors.trackerName}</Text> : null}

        {/* Serial Number */}
        <Text style={dk.label}>Serial Number</Text>
        <DField
          value={serialNo}
          onChangeText={v => { setSerialNo(v); setErrors(p => ({ ...p, serialNo: '' })); }}
          placeholder="e.g. AT500"
        />
        {errors.serialNo ? <Text style={s.errText}>{errors.serialNo}</Text> : null}

        {/* Features */}
        <Text style={[dk.label, { marginTop: 24 }]}>Features Included</Text>
        <View style={s.chipsWrap}>
          {features.map(f => (
            <TouchableOpacity key={f.id} style={[s.chip, f.included ? s.chipActive : s.chipOff]} onPress={() => toggleFeature(f.id)} activeOpacity={0.8}>
              {f.included
                ? <Check size={14} color={ORANGE} strokeWidth={2.4} />
                : <Plus  size={14} color="#FFFFFF" strokeWidth={2.4} />}
              <Text style={[s.chipText, f.included && s.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[s.chip, s.chipOff]} activeOpacity={0.8}>
            <Plus size={14} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={s.chipText}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Price */}
        <Text style={dk.label}>Price</Text>
        <DField
          left={<Text style={s.pkrPrefix}>PKR</Text>}
          value={price}
          onChangeText={v => { setPrice(v); setErrors(p => ({ ...p, price: '' })); }}
          placeholder="0.00"
          keyboardType="numeric"
          style={{ paddingLeft: 10 }}
        />
        {errors.price ? <Text style={s.errText}>{errors.price}</Text> : null}

        {/* Installation + Monthly Fee */}
        <View style={s.rowFields}>
          <View style={{ flex: 1 }}>
            <Text style={dk.label}>Installation Fee</Text>
            <DField
              value={installFee}
              onChangeText={v => { setInstallFee(v); setErrors(p => ({ ...p, installFee: '' })); }}
              placeholder="0"
              keyboardType="numeric"
            />
            {errors.installFee ? <Text style={s.errText}>{errors.installFee}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={dk.label}>Monthly Fee</Text>
            <DField
              value={monthlyFee}
              onChangeText={v => { setMonthlyFee(v); setErrors(p => ({ ...p, monthlyFee: '' })); }}
              placeholder="0"
              keyboardType="numeric"
            />
            {errors.monthlyFee ? <Text style={s.errText}>{errors.monthlyFee}</Text> : null}
          </View>
        </View>

        {/* Installation Available Toggle */}
        <View style={s.toggleCard}>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleTitle}>Installation Available</Text>
              <Text style={s.toggleSub}>Offer professional installation to customers</Text>
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
              <Text style={s.subLabel}>Available Cities</Text>
              <View style={s.chipsWrap}>
                {CITIES.map(c => (
                  <DChip key={c} small label={c} selected={activeCities.includes(c)} onPress={() => toggleCity(c)} />
                ))}
                <DChip small label="+ Cities" />
              </View>
              {errors.cities ? <Text style={s.errText}>{errors.cities}</Text> : null}

              <Text style={[dk.label, { fontFamily: 'Poppins_500Medium' }]}>Coverage</Text>
              <DSelect value="Pakistan" />
            </>
          )}
        </View>

        {/* Description */}
        <Text style={dk.label}>Short Tracker Description</Text>
        <DField
          value={description}
          onChangeText={v => { setDescription(v); setErrors(p => ({ ...p, description: '' })); }}
          placeholder="Enter product details, specifications, and warranty info..."
          multiline
        />
        {errors.description ? <Text style={s.errText}>{errors.description}</Text> : null}

        {/* Terms */}
        <TermsRow checked={agreed} onToggle={() => { setAgreed(v => !v); setErrors(p => ({ ...p, agreed: '' })); }} />
        {errors.agreed ? <Text style={s.errText}>{errors.agreed}</Text> : null}

        <View style={{ height: 220 }} />
      </ScrollView>

      {/* Bottom panel */}
      <BottomActions fx>
        <View style={s.infoRow}>
          <Info size={15} color="#E6E1E8" />
          <Text style={s.infoText}>Tracker listings are reviewed before being published.</Text>
        </View>
        <GlowPublishButton title="Publish Tracker" loadingTitle="Publishing..." loading={loading} onPress={() => submitTracker(true)} />
        <GlowDraftButton title="Save as Draft" onPress={() => !loading && submitTracker(false)} />
      </BottomActions>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 },

  subtitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#E6E1E8', marginBottom: 14 },

  /* IMAGE GRID */
  imageGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  thumbWrap:    { width: 96, height: 96, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', position: 'relative' },
  thumbImg:     { width: '100%', height: '100%' },
  removeBtn:    { position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  mainBadge:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(226,103,27,0.85)', paddingVertical: 3, alignItems: 'center' },
  mainBadgeText:{ fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  addMoreBtn:   { width: 96, height: 96, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(226,103,27,0.6)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addMoreText:  { fontSize: 11, fontFamily: 'Poppins_500Medium', color: ORANGE },

  pkrPrefix:  { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF' },
  rowFields:  { flexDirection: 'row', gap: 12 },

  /* CHIPS */
  chipsWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 34, borderRadius: 17, borderWidth: 1 },
  chipOff:       { backgroundColor: '#0B2358', borderColor: 'rgba(127,152,196,0.5)' },
  chipActive:    { borderColor: ORANGE, backgroundColor: '#3A2420' },
  chipText:      { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  chipTextActive:{ color: ORANGE },

  /* TOGGLE CARD */
  toggleCard:  { marginTop: 22, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', padding: 18 },
  toggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  toggleTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  toggleSub:   { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#E6E1E8', marginTop: 2 },
  subLabel:    { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#FFFFFF', marginTop: 16, marginBottom: 10 },

  /* ERRORS */
  errText:      { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#f87171', marginTop: 4, marginLeft: 4 },

  /* BOTTOM */
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText:     { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#E6E1E8' },
});
