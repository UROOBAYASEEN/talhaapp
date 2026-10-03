import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Dimensions, Modal,
  TextInput, Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, Eye, Bell, Settings, BadgeCheck, MoreVertical,
  Car, Star, Users, Award, MapPin, Phone, Clock3,
  Pencil, Plus,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { D, GlowCard } from '@/components/dealer/DealerUI';

const { width } = Dimensions.get('window');
const ORANGE = '#E2671B';
const NAVY   = AppColors.gradientStart;
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

export default function SellerProfileScreen() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [info,           setInfo]           = useState<any>(null);
  const [allReviews,     setAllReviews]     = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [coverUploading, setCoverUploading] = useState(false);
  const [reviewModal,    setReviewModal]    = useState(false);
  const [seeMoreModal,   setSeeMoreModal]   = useState(false);
  const [newRating,      setNewRating]      = useState(5);
  const [newComment,     setNewComment]     = useState('');
  const [submitting,     setSubmitting]     = useState(false);

  useEffect(() => {
    (async () => {
      if (!token || !user?.id) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE}/sellers/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setInfo(await res.json());
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  async function loadAllReviews() {
    if (!user?.id || !token) return;
    try {
      const res = await fetch(`${API_BASE}/sellers/${user.id}/reviews?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setAllReviews(d.items || []); }
    } catch {}
  }

  async function submitReview() {
    if (!user?.id || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/sellers/${user.id}/reviews`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating, comment: newComment.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      Alert.alert('Done', 'Review submitted!');
      setReviewModal(false);
      setNewComment('');
      setNewRating(5);
      const r2 = await fetch(`${API_BASE}/sellers/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (r2.ok) setInfo(await r2.json());
    } catch {
      Alert.alert('Error', 'Could not submit review.');
    } finally { setSubmitting(false); }
  }

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

      const updateRes = await fetch(`${API_BASE}/sellers/me`, {
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

  const name        = info?.full_name       || user?.full_name  || 'Individual Seller';
  const avgRating   = info?.avg_rating      ?? 0;
  const reviewCount = info?.review_count    ?? 0;
  const activeAds   = info?.vehicle_count   ?? 0;
  const customers   = info?.customers       ?? 0;
  const since       = info?.established_year ?? new Date().getFullYear();
  const bio         = info?.bio             || user?.bio        || '';
  const location    = info?.city            || user?.city       || '';
  const phone       = info?.phone           || user?.phone      || '';
  const hours       = info?.working_hours   || '';
  const breakdown   = info?.rating_breakdown ?? {};
  const reviews     = info?.reviews         ?? [];

  if (loading) return <View style={s.center}><ActivityIndicator color={ORANGE} size="large"/></View>;

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2}/>
          </TouchableOpacity>
          <Text style={s.logo}>
            Auto<Text style={{ color: ORANGE }}>wizor</Text>
          </Text>
          <View style={s.headerIcons}>
            <TouchableOpacity onPress={() => router.push('/alert' as any)}>
              <Bell size={24} color="#FFFFFF" strokeWidth={1.5}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(seller)/settings' as any)}>
              <Settings size={24} color="#FFFFFF" strokeWidth={1.5}/>
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
            <View style={s.coverOverlay}/>
            {coverUploading ? (
              <ActivityIndicator style={s.coverEditBtn} color="#fff" size="small"/>
            ) : (
              <View style={s.coverEditBtn}>
                <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject}/>
                <Pencil size={15} color="#fff" strokeWidth={2}/>
              </View>
            )}
          </TouchableOpacity>

          {/* ── SELLER INFO ── */}
          <View style={s.dealerSection}>
            <View style={s.dealerTop}>
              <View style={s.avatarWrapper}>
                <Image
                  source={{ uri: user?.avatar_url || 'https://ui-avatars.com/api/?name=Seller&background=032a69&color=fff&size=200' }}
                  style={s.avatar}
                />
                <TouchableOpacity style={s.editAvatarBtn} onPress={() => router.push('/profile/edit' as any)}>
                  <Pencil size={13} color="#fff" strokeWidth={2}/>
                </TouchableOpacity>
              </View>

              <View style={s.dealerDetails}>
                <View style={s.dealerNameRow}>
                  <Text style={s.dealerName} numberOfLines={1}>{name}</Text>
                  <BadgeCheck size={20} color="#078DE8" fill="#078DE8"/>
                </View>
                <Text style={s.official}>Individual Seller</Text>
                <View style={s.ratingRow}>
                  <Star size={20} color={ORANGE} fill={ORANGE}/>
                  <Text style={s.ratingText}>{avgRating}</Text>
                  <Text style={s.reviews}>({reviewCount}+ Reviews)</Text>
                </View>
              </View>

              <MoreVertical size={23} color={ORANGE} strokeWidth={2}/>
            </View>

            {/* Stats */}
            <View style={s.statsContainer}>
              <Stat icon={<Car size={26} color={ORANGE}/>}                         value={String(activeAds)} label="ACTIVE ADS"/>
              <Stat icon={<Star size={24} color={ORANGE} fill={ORANGE}/>}          value={String(avgRating)} label="RATING"/>
              <Stat icon={<Users size={26} color={ORANGE}/>}                       value={String(customers)} label="BUYERS"/>
              <Stat icon={<Award size={24} color={ORANGE}/>}                       value={String(since)}     label="SINCE"/>
            </View>

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
            <ContactItem icon={<MapPin size={20} color={ORANGE}/>} title="Location"     lines={location.split(',')} />
            <ContactItem icon={<Phone size={20} color={ORANGE}/>}  title="Contact"      lines={[phone, user?.email || '']} />
            <ContactItem icon={<Clock3 size={20} color={ORANGE}/>} title="Available"    lines={hours.split('\n')} />
          </View>

          {/* ── ACHIEVEMENTS ── */}
          <Text style={s.achievementTitle}>Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.achievementRow}>
            {[
              { label: '4.7 Star Rating' },
              { label: 'Verified Seller' },
              { label: 'Top Seller'      },
              { label: '10+ Cars Sold'   },
            ].map((a, i) => (
              <View key={i} style={s.achievementBox}>
                <View style={s.achIcon}><Award size={16} color="#fff"/></View>
                <Text style={s.achievementText}>{a.label}</Text>
              </View>
            ))}
          </ScrollView>

          {/* ── REVIEW SUMMARY ── */}
          <View style={s.reviewSummary}>
            <View style={s.barsContainer}>
              {[5, 4, 3, 2, 1].map(star => {
                const cnt   = (breakdown as Record<number,number>)[star] || 0;
                const total = Object.values(breakdown as Record<number,number>).reduce((a: number, b: number) => a + b, 0);
                const barW  = total > 0 ? (cnt / total) * 150 : 0;
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
            <Text style={{ color: C.textSecondary, textAlign: 'center', paddingVertical: 20, fontSize: 13, fontFamily: 'Poppins_400Regular' }}>No reviews yet</Text>
          ) : reviews.map((r: any, i: number) => (
            <Review key={i} name={r.name} color={r.color || ORANGE} text={r.comment} date={r.date} rating={r.rating}/>
          ))}

          <View style={s.reviewActions}>
            <TouchableOpacity style={s.seeMoreBtn} onPress={() => { loadAllReviews(); setSeeMoreModal(true); }}>
              <Text style={s.seeMoreText}>See All Reviews</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.addReviewBtn} onPress={() => setReviewModal(true)}>
              <Plus size={14} color="#fff" strokeWidth={2.5}/>
              <Text style={s.addReviewTxt}>Add Review</Text>
            </TouchableOpacity>
          </View>

          {/* ── PLAN CARD — removed (plan route deleted) */}


        </ScrollView>
      </View>

      {/* ── ADD REVIEW MODAL ── */}
      <Modal transparent visible={reviewModal} animationType="slide" onRequestClose={() => setReviewModal(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setReviewModal(false)}>
          <Pressable style={s.modalSheet}>
            <Text style={s.modalTitle}>Add Review</Text>
            <Text style={s.modalSub}>Rate your experience with this seller</Text>

            <View style={s.starPicker}>
              {[1,2,3,4,5].map(i => (
                <TouchableOpacity key={i} onPress={() => setNewRating(i)}>
                  <Star size={32} color={ORANGE} fill={i <= newRating ? ORANGE : 'transparent'} strokeWidth={1.5}/>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={s.modalInput}
              placeholder="Write your comment (optional)..."
              placeholderTextColor="#6B7A99"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[s.modalBtn, submitting && { opacity: 0.6 }]}
              onPress={submitReview}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small"/>
                : <Text style={s.modalBtnTxt}>Submit Review</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.modalCancel} onPress={() => setReviewModal(false)}>
              <Text style={s.modalCancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── SEE ALL REVIEWS MODAL ── */}
      <Modal transparent visible={seeMoreModal} animationType="slide" onRequestClose={() => setSeeMoreModal(false)}>
        <View style={s.seeMoreOverlay}>
          <View style={s.seeMoreSheet}>
            <View style={s.seeMoreHeader}>
              <Text style={s.modalTitle}>All Reviews ({allReviews.length})</Text>
              <TouchableOpacity onPress={() => setSeeMoreModal(false)}>
                <Text style={{ color: ORANGE, fontSize: 14, fontFamily: 'Poppins_500Medium' }}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {allReviews.length === 0 ? (
                <Text style={{ color: C.textSecondary, textAlign: 'center', paddingVertical: 40, fontFamily: 'Poppins_400Regular' }}>No reviews yet</Text>
              ) : allReviews.map((r: any, i: number) => (
                <Review key={i} name={r.name} color={r.color || ORANGE} text={r.comment} date={r.date} rating={r.rating}/>
              ))}
              <View style={{ height: 40 }}/>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

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

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: D.bg },
  container: { flex: 1, backgroundColor: D.bg },
  center:    { flex: 1, backgroundColor: D.bg, alignItems: 'center', justifyContent: 'center' },

  header:      { height: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  logo:        { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#FFFFFF', letterSpacing: -0.5 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  coverContainer: { width, height: 230, overflow: 'hidden' },
  coverImage:     { width: '100%', height: '100%' },
  coverOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  coverEditBtn:   { position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },

  dealerSection: { paddingHorizontal: 16 },
  dealerTop:     { flexDirection: 'row', alignItems: 'flex-start', marginTop: -30 },

  avatarWrapper: { width: 96, height: 96, position: 'relative' },
  avatar:        { width: 96, height: 96, borderRadius: 48, backgroundColor: '#1a2f52', borderWidth: 2, borderColor: '#fff' },
  editAvatarBtn: { position: 'absolute', right: -2, bottom: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },

  dealerDetails: { flex: 1, marginLeft: 12, paddingTop: 38 },
  dealerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  dealerName:    { color: '#FFFFFF', fontSize: 19, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
  official:      { color: D.muted, fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  ratingText:    { color: D.muted, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  reviews:       { color: D.muted, fontSize: 14, fontFamily: 'Poppins_400Regular' },

  statsContainer: { flexDirection: 'row', marginTop: 26 },
  stat:           { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.14)' },
  statValue:      { color: '#FFFFFF', fontSize: 17, fontFamily: 'Poppins_500Medium', marginTop: 8 },
  statLabel:      { color: D.muted, fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1, letterSpacing: 0.8 },

  editProfileBtn:  { height: 52, marginTop: 24, alignItems: 'center', justifyContent: 'center' },
  editProfileText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_500Medium' },

  section:      { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_500Medium', marginBottom: 4 },
  aboutText:    { color: D.muted, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 21 },

  contactRow:      { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 8 },
  contactItem:     { flex: 1 },
  contactTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  contactTitle:    { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  contactText:     { color: D.muted, fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16, paddingLeft: 26 },

  achievementTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_500Medium', marginHorizontal: 20, marginTop: 22, marginBottom: 10 },
  achievementRow:   { paddingHorizontal: 20, gap: 10, flexDirection: 'row' },
  achievementBox:   { height: 44, borderRadius: 10, backgroundColor: D.navy, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
  achIcon:          { width: 26, height: 26, borderRadius: 6, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  achievementText:  { color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins_400Regular' },

  reviewSummary: { marginHorizontal: 20, marginTop: 20, borderRadius: 14, backgroundColor: D.navy, flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 14 },
  barsContainer: { flex: 1, justifyContent: 'space-between' },
  ratingBarRow:  { flexDirection: 'row', alignItems: 'center', height: 22 },
  ratingNumber:  { width: 14, color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins_400Regular' },
  barBackground: { height: 5, width: 150, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 5, marginLeft: 5, overflow: 'hidden' },
  barFill:       { height: '100%', backgroundColor: ORANGE, borderRadius: 5 },
  reviewScore:   { width: 100, alignItems: 'center', justifyContent: 'center' },
  bigScore:      { color: '#FFFFFF', fontSize: 38, fontFamily: 'Poppins_700Bold' },
  starsRow:      { flexDirection: 'row', gap: 3, marginTop: 3 },
  reviewCount:   { color: D.muted, fontSize: 11, fontFamily: 'Poppins_600SemiBold', marginTop: 6 },

  review:        { marginHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', flexDirection: 'row' },
  reviewAvatar:  { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  reviewInitial: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  reviewContent: { flex: 1, marginLeft: 10 },
  reviewNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewName:    { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  reviewStars:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  reviewTime:    { color: D.muted, fontSize: 10, fontFamily: 'Poppins_400Regular', marginLeft: 4 },
  reviewText:    { color: D.muted, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 6, lineHeight: 18 },

  reviewActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
  seeMoreBtn:    { paddingVertical: 6 },
  seeMoreText:   { color: '#E6E1E8', fontSize: 14, fontFamily: 'Poppins_400Regular', textDecorationLine: 'underline' },
  addReviewBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: D.navy, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: ORANGE },
  addReviewTxt:  { color: '#fff', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: '#061234', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(130,165,213,0.5)', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  modalTitle:    { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_700Bold', marginBottom: 6 },
  modalSub:      { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 20 },
  starPicker:    { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 20 },
  modalInput:    { minHeight: 80, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', backgroundColor: 'rgba(1,6,20,1)', paddingHorizontal: 16, paddingVertical: 12, color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 16, textAlignVertical: 'top' },
  modalBtn:      { height: 50, borderRadius: 25, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalBtnTxt:   { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  modalCancel:   { alignItems: 'center', paddingVertical: 8 },
  modalCancelTxt:{ color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  seeMoreOverlay:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  seeMoreSheet:  { backgroundColor: '#061234', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(130,165,213,0.5)', maxHeight: '80%', paddingBottom: 20 },
  seeMoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },

  premiumCard:      { marginHorizontal: 16, marginTop: 24, padding: 20 },
  planHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  currentPlanBadge: { alignSelf: 'flex-start', backgroundColor: ORANGE, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
  currentPlanText:  { color: '#3A1A0A', fontSize: 10, fontFamily: 'Poppins_700Bold' },
  premiumTitle:     { color: ORANGE, fontSize: 17, fontFamily: 'Poppins_500Medium', marginTop: 6 },
  badgeCircle:      { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  planFeature:      { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  planFeatureText:  { color: '#E6E1E8', fontSize: 15, fontFamily: 'Poppins_400Regular', marginLeft: 12 },
  manageButton:     { height: 50, borderRadius: 25, marginTop: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  manageText:       { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
