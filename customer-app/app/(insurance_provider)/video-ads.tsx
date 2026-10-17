import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { saveDraft, getDraft } from '@/constants/draftApi';
import {
  ChevronLeft, Bookmark, Lightbulb, Upload,
  ChevronDown, Flame, CheckCircle2, Circle, X, Zap,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  AddChip, BottomActions, Chip as DChip, DField, DHeader, DSelect, PlanOption, PromoCard, SaveDraftAction, TermsRow, TipBanner, UploadBox, dk,
} from '@/components/dealer/DealerUI';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';
import { GlowPublishButton, GlowDraftButton } from "@/components/shared/ActionFooterGlow";

const ORANGE = '#e2671b';
const BG     = '#010A1F';

const USER_TYPES = ['All Users', 'Buyers', 'Sellers'];
const CITIES     = ['All Cities', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad'];
const LOCATIONS  = ['Home Screen Top', 'Home Screen Bottom', 'Search Results', 'Listing Detail'];
const PARTNERS   = ['Autowizor (Default)', 'PakWheels', 'OLX Autos'];

const DURATIONS = [
  { key: '6 weeks', weeks: 6, note: 'Recommended for popular plans',     price: 'Rs 6,650' },
  { key: '4 weeks', weeks: 4, note: 'Balanced exposure for more buyers', price: 'Rs 5,500' },
  { key: '2 weeks', weeks: 2, note: 'Notify Buyers About New Listings',  price: 'Rs 4,450' },
];

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.chip, active && s.chipActive]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function InsuranceVideoAdsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();
  const [savingDraft, setSavingDraft] = useState(false);

  const [videoTitle,   setVideoTitle]   = useState('');
  const [userType,     setUserType]     = useState('All Users');
  const [city,         setCity]         = useState('All Cities');
  const [location,     setLocation]     = useState('Home Screen Top');
  const [partner,      setPartner]      = useState('Autowizor (Default)');
  const [duration,     setDuration]     = useState('6 weeks');
  const [agreed,       setAgreed]       = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [fileName,     setFileName]     = useState('');
  const [publishing,   setPublishing]   = useState(false);
  const [locOpen,      setLocOpen]      = useState(false);
  const [partnerOpen,  setPartnerOpen]  = useState(false);
  const [showPay,      setShowPay]      = useState(false);
  const [paying,       setPaying]       = useState(false);

  useEffect(() => {
    if (!draftId || !token) return;
    (async () => {
      const d = await getDraft(token, draftId);
      if (!d) return;
      const x = d.data || {};
      if (x.videoTitle) setVideoTitle(x.videoTitle);
      if (x.userType) setUserType(x.userType);
      if (x.city) setCity(x.city);
      if (x.location) setLocation(x.location);
      if (x.partner) setPartner(x.partner);
      if (x.duration) setDuration(x.duration);
      if (d.media_url) { setUploadedFile(d.media_url); setFileName(String(d.media_url).split('/').pop() || 'media'); }
    })();
  }, [draftId, token]);

  async function handleDraft() {
    if (savingDraft) return;
    setSavingDraft(true);
    try {
      let media = uploadedFile;
      if (uploadedFile && !/^https?:\/\//.test(uploadedFile)) media = await uploadMedia();
      await saveDraft(token!, {
        id: draftId, kind: 'video_ad',
        title: videoTitle.trim() || 'Untitled Video Ad', subtitle: 'Video Ad',
        media_url: media || undefined,
        data: { videoTitle, userType, city, location, partner, duration, route: '/(insurance_provider)/video-ads' },
      });
      Alert.alert('Saved', 'Video Ad saved as draft.', [{ text: 'OK', onPress: () => router.replace('/dealer-panel/drafts' as any) }]);
    } catch (e: any) { Alert.alert('Error', e.message || 'Could not save draft.'); }
    finally { setSavingDraft(false); }
  }

  async function pickMedia() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your media library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'] as any,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setUploadedFile(result.assets[0].uri);
      setFileName(result.assets[0].uri.split('/').pop() || 'media');
    }
  }

  async function uploadMedia(): Promise<string | null> {
    if (!uploadedFile) return null;
    const BASE    = API_BASE.replace('/api/v1', '');
    const isVid   = uploadedFile.match(/\.(mp4|mov|avi|mkv|webm)$/i) || uploadedFile.includes('video');
    const endpoint = isVid ? `${API_BASE}/upload/video` : `${API_BASE}/upload/image`;
    const mime     = isVid ? 'video/mp4' : 'image/jpeg';
    const name     = isVid ? `vid_${Date.now()}.mp4` : `img_${Date.now()}.jpg`;
    const form     = new FormData();
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
    } catch { /* ignore */ }
    return null;
  }

  async function handlePublish() {
    if (!agreed)            { Alert.alert('Terms Required', 'Please accept the terms and conditions.'); return; }
    if (!videoTitle.trim()) { Alert.alert('Title Required', 'Please enter a video title.'); return; }

    try {
      setPublishing(true);
      const mediaUrl = await uploadMedia();

      const selectedDuration = DURATIONS.find(d => d.key === duration);

      const res = await fetch(`${API_BASE}/video-ads/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:            videoTitle.trim(),
          media_url:        mediaUrl,
          display_location: location,
          partner:          partner.replace(' (Default)', ''),
          user_type:        userType,
          cities:           city === 'All Cities' ? [] : [city],
          boost_weeks:      selectedDuration?.weeks ?? 6,
        }),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || 'Failed to publish video ad');
      }

      // Paid-first: pay now, then under review (no free publish)
      setShowPay(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not publish video ad.');
    } finally {
      setPublishing(false);
    }
  }

  function videoPrice(): { amount: number; weeks: number; label: string } {
    const d = DURATIONS.find(x => x.key === duration);
    const weeks = d?.weeks ?? 4;
    const amount = weeks === 6 ? 6650 : weeks === 2 ? 4450 : 5500;
    return { amount, weeks, label: d?.price || 'Rs 5,500' };
  }

  async function handleVideoPay() {
    const { amount, weeks } = videoPrice();
    setPaying(true);
    try {
      await fetch(`${API_BASE}/admin/payments/advertisement`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, boost_weeks: weeks, title: 'Insurance Video Ad' }),
      });
    } catch {}
    finally { setPaying(false); }
    setShowPay(false);
    Alert.alert('Under Review', 'Your video is under review, after approval you can check.', [
      { text: 'OK', onPress: () => {
        setVideoTitle(''); setUploadedFile(null); setFileName(''); setAgreed(false);
        router.back();
      }},
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* HEADER */}
        <View style={{ marginHorizontal: -16 }}>
          <DHeader title="Video Ads" center right={<SaveDraftAction onPress={handleDraft} />} />
        </View>

        {/* RECOMMENDATION */}
        <TipBanner title="Recommendation" text="Video Ads are best for showcasing insurance plans directly to interested buyers for Higher engagement & plan showcase" />

        {/* UPLOAD */}
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <View style={{ width: '64%' }}>
            <UploadBox title="+ Upload video/img" sub="Drag & drop or click to browse. Recommended 16:9 ratio." onPress={pickMedia}>
              {uploadedFile ? (
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Image source={{ uri: uploadedFile }} style={{ width: 80, height: 80, borderRadius: 8 }} resizeMode="cover" />
                  <Text style={{ color: '#22c55e', fontSize: 13, fontFamily: 'Poppins_500Medium' }}>✓ File selected</Text>
                  <Text style={{ color: '#BAACB6', fontSize: 11, fontFamily: 'Poppins_400Regular' }} numberOfLines={1}>{fileName}</Text>
                </View>
              ) : undefined}
            </UploadBox>
          </View>
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
          {USER_TYPES.map(u => <DChip key={u} small label={u} selected={userType === u} onPress={() => setUserType(u)} />)}
          <AddChip small />
        </View>
        <Text style={[s.subLabel, { marginTop: 12 }]}>Cities</Text>
        <View style={s.chipsRow}>
          {CITIES.map(c => <DChip key={c} small label={c} selected={city === c} onPress={() => setCity(c)} />)}
          <AddChip small />
        </View>

        {/* ADS PLAN (same section as the other ad screens) */}
        <View style={{ marginTop: 20 }}>
          <PromoCard title="Ads to Get Your  Vehicle Seen Faster" sub="Get 5x more visibility by featuring your listing">
            {DURATIONS.map(d => (
              <PlanOption key={d.key} title={d.key} sub={d.note} price={String(d.price).replace('PKR', 'Rs')} fire={d.key === '4 weeks'}
                selected={duration === d.key} onPress={() => setDuration(d.key)} />
            ))}
          </PromoCard>
        </View>

        <TermsRow checked={agreed} onToggle={() => setAgreed(v => !v)} />

        <View style={{ height: 170 }} />
      </ScrollView>

      {/* FOOTER BUTTONS */}
      <BottomActions fx compact>
        <GlowPublishButton title="Publish  Reel" loadingTitle={uploadedFile ? 'Uploading...' : 'Publishing...'}
          loading={publishing} style={!agreed ? { opacity: 0.6 } : undefined} onPress={handlePublish} />
        <GlowDraftButton title="Save as Draft" onPress={handleDraft} />
      </BottomActions>

      {/* Pay Now modal — paid-first, no free publish */}
      <Modal visible={showPay} transparent animationType="slide" onRequestClose={() => setShowPay(false)}>
        <View style={pm.overlay}>
          <View style={pm.sheet}>
            <GlassInset />
            <TouchableOpacity style={pm.closeBtn} onPress={() => setShowPay(false)}>
              <X size={20} color="#8f9cb5" />
            </TouchableOpacity>
            <View style={pm.headerRow}>
              <View style={pm.zapWrap}>
                <LinearGradient colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                <Zap size={22} color="#fff" fill="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={pm.title}>Pay for Video Ad</Text>
                <Text style={pm.sub}>{duration} • {videoPrice().label} — pay first, then review</Text>
              </View>
            </View>
            <TouchableOpacity style={pm.payBtn} onPress={handleVideoPay} disabled={paying} activeOpacity={0.85}>
              <LinearGradient colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
              {paying ? <ActivityIndicator color="#fff" size="small" /> : <Text style={pm.payTxt}>Pay Now • {videoPrice().label}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: BG },
  scroll:        { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  heading:       { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  saveDraft:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  saveDraftText: { color: ORANGE, fontSize: 10, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },

  infoBanner:    { flexDirection: 'row', gap: 12, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: ORANGE, backgroundColor: 'rgba(226,103,27,0.1)', marginBottom: 16, overflow: 'hidden' },
  infoTitle:     { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  infoText:      { color: '#c3cee2', fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 16 },

  uploadArea:    { borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(226,103,27,0.6)', borderStyle: 'dashed', paddingVertical: 36, alignItems: 'center', marginBottom: 16 },
  uploadTitle:   { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginTop: 10 },
  uploadSub:     { color: '#8f9cb5', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 4, paddingHorizontal: 24, textAlign: 'center' },

  label:         { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginBottom: 8, marginTop: 14 },
  inputWrap:     { height: 48, borderRadius: 30, paddingHorizontal: 18, justifyContent: 'center', backgroundColor: BG, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', overflow: 'hidden' },
  input:         { color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular', padding: 0 },

  dropdown:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: BG, borderRadius: 30, paddingHorizontal: 18, paddingVertical: 13, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', overflow: 'hidden' },
  dropdownText:  { color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  dropMenu:      { marginTop: 4, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(80,123,182,0.4)', backgroundColor: '#0D1E3F', overflow: 'hidden', marginBottom: 4 },
  dropItem:      { paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dropItemTxt:   { color: '#C8D3E8', fontSize: 13, fontFamily: 'Poppins_400Regular' },

  sectionTitle:  { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginTop: 20, marginBottom: 10 },
  subLabel:      { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
  chipsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  chipActive:    { borderColor: ORANGE, backgroundColor: 'rgba(226,103,27,0.08)' },
  chipText:      { color: '#c3cee2', fontSize: 12, fontFamily: 'Poppins_500Medium' },
  chipTextActive:{ color: ORANGE },

  pricingCard:    { borderRadius: 20, padding: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(226,103,27,0.35)', marginTop: 20, position: 'relative', backgroundColor: BG },
  flameCorner:    { position: 'absolute', top: 0, left: 0, width: 44, height: 44, backgroundColor: ORANGE, borderTopLeftRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pricingTitle:   { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold', marginTop: 28, marginBottom: 6, lineHeight: 22 },
  pricingSubtitle:{ color: '#c3cee2', fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 16 },
  durationBtn:    { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 10 },
  durationBtnActive:{ borderColor: ORANGE, borderWidth: 1.5 },
  durationKey:    { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  durationNote:   { color: '#9fb0cc', fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  durationPrice:  { color: '#c3cee2', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  radio:          { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#6f7f9c', alignItems: 'center', justifyContent: 'center' },
  radioFill:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5b8def' },

  termsRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 20 },
  termsText:     { color: '#c3cee2', fontSize: 12, fontFamily: 'Poppins_400Regular', flex: 1, lineHeight: 18 },

  footer:        { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, overflow: 'hidden' },
  publishWrap:   { borderRadius: 30, overflow: 'hidden', marginBottom: 10, flexDirection: 'row' },
  publishBtn:    { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  publishText:   { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  draftBtn:      { borderRadius: 30, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  draftText:     { color: '#fff', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
});

const pm = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:    { borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: 'rgba(3,12,40,0.98)', borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', padding: 24, overflow: 'hidden', paddingBottom: 40 },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  headerRow:{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  zapWrap:  { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  title:    { color: '#f9fafc', fontSize: 17, fontFamily: 'Poppins_700Bold' },
  sub:      { color: '#8f9cb5', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  payBtn:   { height: 52, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  payTxt:   { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
});
