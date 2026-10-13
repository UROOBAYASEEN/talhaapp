import VerifiedIcon from '@/components/shared/VerifiedIcon';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList,
  Image, Linking, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors, LIGHT_POP_SHADOW, withLightStyles } from '@/constants/theme';
import LightGradientBorder from '@/components/shared/LightGradientBorder';
import { CtaPanelGlass, PRIMARY_BTN_COLORS, RingGlow } from '@/components/shared/FigmaEffects';

import SheetModal from '@/components/shared/SheetModal';
const { width: W } = Dimensions.get('window');
const BG     = '#010A1F';
const ORANGE = '#e2671b';
const NAVY   = '#032a69';
const WHITE  = '#f9fafc';
const MUTED  = '#baacb6';
const BORDER = 'rgba(255,255,255,0.1)';
const AMBER  = '#f59e0b';

const SERVER_BASE = API_BASE.replace('/api/v1', '');
function resolveUrl(url?: string) {
  if (!url || url.startsWith('file://')) return null;
  // replace any old server IP with current one
  if (url.startsWith('http')) {
    return url.replace(/http:\/\/[\d.]+:\d+/, SERVER_BASE);
  }
  return `${SERVER_BASE}${url}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DealerProfileScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const st = aC.isDark ? s : sLight;
  const { id, from, category } = useLocalSearchParams<{ id: string; from?: string; category?: string }>();
  const isBike = category === 'bike';
  // Came from Buy Used Car → View Available Cars + Call / Chat / WhatsApp (Figma)
  const fromUsedCar = from === 'usedCar';
  const [chatting, setChatting] = useState(false);
  const { token, user } = useAuth();

  const [dealer,      setDealer]      = useState<any>(null);
  const [reviews,     setReviews]     = useState<any[]>([]);
  const [vehicles,    setVehicles]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [following,     setFollowing]     = useState(false);
  const [ctaHeight,     setCtaHeight]     = useState(200);
  const [saved,         setSaved]         = useState(false);
  const [toggling,      setToggling]      = useState(false);
  const [reviewModal,   setReviewModal]   = useState(false);
  const [reviewRating,  setReviewRating]  = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingRev, setSubmittingRev] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    try {
      const h: any = token ? { Authorization: `Bearer ${token}` } : {};
      const [dRes, rRes, vRes] = await Promise.all([
        fetch(`${API_BASE}/dealers/${id}`, { headers: h }),
        fetch(`${API_BASE}/dealers/${id}/reviews`, { headers: h }),
        fetch(`${API_BASE}/vehicles?seller_id=${id}&limit=10`, { headers: h }),
      ]);
      if (dRes.ok) {
        const d = await dRes.json();
        setDealer(d);
        setFollowing(d.is_following ?? false);
      }
      if (rRes.ok) { const d = await rRes.json(); setReviews(d || []); }
      if (vRes.ok) { const d = await vRes.json(); setVehicles(d.items || []); }
    } catch { }
    finally { setLoading(false); }
  }

  async function toggleFollow() {
    if (!token) { Alert.alert('Login Required', 'Please login to follow.'); return; }
    setToggling(true);
    try {
      const res = await fetch(`${API_BASE}/dealers/${id}/follow`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setFollowing(d.is_following ?? d.following ?? false); }
    } catch { }
    finally { setToggling(false); }
  }

  async function handleChat() {
    if (!token) { Alert.alert('Login Required', 'Please login to chat with the dealer.'); return; }
    if (user?.id === id) { Alert.alert('Info', 'This is your own profile.'); return; }
    setChatting(true);
    try {
      const res = await fetch(`${API_BASE}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to_user_id: id, content: `Hi! I am interested in your ${isBike ? 'bikes' : 'cars'}.` }),
      });
      const d = await res.json();
      if (res.ok && d.conversation_id) {
        router.push({ pathname: '/chat-room/[id]', params: { id: d.conversation_id, name: dealer?.dealership_name || dealer?.full_name || 'Dealer' } } as any);
      } else {
        Alert.alert('Error', d.detail || 'Could not open chat. Try again.');
      }
    } catch { Alert.alert('Error', 'Network error. Check your connection.'); }
    finally { setChatting(false); }
  }

  function handleWhatsApp() {
    const raw = String(dealer?.whatsapp || dealer?.phone || '').replace(/\D/g, '');
    if (!raw) { Alert.alert('Not Available', 'No WhatsApp number listed.'); return; }
    const intl = raw.startsWith('0') ? `92${raw.slice(1)}` : raw;
    Linking.openURL(`https://wa.me/${intl}`);
  }

  function handleCall() {
    const ph = dealer?.phone;
    if (!ph) { Alert.alert('Not Available', 'No phone number listed.'); return; }
    Linking.openURL(`tel:${ph}`);
  }

  async function submitReview() {
    if (!token) { Alert.alert('Login Required', 'Please login to submit a review.'); return; }
    if (!reviewComment.trim()) { Alert.alert('Required', 'Please write a comment.'); return; }
    setSubmittingRev(true);
    try {
      const res = await fetch(`${API_BASE}/dealers/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() }),
      });
      const d = await res.json();
      if (res.ok) {
        setReviews(prev => [d, ...prev]);
        setReviewModal(false);
        setReviewComment('');
        setReviewRating(5);
        Alert.alert('Thank you!', 'Your review has been submitted.');
      } else {
        Alert.alert('Error', d.detail || 'Could not submit review.');
      }
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setSubmittingRev(false); }
  }

  if (loading)
    return <View style={{ flex: 1, backgroundColor: aC.isDark ? BG : '#ffffff', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={ORANGE} size="large" /></View>;

  if (!dealer)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: aC.isDark ? BG : '#ffffff', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Ionicons name="alert-circle-outline" size={48} color={MUTED} />
        <Text style={{ color: aC.isDark ? WHITE : '#000000', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }}>Dealer not found</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: ORANGE, fontFamily: 'Poppins_500Medium' }}>Go Back</Text></TouchableOpacity>
      </SafeAreaView>
    );

  const name       = dealer.dealership_name || dealer.full_name || 'Dealer';
  const isDealer   = dealer.role === 'dealership_owner';
  const cover      = resolveUrl(dealer.cover_photo_url);
  const avatar     = resolveUrl(dealer.avatar_url);
  const initial    = name[0]?.toUpperCase();
  const avgRating  = dealer.avg_rating || 0;
  const reviewCount= dealer.review_count || 0;

  const stats = [
    { icon: 'car-outline'      as const, label: `${dealer.vehicle_count || 0}+ Vehicles` },
    { icon: 'people-outline'   as const, label: `${dealer.follower_count || 0}+ Followers` },
    { icon: 'calendar-outline' as const, label: dealer.established_year ? `Since ${dealer.established_year}` : 'Established' },
  ];

  const workingHours = dealer.working_hours
    ? dealer.working_hours.split('\n')
    : ['—'];

  const contactInfo = [
    { icon: 'location-outline' as const, title: 'Location',     lines: [dealer.city || '—', 'Pakistan'] },
    { icon: 'call-outline'     as const, title: 'Contact',      lines: [dealer.phone || '—', dealer.email || '—'] },
    { icon: 'time-outline'     as const, title: 'Working hour', lines: workingHours },
  ];

  return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.isDark ? BG : '#ffffff'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: ctaHeight + 24 }}>

        {/* ── Banner ── */}
        <View style={st.bannerWrap}>
          {cover
            ? <Image source={{ uri: cover }} style={st.bannerImg} resizeMode="cover" />
            : <LinearGradient colors={['#1a2440', '#0e1526']} style={st.bannerImg} />
          }
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' }} />

          {/* Back btn */}
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={WHITE} />
          </TouchableOpacity>

          {/* Logo */}
          <View style={st.logoRow}>
            <Text style={st.logoW}>Auto</Text>
            <Text style={st.logoO}>wizor</Text>
          </View>

          {/* Dealer avatar overlapping */}
          <View style={st.avatarWrap}>
            {avatar
              ? <Image source={{ uri: avatar }} style={st.avatarImg} resizeMode="cover" />
              : <View style={st.avatarFallback}><Text style={st.avatarInitial}>{initial}</Text></View>
            }
          </View>
        </View>

        {/* ── Body ── */}
        <View style={st.body}>

          {/* Name row */}
          <View style={st.nameRow}>
            <View style={{ flex: 1 }}>
              <View style={st.nameVerifiedRow}>
                <Text style={st.name} numberOfLines={2}>{name}</Text>
                <VerifiedIcon size={17} style={{ marginLeft: 6, marginTop: 4 }} />
              </View>
              <Text style={st.subtitle}>{isDealer ? 'Official Dealership' : 'Non Dealership'}</Text>
            </View>
            <View style={st.iconRow}>
              <TouchableOpacity><Ionicons name="share-social-outline" size={18} color={ORANGE} /></TouchableOpacity>
              <TouchableOpacity onPress={() => setSaved(v => !v)}>
                <Ionicons name={saved ? 'heart' : 'heart-outline'} size={18} color={ORANGE} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Rating + Follow */}
          <View style={st.ratingFollowRow}>
            <View style={st.ratingRow}>
              <Ionicons name="star" size={17} color={ORANGE} />
              <Text style={st.ratingVal}>{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</Text>
              <Text style={st.ratingCount}>({reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'})</Text>
            </View>
            <TouchableOpacity
              style={st.followBtn}
              onPress={toggleFollow}
              disabled={toggling}
              activeOpacity={0.85}
            >
              {aC.isDark && <LinearGradient colors={['#1E3F7C', '#132C5E', '#0F2653']} locations={[0, 0.5, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
              {aC.isDark && <LinearGradient colors={['rgba(120,160,225,0.35)', 'transparent', 'transparent', 'rgba(120,160,225,0.25)']} locations={[0, 0.25, 0.75, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
              <Text style={st.followTxt}>{following ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={st.statsRow}>
            {stats.map((stat, i) => (
              <React.Fragment key={i}>
                <View style={st.statItem}>
                  <Ionicons name={stat.icon} size={15} color={ORANGE} />
                  <Text style={st.statTxt}>{stat.label}</Text>
                </View>
                {i < stats.length - 1 && <View style={st.statSep} />}
              </React.Fragment>
            ))}
          </View>

          {/* About */}
          <Text style={st.secTitle}>About Dealership</Text>
          <Text style={st.aboutTxt}>
            {dealer.bio || `${name} is an authorized dealership offering genuine new vehicles, certified after-sales services, original spare parts, and manufacturer warranty with professional customer support.`}
          </Text>

          {/* Contact Info */}
          <View style={st.contactGrid}>
            {contactInfo.map((c, i) => (
              <View key={i} style={st.contactItem}>
                <Ionicons name={c.icon} size={18} color={ORANGE} style={{ marginBottom: 6 }} />
                <Text style={st.contactTitle}>{c.title}</Text>
                {c.lines.map((line: any, li: any) => (
                  <Text key={li} style={st.contactLine}>{line}</Text>
                ))}
              </View>
            ))}
          </View>


          {/* ── Rating Summary ── */}
          <View style={st.rateCard}>
            <View style={st.rateLeft}>
              {[5, 4, 3, 2, 1].map(star => {
                const total = reviewCount || reviews.length;
                const c = reviews.filter((r: any) => Math.round(r.rating || 0) === star).length;
                const pct = total > 0 ? (c / total) * 100 : 0;
                return (
                  <View key={star} style={st.rateRow}>
                    <Text style={st.rateNum}>{star}</Text>
                    <Ionicons name="star" size={12} color={ORANGE} />
                    <View style={st.rateTrack}>
                      <View style={[st.rateFill, { width: `${pct}%` as any }]} />
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={st.rateRight}>
              <Text style={st.rateBig}>
                {(avgRating > 0 ? avgRating : (reviews.length ? reviews.reduce((a: number, r: any) => a + (r.rating || 0), 0) / reviews.length : 0)).toFixed(1)}
              </Text>
              <View style={st.rateStars}>
                {Array.from({ length: 5 }).map((_, si) => {
                  const avg = avgRating > 0 ? avgRating : (reviews.length ? reviews.reduce((a: number, r: any) => a + (r.rating || 0), 0) / reviews.length : 0);
                  return <Ionicons key={si} name="star" size={14} color={si < Math.round(avg) ? ORANGE : '#64748b'} />;
                })}
              </View>
              <Text style={st.rateCount}>{reviewCount || reviews.length} Reviews</Text>
            </View>
          </View>

          {/* Reviews */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={st.secTitle}>Reviews</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(226,103,27,0.12)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(226,103,27,0.4)' }}
                onPress={() => setReviewModal(true)}
              >
                <Ionicons name="pencil-outline" size={13} color={ORANGE} />
                <Text style={{ color: ORANGE, fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>Write Review</Text>
              </TouchableOpacity>
            </View>
            {reviews.length === 0 ? (
              <Text style={{ color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular' }}>No reviews yet.</Text>
            ) : (
              reviews.map((r: any, i: number) => {
                const init = (r.reviewer_name || 'U')[0].toUpperCase();
                const stars = Math.round(r.rating || 0);
                return (
                  <View key={i} style={[st.reviewCard, i < reviews.length - 1 && st.reviewBorder]}>
                    <View style={st.reviewHeader}>
                      <View style={st.reviewLeft}>
                        <View style={[st.reviewAvatar, { backgroundColor: i % 2 === 0 ? ORANGE : '#64748b' }]}>
                          <Text style={st.reviewAvatarTxt}>{init}</Text>
                        </View>
                        <View>
                          <Text style={st.reviewName}>{r.reviewer_name || 'User'}</Text>
                          <View style={st.starsRow}>
                            {Array.from({ length: 5 }).map((_, si) => (
                              <Ionicons key={si} name={si < stars ? 'star' : 'star-outline'} size={11} color={si < stars ? AMBER : '#475569'} />
                            ))}
                            <Text style={st.reviewTime}>{r.created_at ? timeAgo(r.created_at) : '2 mins ago'}</Text>
                          </View>
                        </View>
                      </View>
                      <Ionicons name="ellipsis-vertical" size={16} color={MUTED} />
                    </View>
                    <Text style={st.reviewTxt}>"{r.comment || r.text || ''}"</Text>
                  </View>
                );
              })
            )}
            {reviews.length > 0 && (
              <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 4 }} onPress={() => router.push({ pathname: '/dealer-panel/reviews', params: { dealer_id: id } } as any)}>
                <Text style={{ color: aC.isDark ? WHITE : '#1F3F7A', fontSize: 13, fontFamily: 'Poppins_400Regular', textDecorationLine: 'underline' }}>See More</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </ScrollView>
      {/* ── Fixed Bottom CTA ── */}
      <View style={st.ctaBox} onLayout={(e) => setCtaHeight(Math.ceil(e.nativeEvent.layout.height))}>
        {aC.isDark && <CtaPanelGlass />}
        <View style={st.ctaHandle} />

        {fromUsedCar || !isDealer ? (
          <>
            <TouchableOpacity style={st.ctaPrimary} onPress={() => router.push({ pathname: '/buy/search-results' as any, params: { dealerId: id, brand: name, ...(isBike ? { category: 'bike' } : {}) } })} activeOpacity={0.88}>
              <LinearGradient colors={(aC.isDark ? PRIMARY_BTN_COLORS : ['#27467F', '#8C6A78', '#FF9654']) as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
              <Text style={st.ctaPrimaryTxt}>{isBike ? 'View Available Bikes' : 'View Available Cars'}</Text>
            </TouchableOpacity>
            <View style={st.usedContactRow}>
              <TouchableOpacity style={st.usedContactItem} onPress={handleCall} activeOpacity={0.8}>
                <Ionicons name="call-outline" size={24} color={ORANGE} />
                <Text style={st.usedContactTxt}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.usedContactItem} onPress={handleChat} disabled={chatting} activeOpacity={0.8}>
                {chatting ? <ActivityIndicator color={ORANGE} size="small" /> : <Ionicons name="chatbox-ellipses-outline" size={24} color={ORANGE} />}
                <Text style={st.usedContactTxt}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.usedContactItem} onPress={handleWhatsApp} activeOpacity={0.8}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                <Text style={st.usedContactTxt}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
        <TouchableOpacity style={st.ctaPrimary} onPress={handleCall} activeOpacity={0.88}>
          <LinearGradient colors={(aC.isDark ? PRIMARY_BTN_COLORS : ['#27467F', '#8C6A78', '#FF9654']) as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          <Ionicons name="call-outline" size={21} color={WHITE} />
          <Text style={st.ctaPrimaryTxt}>Call Dealer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={st.ctaPrimary} onPress={() => router.push('/buy/reserve' as any)} activeOpacity={0.88}>
          <LinearGradient colors={(aC.isDark ? PRIMARY_BTN_COLORS : ['#27467F', '#8C6A78', '#FF9654']) as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          <Text style={st.ctaPrimaryTxt}>{isBike ? 'Reserve your bike' : 'Reserve your car'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={st.ctaGlass} onPress={() => router.push({ pathname: '/buy/search-results' as any, params: { dealerId: id, brand: name, ...(isBike ? { category: 'bike' } : {}) } })} activeOpacity={0.88}>
          {aC.isDark ? <RingGlow radius={26} peak={0.5} rings={12} /> : <LightGradientBorder radius={26} fill="#ffffff" colors={aC.isDark ? ['#032a69', '#e2671b'] : ['#27467F', '#FF9654']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />}
          <Text style={st.ctaGlassTxt}>{isBike ? 'View Available Bikes' : 'View Available Cars'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[st.usedContactItem, { alignSelf: 'center' }]} onPress={handleWhatsApp} activeOpacity={0.8}>
          <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          <Text style={st.usedContactTxt}>WhatsApp</Text>
        </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Review Modal ── */}
      <SheetModal visible={reviewModal} transparent animationType="slide" onRequestClose={() => setReviewModal(false)}>
        <TouchableOpacity style={rm.overlay} activeOpacity={1} onPress={() => setReviewModal(false)}>
          <TouchableOpacity activeOpacity={1} style={rm.sheet}>
            {aC.isDark && <LinearGradient colors={['rgba(22,64,136,0.2)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>}
            {aC.isDark && <LinearGradient colors={['transparent','rgba(29,83,175,0.15)']} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>}

            <View style={rm.handle} />

            <View style={rm.header}>
              <Text style={rm.title}>Write a Review</Text>
              <TouchableOpacity onPress={() => setReviewModal(false)} style={rm.closeBtn}>
                <Ionicons name="close" size={18} color={MUTED} />
              </TouchableOpacity>
            </View>

            {/* Star Rating */}
            <Text style={rm.label}>Your Rating</Text>
            <View style={rm.starsRow}>
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)} style={{ padding: 4 }}>
                  <Ionicons name={star <= reviewRating ? 'star' : 'star-outline'} size={30} color={star <= reviewRating ? AMBER : '#475569'} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment */}
            <Text style={rm.label}>Your Review</Text>
            <View style={rm.inputWrap}>
              <TextInput
                style={rm.input}
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Share your experience with this dealership..."
                placeholderTextColor={MUTED}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity style={rm.submitBtn} onPress={submitReview} disabled={submittingRev} activeOpacity={0.88}>
              <LinearGradient colors={aC.isDark ? [NAVY, ORANGE] : ['#27467F', '#FF9654']} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} />
              {submittingRev
                ? <ActivityIndicator color={WHITE} />
                : <Text style={rm.submitTxt}>Submit Review</Text>
              }
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </TouchableOpacity>
        </TouchableOpacity>
      </SheetModal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  bannerWrap: { position: 'relative', height: 230 },
  bannerImg:  { width: W, height: 230 },
  backBtn:    { position: 'absolute', top: 12, left: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  logoRow:    { position: 'absolute', top: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  logoW:      { color: WHITE,  fontSize: 18, fontFamily: 'Poppins_700Bold' },
  logoO:      { color: ORANGE, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  avatarWrap: { position: 'absolute', bottom: -44, left: 16, width: 80, height: 80, borderRadius: 40, backgroundColor: WHITE, overflow: 'hidden', borderWidth: 2, borderColor: WHITE, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  avatarImg:  { width: 76, height: 76 },
  avatarFallback: { width: 76, height: 76, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { color: WHITE, fontSize: 24, fontFamily: 'Poppins_700Bold' },

  body: { paddingHorizontal: 16, paddingTop: 10 },

  nameRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingLeft: 92 },
  nameVerifiedRow:{ flexDirection: 'row', alignItems: 'flex-start' },
  name:           { color: WHITE, fontSize: 17, fontFamily: 'Poppins_600SemiBold', flexShrink: 1 },
  subtitle:       { color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 0 },
  iconRow:        { flexDirection: 'row', gap: 14, paddingTop: 3 },

  ratingFollowRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, paddingLeft: 92 },
  ratingRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  ratingVal:      { color: '#D9D6DF', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  ratingCount:    { color: '#D9D6DF', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  followBtn:      { minWidth: 86, height: 34, paddingHorizontal: 20, borderRadius: 17, borderWidth: 1, borderColor: '#7E9FD6', backgroundColor: '#132C5E', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#4F7FD0', shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  followTxt:      { color: '#D9D6DF', fontSize: 13, fontFamily: 'Poppins_500Medium' },

  statsRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER, marginTop: 16, paddingVertical: 12 },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statTxt:  { color: WHITE, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  statSep:  { width: 1, height: 18, backgroundColor: BORDER },

  secTitle: { color: WHITE, fontSize: 16, fontFamily: 'Poppins_700Bold', marginTop: 20, marginBottom: 8 },
  aboutTxt: { color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 22 },

  contactGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  contactItem: { flex: 1, alignItems: 'center' },
  contactTitle:{ color: WHITE, fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginBottom: 3 },
  contactLine: { color: MUTED, fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 16 },

  ctaBox:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0f1830', borderTopWidth: 1, borderColor: BORDER, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 20 },
  ctaHandle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 2 },
  ctaPrimary:      { height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden' },
  ctaPrimaryTxt:   { color: WHITE, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  usedContactRow:  { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 4, paddingBottom: 2 },
  usedContactItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  usedContactTxt:  { color: '#E6E4EA', fontSize: 16, fontFamily: 'Poppins_400Regular' },
  ctaGlass:        { height: 52, borderRadius: 26, borderWidth: 1, borderColor: '#7E9FD6', backgroundColor: '#07142F', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ctaGlassTxt:     { color: '#C9C6D0', fontSize: 15, fontFamily: 'Poppins_400Regular' },
  ctaSecondary:    { height: 52, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', backgroundColor: 'rgba(3,12,40,0.6)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ctaSecondaryTxt: { color: WHITE, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

  rateCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2150', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', paddingHorizontal: 16, paddingVertical: 18, marginTop: 20, gap: 12, overflow: 'hidden' },
  rateLeft:   { flex: 1, gap: 9 },
  rateRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rateNum:    { color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium', width: 10 },
  rateTrack:  { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  rateFill:   { height: 8, borderRadius: 4, backgroundColor: '#b9b3c7' },
  rateRight:  { width: 110, alignItems: 'flex-end', gap: 6 },
  rateBig:    { color: '#c9c2d4', fontSize: 44, fontFamily: 'Poppins_700Bold', lineHeight: 48 },
  rateStars:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rateCount:  { color: '#c9c2d4', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  reviewCard:   { paddingVertical: 16 },
  reviewBorder: { borderBottomWidth: 1, borderColor: BORDER },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  reviewLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarTxt:{ color: WHITE, fontSize: 14, fontFamily: 'Poppins_700Bold' },
  reviewName:   { color: WHITE, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  starsRow:     { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 },
  reviewTime:   { color: MUTED, fontSize: 11, fontFamily: 'Poppins_400Regular', marginLeft: 4 },
  reviewTxt:    { color: '#cbd5e1', fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 8, paddingLeft: 48, lineHeight: 20 },
});

const rm = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: BG, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', paddingHorizontal: 20, overflow: 'hidden' },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  title:     { color: WHITE, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  closeBtn:  { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  label:     { color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 10 },
  starsRow:  { flexDirection: 'row', gap: 4, marginBottom: 18 },
  inputWrap: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: 'rgba(3,12,40,0.6)', padding: 14, marginBottom: 20, minHeight: 110 },
  input:     { color: WHITE, fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  submitBtn: { height: 52, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  submitTxt: { color: WHITE, fontSize: 15, fontFamily: 'Poppins_700Bold' },
});

// ── Light mode overrides (Figma light) — dark mode uses `s` as is ──────────
const sLight = withLightStyles(s, {
  root:           { backgroundColor: '#ffffff' },
  name:           { color: '#000000' },
  subtitle:       { color: '#4b5563' },
  ratingVal:      { color: '#000000' },
  ratingCount:    { color: '#000000' },
  followBtn:      { backgroundColor: '#1F3F7A', borderColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  followTxt:      { color: '#ffffff' },
  statsRow:       { borderColor: 'rgba(0,0,0,0.1)' },
  statTxt:        { color: '#000000' },
  statSep:        { backgroundColor: 'rgba(0,0,0,0.12)' },
  secTitle:       { color: '#000000' },
  aboutTxt:       { color: '#4b5563' },
  contactTitle:   { color: '#000000' },
  contactLine:    { color: '#4b5563' },
  ctaBox:         { backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.06)', shadowOpacity: 0, elevation: 0, boxShadow: '0px -3px 8px rgba(0,0,0,0.14)' },
  ctaHandle:      { backgroundColor: 'rgba(0,0,0,0.15)' },
  ctaPrimary:     { boxShadow: LIGHT_POP_SHADOW },
  usedContactTxt: { color: '#000000' },
  ctaGlass:       { backgroundColor: '#ffffff', borderWidth: 0 },
  ctaGlassTxt:    { color: '#000000' },
  rateCard:       { backgroundColor: '#F2F4F8', borderColor: 'rgba(0,0,0,0.04)', boxShadow: LIGHT_POP_SHADOW },
  rateNum:        { color: '#000000' },
  rateTrack:      { backgroundColor: 'rgba(0,0,0,0.1)' },
  rateFill:       { backgroundColor: '#1F3F7A' },
  rateBig:        { color: '#000000' },
  rateCount:      { color: '#4b5563' },
  reviewBorder:   { borderColor: 'rgba(0,0,0,0.1)' },
  reviewName:     { color: '#000000' },
  reviewTime:     { color: '#6b7280' },
  reviewTxt:      { color: '#374151' },
});
