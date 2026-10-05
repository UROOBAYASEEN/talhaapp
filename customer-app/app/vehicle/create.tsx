import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  FlatList,
  Image,
  Alert,
  Dimensions,
  Modal,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/constants/api";
import { useAppColors } from "@/constants/theme";

const { width } = Dimensions.get("window");
const MAX_PHOTOS = 6;
const MIN_PHOTOS = 5;

const BG       = "#010a1f";
const WHITE    = "#f9fafc";
const SUBTITLE = "#baacb6";
const ORANGE   = "#e2671b";
const CARD_BG  = "#06112A";
const SHADOW   = "#1D53AF";

const STEPS = [1, 2, 3, 4, 5, 6, 7];

// ── Dropdown data ────────────────────────────────────────────────────────────
const BRANDS: Record<string, string[]> = {
  "Suzuki":        ["Alto","Cultus","Swift","Wagon R","Jimny","Vitara","Bolan","Ravi","APV","Every","Ertiga","Baleno","Ciaz","Other"],
  "Honda":         ["Civic","City","HR-V","BR-V","Accord","CR-V","Fit","Jazz","Freed","Vezel","Other"],
  "Toyota":        ["Corolla","Camry","Prius","Fortuner","Hilux","Land Cruiser","Yaris","Vitz","Rush","Prado","Aqua","Raize","C-HR","Other"],
  "Kia":           ["Sportage","Picanto","Sorento","Stonic","Carnival","Cerato","Other"],
  "Hyundai":       ["Tucson","Elantra","Sonata","Santa Fe","Grand i10","Ioniq","Other"],
  "Changan":       ["Alsvin","Oshan X7","CS35 Pro","CS55 Pro","Uni-T","Uni-V","Other"],
  "MG":            ["HS","ZS","MG5","MG6","Extender","Other"],
  "Proton":        ["Saga","X70","X50","Aman","Other"],
  "DFSK":          ["Glory 580","Glory 500","Glory 580 Pro","Other"],
  "Prince":        ["Pearl","Rana","Other"],
  "FAW":           ["V2","Carrier","Other"],
  "BMW":           ["3 Series","5 Series","7 Series","X1","X3","X5","X6","M3","M5","Other"],
  "Mercedes-Benz": ["C-Class","E-Class","S-Class","GLA","GLC","GLE","GLS","A-Class","Other"],
  "Audi":          ["A3","A4","A5","A6","A8","Q3","Q5","Q7","Other"],
  "Volkswagen":    ["Polo","Golf","Passat","Tiguan","Other"],
  "Daihatsu":      ["Cuore","Mira","Move","Boon","Other"],
  "Mitsubishi":    ["Lancer","Pajero","Outlander","ASX","Eclipse Cross","Other"],
  "Nissan":        ["Sunny","Dayz","Juke","X-Trail","Patrol","Other"],
  "Isuzu":         ["D-Max","MU-X","Other"],
  "Peugeot":       ["207","301","408","2008","Other"],
  "Renault":       ["Duster","Clio","Other"],
  "Haval":         ["H6","Jolion","Other"],
  "Sazgar":        ["BAIC D20","BAIC BJ40","Other"],
  "Master":        ["Chery Tiggo 4","Chery Tiggo 8","Other"],
  "Regal":         ["Frontier","Other"],
  "Other":         ["Other"],
};

// NOTE: Brand list backend `/brands` API se aati hai (brandOptions) — static list yahan nahi use hoti.

const YEARS = Array.from({ length: 2026 - 1970 }, (_, i) => String(2025 - i));

const FUEL_TYPES   = ["Petrol","Diesel","CNG","Hybrid","Electric","LPG","Other"];
const COLORS       = ["White","Silver","Black","Grey","Red","Blue","Green","Brown","Beige","Gold","Orange","Yellow","Maroon","Navy Blue","Sky Blue","Pearl White","Other"];
// Pakistan ke main cities (Search Smart wali list — same)
const SELL_CITIES  = ["All Cities","Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar","Quetta","Hyderabad","Sialkot","Gujranwala","Bahawalpur","Sargodha","Abbottabad","Gujrat","Jhang","Sahiwal","Sukkur","Larkana","Mardan","Sheikhupura","Kasur","Okara","Dera Ghazi Khan","Jhelum","Wah Cantt","Muzaffarabad","Gilgit","Gwadar"];
const AD_DURATIONS = ["1 Week","2 Weeks","1 Month","3 Months","6 Months"];
const TRANSMISSIONS = ["Automatic","Manual","Other"];
const CONDITIONS   = ["Used","New"];

function Step2FigmaField({ label, value, sample, onPress, onChangeText, numeric = false, dark }: {
  label: string; value: string; sample: string; onPress?: () => void;
  onChangeText?: (value: string) => void; numeric?: boolean; dark: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: dark ? '#b8acba' : '#64748b', fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 8 }}>{label}</Text>
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ height: 48, borderRadius: 9, backgroundColor: dark ? '#091e4e' : '#eef3ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 }}>
          <Text style={{ color: dark ? '#f9fafc' : '#010a1f', fontSize: 15, fontFamily: 'Poppins_500Medium' }}>{value || sample}</Text>
          <Ionicons name="chevron-down" size={21} color="#e2671b" />
        </TouchableOpacity>
      ) : (
        <View style={{ height: 48, borderRadius: 9, backgroundColor: dark ? '#091e4e' : '#eef3ff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
          <TextInput value={value} onChangeText={onChangeText} placeholder={sample} placeholderTextColor={dark ? '#f9fafc' : '#64748b'} keyboardType={numeric ? 'numeric' : 'default'} style={{ flex: 1, color: dark ? '#f9fafc' : '#010a1f', fontSize: 15, fontFamily: 'Poppins_500Medium', padding: 0 }} />
          <Ionicons name="chevron-down" size={21} color="#e2671b" />
        </View>
      )}
    </View>
  );
}

