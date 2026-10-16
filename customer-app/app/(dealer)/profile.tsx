import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Award } from 'lucide-react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { D, GlowCard, Verified } from '@/components/dealer/DealerUI';
import { RatingSummary, ReviewItem } from '@/components/book/reviews';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTabBarSpace } from '@/components/shared/PillTabBar';

const { width } = Dimensions.get('window');
const ORANGE = AppColors.gradientEnd;   // #e2671b
const C      = AppColors;

export default function DealerProfileScreen() {
  const tabSpace = useTabBarSpace(120);
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [info,           setInfo]          = useState<any>(null);
  const [profileMe,      setProfileMe]     = useState<any>(null);
  const [realReviews,    setRealReviews]   = useState<any[]>([]);
  const [loading,        setLoading]       = useState(true);
  const [coverUploading, setCoverUploading] = useState(false);

  const BASE_URL = API_BASE.replace('/api/v1', '');

  function resolveUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url.replace(/http:\/\/[\d.]+:\d+/, BASE_URL);
    return `${BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
  }

  useEffect(() => {
    (async () => {
      if (!token || !user?.id) { setLoading(false); return; }
      try {
        const [dRes, rRes, pRes] = await Promise.all([
          fetch(`${API_BASE}/dealers/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/dealers/${user.id}/reviews?limit=5`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/profile/me`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (dRes.ok) setInfo(await dRes.json());
        if (rRes.ok) { const rd = await rRes.json(); setRealReviews(rd.items || rd || []); }
        if (pRes.ok) setProfileMe(await pRes.json());
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  async function handleCoverUpdate() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo access to update cover image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 7],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setCoverUploading(true);
    try {
      const form = new FormData();
      form.append('file', { uri: asset.uri, name: 'cover.jpg', type: 'image/jpeg' } as any);

      const uploadRes = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url } = await uploadRes.json();

      const fullUrl = `${API_BASE.replace('/api/v1', '')}${url}`;

      const updateRes = await fetch(`${API_BASE}/dealers/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_photo_url: fullUrl }),
      });
      if (!updateRes.ok) throw new Error('Update failed');

      setInfo((prev: any) => ({ ...prev, cover_url: fullUrl }));
    } catch {
      Alert.alert('Error', 'Failed to update cover image. Try again.');
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  }

  // Cover: dealer cover first, then the photo given at account creation (backend), else fallback
  const coverUri = resolveUrl(info?.cover_url || info?.cover_photo_url || profileMe?.cover_photo_url || user?.cover_photo_url)
    || 'https://images.unsplash.com/photo-1562519819-016930ada31b?auto=format&fit=crop&w=900&q=80';
  const name        = info?.dealership_name  || user?.full_name  || '';
  const avgRating   = Number(info?.avg_rating  ?? 0);
  const reviewCount = Number(info?.review_count ?? 0);
  const activeAds   = info?.vehicle_count    ?? 0;
  const customers   = info?.customers        ?? 0;
  const since       = info?.established_year ?? 0;
  const totalSold   = info?.total_sold       ?? 0;
  const bio         = info?.bio              ?? '';
  const location    = info?.city             ?? '';
  const phone       = user?.phone            ?? '';
  const hours       = info?.working_hours    ?? '';
  const breakdown   = info?.rating_breakdown ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const AVATAR_COLORS = [ORANGE, '#4fc3f7', '#a78bfa', '#34d399', '#f472b6'];
  const reviews = realReviews.length > 0
    ? realReviews.map((r: any, i: number) => ({
        name:    r.reviewer_name || r.user_name || r.name || 'User',
        color:   AVATAR_COLORS[i % AVATAR_COLORS.length],
        rating:  r.rating ?? 5,
        date:    r.created_at ? new Date(r.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : '',
        comment: r.comment || r.review || r.text || '',
      }))
    : [];

  if (loading) return <View style={s.center}><ActivityIndicator color={ORANGE} size="large"/></View>;

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <Image source={require('@/assets/images/autowizor-logo-text.png')} style={s.logoImg} resizeMode="contain" />

          <View style={s.headerIcons}>
            <TouchableOpacity onPress={() => router.push('/alert' as any)}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/profile/settings' as any)}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabSpace }}>

          {/* ── COVER IMAGE (tap to change) ── */}
          <TouchableOpacity activeOpacity={0.9} onPress={handleCoverUpdate} style={s.coverContainer}>
            <Image
              source={{ uri: coverUri }}
              style={s.coverImage}
              resizeMode="cover"
            />
            {coverUploading && <ActivityIndicator style={s.coverSpinner} color="#fff" size="small"/>}
          </TouchableOpacity>

          {/* ── DEALER INFO ── */}
          <View style={s.dealerSection}>
            <View style={s.dealerTop}>

              {/* Avatar */}
              <View style={s.avatarWrapper}>
                {(() => {
                  const uri = resolveUrl(profileMe?.avatar_url)
                    || resolveUrl(info?.avatar_url)
                    || resolveUrl(info?.logo_url)
                    || resolveUrl(info?.photo_url)
                    || resolveUrl(user?.avatar_url);
                  return uri ? (
                    <Image source={{ uri }} style={s.avatar} resizeMode="cover" />
                  ) : (
                    <View style={[s.avatar, s.avatarFallback]}>
                      <Text style={s.avatarLetter}>{name?.[0]?.toUpperCase() ?? 'D'}</Text>
                    </View>
                  );
                })()}
                <TouchableOpacity style={s.editAvatarBtn} onPress={() => router.push('/profile/edit' as any)}>
                  <MaterialCommunityIcons name="square-edit-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Name + rating */}
              <View style={s.dealerDetails}>
                <View style={s.dealerNameRow}>
                  <Text style={s.dealerName} numberOfLines={1}>{name}</Text>
                  <Verified size={20} />
                  <View style={{ flex: 1 }} />
                  <Ionicons name="ellipsis-vertical" size={22} color={ORANGE} />
                </View>
                <Text style={s.official}>Official Dealership</Text>
                <View style={s.ratingRow}>
                  <Ionicons name="star" size={20} color={ORANGE} />
                  <Text style={s.reviews}>{avgRating} ({reviewCount}+ Reviews)</Text>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View style={s.statsContainer}>
              <Stat icon={<Ionicons name="car-outline" size={26} color={ORANGE}/>}   value={String(activeAds)} label="ACTIVE ADS"/>
              <Stat icon={<Ionicons name="star-outline" size={24} color={ORANGE}/>} value={String(avgRating)} label="RATING"/>
              <Stat icon={<Ionicons name="people-outline" size={26} color={ORANGE}/>} value={String(customers)} label="CUSTOMERS"/>
              <Stat icon={<Ionicons name="ribbon-outline" size={24} color={ORANGE}/>} value={String(since)}     label="SINCE" last/>
            </View>

            {/* Edit Profile */}
            <GlowCard style={s.editProfileBtn} radius={26} onPress={() => router.push('/profile/edit' as any)}>
              <Text style={s.editProfileText}>Edit Profile</Text>
            </GlowCard>
          </View>

          {/* ── ABOUT ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.aboutText}>{bio}</Text>
          </View>

          {/* ── CONTACT ROW ── */}
          <View style={s.contactRow}>
            <ContactItem icon={<Ionicons name="location-outline" size={20} color={ORANGE}/>} title="Location"     lines={location.split(',')} />
            <ContactItem icon={<Ionicons name="call-outline" size={20} color={ORANGE}/>}     title="Contact"      lines={[phone, user?.email || 'honda@gmail.com']} />
            <ContactItem icon={<Ionicons name="time-outline" size={20} color={ORANGE}/>}     title="Working hour" lines={[...hours.split('\n').filter(Boolean), 'Monday to Friday']} />
          </View>

          {/* ── ACHIEVEMENTS ── */}
          {(info?.achievements?.length > 0 || avgRating > 0 || !!since) && (
            <>
              <Text style={s.achievementTitle}>Achievements</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.achievementRow}>
                {avgRating > 0 && (
                  <View style={s.achievementBox}>
                    <View style={s.achIcon}><Award size={16} color="#fff"/></View>
                    <Text style={s.achievementText}>{avgRating} Star Rating</Text>
                  </View>
                )}
                {since > 0 && (
                  <View style={s.achievementBox}>
                    <View style={s.achIcon}><Award size={16} color="#fff"/></View>
                    <Text style={s.achievementText}>Since {since}</Text>
                  </View>
                )}
                {totalSold > 0 && (
                  <View style={s.achievementBox}>
                    <View style={s.achIcon}><Award size={16} color="#fff"/></View>
                    <Text style={s.achievementText}>{totalSold}+ Cars Sold</Text>
                  </View>
                )}
                {(info?.achievements || []).map((a: any, i: number) => (
                  <View key={i} style={s.achievementBox}>
                    <View style={s.achIcon}><Award size={16} color="#fff"/></View>
                    <Text style={s.achievementText}>{a.label || a.title || a}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {/* ── REVIEW SUMMARY + REVIEWS (same as Book-a-vehicle dealer profile) ── */}
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <RatingSummary avg={avgRating} count={reviewCount} reviews={realReviews} breakdown={breakdown} />
            {realReviews.length === 0 ? (
              <Text style={{ color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingVertical: 16 }}>
                No reviews yet
              </Text>
            ) : (
              realReviews.slice(0, 2).map((r: any, i: number) => (
                <ReviewItem key={r.id || i} r={{ ...r, reviewer_name: reviews[i]?.name, comment: reviews[i]?.comment, rating: reviews[i]?.rating }} index={i} />
              ))
            )}
          </View>

          <TouchableOpacity style={s.seeMoreBtn} onPress={() => router.push({ pathname: '/dealer-panel/reviews', params: { dealer_id: user?.id } } as any)}>
            <Text style={s.seeMoreText}>See More</Text>
          </TouchableOpacity>

          {/* ── PREMIUM PLAN CARD — removed (plan route deleted) */}


        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ─── COMPONENTS ─── */

function Stat({ icon, value, label, last }: { icon: React.ReactNode; value: string; label: string; last?: boolean }) {
  return (
    <View style={[s.stat, last && { borderRightWidth: 0 }]}>
      {icon}
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ContactItem({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
  return (
    <View style={s.contactItem}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={s.contactTitle}>{title}</Text>
        {lines.map((line, i) => (
          <Text key={i} style={s.contactText}>{line.trim()}</Text>
        ))}
      </View>
    </View>
  );
}

/* ─── STYLES ─── */

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: D.bg },
  container: { flex: 1, backgroundColor: D.bg },
  center:    { flex: 1, backgroundColor: D.bg, alignItems: 'center', justifyContent: 'center' },

  /* HEADER */
  header:      { height: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoImg:     { width: 128, height: 24, marginLeft: 36 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn:     { width: 36, height: 36, justifyContent: 'center' },

  /* COVER */
  coverContainer: { width, height: 230, overflow: 'hidden' },
  coverImage:     { width: '100%', height: '100%' },
  coverSpinner:   { position: 'absolute', bottom: 12, right: 12 },

  /* DEALER */
  dealerSection: { paddingHorizontal: 16 },
  dealerTop:     { flexDirection: 'row', alignItems: 'flex-start', marginTop: -30 },

  avatarWrapper:  { width: 96, height: 96, position: 'relative' },
  avatar:         { width: 96, height: 96, borderRadius: 48, backgroundColor: '#1a2f52', borderWidth: 2, borderColor: '#fff' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#C8102E' },
  avatarLetter:   { color: '#fff', fontSize: 34, fontFamily: 'Poppins_700Bold' },
  editAvatarBtn:  { position: 'absolute', right: -2, bottom: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },

  dealerDetails: { flex: 1, marginLeft: 12, paddingTop: 38 },
  dealerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dealerName:    { color: '#FFFFFF', fontSize: 19, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
  official:      { color: D.muted, fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  reviews:       { color: D.muted, fontSize: 14, fontFamily: 'Poppins_400Regular' },

  statsContainer: { flexDirection: 'row', marginTop: 26 },
  stat:      { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.14)' },
  statValue: { color: '#FFFFFF', fontSize: 17, fontFamily: 'Poppins_500Medium', marginTop: 8 },
  statLabel: { color: D.muted, fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1, letterSpacing: 0.8 },

  editProfileBtn:  { height: 52, marginTop: 24, alignItems: 'center', justifyContent: 'center' },
  editProfileText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_500Medium' },

  /* ABOUT */
  section:      { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_500Medium', marginBottom: 4 },
  aboutText:    { color: D.muted, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 21 },

  /* CONTACT */
  contactRow:   { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 8 },
  contactItem:  { flex: 1, flexDirection: 'row', gap: 6 },
  contactTitle: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  contactText:  { color: D.muted, fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16 },

  /* ACHIEVEMENTS */
  achievementTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_500Medium', marginHorizontal: 20, marginTop: 22, marginBottom: 10 },
  achievementRow:   { paddingHorizontal: 20, gap: 10, flexDirection: 'row' },
  achievementBox:   { height: 44, borderRadius: 10, backgroundColor: D.navy, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
  achIcon:          { width: 26, height: 26, borderRadius: 6, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  achievementText:  { color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins_400Regular' },

  seeMoreBtn:  { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 10 },
  seeMoreText: { color: '#E6E1E8', fontSize: 14, fontFamily: 'Poppins_400Regular', textDecorationLine: 'underline' },

  /* PREMIUM PLAN */
  premiumCard:      { marginHorizontal: 16, marginTop: 24, padding: 20 },
  planHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  currentPlanBadge: { alignSelf: 'flex-start', backgroundColor: ORANGE, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
  currentPlanText:  { color: '#3A1A0A', fontSize: 10, fontFamily: 'Poppins_700Bold' },
  badgeGlowWrap:    { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginTop: -45, marginRight: -45, marginBottom: -40 },
  premiumTitle:     { color: ORANGE, fontSize: 17, fontFamily: 'Poppins_500Medium', marginTop: 6 },
  planFeature:      { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  planFeatureText:  { color: '#E6E1E8', fontSize: 15, fontFamily: 'Poppins_400Regular', marginLeft: 12 },
  manageButton:     { height: 50, borderRadius: 25, marginTop: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  manageText:       { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
