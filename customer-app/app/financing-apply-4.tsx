import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal, Image, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { AppColors, useAppColors } from '@/constants/theme';
import { PRIMARY_BTN_COLORS, RingGlow, SavedCardEffect } from '@/components/shared/FigmaEffects';

import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import * as WebBrowser from 'expo-web-browser';

const BG     = '#010a1f';
const WHITE  = '#f9fafc';
const SUB    = '#baacb6';
const ORANGE = '#e2671b';
const BORDER = 'rgba(49,95,173,0.8)';
const STEPS  = [1, 2, 3, 4];

type DocumentItem = {
  id:       string;
  docType:  string;
  title:    string;
  subtitle: string;
  file?:    DocumentPicker.DocumentPickerAsset;
  uploadedUrl?: string;
};

function StepIndicator({ activeStep }: { activeStep: number }) {
  const aC = useAppColors();
  return (
    <View style={si.row}>
      {STEPS.map((step, idx) => (
        <View key={step} style={si.item}>
          <View style={[
            si.circle,
            { backgroundColor: aC.isDark ? '#0B2A63' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)' },
            step === activeStep && { backgroundColor: aC.isDark ? '#010A1F' : 'rgba(226,103,27,0.10)', borderColor: aC.isDark ? '#82a5d5' : '#e2671b' },
          ]}>
            {step === activeStep && aC.isDark && <SavedCardEffect band={9} />}
            <Text style={[
              si.num,
              { color: aC.isDark ? '#F2F1F5' : '#475569' },
              step === activeStep && { color: aC.isDark ? '#fff' : '#e2671b' },
            ]}>{step}</Text>
          </View>
          {idx < STEPS.length - 1 && <View style={[si.line, { backgroundColor: aC.isDark ? '#1E3F7C' : 'rgba(3,42,105,0.12)' }]} />}
        </View>
      ))}
    </View>
  );
}
const si = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 0 },
  item:        { flexDirection: 'row', alignItems: 'center' },
  circle:      { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#1e3a8a', backgroundColor: '#0e1a3d', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  circleActive:{ borderColor: '#3b6fe0', backgroundColor: '#173066' },
  num:         { color: '#cbd5e1', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  numActive:   { color: '#fff' },
  line:        { width: 44, height: 1, backgroundColor: '#1e3a8a' },
});

