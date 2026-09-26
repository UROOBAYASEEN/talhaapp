import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronLeft,
  Save,
  Upload,
  Plus,
  Circle,
  CheckCircle2,
  X,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import PromoteModal from '@/components/dealer/PromoteModal';

const ORANGE = '#ff6900';
const BLUE   = 'rgba(100,160,255,0.85)';
const C      = AppColors;

function GlassInset() {
  return (
    <>
      <LinearGradient
        colors={['rgba(22,64,136,0.1)', 'transparent']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
        style={StyleSheet.absoluteFillObject} pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(13,37,84,0.08)', 'transparent']}
        start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }}
        style={StyleSheet.absoluteFillObject} pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(29,83,175,0.1)']}
        start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject} pointerEvents="none"
      />
    </>
  );
}

/* ── Input Field ── */
function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={s.inputWrap}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputBox}>
        <GlassInset />
        <TextInput
          style={s.input}
          placeholder={placeholder}
          placeholderTextColor={C.textPlaceholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

/* ── Status Option ── */
function StatusOption({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[s.statusOption, selected && s.statusOptionActive]}
      onPress={onPress}
    >
      <GlassInset />
      <View style={[s.statusDot, selected && s.statusDotActive]} />
      <Text style={[s.statusText, selected && s.statusTextActive]}>{title}</Text>
    </TouchableOpacity>
  );
}