// ── Picker Modal ─────────────────────────────────────────────────────────────
function PickerModal({ visible, title, options, onSelect, onClose, getIcon }: {
  visible: boolean; title: string; options: string[];
  onSelect: (v: string) => void; onClose: () => void;
  getIcon?: (opt: string) => any;
}) {
  const [search, setSearch] = useState("");
  const C = useAppColors();
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={pm.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[pm.sheet, { backgroundColor: C.isDark ? "rgba(6,27,74,1)" : "#ffffff", borderColor: C.isDark ? "rgba(100,160,255,0.3)" : "rgba(3,12,40,0.12)" }]}>
        <View style={[pm.handle, { backgroundColor: C.isDark ? "rgba(255,255,255,0.2)" : "rgba(3,12,40,0.15)" }]} />
        <Text style={[pm.title, { color: C.textPrimary }]}>{title}</Text>
        {options.length > 6 && (
          <TextInput
            style={[pm.search, { backgroundColor: C.glassBg, borderColor: C.glassBorder, color: C.textPrimary }]}
            placeholder="Search..."
            placeholderTextColor={C.textPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
        )}
        <FlatList
          data={filtered}
          keyExtractor={i => i}
          style={{ maxHeight: 360 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          renderItem={({ item }) => (
            <TouchableOpacity style={[pm.item, { borderBottomColor: C.divider }]} onPress={() => { onSelect(item); onClose(); setSearch(""); }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                {getIcon?.(item) ? (
                  <Image source={getIcon(item)} style={{ width: 28, height: 28, borderRadius: 6 }} resizeMode="contain" />
                ) : null}
                <Text style={[pm.itemTxt, { color: C.textPrimary }]}>{item}</Text>
              </View>
              {item === "Other" && <Ionicons name="create-outline" size={16} color={C.textSecondary} />}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet:   { backgroundColor: "rgba(6,27,74,1)", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, borderWidth: 1, borderColor: "rgba(100,160,255,0.3)" },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginBottom: 16 },
  title:   { color: "#f9fafc", fontSize: 16, fontFamily: "Poppins_600SemiBold", marginBottom: 12 },
  search:  { backgroundColor: "rgba(6,27,74,1)", borderWidth: 1, borderColor: "rgba(100,160,255,0.5)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: "#f9fafc", fontSize: 14, fontFamily: "Poppins_400Regular", marginBottom: 8 },
  item:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  itemTxt: { color: "#f9fafc", fontSize: 15, fontFamily: "Poppins_400Regular" },
});

// ── Main Component ────────────────────────────────────────────────────────────
export default function SellMyVehicle() {
  const router = useRouter();
  const { token, user } = useAuth();
  const aC = useAppColors();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting,  setSubmitting]  = useState(false);

  // Step 1
  const [selectedVehicle, setSelectedVehicle] = useState<"car" | "bike">("car");

  // Step 2 — basic details
  const [brand,        setBrand]        = useState("");
  const [carModel,     setCarModel]     = useState("");
  const [city,         setCity]         = useState("");
  const [year,         setYear]         = useState("");
  const [variant,      setVariant]      = useState("");
  const [adDuration,   setAdDuration]   = useState("");
  const [fuelType,     setFuelType]     = useState("");
  const [km,           setKm]           = useState("");
  const [color,        setColor]        = useState("");
  const [transmission, setTransmission] = useState("");
  const [condition,    setCondition]    = useState("Used");

  // "Other" custom text inputs
  const [otherBrand,   setOtherBrand]   = useState("");
  const [otherModel,   setOtherModel]   = useState("");
  const [otherColor,   setOtherColor]   = useState("");
  const [otherFuel,    setOtherFuel]    = useState("");

  // Backend brands (admin panel se) — Step 2 Brand mein yahe aate hain, logo ke sath
  const [apiBrands, setApiBrands] = useState<{ name: string; logo_url?: string | null }[]>([]);
  const SERVER = API_BASE.replace("/api/v1", "");
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/brands?category=${selectedVehicle}`);
        if (res.ok) {
          const d = await res.json();
          if (alive && Array.isArray(d)) {
            setApiBrands(d.filter((b: any) => b?.name).map((b: any) => ({ name: b.name, logo_url: b.logo_url ?? null })));
          }
        }
      } catch { /* offline → sirf Any */ }
    })();
    return () => { alive = false; };
  }, [selectedVehicle]);
  const brandOptions = [...apiBrands.map(b => b.name), "Any"];
  function brandLogo(name?: string | null) {
    if (!name) return undefined;
    const hit = apiBrands.find(b => b.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (hit?.logo_url) {
      return { uri: hit.logo_url.startsWith("http") ? hit.logo_url : `${SERVER}${hit.logo_url}` };
    }
    return undefined;
  }

  // Active picker
  const [pickerFor,  setPickerFor]  = useState<string | null>(null);

  // Step 3
  const [askingPrice, setAskingPrice] = useState("");
  const [location,    setLocation]    = useState("");

  // Step 4
  const [photos, setPhotos] = useState<string[]>([]);

  // Step 5
  const [adTitle,      setAdTitle]      = useState("");
  const [description,  setDescription]  = useState("");
  const [features,     setFeatures]     = useState<string[]>(["Air Conditioning","ABS","Airbags","Power Windows"]);
  const [newFeature,   setNewFeature]   = useState("");
  const [showAddInput, setShowAddInput] = useState(false);

  // Step 6
  const [contactName,      setContactName]      = useState("");
  const [contactPhone,     setContactPhone]     = useState("");
  const [contactEmail,     setContactEmail]     = useState("");
  const [whatsapp,         setWhatsapp]         = useState("");
  const [whatsappEnabled,  setWhatsappEnabled]  = useState(true);
  const [termsAccepted,    setTermsAccepted]    = useState(false);

  // Pre-fill contact details from profile when reaching Step 6
  useEffect(() => {
    if (currentStep === 6 && user) {
      if (!contactName  && user.full_name) setContactName(user.full_name);
      if (!contactPhone && user.phone)     setContactPhone(user.phone);
      if (!contactEmail && user.email)     setContactEmail(user.email);
      if (!whatsapp     && user.phone)     setWhatsapp(user.phone);
    }
  }, [currentStep, user]);

  // "Any" select karne pe user khud brand likhta hai — wahe DB mein store hota hai
  const effectiveBrand = brand === "Any" ? otherBrand : brand;
  const effectiveModel = carModel === "Other" ? otherModel : carModel;
  const effectiveColor = color === "Other" ? otherColor : color;
  const effectiveFuel  = fuelType === "Other" ? otherFuel : fuelType;

  const modelOptions = brand && brand !== "Any" ? (BRANDS[brand] || ["Other"]) : ["Other"];

  function handleBack() {
    if (currentStep > 1) setCurrentStep(s => s - 1);
    else router.back();
  }

  async function uploadPhoto(uri: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split("/").pop() || "photo.jpg";
    const ext = filename.split(".").pop() || "jpg";
    formData.append("file", { uri, name: filename, type: `image/${ext}` } as any);
    const res = await fetch(`${API_BASE}/upload/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    return `${API_BASE.replace("/api/v1", "")}${data.url}`;
  }

  async function submitListing() {
    if (!token) { Alert.alert("Error", "Please login first"); return; }
    setSubmitting(true);
    try {
      const uploadedImages = await Promise.all(photos.map(uploadPhoto));
      const stepCity = (city && city !== "All Cities" ? city : location.split(" ")[0]) || "Karachi";
      const payload = {
        title:            adTitle || `${effectiveBrand} ${effectiveModel} ${variant} ${year}`.trim(),
        make:             effectiveBrand  || "Other",
        model:            effectiveModel  || "Other",
        variant:          variant         || null,
        year:             parseInt(year)  || new Date().getFullYear(),
        price:            parseFloat(askingPrice.replace(/,/g, "")) || 0,
        category:         selectedVehicle,
        condition:        condition.toLowerCase(),
        mileage:          parseInt(km)    || 0,
        fuel_type:        effectiveFuel.toLowerCase() || "petrol",
        transmission:     transmission.toLowerCase()  || "automatic",
        color:            effectiveColor  || null,
        description,
        images:           uploadedImages,
        city:             stepCity,
        features,
        ad_duration:      adDuration      || "1 week",
        contact_phone:    contactPhone,
        contact_whatsapp: whatsappEnabled ? whatsapp : null,
        assembly:         "Local",
        registered_city:  stepCity,
      };
      const res = await fetch(`${API_BASE}/vehicles/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create listing");
      const vehicle = await res.json();
      router.push({
        pathname: "/vehicle/success",
        params: {
          vehicleId: vehicle.id,
          photo:     uploadedImages[0] || "",
          title:     payload.title,
          price:     askingPrice,
        },
      });
    } catch (e) {
      Alert.alert("Error", "Failed to publish listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleContinue() {
    if (currentStep === 4 && photos.length < MIN_PHOTOS) {
      Alert.alert("Add More Photos", `Please add at least ${MIN_PHOTOS} photos to continue.`);
      return;
    }
    if (currentStep === 7) {
      submitListing();
      return;
    }
    setCurrentStep(s => s + 1);
  }

  async function pickImages() {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Maximum Photos", `You can upload maximum ${MAX_PHOTOS} photos.`);
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow photo library access to upload photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, MAX_PHOTOS));
    }
  }

  function removePhoto(index: number) {
    Alert.alert("Remove Photo", "Do you want to remove this photo?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setPhotos(prev => prev.filter((_, i) => i !== index)) },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.isDark ? aC.bg : "#ffffff"} />

      {/* Header — dark mode me bg dark */}
      <View style={[styles.header, { backgroundColor: aC.isDark ? aC.bg : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}> 
        <TouchableOpacity style={styles.headerIcon} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color={aC.isDark ? '#f9fafc' : "#010a1f"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Sell My Vehicle</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()}>
          <Ionicons name="close" size={25} color={aC.isDark ? '#f9fafc' : "#010a1f"} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pagination — 1-7 counting: blue-orange gradient border */}
        <View style={styles.stepsContainer}>
          {STEPS.map((step, index) => (
            <React.Fragment key={step}>
              <View style={[styles.stepCircle, step === currentStep && styles.activeStep, step === currentStep && { borderColor: aC.isDark ? '#8eafdf' : '#032a69' }]}>
                {step === currentStep && aC.isDark && <LinearGradient colors={['#254c87', '#142e5d', '#0d234a']} locations={[0, 0.55, 1]} style={styles.activeStepGradient} pointerEvents="none" />}
                <Text
                  allowFontScaling={false}
                  style={[styles.stepNumber, { color: aC.isDark ? '#f9fafc' : '#032a69' }]}
                >{String(step)}</Text>
              </View>
              {index < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: aC.isDark ? '#0C2B61' : 'rgba(3,12,40,0.12)' }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── STEP 1: Select Vehicle Type ── */}
        {currentStep === 1 && (
          <>
            <View style={styles.headingContainer}>
              <Text style={[styles.heading, { color: aC.textPrimary }]}>Select Vehicle Type</Text>
              <Text style={[styles.subHeading, { color: aC.textSecondary }]}>Choose the type of vehicle you want to sell</Text>
            </View>

            {/* Car card — border blue→orange gradient, bg white, selected shade */}
            <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedVehicle("car")} style={{ marginBottom: 20 }}>
              <View style={[styles.vehicleCardBorder, selectedVehicle === "car" && aC.isDark && styles.vehicleCardBorderGlow, { borderColor: aC.isDark ? (selectedVehicle === "car" ? '#829fd0' : 'transparent') : '#cbd5e1' }]}>
                <View style={[styles.vehicleCard, { backgroundColor: aC.isDark ? (selectedVehicle === "car" ? '#010b1e' : '#061b4a') : '#ffffff', borderWidth: 0, marginBottom: 0, overflow: 'hidden' }]}>
                  {aC.isDark && selectedVehicle === "car" && <>
                    <LinearGradient colors={['rgba(35,83,165,0.52)', 'transparent']} style={styles.cardGlowTop} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.30)', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.cardGlowBottom} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardGlowLeft} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={styles.cardGlowRight} pointerEvents="none" />
                  </>}
                  <View style={styles.vehicleTop}>
                    <View style={styles.vehicleIcon}>
                      <Ionicons name="car-sport-outline" size={24} color="#FF6A00" />
                    </View>
                    <View style={styles.vehicleInfo}>
                      <Text style={[styles.vehicleTitle, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Car Listing</Text>
                      <Text style={[styles.vehicleDescription, { color: aC.isDark ? '#baacb6' : '#6b7280' }]}>
                        Sell new or used cars easily{"\n"}to thousand
                      </Text>
                    </View>
                    <View style={[styles.radioOuter, { backgroundColor: aC.isDark ? '#123363' : '#eef1ff', borderColor: selectedVehicle === "car" ? '#829fd0' : (aC.isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1') }, selectedVehicle === "car" && styles.radioOuterSelected]}>
                      {selectedVehicle === "car" && <View style={[styles.radioInner, { backgroundColor: WHITE }]} />}
                    </View>
                  </View>
                  <View style={styles.featuresContainer}>
                    <Feature icon="people-outline"          text={<>Verified{"\n"}Buyers</>} muted />
                    <View style={[styles.verticalLine, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,12,40,0.12)' }]} />
                    <Feature icon="shield-checkmark-outline" text={<>Safe &amp;{"\n"}secure</>} muted />
                    <View style={[styles.verticalLine, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,12,40,0.12)' }]} />
                    <Feature icon="hand-left-outline" text={<>Better{"\n"}Deals</>} muted />
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Bike card — border blue→orange gradient, bg white, selected shade */}
            <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedVehicle("bike")} style={{ marginBottom: 20 }}>
              <View style={[styles.vehicleCardBorder, selectedVehicle === "bike" && aC.isDark && styles.vehicleCardBorderGlow, { borderColor: aC.isDark ? (selectedVehicle === "bike" ? '#829fd0' : 'transparent') : '#cbd5e1' }]}>
                <View style={[styles.vehicleCard, { backgroundColor: aC.isDark ? (selectedVehicle === "bike" ? '#010b1e' : '#061b4a') : '#ffffff', borderWidth: 0, marginBottom: 0, overflow: 'hidden' }]}>
                  {aC.isDark && selectedVehicle === "bike" && <>
                    <LinearGradient colors={['rgba(35,83,165,0.52)', 'transparent']} style={styles.cardGlowTop} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.30)', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.cardGlowBottom} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardGlowLeft} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={styles.cardGlowRight} pointerEvents="none" />
                  </>}
                  <View style={styles.vehicleTop}>
                    <View style={styles.vehicleIcon}>
                      <Ionicons name="bicycle-outline" size={25} color="#FF6A00" />
                    </View>
                    <View style={styles.vehicleInfo}>
                      <Text style={[styles.vehicleTitle, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Bike Listing</Text>
                      <Text style={[styles.vehicleDescription, { color: aC.isDark ? '#baacb6' : '#6b7280' }]}>
                        List your bike and connect{"\n"}with serious buyers
                      </Text>
                    </View>
                    {selectedVehicle === "bike" && <View style={[styles.radioOuter, styles.radioOuterSelected, { backgroundColor: '#123363', borderColor: '#829fd0' }]}>
                      <View style={[styles.radioInner, { backgroundColor: WHITE }]} />
                    </View>
                    }
                  </View>
                  <View style={styles.featuresContainer}>
                    <Feature icon="rocket-outline"          text={<>Quick{"\n"}Listing</>} />
                    <View style={[styles.verticalLine, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,12,40,0.12)' }]} />
                    <Feature icon="eye-outline"             text={<>High{"\n"}Visibility</>} />
                    <View style={[styles.verticalLine, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,12,40,0.12)' }]} />
                    <Feature icon="shield-checkmark-outline" text={<>Trusted{"\n"}Platform</>} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 2: Basic Details ── */}
        {currentStep === 2 && (
          <>
            <View style={styles.headingContainer}>
              <Text style={[styles.heading, { color: aC.textPrimary }]}>Basic Details</Text>
              <Text style={[styles.subHeading, { color: aC.textSecondary }]}>Enter your vehicle details</Text>
            </View>

            {/* Picker modals */}
            <PickerModal visible={pickerFor === "brand"}    title="Select Brand"        options={brandOptions}    getIcon={brandLogo} onSelect={v => { setBrand(v); setCarModel(""); }} onClose={() => setPickerFor(null)} />
            <PickerModal visible={pickerFor === "city"}     title="Select City"         options={SELL_CITIES}   onSelect={setCity}        onClose={() => setPickerFor(null)} />
            <PickerModal visible={pickerFor === "model"}    title="Select Model"        options={modelOptions}  onSelect={setCarModel}    onClose={() => setPickerFor(null)} />
            <PickerModal visible={pickerFor === "year"}     title="Select Year"         options={YEARS}         onSelect={setYear}         onClose={() => setPickerFor(null)} />
            <PickerModal visible={pickerFor === "fuel"}     title="Select Fuel Type"    options={FUEL_TYPES}    onSelect={setFuelType}     onClose={() => setPickerFor(null)} />
            <PickerModal visible={pickerFor === "color"}    title="Select Color"        options={COLORS}        onSelect={setColor}        onClose={() => setPickerFor(null)} />
            <PickerModal visible={pickerFor === "duration"} title="Select Ad Duration"  options={AD_DURATIONS}  onSelect={setAdDuration}   onClose={() => setPickerFor(null)} />
            <PickerModal visible={pickerFor === "trans"}    title="Transmission"        options={TRANSMISSIONS} onSelect={setTransmission} onClose={() => setPickerFor(null)} />
            <PickerModal visible={pickerFor === "cond"}     title="Condition"           options={CONDITIONS}    onSelect={setCondition}    onClose={() => setPickerFor(null)} />

            <View style={[styles.step2CardBorder, aC.isDark && styles.vehicleCardBorderGlow, { borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.14)' }]}>
            <View style={[styles.formCard, styles.step2FormCard, { backgroundColor: aC.isDark ? '#010b1e' : '#ffffff', borderColor: 'transparent', overflow: 'hidden' }]}>
              {aC.isDark && <>
                <LinearGradient colors={['rgba(35,83,165,0.40)', 'transparent']} style={styles.cardGlowTop} pointerEvents="none" />
                <LinearGradient colors={['rgba(35,83,165,0.30)', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.step2GlowBottom} pointerEvents="none" />
                <LinearGradient colors={['rgba(35,83,165,0.30)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.step2GlowLeft} pointerEvents="none" />
                <LinearGradient colors={['rgba(35,83,165,0.30)', 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={styles.step2GlowRight} pointerEvents="none" />
              </>}
              {!aC.isDark && (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.05)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.12)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              {/* Vehicle Type selection is handled in Step 1; the duplicate Step 2 toggle is intentionally commented out. */}
              <Step2FigmaField label="Brand" value={brand === "Any" ? otherBrand || "Any" : brand} sample="Honda" onPress={() => setPickerFor("brand")} dark={aC.isDark} />
              {brand === "Any" && <TextInput value={otherBrand} onChangeText={setOtherBrand} placeholder="Which brand?" placeholderTextColor="#b8acba" style={[styles.step2OtherInput, { color: aC.textPrimary }]} />}
              <Step2FigmaField label="City" value={city} sample="Karachi" onPress={() => setPickerFor("city")} dark={aC.isDark} />
              <Step2FigmaField label="Year" value={year} sample="2024" onPress={() => setPickerFor("year")} dark={aC.isDark} />
              <Step2FigmaField label="Variant" value={variant} sample="1.2 Aspire CVT" onChangeText={setVariant} dark={aC.isDark} />
              <Step2FigmaField label="Ad Duration" value={adDuration} sample="1 week" onPress={() => setPickerFor("duration")} dark={aC.isDark} />
              <Step2FigmaField label="Fuel Type" value={fuelType} sample="Petrol" onPress={() => setPickerFor("fuel")} dark={aC.isDark} />
              {fuelType === "Other" && <TextInput value={otherFuel} onChangeText={setOtherFuel} placeholder="Enter fuel type" placeholderTextColor="#b8acba" style={[styles.step2OtherInput, { color: aC.textPrimary }]} />}
              <Step2FigmaField label="KM" value={km} sample="5000" onChangeText={setKm} numeric dark={aC.isDark} />
              <Step2FigmaField label="Color" value={color} sample="Grey" onPress={() => setPickerFor("color")} dark={aC.isDark} />
              {color === "Other" && <TextInput value={otherColor} onChangeText={setOtherColor} placeholder="Enter color" placeholderTextColor="#b8acba" style={[styles.step2OtherInput, { color: aC.textPrimary }]} />}
            </View>
            </View>
          </>
        )}

        {/* ── STEP 3: Price & Location ── */}
        {currentStep === 3 && (
          <>
            <View style={styles.headingContainer}>
              <Text style={[styles.heading, { color: aC.textPrimary }]}>Price & Location</Text>
              <Text style={[styles.subHeading, { color: aC.textSecondary }]}>Set your asking price & location</Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.fieldLabel, aC.isDark && styles.step3FieldLabel, { color: aC.isDark ? '#b8acba' : aC.textPrimary }]}>Asking Price (PKR)</Text>
              <View style={[styles.inputWrapper, styles.step3InputWrapper, { backgroundColor: aC.isDark ? '#010b1e' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.14)', overflow: 'hidden' }]}>
                {!aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.06)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.55 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.05)']} start={{ x: 0.5, y: 0.5 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(35,83,165,0.46)', 'transparent']} style={styles.cardGlowTop} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.22)', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.cardGlowBottom} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardGlowLeft} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={styles.cardGlowRight} pointerEvents="none" />
                  </>
                )}
                <TextInput
                  value={askingPrice}
                  onChangeText={setAskingPrice}
                  keyboardType="numeric"
                  style={[styles.textInput, styles.step3TextInput, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}
                  placeholderTextColor="#8f8f8f"
                  placeholder="e.g. 3500000"
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.fieldLabel, aC.isDark && styles.step3FieldLabel, { color: aC.isDark ? '#b8acba' : aC.textPrimary }]}>Location</Text>
              <View style={[styles.inputWrapper, styles.step3InputWrapper, { backgroundColor: aC.isDark ? '#010b1e' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.14)', overflow: 'hidden' }]}>
                {!aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.06)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.55 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.05)']} start={{ x: 0.5, y: 0.5 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(35,83,165,0.46)', 'transparent']} style={styles.cardGlowTop} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.22)', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.cardGlowBottom} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardGlowLeft} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={styles.cardGlowRight} pointerEvents="none" />
                  </>
                )}
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  style={[styles.textInput, styles.step3TextInput, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}
                  placeholderTextColor="#8f8f8f"
                  placeholder="e.g. Karachi, Pakistan"
                />
              </View>
            </View>

            <LinearGradient colors={aC.isDark ? [ORANGE, '#1D3F8C'] : ['transparent', 'transparent']} style={aC.isDark ? styles.priceTipBorder : styles.priceTipBorderOff}>
            <View style={[styles.tipsCard, { backgroundColor: aC.isDark ? '#030E26' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.14)', overflow: 'hidden' }, aC.isDark && styles.priceTipInner]}>
              {!aC.isDark ? (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.45 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.14)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              ) : (
                <>
                  <LinearGradient colors={['#041B4A', '#0A1330', '#0E1224', '#3A2320', '#57301F']} locations={[0, 0.3, 0.5, 0.8, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              <Text style={[styles.tipsTitle, aC.isDark && styles.priceTipsTitle, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Price Tips</Text>
              <Text style={[styles.tipsText, aC.isDark && styles.priceTipsText, { color: aC.isDark ? '#baacb6' : '#475569' }]}>
                {effectiveBrand && effectiveModel && year
                  ? `Similar ${effectiveBrand} ${effectiveModel} ${year} ads in your area are listed between`
                  : "Enter your vehicle asking price above"}
              </Text>
              {askingPrice || aC.isDark ? (
                <>
                  <View style={[styles.tipsDivider, aC.isDark && styles.priceTipsDivider, { backgroundColor: aC.isDark ? 'rgba(186,172,182,0.4)' : 'rgba(3,12,40,0.08)' }]} />
                  <View style={[styles.tipsRange, aC.isDark && styles.priceTipsRange, { backgroundColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.04)' }]}>
                    <Text style={[styles.tipsRangeText, aC.isDark && styles.priceTipsRangeText, { color: aC.isDark ? '#f9fafc' : '#032a69' }]}>
                      {askingPrice ? `PKR ${Number(askingPrice.replace(/,/g, "") || 0).toLocaleString()}` : 'PKR 0'}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
            </LinearGradient>
          </>
        )}

        {/* ── STEP 4: Upload Photos — light mode white + orange shade ── */}
        {currentStep === 4 && (
          <>
            <View style={styles.headingContainer}>
              <Text style={[styles.heading, { color: aC.textPrimary }]}>Upload Photos</Text>
              <Text style={[styles.subHeading, { color: aC.textSecondary }]}>Add clear photos of your vehicle</Text>
            </View>

            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={`${photo}-${index}`} style={[styles.photoWrapper, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2 }]}>
                  {!aC.isDark && <><LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /><LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /></>}
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => removePhoto(index)}>
                    <Ionicons name="close" size={13} color={WHITE} />
                  </TouchableOpacity>
                </View>
              ))}

              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity style={[styles.addPhotoBtn, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2 }]} onPress={pickImages} activeOpacity={0.8}>
                  {!aC.isDark && <><LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /><LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /></>}
                  <View style={[styles.cameraCircle, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.06)', borderColor: aC.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(3,42,105,0.14)' }]}>
                    <Ionicons name="camera-outline" size={26} color={aC.isDark ? SUBTITLE : '#475569'} />
                  </View>
                  <Text style={[styles.addPhotoText, { color: aC.isDark ? SUBTITLE : '#475569' }]}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.photoCounter, { color: aC.textSecondary }]}>{photos.length}/{MAX_PHOTOS} photos added</Text>

            <View style={[styles.tipCard, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? ORANGE : 'rgba(3,42,105,0.14)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2 }]}>
              {aC.isDark ? (
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.25)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              ) : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.14)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              <Ionicons name="bulb-outline" size={16} color={ORANGE} style={{ marginRight: 10 }} />
              <Text style={[styles.tipText, { color: aC.isDark ? '#baacb6' : '#475569' }]}>
                Tip: Add at least 5 photos for better visibility
              </Text>
            </View>
          </>
        )}

        {/* ── STEP 5: Description ── */}
        {currentStep === 5 && (
          <>
            <View style={styles.headingContainer}>
              <Text style={[styles.heading, { color: aC.textPrimary }]}>Description</Text>
              <Text style={[styles.subHeading, { color: aC.textSecondary }]}>Write a detailed description about your vehicle</Text>
            </View>

            {/* Title input */}
            <View style={styles.inputSection}>
              <Text style={[styles.fieldLabel, aC.isDark && styles.step5FieldLabel, { color: aC.isDark ? '#b8acba' : aC.textPrimary }]}>Title</Text>
              <View style={[styles.inputWrapper, aC.isDark && styles.step5TitleWrapper, { backgroundColor: aC.isDark ? '#010b1e' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.14)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2 }]}>
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(35,83,165,0.46)', 'transparent']} style={styles.cardGlowTop} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardGlowLeft} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.22)', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.cardGlowBottom} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.06)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.55 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <TextInput
                  value={adTitle}
                  onChangeText={setAdTitle}
                  style={[styles.textInput, aC.isDark && styles.step5TitleInput, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}
                  placeholderTextColor="#8f8f8f"
                  placeholder="Enter ad title"
                />
              </View>
            </View>

            {/* Description textarea */}
            <View style={styles.inputSection}>
              <Text style={[styles.fieldLabel, aC.isDark && styles.step5FieldLabel, { color: aC.isDark ? '#b8acba' : aC.textPrimary }]}>Description</Text>
              <View style={[styles.inputWrapper, aC.isDark && styles.step5DescWrapper, { borderRadius: 16, backgroundColor: aC.isDark ? '#010b1e' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.14)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2 }]}>
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(35,83,165,0.46)', 'transparent']} style={styles.cardGlowTop} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardGlowLeft} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.22)', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.cardGlowBottom} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.05)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <TextInput
                  value={description}
                  onChangeText={t => t.length <= 500 && setDescription(t)}
                  style={[styles.descTextarea, aC.isDark && styles.step5DescInput, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}
                  placeholderTextColor="#8f8f8f"
                  placeholder="Write a detailed description..."
                  multiline
                  textAlignVertical="top"
                />
              </View>
              <Text style={[styles.charCounter, { color: aC.textSecondary }]}>{description.length}/500</Text>
            </View>

            {/* Key Features */}
            <Text style={[styles.featuresHeading, { color: aC.isDark ? '#b8acba' : '#475569' }]}>Key Features (Optional)</Text>
            <View style={[styles.chipsWrap, aC.isDark && styles.step5ChipsWrap]}>
              {features.map((f, i) => (
                <TouchableOpacity key={i} style={[styles.chip, aC.isDark && styles.step5Chip, { backgroundColor: aC.isDark ? '#010b1e' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.05, elevation: aC.isDark ? 0 : 1 }]} onPress={() => setFeatures(prev => prev.filter((_, idx) => idx !== i))}>
                  {aC.isDark ? (
                    <>
                      <LinearGradient colors={['rgba(35,83,165,0.55)', 'transparent', 'rgba(18,48,103,0.3)']} locations={[0, 0.48, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    </>
                  ) : (
                    <>
                      <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                      <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    </>
                  )}
                  <Text style={[styles.chipText, { color: aC.isDark ? '#f9fafc' : '#475569' }]}>{f}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.addChipBtn, aC.isDark && styles.step5AddChip, { backgroundColor: aC.isDark ? '#071b49' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', overflow: 'hidden' }]}
                onPress={() => setShowAddInput(v => !v)}
                activeOpacity={0.85}
              >
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['transparent', 'transparent']} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <Ionicons name="add" size={14} color={aC.isDark ? '#f9fafc' : '#475569'} />
                <Text style={[styles.addChipText, { color: aC.isDark ? '#f9fafc' : '#475569' }]}>Add more</Text>
              </TouchableOpacity>
            </View>
            {showAddInput && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' }}>
                <View style={[styles.inputWrapper, { flex: 1, height: 44, borderRadius: 12, backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.14)', overflow: 'hidden' }]}>
                  {aC.isDark ? (
                    <>
                      <LinearGradient colors={['rgba(22,64,136,0.15)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    </>
                  ) : (
                    <>
                      <LinearGradient colors={['rgba(3,42,105,0.05)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                      <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    </>
                  )}
                  <TextInput
                    value={newFeature}
                    onChangeText={setNewFeature}
                    placeholder="Custom feature (e.g. Sunroof)"
                    placeholderTextColor="#8f8f8f"
                    style={[styles.textInput, { height: 44, paddingVertical: 0, flex: 1, color: aC.isDark ? '#f9fafc' : '#010a1f' }]}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      const v = newFeature.trim();
                      if (v && !features.includes(v)) setFeatures(prev => [...prev, v]);
                      setNewFeature('');
                      setShowAddInput(false);
                    }}
                  />
                </View>
                <TouchableOpacity
                  style={{ height: 44, paddingHorizontal: 18, borderRadius: 12, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => {
                    const v = newFeature.trim();
                    if (!v) { setShowAddInput(false); return; }
                    if (!features.includes(v)) setFeatures(prev => [...prev, v]);
                    setNewFeature('');
                    setShowAddInput(false);
                  }}
                >
                  <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 13 }}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ── STEP 6: Contact Details ── */}
        {currentStep === 6 && (
          <>
            <View style={styles.headingContainer}>
              <Text style={[styles.heading, { color: aC.textPrimary }]}>Contact Details</Text>
              <Text style={[styles.subHeading, { color: aC.textSecondary }]}>Add your contact detail information.</Text>
            </View>

            {user && (
              <View style={styles.profileHint}>
                <Ionicons name="person-circle-outline" size={16} color={ORANGE} />
                <Text style={styles.profileHintTxt}>Pre-filled from your profile — you can edit below</Text>
              </View>
            )}

            <View style={styles.inputSection}>
              <Text style={[styles.fieldLabel, aC.isDark && styles.step6FieldLabel, { color: aC.isDark ? '#b8acba' : aC.textPrimary }]}>Your Name</Text>
              <View style={[styles.inputWrapper, aC.isDark && styles.step6InputWrapper, { backgroundColor: aC.isDark ? '#010b1e' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.14)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(35,83,165,0.46)', 'transparent']} style={styles.cardGlowTop} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardGlowLeft} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.22)', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.cardGlowBottom} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.06)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.55 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <TextInput value={contactName} onChangeText={setContactName} style={[styles.textInput, aC.isDark && styles.step6TextInput, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]} placeholderTextColor="#8f8f8f" placeholder="Enter your name" />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.fieldLabel, aC.isDark && styles.step6FieldLabel, { color: aC.isDark ? '#b8acba' : aC.textPrimary }]}>Phone Number</Text>
              <View style={[styles.inputWrapper, aC.isDark && styles.step6InputWrapper, { backgroundColor: aC.isDark ? '#010b1e' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.14)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(35,83,165,0.46)', 'transparent']} style={styles.cardGlowTop} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardGlowLeft} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.22)', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.cardGlowBottom} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.06)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.55 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <TextInput value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" style={[styles.textInput, aC.isDark && styles.step6TextInput, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]} placeholderTextColor="#8f8f8f" placeholder="+92 3XX XXXXXXX" />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.fieldLabel, aC.isDark && styles.step6FieldLabel, { color: aC.isDark ? '#b8acba' : aC.textPrimary }]}>Email (optional)</Text>
              <View style={[styles.inputWrapper, aC.isDark && styles.step6InputWrapper, { backgroundColor: aC.isDark ? '#010b1e' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.14)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(35,83,165,0.46)', 'transparent']} style={styles.cardGlowTop} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardGlowLeft} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.22)', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.cardGlowBottom} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.06)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.55 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <TextInput value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" style={[styles.textInput, aC.isDark && styles.step6TextInput, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]} placeholderTextColor="#8f8f8f" placeholder="your@email.com" />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.fieldLabel, aC.isDark && styles.step6FieldLabel, { color: aC.isDark ? '#b8acba' : aC.textPrimary }]}>WhatsApp</Text>
              <View style={[styles.inputWrapper, aC.isDark && styles.step6InputWrapper, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: aC.isDark ? '#010b1e' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.14)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(35,83,165,0.46)', 'transparent']} style={styles.cardGlowTop} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.18)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardGlowLeft} pointerEvents="none" />
                    <LinearGradient colors={['rgba(35,83,165,0.22)', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.cardGlowBottom} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.05)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={{ marginRight: 10 }} />
                <TextInput value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" style={[styles.whatsappInput, aC.isDark && styles.step6WhatsappInput, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]} placeholderTextColor="#8f8f8f" placeholder="+92 3XX XXXXXXX" />
                <Switch value={whatsappEnabled} onValueChange={setWhatsappEnabled} trackColor={{ false: aC.isDark ? "rgba(255,255,255,0.15)" : "rgba(3,42,105,0.15)", true: ORANGE }} thumbColor={aC.isDark && whatsappEnabled ? '#010a1f' : WHITE} style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }} />
              </View>
            </View>

            <TouchableOpacity style={styles.termsRow} onPress={() => setTermsAccepted(v => !v)} activeOpacity={0.8}>
              <View style={[styles.checkbox, { borderColor: aC.isDark ? '#b8acba' : 'rgba(3,42,105,0.22)', backgroundColor: termsAccepted ? ORANGE : (aC.isDark ? 'transparent' : '#ffffff') }, termsAccepted && styles.checkboxActive]}>
                {termsAccepted && <Ionicons name="checkmark" size={13} color={WHITE} />}
              </View>
              <Text style={[styles.termsText, { color: aC.isDark ? SUBTITLE : '#475569' }]}>
                I confirm that I have read and accept the{" "}
                <Text style={styles.termsLink}>terms and conditions</Text>
                {" "}and privacy policy.
              </Text>
            </TouchableOpacity>

            <View style={[styles.privacyCard, { backgroundColor: aC.isDark ? '#384253' : '#ffffff', borderColor: aC.isDark ? '#e4e6ec' : 'rgba(3,42,105,0.12)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
              {aC.isDark
                ? <LinearGradient colors={['#687181', '#293346']} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                : <><LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /><LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /></>}
              <Ionicons name="lock-closed-outline" size={16} color={ORANGE} style={{ marginRight: 10 }} />
              <Text style={[styles.privacyText, { color: aC.isDark ? SUBTITLE : '#475569' }]}>
                Your contact details will be visible to interested buyers only.
              </Text>
            </View>
          </>
        )}

        {/* ── STEP 7: Review & Publish ── */}
        {currentStep === 7 && (
          <>
            <View style={styles.headingContainer}>
              <Text style={[styles.heading, { color: aC.textPrimary }]}>Review & Publish</Text>
              <Text style={[styles.subHeading, { color: aC.textSecondary }]}>Review your ad before publishing</Text>
            </View>

            {/* Preview card — light white + orange shade */}
            <View style={[styles.reviewCard, { backgroundColor: aC.isDark ? '#010a1f' : '#ffffff', borderColor: aC.isDark ? '#303747' : 'rgba(3,42,105,0.12)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 12, elevation: aC.isDark ? 0 : 3 }]}>
              {!aC.isDark && <><LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /><LinearGradient colors={['transparent', 'rgba(226,103,27,0.09)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /></>}
              {/* Top: image + title + price + badge */}
              <View style={styles.reviewTop}>
                <View style={[styles.reviewImgBox, { backgroundColor: aC.isDark ? 'transparent' : '#f8f9ff' }]}>
                  {photos.length > 0
                    ? <Image source={{ uri: photos[0] }} style={styles.reviewImg} />
                    : <View style={[styles.reviewImg, styles.reviewImgPlaceholder, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.06)' }]}>
                        <Ionicons name="car-outline" size={32} color={aC.isDark ? SUBTITLE : '#94a3b8'} />
                      </View>
                  }
                </View>
                <View style={styles.reviewMeta}>
                  <Text style={[styles.reviewCarName, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]} numberOfLines={2}>
                    {[effectiveBrand, effectiveModel, variant, year].filter(Boolean).join(" ") || "Your Vehicle"}
                  </Text>
                  <Text style={styles.reviewPrice}>
                    {askingPrice ? `PKR ${Number(askingPrice.replace(/,/g,"")).toLocaleString()}` : "—"}
                  </Text>
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeTxt}>Active</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.reviewDivider, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.08)' }]} />

              {/* Details rows */}
              {[
                { label: "Location",     value: location      || "—" },
                { label: "Fuel Type",    value: effectiveFuel || "—" },
                { label: "Transmission", value: transmission  || "—" },
                { label: "Year",         value: year          || "—" },
                { label: "Color",        value: effectiveColor|| "—" },
                { label: "Mileage",      value: km ? `${Number(km).toLocaleString()} KM` : "—" },
                { label: "Photos",       value: `${photos.length} Photos` },
                { label: "Posted by",    value: contactName   || "—" },
                { label: "Ad Duration",  value: adDuration    || "—" },
                { label: "Phone Number", value: contactPhone  || "—" },
              ].map((row, i, arr) => (
                <View key={row.label} style={[styles.reviewRow, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.06)' }, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={[styles.reviewLabel, { color: aC.isDark ? SUBTITLE : '#64748b' }]}>{row.label}</Text>
                  <Text style={[styles.reviewValue, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>{row.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

      </ScrollView>

      {/* Continue Button — fixed bottom */}
      <View style={[styles.continueWrap, { backgroundColor: aC.bg }]}>
        <TouchableOpacity
          activeOpacity={0.87}
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={submitting}
        >
          <LinearGradient
            colors={["#032a69", ORANGE]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueGrad}
          >
            <Text style={styles.continueText}>
              {submitting ? "Publishing..." : currentStep === 7 ? "Publish" : "Continue"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ── Feature pill ── theme-aware (dark card: light text) */
function Feature({ icon, text, muted = false }: { icon: keyof typeof Ionicons.glyphMap; text: React.ReactNode; muted?: boolean }) {
  const aC = useAppColors();
  return (
    <View style={styles.feature}>
      <Ionicons name={icon} size={15} color={aC.isDark ? (muted ? '#d7d6dd' : ORANGE) : "#032a69"} />
      <Text style={[styles.featureText, { color: aC.isDark ? '#d7d6dd' : '#010a1f' }]}>{text}</Text>
    </View>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },

  header: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  headerIcon: { width: 35, height: 35, justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 20, fontFamily: "Poppins_500Medium" },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  /* Pagination */
  stepsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 26,
  },
  stepCircle: {
    width: 36, height: 36, minWidth: 36, borderRadius: 18, overflow: 'hidden', flexShrink: 0,
    backgroundColor: "#081e50",
    alignItems: "center", justifyContent: "center", borderWidth: 0,
  },
  stepNumber: { fontSize: 13, lineHeight: 18, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', textAlignVertical: 'center', zIndex: 2, elevation: 2 },
  activeStep: {
    backgroundColor: "#142e5d",
    borderWidth: 1.5, borderColor: "#8eafdf",
    overflow: 'hidden', shadowColor: '#83a9e5', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18, shadowRadius: 2, elevation: 1,
  },
  activeStepGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 18 },
  stepText: { color: WHITE, fontSize: 13, fontFamily: "Poppins_500Medium" },
  activeStepText: { color: WHITE },
  stepLine: { height: 1, flex: 1, backgroundColor: "#0C2B61", marginHorizontal: 0 },

  /* Heading */
  headingContainer: { marginBottom: 23 },
  heading: { color: WHITE, fontSize: 18, fontFamily: "Poppins_600SemiBold", marginBottom: 4 },
  subHeading: { color: SUBTITLE, fontSize: 14, fontFamily: "Poppins_400Regular" },

  /* Vehicle cards */
  vehicleCardBorder: { borderWidth: 1, borderRadius: 18 },
  vehicleCardBorderGlow: {
    shadowColor: '#638cd1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 2,
  },
  cardGlowTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 18 },
  cardGlowBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 12 },
  cardGlowLeft: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 10 },
  cardGlowRight: { position: 'absolute', top: 0, bottom: 0, right: 0, width: 10 },
  vehicleCard: {
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderRadius: 17, padding: 17, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    overflow: 'hidden',
  },
  selectedCard: {
    backgroundColor: BG,
    borderColor: "#5A8FD0",
    shadowColor: "#3E7ED4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  vehicleTop: { flexDirection: "row", alignItems: "flex-start" },
  vehicleIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(26,111,212,0.25)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  vehicleInfo: { flex: 1 },
  vehicleTitle: { color: WHITE, fontSize: 15, fontFamily: "Poppins_600SemiBold", marginBottom: 2 },
  vehicleDescription: { color: SUBTITLE, fontSize: 13, fontFamily: "Poppins_400Regular", lineHeight: 19 },

  radioOuter: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "#174178",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#3D6A9E",
  },
  radioOuterSelected: { borderColor: '#829fd0', backgroundColor: "#174278" },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: WHITE },

  featuresContainer: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  feature: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 7 },
  featureText: { color: SUBTITLE, fontSize: 11, fontFamily: "Poppins_400Regular", lineHeight: 16 },
  verticalLine: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.15)", marginHorizontal: 7 },

  /* Step 2 form */
  formCard: {
    backgroundColor: "rgba(3,12,40,0.6)",
    borderWidth: 1.5,
    borderColor: "rgba(91,152,213,0.5)",
    borderRadius: 20,
    padding: 20,
  },
  step2CardBorder: { borderWidth: 1, borderRadius: 20 },
  step2FormCard: { borderWidth: 0, borderRadius: 19 },
  step2GlowBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 18 },
  step2GlowLeft: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 18 },
  step2GlowRight: { position: 'absolute', top: 0, bottom: 0, right: 0, width: 18 },
  step2FieldLabel: { color: '#b8acba', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  step2OtherInput: { height: 46, borderRadius: 9, backgroundColor: '#091e4e', paddingHorizontal: 14, marginBottom: 14, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  step2Dropdown: { backgroundColor: '#071b49', borderWidth: 0, borderRadius: 8, minHeight: 46 },
  fieldRow: { marginBottom: 14 },
  typeToggleRow:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  typeBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: 'rgba(3,12,40,0.4)' },
  typeBtnActive:    { borderColor: ORANGE, backgroundColor: 'rgba(226,103,27,0.2)' },
  typeBtnTxt:       { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#8f8f8f' },
  typeBtnTxtActive: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  fieldLabel: {
    color: SUBTITLE,
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    marginBottom: 8,
    marginLeft: 4,
  },
  dropdown: {
    backgroundColor: "rgba(6,27,74,1)",
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.5)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    color: WHITE,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  dropdownText: { color: WHITE, fontSize: 15, fontFamily: "Poppins_400Regular", flex: 1 },

  /* Step 3 */
  step3FieldLabel: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  step3InputWrapper: { borderRadius: 24 },
  step3TextInput: { minHeight: 43, paddingHorizontal: 20, fontSize: 14 },
  inputSection: { marginBottom: 16 },
  inputWrapper: {
    backgroundColor: "rgba(3,12,40,0.6)",
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.5)",
    borderRadius: 20,
    overflow: "hidden",
  },
  textInput: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    color: WHITE,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  tipsCard: {
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(3,12,40,0.6)",
    overflow: "hidden",
  },
  priceTipBorder: { marginTop: 6, borderRadius: 24, padding: 1.2 },
  priceTipBorderOff: { borderRadius: 16 },
  priceTipInner: { marginTop: 0, borderWidth: 0, borderRadius: 23, paddingBottom: 4 },
  priceTipsTitle: { fontSize: 14, fontFamily: 'Poppins_500Medium', paddingTop: 16, marginBottom: 2 },
  priceTipsText: { fontSize: 13, lineHeight: 20 },
  priceTipsDivider: { marginTop: 8, backgroundColor: 'rgba(186,172,182,0.45)' },
  priceTipsRange: { paddingTop: 10, paddingBottom: 12 },
  priceTipsRangeText: { fontSize: 16, fontFamily: 'Poppins_500Medium' },
  tipsTitle: {
    color: WHITE,
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 5,
  },
  tipsText: {
    color: SUBTITLE,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    lineHeight: 19,
    paddingHorizontal: 16,
  },
  tipsDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 10,
    marginHorizontal: 16,
  },
  tipsRange: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(226,103,27,0.07)",
  },
  tipsRangeText: {
    color: WHITE,
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
  },

  /* Step 4 */
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoWrapper: {
    width: (width - 52) / 2,
    height: 115,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(3,12,40,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  photo: { width: "100%", height: "100%", resizeMode: "cover" },
  deleteBtn: {
    position: "absolute",
    top: 7, right: 7,
    width: 24, height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
  },
  addPhotoBtn: {
    width: (width - 52) / 2,
    height: 115,
    borderRadius: 14,
    backgroundColor: "rgba(3,12,40,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  cameraCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  addPhotoText: { color: SUBTITLE, fontSize: 13, fontFamily: "Poppins_400Regular" },
  photoCounter: {
    color: SUBTITLE,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    textAlign: "right",
    marginTop: 10,
  },
  tipCard: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(3,12,40,0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 0,
  },
  tipText: {
    color: SUBTITLE,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    flex: 1,
    lineHeight: 19,
  },

  /* Step 5 */
  step5FieldLabel: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  step5TitleWrapper: { borderRadius: 26 },
  step5TitleInput: { minHeight: 44, fontSize: 14, paddingHorizontal: 20 },
  step5DescWrapper: { borderRadius: 16 },
  step5DescInput: { minHeight: 116, paddingTop: 14, paddingBottom: 14, fontSize: 14, lineHeight: 20 },
  step5Chip: { borderRadius: 28, paddingHorizontal: 12, paddingVertical: 5 },
  step5AddChip: { borderRadius: 28, paddingHorizontal: 14, paddingVertical: 6 },
  step5ChipsWrap: { gap: 12 },
  descTextarea: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 36,
    color: WHITE,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    minHeight: 140,
  },
  charCounter: {
    color: SUBTITLE,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    textAlign: "right",
    marginTop: 6,
  },
  featuresHeading: {
    color: SUBTITLE,
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 12,
    marginTop: 4,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "rgba(3,12,40,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipText: {
    color: SUBTITLE,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  addChipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(3,12,40,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addChipText: {
    color: SUBTITLE,
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },

  /* Step 6 */
  step6FieldLabel: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  step6InputWrapper: { borderRadius: 26 },
  step6TextInput: { minHeight: 44, fontSize: 14, paddingHorizontal: 20 },
  step6WhatsappInput: { minHeight: 44, fontSize: 14 },
  whatsappRow: {
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: "rgba(91,152,213,0.5)",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#3a7fd4",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  whatsappInput: {
    flex: 1,
    color: WHITE,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    paddingVertical: 8,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  termsText: {
    flex: 1,
    color: SUBTITLE,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    lineHeight: 20,
  },
  termsLink: {
    color: ORANGE,
    fontFamily: "Poppins_500Medium",
  },
  profileHint: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(226,103,27,0.08)",
    borderWidth: 1, borderColor: "rgba(226,103,27,0.25)",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 16,
  },
  profileHintTxt: {
    flex: 1, color: SUBTITLE, fontSize: 12, fontFamily: "Poppins_400Regular",
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  privacyText: {
    flex: 1,
    color: SUBTITLE,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    lineHeight: 19,
  },

  /* Step 7 */
  reviewCard: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 17,
    overflow: "hidden",
  },
  reviewTop: {
    flexDirection: "row",
    padding: 8,
    paddingTop: 9,
    gap: 12,
  },
  reviewImgBox: {
    width: "49%",
    height: 115,
    borderRadius: 12,
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "transparent",
  },
  reviewImg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  reviewImgPlaceholder: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewMeta: { flex: 1, justifyContent: "center", gap: 6 },
  reviewCarName: {
    color: WHITE,
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    lineHeight: 20,
  },
  reviewPrice: {
    color: ORANGE,
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,104,72,0.22)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 0,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22c55e" },
  activeTxt: { color: "#22c55e", fontSize: 12, fontFamily: "Poppins_500Medium" },
  reviewDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginHorizontal: 8 },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  reviewLabel: { color: SUBTITLE, fontSize: 14, fontFamily: "Poppins_400Regular" },
  reviewValue: { color: WHITE, fontSize: 14, fontFamily: "Poppins_500Medium" },

  /* Continue */
  continueWrap: { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 10, backgroundColor: BG },
  continueButton: { borderRadius: 32, overflow: "hidden" },
  continueGrad: { height: 52, alignItems: "center", justifyContent: "center" },
  continueText: { color: WHITE, fontSize: 16, fontFamily: "Poppins_600SemiBold" },
});
