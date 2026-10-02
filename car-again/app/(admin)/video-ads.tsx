import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;

const USER_TYPES     = ['All Users', 'Buyers', 'Sellers'];
const CITIES         = ['All Cities', 'Karachi', 'Lahore', 'Islamabad'];
const LOCATIONS      = ['Home Screen Top', 'Home Screen Bottom', 'Search Results', 'Listing Detail'];
const PARTNERS       = ['Autowizor (Default)', 'PakWheels', 'OLX Autos'];

function GlassInset() {
  const aC = useAppColors();
  if (aC.isDark) {
    return (
      <>
        <LinearGradient colors={['rgba(22,64,136,0.2)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        <LinearGradient colors={['rgba(13,37,84,0.18)','transparent']} start={{x:0,y:0.5}} end={{x:0.45,y:0.5}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        <LinearGradient colors={['transparent','rgba(29,83,175,0.2)']} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      </>
    );
  }
  return (
    <>
      <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

export default function AdminVideoAdsScreen() {
  const router    = useRouter();
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
    if (!uploadedFile)      { Alert.alert('Video Required', 'Please upload a video file first.'); return; }

    setPublishing(true);
    try {
      const mediaUrl = await uploadMedia();
      if (!mediaUrl) throw new Error('Video upload failed. Please try again.');

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

          {/* HEADER */}
          <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color={aC.isDark ? AppColors.textPrimary : '#010a1f'} strokeWidth={2}/>
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Video Ads</Text>
            <TouchableOpacity style={s.draftTopBtn}>
              <Bookmark size={18} color={ORANGE} fill={ORANGE}/>
              <Text style={s.draftTopTxt}>Save Draft</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

            {/* RECOMMENDATION */}
            <View style={[s.recCard, { backgroundColor: aC.isDark ? AppColors.bg : '#ffffff', borderColor: aC.isDark ? 'rgba(226,103,27,0.4)' : 'rgba(3,42,105,0.12)' }]}>
              <LinearGradient colors={['transparent','rgba(226,103,27,0.35)']} start={{x:0.5,y:0.5}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <View style={s.recIconWrap}>
                <Lightbulb size={16} color={ORANGE} fill={'rgba(226,103,27,0.3)'}/>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.recTitle, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Recommendation</Text>
                <Text style={[s.recText, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>Video Ads are best for showcasing vehicles directly to interested buyers. Best for: Higher engagement & vehicle showcase</Text>
              </View>
            </View>

            {/* UPLOAD */}
            <TouchableOpacity style={[s.uploadBox, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)' }]} onPress={pickMedia} activeOpacity={0.8}>
              <Upload size={26} color={ORANGE}/>
              <Text style={[s.uploadTitle, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>{uploadedFile ? '✓ File selected' : '+ Upload video/img'}</Text>
              <Text style={[s.uploadSub, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>{uploadedFile ? uploadedFile.split('/').pop() : 'Tap to browse. Recommended 16:9 ratio.'}</Text>
            </TouchableOpacity>

            {/* VIDEO TITLE */}
            <Text style={[s.label, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Video Title</Text>
            <View style={[s.inputBox, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(99,148,214,0.4)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1 }]}>
              <GlassInset/>
              <TextInput
                style={[s.input, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}
                placeholder="e.g. Summer Auto Sale"
                placeholderTextColor={aC.isDark ? AppColors.textPlaceholder : "#94a3b8"}
                value={videoTitle}
                onChangeText={setVideoTitle}
              />
            </View>

            {/* DISPLAY LOCATION */}
            <Text style={[s.label, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Display Location</Text>
            <TouchableOpacity style={[s.dropdownBox, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(99,148,214,0.4)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1 }]} onPress={() => { setLocOpen(v => !v); setPartnerOpen(false); }} activeOpacity={0.8}>
              <GlassInset/>
              <Text style={[s.dropdownText, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>{location}</Text>
              <ChevronDown size={16} color={aC.isDark ? AppColors.textSecondary : "#475569"}/>
            </TouchableOpacity>
            {locOpen && (
              <View style={[s.dropMenu, { backgroundColor: aC.isDark ? '#0D1E3F' : '#ffffff', borderColor: aC.isDark ? 'rgba(80,123,182,0.4)' : 'rgba(3,42,105,0.12)' }]}>
                {LOCATIONS.map(opt => (
                  <TouchableOpacity key={opt} style={[s.dropItem, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(3,42,105,0.06)' }]} onPress={() => { setLocation(opt); setLocOpen(false); }}>
                    <Text style={[s.dropItemTxt, { color: opt === location ? ORANGE : (aC.isDark ? '#C8D3E8' : '#475569') }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* PARTNER */}
            <Text style={[s.label, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Partner Selection</Text>
            <TouchableOpacity style={[s.dropdownBox, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(99,148,214,0.4)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1 }]} onPress={() => { setPartnerOpen(v => !v); setLocOpen(false); }} activeOpacity={0.8}>
              <GlassInset/>
              <Text style={[s.dropdownText, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>{partner}</Text>
              <ChevronDown size={16} color={aC.isDark ? AppColors.textSecondary : "#475569"}/>
            </TouchableOpacity>
            {partnerOpen && (
              <View style={[s.dropMenu, { backgroundColor: aC.isDark ? '#0D1E3F' : '#ffffff', borderColor: aC.isDark ? 'rgba(80,123,182,0.4)' : 'rgba(3,42,105,0.12)' }]}>
                {PARTNERS.map(opt => (
                  <TouchableOpacity key={opt} style={[s.dropItem, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(3,42,105,0.06)' }]} onPress={() => { setPartner(opt); setPartnerOpen(false); }}>
                    <Text style={[s.dropItemTxt, { color: opt === partner ? ORANGE : (aC.isDark ? '#C8D3E8' : '#475569') }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* USER TYPE */}
            <Text style={[s.label, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>User Type</Text>
            <View style={s.chipsRow}>
              {USER_TYPES.map(t => (
                <TouchableOpacity key={t} style={[s.chip, { backgroundColor: aC.isDark ? AppColors.glassBg : (userType === t ? 'rgba(226,103,27,0.08)' : '#ffffff'), borderColor: aC.isDark ? 'rgba(255,255,255,0.1)' : (userType === t ? ORANGE : 'rgba(3,42,105,0.12)') }, userType === t && s.chipActive]} onPress={() => setUserType(t)}>
                  <Text style={[s.chipText, { color: userType === t ? ORANGE : (aC.isDark ? AppColors.textSecondary : '#475569') }, userType === t && s.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* CITIES */}
            <Text style={[s.label, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Cities</Text>
            <View style={s.chipsRow}>
              {CITIES.map(c => (
                <TouchableOpacity key={c} style={[s.chip, { backgroundColor: aC.isDark ? AppColors.glassBg : (city === c ? 'rgba(226,103,27,0.08)' : '#ffffff'), borderColor: aC.isDark ? 'rgba(255,255,255,0.1)' : (city === c ? ORANGE : 'rgba(3,42,105,0.12)') }, city === c && s.chipActive]} onPress={() => setCity(c)}>
                  <Text style={[s.chipText, { color: city === c ? ORANGE : (aC.isDark ? AppColors.textSecondary : '#475569') }, city === c && s.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[s.chipPlus, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)' }]}>
                <Plus size={14} color={aC.isDark ? AppColors.textSecondary : "#475569"}/>
              </TouchableOpacity>
            </View>

            {/* TERMS */}
            <TouchableOpacity style={s.termsRow} onPress={() => setAgreed(v => !v)}>
              {agreed
                ? <CheckCircle2 size={20} color={ORANGE} fill={ORANGE}/>
                : <Circle size={20} color={aC.isDark ? AppColors.textSecondary : "#475569"}/>
              }
              <Text style={[s.termsText, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>I confirm that I have read and accept the terms and conditions and privacy policy.</Text>
            </TouchableOpacity>

            <View style={{ height: 140 }}/>
          </ScrollView>

          {/* BOTTOM BUTTONS */}
          <View style={[s.bottomBar, { backgroundColor: aC.isDark ? 'rgba(1,10,31,0.96)' : '#ffffff', borderTopColor: aC.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(3,42,105,0.08)' }]}>
            <GlassInset/>
            <TouchableOpacity
              style={[s.publishBtn, (!agreed || publishing) && { opacity: 0.6 }]}
              onPress={handlePublish}
              disabled={publishing}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#c44e00', '#ff6900', '#ff9a00']}
                start={{x:0,y:0}} end={{x:1,y:0}}
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={['rgba(3,42,105,0.95)','rgba(3,42,105,0.65)','rgba(3,42,105,0.15)']}
                start={{x:0,y:0}} end={{x:1,y:0}}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              {publishing
                ? <><ActivityIndicator color="#fff" size="small"/><Text style={[s.publishTxt,{marginLeft:8}]}>{uploadedFile ? 'Uploading...' : 'Publishing...'}</Text></>
                : <Text style={s.publishTxt}>Publish Video Ad</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={[s.draftBtn, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderColor: aC.isDark ? 'rgba(99,148,214,0.5)' : 'rgba(3,42,105,0.12)' }]} activeOpacity={0.8}>
              <GlassInset/>
              <Text style={[s.draftTxt, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Save as Draft</Text>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>

      <AdminFooter active="home" />
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: AppColors.bg },
  safeArea:   { flex: 1, backgroundColor: AppColors.bg },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, height: 60 },
  backBtn:     { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: AppColors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  draftTopBtn: { alignItems: 'center', gap: 2 },
  draftTopTxt: { color: ORANGE, fontSize: 10, fontFamily: 'Poppins_500Medium' },

  scrollContent: { paddingHorizontal: 18, paddingTop: 4, gap: 14, paddingBottom: 20 },

  recCard: {
    flexDirection: 'row', gap: 12,
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(226,103,27,0.4)',
    backgroundColor: AppColors.bg, padding: 14, overflow: 'hidden',
  },
  recIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(226,103,27,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  recTitle:    { color: AppColors.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginBottom: 3 },
  recText:     { color: AppColors.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  uploadBox: {
    borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)', paddingVertical: 32,
    paddingHorizontal: 20, alignItems: 'center', gap: 10, backgroundColor: AppColors.glassBg,
  },
  uploadTitle: { color: AppColors.textPrimary, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  uploadSub:   { color: AppColors.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center' },

  label:       { color: AppColors.textPrimary, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  inputBox:    { borderRadius: 30, borderWidth: 1, borderColor: 'rgba(99,148,214,0.4)', backgroundColor: AppColors.glassBg, overflow: 'hidden', paddingHorizontal: 18, paddingVertical: 2 },
  input:       { height: 46, color: AppColors.textPrimary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  dropdownBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(99,148,214,0.4)', backgroundColor: AppColors.glassBg, overflow: 'hidden', paddingHorizontal: 18, paddingVertical: 14 },
  dropdownText:{ color: AppColors.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  dropMenu: { marginTop: -8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(80,123,182,0.4)', backgroundColor: '#0D1E3F', overflow: 'hidden', marginBottom: 4 },
  dropItem:  { paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dropItemTxt: { color: '#C8D3E8', fontSize: 13, fontFamily: 'Poppins_400Regular' },

  chipsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, backgroundColor: AppColors.glassBg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive:    { backgroundColor: 'rgba(226,103,27,0.15)', borderColor: ORANGE },
  chipText:      { color: AppColors.textSecondary, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  chipTextActive:{ color: ORANGE },
  chipPlus:      { width: 34, height: 34, borderRadius: 17, backgroundColor: AppColors.glassBg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  termsRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  termsText: { flex: 1, color: AppColors.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  bottomBar:  { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 28, backgroundColor: 'rgba(1,10,31,0.96)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', gap: 10 },
  publishBtn: { height: 50, borderRadius: 25, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  publishTxt: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  draftBtn:   { height: 50, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(99,148,214,0.5)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.glassBg },
  draftTxt:   { color: AppColors.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
});