/* ── Promotion Option ── */
function PromotionOption({
  title,
  description,
  price,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  price: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[s.promoOption, selected && s.promoOptionActive]}
      onPress={onPress}
    >
      <GlassInset />
      <View style={s.promoInfo}>
        <Text style={s.promoTitle}>{title}</Text>
        <Text style={s.promoDesc}>{description}</Text>
      </View>
      <Text style={s.promoPrice}>{price}</Text>
      <View style={[s.radio, selected && s.radioActive]}>
        {selected && <View style={s.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

/* ── Main Screen ── */
export default function AddVehicleScreen() {
  const router  = useRouter();
  const { token, user } = useAuth();

  const [vehicleType, setVehicleType]   = useState<'car' | 'bike'>('car');
  const [brand, setBrand]               = useState('');
  const [model, setModel]               = useState('');
  const [variant, setVariant]           = useState('');
  const [modelYear, setModelYear]       = useState('2026');
  const [bodyType, setBodyType]         = useState('');
  const [exFactory, setExFactory]       = useState('');
  const [onMoney, setOnMoney]           = useState('');
  const [booking, setBooking]           = useState('');
  const [vehicleStatus, setVehicleStatus] = useState('Available');
  const [selectedPlan, setSelectedPlan] = useState('Hot Selling listing');
  const [accepted, setAccepted]         = useState(false);
  const [showModal, setShowModal]       = useState(false);
  const [images, setImages]             = useState<string[]>([]);
  const [publishing, setPublishing]     = useState(false);
  const [createdVehicleId, setCreatedVehicleId] = useState<string | null>(null);

  const [colors,        setColors]        = useState(['Wine Red', 'Black', 'White', 'Silver', 'Blue', 'Grey']);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [showColorInput, setShowColorInput] = useState(false);
  const [customColor,    setCustomColor]    = useState('');
  const [features, setFeatures] = useState([
    'ABS', 'Airbags', 'Alloy Wheels', 'Cruise Control', 'Push Start',
    'Sunroof', 'Navigation', 'Parking Sensors', 'Reverse Camera', 'Climate Control',
  ]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'Airbags', 'Cruise Control', 'Sunroof',
  ]);
  const [showFeatureInput, setShowFeatureInput] = useState(false);
  const [customFeature,    setCustomFeature]    = useState('');

  function toggleFeature(f: string) {
    setSelectedFeatures(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  }

  function addCustomFeature() {
    const val = customFeature.trim();
    if (!val) { setShowFeatureInput(false); return; }
    if (!features.includes(val)) setFeatures(prev => [...prev, val]);
    setSelectedFeatures(prev => prev.includes(val) ? prev : [...prev, val]);
    setCustomFeature('');
    setShowFeatureInput(false);
  }

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...uris].slice(0, 10));
    }
  }

  function removeImage(uri: string) {
    setImages(prev => prev.filter(u => u !== uri));
  }

  async function uploadImages(): Promise<string[]> {
    const BASE = API_BASE.replace('/api/v1', '');
    const urls: string[] = [];
    for (const uri of images) {
      const form = new FormData();
      form.append('file', {
        uri,
        type: 'image/jpeg',
        name: `image_${Date.now()}.jpg`,
      } as any);
      try {
        const res = await fetch(`${API_BASE}/upload/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (res.ok) {
          const d = await res.json();
          urls.push(`${BASE}${d.url}`);
        }
      } catch {}
    }
    return urls;
  }

  async function handlePublish() {
    if (!brand.trim()) {
      Alert.alert('Required', 'Please enter the vehicle Brand.'); return;
    }
    if (!model.trim()) {
      Alert.alert('Required', 'Please enter the vehicle Model.'); return;
    }
    if (!modelYear.trim()) {
      Alert.alert('Required', 'Please enter the Model Year.'); return;
    }
    if (!exFactory.trim()) {
      Alert.alert('Required', 'Please enter the vehicle Price.'); return;
    }
    if (images.length === 0) {
      Alert.alert('Images Required', 'Please add at least one vehicle image before posting.'); return;
    }
    if (!accepted) {
      Alert.alert('Terms Required', 'Please accept the terms and conditions first.'); return;
    }
    setPublishing(true);
    try {
      const uploadedUrls = await uploadImages();
      const price = parseFloat(exFactory.replace(/,/g, '')) || 0;
      // Non-dealer (individual seller) inventory used me jata hai taake Buy Used me show ho
      const isIndividual = (user as any)?.role === 'individual_seller';
      const payload = {
        title:    `${brand} ${model}${variant ? ' ' + variant : ''}`,
        make:     brand,
        model,
        variant:  variant || undefined,
        year:     parseInt(modelYear) || new Date().getFullYear(),
        price,
        category: vehicleType,
        condition: isIndividual ? 'used' : 'new',
        color:    selectedColor || undefined,
        body_type: bodyType || undefined,
        features: selectedFeatures,
        images:   uploadedUrls,
      };
      const res = await fetch(`${API_BASE}/vehicles/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedVehicleId(data.id);
        setShowModal(true);
      } else if (res.status === 402) {
        const err = await res.json();
        const detail = typeof err.detail === 'object' ? err.detail : {};
        router.push({
          pathname: '/dealer-panel/ad-limit-reached',
          params: {
            plan:  detail.plan  ?? 'basic',
            limit: String(detail.limit ?? 5),
            used:  String(detail.used  ?? 5),
            pendingPayload: JSON.stringify(payload),
            vehicleTitle: payload.title,
            vehicleImage: uploadedUrls[0] || '',
          },
        } as any);
      } else {
        const err = await res.json();
        Alert.alert('Error', typeof err.detail === 'string' ? err.detail : 'Could not publish vehicle.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setPublishing(false);
    }
  }

  function handlePromote() {
    setShowModal(false);
    if (createdVehicleId) {
      router.replace({
        pathname: '/dealer-panel/promote-new',
      } as any);
    }
  }

  function handleDraft() {
    Alert.alert('Saved', 'Vehicle saved as draft.');
  }

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={22} color={C.textPrimary} strokeWidth={1.8} />
          </TouchableOpacity>

          <Text style={s.headerTitle}>Vehicle Details</Text>

          <TouchableOpacity style={s.draftTopBtn} onPress={handleDraft}>
            <Save size={16} color={ORANGE} />
            <Text style={s.draftTopText}>Save{'\n'}Draft</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* AD LIMIT */}
          <Text style={s.adLimit}>Ad Limit (3/5)</Text>

          {/* UPLOAD BOX */}
          <TouchableOpacity style={s.uploadBox} onPress={pickImages} activeOpacity={0.8}>
            <GlassInset />
            <Upload size={26} color={ORANGE} />
            <Text style={s.uploadTitle}>+ Add Vehicle Images</Text>
            <Text style={s.uploadSub}>
              {images.length > 0 ? `${images.length} image${images.length > 1 ? 's' : ''} selected` : 'Tap to browse. Max 10 images.'}
            </Text>
          </TouchableOpacity>

          {/* IMAGES PREVIEW */}
          {images.length > 0 && (
            <FlatList
              data={images}
              keyExtractor={(item, i) => `${i}-${item}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
              contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
              renderItem={({ item }) => (
                <View style={s.imgThumbWrap}>
                  <Image source={{ uri: item }} style={s.imgThumb} resizeMode="cover"/>
                  <TouchableOpacity style={s.imgRemoveBtn} onPress={() => removeImage(item)}>
                    <X size={12} color="#fff" strokeWidth={2.5}/>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          {/* VEHICLE TYPE */}
          <View style={s.inputWrap}>
            <Text style={s.label}>Vehicle Type</Text>
            <View style={s.typeRow}>
              <TouchableOpacity
                style={[s.typeBtn, vehicleType === 'car' && s.typeBtnActive]}
                onPress={() => setVehicleType('car')}
                activeOpacity={0.8}
              >
                <View style={s.typeBtnInner}>
                  <Text style={[s.typeBtnTxt, vehicleType === 'car' && s.typeBtnTxtActive]}>🚗  Car</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.typeBtn, vehicleType === 'bike' && s.typeBtnActive]}
                onPress={() => setVehicleType('bike')}
                activeOpacity={0.8}
              >
                <View style={s.typeBtnInner}>
                  <Text style={[s.typeBtnTxt, vehicleType === 'bike' && s.typeBtnTxtActive]}>🏍️  Bike</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* BASIC FIELDS */}
          <InputField label="Brand"      placeholder="e.g. Honda"        value={brand}     onChangeText={setBrand} />
          <InputField label="Model"      placeholder="e.g. City"          value={model}     onChangeText={setModel} />
          <InputField label="Variant"    placeholder="e.g. 1.2 Aspire CVT" value={variant}  onChangeText={setVariant} />
          <InputField label="Model Year" placeholder="2026"               value={modelYear} onChangeText={setModelYear} keyboardType="numeric" />
          <InputField label="Body Type"  placeholder="e.g. Sedan"         value={bodyType}  onChangeText={setBodyType} />

          {/* PRICING */}
          <Text style={s.sectionTitle}>Pricing Details</Text>
          <InputField label="Ex-Factory Price (PKR)" placeholder="4,699,000" value={exFactory} onChangeText={setExFactory} keyboardType="numeric" />
          <InputField label="Estimated On-Money"     placeholder="250,000"   value={onMoney}  onChangeText={setOnMoney}  keyboardType="numeric" />
          <InputField label="Booking Amount"         placeholder="1,000,000" value={booking}  onChangeText={setBooking}  keyboardType="numeric" />

          {/* FEATURES */}
          <Text style={s.sectionTitle}>Vehicle Features</Text>
          <View style={s.featureBox}>
            <GlassInset />
            {features.map(f => {
              const active = selectedFeatures.includes(f);
              return (
                <TouchableOpacity
                  key={f}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => toggleFeature(f)}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
            {showFeatureInput ? (
              <View style={s.chipInputWrap}>
                <TextInput
                  style={s.chipInput}
                  placeholder="Type feature..."
                  placeholderTextColor={C.textPlaceholder}
                  value={customFeature}
                  onChangeText={setCustomFeature}
                  onSubmitEditing={addCustomFeature}
                  autoFocus
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={addCustomFeature}>
                  <Plus size={16} color={ORANGE}/>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowFeatureInput(false); setCustomFeature(''); }}>
                  <X size={16} color={C.textSecondary}/>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.chipPlus} onPress={() => setShowFeatureInput(true)}>
                <Plus size={18} color={C.textSecondary}/>
              </TouchableOpacity>
            )}
          </View>

          {/* STATUS */}
          <Text style={s.sectionTitle}>Vehicle Status</Text>
          {['Available', 'Sold Out', 'Pause Listing'].map(opt => (
            <StatusOption
              key={opt}
              title={opt}
              selected={vehicleStatus === opt}
              onPress={() => setVehicleStatus(opt)}
            />
          ))}

          {/* COLORS */}
          <Text style={s.sectionTitle}>Available Colors</Text>
          <View style={s.colorBox}>
            <GlassInset />
            {colors.map(c => {
              const active = selectedColor === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[s.colorChip, active && s.colorChipActive]}
                  onPress={() => setSelectedColor(prev => prev === c ? '' : c)}
                >
                  <Text style={[s.colorText, active && s.colorTextActive]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
            {showColorInput ? (
              <View style={s.chipInputWrap}>
                <TextInput
                  style={s.chipInput}
                  placeholder="e.g. Navy Blue"
                  placeholderTextColor={C.textPlaceholder}
                  value={customColor}
                  onChangeText={setCustomColor}
                  onSubmitEditing={() => {
                    const val = customColor.trim();
                    if (val) { if (!colors.includes(val)) setColors(prev => [...prev, val]); setSelectedColor(val); }
                    setCustomColor(''); setShowColorInput(false);
                  }}
                  autoFocus
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => {
                  const val = customColor.trim();
                  if (val) { if (!colors.includes(val)) setColors(prev => [...prev, val]); setSelectedColor(val); }
                  setCustomColor(''); setShowColorInput(false);
                }}>
                  <Plus size={16} color={ORANGE}/>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowColorInput(false); setCustomColor(''); }}>
                  <X size={16} color={C.textSecondary}/>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.chipPlus} onPress={() => setShowColorInput(true)}>
                <Plus size={18} color={C.textSecondary}/>
              </TouchableOpacity>
            )}
          </View>

          {/* PROMOTE */}
          <Text style={s.sectionTitle}>Promote Vehicle</Text>
          <Text style={s.planSub}>Select Placement Plan</Text>

          <View style={s.promoBox}>
            <GlassInset />
            {/* orange bottom shade */}
            <LinearGradient
              colors={['transparent', 'rgba(255,105,0,0.18)']}
              start={{ x: 0.5, y: 0.5 }} end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            {/* orange corner accent */}
            <View style={s.orangeCorner} />

            <Text style={s.promoBoxTitle}>Promote to Get Your Vehicle{'\n'}Seen Faster</Text>
            <Text style={s.promoBoxDesc}>Get 5x more visibility by featuring{'\n'}your listing</Text>

            {[
              { title: 'Hot Selling listing',  desc: 'Recommended for popular cars',      price: 'Rs 6,650' },
              { title: 'Home page Listing',    desc: 'Balanced exposure for more buyers',  price: 'Rs 5,500' },
              { title: 'New Listing',          desc: 'Notify Buyers About New Listings',   price: 'Rs 4,450' },
            ].map(p => (
              <PromotionOption
                key={p.title}
                title={p.title}
                description={p.desc}
                price={p.price}
                selected={selectedPlan === p.title}
                onPress={() => setSelectedPlan(p.title)}
              />
            ))}
          </View>

          {/* TERMS */}
          <TouchableOpacity style={s.termsRow} onPress={() => setAccepted(v => !v)}>
            {accepted
              ? <CheckCircle2 size={18} color={ORANGE} />
              : <Circle size={18} color={C.textSecondary} />}
            <Text style={s.termsText}>
              I confirm that I have read and accept the terms and conditions and privacy policy.
            </Text>
          </TouchableOpacity>

          <View style={{ height: 130 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <PromoteModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onPromote={handlePromote}
      />

      {/* BOTTOM BUTTONS */}
      <View style={s.bottomBar}>
        <GlassInset />

        <TouchableOpacity style={s.publishBtn} activeOpacity={0.85} onPress={handlePublish} disabled={publishing}>
          {/* base orange gradient */}
          <LinearGradient
            colors={['#c44e00', '#ff6900', '#ff9a00']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          {/* blue overlay across full button */}
          <LinearGradient
            colors={['rgba(3,42,105,0.95)', 'rgba(3,42,105,0.65)', 'rgba(3,42,105,0.15)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          {/* top shine */}
          <LinearGradient
            colors={['rgba(255,255,255,0.12)', 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          {publishing
            ? <ActivityIndicator color="#fff" size="small"/>
            : <Text style={s.publishText}>Publish</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={s.draftBtn} activeOpacity={0.8} onPress={handleDraft}>
          <GlassInset />
          <Text style={s.draftText}>Save as Draft</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 18, paddingBottom: 30 },

  /* HEADER */
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: C.glassBg, borderWidth: 1, borderColor: C.glassBorder, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { color: C.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  draftTopBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  draftTopText: { color: C.textPrimary, fontSize: 9, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 13 },

  /* AD LIMIT */
  adLimit: { color: C.textSecondary, fontSize: 9, fontFamily: 'Poppins_600SemiBold', marginTop: 4, marginBottom: 12 },

  /* UPLOAD */
  uploadBox:    { borderWidth: 1, borderStyle: 'dashed', borderColor: C.glassBorder, borderRadius: 14, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden', backgroundColor: C.glassBg },
  uploadTitle:  { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 6 },
  uploadSub:    { color: C.textSecondary, fontSize: 8, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  imgThumbWrap: { width: 90, height: 70, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  imgThumb:     { width: '100%', height: '100%' },
  imgRemoveBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },

  /* INPUT */
  inputWrap: { marginBottom: 14 },
  label:     { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_600SemiBold', marginBottom: 6 },
  typeRow:        { flexDirection: 'row', gap: 10 },
  typeBtn:        { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: 'rgba(3,12,40,0.4)', alignItems: 'center', justifyContent: 'center' },
  typeBtnActive:  { borderColor: ORANGE, backgroundColor: 'rgba(255,105,0,0.15)' },
  typeBtnInner:   { alignItems: 'center', justifyContent: 'center' },
  typeBtnTxt:     { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#8f8f8f' },
  typeBtnTxtActive: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  inputBox:  { borderRadius: 30, borderWidth: 1, borderColor: 'rgba(100,160,255,0.35)', backgroundColor: C.glassBg, overflow: 'hidden' },
  input:     { height: 44, paddingHorizontal: 18, color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  /* SECTION */
  sectionTitle: { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_700Bold', marginTop: 6, marginBottom: 12 },

  /* FEATURES */
  featureBox:    { borderWidth: 1, borderColor: C.glassBorder, borderRadius: 16, padding: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, overflow: 'hidden', backgroundColor: C.glassBg },
  chip:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: 'rgba(9,36,92,0.8)', borderWidth: 1, borderColor: C.glassBorder },
  chipActive:    { borderColor: ORANGE },
  chipText:      { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_500Medium' },
  chipTextActive:{ color: ORANGE },
  chipPlus:      { width: 32, height: 32, borderRadius: 16, backgroundColor: C.glassBg, borderWidth: 1, borderColor: C.glassBorder, alignItems: 'center', justifyContent: 'center' },
  chipInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: ORANGE, backgroundColor: C.glassBg },
  chipInput:     { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_400Regular', minWidth: 100, paddingVertical: 0 },

  /* STATUS */
  statusOption:      { height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.glassBorder, backgroundColor: C.glassBg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 10, overflow: 'hidden' },
  statusOptionActive:{ borderColor: ORANGE },
  statusDot:         { width: 7, height: 7, borderRadius: 4, backgroundColor: C.textSecondary, marginRight: 10 },
  statusDotActive:   { backgroundColor: ORANGE },
  statusText:        { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  statusTextActive:  { color: ORANGE },

  /* COLORS */
  colorBox:  { borderWidth: 1, borderColor: C.glassBorder, borderRadius: 16, padding: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, overflow: 'hidden', backgroundColor: C.glassBg },
  colorChip:       { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18, backgroundColor: 'rgba(9,36,92,0.8)', borderWidth: 1, borderColor: C.glassBorder },
  colorChipActive: { borderColor: ORANGE, backgroundColor: 'rgba(226,103,27,0.15)' },
  colorText:       { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_500Medium' },
  colorTextActive: { color: ORANGE },

  /* PROMOTE */
  planSub:       { color: C.textSecondary, fontSize: 9, fontFamily: 'Poppins_400Regular', marginTop: -6, marginBottom: 10 },
  promoBox:      { borderWidth: 1, borderColor: BLUE, borderRadius: 16, padding: 14, paddingTop: 32, backgroundColor: C.glassBg, overflow: 'hidden', marginBottom: 16 },
  orangeCorner:  { position: 'absolute', left: -28, top: -30, width: 85, height: 85, backgroundColor: ORANGE, transform: [{ rotate: '45deg' }] },
  promoBoxTitle: { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_700Bold', lineHeight: 20, marginBottom: 4, textShadowColor: 'rgba(255,105,0,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  promoBoxDesc:  { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 16, marginBottom: 12 },

  promoOption:      { minHeight: 54, borderRadius: 12, borderWidth: 1, borderColor: C.glassBorder, backgroundColor: 'rgba(9,36,92,0.6)', marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  promoOptionActive:{ borderColor: ORANGE },
  promoInfo:        { flex: 1 },
  promoTitle:       { color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_600SemiBold', marginBottom: 3 },
  promoDesc:        { color: C.textSecondary, fontSize: 8, fontFamily: 'Poppins_400Regular' },
  promoPrice:       { color: ORANGE, fontSize: 10, fontFamily: 'Poppins_700Bold', marginRight: 10 },
  radio:            { width: 17, height: 17, borderRadius: 9, borderWidth: 2, borderColor: C.glassBorder, alignItems: 'center', justifyContent: 'center' },
  radioActive:      { borderColor: ORANGE },
  radioInner:       { width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE },

  /* TERMS */
  termsRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  termsText: { flex: 1, color: C.textSecondary, fontSize: 9, fontFamily: 'Poppins_400Regular', lineHeight: 14 },

  /* BOTTOM */
  bottomBar:   { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, backgroundColor: 'rgba(3,12,40,0.95)', borderTopWidth: 1, borderTopColor: BLUE, overflow: 'hidden', gap: 10 },
  publishBtn:  { height: 50, borderRadius: 25, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', shadowColor: '#e2671b', shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  publishText: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },
  draftBtn:    { height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: BLUE, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: C.glassBg },
  draftText:   { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
});
