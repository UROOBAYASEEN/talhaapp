import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, X, Plus } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import AdminFooter from "@/components/admin/AdminFooter";
import { API_BASE } from "@/constants/api";
import { useAppColors } from '@/constants/theme';
import { SavedCardEffect } from "@/components/shared/FigmaEffects";

const ROLE_OPTIONS = [
  { id: "all",       label: "All Panels"  },
  { id: "dealer",    label: "Dealers"     },
  { id: "bank",      label: "Banks"       },
  { id: "insurance", label: "Insurance"   },
  { id: "tracker",   label: "Tracker"     },
  { id: "seller",    label: "Sellers"     },
];

const WHITE = "#F4F5F7";
const ORANGE = "#E2671B";

export default function AddPlanScreen() {
  const router = useRouter();
  const aC = useAppColors();

  const [title,        setTitle]       = useState("");
  const [tagline,      setTagline]     = useState("");
  const [price,        setPrice]       = useState("");
  const [yearlyPrice,  setYearlyPrice] = useState("");
  const [description,  setDescription] = useState("");
  const [services,     setServices]    = useState<string[]>([]);
  const [newService,   setNewService]  = useState("");
  const [adding,       setAdding]      = useState(false);
  const [roleFor,      setRoleFor]     = useState("all");
  const [publishing,   setPublishing]  = useState(false);

  const removeService = (svc: string) => setServices(s => s.filter(x => x !== svc));

  const addService = () => {
    const trimmed = newService.trim();
    if (trimmed && !services.includes(trimmed)) setServices(s => [...s, trimmed]);
    setNewService("");
    setAdding(false);
  };

  const handlePublish = async () => {
    if (!title.trim()) { Alert.alert("Required", "Plan title is required."); return; }
    if (!price.trim()) { Alert.alert("Required", "Price is required."); return; }
    try {
      setPublishing(true);
      const token = await SecureStore.getItemAsync("access_token");
      const res = await fetch(`${API_BASE}/plans/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name:          title.trim(),
          tagline:       tagline.trim(),
          description:   description.trim(),
          monthly_price: parseFloat(price.replace(/,/g, "")) || 0,
          yearly_price:  yearlyPrice ? parseFloat(yearlyPrice.replace(/,/g, "")) : null,
          features:      services,
          role_for:      roleFor === "all" ? null : roleFor,
          is_popular:    false,
          color:         "#e2671b",
        }),
      });
      if (!res.ok) throw new Error("Failed to publish");
      Alert.alert("Success", "Plan published successfully!", [
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
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color={aC.isDark ? "rgba(255,255,255,0.9)" : "#010a1f"} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Add Plans Details</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* PLAN TITLE */}
          <Field label="Plan Title">
            <InputBox placeholder="Enter title" value={title} onChangeText={setTitle} />
          </Field>

          {/* TAG LINE */}
          <Field label="Tag line">
            <InputBox placeholder="Enter tag line" value={tagline} onChangeText={setTagline} />
          </Field>

          {/* SET PRICE */}
          <Field label="Monthly Price (PKR)">
            <View style={[styles.inputWrap, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
              {aC.isDark ? (
                <SavedCardEffect band={12} />
              ) : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              <Text style={[styles.pkrLabel, { color: aC.isDark ? "#C0C8DC" : "#475569" }]}>PKR</Text>
              <TextInput value={price} onChangeText={setPrice} placeholder="e.g. 9999" placeholderTextColor={aC.isDark ? "#6B7A99" : "#94a3b8"} keyboardType="numeric" style={[styles.input, { color: aC.isDark ? WHITE : '#010a1f' }]} selectionColor={ORANGE} />
            </View>
          </Field>

          <Field label="Yearly Price (PKR) — Optional">
            <View style={[styles.inputWrap, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
              {aC.isDark ? (
                <SavedCardEffect band={12} />
              ) : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              <Text style={[styles.pkrLabel, { color: aC.isDark ? "#C0C8DC" : "#475569" }]}>PKR</Text>
              <TextInput value={yearlyPrice} onChangeText={setYearlyPrice} placeholder="e.g. 95990" placeholderTextColor={aC.isDark ? "#6B7A99" : "#94a3b8"} keyboardType="numeric" style={[styles.input, { color: aC.isDark ? WHITE : '#010a1f' }]} selectionColor={ORANGE} />
            </View>
          </Field>

          {/* ROLE FOR */}
          <Text style={[styles.sectionLabel, { color: aC.isDark ? WHITE : '#010a1f' }]}>Plan For</Text>
          <View style={styles.chipsWrap}>
            {ROLE_OPTIONS.map(r => (
              <TouchableOpacity
                key={r.id}
                onPress={() => setRoleFor(r.id)}
                style={[styles.chip, { backgroundColor: aC.isDark ? "#061B4A" : (roleFor === r.id ? 'rgba(226,103,27,0.08)' : '#ffffff'), borderColor: aC.isDark ? "rgba(100,160,255,0.25)" : (roleFor === r.id ? ORANGE : "rgba(3,42,105,0.12)") }, roleFor === r.id && styles.chipActive]}
              >
                <Text style={[styles.chipTxt, { color: roleFor === r.id ? ORANGE : (aC.isDark ? "#C0C8DC" : "#475569") }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* DESCRIPTION */}
          <Field label="Description">
            <View style={[styles.inputWrap, { height: 120, alignItems: "flex-start", overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
              {aC.isDark ? (
                <SavedCardEffect band={12} />
              ) : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              <TextInput
                value={description} onChangeText={setDescription}
                placeholder="Benefits" placeholderTextColor={aC.isDark ? "#6B7A99" : "#94a3b8"}
                multiline style={[styles.input, { textAlignVertical: "top", paddingTop: 12, height: 110, color: aC.isDark ? WHITE : '#010a1f' }]}
                selectionColor={ORANGE}
              />
            </View>
          </Field>

          {/* SERVICES OFFERED */}
          <Text style={[styles.sectionLabel, { color: aC.isDark ? WHITE : '#010a1f' }]}>Services Offered</Text>
          <View style={styles.chipsWrap}>
            {services.map(svc => (
              <View key={svc} style={[styles.chip, { backgroundColor: aC.isDark ? "#061B4A" : "#ffffff", borderColor: aC.isDark ? "#7F98C4" : "rgba(3,42,105,0.12)" }]}>
                <Text style={[styles.chipTxt, { color: aC.isDark ? "#C0C8DC" : "#475569" }]}>{svc}</Text>
                <TouchableOpacity onPress={() => removeService(svc)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={14} color={aC.isDark ? "#8090B0" : "#475569"} strokeWidth={1.8} />
                </TouchableOpacity>
              </View>
            ))}

            {adding ? (
              <View style={[styles.addingChip, { backgroundColor: aC.isDark ? "#061B4A" : "#ffffff", borderColor: aC.isDark ? "#7F98C4" : "rgba(3,42,105,0.12)" }]}>
                <TextInput
                  autoFocus value={newService} onChangeText={setNewService}
                  onSubmitEditing={addService} onBlur={addService}
                  placeholder="Service name" placeholderTextColor={aC.isDark ? "#6B7A99" : "#94a3b8"}
                  style={[styles.addingInput, { color: aC.isDark ? WHITE : '#010a1f' }]} selectionColor={ORANGE}
                />
              </View>
            ) : (
              <TouchableOpacity style={[styles.addChip, { backgroundColor: aC.isDark ? "transparent" : "#ffffff", borderColor: aC.isDark ? "#7F98C4" : "rgba(3,42,105,0.12)" }]} onPress={() => setAdding(true)}>
                <Plus size={14} color={aC.isDark ? "#C0C8DC" : "#475569"} strokeWidth={1.7} />
                <Text style={[styles.addChipTxt, { color: aC.isDark ? "#C0C8DC" : "#475569" }]}>Add service</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* PUBLISH BUTTON */}
          <TouchableOpacity activeOpacity={0.85} onPress={handlePublish} disabled={publishing}>
            <LinearGradient
              colors={["#032A69", "#E2671B"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.publishBtn, { overflow: "hidden", opacity: publishing ? 0.7 : 1 }]}
            >
              <LinearGradient colors={['rgba(22,64,136,0.4)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              {publishing
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.publishTxt}>Publish</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>

        <AdminFooter active="actions" />
      </SafeAreaView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const aC = useAppColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: aC.isDark ? WHITE : '#010a1f' }]}>{label}</Text>
      {children}
    </View>
  );
}

function InputBox({ placeholder, value, onChangeText }: { placeholder: string; value: string; onChangeText: (t: string) => void }) {
  const aC = useAppColors();
  return (
    <View style={[styles.inputWrap, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
      {aC.isDark ? (
        <SavedCardEffect band={12} />
      ) : (
        <>
          <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      )}
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={aC.isDark ? "#6B7A99" : "#94a3b8"} style={[styles.input, { color: aC.isDark ? WHITE : '#010a1f' }]} selectionColor={ORANGE} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#010A1F" },
  safeArea:  { flex: 1, backgroundColor: "#010A1F" },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, marginTop: 4 },
  headerBtn:   { width: 36, height: 44, justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 18, fontFamily: "Poppins_500Medium" },

  scroll: { paddingHorizontal: 20 },

  fieldWrap:  { marginBottom: 20 },
  fieldLabel: { color: WHITE, fontSize: 14, fontFamily: "Poppins_600SemiBold", marginBottom: 10 },

  inputWrap: {
    height: 56, borderRadius: 28, borderWidth: 1,
    borderColor: "rgba(80,123,182,0.5)", backgroundColor: "#010A1F",
    flexDirection: "row", alignItems: "center",
  },
  pkrLabel: { color: "#C0C8DC", fontSize: 13, fontFamily: "Poppins_500Medium", paddingLeft: 16, paddingRight: 6 },
  input:    { flex: 1, color: WHITE, fontSize: 13, fontFamily: "Poppins_400Regular", paddingHorizontal: 16, paddingVertical: 0 },

  sectionLabel: { color: WHITE, fontSize: 14, fontFamily: "Poppins_600SemiBold", marginBottom: 12 },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#061B4A", borderRadius: 20, borderWidth: 1,
    borderColor: "rgba(100,160,255,0.25)", paddingHorizontal: 14, paddingVertical: 9,
  },
  chipTxt:    { color: "#C0C8DC", fontSize: 13, fontFamily: "Poppins_400Regular" },
  chipActive: { borderColor: ORANGE, backgroundColor: "rgba(226,103,27,0.1)" },

  addingChip: {
    backgroundColor: "#061B4A", borderRadius: 20, borderWidth: 1,
    borderStyle: "dashed", borderColor: "#3A4460",
    paddingHorizontal: 14, paddingVertical: 6,
  },
  addingInput: { color: WHITE, fontSize: 13, fontFamily: "Poppins_400Regular", minWidth: 110 },

  addChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderStyle: "dashed", borderColor: "#3A4460",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9,
  },
  addChipTxt: { color: "#C0C8DC", fontSize: 13, fontFamily: "Poppins_400Regular" },

  publishBtn: { height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
  publishTxt: { color: WHITE, fontSize: 19, fontFamily: "Poppins_600SemiBold" },
});
