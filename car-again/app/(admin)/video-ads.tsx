import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronLeft, Bookmark, Lightbulb, Upload,
  ChevronDown, Plus, Circle, CheckCircle2,
} from 'lucide-react-native';
import { AppColors, useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import AdminFooter from '@/components/admin/AdminFooter';
import {
  AddChip, BottomActions, Chip as DChip, DField, DHeader, DSelect, SaveDraftAction, TermsRow, UploadBox, dk,
} from '@/components/dealer/DealerUI';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';

const VIDEO_TYPES = ['Discover', 'latest Review', 'Homepage Hero'];
import { SavedCardEffect } from "@/components/shared/FigmaEffects";
import { ActionFooter, GlowPublishButton, GlowDraftButton } from "@/components/shared/ActionFooterGlow";

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;

const USER_TYPES     = ['All Users', 'Buyers', 'Sellers'];
const CITIES         = ['All Cities', 'Karachi', 'Lahore', 'Islamabad'];
const LOCATIONS      = ['Home Screen Top', 'Home Screen Bottom', 'Search Results', 'Listing Detail'];
const PARTNERS       = ['Autowizor (Default)', 'PakWheels', 'OLX Autos'];

function GlassInset() {
  const aC = useAppColors();
  if (aC.isDark) return <SavedCardEffect band={12} />;
  return (
    <>
      <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

export default function AdminVideoAdsScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const { token } = useAuth();
  const aC = useAppColors();

  const [videoTitle,   setVideoTitle]   = useState('');
  const [userType,     setUserType]     = useState('All Users');
  const [city,         setCity]         = useState('All Cities');
  const [location,     setLocation]     = useState('Home Screen Top');
  const [partner,      setPartner]      = useState('Autowizor (Default)');
  const [agreed,       setAgreed]       = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [publishing,   setPublishing]   = useState(false);
  const [locOpen,      setLocOpen]      = useState(false);
  const [partnerOpen,  setPartnerOpen]  = useState(false);
  const [videoType,    setVideoType]    = useState('Discover');

  async function pickMedia() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow access to your media library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'] as any,
      quality: 0.8,
    });
    if (!result.canceled) setUploadedFile(result.assets[0].uri);
  }

  async function uploadMedia(): Promise<string | null> {
    if (!uploadedFile) return null;
    const BASE    = API_BASE.replace('/api/v1', '');
    const isVid   = uploadedFile.match(/\.(mp4|mov|avi|mkv|webm)$/i) || uploadedFile.includes('video');
    const endpoint = isVid ? `${API_BASE}/upload/video` : `${API_BASE}/upload/image`;
    const mime     = isVid ? 'video/mp4' : 'image/jpeg';
    const name     = isVid ? `video_${Date.now()}.mp4` : `img_${Date.now()}.jpg`;
    const form = new FormData();
    form.append('file', { uri: uploadedFile, type: mime, name } as any);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.ok) {
        const d = await res.json();
        return `${BASE}${d.url}`;
      }
    } catch {}
    return null;
  }

  async function handlePublish() {
    if (!agreed)            { Alert.alert('Terms Required', 'Please accept the terms and conditions.'); return; }
    if (!videoTitle.trim()) { Alert.alert('Title Required', 'Please enter a video title.'); return; }

    setPublishing(true);
    try {
      const mediaUrl = await uploadMedia();

      const res = await fetch(`${API_BASE}/video-ads/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:            videoTitle.trim(),
          user_type:        userType,
          cities:           city === 'All Cities' ? [] : [city],
          media_url:        mediaUrl,
          display_location: location,
          partner:          partner.replace(' (Default)', ''),
        }),
      });

      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed to publish'); }

      Alert.alert('Published!', 'Video Ad published successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not publish video ad.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <View style={[s.container, { backgroundColor: aC.bg }]}>
      <SafeAreaView style={[s.safeArea, { backgroundColor: aC.bg }]} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

            {/* HEADER */}
            <View style={{ marginHorizontal: -16 }}>
              <DHeader title="Video Ads" center right={<SaveDraftAction onPress={() => Alert.alert('Saved', 'Video Ad saved as draft.')} />} />
            </View>

            {/* UPLOAD */}
            <View style={{ marginTop: 8, alignItems: 'center' }}>
              <View style={{ width: '88%' }}>
                <UploadBox title="+ Upload video/img" sub="Drag & drop or click to browse. Recommended 16:9 / 9:16 ratio." onPress={pickMedia}>
                  {uploadedFile ? (
                    <View style={{ alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: '#22c55e', fontSize: 13, fontFamily: 'Poppins_500Medium' }}>✓ File selected</Text>
                      <Text style={{ color: '#BAACB6', fontSize: 11, fontFamily: 'Poppins_400Regular' }} numberOfLines={1}>{uploadedFile.split('/').pop()}</Text>
                    </View>
                  ) : undefined}
                </UploadBox>
              </View>
            </View>

            <Text style={dk.label}>Video Type</Text>
            <View style={s.chipsRow}>
              {VIDEO_TYPES.map(t => <DChip key={t} small label={t} selected={videoType === t} onPress={() => setVideoType(t)} />)}
            </View>

            <Text style={dk.label}>Video Title</Text>
            <DField value={videoTitle} onChangeText={setVideoTitle} placeholder="e.g. Summer Auto Sale" />

            <Text style={dk.label}>Display Location</Text>
            <DSelect value={location} onPress={() => { setLocOpen(v => !v); setPartnerOpen(false); }} />
            {locOpen && (
              <View style={s.dropMenu}>
                {LOCATIONS.map(opt => (
                  <TouchableOpacity key={opt} style={s.dropItem} onPress={() => { setLocation(opt); setLocOpen(false); }}>
                    <Text style={[s.dropItemTxt, opt === location && { color: ORANGE }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={dk.label}>Partner Selection</Text>
            <DSelect value={partner} onPress={() => { setPartnerOpen(v => !v); setLocOpen(false); }} />
            {partnerOpen && (
              <View style={s.dropMenu}>
                {PARTNERS.map(opt => (
                  <TouchableOpacity key={opt} style={s.dropItem} onPress={() => { setPartner(opt); setPartnerOpen(false); }}>
                    <Text style={[s.dropItemTxt, opt === partner && { color: ORANGE }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={dk.label}>Audience Targeting</Text>
            <Text style={s.subLabel}>User Type</Text>
            <View style={s.chipsRow}>
              {USER_TYPES.map(t => <DChip key={t} small label={t} selected={userType === t} onPress={() => setUserType(t)} />)}
              <AddChip small />
            </View>
            <Text style={[s.subLabel, { marginTop: 12 }]}>Cities</Text>
            <View style={s.chipsRow}>
              {CITIES.map(c => <DChip key={c} small label={c} selected={city === c} onPress={() => setCity(c)} />)}
              <AddChip small />
            </View>

            <TermsRow checked={agreed} onToggle={() => setAgreed(v => !v)} />

            <View style={{ height: 190 }} />
          </ScrollView>

          {/* FOOTER BUTTONS */}
          <ActionFooter style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom + 12, 22) }}>
            <GlowPublishButton title="Publish  Reel" loadingTitle={uploadedFile ? 'Uploading...' : 'Publishing...'}
              loading={publishing} onPress={handlePublish} />
            <GlowDraftButton title="Save as Draft" onPress={() => Alert.alert('Saved', 'Video Ad saved as draft.')} />
          </ActionFooter>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: AppColors.bg },
  safeArea:      { flex: 1, backgroundColor: AppColors.bg },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 },
  subLabel:      { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
  chipsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dropMenu:      { marginTop: 4, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(80,123,182,0.4)', backgroundColor: '#0D1E3F', overflow: 'hidden', marginBottom: 4 },
  dropItem:      { paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dropItemTxt:   { color: '#C8D3E8', fontSize: 13, fontFamily: 'Poppins_400Regular' },
});
