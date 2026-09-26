import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, Eye, Bell, Settings, BadgeCheck, MoreVertical,
  Car, Star, Users, Award, MapPin, Phone, Clock3,
  CheckCircle, ShieldCheck, Pencil,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');
const ORANGE = AppColors.gradientEnd;   // #e2671b
const NAVY   = AppColors.gradientStart; // #032a69
const C      = AppColors;

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.18)','transparent']} start={{x:0,y:0.5}} end={{x:0.45,y:0.5}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent','rgba(29,83,175,0.2)']} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

export default function DealerProfileScreen() {
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
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
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
            <ChevronLeft size={24} color={ORANGE} strokeWidth={2}/>
          </TouchableOpacity>

          <Text style={s.logo}>
            Auto<Text style={{ color: ORANGE }}>w</Text>
            <Text style={{ color: ORANGE }}>i</Text>
            <Text style={{ color: ORANGE }}>z</Text>
            <Text style={{ color: ORANGE }}>o</Text>
            <Text style={{ color: ORANGE }}>r</Text>
          </Text>

          <View style={s.headerIcons}>
            <Eye size={21} color={ORANGE} strokeWidth={1.8}/>
            <TouchableOpacity onPress={() => router.push('/alert' as any)}>
              <Bell size={20} color={C.textPrimary} strokeWidth={1.5}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/profile/settings' as any)}>
              <Settings size={21} color={C.textPrimary} strokeWidth={1.5}/>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

          {/* ── COVER IMAGE ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleCoverUpdate} style={s.coverContainer}>
            <Image
              source={{ uri: info?.cover_url || 'https://images.unsplash.com/photo-1562519819-016930ada31b?auto=format&fit=crop&w=900&q=80' }}
              style={s.coverImage}
              resizeMode="cover"
            />
            {/* Dark overlay */}
            <View style={s.coverOverlay}/>
            {/* Edit icon */}
            {coverUploading ? (
              <ActivityIndicator style={s.coverEditBtn} color="#fff" size="small"/>
            ) : (
              <View style={s.coverEditBtn}>
                <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject}/>
                <Pencil size={15} color="#fff" strokeWidth={2}/>
              </View>
            )}
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
                  <Pencil size={13} color="#fff" strokeWidth={2}/>
                </TouchableOpacity>
              </View>

              {/* Name + rating */}
              <View style={s.dealerDetails}>
                <View style={s.dealerNameRow}>
                  <Text style={s.dealerName} numberOfLines={1}>{name}</Text>
                  <BadgeCheck size={17} color="#078DE8" fill="#078DE8"/>
                </View>
                <Text style={s.official}>Official Dealership</Text>
                <View style={s.ratingRow}>
                  <Star size={15} color={ORANGE} fill={ORANGE}/>
                  <Text style={s.ratingText}>{avgRating}</Text>
                  <Text style={s.reviews}>({reviewCount}+ Reviews)</Text>
                </View>
              </View>

              <MoreVertical size={23} color={ORANGE} strokeWidth={2}/>
            </View>

            {/* Stats */}
            <View style={s.statsContainer}>
              <Stat icon={<Car size={20} color={ORANGE}/>}   value={String(activeAds)} label="ACTIVE ADS"/>
              <Stat icon={<Star size={20} color={ORANGE} fill={ORANGE}/>} value={String(avgRating)} label="RATING"/>
              <Stat icon={<Users size={20} color={ORANGE}/>} value={String(customers)} label="CUSTOMERS"/>
              <Stat icon={<Award size={20} color={ORANGE}/>} value={String(since)}     label="SINCE"/>
            </View>

            {/* Edit Profile */}
            <TouchableOpacity style={s.editProfileBtn} onPress={() => router.push('/profile/edit' as any)}>
              <GlassInset/>
              <Text style={s.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* ── ABOUT ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.aboutText}>{bio}</Text>
          </View>

          {/* ── CONTACT ROW ── */}
          <View style={s.contactRow}>
            <ContactItem icon={<MapPin size={17} color={ORANGE}/>}  title="Location"     lines={location.split(',')} />
            <ContactItem icon={<Phone size={17} color={ORANGE}/>}   title="Contact"      lines={[phone, user?.email || 'honda@gmail.com']} />
            <ContactItem icon={<Clock3 size={17} color={ORANGE}/>}  title="Working Hour" lines={hours.split('\n')} />
          </View>

          {/* ── ACHIEVEMENTS ── */}
          {(info?.achievements?.length > 0 || avgRating > 0 || since) && (
            <>
              <Text style={s.achievementTitle}>Achievements</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.achievementRow}>
                {avgRating > 0 && (
                  <View style={s.achievementBox}>
                    <Award size={18} color={ORANGE}/>
                    <Text style={s.achievementText}>{avgRating} Star Rating</Text>
                  </View>
                )}
                {since > 0 && (
                  <View style={s.achievementBox}>
                    <Award size={18} color={ORANGE}/>
                    <Text style={s.achievementText}>Since {since}</Text>
                  </View>
                )}
                {totalSold > 0 && (
                  <View style={s.achievementBox}>
                    <Award size={18} color={ORANGE}/>
                    <Text style={s.achievementText}>{totalSold}+ Cars Sold</Text>
                  </View>
                )}
                {(info?.achievements || []).map((a: any, i: number) => (
                  <View key={i} style={s.achievementBox}>
                    <Award size={18} color={ORANGE}/>
                    <Text style={s.achievementText}>{a.label || a.title || a}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {/* ── REVIEW SUMMARY ── */}
          <View style={s.reviewSummary}>
            <View style={s.barsContainer}>
              {[5, 4, 3, 2, 1].map(star => {
                const cnt = breakdown[star] || 0;
                const total = Object.values(breakdown as Record<number,number>).reduce((a: number, b: number) => a + b, 0);
                const barW = total > 0 ? (cnt / total) * 150 : 0;
                return <RatingBar key={star} number={String(star)} width={barW}/>;
              })}
            </View>
            <View style={s.reviewScore}>
              <Text style={s.bigScore}>{avgRating.toFixed(1)}</Text>
              <View style={s.starsRow}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={13} color={ORANGE} fill={i <= Math.round(avgRating) ? ORANGE : 'transparent'}/>
                ))}
              </View>
              <Text style={s.reviewCount}>{reviewCount} Reviews</Text>
            </View>
          </View>

          {/* ── REVIEWS ── */}
          {reviews.length === 0 ? (
            <Text style={{ color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingVertical: 16 }}>
              No reviews yet
            </Text>
          ) : (
            reviews.map((r: any, i: number) => (
              <Review key={i} name={r.name} color={r.color} text={r.comment} date={r.date} rating={r.rating}/>
            ))
          )}

          <TouchableOpacity style={s.seeMoreBtn} onPress={() => router.push({ pathname: '/dealer-panel/reviews', params: { dealer_id: user?.id } } as any)}>
            <Text style={s.seeMoreText}>See More</Text>
          </TouchableOpacity>

          {/* ── PREMIUM PLAN CARD ── */}
          <View style={s.premiumCard}>
            <LinearGradient colors={['rgba(22,64,136,0.15)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <LinearGradient colors={['rgba(13,37,84,0.12)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.15)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <View style={s.planHeader}>
              <View>
                <View style={s.currentPlanBadge}>
                  <Text style={s.currentPlanText}>CURRENT PLAN</Text>
                </View>
                <Text style={s.premiumTitle}>Premium Dealer</Text>
              </View>
              <View style={s.badgeCircle}>
                <ShieldCheck size={28} color={ORANGE} strokeWidth={2}/>
              </View>
            </View>

            {['Verified Dealer Status','Priority Search Ranking','Unlimited Listing Slots','Exclusive Ad Campaigns'].map(f => (
              <PlanFeature key={f} text={f}/>
            ))}

            <TouchableOpacity style={s.manageButton} activeOpacity={0.85} onPress={() => router.push('/(dealer)/plan' as any)}>
              <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject}/>
              <Text style={s.manageText}>Manage Plan</Text>
            </TouchableOpacity>
          </View>


        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ─── COMPONENTS ─── */

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={s.stat}>
      {icon}
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ContactItem({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
  return (
    <View style={s.contactItem}>
      <View style={s.contactTitleRow}>
        {icon}
        <Text style={s.contactTitle}>{title}</Text>
      </View>
      {lines.map((line, i) => (
        <Text key={i} style={s.contactText}>{line.trim()}</Text>
      ))}
    </View>
  );
}

function RatingBar({ number, width: barWidth }: { number: string; width: number }) {
  return (
    <View style={s.ratingBarRow}>
      <Text style={s.ratingNumber}>{number}</Text>
      <Star size={11} color={ORANGE} fill={ORANGE}/>
      <View style={s.barBackground}>
        <View style={[s.barFill, { width: barWidth }]}/>
      </View>
    </View>
  );
}

function Review({ name, color, text, date, rating }: { name: string; color: string; text: string; date: string; rating: number }) {
  return (
    <View style={s.review}>
      <View style={[s.reviewAvatar, { backgroundColor: color }]}>
        <Text style={s.reviewInitial}>{name[0].toUpperCase()}</Text>
      </View>
      <View style={s.reviewContent}>
        <View style={s.reviewNameRow}>
          <Text style={s.reviewName}>{name}</Text>
          <MoreVertical size={18} color={C.textSecondary}/>
        </View>
        <View style={s.reviewStars}>
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={12} color={ORANGE} fill={i <= rating ? ORANGE : 'transparent'}/>
          ))}
          <Text style={s.reviewTime}>{date}</Text>
        </View>
        <Text style={s.reviewText} numberOfLines={2}>"{text}"</Text>
      </View>
    </View>
  );
}

