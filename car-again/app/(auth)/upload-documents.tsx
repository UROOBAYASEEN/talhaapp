import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Upload, CheckCircle } from 'lucide-react-native';
import { ShieldCheck } from 'lucide-react-native';
import AuthHeader from '@/components/auth/AuthHeader';
import LinearButton from '@/components/auth/LinearButton';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#e2671b';

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

function DocRow({ title, hint, uri, onPick }: { title: string; hint: string; uri: string | null; onPick: () => void }) {
  const C = useAppColors();
  return (
    <TouchableOpacity style={[d.row, { backgroundColor: C.glassBg, borderColor: uri ? ORANGE : 'rgba(100,160,255,0.4)' }]} onPress={onPick}>
      <GlassInset/>
      <View style={d.info}>
        <Text style={[d.docTitle, { color: C.textPrimary }]}>{title}</Text>
        <Text style={[d.docHint, { color: C.textSecondary }]}>{uri ? 'Uploaded ✓' : hint}</Text>
      </View>
      <View style={[d.btn, { backgroundColor: uri ? 'rgba(226,103,27,0.15)' : 'rgba(100,160,255,0.1)' }]}>
        {uri
          ? <CheckCircle size={20} color={ORANGE}/>
          : <Upload size={20} color="rgba(100,160,255,0.8)"/>
        }
      </View>
    </TouchableOpacity>
  );
}

const d = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12, overflow: 'hidden', gap: 12 },
  info:     { flex: 1 },
  docTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  docHint:  { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  btn:      { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

export default function UploadDocumentsScreen() {
  const router  = useRouter();
  const C       = useAppColors();
  const { token } = useAuth();
  const { role, access_token, refresh_token } = useLocalSearchParams<{ role: string; access_token: string; refresh_token: string }>();

  const [avatar,     setAvatar]    = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto]= useState<string | null>(null);
  const [cnicFront,  setCnicFront] = useState<string | null>(null);
  const [cnicBack,   setCnicBack]  = useState<string | null>(null);
  const [license,    setLicense]   = useState<string | null>(null);
  const [bizReg,     setBizReg]    = useState<string | null>(null);
  const [storePhoto, setStorePhoto]= useState<string | null>(null);
  const [loading,    setLoading]   = useState(false);
  const [uploadStep, setUploadStep]= useState('');

  const SERVER = API_BASE.replace('/api/v1', '');

  async function pickDoc(onSelect: (uri: string) => void) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any, allowsEditing: false, quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) onSelect(result.assets[0].uri);
  }

  // Upload a local URI to the server, return the full server URL
  async function uploadToServer(localUri: string, authToken: string): Promise<string | null> {
    try {
      const ext  = (localUri.split('.').pop() || 'jpg').toLowerCase();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      const form = new FormData();
      form.append('file', { uri: localUri, name: `doc_${Date.now()}.${ext}`, type: mime } as any);
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: form,
      });
      if (!res.ok) return null;
      const { url } = await res.json();
      return url.startsWith('http') ? url : `${SERVER}${url}`;
    } catch {
      return null;
    }
  }

  async function handleContinue() {
    if (!cnicFront || !cnicBack) {
      Alert.alert('Required', 'Please upload CNIC front and back.');
      return;
    }
    setLoading(true);
    try {
      const authToken = access_token || token;
      if (!authToken) throw new Error('Not authenticated');

      // Upload each local image to server first
      const toUpload: [string | null, string][] = [
        [avatar,      'Profile Photo'],
        [coverPhoto,  'Cover Photo'],
        [cnicFront,   'CNIC Front'],
        [cnicBack,    'CNIC Back'],
        [license,     'License'],
        [bizReg,      'Business Registration'],
        [storePhoto,  'Store Photo'],
      ];

      const urls: (string | null)[] = [];
      for (const [uri, label] of toUpload) {
        if (uri && uri.startsWith('file')) {
          setUploadStep(`Uploading ${label}...`);
          const serverUrl = await uploadToServer(uri, authToken);
          urls.push(serverUrl);
        } else {
          urls.push(uri); // already a server URL or null
        }
      }

      const [avatarUrl, coverUrl, cnicFrontUrl, cnicBackUrl, licenseUrl, bizRegUrl, storePhotoUrl] = urls;

      setUploadStep('Saving documents...');
      const res = await fetch(`${API_BASE}/users/me/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          avatar:                avatarUrl,
          cover_photo:           coverUrl,
          cnic_front:            cnicFrontUrl,
          cnic_back:             cnicBackUrl,
          license:               licenseUrl,
          business_registration: bizRegUrl,
          store_photo:           storePhotoUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        Alert.alert('Error', err.detail || 'Failed to save documents');
        return;
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to upload documents');
      return;
    } finally {
      setLoading(false);
      setUploadStep('');
    }
    router.push({ pathname: '/(auth)/verification-status', params: { role: role || '', access_token: access_token || '', refresh_token: refresh_token || '' } });
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <AuthHeader/>
        <Text style={[s.title, { color: C.textPrimary }]}>Upload Documents</Text>
        <Text style={[s.subtitle, { color: C.textSecondary }]}>Upload required documents to verify your account</Text>

        <DocRow title="Profile Photo (DP)"   hint="Upload your profile picture (optional)"     uri={avatar}     onPick={() => pickDoc(setAvatar)}/>
        <DocRow title="Cover Photo"           hint="Upload a cover/banner photo (optional)"      uri={coverPhoto} onPick={() => pickDoc(setCoverPhoto)}/>
        <DocRow title="CNIC (Front)"          hint="Upload front side of CNIC *required*"        uri={cnicFront}  onPick={() => pickDoc(setCnicFront)}/>
        <DocRow title="CNIC (Back)"           hint="Upload back side of CNIC *required*"         uri={cnicBack}   onPick={() => pickDoc(setCnicBack)}/>
        <DocRow title="License"               hint="Upload driving / business license (optional)" uri={license}    onPick={() => pickDoc(setLicense)}/>
        <DocRow title="Business Registration" hint="Upload business reg. certificate (optional)"  uri={bizReg}     onPick={() => pickDoc(setBizReg)}/>
        <DocRow title="Store / Office Photo"  hint="Upload a photo of your store or office"       uri={storePhoto} onPick={() => pickDoc(setStorePhoto)}/>

        <View style={[s.secNote, { backgroundColor: 'rgba(22,64,136,0.12)', borderColor: 'rgba(100,160,255,0.2)' }]}>
          <ShieldCheck size={18} color="rgba(100,160,255,0.7)"/>
          <Text style={[s.secText, { color: C.textSecondary }]}>Your documents are encrypted and stored securely. Only used for account verification.</Text>
        </View>

        <View style={{ height: 16 }}/>
        {loading && uploadStep ? (
          <View style={[s.progressBox, { backgroundColor: 'rgba(22,64,136,0.15)', borderColor: 'rgba(100,160,255,0.3)' }]}>
            <ActivityIndicator size="small" color={ORANGE} />
            <Text style={[s.progressTxt, { color: C.textSecondary }]}>{uploadStep}</Text>
          </View>
        ) : null}
        <LinearButton title="Submit & Continue" onPress={handleContinue} loading={loading}/>
        <View style={{ height: 32 }}/>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { paddingHorizontal: 20, paddingBottom: 48 },
  title:   { fontSize: 20, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  subtitle:{ fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 20 },
  secNote:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 4 },
  secText:     { flex: 1, fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16 },
  progressBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 10 },
  progressTxt: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
});
