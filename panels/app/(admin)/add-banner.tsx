import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, Modal, Pressable, Platform, FlatList, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { ChevronLeft, Save, Upload, ChevronDown, Check, Plus, X, Calendar, ChevronRight } from "lucide-react-native";
import { API_BASE } from "@/constants/api";
import { useAppColors } from '@/constants/theme';
import { SavedCardEffect } from "@/components/shared/FigmaEffects";
import InnerGlow from "@/components/shared/InnerGlow";
import { ActionPanelBg, GlowPublishButton, GlowDraftButton } from "@/components/shared/ActionFooterGlow";

const WHITE = "#F4F5F7";
const ORANGE = "#FF6B00";

const BANNER_TYPES = ["Home Screen Top", "Home Screen Bottom", "Search Results", "Listing Detail"];
const PARTNERS = ["Autowisor (Default)", "PakWheels", "OLX Autos"];
const USER_TYPES = ["All Users", "Buyers", "Sellers"];

const ALL_CITIES = [
  "All Cities", "Karachi", "Lahore", "Islamabad", "Rawalpindi",
  "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot",
  "Gujranwala", "Hyderabad", "Bahawalpur", "Sargodha", "Abbottabad",
];

export default function AddBannerScreen() {
  const router = useRouter();
  const aC = useAppColors();

  const [bannerType, setBannerType] = useState("Home Screen Top");
  const [partner, setPartner] = useState("Autowisor (Default)");
  const [userTypes, setUserTypes] = useState(["All Users"]);
  const [cities, setCities] = useState(["All Cities", "Karachi", "Lahore", "Islamabad"]);
  const [agreed, setAgreed] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [campaign, setCampaign] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<"start" | "end" | null>(null);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerDay, setPickerDay] = useState(new Date().getDate());
  const [pickerHour, setPickerHour] = useState(new Date().getHours());
  const [pickerMin, setPickerMin] = useState(0);
  const [cityModal, setCityModal] = useState(false);

  const toggleUserType = (t: string) =>
    setUserTypes(p => p.includes(t) ? p.filter(i => i !== t) : [...p, t]);

  const toggleCity = (c: string) =>
    setCities(p => p.includes(c) ? p.filter(i => i !== c) : [...p, c]);

  const removeCity = (c: string) => setCities(p => p.filter(i => i !== c));

  const formatDate = (d: Date | null) =>
    d ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}  ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "";

  const openPicker = (type: "start" | "end") => {
    const ref = type === "start" ? startDate : endDate;
    const d = ref ?? new Date();
    setPickerYear(d.getFullYear());
    setPickerMonth(d.getMonth());
    setPickerDay(d.getDate());
    setPickerHour(d.getHours());
    setPickerMin(d.getMinutes());
    setShowDatePicker(type);
  };

  const confirmPicker = () => {
    const d = new Date(pickerYear, pickerMonth, pickerDay, pickerHour, pickerMin);
    if (showDatePicker === "start") setStartDate(d);
    else setEndDate(d);
    setShowDatePicker(null);
  };

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const mins = Array.from({ length: 12 }, (_, i) => i * 5);

  const [publishing, setPublishing] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled) setBannerImage(result.assets[0].uri);
  };

  const publishBanner = async () => {
    if (!title.trim()) { Alert.alert("Missing", "Banner title is required."); return; }
    if (!agreed) { Alert.alert("Missing", "Please accept terms first."); return; }

    try {
      setPublishing(true);
      const token = await SecureStore.getItemAsync("access_token");

      let imageUrl: string | null = null;

      if (bannerImage) {
        const form = new FormData();
        form.append("file", { uri: bannerImage, name: "banner.jpg", type: "image/jpeg" } as any);
        const upRes = await fetch(`${API_BASE}/upload/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (upRes.ok) {
          const upData = await upRes.json();
          imageUrl = upData.url ?? upData.file_url ?? null;
        }
      }

      const body = {
        title: title.trim(),
        description: description.trim() || null,
        campaign_name: campaign.trim() || null,
        banner_image_url: imageUrl,
        display_location: bannerType,
        partner: partner,
        user_type: userTypes[0] ?? "All Users",
        cities: cities,
        boost_weeks: 6,
        start_date: startDate ? startDate.toISOString() : null,
        end_date: endDate ? endDate.toISOString() : null,
      };

      const res = await fetch(`${API_BASE}/admin/banners`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Failed to publish");
      }

      Alert.alert("Success", "Banner published successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Something went wrong.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: aC.bg }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>

        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={26} color={aC.isDark ? "rgba(255,255,255,0.9)" : "#010a1f"} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Add Banner</Text>
          <TouchableOpacity style={styles.saveBtn}>
            <Save size={20} color={ORANGE} strokeWidth={1.8} />
            <Text style={styles.saveTxt}>Save{"\n"}Draft</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* UPLOAD BANNER */}
          <TouchableOpacity style={[styles.uploadBox, { backgroundColor: aC.isDark ? "#040E24" : "#ffffff", borderColor: aC.isDark ? "#2A3350" : "rgba(3,42,105,0.15)" }]} onPress={pickImage} activeOpacity={0.8}>
            {bannerImage ? (
              <Image source={{ uri: bannerImage }} style={styles.bannerPreview} resizeMode="cover" />
            ) : (
              <>
                <Upload size={26} color={ORANGE} strokeWidth={1.8} />
                <Text style={[styles.uploadTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>+ Upload Banner Image</Text>
                <Text style={[styles.uploadSub, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>Tap to browse. Recommended 16:9 ratio.</Text>
              </>
            )}
          </TouchableOpacity>

          {/* FIELDS */}
          <Field label="Banner Title">
            <InputBox placeholder="e.g. Summer Auto Sale" value={title} onChangeText={setTitle} />
          </Field>

          <Field label="Short Description">
            <InputBox placeholder="Catchy description for the banner..." value={description} onChangeText={setDescription} multiline />
          </Field>

          <Field label="Campaign Name (Optional)">
            <InputBox placeholder="Internal campaign identifier" value={campaign} onChangeText={setCampaign} />
          </Field>

          <Field label="Banner Type">
            <DropdownField
              value={bannerType} options={BANNER_TYPES}
              open={dropdownOpen === "bannerType"}
              onOpen={() => setDropdownOpen(dropdownOpen === "bannerType" ? null : "bannerType")}
              onSelect={(v) => { setBannerType(v); setDropdownOpen(null); }}
            />
          </Field>

          <Field label="Partner Selection">
            <DropdownField
              value={partner} options={PARTNERS}
              open={dropdownOpen === "partner"}
              onOpen={() => setDropdownOpen(dropdownOpen === "partner" ? null : "partner")}
              onSelect={(v) => { setPartner(v); setDropdownOpen(null); }}
            />
          </Field>

          {/* SCHEDULE */}
          <Text style={[styles.sectionLabel, { color: aC.isDark ? WHITE : '#010a1f' }]}>Schedule Banner</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => openPicker("start")} activeOpacity={0.8}>
              <Text style={[styles.dateLabel, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>Start Date & Time</Text>
              <View style={[styles.inputWrap, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)" }, aC.isDark && { borderWidth: 0, backgroundColor: "#061227" }]}>
                {aC.isDark ? (
                  <InputGlow />
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <Text style={[styles.input, { color: startDate ? (aC.isDark ? WHITE : '#010a1f') : (aC.isDark ? "#6B7A99" : "#94a3b8"), lineHeight: 47, paddingVertical: 0 }]}>
                  {startDate ? formatDate(startDate) : "Select date"}
                </Text>
                <Calendar size={16} color={aC.isDark ? "#6B7A99" : "#475569"} strokeWidth={1.8} style={{ marginRight: 14 }} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => openPicker("end")} activeOpacity={0.8}>
              <Text style={[styles.dateLabel, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>End Date & Time</Text>
              <View style={[styles.inputWrap, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)" }, aC.isDark && { borderWidth: 0, backgroundColor: "#061227" }]}>
                {aC.isDark ? (
                  <InputGlow />
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <Text style={[styles.input, { color: endDate ? (aC.isDark ? WHITE : '#010a1f') : (aC.isDark ? "#6B7A99" : "#94a3b8"), lineHeight: 47, paddingVertical: 0 }]}>
                  {endDate ? formatDate(endDate) : "Select date"}
                </Text>
                <Calendar size={16} color={aC.isDark ? "#6B7A99" : "#475569"} strokeWidth={1.8} style={{ marginRight: 14 }} />
              </View>
            </TouchableOpacity>
          </View>

          {/* DATE PICKER MODAL */}
          <Modal transparent visible={!!showDatePicker} animationType="slide" onRequestClose={() => setShowDatePicker(null)}>
            <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(null)}>
              <Pressable style={[styles.datePickerSheet, { backgroundColor: aC.isDark ? '#0D1E3F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.15)' : 'rgba(3,42,105,0.12)' }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>{showDatePicker === "start" ? "Start" : "End"} Date & Time</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                    <X size={20} color={aC.isDark ? "#A5ACBD" : "#475569"} strokeWidth={1.8} />
                  </TouchableOpacity>
                </View>

                <View style={styles.pickerRow}>
                  <PickerCol label="Month" items={MONTHS} selected={pickerMonth} onSelect={setPickerMonth} />
                  <PickerCol label="Day" items={days} selected={pickerDay - 1} onSelect={(i) => setPickerDay(days[i])} />
                  <PickerCol label="Year" items={years} selected={years.indexOf(pickerYear)} onSelect={(i) => setPickerYear(years[i])} />
                  <PickerCol label="Hour" items={hours.map(h => String(h).padStart(2, "0"))} selected={pickerHour} onSelect={setPickerHour} />
                  <PickerCol label="Min" items={mins.map(m => String(m).padStart(2, "0"))} selected={mins.indexOf(pickerMin)} onSelect={(i) => setPickerMin(mins[i])} />
                </View>

                <TouchableOpacity style={styles.modalDone} onPress={confirmPicker}>
                  <Text style={styles.modalDoneTxt}>Confirm</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>

          {/* AUDIENCE TARGETING */}
          <Text style={[styles.sectionLabel, { color: aC.isDark ? WHITE : '#010a1f' }]}>Audience Targeting</Text>
          <Text style={[styles.subLabel, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>User Type</Text>
          <View style={styles.pillRow}>
            {USER_TYPES.map(opt => (
              <Pill key={opt} label={opt} active={userTypes.includes(opt)} onPress={() => toggleUserType(opt)} />
            ))}
          </View>

          <Text style={[styles.subLabel, { marginTop: 14, color: aC.isDark ? "#6B7A99" : "#475569" }]}>Cities</Text>
          <View style={styles.pillRow}>
            {cities.map(opt => (
              <View key={opt} style={[styles.cityChip, { backgroundColor: 'rgba(226,103,27,0.15)', borderColor: '#E2671B' }]}>
                <Text style={[styles.pillTxt, { color: ORANGE }]}>{opt}</Text>
                <TouchableOpacity onPress={() => removeCity(opt)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <X size={11} color={ORANGE} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={[styles.addCityChip, { backgroundColor: aC.isDark ? "#071734" : "#ffffff", borderColor: aC.isDark ? "#5C6F92" : "rgba(3,42,105,0.12)" }]} onPress={() => setCityModal(true)}>
              <Plus size={13} color={aC.isDark ? "#D7DCE8" : "#475569"} strokeWidth={1.7} />
              <Text style={[styles.addCityTxt, { color: aC.isDark ? "#E0E3EB" : "#475569" }]}>Add City</Text>
            </TouchableOpacity>
          </View>

          {/* CITY MODAL */}
          <Modal transparent visible={cityModal} animationType="slide" onRequestClose={() => setCityModal(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setCityModal(false)}>
              <Pressable style={[styles.modalSheet, { backgroundColor: aC.isDark ? '#0D1E3F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.15)' : 'rgba(3,42,105,0.12)' }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Select Cities</Text>
                  <TouchableOpacity onPress={() => setCityModal(false)}>
                    <X size={20} color={aC.isDark ? "#A5ACBD" : "#475569"} strokeWidth={1.8} />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {ALL_CITIES.map(c => {
                    const sel = cities.includes(c);
                    return (
                      <TouchableOpacity key={c} style={[styles.modalItem, { borderBottomColor: aC.isDark ? "rgba(255,255,255,0.06)" : "rgba(3,42,105,0.06)" }]} onPress={() => toggleCity(c)}>
                        <Text style={[styles.modalItemTxt, { color: sel ? ORANGE : (aC.isDark ? "#C8D3E8" : "#475569") }]}>{c}</Text>
                        {sel && <Check size={16} color={ORANGE} strokeWidth={2} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity style={styles.modalDone} onPress={() => setCityModal(false)}>
                  <Text style={styles.modalDoneTxt}>Done</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>

          {/* TERMS */}
          <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
            <View style={[styles.checkbox, { borderColor: agreed ? ORANGE : (aC.isDark ? "#3A4A6B" : "rgba(3,42,105,0.15)"), backgroundColor: agreed ? ORANGE : 'transparent' }]}>
              {agreed && <Check size={11} color="#fff" strokeWidth={2.5} />}
            </View>
            <Text style={[styles.termsText, { color: aC.isDark ? "#8E98B0" : "#475569" }]}>
              I confirm that I have read and accept the{" "}
              <Text style={{ color: ORANGE }}>terms and conditions</Text> and privacy policy.
            </Text>
          </TouchableOpacity>

          <View style={{ height: 160 }} />
        </ScrollView>

        {/* FIXED FOOTER */}
        <View style={[styles.fixedFooter, aC.isDark && { paddingHorizontal: 32, paddingBottom: 22, borderTopWidth: 0 }, { overflow: "hidden", backgroundColor: aC.isDark ? "#0A1838" : "#ffffff", borderTopColor: aC.isDark ? "rgba(130,165,213,0.35)" : "rgba(3,42,105,0.08)" }]}>
          {aC.isDark ? (
            <>
              <ActionPanelBg />
            </>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            </>
          )}
          {aC.isDark ? (
            <>
              <GlowPublishButton title="Publish Banner" loading={publishing} disabled={!agreed} style={{ marginTop: 12, marginBottom: 11 }} onPress={publishBanner} />
              <GlowDraftButton title="Save as Draft" />
            </>
          ) : (<>
          <TouchableOpacity
            activeOpacity={agreed && !publishing ? 0.85 : 1}
            disabled={!agreed || publishing}
            style={{ opacity: agreed && !publishing ? 1 : 0.5 }}
            onPress={publishBanner}
          >
            <LinearGradient
              colors={["#032A69", "#E2671B"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.publishBtn, { overflow: "hidden" }]}
            >
              <LinearGradient colors={["rgba(22,64,136,0.4)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              {publishing
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.publishTxt}>Publish Banner</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.draftBtn, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)" }]} activeOpacity={0.8}>
            {aC.isDark ? (
              <SavedCardEffect band={12} />
            ) : (
              <>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              </>
            )}
            <Text style={[styles.draftTxt, { color: aC.isDark ? WHITE : '#010a1f' }]}>Save as Draft</Text>
          </TouchableOpacity>
          </>)}
        </View>

      </SafeAreaView>
    </View>
  );
}

/* ── Picker Column ── */
function PickerCol({ label, items, selected, onSelect }: {
  label: string; items: (string | number)[]; selected: number; onSelect: (i: number) => void;
}) {
  const aC = useAppColors();
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={[styles.pickerLabel, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>{label}</Text>
      <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
        {items.map((item, i) => (
          <TouchableOpacity key={i} onPress={() => onSelect(i)} style={styles.pickerItem}>
            <Text style={[styles.pickerItemTxt, { color: i === selected ? ORANGE : (aC.isDark ? "#6B7A99" : "#475569") }, i === selected && styles.pickerItemActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

/* ── Sub Components ── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const aC = useAppColors();
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={[styles.fieldLabel, { color: aC.isDark ? WHITE : '#010a1f' }]}>{label}</Text>
      {children}
    </View>
  );
}

// Figma input effect (dark): blue glow from the rounded edges into a dark centre + light-blue border
function InputGlow({ radius = 23.5 }: { radius?: number }) {
  return <InnerGlow radius={radius} fill="#061227" glowColor="#18386E" blur={14} borderColors={["#6F8CBC", "#7E92B3"]} borderWidth={1} />;
}

function InputBox({ placeholder, value, onChangeText, multiline }: {
  placeholder: string; value: string;
  onChangeText: (t: string) => void; multiline?: boolean;
}) {
  const aC = useAppColors();
  return (
    <View style={[styles.inputWrap, multiline && { height: 100, alignItems: "flex-start" }, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1 },
      aC.isDark && (multiline
        ? { borderRadius: 18, shadowColor: '#638ed0', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 2 }
        : { borderWidth: 0, backgroundColor: "#061227" })]}>
      {aC.isDark ? (
        multiline ? <SavedCardEffect /> : <InputGlow />
      ) : (
        <>
          <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      )}
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={aC.isDark ? "#6B7A99" : "#94a3b8"} style={[styles.input, { color: aC.isDark ? WHITE : '#010a1f' }, multiline && { textAlignVertical: "top", paddingTop: 12, height: 90 }]}
        multiline={multiline} selectionColor={ORANGE}
      />
    </View>
  );
}

function DropdownField({ value, options, open, onOpen, onSelect }: {
  value: string; options: string[]; open: boolean;
  onOpen: () => void; onSelect: (v: string) => void;
}) {
  const aC = useAppColors();
  return (
    <View>
      <TouchableOpacity style={[styles.inputWrap, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)" }, aC.isDark && { borderWidth: 0, backgroundColor: "#061227" }]} onPress={onOpen} activeOpacity={0.8}>
        {aC.isDark ? (
          <InputGlow />
        ) : (
          <>
            <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        )}
        <Text style={[styles.input, { color: aC.isDark ? WHITE : '#010a1f', paddingVertical: 0, lineHeight: 47 }]}>{value}</Text>
        <ChevronDown size={18} color={aC.isDark ? "#6B7A99" : "#475569"} strokeWidth={1.8} style={{ marginRight: 16 }} />
      </TouchableOpacity>
      {open && (
        <View style={[styles.dropMenu, { backgroundColor: aC.isDark ? "#0D1E3F" : "#ffffff", borderColor: aC.isDark ? "rgba(80,123,182,0.4)" : "rgba(3,42,105,0.12)" }]}>
          {options.map(opt => (
            <TouchableOpacity key={opt} style={[styles.dropItem, { borderBottomColor: aC.isDark ? "rgba(255,255,255,0.05)" : "rgba(3,42,105,0.06)" }]} onPress={() => onSelect(opt)}>
              <Text style={[styles.dropItemTxt, { color: opt === value ? ORANGE : (aC.isDark ? "#C8D3E8" : "#475569") }]}>{opt}</Text>
              {opt === value && <Check size={14} color={ORANGE} strokeWidth={2} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const aC = useAppColors();
  return (
    <TouchableOpacity
      onPress={onPress} activeOpacity={0.8}
      style={[styles.pill, { backgroundColor: aC.isDark ? (active ? "#3A2420" : "#0B2358") : (active ? 'rgba(226,103,27,0.08)' : '#ffffff'), borderColor: aC.isDark ? (active ? ORANGE : "#7F98C4") : (active ? ORANGE : "rgba(3,42,105,0.12)") }, active && styles.pillActive]}
    >
      <Text style={[styles.pillTxt, { color: active ? ORANGE : (aC.isDark ? "#C0C8DC" : "#475569") }, active && styles.pillTxtActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#010A1F" },
  safeArea: { flex: 1, backgroundColor: "#010A1F" },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 36, height: 44, justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 17, fontFamily: "Poppins_600SemiBold" },
  saveBtn: { alignItems: "center", gap: 2 },
  saveTxt: { color: ORANGE, fontSize: 9, fontFamily: "Poppins_500Medium", textAlign: "center", lineHeight: 12 },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  uploadBox: {
    borderWidth: 1.5, borderStyle: "dashed", borderColor: "#2A3350",
    borderRadius: 20, paddingVertical: 32, alignItems: "center",
    justifyContent: "center", marginBottom: 22, gap: 8, backgroundColor: "#040E24",
  },
  bannerPreview: { width: "100%", height: 160, borderRadius: 16 },
  uploadTitle: { color: WHITE, fontSize: 15, fontFamily: "Poppins_600SemiBold" },
  uploadSub: { color: "#6B7A99", fontSize: 11, fontFamily: "Poppins_400Regular", textAlign: "center" },

  fieldLabel: { color: WHITE, fontSize: 13, fontFamily: "Poppins_500Medium", marginBottom: 10 },

  inputWrap: {
    height: 47, borderRadius: 25, borderWidth: 1,
    borderColor: "rgba(80,123,182,0.5)", backgroundColor: "#010A1F",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  input: { flex: 1, color: WHITE, fontSize: 13, fontFamily: "Poppins_400Regular", paddingHorizontal: 16 },

  dropMenu: {
    marginTop: 6, borderRadius: 16, borderWidth: 1,
    borderColor: "rgba(80,123,182,0.4)", backgroundColor: "#0D1E3F", overflow: "hidden",
  },
  dropItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
  },
  dropItemTxt: { color: "#C8D3E8", fontSize: 13, fontFamily: "Poppins_400Regular" },

  sectionLabel: { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold", marginBottom: 12, marginTop: 6 },
  subLabel: { color: "#6B7A99", fontSize: 12, fontFamily: "Poppins_400Regular", marginBottom: 8 },
  dateRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  dateLabel: { color: "#6B7A99", fontSize: 11, fontFamily: "Poppins_400Regular", marginBottom: 6 },

  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: "#232B45", backgroundColor: "#0D1530",
  },
  pillActive: { backgroundColor: "rgba(226,103,27,0.15)", borderColor: "#E2671B" },
  pillTxt: { color: "#C0C8DC", fontSize: 13, fontFamily: "Poppins_400Regular" },
  pillTxtActive: { color: ORANGE, fontFamily: "Poppins_500Medium" },

  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 24, marginBottom: 22 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: "#3A4A6B", alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0 },
  checkboxActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  termsText: { flex: 1, color: "#8E98B0", fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 18 },

  fixedFooter: {
    position: "absolute", bottom: 40, left: 0, right: 0,
    backgroundColor: "rgba(3,42,105,0.25)",
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30,
    width: "100%",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  publishBtn: { height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", marginBottom: 10, marginTop: 10 },
  publishTxt: { color: "#fff", fontSize: 15, fontFamily: "Poppins_600SemiBold" },

  draftBtn: {
    height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2A3350", backgroundColor: "#0D1530",
    marginBottom: 20,
  },
  draftTxt: { color: WHITE, fontSize: 15, fontFamily: "Poppins_600SemiBold" },

  cityChip: {
    height: 28, borderRadius: 14, borderWidth: 1, borderColor: "#E2671B",
    backgroundColor: "rgba(226,103,27,0.15)", flexDirection: "row",
    alignItems: "center", paddingHorizontal: 10, gap: 6,
  },
  cityChipActive: {},
  addCityChip: {
    height: 28, borderRadius: 14, borderWidth: 1, borderStyle: "dashed",
    borderColor: "#5C6F92", backgroundColor: "#071734",
    flexDirection: "row", alignItems: "center", paddingHorizontal: 10, gap: 5,
  },
  addCityTxt: { color: "#E0E3EB", fontSize: 11, fontFamily: "Poppins_400Regular" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  datePickerSheet: {
    backgroundColor: "#0D1E3F", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: "rgba(100,160,255,0.15)",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32,
  },
  pickerRow: { flexDirection: "row", gap: 4, marginBottom: 16 },
  pickerLabel: { color: "#6B7A99", fontSize: 10, fontFamily: "Poppins_400Regular", marginBottom: 6 },
  pickerScroll: { height: 160, width: "100%" },
  pickerItem: { paddingVertical: 8, alignItems: "center" },
  pickerItemTxt: { color: "#6B7A99", fontSize: 13, fontFamily: "Poppins_400Regular" },
  pickerItemActive: { color: ORANGE, fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  modalSheet: {
    backgroundColor: "#0D1E3F", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: "rgba(100,160,255,0.15)",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, maxHeight: "70%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: WHITE, fontSize: 16, fontFamily: "Poppins_600SemiBold" },
  modalItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  modalItemTxt: { color: "#C8D3E8", fontSize: 14, fontFamily: "Poppins_400Regular" },
  modalDone: { marginTop: 16, height: 44, borderRadius: 22, backgroundColor: ORANGE, alignItems: "center", justifyContent: "center" },
  modalDoneTxt: { color: "#fff", fontSize: 15, fontFamily: "Poppins_600SemiBold" },
});
