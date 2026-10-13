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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PRIMARY_BTN_COLORS, SavedCardEffect } from "@/components/shared/FigmaEffects";

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
  { id: "rc",      title: "Vehicle Registration Book", subtitle: "PDF / JPG up to 5MB", required: true,  apiType: "RC Book" },
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
        <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={aC.isDark ? '#C9C6D0' : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Upload Documents</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 30, backgroundColor: aC.bg }} style={{ backgroundColor: aC.bg }}>

            {/* Progress / info — hidden per Figma (kept for reference)
            <View style={s.progressWrap}>
              <Text style={[s.progressTxt, { color: aC.isDark ? SUB : '#475569' }]}>{uploadedCount} of {docs.length} uploaded</Text>
            </View>
            */}

            {/* Documents */}
            <View style={[s.card, aC.isDark ? { backgroundColor: '#010A1F', borderColor: '#82a5d5', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 } : { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)', shadowColor: 'rgba(3,42,105,0.12)', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 }]}>
              {aC.isDark && <SavedCardEffect />}
              <Text style={[s.intro, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Please upload clear photos of the following documents.</Text>

              {docs.map((doc) => (
                <View key={doc.id} style={[s.row, { backgroundColor: aC.isDark ? '#0B1D4A' : '#f8fafc' }]}>
                  <View style={[s.iconWrap, doc.fileUrl && { borderColor: 'rgba(52,211,153,0.6)' }]}>
                    {doc.uploading
                      ? <ActivityIndicator size="small" color={ORANGE} />
                      : <MaterialCommunityIcons name={doc.fileUrl ? "check" : "tray-arrow-up"} size={22} color={doc.fileUrl ? "#34D399" : ORANGE} />
                    }
                  </View>

                  <View style={s.docInfo}>
                    <Text style={[s.docTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={1}>{doc.title}</Text>
                    {doc.fileUrl
                      ? <Text style={s.uploaded}>✓ Uploaded</Text>
                      : <Text style={[s.docSub, { color: aC.isDark ? '#BAB6C4' : '#475569' }]}>{doc.subtitle}</Text>
                    }
                  </View>

                  <TouchableOpacity
                    style={[s.uploadBtn, { backgroundColor: aC.isDark ? '#1B2E5C' : '#e8eefb' }]}
                    onPress={() => pickAndUpload(doc.id)}
                    activeOpacity={0.8}
                    disabled={doc.uploading}
                  >
                    <Text style={[s.uploadBtnTxt, { color: doc.fileUrl ? "#34D399" : (aC.isDark ? '#F2F1F5' : '#032a69') }]}>
                      {doc.uploading ? '...' : doc.fileUrl ? "Update" : "Upload"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={{ flex: 1, minHeight: 40 }} />

            {/* Continue */}
            <TouchableOpacity style={s.submitWrap} activeOpacity={0.85} onPress={handleContinue} disabled={saving}>
              <LinearGradient colors={(aC.isDark ? PRIMARY_BTN_COLORS : ['#27467F', '#8C6A78', '#FF9654']) as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
                {saving
                  ? <ActivityIndicator color={WHITE} />
                  : <Text style={s.submitTxt}>Continue</Text>
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
  container: { flex: 1, backgroundColor: BG, paddingHorizontal: 14 },

  header:      { height: 60, marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn:     { width: 36, height: 36, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Poppins_500Medium" },

  progressWrap: { marginTop: 20, marginBottom: 12 },
  progressTxt:  { color: SUB, fontSize: 12, fontFamily: "Poppins_400Regular", marginBottom: 6 },

  card:  { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingTop: 14, paddingBottom: 12, overflow: "hidden", marginTop: 10, gap: 10 },
  intro: { fontSize: 12.5, fontFamily: "Poppins_400Regular", lineHeight: 19, marginBottom: 2 },
  row:   { flexDirection: "row", alignItems: "center", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, gap: 12 },

  iconWrap: { width: 40, height: 40, borderRadius: 8, backgroundColor: "#12306A", borderWidth: 1, borderColor: "#7E9FD6", alignItems: "center", justifyContent: "center", flexShrink: 0 },

  docInfo:  { flex: 1 },
  docTitle: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  docSub:   { fontSize: 10.5, fontFamily: "Poppins_400Regular", marginTop: 1 },
  uploaded: { color: "#34D399", fontSize: 10.5, fontFamily: "Poppins_500Medium", marginTop: 1 },

  uploadBtn:    { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16 },
  uploadBtnTxt: { fontSize: 11.5, fontFamily: "Poppins_500Medium" },

  submitWrap: { borderRadius: 30, overflow: "hidden" },
  submitGrad: { height: 50, justifyContent: "center", alignItems: "center" },
  submitTxt:  { color: "#EDEBF0", fontSize: 17, fontFamily: "Poppins_600SemiBold" },
});
