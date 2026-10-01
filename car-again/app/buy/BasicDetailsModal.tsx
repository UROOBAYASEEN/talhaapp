import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAppColors } from "@/constants/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  brandName?: string;
  dealerId?: string;
  category?: string;
  onSearch?: (data: any) => void;
};

const cities = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Quetta",
  "Faisalabad", "Multan", "Hyderabad", "Gujranwala", "Sialkot", "Bahawalpur",
  "Sargodha", "Sukkur", "Larkana", "Sheikhupura", "Rahim Yar Khan", "Jhang",
  "Gujrat", "Mardan", "Abbottabad", "Mirpur", "Muzaffarabad", "Nawabshah",
  "Sahiwal", "Okara", "Mingora", "Dera Ghazi Khan", "Chiniot", "Kamoke",
];

const variants = [
  "1.0 MT", "1.0 CVT", "1.2 MT", "1.2 CVT", "1.3 MT", "1.3 CVT",
  "1.5 MT", "1.5 CVT", "1.5 Turbo", "1.6 MT", "1.6 CVT",
  "1.8 MT", "1.8 CVT", "2.0 MT", "2.0 CVT", "2.4 AT",
  "2.7 V6", "3.5 V6", "4.0 V8",
  "Standard", "GL", "GL-8", "GLi", "XLi", "VVTi", "Grande",
  "Aspire", "Aspire CVT", "Aspire Turbo",
  "Alpha", "Delta", "Sigma",
  "S", "SE", "Sport", "Sportline",
  "AWD", "4WD", "FWD",
  "Prosmatic", "AGS",
  "EV", "Hybrid", "PHEV",
];

const years = Array.from({ length: 27 }, (_, i) => String(2026 - i));

const colors = [
  "White", "Pearl White", "Solid White",
  "Black", "Jet Black", "Midnight Black",
  "Silver", "Metallic Silver",
  "Grey", "Graphite Grey", "Magnetic Grey",
  "Red", "Maroon", "Crimson Red",
  "Blue", "Navy Blue", "Sky Blue", "Aqua Blue",
  "Beige", "Champagne", "Bronze",
  "Green", "Olive Green",
  "Orange", "Golden", "Yellow",
  "Brown",
];

const sellerTypes = ["All (Dealership + Individual)", "Dealership", "Individual"];

