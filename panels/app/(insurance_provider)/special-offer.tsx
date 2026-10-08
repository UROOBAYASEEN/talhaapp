import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator, AppState, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import {
  ChevronLeft, Bookmark, Lightbulb, Upload,
  ChevronDown, Flame, Circle, CheckCircle2,
  Calendar, Zap, X, CheckCircle,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import {
  BottomActions, Chip as DChip, DField, DHeader, DSelect, PlanOption, PromoCard, SaveDraftAction, TermsRow, TipBanner, UploadBox, dk,
} from '@/components/dealer/DealerUI';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { GlowPublishButton, GlowDraftButton } from "@/components/shared/ActionFooterGlow";

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;
const BG     = '#010A1F';

const PAGE_CHIPS = ['Insurance page', 'Claims page', 'New plan page', 'Renewal page', 'Finance page'];
const USER_TYPES = ['All Users', 'Buyers', 'Sellers'];
const CITIES     = ['All Cities', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi'];
const LOCATIONS  = ['Home Screen Top', 'Home Screen Bottom', 'Search Results'];
const PARTNERS   = ['Autowizor (Default)', 'PakWheels', 'OLX Autos'];

const BOOSTS = [
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

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.chip, active && s.chipActive]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
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
  function finish()       { isWaitingRef.current = false; setWaiting(false); setPaying(false); router.back(); }

  async function checkStatus() {
    if (!bannerAdId || !token) return;
    try {
      const res = await fetch(`${API_BASE}/banner-ads/status/${bannerAdId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); if (d.success) { stopPolling(); finish(); } }
    } catch {}
  }

  async function handlePay() {
    const selected = BOOSTS.find(b => b.id === boost)!;
    setPaying(true);
    try {
      await fetch(`${API_BASE}/admin/payments/advertisement`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selected.amount, boost_weeks: selected.weeks, title: 'Insurance Banner' }),
      });
    } catch {}
    finally { setPaying(false); }
    Alert.alert('Under Review', 'Your ad is under review, after approval you can check.', [
      { text: 'OK', onPress: () => { onSkip(); router.back(); } },
    ]);
    return;
  }

  async function handleCheckStatus() {
    try {
      const res = await fetch(`${API_BASE}/banner-ads/status/${bannerAdId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        if (d.success) { stopPolling(); finish(); }
        else Alert.alert('Not confirmed yet', 'Please complete payment in the browser.');
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
          {BOOSTS.map(b => (
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
            <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
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
export default function InsuranceSpecialOfferScreen() {
  const router    = useRouter();
  const { token } = useAuth();

  const [title,       setTitle]       = useState('');
  const [desc,        setDesc]        = useState('');
  const [campaign,    setCampaign]    = useState('');
  const [userType,    setUserType]    = useState('All Users');
  const [city,        setCity]        = useState('All Cities');
  const [page,        setPage]        = useState('Insurance page');
  const [location,    setLocation]    = useState('Home Screen Top');
  const [partner,     setPartner]     = useState('Autowizor (Default)');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [agreed,      setAgreed]      = useState(false);
  const [uploadedFile,setUploadedFile]= useState<string | null>(null);
  const [publishing,  setPublishing]  = useState(false);
  const [showPromote, setShowPromote] = useState(false);
  const [createdAdId, setCreatedAdId] = useState('');
  const [locOpen,     setLocOpen]     = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [boostPick,   setBoostPick]   = useState('6w');

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
    if (!agreed)       { Alert.alert('Terms Required', 'Please accept the terms and conditions.'); return; }
    if (!title.trim()) { Alert.alert('Title Required', 'Please enter a banner title.'); return; }
    setPublishing(true);
    try {
      const imageUrl = await uploadImage();
      const res = await fetch(`${API_BASE}/banner-ads/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:            title.trim(),
          description:      desc.trim()      || undefined,
          campaign_name:    campaign.trim()  || undefined,
          banner_image_url: imageUrl ?? undefined,
          display_location: location,
          partner:          partner.replace(' (Default)', ''),
          show_on_pages:    [page],
          user_type:        userType,
          cities:           city === 'All Cities' ? [] : [city],
          boost_weeks:      6,
          start_date:       startDate || undefined,
          end_date:         endDate   || undefined,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed to create banner'); }
      const data = await res.json();
      setCreatedAdId(data.banner_ad_id);
      setShowPromote(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not publish banner.');
    } finally {
      setPublishing(false);
    }
  }

  function handleSkipPromote() {
    // No free publish — close only, banner stays pending until paid
    setShowPromote(false);
    router.back();
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* HEADER */}
          <View style={{ marginHorizontal: -16 }}>
            <DHeader title="Special Offer Details" center right={<SaveDraftAction />} />
          </View>

          {/* RECOMMENDATION */}
          <TipBanner text={'Banner Ads are best for promoting special insurance offers...\nBest for: Quick visibility & offer discovery.'} />

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
          <DField value={title} onChangeText={setTitle} placeholder="e.g. Summer Auto Sale" />

          <Text style={dk.label}>Short Description</Text>
          <DField value={desc} onChangeText={setDesc} placeholder="Catchy description for the banner..." multiline />

          <Text style={dk.label}>Campaign Name (Optional)</Text>
          <DField value={campaign} onChangeText={setCampaign} placeholder="Internal campaign identifier" />

          <Text style={dk.label}>Show On Pages</Text>
          <View style={s.chipsRow}>
            {PAGE_CHIPS.map(p => <DChip key={p} label={p} selected={page === p} onPress={() => setPage(p)} />)}
          </View>

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

          <Text style={dk.label}>Schedule Banner</Text>
          <View style={s.dateRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.dateLabel}>Start Date & Time</Text>
              <DField placeholder="mm/dd/yyyy" value={startDate} onChangeText={setStartDate} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.dateLabel}>End Date & Time</Text>
              <DField placeholder="mm/dd/yyyy" value={endDate} onChangeText={setEndDate} />
            </View>
          </View>

          <Text style={dk.label}>Audience Targeting</Text>
          <Text style={s.subLabel}>User Type</Text>
          <View style={s.chipsRow}>
            {USER_TYPES.map(u => <DChip key={u} small label={u} selected={userType === u} onPress={() => setUserType(u)} />)}
          </View>
          <Text style={[s.subLabel, { marginTop: 12 }]}>Cities</Text>
          <View style={s.chipsRow}>
            {CITIES.map(c => <DChip key={c} small label={c} selected={city === c} onPress={() => setCity(c)} />)}
          </View>

          {/* PRICING */}
          <View style={{ marginTop: 20 }}>
            <PromoCard title="Ads to Get Your  Vehicle Seen Faster" sub="Get 5x more visibility by featuring your listing">
              {BOOSTS.map(d => (
                <PlanOption key={d.id} title={d.title} sub={d.subtitle} price={d.price.replace('PKR', 'Rs')} fire={d.id === '4w'}
                  selected={boostPick === d.id} onPress={() => setBoostPick(d.id)} />
              ))}
            </PromoCard>
          </View>

          <TermsRow checked={agreed} onToggle={() => setAgreed(v => !v)} />

          <View style={{ height: 170 }} />
        </ScrollView>

        {/* FOOTER */}
        <BottomActions fx compact>
          <GlowPublishButton title="Publish Banner" loadingTitle="Publishing..." loading={publishing}
            style={!agreed ? { opacity: 0.6 } : undefined} onPress={handlePublish} />
          <GlowDraftButton title="Save as Draft" />
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
  safe:          { flex: 1, backgroundColor: BG },
  scroll:        { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heading:       { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  saveDraft:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  saveDraftText: { color: ORANGE, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  infoBanner:    { flexDirection: 'row', gap: 12, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: ORANGE, backgroundColor: 'rgba(226,103,27,0.1)', marginBottom: 16, overflow: 'hidden' },
  infoText:      { color: '#fff', fontSize: 10, fontFamily: 'Poppins_400Regular', flex: 1, lineHeight: 16 },

  uploadArea:    { borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(226,103,27,0.6)', borderStyle: 'dashed', paddingVertical: 36, paddingHorizontal: 16, alignItems: 'center', marginBottom: 16 },
  uploadTitle:   { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginTop: 10 },
  uploadSub:     { color: '#8f9cb5', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 4 },

  label:         { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginBottom: 8, marginTop: 14 },
  inputWrap:     { height: 48, borderRadius: 30, paddingHorizontal: 18, justifyContent: 'center', backgroundColor: BG, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', overflow: 'hidden' },
  input:         { color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular', padding: 0 },

  dropdown:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: BG, borderRadius: 30, paddingHorizontal: 18, paddingVertical: 13, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', overflow: 'hidden' },
  dropdownText:  { color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  dropMenu:      { marginTop: 4, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(80,123,182,0.4)', backgroundColor: '#0D1E3F', overflow: 'hidden', marginBottom: 4 },
  dropItem:      { paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dropItemTxt:   { color: '#C8D3E8', fontSize: 13, fontFamily: 'Poppins_400Regular' },

  chipsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  chip:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  chipActive:    { borderColor: ORANGE, backgroundColor: 'rgba(226,103,27,0.08)' },
  chipText:      { color: '#c3cee2', fontSize: 12, fontFamily: 'Poppins_500Medium' },
  chipTextActive:{ color: ORANGE },

  sectionTitle:  { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginTop: 20, marginBottom: 10 },
  subLabel:      { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
  dateLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: -8 },
  dateLabel:  { color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  dateRow:    { flexDirection: 'row', gap: 12 },

  pricingCard:    { borderRadius: 20, padding: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(226,103,27,0.35)', marginTop: 20, position: 'relative', backgroundColor: BG },
  flameCorner:    { position: 'absolute', top: 0, left: 0, width: 44, height: 44, backgroundColor: ORANGE, borderTopLeftRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pricingTitle:   { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold', marginTop: 28, marginBottom: 6, lineHeight: 22 },
  pricingSubtitle:{ color: '#c3cee2', fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 16 },
  durationBtn:    { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 10 },
  durationBtnActive:{ borderColor: ORANGE, borderWidth: 1.5 },
  durationKey:    { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  durationNote:   { color: '#9fb0cc', fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  durationPrice:  { color: '#c3cee2', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  termsRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 20 },
  termsText:     { color: '#c3cee2', fontSize: 12, fontFamily: 'Poppins_400Regular', flex: 1, lineHeight: 18 },

  footer:        { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, overflow: 'hidden' },
  publishWrap:   { borderRadius: 30, overflow: 'hidden', marginBottom: 10 },
  publishBtn:    { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  publishText:   { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  draftBtn:      { borderRadius: 30, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  draftText:     { color: '#fff', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
});
