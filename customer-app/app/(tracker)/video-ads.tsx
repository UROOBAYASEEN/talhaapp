import React, { useEffect, useRef, useState } from 'react';
import ScheduleDateTimeField from '@/components/shared/ScheduleDateTimeField';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator, AppState, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { saveDraft, getDraft } from '@/constants/draftApi';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import {
  ChevronLeft, Bookmark, Lightbulb, Upload,
  ChevronDown, Plus, Circle, CheckCircle2,
  Zap, X, CheckCircle,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  AddChip, BottomActions, Chip as DChip, DField, DHeader, DSelect, PlanOption, PromoCard, SaveDraftAction, TermsRow, TipBanner, UploadBox, dk,
} from '@/components/dealer/DealerUI';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';
import { GlowPublishButton, GlowDraftButton } from "@/components/shared/ActionFooterGlow";

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;

const USER_TYPES = ['All Users', 'Buyers', 'Sellers'];
const CITIES     = ['All Cities', 'Karachi', 'Lahore', 'Islamabad'];

const BOOSTS = [
  { id: '6w', weeks: 6, title: '6 weeks', subtitle: 'Recommended for popular trackers',    price: 'PKR 6,650', amount: 6650 },
  { id: '4w', weeks: 4, title: '4 weeks', subtitle: 'Balanced exposure for more clients',  price: 'PKR 5,500', amount: 5500 },
  { id: '2w', weeks: 2, title: '2 weeks', subtitle: 'Notify clients about new devices',    price: 'PKR 4,450', amount: 4450 },
];

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.18)','transparent']} start={{x:0,y:0.5}} end={{x:0.45,y:0.5}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent','rgba(29,83,175,0.2)']} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

