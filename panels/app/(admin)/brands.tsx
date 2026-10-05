import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, Modal, Pressable, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE } from "@/constants/api";
import { useAppColors } from "@/constants/theme";

const SERVER = API_BASE.replace("/api/v1", "");
const CATS = ["car", "bike", "both"] as const;

type Brand = {
  id: string;
  name: string;
  logo_url?: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
};

function logoUri(b: Brand): string | null {
  if (!b.logo_url) return null;
  if (b.logo_url.startsWith("http")) return b.logo_url;
  return `${SERVER}${b.logo_url}`;
}

export default function BrandsScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const dark = aC.isDark;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("car");
  const [logoUriLocal, setLogoUriLocal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("access_token");
      const res = await fetch(`${API_BASE}/brands?active_only=false`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const d = await res.json();
        setBrands(Array.isArray(d) ? d : []);
      }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setName("");
    setCategory("car");
    setLogoUriLocal(null);
    setModal(true);
  };

  const pickLogo = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!r.canceled) setLogoUriLocal(r.assets[0].uri);
  };

  const saveBrand = async () => {
    if (!name.trim()) { Alert.alert("Missing", "Brand name likhein."); return; }
    try {
      setSaving(true);
      const token = await SecureStore.getItemAsync("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      let uploadedUrl: string | null = null;
      if (logoUriLocal) {
        const form = new FormData();
        form.append("file", { uri: logoUriLocal, name: "logo.jpg", type: "image/jpeg" } as any);
        const upRes = await fetch(`${API_BASE}/upload/image`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        if (upRes.ok) {
          const up = await upRes.json();
          uploadedUrl = up.url ?? null;
        } else {
          Alert.alert("Upload failed", "Logo upload nahi hua. Dobara try karein.");
          setSaving(false);
          return;
        }
      }

      const res = await fetch(`${API_BASE}/brands`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: name.trim(), logo_url: uploadedUrl, category }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        Alert.alert("Error", (e as any).detail || "Brand save nahi hua.");
        setSaving(false);
        return;
      }
      setModal(false);
      load();
    } catch {
      Alert.alert("Error", "Kuch ghalat hua. Dobara try karein.");
    } finally { setSaving(false); }
  };

  const removeBrand = (b: Brand) => {
    Alert.alert("Delete", `"${b.name}" delete karna hai?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            const token = await SecureStore.getItemAsync("access_token");
            const res = await fetch(`${API_BASE}/brands/${b.id}`, {
              method: "DELETE",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) setBrands(p => p.filter(x => x.id !== b.id));
            else Alert.alert("Error", "Delete nahi hua.");
          } catch { Alert.alert("Error", "Delete nahi hua."); }
        },
      },
    ]);
  };

  const cardBg = dark ? "#0B2358" : "#ffffff";
  const cardBd = dark ? "transparent" : "rgba(3,42,105,0.12)";
  const txt = dark ? "#F4F5F7" : "#010a1f";
  const sub = dark ? "#ADB8CD" : "#475569";

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={txt} />
        </TouchableOpacity>
        <Text style={[s.title, { color: txt }]}>Brands</Text>
        <TouchableOpacity onPress={openAdd} style={[s.addBtn, { backgroundColor: "#e2671b" }]} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#e2671b" style={{ marginTop: 60 }} size="large" />
      ) : brands.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="pricetag-outline" size={44} color={sub} />
          <Text style={[s.emptyTxt, { color: sub }]}>No brands yet — tap + to add one</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.grid}>
          {brands.map(b => {
            const uri = logoUri(b);
            return (
              <View key={b.id} style={[s.card, { backgroundColor: cardBg, borderColor: cardBd }]}>
                <TouchableOpacity style={s.del} onPress={() => removeBrand(b)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={14} color="#e2671b" />
                </TouchableOpacity>
                {uri ? (
                  <Image source={{ uri }} style={s.logo} resizeMode="contain" />
                ) : (
                  <Text style={s.initial}>{b.name.charAt(0).toUpperCase()}</Text>
                )}
                <Text style={[s.name, { color: txt }]} numberOfLines={1}>{b.name.toUpperCase()}</Text>
                <Text style={[s.cat, { color: sub }]}>{b.category}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add Brand Modal */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <Pressable style={s.overlay} onPress={() => setModal(false)} />
        <View style={[s.sheet, { backgroundColor: dark ? "#071c49" : "#ffffff" }]}>
          <Text style={[s.sheetTitle, { color: txt }]}>Add Brand</Text>

          <Text style={[s.lbl, { color: sub }]}>Brand Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Toyota"
            placeholderTextColor={sub}
            style={[s.input, { color: txt, borderColor: cardBd, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }]}
          />

          <Text style={[s.lbl, { color: sub }]}>Category</Text>
          <View style={s.catRow}>
            {CATS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[s.chip, category === c && s.chipOn]}
                activeOpacity={0.85}
              >
                <Text style={[s.chipTxt, category === c && s.chipTxtOn]}>{c.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.lbl, { color: sub }]}>Logo</Text>
          <TouchableOpacity onPress={pickLogo} style={[s.logoBox, { borderColor: cardBd }]} activeOpacity={0.85}>
            {logoUriLocal ? (
              <Image source={{ uri: logoUriLocal }} style={s.logoPreview} resizeMode="contain" />
            ) : (
              <>
                <Ionicons name="image-outline" size={28} color={sub} />
                <Text style={[s.logoHint, { color: sub }]}>Tap to pick logo</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={saveBrand} disabled={saving} activeOpacity={0.88} style={{ marginTop: 18 }}>
            <LinearGradient colors={["#032a69", "#e2671b"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtn}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.saveTxt}>Save Brand</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 18, fontFamily: "Poppins_600SemiBold" },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 16 },
  card: {
    width: "30.5%", borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center", gap: 4,
    paddingVertical: 14, paddingHorizontal: 6, position: "relative",
  },
  del: { position: "absolute", top: 6, right: 6, zIndex: 2 },
  logo: { width: 44, height: 34 },
  initial: { color: "#D8DCE6", fontSize: 24, fontFamily: "Poppins_700Bold", lineHeight: 30 },
  name: { fontSize: 10, fontFamily: "Poppins_600SemiBold", textAlign: "center" },
  cat: { fontSize: 9, fontFamily: "Poppins_400Regular" },
  empty: { alignItems: "center", gap: 10, marginTop: 80 },
  emptyTxt: { fontSize: 13, fontFamily: "Poppins_400Regular" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  sheetTitle: { fontSize: 17, fontFamily: "Poppins_700Bold", marginBottom: 12 },
  lbl: { fontSize: 12, fontFamily: "Poppins_500Medium", marginTop: 10, marginBottom: 6 },
  input: {
    height: 46, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, fontSize: 14, fontFamily: "Poppins_500Medium",
  },
  catRow: { flexDirection: "row", gap: 8 },
  chip: {
    flex: 1, height: 40, borderRadius: 12, borderWidth: 1, borderColor: "rgba(100,160,255,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  chipOn: { backgroundColor: "#e2671b", borderColor: "#e2671b" },
  chipTxt: { fontSize: 12, fontFamily: "Poppins_500Medium", color: "#ADB8CD" },
  chipTxtOn: { color: "#fff", fontFamily: "Poppins_600SemiBold" },
  logoBox: {
    height: 110, borderRadius: 12, borderWidth: 1, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  logoPreview: { width: 120, height: 80 },
  logoHint: { fontSize: 11, fontFamily: "Poppins_400Regular" },
  saveBtn: { height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  saveTxt: { color: "#fff", fontSize: 15, fontFamily: "Poppins_600SemiBold" },
});
