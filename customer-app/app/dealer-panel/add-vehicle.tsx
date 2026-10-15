import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Plus, X } from 'lucide-react-native';
import {
  AddChip, BottomActions, Chip, D, DField, DHeader, DSelect, OutlineCard, PlanOption, PromoCard,
  SaveDraftAction, TermsRow, UploadBox,
} from '@/components/dealer/DealerUI';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import PromoteModal from '@/components/dealer/PromoteModal';
import { GlowPublishButton, GlowDraftButton } from "@/components/shared/ActionFooterGlow";
import SelectSheet from '@/components/shared/SelectSheet';
import {
  BIKE_BODY_TYPES, BIKE_MODELS, BIKE_VARIANTS, CAR_BODY_TYPES, CAR_MODELS, CAR_VARIANTS, FUEL_TYPES, OTHER, TRANSMISSIONS,
  VEHICLE_CITIES, VEHICLE_YEARS,
} from '@/constants/vehicleOptions';

const ORANGE = '#E2671B';
const C = AppColors;

// "4,699,000" → 4699000 (empty → 0)
const toNum = (v: string) => parseFloat(String(v).replace(/,/g, '')) || 0;

type Picker = 'city' | 'brand' | 'model' | 'variant' | 'transmission' | 'fuel' | 'extraVariant' | 'year' | 'body' | null;

/* ── Input Field (glass pill) ── */
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
    <DField
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
    />
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
    <TouchableOpacity style={[s.statusOption, selected && s.statusOptionActive]} onPress={onPress} activeOpacity={0.85}>
      <View style={[s.statusDot, selected && s.statusDotActive]} />
      <Text style={[s.statusText, selected && s.statusTextActive]}>{title}</Text>
    </TouchableOpacity>
  );
}

// Inline text box for adding a custom feature / colour (kept outside the screen so it keeps focus)
function ChipInput({ value, onChange, onDone, onCancel, placeholder }: { value: string; onChange: (t: string) => void; onDone: () => void; onCancel: () => void; placeholder: string }) {
  return (
    <View style={s.chipInputWrap}>
      <TextInput
        style={s.chipInput}
        placeholder={placeholder}
        placeholderTextColor={C.textPlaceholder}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onDone}
        autoFocus
        returnKeyType="done"
      />
      <TouchableOpacity onPress={onDone}><Plus size={16} color={ORANGE} /></TouchableOpacity>
      <TouchableOpacity onPress={onCancel}><X size={16} color={C.textSecondary} /></TouchableOpacity>
    </View>
  );
}