/* ── Promote Modal ── */
function PromoteModal({ visible, onSkip, videoAdId, token, router, initialBoost }: {
  visible: boolean; onSkip: () => void; videoAdId: string; token: string | null; router: any; initialBoost?: string;
}) {
  const [boost,    setBoost]    = useState(initialBoost || '6w');
  // Start with the plan picked on the screen
  useEffect(() => { if (visible && initialBoost) setBoost(initialBoost); }, [visible, initialBoost]);
  const [paying,   setPaying]   = useState(false);
  const [waiting,  setWaiting]  = useState(false);
  const pollRef      = useRef<any>(null);
  const isWaitingRef = useRef(false);
  const appStateRef  = useRef(AppState.currentState);

  useEffect(() => {
    if (!visible) return;
    const appSub = AppState.addEventListener('change', next => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active' && isWaitingRef.current) startPolling();
      appStateRef.current = next;
    });
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('payment-success') && isWaitingRef.current) { stopPolling(); isWaitingRef.current = false; setWaiting(false); setPaying(false); router.replace('/vehicle/payment-success' as any); }
    });
    return () => { appSub.remove(); linkSub.remove(); stopPolling(); };
  }, [visible]);

  function stopPolling()  { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }
  function startPolling() { stopPolling(); checkStatus(); pollRef.current = setInterval(checkStatus, 2500); }

  async function checkStatus() {
    if (!videoAdId || !token) return;
    try {
      const res = await fetch(`${API_BASE}/video-ads/status/${videoAdId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); if (d.success) { stopPolling(); isWaitingRef.current = false; setWaiting(false); setPaying(false); router.replace('/vehicle/payment-success' as any); } }
    } catch {}
  }

  async function handlePay() {
    const selected = BOOSTS.find(b => b.id === boost)!;
    setPaying(true);
    try {
      await fetch(`${API_BASE}/admin/payments/advertisement`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selected.amount, boost_weeks: selected.weeks, title: 'Tracker Video Ad' }),
      });
    } catch {}
    finally { setPaying(false); }
    Alert.alert('Under Review', 'Your video is under review, after approval you can check.', [
      { text: 'OK', onPress: () => { onSkip(); router.back(); } },
    ]);
    return;
  }

  async function handleCheckStatus() {
    try {
      const res = await fetch(`${API_BASE}/video-ads/status/${videoAdId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        if (d.success) { stopPolling(); isWaitingRef.current = false; setWaiting(false); setPaying(false); router.replace('/vehicle/payment-success' as any); }
        else Alert.alert('Not confirmed yet', 'Payment not received yet. Please complete payment in the browser.');
      }
    } catch {}
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onSkip}>
      <View style={pm.overlay}>
        <View style={pm.sheet}>
          <GlassInset />
          <TouchableOpacity style={pm.closeBtn} onPress={onSkip}><X size={20} color={C.textSecondary} /></TouchableOpacity>
          <View style={pm.headerRow}>
            <View style={pm.zapWrap}><LinearGradient colors={[NAVY,ORANGE]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject} /><Zap size={22} color="#fff" fill="#fff" /></View>
            <View style={{ flex:1 }}><Text style={pm.title}>Promote Your Video Ad</Text><Text style={pm.sub}>Get 5× more views with boost</Text></View>
          </View>
          <View style={pm.divider} />
          {BOOSTS.map(b => (
            <TouchableOpacity key={b.id} style={[pm.option, boost === b.id && pm.optionActive]} onPress={() => setBoost(b.id)} activeOpacity={0.8}>
              <GlassInset />
              <View style={{ flex:1 }}><Text style={pm.optionTitle}>{b.title}</Text><Text style={pm.optionSub}>{b.subtitle}</Text></View>
              <View style={pm.optionRight}>
                <Text style={pm.optionPrice}>{b.price}</Text>
                <View style={[pm.radio, boost === b.id && pm.radioActive]}>{boost === b.id && <View style={pm.radioDot}/>}</View>
              </View>
            </TouchableOpacity>
          ))}
          {waiting && (
            <TouchableOpacity style={pm.checkBtn} onPress={handleCheckStatus}>
              <CheckCircle size={16} color={ORANGE} /><Text style={pm.checkTxt}>I've paid — Confirm Payment</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[pm.payBtn, (paying||waiting) && {opacity:0.7}]} onPress={handlePay} disabled={paying||waiting} activeOpacity={0.85}>
            <LinearGradient colors={[NAVY,ORANGE]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} />
            {paying ? <ActivityIndicator color="#fff" size="small"/> : waiting ? <Text style={pm.payTxt}>Waiting for payment...</Text> : <Text style={pm.payTxt}>Pay Now</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay:     { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
  sheet:       { borderTopLeftRadius:28, borderTopRightRadius:28, backgroundColor:C.glassBg, borderWidth:1, borderColor:'rgba(100,160,255,0.3)', padding:24, overflow:'hidden', paddingBottom:40 },
  closeBtn:    { position:'absolute', top:16, right:16, width:32, height:32, borderRadius:16, backgroundColor:'rgba(255,255,255,0.08)', alignItems:'center', justifyContent:'center', zIndex:10 },
  headerRow:   { flexDirection:'row', alignItems:'center', gap:14, marginBottom:18 },
  zapWrap:     { width:48, height:48, borderRadius:24, overflow:'hidden', alignItems:'center', justifyContent:'center' },
  title:       { color:C.textPrimary, fontSize:17, fontFamily:'Poppins_700Bold' },
  sub:         { color:C.textSecondary, fontSize:12, fontFamily:'Poppins_400Regular', marginTop:2 },
  divider:     { height:1, backgroundColor:'rgba(255,255,255,0.08)', marginBottom:16 },
  option:      { flexDirection:'row', alignItems:'center', borderRadius:14, borderWidth:1, borderColor:'rgba(255,255,255,0.1)', backgroundColor:'rgba(9,36,92,0.6)', paddingHorizontal:14, paddingVertical:13, marginBottom:10, overflow:'hidden' },
  optionActive:{ borderColor:ORANGE },
  optionTitle: { color:C.textPrimary, fontSize:14, fontFamily:'Poppins_600SemiBold' },
  optionSub:   { color:C.textSecondary, fontSize:11, fontFamily:'Poppins_400Regular', marginTop:2 },
  optionRight: { flexDirection:'row', alignItems:'center', gap:10, marginLeft:10 },
  optionPrice: { color:ORANGE, fontSize:13, fontFamily:'Poppins_700Bold' },
  radio:       { width:20, height:20, borderRadius:10, borderWidth:2, borderColor:'rgba(255,255,255,0.25)', alignItems:'center', justifyContent:'center' },
  radioActive: { borderColor:ORANGE },
  radioDot:    { width:10, height:10, borderRadius:5, backgroundColor:ORANGE },
  checkBtn:    { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:12, borderRadius:14, borderWidth:1, borderColor:'rgba(226,103,27,0.4)', backgroundColor:'rgba(226,103,27,0.08)', marginBottom:12 },
  checkTxt:    { color:ORANGE, fontSize:13, fontFamily:'Poppins_600SemiBold' },
  payBtn:      { height:52, borderRadius:26, overflow:'hidden', alignItems:'center', justifyContent:'center', marginTop:6, marginBottom:12 },
  payTxt:      { color:'#fff', fontSize:15, fontFamily:'Poppins_700Bold' },
  skipBtn:     { alignItems:'center', paddingVertical:8 },
  skipTxt:     { color:C.textSecondary, fontSize:13, fontFamily:'Poppins_400Regular', textDecorationLine:'underline' },
});

/* ── Main Screen ── */
export default function TrackerVideoAdsScreen() {
  const router    = useRouter();
  const { token } = useAuth();
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();

  const [videoTitle,   setVideoTitle]   = useState('');
  const [userType,     setUserType]     = useState('All Users');
  const [city,         setCity]         = useState('All Cities');
  const [agreed,       setAgreed]       = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [publishing,   setPublishing]   = useState(false);
  const [savingDraft,  setSavingDraft]  = useState(false);
  const [showPromote,  setShowPromote]  = useState(false);
  const [createdAdId,  setCreatedAdId]  = useState<string>('');
  const [boostSel,     setBoostSel]     = useState('6w');
  const [startDate,    setStartDate]    = useState('');
  const [endDate,      setEndDate]      = useState('');

  useEffect(() => {
    if (!draftId || !token) return;
    (async () => {
      const d = await getDraft(token, draftId);
      if (!d) return;
      const x = d.data || {};
      if (x.videoTitle) setVideoTitle(x.videoTitle);
      if (x.userType) setUserType(x.userType);
      if (x.city) setCity(x.city);
      if (x.boostSel) setBoostSel(x.boostSel);
      if (x.startDate) setStartDate(x.startDate);
      if (x.endDate) setEndDate(x.endDate);
      if (d.media_url) setUploadedFile(d.media_url);
    })();
  }, [draftId, token]);

  async function pickMedia() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow access to your media library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images','videos'] as any, quality: 0.8 });
    if (!result.canceled) setUploadedFile(result.assets[0].uri);
  }

  async function uploadMedia(): Promise<string | null> {
    if (!uploadedFile) return null;
    const BASE    = API_BASE.replace('/api/v1', '');
    const isVid   = uploadedFile.match(/\.(mp4|mov|avi|mkv|webm)$/i) || uploadedFile.includes('video');
    const endpoint= isVid ? `${API_BASE}/upload/video` : `${API_BASE}/upload/image`;
    const mime    = isVid ? 'video/mp4' : 'image/jpeg';
    const name    = isVid ? `video_${Date.now()}.mp4` : `img_${Date.now()}.jpg`;
    const form    = new FormData();
    form.append('file', { uri: uploadedFile, type: mime, name } as any);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      if (res.ok) { const d = await res.json(); return `${BASE}${d.url}`; }
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
        body: JSON.stringify({ title: videoTitle.trim(), user_type: userType, cities: city === 'All Cities' ? [] : [city], media_url: mediaUrl }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed to create video ad'); }
      const data = await res.json();
      setCreatedAdId(data.id);
      setShowPromote(true);
    } catch (e: any) { Alert.alert('Error', e.message || 'Could not publish video ad.'); }
    finally { setPublishing(false); }
  }

  function handleSkipPromote() { setShowPromote(false); router.back(); }
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
        data: { videoTitle, userType, city, boostSel, startDate, endDate, route: '/(tracker)/video-ads' },
      });
      Alert.alert('Saved', 'Video Ad saved as draft.', [{ text: 'OK', onPress: () => router.replace('/dealer-panel/drafts' as any) }]);
    } catch (e: any) { Alert.alert('Error', e.message || 'Could not save draft.'); }
    finally { setSavingDraft(false); }
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

          {/* HEADER */}
          <View style={{ marginHorizontal: -16 }}>
            <DHeader title="Video Ads" center right={<SaveDraftAction onPress={handleDraft} />} />
          </View>

          {/* RECOMMENDATION */}
          <TipBanner title="Recommendation" text="Video Ads are best for showcasing tracker devices directly to interested clients. Best for: Higher engagement & device showcase" />

          {/* UPLOAD */}
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <View style={{ width: '64%' }}>
              <UploadBox title="+ Upload video/img" sub="Drag & drop or click to browse. Recommended 16:9 ratio." onPress={pickMedia}>
                {uploadedFile ? (
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: '#22c55e', fontSize: 13, fontFamily: 'Poppins_500Medium' }}>✓ File selected</Text>
                    <Text style={{ color: '#BAACB6', fontSize: 11, fontFamily: 'Poppins_400Regular' }} numberOfLines={1}>{uploadedFile.split('/').pop()}</Text>
                  </View>
                ) : undefined}
              </UploadBox>
            </View>
          </View>

          <Text style={dk.label}>Video Title</Text>
          <DField value={videoTitle} onChangeText={setVideoTitle} placeholder="e.g. Summer Auto Sale" />

          <Text style={dk.label}>Display Location</Text>
          <DSelect value="Home Screen Top" />

          <Text style={dk.label}>Partner Selection</Text>
          <DSelect value="Autowizor (Default)" />

          <Text style={dk.label}>Schedule Banner</Text>
          <View style={s.dateRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.dateLabel}>Start Date & Time</Text>
              <ScheduleDateTimeField value={startDate} onChange={setStartDate} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.dateLabel}>End Date & Time</Text>
              <ScheduleDateTimeField value={endDate} onChange={setEndDate} minimumDate={startDate ? new Date(startDate) : null} />
            </View>
          </View>

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

          {/* ADS PLAN (same section as the other ad screens) */}
          <View style={{ marginTop: 20 }}>
            <PromoCard title="Ads to Get Your  Vehicle Seen Faster" sub="Get 5x more visibility by featuring your listing">
              {BOOSTS.map(b => (
                <PlanOption key={b.id} title={b.title} sub={b.subtitle} price={b.price.replace('PKR', 'Rs')} fire={b.id === '4w'}
                  selected={boostSel === b.id} onPress={() => setBoostSel(b.id)} />
              ))}
            </PromoCard>
          </View>

          <View style={{ height: 170 }} />
        </ScrollView>

        {/* FOOTER BUTTONS */}
        <BottomActions fx>
          <GlowPublishButton title="Publish  Reel" loadingTitle={uploadedFile ? 'Uploading...' : 'Publishing...'}
            loading={publishing} style={!agreed ? { opacity: 0.6 } : undefined} onPress={handlePublish} />
          <GlowDraftButton title="Save as Draft" onPress={handleDraft} />
        </BottomActions>
      </KeyboardAvoidingView>

      <PromoteModal visible={showPromote} onSkip={handleSkipPromote} videoAdId={createdAdId} token={token} router={router} initialBoost={boostSel} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:      { flex:1, backgroundColor:'#010A1F' },
  scrollContent: { paddingHorizontal:16, paddingTop:4, paddingBottom:20 },
  dateRow:       { flexDirection:'row', gap:12 },
  dateLabel:     { color:'#FFFFFF', fontSize:12, fontFamily:'Poppins_400Regular' },
  subLabel:      { color:'#FFFFFF', fontSize:13, fontFamily:'Poppins_400Regular', marginBottom:8 },
  chipsRow:      { flexDirection:'row', flexWrap:'wrap', gap:10 },
});
