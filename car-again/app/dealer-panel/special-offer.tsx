import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator, AppState, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import {
  ChevronLeft, Bookmark, Lightbulb, Upload,
  ChevronDown, Calendar, Circle, CheckCircle2,
  X, Zap,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;

const PAGES      = ['Insurance page', 'Booking page', 'New car page', 'Used car page', 'Finance page'];
const USER_TYPES = ['All Users', 'Buyers', 'Sellers'];
const CITIES     = ['All Cities', 'Karachi', 'Lahore', 'Islamabad'];
const BOOSTS     = [
  { id: '6w', weeks: 6, title: '6 weeks', subtitle: 'Recommended for popular cars',     price: 'PKR 6,650' },
  { id: '4w', weeks: 4, title: '4 weeks', subtitle: 'Balanced exposure for more buyers', price: 'PKR 5,500' },
  { id: '2w', weeks: 2, title: '2 weeks', subtitle: 'Notify buyers about new listings',  price: 'PKR 4,450' },
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

export default function SpecialOfferScreen() {
  const router    = useRouter();
  const { token } = useAuth();

  const [page,         setPage]         = useState('Insurance page');
  const [userType,     setUserType]     = useState('All Users');
  const [city,         setCity]         = useState('All Cities');
  const [agreed,       setAgreed]       = useState(false);
  const [bannerTitle,  setBannerTitle]  = useState('');
  const [description,  setDescription]  = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [startDate,    setStartDate]    = useState('');
  const [endDate,      setEndDate]      = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [showPromote,  setShowPromote]  = useState(false);
  const [promoteBoost, setPromoteBoost] = useState('6w');
  const [paying,       setPaying]       = useState(false);
  const [waiting,      setWaiting]      = useState(false);

  const bannerAdIdRef  = useRef<string | null>(null);
  const checkoutUrlRef = useRef<string | null>(null);
  const pollRef        = useRef<any>(null);
  const isWaitingRef   = useRef(false);
  const appStateRef    = useRef(AppState.currentState);

  useEffect(() => {
    const appSub  = AppState.addEventListener('change', next => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active' && isWaitingRef.current) startPolling();
      appStateRef.current = next;
    });
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('payment-success') && isWaitingRef.current) { stopPolling(); finish(); }
    });
    return () => { appSub.remove(); linkSub.remove(); stopPolling(); };
  }, []);

  function startPolling() { stopPolling(); pollStatus(); pollRef.current = setInterval(pollStatus, 2500); }
  function stopPolling()  { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }
  function finish()       { isWaitingRef.current = false; setWaiting(false); setPaying(false); router.replace('/vehicle/payment-success' as any); }

  async function pollStatus() {
    const id = bannerAdIdRef.current;
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/banner-ads/status/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) { stopPolling(); finish(); }
    } catch {}
  }

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

  // Step 1 — Publish: upload image + create banner via checkout → show promote modal
  async function handlePublish() {
    if (!agreed) { Alert.alert('Terms Required', 'Please accept the terms and conditions.'); return; }
    if (!bannerTitle.trim()) { Alert.alert('Title Required', 'Please enter a banner title.'); return; }
    setSubmitting(true);
    try {
      const imageUrl = await uploadImage();
      const res = await fetch(`${API_BASE}/banner-ads/checkout`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:            bannerTitle.trim(),
          description:      description.trim() || null,
          campaign_name:    campaignName.trim() || null,
          show_on_pages:    [page],
          user_type:        userType,
          cities:           city === 'All Cities' ? [] : [city],
          boost_weeks:      6,
          start_date:       startDate || null,
          end_date:         endDate   || null,
          banner_image_url: imageUrl ?? undefined,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed to create banner'); }
      const data = await res.json();
      bannerAdIdRef.current  = data.banner_ad_id;
      checkoutUrlRef.current = data.checkout_url;
      setShowPromote(true);
    } catch (e: any) {
      Alert.alert('Error', (e as any).message || 'Could not create banner.');
    } finally {
      setSubmitting(false);
    }
  }

  // Step 2 — Pay Now: record advertisement payment → under review (no free publish)
  async function handlePay() {
    const selected = BOOSTS.find(b => b.id === promoteBoost)!;
    const priceNum = parseInt(selected.price.replace(/[^\d]/g, ''), 10) || 0;
    setPaying(true);
    try {
      await fetch(`${API_BASE}/admin/payments/advertisement`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: priceNum, boost_weeks: selected.weeks, title: bannerTitle || 'Special Offer Banner' }),
      });
    } catch {}
    finally { setPaying(false); }
    Alert.alert('Under Review', 'Your ad is under review, after approval you can check.', [
      { text: 'OK', onPress: () => { setShowPromote(false); router.back(); } },
    ]);
    return;
  }

  async function handleCheckStatus() {
    const id = bannerAdIdRef.current;
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/banner-ads/status/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.success) { stopPolling(); finish(); }
        else Alert.alert('Not confirmed yet', 'Payment not received yet. Please complete payment in the browser.');
      }
    } catch {}
  }

  function handleDraft() {
    Alert.alert('Saved', 'Special Offer saved as draft.');
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.container}>

          {/* HEADER */}
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color={C.textPrimary} strokeWidth={2}/>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Special Offer Details</Text>
            <TouchableOpacity style={s.draftTopBtn} onPress={handleDraft}>
              <Bookmark size={18} color={ORANGE} fill={ORANGE}/>
              <Text style={s.draftTopTxt}>Save Draft</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

            {/* RECOMMENDATION */}
            <View style={s.recCard}>
              <LinearGradient colors={['transparent','rgba(226,103,27,0.35)']} start={{x:0.5,y:0.5}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <View style={s.recIconWrap}>
                <Lightbulb size={16} color={ORANGE} fill={'rgba(226,103,27,0.3)'}/>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.recTitle}>Banner Ads are best for promoting special offers…</Text>
                <Text style={s.recText}>Best for: Quick visibility & offer discovery.</Text>
              </View>
            </View>

            {/* UPLOAD */}
            <TouchableOpacity style={s.uploadBox} onPress={pickImage} activeOpacity={0.8}>
              <Upload size={26} color={ORANGE}/>
              <Text style={s.uploadTitle}>{uploadedFile ? '✓ Image selected' : '+ Upload Banner Image'}</Text>
              <Text style={s.uploadSub}>{uploadedFile ? uploadedFile.split('/').pop() : 'Tap to browse. Recommended 16:9 ratio.'}</Text>
            </TouchableOpacity>

            {/* BANNER TITLE */}
            <Text style={s.label}>Banner Title</Text>
            <View style={s.inputBox}>
              <GlassInset/>
              <TextInput style={s.input} placeholder="e.g. Summer Auto Sale" placeholderTextColor={C.textPlaceholder} value={bannerTitle} onChangeText={setBannerTitle}/>
            </View>

            {/* SHORT DESCRIPTION */}
            <Text style={s.label}>Short Description</Text>
            <View style={[s.inputBox, s.textAreaBox]}>
              <GlassInset/>
              <TextInput style={[s.input, s.textArea]} placeholder="Catchy description for the banner..." placeholderTextColor={C.textPlaceholder} value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top"/>
            </View>

            {/* CAMPAIGN NAME */}
            <Text style={s.label}>Campaign Name <Text style={s.labelOptional}>(Optional)</Text></Text>
            <View style={s.inputBox}>
              <GlassInset/>
              <TextInput style={s.input} placeholder="e.g. Summer Campaign 2025" placeholderTextColor={C.textPlaceholder} value={campaignName} onChangeText={setCampaignName}/>
            </View>

            {/* SHOW ON PAGE */}
            <Text style={s.label}>Show on Page</Text>
            <View style={s.chipsRow}>
              {PAGES.map(p => (
                <TouchableOpacity key={p} style={[s.chip, page === p && s.chipActive]} onPress={() => setPage(p)}>
                  <Text style={[s.chipText, page === p && s.chipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.recLine}><Text style={s.recOrange}>Recommendations: </Text><Text style={s.recMuted}>Featured Banner</Text></Text>

            {/* DISPLAY LOCATION */}
            <Text style={s.label}>Display Location</Text>
            <View style={s.dropdownBox}>
              <GlassInset/>
              <Text style={s.dropdownText}>Home Screen Top</Text>
              <ChevronDown size={16} color={C.textSecondary}/>
            </View>

            {/* PARTNER */}
            <Text style={s.label}>Partner Selection</Text>
            <View style={s.dropdownBox}>
              <GlassInset/>
              <Text style={s.dropdownText}>Autowizor (Default)</Text>
              <ChevronDown size={16} color={C.textSecondary}/>
            </View>

            {/* SCHEDULE */}
            <Text style={s.label}>Schedule Banner</Text>
            <View style={s.scheduleRow}>
              <View style={s.scheduleCol}>
                <Text style={s.scheduleLabel}>Start Date & Time</Text>
                <View style={s.dateBox}>
                  <GlassInset/>
                  <TextInput style={s.dateInput} placeholder="mm/dd/yyyy" placeholderTextColor={C.textPlaceholder} value={startDate} onChangeText={setStartDate}/>
                  <Calendar size={14} color={C.textSecondary}/>
                </View>
              </View>
              <View style={s.scheduleCol}>
                <Text style={s.scheduleLabel}>End Date & Time</Text>
                <View style={s.dateBox}>
                  <GlassInset/>
                  <TextInput style={s.dateInput} placeholder="mm/dd/yyyy" placeholderTextColor={C.textPlaceholder} value={endDate} onChangeText={setEndDate}/>
                  <Calendar size={14} color={C.textSecondary}/>
                </View>
              </View>
            </View>

            {/* AUDIENCE */}
            <Text style={s.label}>Audience Targeting</Text>
            <Text style={s.subLabel}>User Type</Text>
            <View style={s.chipsRow}>
              {USER_TYPES.map(t => (
                <TouchableOpacity key={t} style={[s.chip, userType === t && s.chipActive]} onPress={() => setUserType(t)}>
                  <Text style={[s.chipText, userType === t && s.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[s.subLabel, { marginTop: 12 }]}>Cities</Text>
            <View style={s.chipsRow}>
              {CITIES.map(c => (
                <TouchableOpacity key={c} style={[s.chip, city === c && s.chipActive]} onPress={() => setCity(c)}>
                  <Text style={[s.chipText, city === c && s.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pricing — banker wala same */}
            <View style={s.pricingCard}>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.45)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <View style={s.flameCorner}><Text style={{ color: '#fff', fontSize: 16 }}>♨</Text></View>
              <Text style={s.pricingTitle}>Ads to Get Your Banner Seen Faster</Text>
              <Text style={s.pricingSubtitle}>Get 5× more visibility by featuring your banner</Text>
              {[
                { label: '6 weeks', sub: 'Recommended for popular offers', price: 'PKR 6,650' },
                { label: '4 weeks', sub: 'Balanced exposure for more users', price: 'PKR 5,500' },
                { label: '2 weeks', sub: 'Quick promotion for short offers', price: 'PKR 4,450' },
              ].map(b => (
                <View key={b.label} style={[s.durationBtn, { borderColor: 'rgba(255,255,255,0.08)' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.durationKey}>{b.label}</Text>
                    <Text style={s.durationNote}>{b.sub}</Text>
                  </View>
                  <Text style={s.durationPrice}>{b.price} {'>'}</Text>
                </View>
              ))}
            </View>

            {/* TERMS */}
            <TouchableOpacity style={s.termsRow} onPress={() => setAgreed(v => !v)}>
              {agreed
                ? <CheckCircle2 size={20} color={ORANGE} fill={ORANGE}/>
                : <Circle size={20} color={C.textSecondary}/>
              }
              <Text style={s.termsText}>I confirm that I have read and accept the terms and conditions and privacy policy.</Text>
            </TouchableOpacity>

            <View style={{ height: 130 }}/>
          </ScrollView>

          {/* BOTTOM */}
          <View style={s.bottomBar}>
            <GlassInset/>
            <TouchableOpacity style={[s.publishBtn, (!agreed || submitting) && { opacity: 0.6 }]} onPress={handlePublish} disabled={submitting} activeOpacity={0.85}>
              <LinearGradient colors={['#c44e00','#ff6900','#ff9a00']} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject}/>
              <LinearGradient colors={['rgba(3,42,105,0.95)','rgba(3,42,105,0.65)','rgba(3,42,105,0.15)']} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              {submitting
                ? <ActivityIndicator color="#fff" size="small"/>
                : <Text style={s.publishTxt}>Publish Banner</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.draftBtn} onPress={handleDraft} activeOpacity={0.8}>
              <GlassInset/>
              <Text style={s.draftTxt}>Save as Draft</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>

      {/* PROMOTE MODAL — same as video-ads PromoteModal */}
      <Modal visible={showPromote} transparent animationType="slide" onRequestClose={() => { if (!waiting) { setShowPromote(false); router.back(); } }}>
        <View style={pm.overlay}>
          <View style={pm.sheet}>
            <GlassInset />

            <TouchableOpacity style={pm.closeBtn} onPress={() => { if (!waiting) { setShowPromote(false); router.back(); } }}>
              <X size={20} color={C.textSecondary} />
            </TouchableOpacity>

            <View style={pm.headerRow}>
              <View style={pm.zapWrap}>
                <LinearGradient colors={[NAVY, ORANGE]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject} />
                <Zap size={22} color="#fff" fill="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={pm.title}>Promote Your Banner</Text>
                <Text style={pm.sub}>Get 5× more views with a boost</Text>
              </View>
            </View>

            <View style={pm.divider} />

            {BOOSTS.map(b => (
              <TouchableOpacity
                key={b.id}
                style={[pm.option, promoteBoost === b.id && pm.optionActive]}
                onPress={() => setPromoteBoost(b.id)}
                activeOpacity={0.8}
              >
                <GlassInset />
                <View style={{ flex: 1 }}>
                  <Text style={pm.optionTitle}>{b.title}</Text>
                  <Text style={pm.optionSub}>{b.subtitle}</Text>
                </View>
                <View style={pm.optionRight}>
                  <Text style={pm.optionPrice}>{b.price}</Text>
                  <View style={[pm.radio, promoteBoost === b.id && pm.radioActive]}>
                    {promoteBoost === b.id && <View style={pm.radioDot} />}
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {waiting && (
              <TouchableOpacity style={pm.checkBtn} onPress={handleCheckStatus}>
                <CheckCircle2 size={16} color={ORANGE} />
                <Text style={pm.checkTxt}>I've paid — Confirm Payment</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[pm.payBtn, (paying || waiting) && { opacity: 0.7 }]}
              onPress={handlePay}
              disabled={paying || waiting}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[NAVY, ORANGE]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} />
              {paying
                ? <ActivityIndicator color="#fff" size="small" />
                : waiting
                ? <Text style={pm.payTxt}>Waiting for payment...</Text>
                : <Text style={pm.payTxt}>Pay Now</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, height: 60 },
  backBtn:     { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  draftTopBtn: { alignItems: 'center', gap: 2 },
  draftTopTxt: { color: ORANGE, fontSize: 10, fontFamily: 'Poppins_500Medium' },

  scrollContent: { paddingHorizontal: 18, paddingTop: 4, gap: 14, paddingBottom: 20 },

  /* RECOMMENDATION */
  recCard:    { flexDirection: 'row', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(226,103,27,0.4)', backgroundColor: C.bg, padding: 14, overflow: 'hidden' },
  recIconWrap:{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(226,103,27,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  recTitle:   { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginBottom: 3 },
  recText:    { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  /* UPLOAD */
  uploadBox:  { borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)', paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center', gap: 10, backgroundColor: C.glassBg },
  uploadTitle:{ color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  uploadSub:  { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center' },

  /* INPUTS */
  label:         { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  labelOptional: { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  inputBox:      { borderRadius: 30, borderWidth: 1, borderColor: 'rgba(99,148,214,0.4)', backgroundColor: C.glassBg, overflow: 'hidden', paddingHorizontal: 18 },
  input:         { height: 46, color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  textAreaBox:   { borderRadius: 18, paddingVertical: 10 },
  textArea:      { height: 90, paddingTop: 4 },

  dropdownBox:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(99,148,214,0.4)', backgroundColor: C.glassBg, overflow: 'hidden', paddingHorizontal: 18, paddingVertical: 14 },
  dropdownText: { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  /* CHIPS */
  chipsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 30, backgroundColor: C.glassBg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive:    { backgroundColor: 'rgba(226,103,27,0.15)', borderColor: ORANGE },
  chipText:      { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  chipTextActive:{ color: ORANGE },
  recLine:       { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  recOrange:     { color: ORANGE, fontStyle: 'italic' },
  recMuted:      { color: C.textSecondary, fontStyle: 'italic' },

  /* SCHEDULE */
  scheduleRow:  { flexDirection: 'row', gap: 12 },
  scheduleCol:  { flex: 1, gap: 6 },
  scheduleLabel:{ color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  dateBox:      { flexDirection: 'row', alignItems: 'center', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(99,148,214,0.4)', backgroundColor: C.glassBg, overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 12 },
  dateInput:    { flex: 1, color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_400Regular' },

  subLabel: { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  pricingCard:    { borderRadius: 20, padding: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(226,103,27,0.35)', marginTop: 20, position: 'relative', backgroundColor: C.bg },
  flameCorner:    { position: 'absolute', top: 0, left: 0, width: 44, height: 44, backgroundColor: ORANGE, borderTopLeftRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pricingTitle:   { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold', marginTop: 28, marginBottom: 6, lineHeight: 22 },
  pricingSubtitle:{ color: '#c3cee2', fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 16 },
  durationBtn:    { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 10 },
  durationKey:    { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  durationNote:   { color: '#9fb0cc', fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  durationPrice:  { color: '#c3cee2', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  /* TERMS */
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  termsText:{ flex: 1, color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  /* BOTTOM */
  bottomBar:  { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 28, backgroundColor: 'rgba(1,10,31,0.96)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', gap: 10 },
  publishBtn: { height: 50, borderRadius: 25, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  publishTxt: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  draftBtn:   { height: 50, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(99,148,214,0.5)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: C.glassBg },
  draftTxt:   { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
});

const pm = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:     { borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: C.glassBg, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', padding: 24, overflow: 'hidden', paddingBottom: 40 },
  closeBtn:  { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  zapWrap:   { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  title:     { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_700Bold' },
  sub:       { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  divider:   { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  checkBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(226,103,27,0.4)', backgroundColor: 'rgba(226,103,27,0.08)', marginBottom: 12 },
  checkTxt:    { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  option:      { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(9,36,92,0.6)', paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10, overflow: 'hidden' },
  optionActive:{ borderColor: ORANGE },
  optionTitle: { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  optionSub:   { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  optionRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 10 },
  optionPrice: { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_700Bold' },
  radio:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: ORANGE },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
  payBtn:      { height: 52, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 12 },
  payTxt:      { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  skipBtn:     { alignItems: 'center', paddingVertical: 8 },
  skipTxt:     { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', textDecorationLine: 'underline' },
});