export default function FinancingApply4Screen() {
  const router      = useRouter();
  const params      = useLocalSearchParams();
  const { token, user }   = useAuth();
  const aC = useAppColors();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [documents, setDocuments] = useState<DocumentItem[]>([
    { id: 'cnic',    docType: 'CNIC',           title: 'CNIC (Front & Back)',     subtitle: 'PDF / JPG up to 5MB' },
    { id: 'salary',  docType: 'SalarySlip',     title: 'Salary Slip (Latest)',    subtitle: 'PDF / JPG up to 5MB' },
    { id: 'bank',    docType: 'BankStatement',  title: 'Bank Statement (Latest)', subtitle: 'PDF / JPG up to 5MB' },
    { id: 'utility', docType: 'UtilityBill',    title: 'Utility Bill',            subtitle: 'PDF / JPG up to 5MB' },
  ]);

  // ── Auto-prefill from profile documents (view/update only) ──
  React.useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const SERVER = API_BASE.replace('/api/v1','');
        // try generic documents endpoint + user-specific docs
        const urls = [`${API_BASE}/documents/`, user?.id ? `${API_BASE}/documents/user/${(user as any).id}` : null].filter(Boolean) as string[];
        let existing: any[] = [];
        for (const u of urls) {
          try {
            const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
            if (r.ok) {
              const d = await r.json();
              if (Array.isArray(d)) existing.push(...d);
              else if (Array.isArray(d.items)) existing.push(...d.items);
            }
          } catch {}
        }
        if (!existing.length) return;
        setDocuments(prev => prev.map(doc => {
          if (doc.uploadedUrl || doc.file) return doc;
          const needle = doc.docType.toLowerCase();
          const idNeedle = doc.id.toLowerCase();
          const matched = existing.find((e: any) => {
            const t = String(e.type || e.doc_type || '').toLowerCase();
            const name = String(e.file_url || e.url || '').toLowerCase();
            return t.includes(needle) || t.includes(idNeedle) || needle.includes(t) || name.includes(idNeedle);
          });
          if (matched) {
            const raw = matched.file_url || matched.url || matched.fileUrl;
            if (raw) {
              const full = raw.startsWith('http') ? raw : `${SERVER}${raw}`;
              return { ...doc, uploadedUrl: full };
            }
          }
          return doc;
        }));
      } catch {}
    })();
  }, [token, user]);

  async function pickDocument(id: string) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('File too large', 'Please select a file smaller than 5MB.');
          return;
        }
        setDocuments(prev => prev.map(d => d.id === id ? { ...d, file, uploadedUrl: undefined } : d));
      }
    } catch {
      Alert.alert('Error', 'Unable to select document.');
    }
  }

  async function uploadFile(file: DocumentPicker.DocumentPickerAsset): Promise<string | null> {
    const SERVER = API_BASE.replace('/api/v1', '');
    const form   = new FormData();
    const isImg  = file.mimeType?.startsWith('image/');
    form.append('file', { uri: file.uri, type: file.mimeType || 'application/pdf', name: file.name } as any);
    try {
      const endpoint = isImg ? `${API_BASE}/upload/image` : `${API_BASE}/upload/image`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.ok) {
        const d = await res.json();
        return `${SERVER}${d.url}`;
      }
    } catch {}
    return null;
  }

  async function handleSubmit() {
    const ready = documents.filter(d => d.file || d.uploadedUrl);
    if (ready.length === 0) {
      Alert.alert('Upload Documents', 'Please upload at least one document.');
      return;
    }

    setUploading(true);
    const uploadedDocs: { docType: string; url: string }[] = [];
    for (const doc of documents) {
      if (doc.file) {
        const url = await uploadFile(doc.file);
        if (url) uploadedDocs.push({ docType: doc.docType, url });
      } else if (doc.uploadedUrl) {
        uploadedDocs.push({ docType: doc.docType, url: doc.uploadedUrl });
      }
    }
    setUploading(false);

    router.push({
      pathname: '/financing-review' as any,
      params: {
        ...params,
        docUrls:   JSON.stringify(uploadedDocs.map(d => d.url)),
        docTypes:  JSON.stringify(uploadedDocs.map(d => d.docType)),
      },
    });
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>

      <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: 0 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <ChevronLeft size={26} color={aC.isDark ? '#C9C6D0' : '#010a1f'} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Apply</Text>
        <View style={{ width: 36 }} />
      </View>

      <StepIndicator activeStep={4} />

      <View style={[s.container, { backgroundColor: aC.bg }]}>
        <View style={[s.card, aC.isDark ? { backgroundColor: '#010A1F', borderColor: '#82a5d5', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 } : { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)', shadowColor: 'rgba(3,42,105,0.12)', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }]}>
          {aC.isDark ? (
            <SavedCardEffect />
          ) : (
            <>

            </>
          )}

          <Text style={[s.cardTitle, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Upload the documents required for {String(params.employmentType || 'salaried').toLowerCase()} applicants.</Text>

          {documents.map((doc, index) => {
            const isReady = !!(doc.file || doc.uploadedUrl);
            return (
            <View key={doc.id} style={[s.row, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.04, elevation: aC.isDark ? 0 : 1 }, index === documents.length - 1 && { marginBottom: 0 }, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
              <View style={[s.iconWrap, { backgroundColor: aC.isDark ? '#12306A' : '#f1f5f9', borderColor: isReady ? 'rgba(34,197,94,0.6)' : (aC.isDark ? '#7E9FD6' : ORANGE) }]}>
                {isReady
                  ? <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  : <MaterialCommunityIcons name="tray-arrow-up" size={22} color={ORANGE} />}
              </View>
              <View style={s.docInfo}>
                <Text style={[s.docTitle, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={1}>{doc.title}</Text>
                {doc.file
                  ? <Text style={s.fileName} numberOfLines={1}>{doc.file.name}</Text>
                  : doc.uploadedUrl
                    ? <Text style={[s.fileName, { color: '#22c55e' }]}>✓ Uploaded (from profile)</Text>
                    : <Text style={[s.docSub, { color: aC.isDark ? SUB : '#475569' }]}>{doc.subtitle}</Text>
                }
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {doc.uploadedUrl && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[s.uploadBtn, { minWidth: 56, backgroundColor: aC.isDark ? BG : '#f8fafc', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]}
                    onPress={async () => {
                      const url = doc.uploadedUrl!;
                      const isPdf = url.toLowerCase().endsWith('.pdf');
                      if (isPdf) {
                        try { await WebBrowser.openBrowserAsync(url, { toolbarColor: aC.bg, controlsColor: '#22c55e', presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET } as any); }
                        catch { setPreviewUrl(url); }
                      } else {
                        setPreviewUrl(url);
                      }
                    }}
                  >
                    <Text style={[s.uploadBtnTxt, { color: '#22c55e', fontSize: 10 }]}>View</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[s.uploadBtn, { backgroundColor: aC.isDark ? '#1B2E5C' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)' }, isReady && s.uploadedBtn]}
                  onPress={() => pickDocument(doc.id)}
                >
                  <Text style={[s.uploadBtnTxt, { color: aC.isDark ? WHITE : '#010a1f' }]}>{isReady ? 'Update' : 'Upload'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );})}
        </View>

        <View style={s.bottomWrap}>
          <TouchableOpacity activeOpacity={0.85} style={s.submitWrap} onPress={handleSubmit} disabled={uploading}>
            <LinearGradient colors={(aC.isDark ? PRIMARY_BTN_COLORS : ['#27467F', '#8C6A78', '#FF9654']) as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGradient}>
              {uploading
                ? <ActivityIndicator color={WHITE} size="small" />
                : <Text style={s.submitTxt}>Continue</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* In-App Document Preview (Image) */}
      <Modal visible={!!previewUrl} transparent animationType="fade" onRequestClose={() => setPreviewUrl(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity onPress={() => setPreviewUrl(null)} style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          {previewUrl && (
            previewUrl.toLowerCase().endsWith('.pdf')
              ? <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="document-text-outline" size={64} color="#fff" />
                  <Text style={{ color: '#fff', marginTop: 12, fontFamily: 'Poppins_500Medium', textAlign: 'center' }}>PDF Preview</Text>
                  <TouchableOpacity onPress={() => { const u = previewUrl; setPreviewUrl(null); WebBrowser.openBrowserAsync(u, { toolbarColor: aC.bg } as any); }} style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: ORANGE }}>
                    <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>Open PDF</Text>
                  </TouchableOpacity>
                </View>
              : <Image source={{ uri: previewUrl }} style={{ width: '100%', height: '75%', borderRadius: 12 }} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: BG },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 6, paddingBottom: 0 },
  backBtn:   { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle:{ fontSize: 20, fontFamily: 'Poppins_500Medium', color: WHITE },
  container: { flex: 1, paddingHorizontal: 14 },
  card: { marginTop: 4, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12, overflow: 'hidden' },
  cardTitle: { fontSize: 12.5, fontFamily: 'Poppins_400Regular', lineHeight: 19, marginBottom: 10 },
  row:       { height: 58, borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginBottom: 10, borderWidth: 0.5 },
  iconWrap:  { width: 40, height: 40, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  docInfo:   { flex: 1, justifyContent: 'center', paddingRight: 8 },
  docTitle:  { color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium', marginBottom: 1 },
  docSub:    { color: SUB, fontSize: 10.5, fontFamily: 'Poppins_400Regular' },
  fileName:  { color: ORANGE, fontSize: 9, fontFamily: 'Poppins_400Regular' },
  uploadBtn:     { minWidth: 72, height: 30, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  uploadedBtn:   { borderColor: ORANGE },
  uploadBtnTxt:  { color: WHITE, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  bottomWrap:     { flex: 1, justifyContent: 'flex-end', paddingBottom: 40 },
  submitWrap:     { height: 50, borderRadius: 26, overflow: 'hidden' },
  submitGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  submitTxt:      { color: '#EDEBF0', fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
});
