import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Alert, ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { AppColors, useAppColors } from "@/constants/theme";

const BG     = "#010a1f";
const WHITE  = "#f9fafc";
const SUB    = "#baacb6";
const ORANGE = "#e2671b";
const SERVER = API_BASE.replace('/api/v1', '');

type DocItem = {
  id:       string;   // local key
  apiId?:   string;   // existing doc ID from API
  title:    string;
  subtitle: string;
  required: boolean;
  fileUrl?: string;   // existing uploaded URL
  newFile?: DocumentPicker.DocumentPickerAsset; // newly picked file
  uploading: boolean;
};

const INSURANCE_DOC_TYPES = [
  { id: "cnic",    title: "CNIC (Front & Back)",             subtitle: "PDF / JPG up to 5MB", required: true,  apiType: "CNIC"    },
  { id: "rc",      title: "Vehicle Registration Certificate", subtitle: "PDF / JPG up to 5MB", required: true,  apiType: "RC Book" },
  { id: "license", title: "Driving License",                  subtitle: "PDF / JPG up to 5MB", required: true,  apiType: "License" },
  { id: "photo",   title: "Vehicle Photos",                   subtitle: "JPG / PNG up to 5MB", required: false, apiType: "Vehicle Photo" },
];

export default function UploadDocumentsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();
  const params = useLocalSearchParams();

  const [docs,     setDocs]     = useState<DocItem[]>(
    INSURANCE_DOC_TYPES.map(d => ({ ...d, uploading: false }))
  );
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { fetchExistingDocs(); }, []);

  async function fetchExistingDocs() {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/documents/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const existing: any[] = await res.json();
        setDocs(prev => prev.map(doc => {
          const match = existing.find(e =>
            e.type?.toLowerCase().includes(doc.id) ||
            doc.title.toLowerCase().includes(e.type?.toLowerCase() || '')
          );
          return match
            ? { ...doc, apiId: match.id, fileUrl: match.file_url ? (match.file_url.startsWith('http') ? match.file_url : `${SERVER}${match.file_url}`) : undefined }
            : doc;
        }));
      }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }

  async function pickAndUpload(id: string) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert("File too large", "Please select a file smaller than 5MB.");
          return;
        }

        // Mark uploading
        setDocs(prev => prev.map(d => d.id === id ? { ...d, uploading: true, newFile: file } : d));

        // Upload file
        const formData = new FormData();
        const ext = file.name.split('.').pop() || 'pdf';
        formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType || `application/${ext}` } as any);

        const uploadRes = await fetch(`${API_BASE}/upload/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Upload failed');
        const { url } = await uploadRes.json();
        const fullUrl = url.startsWith('http') ? url : `${SERVER}${url}`;

        // Save to documents API
        const docType = INSURANCE_DOC_TYPES.find(d => d.id === id)!;
        await fetch(`${API_BASE}/documents/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ type: docType.apiType, desc: docType.title, file_url: url }),
        });

        setDocs(prev => prev.map(d => d.id === id ? { ...d, uploading: false, fileUrl: fullUrl } : d));
      }
    } catch {
      setDocs(prev => prev.map(d => d.id === id ? { ...d, uploading: false } : d));
      Alert.alert("Error", "Unable to upload document. Please try again.");
    }
  }

  async function handleContinue() {
    const missingRequired = docs.filter(d => d.required && !d.fileUrl);
    if (missingRequired.length > 0) {
      Alert.alert("Required Documents", `Please upload: ${missingRequired.map(d => d.title).join(", ")}`);
      return;
    }

    const hasTracker = String((params as any).has_tracker) === 'true';
    const selectedAddons = (() => { try { return JSON.parse(String((params as any).selected_addons || '[]')); } catch { return []; } })();

    const hasAppParams = params.claimId && params.planId;
    if (hasAppParams) {
      try {
        setSaving(true);
        let res = await fetch(`${API_BASE}/insurance/applications`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            claim_id:       params.claimId,
            plan_id:        params.planId,
            full_name:      params.fullName   || '',
            cnic:           params.cnic       || '',
            phone:          params.phone      || '',
            email:          params.email      || '',
            preferred_date: params.date       || '',
            preferred_time: params.time       || '',
            address:        params.address    || '',
            has_tracker:    hasTracker,
            selected_addons: selectedAddons,
          }),
        });
        // 404 claim not found → fallback to submit-application (creates claim+app together)
        if (res.status === 404) {
          res = await fetch(`${API_BASE}/insurance/submit-application`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              brand: "—", model: "—", year: 2024, estimated_value: Number(String(params.price).replace(/[^0-9]/g,'')) || 0,
              city: params.address || "—", reg_number: "—",
              plan_id: params.planId, full_name: params.fullName, cnic: params.cnic, phone: params.phone, email: params.email,
              preferred_date: params.date, preferred_time: params.time, address: params.address,
              has_tracker: hasTracker, selected_addons: selectedAddons,
            }),
          });
        }
        if (!res.ok) {
          const e = await res.json().catch(()=>({}));
          throw new Error(e.detail ?? 'Failed to submit application');
        }
        const app = await res.json();
        router.push({ pathname: '/insurance/payment-summary' as any, params: { ...params, applicationId: app.id || app.application_id } });
      } catch (e: any) {
        Alert.alert('Error', e.message ?? 'Could not submit application.');
      } finally {
        setSaving(false);
      }
    } else if (params.planId) {
      // No claimId (e.g. direct from profile/claim) → use submit-application directly
      try {
        setSaving(true);
        const res = await fetch(`${API_BASE}/insurance/submit-application`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand: "—", model: "—", year: 2024, estimated_value: Number(String(params.price).replace(/[^0-9]/g,'')) || 0,
            city: params.address || "—", reg_number: "—",
            plan_id: params.planId, full_name: params.fullName, cnic: params.cnic, phone: params.phone, email: params.email,
            preferred_date: params.date, preferred_time: params.time, address: params.address,
            has_tracker: hasTracker, selected_addons: selectedAddons,
          }),
        });
        if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.detail||'Failed'); }
        const app = await res.json();
        router.push({ pathname: '/insurance/payment-summary' as any, params: { ...params, applicationId: app.application_id || app.id } });
      } catch(e:any){ Alert.alert('Error', e.message);} finally{ setSaving(false); }
    } else {
      router.push({ pathname: '/insurance/payment-summary' as any, params });
    }
  }

  const uploadedCount = docs.filter(d => d.fileUrl).length;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={["top"]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      <View style={[s.container, { backgroundColor: aC.bg }]}>
        {/* Header */}
        <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomColor: aC.isDark ? "rgba(49,95,173,0.4)" : "rgba(3,42,105,0.08)" }]}>
          <TouchableOpacity style={[s.backBtn, { backgroundColor: aC.isDark ? "rgba(6,17,60,0.85)" : '#f1f5f9' }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={aC.isDark ? WHITE : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Upload Documents</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, backgroundColor: aC.bg }} style={{ backgroundColor: aC.bg }}>

            {/* Progress */}
            <View style={s.progressWrap}>
              <Text style={[s.progressTxt, { color: aC.isDark ? SUB : '#475569' }]}>{uploadedCount} of {docs.length} uploaded</Text>
              <View style={[s.progressBar, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.1)" : "rgba(3,42,105,0.08)" }]}>
                <View style={[s.progressFill, { width: `${(uploadedCount / docs.length) * 100}%` as any }]} />
              </View>
            </View>

            {/* Info */}
            <View style={[s.infoBox, { backgroundColor: aC.isDark ? "rgba(226,103,27,0.08)" : "#ffffff", borderColor: aC.isDark ? "rgba(226,103,27,0.2)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
              <Ionicons name="information-circle-outline" size={16} color={ORANGE} />
              <Text style={[s.infoTxt, { color: aC.isDark ? SUB : '#475569' }]}>
                Previously uploaded documents are pre-filled. You can update them anytime.
                Fields marked <Text style={{ color: '#f87171' }}>*</Text> are required.
              </Text>
            </View>

            {/* Documents */}
            <View style={[s.card, { backgroundColor: aC.isDark ? "rgba(3,12,40,0.6)" : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.5)" : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
              {aC.isDark ? (
                <>
                  <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              ) : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}

              {docs.map((doc, index) => (
                <View key={doc.id} style={[s.row, index < docs.length - 1 && [s.rowBorder, { borderBottomColor: aC.isDark ? "rgba(255,255,255,0.06)" : "rgba(3,42,105,0.08)" }]]}>
                  <View style={[s.iconWrap, { backgroundColor: doc.fileUrl ? (aC.isDark ? "rgba(52,211,153,0.1)" : "#ecfdf5") : (aC.isDark ? "rgba(226,103,27,0.1)" : "#fff7ed") }, doc.fileUrl && s.iconWrapDone]}>
                    {doc.uploading
                      ? <ActivityIndicator size="small" color={ORANGE} />
                      : <Ionicons
                          name={doc.fileUrl ? "checkmark-circle" : "cloud-upload-outline"}
                          size={20}
                          color={doc.fileUrl ? "#34D399" : ORANGE}
                        />
                    }
                  </View>

                  <View style={s.docInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={[s.docTitle, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={1}>{doc.title}</Text>
                      {doc.required && <Text style={s.required}>*</Text>}
                    </View>
                    {doc.fileUrl
                      ? <Text style={s.uploaded}>✓ Uploaded</Text>
                      : <Text style={[s.docSub, { color: aC.isDark ? SUB : '#475569' }]}>{doc.subtitle}</Text>
                    }
                  </View>

                  <TouchableOpacity
                    style={[s.uploadBtn, { borderColor: doc.fileUrl ? "rgba(52,211,153,0.4)" : (aC.isDark ? "rgba(226,103,27,0.5)" : "rgba(3,42,105,0.12)"), backgroundColor: doc.fileUrl ? "rgba(52,211,153,0.06)" : (aC.isDark ? "rgba(226,103,27,0.08)" : "#f8fafc") }, doc.fileUrl && s.uploadedBtn]}
                    onPress={() => pickAndUpload(doc.id)}
                    activeOpacity={0.8}
                    disabled={doc.uploading}
                  >
                    <Text style={[s.uploadBtnTxt, { color: doc.fileUrl ? "#34D399" : (aC.isDark ? ORANGE : '#032a69') }, doc.fileUrl && s.uploadedBtnTxt]}>
                      {doc.uploading ? '...' : doc.fileUrl ? "Update" : "Upload"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Continue */}
            <TouchableOpacity style={s.submitWrap} activeOpacity={0.85} onPress={handleContinue} disabled={saving}>
              <LinearGradient colors={["#032a69", ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
                {saving
                  ? <ActivityIndicator color={WHITE} />
                  : <Text style={s.submitTxt}>Continue to Payment</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG, paddingHorizontal: 20 },

  header:      { height: 70, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 0.5, borderBottomColor: "rgba(49,95,173,0.4)" },
  backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(6,17,60,0.85)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Poppins_600SemiBold", color: WHITE },

  progressWrap: { marginTop: 20, marginBottom: 12 },
  progressTxt:  { color: SUB, fontSize: 12, fontFamily: "Poppins_400Regular", marginBottom: 6 },
  progressBar:  { height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: ORANGE, borderRadius: 2 },

  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "rgba(226,103,27,0.08)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(226,103,27,0.2)", padding: 12, marginBottom: 16 },
  infoTxt: { flex: 1, color: SUB, fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 17 },

  card:      { backgroundColor: "rgba(3,12,40,0.6)", borderWidth: 1, borderColor: "rgba(100,160,255,0.5)", borderRadius: 16, padding: 12, overflow: "hidden", marginBottom: 24 },
  row:       { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },

  iconWrap:     { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(226,103,27,0.1)", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iconWrapDone: { backgroundColor: "rgba(52,211,153,0.1)" },

  docInfo:  { flex: 1 },
  docTitle: { color: WHITE, fontSize: 13, fontFamily: "Poppins_500Medium" },
  required: { color: "#f87171", fontSize: 13, fontFamily: "Poppins_700Bold" },
  docSub:   { color: SUB, fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 2 },
  uploaded: { color: "#34D399", fontSize: 11, fontFamily: "Poppins_500Medium", marginTop: 2 },

  uploadBtn:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "rgba(226,103,27,0.5)", backgroundColor: "rgba(226,103,27,0.08)" },
  uploadedBtn:   { borderColor: "rgba(52,211,153,0.4)", backgroundColor: "rgba(52,211,153,0.06)" },
  uploadBtnTxt:  { color: ORANGE, fontSize: 12, fontFamily: "Poppins_500Medium" },
  uploadedBtnTxt:{ color: "#34D399" },

  submitWrap: { borderRadius: 32, overflow: "hidden" },
  submitGrad: { height: 52, justifyContent: "center", alignItems: "center" },
  submitTxt:  { color: WHITE, fontSize: 15, fontFamily: "Poppins_600SemiBold" },
});
