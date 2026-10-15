// Figma: Dealer profile (Book flow)
import { useAppColors, withLightStyles, LIGHT_POP_SHADOW } from '@/constants/theme';
import VerifiedIcon from '@/components/shared/VerifiedIcon';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { G, Glass, GlassButton, GradientButton, GlowThemed } from '@/components/shared/GlowUI';
import { CtaPanelGlass } from '@/components/shared/FigmaEffects';
import { authHeaders, imgUrl } from '@/components/book/common';
import { RatingSummary, ReviewItem } from '@/components/book/reviews';

const BANNER_H = 232;
const AVATAR = 84;

function fmtCount(n: number) {
  return n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(n);
}

function BookDealerProfileInner() {
  const aC = useAppColors();
  const s = aC.isDark ? s_dark : s_light;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, category } = useLocalSearchParams<{ id: string; category?: string }>();
  const { token, user } = useAuth() as any;
  const isBike = category === 'bike';

  const [dealer, setDealer] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busyFollow, setBusyFollow] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [ctaH, setCtaH] = useState(150);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const h = authHeaders(token);
        const [dr, rr] = await Promise.all([
          fetch(`${API_BASE}/dealers/${id}`, { headers: h }),
          fetch(`${API_BASE}/dealers/${id}/reviews?limit=50`, { headers: h }),
        ]);
        if (dr.ok) { const d = await dr.json(); setDealer(d); setFollowing(!!d.is_following); }
        else {
          // Dealer endpoint needs login and only knows dealer/seller accounts — fall back to the
          // seller info on their listings so Contact Dealer always opens this profile.
          const vr = await fetch(`${API_BASE}/vehicles?seller_id=${id}&limit=50`, { headers: h });
          if (vr.ok) {
            const vd = await vr.json();
            const seller = (vd.items || []).find((v: any) => v.seller)?.seller;
            if (seller) {
              setDealer({
                id, full_name: seller.full_name, phone: seller.phone, email: seller.email,
                avatar_url: seller.avatar_url, role: seller.role,
                vehicle_count: vd.total ?? (vd.items || []).length, follower_count: 0,
                avg_rating: 0, review_count: 0,
                member_since: seller.created_at,
              });
            }
          }
        }
        if (rr.ok) setReviews((await rr.json()) || []);
      } catch { }
      finally { setLoading(false); }
    })();
  }, [id]);

  async function toggleFollow() {
    if (!token) { Alert.alert('Login Required', 'Please login to follow.'); return; }
    setBusyFollow(true);
    try {
      const res = await fetch(`${API_BASE}/dealers/${id}/follow`, { method: 'POST', headers: authHeaders(token) });
      if (res.ok) { const d = await res.json(); setFollowing(d.following); }
    } catch { }
    finally { setBusyFollow(false); }
  }

  async function chat() {
    if (!token) { Alert.alert('Login Required', 'Please login to chat with the dealer.'); return; }
    if (user?.id === id) { Alert.alert('Info', 'This is your own profile.'); return; }
    setChatting(true);
    try {
      const res = await fetch(`${API_BASE}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ to_user_id: id, content: `Hi! I am interested in your ${isBike ? 'bikes' : 'cars'}.` }),
      });
      const d = await res.json();
      if (res.ok && d.conversation_id) {
        router.push({ pathname: '/chat-room/[id]', params: { id: d.conversation_id, name: dealer?.dealership_name || dealer?.full_name || 'Dealer' } } as any);
      } else Alert.alert('Error', d.detail || 'Could not open chat.');
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setChatting(false); }
  }

  function call() {
    if (!dealer?.phone) { Alert.alert('Not Available', 'No phone number listed.'); return; }
    Linking.openURL(`tel:${dealer.phone}`);
  }

  function whatsapp() {
    const raw = String(dealer?.whatsapp || dealer?.phone || '').replace(/\D/g, '');
    if (!raw) { Alert.alert('Not Available', 'No WhatsApp number listed.'); return; }
    Linking.openURL(`https://wa.me/${raw.startsWith('0') ? `92${raw.slice(1)}` : raw}`);
  }

  if (loading) return <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={G.orange} size="large" /></View>;
  if (!dealer) {
    return (
      <SafeAreaView style={[s.root, { alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={aC.isDark ? G.muted : '#4b5563'} />
        <Text style={s.name}>Dealer not found</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: G.orange, fontFamily: 'Poppins_500Medium' }}>Go Back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const name = dealer.dealership_name || dealer.full_name || 'Dealer';
  const cover = imgUrl(dealer.cover_photo_url);
  const avatar = imgUrl(dealer.avatar_url);
  const isDealer = dealer.role === 'dealership_owner';
  const avg = dealer.avg_rating || (reviews.length ? reviews.reduce((t, r) => t + (r.rating || 0), 0) / reviews.length : 0);
  const count = dealer.review_count || reviews.length;
  const hours = dealer.working_hours ? String(dealer.working_hours).split('\n') : ['—'];

  const stats = [
    { icon: 'car-outline' as const, t: `${dealer.vehicle_count || 0}+Vehicles` },
    { icon: 'people-outline' as const, t: `${fmtCount(dealer.follower_count || 0)}+Customers` },
    { icon: 'calendar-outline' as const, t: dealer.established_year ? `Since ${dealer.established_year}` : `Since ${new Date(dealer.member_since || Date.now()).getFullYear()}` },
  ];
  const contact = [dealer.phone, dealer.email].filter(Boolean);
  const info = [
    { icon: 'location-outline' as const, t: 'Location', lines: dealer.location ? [dealer.location] : dealer.city ? [`${dealer.city},`, 'Pakistan'] : ['Pakistan'] },
    { icon: 'call-outline' as const, t: 'Contact', lines: contact.length ? contact : ['—'] },
    { icon: 'time-outline' as const, t: 'Working hour', lines: hours },
  ];

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: ctaH + 16 }}>
        {/* Banner */}
        <View style={{ height: BANNER_H }}>
          {cover
            ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            : <LinearGradient colors={['#1A3268', '#0B1D4A']} style={StyleSheet.absoluteFillObject} />}
          <View style={[s.bannerTop, { top: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => router.back()} style={s.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={28} color={aC.isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
            <Image source={require('@/assets/images/autowizor-logo-text.png')} style={s.bannerLogo} resizeMode="contain" />
          </View>
        </View>

        {/* Identity */}
        <View style={s.identity}>
          <View style={s.avatar}>
            {avatar ? <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} /> : null}
          </View>
          <View style={{ flex: 1, paddingTop: 6 }}>
            <View style={s.nameRow}>
              <Text style={s.name} numberOfLines={1}>{name}</Text>
              {isDealer && <VerifiedIcon size={21} />}
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => Share.share({ message: `${name} on Autowizor` })}>
                <Ionicons name="share-social-outline" size={21} color={G.orange} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSaved(x => !x)} style={{ marginLeft: 12 }}>
                <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={G.orange} />
              </TouchableOpacity>
            </View>
            <Text style={s.sub}>{isDealer ? 'Official Dealership' : 'Individual Seller'}</Text>
            <View style={s.rateRow}>
              <Ionicons name="star" size={18} color={G.orange} />
              <Text style={s.rateTxt} numberOfLines={1}>{avg ? avg.toFixed(1) : '0.0'} ({count > 250 ? '250+' : count} Reviews)</Text>
              <View style={{ flex: 1 }} />
              <GlassButton title={following ? 'Following' : 'Follow'} height={36} fontSize={14} color={aC.isDark ? G.white : '#000000'} loading={busyFollow} style={{ width: 92 }} onPress={toggleFollow} />
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.stats}>
          {stats.map((x, i) => (
            <React.Fragment key={x.t}>
              {i > 0 && <View style={s.statSep} />}
              <View style={s.stat}>
                <Ionicons name={x.icon} size={16} color={G.orange} />
                <Text style={s.statTxt} numberOfLines={1}>{x.t}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* About */}
        <View style={s.pad}>
          <Text style={s.h2}>About Dealership</Text>
          <Text style={s.about}>
            {dealer.bio || `${name} is an ${isDealer ? 'authorized dealership' : 'individual seller'} on Autowizor offering quality vehicles with professional customer support.`}
          </Text>
          <View style={s.infoRow}>
            {info.map(x => (
              <View key={x.t} style={s.info}>
                <Ionicons name={x.icon} size={22} color={G.orange} />
                <Text style={s.infoTitle}>{x.t}</Text>
                {/* Email: '@' ke baad break allow (zero-width space) taake font chhota kiye baghair 2 lines mein aaye */}
                {x.lines.map((l, i) => <Text key={i} style={s.infoLine} numberOfLines={2}>{String(l).replace('@', '@\u200B')}</Text>)}
              </View>
            ))}
          </View>

          {/* Ratings + reviews */}
          <View style={{ marginTop: 22 }}>
            <RatingSummary avg={avg} count={count} reviews={reviews} />
          </View>
          {reviews.length === 0
            ? <Text style={[s.infoLine, { textAlign: 'center', marginTop: 18 }]}>No reviews yet</Text>
            : reviews.slice(0, 2).map((r, i) => <ReviewItem key={r.id} r={r} index={i} />)}
          <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 12 }} onPress={() => router.push({ pathname: '/book/reviews', params: { id: String(id) } } as any)}>
            <Text style={s.seeMore}>See More</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed bottom: View Available Cars + Call / Chat / WhatsApp */}
      <View style={[s.cta, { paddingBottom: Math.max(insets.bottom, 10) + 4 }]} onLayout={e => setCtaH(Math.ceil(e.nativeEvent.layout.height))}>
        {/* Same background effect as Buy Used Car → dealer profile footer (app/buy/dealer-profile.tsx) */}
        {aC.isDark && <CtaPanelGlass />}
        <GradientButton
          title={`View Available ${isBike ? 'Bikes' : 'Cars'}`}
          height={48}
          onPress={() => router.push({ pathname: '/book/search-results', params: { sellerId: String(id), category: category || 'car', city: dealer.city || '' } } as any)}
        />
        <View style={s.actions}>
          <TouchableOpacity style={s.action} onPress={call}>
            <Ionicons name="call-outline" size={24} color={G.orange} />
            <Text style={s.actionTxt}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.action} onPress={chat} disabled={chatting}>
            {chatting ? <ActivityIndicator color={G.orange} size="small" /> : <Ionicons name="chatbox-ellipses-outline" size={22} color={G.orange} />}
            <Text style={s.actionTxt}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.action} onPress={whatsapp}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={s.actionTxt}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s_dark = StyleSheet.create({
  root:       { flex: 1, backgroundColor: G.bg },
  bannerTop:  { position: 'absolute', left: 0, right: 0, height: 36, alignItems: 'center', justifyContent: 'center' },
  back:       { position: 'absolute', left: 16 },
  bannerLogo: { width: 118, height: 24 },

  identity: { flexDirection: 'row', paddingLeft: 12, paddingRight: 16, gap: 12 },
  avatar:   { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#0B1D4A', marginTop: -AVATAR * 0.5, overflow: 'hidden' },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:     { color: G.white, fontSize: 19, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
  sub:      { color: G.muted, fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 20, marginTop: -2 },
  rateRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 0 },
  rateTxt:  { color: G.muted, fontSize: 13, fontFamily: 'Poppins_400Regular', flexShrink: 1 },

  stats:   { flexDirection: 'row', alignItems: 'center', marginTop: 18, paddingHorizontal: 8 },
  stat:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4 },
  statSep: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.3)' },
  statTxt: { color: '#D9D2DA', fontSize: 12, fontFamily: 'Poppins_400Regular', flexShrink: 1 },

  pad:       { paddingHorizontal: 20 },
  h2:        { color: G.white, fontSize: 18, fontFamily: 'Poppins_500Medium', marginTop: 26 },
  about:     { color: '#D9D2DA', fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20, marginTop: 4 },
  infoRow:   { flexDirection: 'row', marginTop: 18, gap: 6 },
  info:      { flex: 1, alignItems: 'center' },
  infoTitle: { color: G.white, fontSize: 13, fontFamily: 'Poppins_500Medium', marginTop: 10 },
  infoLine:  { color: G.muted, fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 16 },
  seeMore:   { color: '#E6E1E8', fontSize: 14, fontFamily: 'Poppins_400Regular', textDecorationLine: 'underline' },

  cta:       { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 16, overflow: 'hidden', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actions:   { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 },
  action:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionTxt: { color: '#E6E1E8', fontSize: 17, fontFamily: 'Poppins_400Regular' },
});
// Light mode layer for `s` — dark mode uses s_dark as is
const s_light = withLightStyles(s_dark, {
  root: { backgroundColor: '#ffffff' },
  name: { color: '#000000' },
  sub: { color: '#4b5563' },
  rateTxt: { color: '#4b5563' },
  statTxt: { color: '#000000' },
  h2: { color: '#000000' },
  about: { color: '#000000' },
  infoTitle: { color: '#000000' },
  infoLine: { color: '#4b5563' },
  seeMore: { color: '#000000' },
  cta: { borderColor: 'rgba(0,0,0,0.12)' },
  actionTxt: { color: '#000000' },
});


// Follows the app theme (light mode) — see GlowThemed in components/shared/GlowUI
export default function BookDealerProfile() {
  const aC = useAppColors();
  const s = aC.isDark ? s_dark : s_light;
  return <GlowThemed><BookDealerProfileInner /></GlowThemed>;
}
