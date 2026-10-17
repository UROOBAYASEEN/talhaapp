import React, { useEffect, useRef, useState } from 'react';
import ScheduleDateTimeField from '@/components/shared/ScheduleDateTimeField';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
  AppState, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { saveDraft, getDraft } from '@/constants/draftApi';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import {
  ChevronLeft, Bookmark, Lightbulb, Upload, ChevronDown,
  Plus, Circle, CheckCircle2, Zap, X, CheckCircle,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import {
  AddChip, BottomActions, Chip as DChip, DField, DHeader, DSelect, PlanOption, PromoCard, SaveDraftAction, TermsRow, TipBanner, UploadBox, dk,
} from '@/components/dealer/DealerUI';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';
import { useAuth } from '@/contexts/AuthContext';
import { GlowPublishButton, GlowDraftButton } from "@/components/shared/ActionFooterGlow";

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;

const PAGES      = ['Finance page', 'Insurance page', 'New car page', 'Used car page', 'Booking page'];
const USER_TYPES = ['All Users', 'Buyers', 'Sellers'];
const CITIES     = ['All Cities', 'Karachi', 'Lahore', 'Islamabad'];
const BOOST_OPTIONS = [
  { weeks: 6, label: '6 weeks', subtitle: 'Recommended for popular offers',   price: 'PKR 6,650' },
  { weeks: 4, label: '4 weeks', subtitle: 'Balanced exposure for more users', price: 'PKR 5,500' },
  { weeks: 2, label: '2 weeks', subtitle: 'Quick promotion for short offers', price: 'PKR 4,450' },
];
const PM_BOOSTS = [
  { id: '6w', weeks: 6, title: '6 weeks', subtitle: 'Recommended for popular offers',   price: 'PKR 6,650', amount: 6650 },
  { id: '4w', weeks: 4, title: '4 weeks', subtitle: 'Balanced exposure for more users', price: 'PKR 5,500', amount: 5500 },
  { id: '2w', weeks: 2, title: '2 weeks', subtitle: 'Quick promotion for short offers', price: 'PKR 4,450', amount: 4450 },
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
function PromoteModal({ visible, onSkip, bannerAdId, token, router }: {
  visible: boolean; onSkip: () => void;
  bannerAdId: string; token: string | null; router: any;
}) {
  const [boost,   setBoost]   = useState('6w');
  const [paying,  setPaying]  = useState(false);
  const [waiting, setWaiting] = useState(false);

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
      if (url.includes('payment-success') && isWaitingRef.current) { stopPolling(); finish(); }
    });
    return () => { appSub.remove(); linkSub.remove(); stopPolling(); };
  }, [visible]);

  function stopPolling()  { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }
  function startPolling() { stopPolling(); checkStatus(); pollRef.current = setInterval(checkStatus, 2500); }
  function finish()       { isWaitingRef.current = false; setWaiting(false); setPaying(false); router.replace('/vehicle/payment-success' as any); }

  async function checkStatus() {
    if (!bannerAdId || !token) return;
    try {
      const res = await fetch(`${API_BASE}/banner-ads/status/${bannerAdId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); if (d.success) { stopPolling(); finish(); } }
    } catch {}
  }

  async function handlePay() {
    const selected = PM_BOOSTS.find(b => b.id === boost)!;
    setPaying(true);
    try {
      await fetch(`${API_BASE}/admin/payments/advertisement`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selected.amount, boost_weeks: selected.weeks, title: 'Bank Banner' }),
      });
    } catch {}
    finally { setPaying(false); }
    Alert.alert('Under Review', 'Your ad is under review, after approval you can check.', [
      { text: 'OK', onPress: () => { onSkip(); router.back(); } },
    ]);
    return;
  }

  async function handleCheckStatus() {
    if (!bannerAdId || !token) return;
    try {
      const res = await fetch(`${API_BASE}/banner-ads/status/${bannerAdId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.success) { stopPolling(); finish(); }
        else Alert.alert('Not confirmed yet', 'Payment not received. Please complete in browser.');
      }
    } catch {}
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onSkip}>
      <View style={pm.overlay}>
        <View style={pm.sheet}>
          <GlassInset />
          <TouchableOpacity style={pm.closeBtn} onPress={onSkip}>
            <X size={20} color={C.textSecondary} />
          </TouchableOpacity>
          <View style={pm.headerRow}>
            <View style={pm.zapWrap}>
              <LinearGradient colors={[NAVY, ORANGE]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject} />
              <Zap size={22} color="#fff" fill="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={pm.title}>Promote Your Banner</Text>
              <Text style={pm.sub}>Get 5× more views with boost</Text>
            </View>
          </View>
          <View style={pm.divider} />
          {PM_BOOSTS.map(b => (
            <TouchableOpacity key={b.id} style={[pm.option, boost === b.id && pm.optionActive]} onPress={() => setBoost(b.id)} activeOpacity={0.8}>
              <GlassInset />
              <View style={{ flex: 1 }}>
                <Text style={pm.optionTitle}>{b.title}</Text>
                <Text style={pm.optionSub}>{b.subtitle}</Text>
              </View>
              <View style={pm.optionRight}>
                <Text style={pm.optionPrice}>{b.price}</Text>
                <View style={[pm.radio, boost === b.id && pm.radioActive]}>
                  {boost === b.id && <View style={pm.radioDot} />}
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {waiting && (
            <TouchableOpacity style={pm.checkBtn} onPress={handleCheckStatus}>
              <CheckCircle size={16} color={ORANGE} />
              <Text style={pm.checkTxt}>I've paid — Confirm Payment</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[pm.payBtn, (paying || waiting) && { opacity: 0.7 }]} onPress={handlePay} disabled={paying || waiting} activeOpacity={0.85}>
            <LinearGradient colors={[NAVY, ORANGE]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} />
            {paying ? <ActivityIndicator color="#fff" size="small" />
              : waiting ? <Text style={pm.payTxt}>Waiting for payment...</Text>
              : <Text style={pm.payTxt}>Pay Now</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: C.glassBg, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', padding: 24, overflow: 'hidden', paddingBottom: 40 },
  closeBtn:    { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  zapWrap:     { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  title:       { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_700Bold' },
  sub:         { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  divider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  option:      { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(9,36,92,0.6)', paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10, overflow: 'hidden' },
  optionActive:{ borderColor: ORANGE },
  optionTitle: { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  optionSub:   { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  optionRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 10 },
  optionPrice: { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_700Bold' },
  radio:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: ORANGE },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
  checkBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(226,103,27,0.4)', backgroundColor: 'rgba(226,103,27,0.08)', marginBottom: 12 },
  checkTxt:    { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  payBtn:      { height: 52, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 12 },
  payTxt:      { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  skipBtn:     { alignItems: 'center', paddingVertical: 8 },
  skipTxt:     { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', textDecorationLine: 'underline' },
});

/* ── Main Screen ── */
export default function BankSpecialOfferScreen() {
  const router    = useRouter();
  const { token } = useAuth();
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();
  const [savingDraft, setSavingDraft] = useState(false);

  const [bannerTitle,      setBannerTitle]      = useState('');
  const [description,      setDescription]      = useState('');
  const [campaignName,     setCampaignName]     = useState('');
  const [displayLocation,  setDisplayLocation]  = useState('Home Screen Top');
  const [partner,          setPartner]          = useState('Autowizor (Default)');
  const [page,             setPage]             = useState('Finance page');
  const [userType,         setUserType]         = useState('All Users');
  const [city,             setCity]             = useState('All Cities');
  const [boostWeeks,       setBoostWeeks]       = useState(6);
  const [startDate,        setStartDate]        = useState('');
  const [endDate,          setEndDate]          = useState('');
  const [agreed,           setAgreed]           = useState(false);
  const [uploadedFile,     setUploadedFile]     = useState<string | null>(null);
  const [publishing,       setPublishing]       = useState(false);
  const [showPromote,      setShowPromote]      = useState(false);
  const [createdAdId,      setCreatedAdId]      = useState<string>('');

  // Drafts "Continue" se prefill
  useEffect(() => {
    if (!draftId || !token) return;
    (async () => {
      const d = await getDraft(token, draftId);
      if (!d) return;
      const x = d.data || {};
      if (x.bannerTitle) setBannerTitle(x.bannerTitle);
      if (x.description) setDescription(x.description);
      if (x.campaignName) setCampaignName(x.campaignName);
      if (x.displayLocation) setDisplayLocation(x.displayLocation);
      if (x.partner) setPartner(x.partner);
      if (x.page) setPage(x.page);
      if (x.userType) setUserType(x.userType);
      if (x.city) setCity(x.city);
      if (x.boostWeeks) setBoostWeeks(x.boostWeeks);
      if (x.startDate) setStartDate(x.startDate);
      if (x.endDate) setEndDate(x.endDate);
      if (d.media_url) setUploadedFile(d.media_url);
    })();
  }, [draftId, token]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow access to your photo library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.8 });
    if (!result.canceled) setUploadedFile(result.assets[0].uri);
  }

  async function uploadImage(): Promise<string | null> {
    if (!uploadedFile) return null;
    const BASE = API_BASE.replace('/api/v1', '');
    const form = new FormData();
    form.append('file', { uri: uploadedFile, type: 'image/jpeg', name: `banner_${Date.now()}.jpg` } as any);
    try {
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.ok) { const d = await res.json(); return `${BASE}${d.url}`; }
    } catch {}
    return null;
  }

  async function handlePublish() {
    if (!agreed)             { Alert.alert('Terms Required', 'Please accept the terms and conditions.'); return; }
    if (!bannerTitle.trim()) { Alert.alert('Title Required', 'Please enter a banner title.'); return; }
    setPublishing(true);
    try {
      const imageUrl = await uploadImage();
      const res = await fetch(`${API_BASE}/banner-ads/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:            bannerTitle.trim(),
          description:      description.trim() || undefined,
          campaign_name:    campaignName.trim() || undefined,
          show_on_pages:    [page],
          user_type:        userType,
          cities:           city === 'All Cities' ? [] : [city],
          boost_weeks:      boostWeeks,
          display_location: displayLocation,
          partner:          partner,
          banner_image_url: imageUrl ?? undefined,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed to create banner'); }
      const data = await res.json();
      setCreatedAdId(data.banner_ad_id);
      setShowPromote(true);
    } catch (e: any) {
      Alert.alert('Error', (e as any).message || 'Could not publish banner.');
    } finally {
      setPublishing(false);
    }
  }

  function handleSkipPromote() {
    // No free publish — close only, banner stays pending until paid
    setShowPromote(false);
    router.back();
  }

  async function handleDraft() {
    if (savingDraft) return;
    setSavingDraft(true);
    try {
      let media = uploadedFile;
      if (uploadedFile && !/^https?:\/\//.test(uploadedFile)) media = await uploadImage();
      await saveDraft(token!, {
        id:        draftId,
        kind:      'special_offer',
        title:     bannerTitle.trim() || 'Untitled Special Offer',
        subtitle:  'Special Offer',
        media_url: media || undefined,
        data:      { bannerTitle, description, campaignName, displayLocation, partner, page, userType, city, boostWeeks, startDate, endDate, route: '/bank-special-offer' },
      });
      Alert.alert('Saved', 'Special Offer saved as draft.', [
        { text: 'OK', onPress: () => router.replace('/dealer-panel/drafts' as any) },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save draft.');
    } finally {
      setSavingDraft(false);
    }
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

          {/* HEADER */}
          <View style={{ marginHorizontal: -16 }}>
            <DHeader title="Special Offer Details" right={<SaveDraftAction onPress={handleDraft} />} />
          </View>

          {/* RECOMMENDATION */}
          <TipBanner text={'Banner Ads are best for promoting special offers...\nBest for: Quick visibility & offer discovery.'} />

          {/* UPLOAD */}
          <View style={{ marginTop: 16 }}>
            <UploadBox title="+ Upload Banner Image" sub="Drag & drop or click to browse. Recommended 16:9 ratio." onPress={pickImage}>
              {uploadedFile ? (
                <View style={{ alignItems: 'center', gap: 8, width: '100%' }}>
                  <Image source={{ uri: uploadedFile }} style={{ width: '100%', height: 150, borderRadius: 12 }} resizeMode="cover" />
                  <Text style={{ color: '#22c55e', fontSize: 14, fontFamily: 'Poppins_500Medium' }}>✓ Image selected</Text>
                </View>
              ) : undefined}
            </UploadBox>
          </View>

          <Text style={dk.label}>Banner Title</Text>
          <DField value={bannerTitle} onChangeText={setBannerTitle} placeholder="e.g. Summer Auto Sale" />

          <Text style={dk.label}>Short Description</Text>
          <DField value={description} onChangeText={setDescription} placeholder="Catchy description for the banner..." multiline />

          <Text style={dk.label}>Campaign Name (Optional)</Text>
          <DField value={campaignName} onChangeText={setCampaignName} placeholder="Internal campaign identifier" />

          <Text style={dk.label}>Show on Page</Text>
          <View style={s.chipsRow}>
            {PAGES.map(p => <DChip key={p} label={p} selected={page === p} onPress={() => setPage(p)} />)}
          </View>
          <Text style={s.recoHint}>Recommendations: Featured Banner</Text>

          <Text style={dk.label}>Display Location</Text>
          <DSelect value={displayLocation} />

          <Text style={dk.label}>Partner Selection</Text>
          <DSelect value={partner} />

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

          {/* AD PROMOTION CARD */}
          <View style={{ marginTop: 20 }}>
            <PromoCard title="Ads to Get Your  Vehicle Seen Faster" sub="Get 5x more visibility by featuring your listing">
              {BOOST_OPTIONS.map(b => (
                <PlanOption key={b.weeks} title={b.label} sub={b.subtitle} price={b.price.replace('PKR', 'Rs')} fire={b.weeks === 4}
                  selected={boostWeeks === b.weeks} onPress={() => setBoostWeeks(b.weeks)} />
              ))}
            </PromoCard>
          </View>

          <TermsRow checked={agreed} onToggle={() => setAgreed(v => !v)} />

          <View style={{ height: 170 }} />
        </ScrollView>

        {/* BOTTOM BUTTONS */}
        <BottomActions fx>
          <GlowPublishButton title="Publish Banner" loadingTitle="Publishing..." loading={publishing}
            style={!agreed ? { opacity: 0.6 } : undefined} onPress={handlePublish} />
          <GlowDraftButton title="Save as Draft" onPress={handleDraft} />
        </BottomActions>
      </KeyboardAvoidingView>

      <PromoteModal
        visible={showPromote}
        onSkip={handleSkipPromote}
        bannerAdId={createdAdId}
        token={token}
        router={router}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: '#010A1F' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 },
  dateRow:       { flexDirection: 'row', gap: 12 },
  dateLabel:     { color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  subLabel:      { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
  chipsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  recoHint:      { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_400Regular', fontStyle: 'italic', marginTop: 8 },
});