function PlanFeature({ text }: { text: string }) {
  return (
    <View style={s.planFeature}>
      <CheckCircle size={19} color="#20D87A" strokeWidth={2}/>
      <Text style={s.planFeatureText}>{text}</Text>
    </View>
  );
}

/* ─── STYLES ─── */

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  center:    { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  /* HEADER */
  header: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: C.textPrimary, letterSpacing: -0.5 },
  headerIcons:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  /* COVER */
  coverContainer: { width, height: 220, overflow: 'hidden' },
  coverImage:     { width: '100%', height: '100%' },
  coverOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  coverEditBtn:   {
    position: 'absolute', bottom: 12, right: 12,
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },

  /* DEALER */
  dealerSection: { paddingHorizontal: 20 },
  dealerTop: { flexDirection: 'row', alignItems: 'center', marginTop: -35 },

  avatarWrapper:  { width: 82, height: 82, position: 'relative' },
  avatar: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: '#1a2f52', borderWidth: 3, borderColor: '#fff',
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#032a69' },
  avatarLetter:   { color: '#fff', fontSize: 30, fontFamily: 'Poppins_700Bold' },
  editAvatarBtn: {
    position: 'absolute', right: -1, bottom: 1,
    width: 23, height: 23, borderRadius: 12,
    backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.bg,
  },

  dealerDetails: { flex: 1, marginLeft: 14, paddingTop: 36 },
  dealerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  dealerName:    { color: C.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold', flexShrink: 1 },
  official:      { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText:    { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginLeft: 5 },
  reviews:       { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', marginLeft: 4 },

  statsContainer: {
    flexDirection: 'row', marginTop: 32,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 12,
  },
  stat:      { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.08)' },
  statValue: { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginTop: 5 },
  statLabel: { color: C.textSecondary, fontSize: 8, fontFamily: 'Poppins_400Regular', marginTop: 3, letterSpacing: 0.3 },

  editProfileBtn: {
    height: 44, borderRadius: 22, marginTop: 20,
    borderWidth: 1, borderColor: 'rgba(99,148,214,0.7)',
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  editProfileText: { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_500Medium' },

  /* ABOUT */
  section:      { paddingHorizontal: 20, marginTop: 22 },
  sectionTitle: { color: C.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginBottom: 6 },
  aboutText:    { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  /* CONTACT */
  contactRow:      { flexDirection: 'row', paddingHorizontal: 20, marginTop: 18, gap: 8 },
  contactItem:     { flex: 1 },
  contactTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  contactTitle:    { color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  contactText:     { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 14, paddingLeft: 22 },

  /* ACHIEVEMENTS */
  achievementTitle: { color: C.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginHorizontal: 20, marginTop: 22, marginBottom: 8 },
  achievementRow:   { paddingHorizontal: 20, gap: 8, flexDirection: 'row' },
  achievementBox:   { height: 38, borderRadius: 8, backgroundColor: 'rgba(6,27,74,1)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: 'rgba(99,148,214,0.4)' },
  achievementText:  { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular' },

  /* REVIEW SUMMARY */
  reviewSummary: {
    marginHorizontal: 20, marginTop: 16,
    borderRadius: 12, backgroundColor: 'rgba(6,27,74,1)',
    borderWidth: 1, borderColor: 'rgba(99,148,214,0.4)',
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 14,
  },
  barsContainer: { flex: 1, justifyContent: 'space-between' },
  ratingBarRow:  { flexDirection: 'row', alignItems: 'center', height: 22 },
  ratingNumber:  { width: 14, color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  barBackground: { height: 5, width: 150, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 5, marginLeft: 5, overflow: 'hidden' },
  barFill:       { height: '100%', backgroundColor: ORANGE, borderRadius: 5 },
  reviewScore:   { width: 100, alignItems: 'center', justifyContent: 'center' },
  bigScore:      { color: C.textPrimary, fontSize: 38, fontFamily: 'Poppins_700Bold' },
  starsRow:      { flexDirection: 'row', gap: 3, marginTop: 3 },
  reviewCount:   { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_600SemiBold', marginTop: 6 },

  /* REVIEWS */
  review:        { marginHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', flexDirection: 'row' },
  reviewAvatar:  { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  reviewInitial: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  reviewContent: { flex: 1, marginLeft: 10 },
  reviewNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewName:    { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  reviewStars:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  reviewTime:    { color: C.textSecondary, fontSize: 9, fontFamily: 'Poppins_400Regular', marginLeft: 4 },
  reviewText:    { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 6, lineHeight: 15 },

  seeMoreBtn:  { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
  seeMoreText: { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_400Regular', textDecorationLine: 'underline' },

  /* PREMIUM PLAN */
  premiumCard: {
    marginHorizontal: 16, marginTop: 16,
    padding: 22, borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(99,148,214,0.5)',
    backgroundColor: C.bg, overflow: 'hidden',
  },
  planHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  currentPlanBadge: { alignSelf: 'flex-start', backgroundColor: ORANGE, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  currentPlanText:  { color: '#081022', fontSize: 8, fontFamily: 'Poppins_700Bold' },
  premiumTitle:     { color: ORANGE, fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginTop: 6 },
  badgeCircle:      { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  planFeature:      { flexDirection: 'row', alignItems: 'center', marginVertical: 7 },
  planFeatureText:  { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_400Regular', marginLeft: 12 },
  manageButton:     { height: 48, borderRadius: 24, marginTop: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  manageText:       { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
});