export default function BasicDetailsModal({ visible, onClose, brandName, dealerId, category = 'car', onSearch }: Props) {
  const { token } = useAuth();
  const aC = useAppColors();

  const [city,         setCity]         = useState("Karachi");
  const [car,          setCar]          = useState("");
  const [variant,      setVariant]      = useState(variants[0]);
  const [year,         setYear]         = useState("2026");
  const [color,        setColor]        = useState("");
  const [sellerType,   setSellerType]   = useState(sellerTypes[0]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [cityQuery, setCityQuery] = useState("");

  const [carOptions,  setCarOptions]  = useState<string[]>([]);
  const [carLoading,  setCarLoading]  = useState(false);

  // Fetch available car/bike names for this dealer when modal opens
  useEffect(() => {
    if (!visible) return;
    fetchCars();
  }, [visible, dealerId, category]);

  async function fetchCars() {
    setCarLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100", category });
      if (dealerId) params.set("seller_id", dealerId);
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/vehicles?${params}`, { headers });
      if (res.ok) {
        const d = await res.json();
        const items: any[] = d.items || [];
        const names = Array.from(new Set(
          items.map((v: any) => v.title || `${v.make || ""} ${v.model || ""}`.trim()).filter(Boolean)
        )).sort() as string[];
        setCarOptions(names);
        if (names.length > 0 && !car) setCar(names[0]);
      }
    } catch {}
    finally { setCarLoading(false); }
  }

  function renderDropdown(
    label: string,
    value: string,
    options: string[],
    field: string,
    setValue: (v: string) => void,
    loading?: boolean,
  ) {
    const isOpen  = openDropdown === field;
    const isOther = value === "Other";
    const isCity  = field === "city";
    const visibleOptions = isCity && cityQuery.trim()
      ? options.filter(o => o.toLowerCase().includes(cityQuery.trim().toLowerCase()))
      : options;

    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: aC.isDark ? '#baacb6' : '#475569' }]}>{label}</Text>
        <Pressable
          style={[styles.dropdown, {
            backgroundColor: aC.isDark ? '#061124' : '#ffffff',
            borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)',
            shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)',
            shadowOpacity: aC.isDark ? 0 : 0.06,
            elevation: aC.isDark ? 0 : 2,
            overflow: 'hidden'
          }]}
          onPress={() => setOpenDropdown(isOpen ? null : field)}
        >
          {aC.isDark ? (
            <>
              <LinearGradient
                colors={['#163565', '#061124', '#061124', '#0D2146']}
                locations={[0, 0.24, 0.76, 1]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['#24518F8F', '#16356552', 'transparent', 'transparent', '#16356552', '#24518F8F']}
                locations={[0, 0.025, 0.075, 0.925, 0.975, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]}
                pointerEvents="none"
              />
            </>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            </>
          )}
          <Text style={[styles.dropdownText, { color: !value ? '#8f8f8f' : (aC.isDark ? '#f9fafc' : '#010a1f') }, !value && styles.placeholder]}>
            {isOther && customValues[field] ? customValues[field] : (value || "Select")}
          </Text>
          {loading
            ? <ActivityIndicator size="small" color="#e2671b" style={{ marginRight: 16 }} />
            : <Text style={[styles.arrow, { color: aC.isDark ? '#f9fafc' : '#010a1f' }, isOpen && styles.arrowUp]}>⌄</Text>
          }
        </Pressable>

        {isOther && (
          <TextInput
            style={[styles.customInput, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)', color: aC.isDark ? '#f9fafc' : '#010a1f', overflow: 'hidden' }]}
            placeholder={`Enter ${label.toLowerCase()}...`}
            placeholderTextColor="#8f8f8f"
            value={customValues[field] || ""}
            onChangeText={t => setCustomValues(p => ({ ...p, [field]: t }))}
          />
        )}

        {isOpen && (
          <View style={[styles.optionsContainer, { backgroundColor: aC.isDark ? '#061b4a' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 4 }]}>
            {isCity && (
              <View style={[styles.citySearchWrap, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.06)', backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#f8fafc' }]}>
                <Ionicons name="search-outline" size={16} color="#8f8f8f" />
                <TextInput
                  style={[styles.citySearchInput, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}
                  placeholder="Type city name..."
                  placeholderTextColor="#8f8f8f"
                  value={cityQuery}
                  onChangeText={setCityQuery}
                />
                {cityQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setCityQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#8f8f8f" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {loading ? (
              <ActivityIndicator color="#e2671b" style={{ paddingVertical: 16 }} />
            ) : visibleOptions.length === 0 && !(isCity && cityQuery.trim()) ? (
              <Text style={{ color: "#8f8f8f", textAlign: "center", padding: 16, fontFamily: "Poppins_400Regular", fontSize: 13 }}>
                No options available
              </Text>
            ) : (
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {isCity && cityQuery.trim() && !options.some(o => o.toLowerCase() === cityQuery.trim().toLowerCase()) && (
                  <TouchableOpacity
                    style={[styles.option, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.06)' }]}
                    onPress={() => { setValue(cityQuery.trim()); setCityQuery(''); setOpenDropdown(null); }}
                  >
                    <Text style={[styles.optionText, { color: '#e2671b' }]}>Use "{cityQuery.trim()}"</Text>
                  </TouchableOpacity>
                )}
                {[...visibleOptions, "Other"].map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.option, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.06)' }]}
                    onPress={() => { setValue(opt); setCityQuery(''); setOpenDropdown(null); }}
                  >
                    <Text style={[styles.optionText, { color: opt === "Other" ? "#e2671b" : (aC.isDark ? '#f9fafc' : '#010a1f') }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>
    );
  }

  function resolveVal(field: string, val: string) {
    return val === "Other" ? (customValues[field] || "") : val;
  }

  function handleSearch() {
    onSearch?.({
      city:       resolveVal("city",       city),
      car:        resolveVal("car",        car),
      variant:    resolveVal("variant",    variant),
      year:       resolveVal("year",       year),
      color:      resolveVal("color",      color),
      sellerType: resolveVal("sellerType", sellerType),
    });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: aC.isDark ? '#010a1f' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 8 }]}>
          {!aC.isDark && <><LinearGradient colors={['rgba(3,42,105,0.03)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /><LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.7 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /></>}

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.08)' }]}>
            <Text style={[styles.title, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Basic Details</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', borderColor: aC.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(3,42,105,0.12)' }]}>
              <Ionicons name="close" size={18} color={aC.isDark ? '#baacb6' : '#475569'} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {renderDropdown("City",        city,       cities,      "city",       setCity)}
            {renderDropdown(category === 'bike' ? "Bike" : "Car", car, carOptions, "car", setCar, carLoading)}
            {renderDropdown("Variant",     variant,    variants,    "variant",    setVariant)}
            {renderDropdown("Year",        year,       years,       "year",       setYear)}
            {renderDropdown("Color",       color,      colors,      "color",      setColor)}
            {renderDropdown("Seller Type", sellerType, sellerTypes, "sellerType", setSellerType)}

            {/* Search Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSearch}
              style={styles.searchButtonWrapper}
            >
              <LinearGradient
                colors={["#032a69", "#283A68", "#e2671b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.searchButton}
              >
                <Text style={styles.searchText}>Search Vehicle</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 38 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },

  modal: {
    width: "100%",
    maxHeight: "92%",
    backgroundColor: "#010a1f",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 20,
    paddingTop: 20,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },

  title: {
    color: "#f9fafc",
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },

  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  fieldContainer: {
    marginBottom: 14,
    position: "relative",
  },

  label: {
    color: "#baacb6",
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    marginBottom: 8,
  },

  dropdown: {
    height: 50,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#829fd0",
    backgroundColor: "#061124",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownText: {
    color: "#f9fafc",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },

  placeholder: { color: "#8f8f8f" },

  customInput: {
    marginTop: 8,
    height: 48,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.4)",
    backgroundColor: "rgba(3,12,40,0.6)",
    paddingHorizontal: 20,
    color: "#f9fafc",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },

  arrow: {
    color: "#f9fafc",
    fontSize: 22,
    lineHeight: 20,
    marginTop: -4,
  },

  arrowUp: { transform: [{ rotate: "180deg" }] },

  optionsContainer: {
    marginTop: 6,
    backgroundColor: "#061b4a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: 240,
  },

  option: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  optionText: {
    color: "#f9fafc",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },

  citySearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },

  citySearchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    padding: 0,
  },

  searchButtonWrapper: {
    marginTop: 24,
    borderRadius: 30,
    overflow: "hidden",
  },

  searchButton: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },

  searchText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
});
