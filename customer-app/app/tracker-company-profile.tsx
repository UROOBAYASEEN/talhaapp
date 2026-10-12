import VerifiedIcon from '@/components/shared/VerifiedIcon';
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList,
  Image, Dimensions, ActivityIndicator, RefreshControl, Linking, Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft, MoreVertical,
  Locate, Star, Users, Award, MapPin, Phone, Clock3,
  MessageSquare, ShieldCheck, Share2, Heart,
  Wrench, Car, Scale, ClipboardCheck, Check,
} from 'lucide-react-native';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PRIMARY_BTN_COLORS, RingGlow } from '@/components/shared/FigmaEffects';
import { AppColors, useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

import SheetModal from '@/components/shared/SheetModal';
const { width } = Dimensions.get('window');
const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;
const SERVER = API_BASE.replace('/api/v1', '');

function resolveUrl(url?: string) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${SERVER}${url}`;
}

const ANCILLARY = [
  { icon: <Locate  size={22} color={ORANGE}/>, label: 'Tracker\nInstallation' },
  { icon: <Car     size={22} color={ORANGE}/>, label: 'Roadside\nAssistance'  },
  { icon: <Scale   size={22} color={ORANGE}/>, label: 'Legal\nSupport'        },
  { icon: <ClipboardCheck size={22} color={ORANGE}/>, label: 'Vehicle\nInspection' },
];

export default function TrackerCompanyProfileScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();
  const C = aC;
  const { providerId } = useLocalSearchParams<{ providerId: string }>();

  const [provider,    setProvider]    = useState<any>(null);
  const [reviews,     setReviews]     = useState<any[]>([]);
  const [devices,     setDevices]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [following,   setFollowing]   = useState(false);
  const [chatting,    setChatting]    = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [liked,       setLiked]       = useState(false);
  const [comment,     setComment]     = useState('');

  useEffect(() => { load(); }, [providerId]);

  async function load() {
    if (!providerId) { setLoading(false); return; }
    try {
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
      const [pRes, rRes, dRes] = await Promise.all([
        fetch(`${API_BASE}/tracker-providers/${providerId}`, { headers }),
        fetch(`${API_BASE}/tracker-providers/${providerId}/reviews?limit=2`, { headers }),
        fetch(`${API_BASE}/tracker-devices/?limit=20`),
      ]);
      if (pRes.ok) { const p = await pRes.json(); setProvider(p); setFollowing(p.is_following ?? false); }
      if (rRes.ok) setReviews(await rRes.json());
      if (dRes.ok) {
        const all = await dRes.json();
        setDevices((Array.isArray(all) ? all : all.items || []).filter((d: any) => d.provider_id === providerId));
      }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function toggleFollow() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/tracker-providers/${providerId}/follow`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setFollowing(d.is_following); }
    } catch { /* offline */ }
  }

  async function openChat() {
    if (!token) { Alert.alert('Login Required', 'Please login to chat.'); return; }
    setChatting(true);
    try {
      const res = await fetch(`${API_BASE}/chat/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_user_id: provider?.user_id || provider?.id || providerId,
          content: 'Hi! I am interested in your tracking services.',
        }),
      });
      const data = await res.json();
      if (res.ok && data.conversation_id) {
        router.push({ pathname: '/chat-room/[id]' as any, params: { id: data.conversation_id, name } });
      } else {
        Alert.alert('Error', data.detail || 'Could not open chat. Try again.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Check your connection.');
    } finally { setChatting(false); }
  }

  function handleCall() {
    const p = provider?.phone;
    if (!p) { Alert.alert('Unavailable', 'No phone number available.'); return; }
    Linking.openURL(`tel:${p}`);
  }

  function handleWhatsApp() {
    const p = provider?.phone;
    if (!p) { Alert.alert('Unavailable', 'No phone number available.'); return; }
    Linking.openURL(`whatsapp://send?phone=${p.replace(/\D/g, '')}`);
  }

  if (loading) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center', backgroundColor: aC.bg }]}>
        <ActivityIndicator color={ORANGE} size="large" />
      </View>
    );
  }

  const name        = provider?.full_name        || 'Tracker Provider';
  const bio         = provider?.bio              || 'Professional GPS tracking solutions.';
  const city        = provider?.city             || '—';
  const location    = provider?.location         || city;
  const phone       = provider?.phone            || '—';
  const email       = provider?.email            || '—';
  const hours       = provider?.working_hours    || 'Mon - Sat\n9:00 AM - 7:00 PM';
  const estYear     = provider?.established_year;
  const avgRating   = provider?.avg_rating       ?? 0;
  const reviewCount = provider?.review_count     ?? 0;
  const followers   = provider?.follower_count   ?? 0;
  const isVerified  = provider?.is_verified      ?? false;
  const avatarUrl   = resolveUrl(provider?.avatar_url);
  const coverUrl    = resolveUrl(provider?.cover_photo_url);
  const initials    = name.slice(0, 2).toUpperCase();
  const customers   = provider?.customer_count   ?? followers;

  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { const st = Math.round(r.rating); if (breakdown[st] !== undefined) breakdown[st]++; });
  const totalBreak = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: aC.bg }]} edges={['top']}>

      {/* DEVICES MODAL — Available Trackers light white + orange shade */}
      <SheetModal visible={showDevices} transparent animationType="slide" onRequestClose={() => setShowDevices(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.12, elevation: aC.isDark ? 0 : 8 }]}>
            {aC.isDark ? <LinearGradient colors={['rgba(22,64,136,0.25)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/> : <><LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/><LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/></>}
            <View style={[s.modalHandle, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(3,42,105,0.15)' }]}/>
            <Text style={[s.modalTitle, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>Available Trackers</Text>
            <Text style={[s.modalSub, { color: aC.isDark ? C.textSecondary : '#475569' }]}>{name}</Text>
            {devices.length === 0 ? (
              <View style={s.modalEmpty}>
                <ShieldCheck size={40} color={aC.isDark ? C.textSecondary : '#94a3b8'} strokeWidth={1.2}/>
                <Text style={[s.modalEmptyTxt, { color: aC.isDark ? C.textSecondary : '#64748b' }]}>No trackers listed yet</Text>
              </View>
            ) : (
              <FlatList
                data={devices}
                keyExtractor={d => String(d.id)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
                renderItem={({ item: d }) => (
                  <View style={[s.deviceCard, { backgroundColor: aC.isDark ? 'rgba(1,6,20,1)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
                    {aC.isDark ? (
                      <>
                        <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                        <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                      </>
                    ) : (
                      <>
                        <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                        <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                      </>
                    )}
                    <View style={s.deviceInfo}>
                      <View style={[s.deviceIconWrap, { backgroundColor: aC.isDark ? 'rgba(226,103,27,0.12)' : '#eef2ff' }]}><Locate size={22} color={ORANGE}/></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.deviceName, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>{d.name}</Text>
                        {d.description ? <Text style={[s.deviceDesc, { color: aC.isDark ? C.textSecondary : '#475569' }]} numberOfLines={2}>{d.description}</Text> : null}
                        <View style={s.devicePriceRow}>
                          <Text style={s.devicePrice}>PKR {Number(d.price).toLocaleString()}</Text>
                          {d.installation_fee ? <Text style={[s.deviceFee, { color: aC.isDark ? C.textSecondary : '#64748b' }]}>Install: PKR {Number(d.installation_fee).toLocaleString()}</Text> : null}
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity style={s.bookBtn} activeOpacity={0.85}
                      onPress={() => { setShowDevices(false); router.push({ pathname: '/tracker-booking' as any, params: { providerId, providerName: name, deviceId: String(d.id), deviceName: d.name, price: String(d.price), installationFee: String(d.installation_fee || 0), monthlyFee: String(d.monthly_fee || 0) } }); }}>
                      <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject}/>
                      <Text style={s.bookBtnTxt}>Book Installation</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
            <TouchableOpacity style={[s.modalCloseBtn, { borderColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]} onPress={() => setShowDevices(false)}>
              <Text style={[s.modalCloseTxt, { color: aC.isDark ? C.textSecondary : '#475569' }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SheetModal>

      <View style={[s.container, { backgroundColor: aC.bg }]}>

        {/* ── HEADER (inside banner) ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={24} color="#fff" strokeWidth={2}/>
          </TouchableOpacity>
          <Text style={s.logo}>Auto<Text style={{ color: ORANGE }}>wizor</Text></Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: aC.bg }}
          contentContainerStyle={{ paddingBottom: 160, backgroundColor: aC.bg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
        >

          {/* ── BANNER ── */}
          <View style={s.banner}>
            {coverUrl
              ? <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover"/>
              : (
                <>
                  <LinearGradient colors={['#0b2d6e', '#0e4d8a', '#0b9da0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject}/>
                  <View style={s.bannerOverlay}/>
                  <View style={s.bannerTextWrap}>
                    <Text style={s.bannerBig}>GPS</Text>
                    <Text style={s.bannerSub}>TRACKER</Text>
                  </View>
                </>
              )
            }
          </View>

          {/* ── PROFILE SECTION ── */}
          <View style={[s.profileSection, { backgroundColor: aC.bg }]}>

            {/* Avatar overlapping banner */}
            <View style={[s.avatarOuter, { borderColor: aC.isDark ? '#fff' : '#ffffff', backgroundColor: aC.isDark ? '#09265A' : '#eef2ff' }]}>
              {avatarUrl
                ? <Image source={{ uri: avatarUrl }} style={s.avatarImg}/>
                : (
                  <View style={s.avatarFallback}>
                    <ShieldCheck size={26} color={NAVY} strokeWidth={1.5}/>
                    <Text style={s.avatarInitial}>{initials}</Text>
                  </View>
                )
              }
            </View>

            {/* Action icons top-right */}
            <View style={s.actionIcons}>
              <TouchableOpacity onPress={() => {}}>
                <Share2 size={19} color={ORANGE} strokeWidth={2}/>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLiked(l => !l)}>
                <Heart size={21} color={ORANGE} fill={liked ? ORANGE : 'transparent'} strokeWidth={2}/>
              </TouchableOpacity>
            </View>

            {/* Name + Follow */}
            <View style={s.nameFollowRow}>
              <View style={{ flex: 1 }}>
                <View style={s.nameRow}>
                  <Text style={[s.providerName, { color: aC.isDark ? C.textPrimary : '#010a1f' }]} numberOfLines={1}>{name}</Text>
                  {isVerified && (
                    <VerifiedIcon size={18} />
                  )}
                </View>
                <Text style={[s.officialLabel, { color: aC.isDark ? C.textSecondary : '#475569' }]}>Official Tracker Partner</Text>
                <View style={s.ratingRow}>
                  <Star size={14} color={ORANGE} fill={ORANGE}/>
                  <Text style={[s.ratingTxt, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</Text>
                  <Text style={[s.ratingCount, { color: aC.isDark ? C.textSecondary : '#475569' }]}>({reviewCount}+ Reviews)</Text>
                </View>
              </View>
              <TouchableOpacity style={[s.followBtn, { backgroundColor: aC.isDark ? '#132C5E' : '#ffffff', borderColor: aC.isDark ? '#7E9FD6' : 'rgba(3,42,105,0.12)' }]} onPress={toggleFollow}>
                {aC.isDark && <LinearGradient colors={['#1E3F7C', '#132C5E', '#0F2653']} locations={[0, 0.5, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                <Text style={[s.followTxt, { color: aC.isDark ? '#D9D6DF' : '#032a69' }]}>{following ? '✓ Following' : 'Follow'}</Text>
              </TouchableOpacity>
            </View>

            {/* ── STATS ── */}
            <View style={[s.statsRow, { borderTopColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.08)' }]}>
              <View style={s.statCol}>
                <Locate size={18} color={ORANGE}/>
                <Text style={[s.statTxt, { color: aC.isDark ? '#E6E4EA' : '#475569' }]}>{devices.length > 0 ? `${devices.length}+` : '—'} Plans</Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)' }]}/>
              <View style={s.statCol}>
                <Users size={18} color={ORANGE}/>
                <Text style={[s.statTxt, { color: aC.isDark ? '#E6E4EA' : '#475569' }]}>{customers > 0 ? `${customers}+` : '—'} Customers</Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)' }]}/>
              <View style={s.statCol}>
                <Award size={18} color={ORANGE}/>
                <Text style={[s.statTxt, { color: aC.isDark ? '#E6E4EA' : '#475569' }]}>{estYear ? `Since ${estYear}` : '—'}</Text>
              </View>
            </View>
          </View>

          {/* ── ABOUT ── */}
          <View style={[s.section, { backgroundColor: aC.bg }]}>
            <Text style={[s.sectionTitle, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>About Company</Text>
            <Text style={[s.aboutTxt, { color: aC.isDark ? '#ddd' : '#475569' }]}>{bio}</Text>
          </View>

          {/* ── CONTACT ── */}
          <View style={[s.contactRow, { backgroundColor: aC.bg }]}>
            <View style={s.contactCol}>
              <MapPin size={20} color={ORANGE}/>
              <Text style={[s.contactLabel, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>Location</Text>
              <Text style={[s.contactVal, { color: aC.isDark ? '#b8b8c2' : '#475569' }]}>{(location || city).split(',').slice(0, 2).join(',\n')}</Text>
            </View>
            <View style={s.contactCol}>
              <Phone size={20} color={ORANGE}/>
              <Text style={[s.contactLabel, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>Contact</Text>
              <Text style={[s.contactVal, { color: aC.isDark ? '#b8b8c2' : '#475569' }]}>{phone}{'\n'}{email}</Text>
            </View>
            <View style={s.contactCol}>
              <Clock3 size={20} color={ORANGE}/>
              <Text style={[s.contactLabel, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>Working hour</Text>
              <Text style={[s.contactVal, { color: aC.isDark ? '#b8b8c2' : '#475569' }]}>{hours}</Text>
            </View>
          </View>

          {/* ── ANCILLARY SERVICES ── */}
          <View style={[s.section, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}>
            <Text style={[s.sectionTitle, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>Ancillary Services</Text>
            <View style={s.servicesGrid}>
              {ANCILLARY.map((item, i) => (
                <View key={i} style={[s.serviceCard, { backgroundColor: aC.isDark ? '#0A1838' : '#ffffff', borderColor: aC.isDark ? '#7E9FD6' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
                  {aC.isDark ? <RingGlow radius={16} /> : <><LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/><LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/></>}
                  {item.icon}
                  <Text style={[s.serviceLabel, { color: aC.isDark ? '#E6E4EA' : '#010a1f' }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── REVIEW SUMMARY ── */}
          <View style={[s.reviewSummary, { backgroundColor: aC.isDark ? '#0a2253' : '#ffffff', borderWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
            <View style={s.barsWrap}>
              {[5, 4, 3, 2, 1].map(star => {
                const cnt  = breakdown[star] || 0;
                const barW = Math.max((cnt / totalBreak) * 150, 0);
                return (
                  <View key={star} style={s.barRow}>
                    <Text style={[s.barNum, { color: aC.isDark ? C.textPrimary : '#010a1f' }]}>{star}</Text>
                    <Star size={11} color={ORANGE} fill={ORANGE}/>
                    <View style={[s.barBg, { backgroundColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
                      <View style={[s.barFill, { width: barW }]}/>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={s.scoreWrap}>
              <Text style={[s.bigScore, { color: aC.isDark ? '#bbb2c2' : '#010a1f' }]}>{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</Text>
              <View style={s.starsRow}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={13} color={i <= Math.round(avgRating) ? ORANGE : '#64748b'} fill={i <= Math.round(avgRating) ? ORANGE : '#64748b'}/>
                ))}
              </View>
              <Text style={[s.reviewCountTxt, { color: aC.isDark ? '#bbb2c2' : '#475569' }]}>{reviewCount} Reviews</Text>
            </View>
          </View>

          {/* ── COMMENT INPUT ── */}
          <View style={s.commentWrap}>
            <TextInput
              style={[s.commentInput, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.75)' : 'rgba(3,42,105,0.12)', color: aC.isDark ? C.textPrimary : '#010a1f', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}
              placeholder="Add a comment"
              placeholderTextColor={aC.isDark ? C.textPlaceholder : '#94a3b8'}
              value={comment}
              onChangeText={setComment}
            />
          </View>

          {/* ── REVIEWS ── */}
          {reviews.length === 0
            ? <Text style={{ color: aC.isDark ? C.textSecondary : '#475569', textAlign: 'center', paddingVertical: 16, fontSize: 13, fontFamily: 'Poppins_400Regular' }}>No reviews yet</Text>
            : reviews.map((r, i) => (
                <View key={i} style={[s.review, { borderBottomColor: aC.isDark ? 'rgba(38,48,71,1)' : 'rgba(3,42,105,0.08)' }]}>
                  <View style={[s.reviewAvatar, { backgroundColor: i % 2 === 0 ? ORANGE : '#C3BCC8' }]} />
                  <View style={s.reviewContent}>
                    <View style={s.reviewNameRow}>
                      <Text style={[s.reviewName, { color: aC.isDark ? '#bbb' : '#010a1f' }]}>{r.reviewer_name || 'User'}</Text>
                      <MoreVertical size={18} color={aC.isDark ? C.textSecondary : '#94a3b8'}/>
                    </View>
                    <View style={s.reviewStarsRow}>
                      {[1,2,3,4,5].map(j => (
                        <Star key={j} size={14} color={j <= r.rating ? ORANGE : '#C3BCC8'} fill={j <= r.rating ? ORANGE : '#C3BCC8'}/>
                      ))}
                      <Text style={[s.reviewTime, { color: aC.isDark ? '#bbb' : '#64748b' }]}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}
                      </Text>
                    </View>
                    {r.comment ? <Text style={[s.reviewTxt, { color: aC.isDark ? '#bbb' : '#475569' }]} numberOfLines={3}>"{r.comment}"</Text> : null}
                  </View>
                </View>
              ))
          }

          <TouchableOpacity style={s.seeMoreBtn} onPress={() => router.push({ pathname: '/tracker-reviews', params: { tracker_id: providerId } } as any)}>
            <Text style={[s.seeMoreTxt, { color: aC.isDark ? '#ddd' : '#032a69' }]}>See More</Text>
          </TouchableOpacity>

        </ScrollView>

        {/* ── FIXED BOTTOM BAR ── */}
        <View style={[s.bottomBar, { backgroundColor: aC.isDark ? 'rgba(10,22,48,0.96)' : '#ffffff', borderTopColor: aC.isDark ? 'rgba(126,159,214,0.35)' : 'rgba(3,42,105,0.08)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 8 }]}>
          <TouchableOpacity style={s.viewTrackerBtn} activeOpacity={0.85} onPress={() => setShowDevices(true)}>
            <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject}/>
            <Text style={s.viewTrackerTxt}>View Available Tracker</Text>
          </TouchableOpacity>

          <View style={s.bottomActions}>
            <TouchableOpacity style={s.actionBtn} onPress={handleCall}>
              <Phone size={22} color={ORANGE} strokeWidth={2}/>
              <Text style={[s.actionTxt, { color: aC.isDark ? '#E6E4EA' : '#010a1f' }]}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.actionBtn} onPress={openChat} disabled={chatting}>
              <MessageSquare size={20} color={ORANGE} strokeWidth={1.8}/>
              <Text style={[s.actionTxt, { color: aC.isDark ? '#E6E4EA' : '#010a1f' }]}>{chatting ? '...' : 'Chat'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.actionBtn} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={[s.actionTxt, { color: aC.isDark ? '#E6E4EA' : '#010a1f' }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },

  header:    { height: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  logo:      { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -0.5 },
  backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  /* Banner */
  banner:         { width, height: 220, overflow: 'hidden' },
  bannerOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  bannerTextWrap: { position: 'absolute', right: 18, bottom: 24 },
  bannerBig:      { fontSize: 52, fontFamily: 'Poppins_700Bold', color: 'rgba(220,225,223,0.9)', lineHeight: 52 },
  bannerSub:      { fontSize: 18, fontFamily: 'Poppins_700Bold', color: 'rgba(220,225,223,0.7)', letterSpacing: 2 },

  /* Profile */
  profileSection: { paddingHorizontal: 20, paddingBottom: 4 },
  avatarOuter:    { marginTop: -38, width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#fff', overflow: 'hidden', backgroundColor: '#09265A' },
  avatarImg:      { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  avatarInitial:  { color: '#E7EBF4', fontSize: 13, fontFamily: 'Poppins_700Bold' },

  actionIcons:   { position: 'absolute', top: 12, right: 20, flexDirection: 'row', gap: 14 },

  nameFollowRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, gap: 10 },
  nameRow:       { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  verifiedBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#1686f7', alignItems: 'center', justifyContent: 'center' },
  providerName:  { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_500Medium', flexShrink: 1, textAlign: 'left' },
  officialLabel: { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2, textAlign: 'left' },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  ratingTxt:     { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  ratingCount:   { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular' },

  followBtn:     { height: 34, minWidth: 86, paddingHorizontal: 20, borderRadius: 17, borderWidth: 1, borderColor: '#7E9FD6', backgroundColor: '#132C5E', alignItems: 'center', justifyContent: 'center', marginTop: 10, overflow: 'hidden', shadowColor: '#4F7FD0', shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  followTxt:     { color: '#fff', fontSize: 13, fontFamily: 'Poppins_500Medium' },

  /* Stats */
  statsRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 6, paddingBottom: 6 },
  statCol:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statTxt:      { fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  statDivider:  { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.3)' },

  /* Sections */
  section:      { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold', marginBottom: 10 },
  aboutTxt:     { color: '#ddd', fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19 },

  /* Contact */
  contactRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 18, gap: 4 },
  contactCol: { flex: 1, alignItems: 'center', gap: 5 },
  contactLabel:{ color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  contactVal: { color: '#b8b8c2', fontSize: 10, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 15 },

  /* Ancillary Services */
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  serviceCard:  { width: (width - 52) / 2, height: 64, borderRadius: 16, borderWidth: 1, borderColor: '#7E9FD6', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 14, backgroundColor: '#0A1838' },
  serviceLabel: { color: '#eee', fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18, flex: 1 },

  /* Review Summary */
  reviewSummary: { marginHorizontal: 20, marginTop: 20, borderRadius: 10, backgroundColor: '#0a2253', flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 14 },
  barsWrap:      { flex: 1, justifyContent: 'space-between' },
  barRow:        { flexDirection: 'row', alignItems: 'center', height: 26 },
  barNum:        { width: 14, color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  barBg:         { height: 6, flex: 1, backgroundColor: 'transparent', borderRadius: 5, marginLeft: 8, overflow: 'hidden' },
  barFill:       { height: '100%', backgroundColor: '#b9b3c7', borderRadius: 5 },
  scoreWrap:     { width: 100, alignItems: 'center', justifyContent: 'center' },
  bigScore:      { color: '#bbb2c2', fontSize: 42, fontFamily: 'Poppins_700Bold' },
  starsRow:      { flexDirection: 'row', gap: 3, marginTop: 4 },
  reviewCountTxt:{ color: '#bbb2c2', fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginTop: 6 },

  /* Comment */
  commentWrap:  { paddingHorizontal: 20, marginTop: 16 },
  commentInput: { height: 44, borderRadius: 25, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 18, color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_400Regular', backgroundColor: 'transparent' },

  /* Reviews */
  review:        { marginHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(38,48,71,1)', flexDirection: 'row', gap: 12 },
  reviewAvatar:  { width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reviewInitial: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  reviewContent: { flex: 1 },
  reviewNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewName:    { color: '#bbb', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  reviewStarsRow:{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  reviewTime:    { color: '#bbb', fontSize: 11, fontFamily: 'Poppins_400Regular', marginLeft: 4 },
  reviewTxt:     { color: '#bbb', fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16, marginTop: 8 },

  seeMoreBtn:  { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },
  seeMoreTxt:  { color: '#ddd', fontSize: 12, fontFamily: 'Poppins_400Regular', textDecorationLine: 'underline' },

  /* Bottom Bar */
  bottomBar:      { position: 'absolute', bottom: 18, left: 0, right: 0, backgroundColor: 'rgba(16,28,53,0.97)', borderTopWidth: 1, borderTopColor: '#30415e', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 },
  viewTrackerBtn: { height: 49, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  viewTrackerTxt: { color: '#F2F1F5', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  bottomActions:  { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionTxt:      { color: '#fff', fontSize: 15, fontFamily: 'Poppins_400Regular' },
  whatsappCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },

  /* Devices Modal */
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet:     { backgroundColor: '#010A1F', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', padding: 20, maxHeight: '80%', overflow: 'hidden' },
  modalHandle:    { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:     { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  modalSub:       { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginBottom: 16 },
  modalEmpty:     { alignItems: 'center', paddingVertical: 40, gap: 10 },
  modalEmptyTxt:  { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  deviceCard:     { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', padding: 14, overflow: 'hidden' },
  deviceInfo:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  deviceIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(226,103,27,0.12)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  deviceName:     { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 3 },
  deviceDesc:     { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16, marginBottom: 6 },
  devicePriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  devicePrice:    { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  deviceFee:      { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  bookBtn:        { height: 42, borderRadius: 21, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  bookBtnTxt:     { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  modalCloseBtn:  { height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  modalCloseTxt:  { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_500Medium' },
});