/* ── Main Screen ── */
export default function AddVehicleScreen() {
  const router = useRouter();
  const { token, user } = useAuth();

  // Pricing breakdown (WHT / Estimated Total) sirf Dealer ke liye — Seller / Become_a_Seller me sirf Vehicle Price
  const isDealer = (user as any)?.role === 'dealership_owner';

  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');
  const [city, setCity] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  // "Other" select karne pe user apna naam likhta hai
  const [brandOther, setBrandOther] = useState(false);
  const [modelOther, setModelOther] = useState(false);
  const [variantOther, setVariantOther] = useState(false);
  // Is vehicle ke dosre variants — customer side "Compare Variants" me dikhte hain
  const [extraVariants, setExtraVariants] = useState<string[]>([]);
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [modelYear, setModelYear] = useState('2026');
  const [bodyType, setBodyType] = useState('');
  const [picker, setPicker] = useState<Picker>(null);
  const [apiBrands, setApiBrands] = useState<string[]>([]);
  const [vehiclePrice, setVehiclePrice] = useState('');
  const [whtFiler, setWhtFiler] = useState('');
  const [whtNonFiler, setWhtNonFiler] = useState('');
  const [vehicleStatus, setVehicleStatus] = useState('Available');
  const [selectedPlan, setSelectedPlan] = useState('Hot Selling listing');
  const [accepted, setAccepted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [createdVehicleId, setCreatedVehicleId] = useState<string | null>(null);

  const [colors, setColors] = useState(['Wine Red', 'Black', 'White', 'Silver', 'Blue', 'Grey']);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [showColorInput, setShowColorInput] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [features, setFeatures] = useState([
    'ABS', 'Airbags', 'Alloy Wheels', 'Cruise Control', 'Push Start',
    'Sunroof', 'Navigation', 'Parking Sensors', 'Reverse Camera', 'Climate Control',
  ]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'Airbags', 'Cruise Control', 'Sunroof',
  ]);
  const [showFeatureInput, setShowFeatureInput] = useState(false);
  const [customFeature, setCustomFeature] = useState('');

  // Brands — backend `/brands` (category wise); offline / empty → local list
  useEffect(() => {
    let alive = true;
    setApiBrands([]);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/brands?category=${vehicleType}`);
        if (res.ok) {
          const d = await res.json();
          if (alive && Array.isArray(d)) setApiBrands(d.map((b: any) => b?.name).filter(Boolean));
        }
      } catch { }
    })();
    return () => { alive = false; };
  }, [vehicleType]);

  const modelMap = vehicleType === 'car' ? CAR_MODELS : BIKE_MODELS;
  const brandOptions = [...(apiBrands.length ? apiBrands : Object.keys(modelMap)), OTHER];
  // Brand ke models (naam case-insensitive match) — na milen to sirf "Other"
  const brandKey = Object.keys(modelMap).find(k => k.toLowerCase() === brand.trim().toLowerCase());
  const modelOptions = [...(brandKey ? modelMap[brandKey] : []), OTHER];
  const variantList = vehicleType === 'car' ? CAR_VARIANTS : BIKE_VARIANTS;
  const variantOptions = [...variantList, OTHER];
  const extraVariantOptions = variantList.filter(v => v !== variant && !extraVariants.includes(v));
  const bodyOptions = vehicleType === 'car' ? CAR_BODY_TYPES : BIKE_BODY_TYPES;

  function changeVehicleType(t: 'car' | 'bike') {
    if (t === vehicleType) return;
    setVehicleType(t);
    setBrand(''); setModel(''); setVariant(''); setBodyType(''); setExtraVariants([]);
    setBrandOther(false); setModelOther(false); setVariantOther(false);
  }

  function pickBrand(v: string) {
    const other = v === OTHER;
    setBrandOther(other);
    setBrand(other ? '' : v);
    setModel(''); setModelOther(false);
  }
  function pickModel(v: string) {
    const other = v === OTHER;
    setModelOther(other);
    setModel(other ? '' : v);
  }
  function pickVariant(v: string) {
    const other = v === OTHER;
    setVariantOther(other);
    setVariant(other ? '' : v);
    if (!other) setExtraVariants(prev => prev.filter(x => x !== v));
  }

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
      } catch { }
    }
    return urls;
  }

  async function handlePublish() {
    // Fields ki tarteeb se: City → Brand → Vehicle → Variant → Transmission → Fuel → Year → Body Type → Vehicle Price
    // ("Other Variants" optional hai — uski koi condition nahi)
    if (!city) {
      Alert.alert('Required', 'Please select your city.'); return;
    }
    if (!brand.trim()) {
      Alert.alert('Required', brandOther ? 'Please enter your brand name.' : 'Please select your brand.'); return;
    }
    if (!model.trim()) {
      Alert.alert('Required', modelOther ? 'Please enter your vehicle name.' : 'Please select your vehicle.'); return;
    }
    if (!variant.trim()) {
      Alert.alert('Required', variantOther ? 'Please enter your variant name.' : 'Please select your variant.'); return;
    }
    if (!transmission) {
      Alert.alert('Required', 'Please select the transmission.'); return;
    }
    if (!fuelType) {
      Alert.alert('Required', 'Please select the fuel type.'); return;
    }
    if (!modelYear) {
      Alert.alert('Required', 'Please select the year.'); return;
    }
    if (!bodyType) {
      Alert.alert('Required', 'Please select the body type.'); return;
    }
    if (!toNum(vehiclePrice)) {
      Alert.alert('Required', 'Please enter the vehicle price.'); return;
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
      const price = toNum(vehiclePrice);
      // Pehla variant = ye listing khud (Dealer ki price breakdown isi me); baqi variants Compare Variants ke liye
      const ownVariant: Record<string, any> = { name: variant.trim() || `${brand} ${model}`.trim(), price };
      if (isDealer) {
        if (whtFiler.trim()) ownVariant.withholding_tax_filer = toNum(whtFiler);
        if (whtNonFiler.trim()) ownVariant.withholding_tax_non_filer = toNum(whtNonFiler);
      }
      const variantsPayload = extraVariants.length
        ? [ownVariant, ...extraVariants.map(name => ({ name }))]
        : (isDealer ? [ownVariant] : []);
      // Non-dealer (individual seller) inventory used me jata hai taake Buy Used me show ho
      const isIndividual = (user as any)?.role === 'individual_seller';
      const payload = {
        title: `${brand} ${model}${variant ? ' ' + variant : ''}`,
        make: brand,
        model,
        variant: variant || undefined,
        year: parseInt(modelYear) || new Date().getFullYear(),
        price,
        variants: variantsPayload,
        city: city || undefined,
        transmission: transmission.toLowerCase(),
        fuel_type: fuelType.toLowerCase(),
        category: vehicleType,
        condition: isIndividual ? 'used' : 'new',
        color: selectedColor || undefined,
        body_type: bodyType || undefined,
        features: selectedFeatures,
        images: uploadedUrls,
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
            plan: detail.plan ?? 'basic',
            limit: String(detail.limit ?? 5),
            used: String(detail.used ?? 5),
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

  const PLANS = [
    { title: 'Hot Selling listing', desc: 'Recommended for popular cars', price: 'Rs 6,650' },
    { title: 'Home page Listing', desc: 'Balanced exposure for more buyers', price: 'Rs 5,500', fire: true },
    { title: 'New Listing', desc: 'Notify Buyers About New Listings', price: 'Rs 4,450' },
  ];

  function addColor() {
    const val = customColor.trim();
    if (val) { if (!colors.includes(val)) setColors(prev => [...prev, val]); setSelectedColor(val); }
    setCustomColor(''); setShowColorInput(false);
  }

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        {/* HEADER */}
        <DHeader title="Vehicle Details" center right={<SaveDraftAction onPress={handleDraft} />} />
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* AD LIMIT */}
          <Text style={s.adLimit}>Ad Limit  (3/5)</Text>

          {/* UPLOAD BOX */}
          <UploadBox
            title="+ Add Vehicle Images"
            sub={images.length > 0 ? `${images.length} image${images.length > 1 ? 's' : ''} selected` : 'Drag & drop or click to browse. Recommended 16:9 ratio.'}
            onPress={pickImages}
          />

          {/* IMAGES PREVIEW */}
          {images.length > 0 && (
            <FlatList
              data={images}
              keyExtractor={(item, i) => `${i}-${item}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12 }}
              contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
              renderItem={({ item }) => (
                <View style={s.imgThumbWrap}>
                  <Image source={{ uri: item }} style={s.imgThumb} resizeMode="cover" />
                  <TouchableOpacity style={s.imgRemoveBtn} onPress={() => removeImage(item)}>
                    <X size={12} color="#fff" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          {/* VEHICLE TYPE */}
          <Text style={s.label}>Vehicle Type</Text>
          <View style={s.typeRow}>
            {(['car', 'bike'] as const).map(t => (
              <Chip key={t} label={t === 'car' ? 'Car' : 'Bike'} selected={vehicleType === t} onPress={() => changeVehicleType(t)} />
            ))}
          </View>

          {/* BASIC FIELDS — dropdowns: City → Brand → Vehicle → Variant → Year → Body Type */}
          <DSelect label="City" placeholder="Select your city" value={city} onPress={() => setPicker('city')} />

          <DSelect label="Brand" placeholder="Select your brand" value={brandOther ? OTHER : brand} onPress={() => setPicker('brand')} />
          {brandOther && <View style={s.otherInput}><InputField label="" placeholder="Enter brand name ex: (Honda)" value={brand} onChangeText={setBrand} /></View>}

          <DSelect label="Vehicle" placeholder="Select your vehicle" value={modelOther ? OTHER : model}
            onPress={() => (brand.trim() || brandOther ? setPicker('model') : Alert.alert('Select Brand', 'Please select the brand first.'))} />
          {modelOther && <View style={s.otherInput}><InputField label="" placeholder="Enter vehicle name ex: (City)" value={model} onChangeText={setModel} /></View>}

          <DSelect label="Variant" placeholder="Select your variant" value={variantOther ? OTHER : variant} onPress={() => setPicker('variant')} />
          {variantOther && <View style={s.otherInput}><InputField label="" placeholder="Enter variant name ex: (1.2 Aspire CVT)" value={variant} onChangeText={setVariant} /></View>}

          <DSelect label="Transmission" placeholder="Select your transmission" value={transmission} onPress={() => setPicker('transmission')} />
          <DSelect label="Fuel" placeholder="Select your fuel type" value={fuelType} onPress={() => setPicker('fuel')} />

          {/* Dosre variants — customer side vehicle detail ke "Compare Variants" me show hote hain */}
          <Text style={s.label}>Other Variants (Optional)</Text>
          <View style={s.chipsWrap}>
            {extraVariants.map(v => (
              <TouchableOpacity key={v} style={s.variantChip} activeOpacity={0.85} onPress={() => setExtraVariants(prev => prev.filter(x => x !== v))}>
                <Text style={s.variantChipTxt}>{v}</Text>
                <X size={13} color={ORANGE} />
              </TouchableOpacity>
            ))}
            <AddChip onPress={() => setPicker('extraVariant')} />
          </View>

          <DSelect label="Year" placeholder="Select your year" value={modelYear} onPress={() => setPicker('year')} />
          <DSelect label="Body Type" placeholder="Select your body type" value={bodyType} onPress={() => setPicker('body')} />

          {/* PRICING — Dealer: full breakdown; Seller / Become_a_Seller: sirf Vehicle Price */}
          <Text style={s.sectionTitle}>Pricing Details</Text>
          <InputField label="Vehicle Price (PKR)" placeholder="Enter vehicle price" value={vehiclePrice} onChangeText={setVehiclePrice} keyboardType="numeric" />
          {isDealer && (
            <>
              <InputField label="Withholding Tax (Filer)" placeholder="Enter withholding tax (filer)" value={whtFiler} onChangeText={setWhtFiler} keyboardType="numeric" />
              <InputField label="Withholding Tax (Non-Filer)" placeholder="Enter withholding tax (non-filer)" value={whtNonFiler} onChangeText={setWhtNonFiler} keyboardType="numeric" />
            </>
          )}

          {/* FEATURES */}
          <OutlineCard style={s.box}>
            <Text style={s.boxTitle}>Vehicle Features</Text>
            <View style={s.chipsWrap}>
              {features.map(f => (
                <Chip key={f} label={f} selected={selectedFeatures.includes(f)} onPress={() => toggleFeature(f)} />
              ))}
              {showFeatureInput
                ? <ChipInput value={customFeature} onChange={setCustomFeature} onDone={addCustomFeature} onCancel={() => { setShowFeatureInput(false); setCustomFeature(''); }} placeholder="Type feature..." />
                : <AddChip onPress={() => setShowFeatureInput(true)} />}
            </View>
          </OutlineCard>

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
          <OutlineCard style={[s.box, { marginTop: 4 }]}>
            <Text style={s.boxTitle}>Available Colors</Text>
            <View style={s.chipsWrap}>
              {colors.map(c => (
                <Chip key={c} label={c} selected={selectedColor === c} onPress={() => setSelectedColor(prev => prev === c ? '' : c)} />
              ))}
              {showColorInput
                ? <ChipInput value={customColor} onChange={setCustomColor} onDone={addColor} onCancel={() => { setShowColorInput(false); setCustomColor(''); }} placeholder="e.g. Navy Blue" />
                : <AddChip onPress={() => setShowColorInput(true)} />}
            </View>
          </OutlineCard>

          {/* PROMOTE */}
          <Text style={[s.sectionTitle, { marginBottom: 0 }]}>Promote Vehicle</Text>
          <Text style={s.planSub}>Select Placement Plan</Text>

          <PromoCard title="Promote to Get Your  Vehicle Seen Faster" sub="Get 5x more visibility by featuring your listing">
            {PLANS.map(p => (
              <PlanOption
                key={p.title}
                title={p.title}
                sub={p.desc}
                price={p.price}
                fire={p.fire}
                selected={selectedPlan === p.title}
                onPress={() => setSelectedPlan(p.title)}
              />
            ))}
          </PromoCard>

          {/* TERMS */}
          <TermsRow checked={accepted} onToggle={() => setAccepted(v => !v)} />

          <View style={{ height: 170 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dropdown sheets */}
      <SelectSheet visible={picker === 'city'} title="City" options={VEHICLE_CITIES} selected={city} onSelect={setCity} onClose={() => setPicker(null)} />
      <SelectSheet visible={picker === 'brand'} title="Brand" options={brandOptions} selected={brandOther ? OTHER : brand} onSelect={pickBrand} onClose={() => setPicker(null)} />
      <SelectSheet visible={picker === 'model'} title="Vehicle" options={modelOptions} selected={modelOther ? OTHER : model} onSelect={pickModel} onClose={() => setPicker(null)} />
      <SelectSheet visible={picker === 'variant'} title="Variant" options={variantOptions} selected={variantOther ? OTHER : variant} onSelect={pickVariant} onClose={() => setPicker(null)} />
      <SelectSheet visible={picker === 'transmission'} title="Transmission" options={TRANSMISSIONS} selected={transmission} onSelect={setTransmission} onClose={() => setPicker(null)} />
      <SelectSheet visible={picker === 'fuel'} title="Fuel" options={FUEL_TYPES} selected={fuelType} onSelect={setFuelType} onClose={() => setPicker(null)} />
      <SelectSheet visible={picker === 'extraVariant'} title="Other Variant" options={extraVariantOptions} selected=""
        onSelect={v => setExtraVariants(prev => (prev.includes(v) ? prev : [...prev, v]))} onClose={() => setPicker(null)} />
      <SelectSheet visible={picker === 'year'} title="Year" options={VEHICLE_YEARS} selected={modelYear} onSelect={setModelYear} onClose={() => setPicker(null)} />
      <SelectSheet visible={picker === 'body'} title="Body Type" options={bodyOptions} selected={bodyType} onSelect={setBodyType} onClose={() => setPicker(null)} />

      <PromoteModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onPromote={handlePromote}
      />

      {/* BOTTOM BUTTONS */}
      <BottomActions fx>
        <GlowPublishButton title="Publish" loading={publishing} onPress={handlePublish} />
        <GlowDraftButton title="Save as Draft" onPress={handleDraft} />
      </BottomActions>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },

  /* AD LIMIT */
  adLimit: { color: D.muted, fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginTop: 4, marginBottom: 14 },

  imgThumbWrap: { width: 90, height: 70, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  imgThumb: { width: '100%', height: '100%' },
  imgRemoveBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },

  label: { color: D.muted, fontSize: 14, fontFamily: 'Poppins_500Medium', marginTop: 16, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 10 },
  otherInput: { marginTop: 10 },
  variantChip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: ORANGE, backgroundColor: '#2A1A1C' },
  variantChipTxt: { color: ORANGE, fontSize: 12, fontFamily: 'Poppins_500Medium' },

  /* SECTION */
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginTop: 22, marginBottom: 12 },

  /* FEATURE / COLOR BOXES */
  box: { marginTop: 18, paddingTop: 22, paddingBottom: 18 },
  boxTitle: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 16 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, height: 36, borderRadius: 18, borderWidth: 1, borderColor: ORANGE, backgroundColor: D.navy },
  chipInput: { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_400Regular', minWidth: 100, paddingVertical: 0 },

  /* STATUS */
  statusOption: { height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(200,200,215,0.35)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, marginBottom: 12 },
  statusOptionActive: { borderColor: ORANGE, backgroundColor: '#2A1A1C' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: D.muted, marginRight: 14 },
  statusDotActive: { backgroundColor: ORANGE },
  statusText: { color: D.muted, fontSize: 16, fontFamily: 'Poppins_400Regular' },
  statusTextActive: { color: ORANGE },

  /* PROMOTE */
  planSub: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 16 },
});
