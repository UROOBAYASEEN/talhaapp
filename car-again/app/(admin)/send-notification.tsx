import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, ImagePlus, Globe, Landmark, ShieldPlus } from "lucide-react-native";
import { Image as RNImage } from "react-native";
import { API_BASE } from "@/constants/api";
import { useAppColors } from '@/constants/theme';

const WHITE = "#F4F5F7";
const ORANGE = "#FF6B00";

const MAX_MESSAGE = 150;

const AUDIENCES = [
  { id: "all",       icon: Globe,      title: "All Users",             subtitle: "Broadcast to everyone" },
  { id: "dealers",   icon: null,       title: "Official Dealers",      subtitle: "Target registered dealerships" },
  { id: "banks",     icon: Landmark,   title: "Banks",                 subtitle: "Target financial partners" },
  { id: "insurance", icon: ShieldPlus, title: "Insurance Companies",   subtitle: "Target insurance providers" },
];

export default function SendNotificationScreen() {
  const router = useRouter();
  const aC = useAppColors();

  const [title,     setTitle]    = useState("");
  const [message,   setMessage]  = useState("");
  const [image,     setImage]    = useState<string | null>(null);
  const [audiences, setAudiences] = useState<string[]>(["all"]);
  const [sending,   setSending]  = useState(false);

  const toggleAudience = (id: string) => {
    if (id === "all") {
      setAudiences(["all"]);
      return;
    }
    setAudiences(prev => {
      const withoutAll = prev.filter(a => a !== "all");
      if (withoutAll.includes(id)) {
        const next = withoutAll.filter(a => a !== id);
        return next.length === 0 ? ["all"] : next;
      }
      return [...withoutAll, id];
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSend = async () => {
    if (!title.trim())   { Alert.alert("Required", "Notification title is required."); return; }
    if (!message.trim()) { Alert.alert("Required", "Message body is required."); return; }

    try {
      setSending(true);
      const token = await SecureStore.getItemAsync("access_token");

      let imageUrl: string | null = null;
      if (image) {
        const form = new FormData();
        form.append("file", { uri: image, name: "notif.jpg", type: "image/jpeg" } as any);
        const upRes = await fetch(`${API_BASE}/upload/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (upRes.ok) {
          const d = await upRes.json();
          imageUrl = d.url ?? d.file_url ?? null;
        }
      }

      const res = await fetch(`${API_BASE}/admin/send-notification`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title:     title.trim(),
          message:   message.trim(),
          audiences: audiences,
          image_url: imageUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to send");
      const data = await res.json();

      Alert.alert("Sent!", `Notification sent to ${data.sent} users.`, [
        { text: "OK", onPress: () => { setTitle(""); setMessage(""); setImage(null); setAudiences(["all"]); } },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: aC.bg }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>

          {/* HEADER */}
          <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <ArrowLeft size={24} color={aC.isDark ? "rgba(255,255,255,0.9)" : "#010a1f"} strokeWidth={1.8} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Notification Center</Text>
            <TouchableOpacity style={styles.headerBtn}>
              <Search size={22} color={aC.isDark ? "rgba(255,255,255,0.9)" : "#010a1f"} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* NOTIFICATION TITLE */}
            <Field label="Notification Title">
              <InputBox
                placeholder="e.g., New Campaign Launch"
                value={title}
                onChangeText={setTitle}
              />
            </Field>

            {/* MESSAGE BODY */}
            <View style={styles.fieldWrap}>
              <View style={styles.msgLabelRow}>
                <Text style={[styles.fieldLabel, { color: aC.isDark ? WHITE : '#010a1f' }]}>Message Body</Text>
                <Text style={[styles.charCount, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>
                  <Text style={{ color: aC.isDark ? WHITE : '#010a1f' }}>{message.length}</Text> / {MAX_MESSAGE}
                </Text>
              </View>
              <View style={[styles.inputWrap, { height: 120, alignItems: "flex-start", overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(80,123,182,0.5)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['rgba(13,37,84,0.3)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <TextInput
                  value={message} onChangeText={setMessage}
                  placeholder="e.g., Check out the new Q3 SUV lease specials..."
                  placeholderTextColor={aC.isDark ? "#6B7A99" : "#94a3b8"} maxLength={MAX_MESSAGE}
                  multiline style={[styles.input, { height: 110, textAlignVertical: "top", paddingTop: 12, color: aC.isDark ? WHITE : '#010a1f' }]}
                  selectionColor={ORANGE}
                />
              </View>
            </View>

            {/* IMAGE ATTACHMENT */}
            <Field label="Image Attachment (Optional)">
              <TouchableOpacity style={[styles.uploadBox, { backgroundColor: aC.isDark ? "#040E24" : "#ffffff", borderColor: aC.isDark ? "#2A3350" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]} onPress={pickImage} activeOpacity={0.8}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.imgPreview} resizeMode="cover" />
                ) : (
                  <>
                    <ImagePlus size={28} color={ORANGE} strokeWidth={1.75} />
                    <Text style={[styles.uploadTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Click to upload or drag and drop</Text>
                    <Text style={[styles.uploadSub, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>SVG, PNG, JPG or GIF (max. 800x400px)</Text>
                  </>
                )}
              </TouchableOpacity>
            </Field>

            {/* TARGETING AUDIENCE */}
            <Text style={[styles.sectionLabel, { color: aC.isDark ? WHITE : '#010a1f' }]}>Targeting Audience</Text>
            <View style={styles.audienceList}>
              {AUDIENCES.map(({ id, icon: Icon, title: t, subtitle }) => {
                const active = audiences.includes(id);
                return (
                  <TouchableOpacity
                    key={id} onPress={() => toggleAudience(id)} activeOpacity={0.8}
                    style={[styles.audienceCard, active && styles.audienceCardActive, { overflow: "hidden", backgroundColor: aC.isDark ? "#061B4A" : "#ffffff", borderColor: active ? "rgba(255,107,0,0.5)" : (aC.isDark ? "#232B45" : "rgba(3,42,105,0.12)"), shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}
                  >
                    {!active && aC.isDark && (
                      <>
                        <LinearGradient colors={['rgba(22,64,136,0.5)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                        <LinearGradient colors={['rgba(13,37,84,0.4)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                        <LinearGradient colors={['transparent', 'rgba(29,83,175,0.5)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                      </>
                    )}
                    {!active && !aC.isDark && (
                      <>
                        <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                        <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                      </>
                    )}
                    <View style={styles.audienceIconBox}>
                      {id === "dealers" ? (
                        <RNImage source={require("@/screenshot/update.png")} style={{ width: 20, height: 20 }} resizeMode="contain" />
                      ) : (
                        Icon && <Icon size={18} color={ORANGE} strokeWidth={1.8} />
                      )}
                    </View>
                    <View style={styles.audienceText}>
                      <Text style={[styles.audienceTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>{t}</Text>
                      <Text style={[styles.audienceSub, { color: aC.isDark ? "#6B7A99" : "#475569" }]} numberOfLines={1}>{subtitle}</Text>
                    </View>
                    {/* Checkbox */}
                    <View style={[styles.checkbox, { borderColor: active ? ORANGE : (aC.isDark ? "#3A4A6B" : "rgba(3,42,105,0.15)"), backgroundColor: active ? ORANGE : 'transparent' }, active && styles.checkboxActive]}>
                      {active && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* SEND BUTTON */}
          <View style={styles.footer}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleSend} disabled={sending}>
              <LinearGradient
                colors={["#032A69", "#E2671B"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.sendBtn, { overflow: "hidden", opacity: sending ? 0.7 : 1 }]}
              >
                <LinearGradient colors={['rgba(22,64,136,0.4)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                {sending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.sendTxt}>Send Notification</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
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

function InputBox({ placeholder, value, onChangeText }: {
  placeholder: string; value: string; onChangeText: (t: string) => void;
}) {
  const aC = useAppColors();
  return (
    <View style={[styles.inputWrap, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(80,123,182,0.5)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
      {aC.isDark ? (
        <>
          <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.3)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      ) : (
        <>
          <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      )}
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={aC.isDark ? "#6B7A99" : "#94a3b8"} style={[styles.input, { color: aC.isDark ? WHITE : '#010a1f' }]} selectionColor={ORANGE}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#010A1F" },
  safeArea:  { flex: 1, backgroundColor: "#010A1F" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  headerBtn:   { width: 36, height: 44, justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 16, fontFamily: "Poppins_600SemiBold" },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  fieldWrap:   { marginBottom: 20 },
  fieldLabel:  { color: WHITE, fontSize: 13, fontFamily: "Poppins_500Medium", marginBottom: 10 },
  msgLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  charCount:   { color: "#6B7A99", fontSize: 12, fontFamily: "Poppins_400Regular" },

  inputWrap: {
    height: 47, borderRadius: 25, borderWidth: 1,
    borderColor: "rgba(80,123,182,0.5)", backgroundColor: "#010A1F",
    flexDirection: "row", alignItems: "center",
  },
  input: { flex: 1, color: WHITE, fontSize: 13, fontFamily: "Poppins_400Regular", paddingHorizontal: 16, paddingVertical: 0 },

  uploadBox: {
    borderWidth: 1.5, borderStyle: "dashed", borderColor: "#2A3350",
    borderRadius: 20, paddingVertical: 28, alignItems: "center",
    justifyContent: "center", gap: 8, backgroundColor: "#040E24",
  },
  imgPreview:  { width: "100%", height: 150, borderRadius: 16 },
  uploadTitle: { color: WHITE, fontSize: 14, fontFamily: "Poppins_500Medium" },
  uploadSub:   { color: "#6B7A99", fontSize: 11, fontFamily: "Poppins_400Regular" },

  sectionLabel: { color: WHITE, fontSize: 14, fontFamily: "Poppins_600SemiBold", marginBottom: 12 },

  audienceList: { gap: 12 },
  audienceCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 30, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: "#232B45", backgroundColor: "#061B4A",
  },
  audienceCardActive: { borderColor: "rgba(255,107,0,0.5)", backgroundColor: "#061B4A" },
  audienceIconBox: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  audienceText:  { flex: 1 },
  audienceTitle: { color: WHITE, fontSize: 14, fontFamily: "Poppins_600SemiBold", lineHeight: 20 },
  audienceSub:   { color: "#6B7A99", fontSize: 12, fontFamily: "Poppins_400Regular" },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: "#3A4A6B",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
    backgroundColor: "transparent",
  },
  checkboxActive: { borderColor: ORANGE, backgroundColor: ORANGE },
  checkmark: { color: WHITE, fontSize: 12, fontFamily: "Poppins_700Bold", lineHeight: 16 },

  footer: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30,
    backgroundColor: "transparent",
    marginBottom: 16,
  },
  sendBtn: { height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  sendTxt: { color: "#fff", fontSize: 15, fontFamily: "Poppins_600SemiBold" },
});
