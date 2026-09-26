import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/constants/api";

const BG     = "#010a1f";
const WHITE  = "#f9fafc";
const SUB    = "#baacb6";
const ORANGE = "#e2671b";
const BORDER = "rgba(49,95,173,0.8)";
const SHADOW = "#1D53AF";

type DocumentItem = {
  id: string;
  title: string;
  subtitle: string;
  file?: DocumentPicker.DocumentPickerAsset;
};

const Documents = () => {
  const router = useRouter();
  const aC = useAppColors();
  const { token } = useAuth();
  const SERVER = API_BASE.replace('/api/v1', '');

  const [documents, setDocuments] = useState<DocumentItem[]>([
    { id: "cnic",    title: "CNIC (Front & Back)",     subtitle: "PDF / JPG up to 5MB" },
    { id: "salary",  title: "Salary Slip (Latest)",    subtitle: "PDF / JPG up to 5MB" },
    { id: "bank",    title: "Bank Statement (Latest)", subtitle: "PDF / JPG up to 5MB" },
    { id: "utility", title: "Utility Bill",            subtitle: "PDF / JPG up to 5MB" },
  ]);
  const [preview, setPreview] = useState<{ uri: string; title: string } | null>(null);

  // Load saved docs so they remain there after save and on next open
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/documents/`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const list: any[] = await res.json();
        if (!Array.isArray(list) || !list.length) return;
        setDocuments(prev => prev.map(d => {
          const m = list.find((x: any) => x.type === d.title);
          if (m?.file_url) {
            const url = m.file_url.startsWith('http') ? m.file_url : `${SERVER}${m.file_url}`;
            const name = url.split('/').pop() || 'Uploaded';
            return { ...d, file: { uri: url, name, mimeType: 'image/jpeg' } as any };
          }
          return d;
        }));
      } catch {}
    })();
  }, [token]);

  const pickDocument = async (id: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const selectedFile = result.assets[0];
        if (selectedFile.size && selectedFile.size > 5 * 1024 * 1024) {
          Alert.alert("File too large", "Please select a file smaller than 5MB.");
          return;
        }
        setDocuments(prev =>
          prev.map(doc => doc.id === id ? { ...doc, file: selectedFile } : doc)
        );
      }
    } catch {
      Alert.alert("Error", "Unable to select document.");
    }
  };

  const handleUpload = async () => {
    const uploaded = documents.filter(doc => doc.file);
    if (uploaded.length === 0) {
      Alert.alert("Upload Documents", "Please upload at least one document.");
      return;
    }
    if (!token) { Alert.alert("Login Required", "Please login to upload."); return; }
    try {
      for (const doc of uploaded) {
        const file = doc.file!;
        const form = new FormData();
        form.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/pdf' } as any);
        const upRes = await fetch(`${API_BASE}/upload/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!upRes.ok) throw new Error('Upload failed');
        const { url } = await upRes.json();
        await fetch(`${API_BASE}/documents/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ type: doc.title, desc: doc.subtitle, file_url: url }),
        });
      }
      Alert.alert("Success", "Documents saved in Documents section.");
      // stay on same page — do NOT navigate to insurance payment
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not save documents.");
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={["top"]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      <View style={[s.container, { backgroundColor: aC.bg }]}>

        {/* Header */}
        <View style={[s.header, { borderBottomColor: aC.isDark ? 'rgba(49,95,173,0.4)' : 'rgba(3,12,40,0.12)' }]}>
          <TouchableOpacity style={[s.backBtn, { backgroundColor: aC.isDark ? 'rgba(6,17,60,0.85)' : '#dde8ff' }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={aC.textPrimary} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: aC.textPrimary }]}>Documents</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Documents Card */}
        <View style={[s.card, { backgroundColor: aC.glassBg, borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.2)' }]}>
          {aC.isDark && <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
          {aC.isDark && <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
          {aC.isDark && <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
          {documents.map((doc, index) => (
            <View
              key={doc.id}
              style={[s.row, { backgroundColor: aC.isDark ? 'rgba(6,17,60,0.6)' : 'rgba(220,230,255,0.6)', borderColor: aC.isDark ? 'rgba(49,95,173,0.3)' : 'rgba(3,42,105,0.15)' }, index === documents.length - 1 && { marginBottom: 0 }]}
            >
              {/* Icon */}
              <View style={[s.iconWrap, { backgroundColor: aC.isDark ? '#010a1f' : '#eef1ff' }]}>
                <Ionicons
                  name={doc.file ? "document-text" : "cloud-upload-outline"}
                  size={20}
                  color={ORANGE}
                />
              </View>

              {/* Text */}
              <View style={s.docInfo}>
                <Text style={[s.docTitle, { color: aC.textPrimary }]} numberOfLines={1}>{doc.title}</Text>
                {doc.file
                  ? <Text style={s.fileName} numberOfLines={1}>{doc.file.name}</Text>
                  : <Text style={[s.docSub, { color: aC.textSecondary }]}>{doc.subtitle}</Text>
                }
              </View>

              {/* View + Upload Buttons */}
              {doc.file ? (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[s.uploadBtn, { backgroundColor: 'rgba(226,103,27,0.12)', borderColor: ORANGE, paddingHorizontal: 10 }]}
                    onPress={() => setPreview({ uri: doc.file!.uri, title: doc.title })}
                  >
                    <Ionicons name="eye-outline" size={14} color={ORANGE} />
                    <Text style={[s.uploadBtnTxt, { color: ORANGE, marginLeft: 4 }]}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[s.uploadBtn, { backgroundColor: aC.isDark ? '#010a1f' : '#eef1ff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.3)' }, s.uploadedBtn]}
                    onPress={() => pickDocument(doc.id)}
                  >
                    <Text style={[s.uploadBtnTxt, { color: aC.textPrimary }]}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[s.uploadBtn, { backgroundColor: aC.isDark ? '#010a1f' : '#eef1ff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.3)' }]}
                  onPress={() => pickDocument(doc.id)}
                >
                  <Text style={[s.uploadBtnTxt, { color: aC.textPrimary }]}>Upload</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <View style={s.bottomWrap}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={s.submitWrap}
            onPress={handleUpload}
          >
            <LinearGradient
              colors={["#032a69", ORANGE]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.submitGradient}
            >
              <Text style={s.submitTxt}>Upload Documents</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </View>

      {/* Preview Modal — View */}
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxHeight: '80%', backgroundColor: '#010a1f', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ color: WHITE, fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>{preview?.title}</Text>
              <TouchableOpacity onPress={() => setPreview(null)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={18} color={WHITE} />
              </TouchableOpacity>
            </View>
            {preview?.uri ? (
              preview.uri.toLowerCase().endsWith('.pdf') ? (
                <View style={{ padding: 40, alignItems: 'center', gap: 12 }}>
                  <Ionicons name="document-text-outline" size={48} color={ORANGE} />
                  <Text style={{ color: SUB, fontFamily: 'Poppins_400Regular', fontSize: 13 }}>{preview.uri.split('/').pop()}</Text>
                  <Text style={{ color: WHITE, fontFamily: 'Poppins_500Medium', fontSize: 12 }}>PDF — tap close to return</Text>
                </View>
              ) : (
                <Image source={{ uri: preview.uri }} style={{ width: '100%', height: 400 }} resizeMode="contain" />
              )
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Documents;

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG, paddingHorizontal: 20 },

  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(49,95,173,0.4)",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(6,17,60,0.85)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18, fontFamily: "Poppins_600SemiBold", color: WHITE,
  },

  card: {
    marginTop: 24,
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)',
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
  },

  row: {
    height: 56,
    backgroundColor: "rgba(6,17,60,0.6)",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "rgba(49,95,173,0.3)",
  },

  iconWrap: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: BG,
    borderWidth: 1, borderColor: ORANGE,
    alignItems: "center", justifyContent: "center",
    marginRight: 10,
  },

  docInfo:  { flex: 1, justifyContent: "center", paddingRight: 8 },
  docTitle: { color: WHITE, fontSize: 13, fontFamily: "Poppins_500Medium", marginBottom: 2 },
  docSub:   { color: SUB, fontSize: 10, fontFamily: "Poppins_400Regular" },
  fileName: { color: ORANGE, fontSize: 9, fontFamily: "Poppins_400Regular" },

  uploadBtn: {
    minWidth: 64, height: 28, paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: BG,
    borderWidth: 1, borderColor: BORDER,
    alignItems: "center", justifyContent: "center",
  },
  uploadedBtn: {
    borderColor: ORANGE,
  },
  uploadBtnTxt: { color: WHITE, fontSize: 10, fontFamily: "Poppins_500Medium" },

  bottomWrap:     { flex: 1, justifyContent: "flex-end", paddingBottom: 90 },
  submitWrap:     { height: 50, borderRadius: 32, overflow: "hidden" },
  submitGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
  submitTxt:      { color: WHITE, fontSize: 15, fontFamily: "Poppins_600SemiBold" },
});
