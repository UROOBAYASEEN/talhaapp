import React, { useEffect, useState } from 'react';
import {
  Image, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/constants/api';
import * as ImagePicker from 'expo-image-picker';

const SERVER = API_BASE.replace('/api/v1', '');
function resolveUrl(url?: string) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${SERVER}${url}`;
}

const ORANGE = '#e2671b';
const C = AppColors;

function CardShade() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

function StatItem({ icon, num, label }: any) {
  return (
    <View style={s.statItem}>
      {icon}
      <Text style={s.statNum}>{num}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function InfoItem({ icon, label, value }: any) {
  return (
    <View style={{ flex: 1 }}>
      <View style={s.infoLabelRow}>
        {icon}
        <Text style={s.infoLabel}>{label}</Text>
      </View>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function InfoCard({ icon, num, label }: any) {
  return (
    <View style={s.infoCard}>
      <View style={s.iconBox}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.cardNum}>{num}</Text>
        <Text style={s.cardLabel}>{label}</Text>
      </View>
    </View>
  );
}

function ReviewBar({ star, pct }: any) {
  return (
    <View style={s.reviewBarRow}>
      <Text style={s.reviewBarLabel}>{star}</Text>
      <Ionicons name="star" size={12} color={ORANGE} />
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${pct * 100}%` as any }]} />
      </View>
    </View>
  );
}

function ReviewItem({ initial, color, name, stars, time, text }: any) {
  return (
    <View style={s.reviewItem}>
      <View style={s.reviewHead}>
        <View style={[s.reviewAvatar, { backgroundColor: color }]}>
          <Text style={s.reviewAvatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.reviewName}>{name}</Text>
          <View style={s.starsTimeRow}>
            <View style={{ flexDirection: 'row' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <Ionicons key={i} name={i <= stars ? 'star' : 'star-outline'} size={11} color={ORANGE} />
              ))}
            </View>
            <Text style={s.reviewTime}>{time}</Text>
          </View>
        </View>
        <Feather name="more-vertical" size={16} color="#8f9cb5" />
      </View>
      <Text style={s.reviewText}>{text}</Text>
    </View>
  );
}

export default function InsuranceProfileScreen() {
  const { logout, user, token } = useAuth();
  const router = useRouter();

  const [profile,      setProfile]      = useState<any>(null);
  const [reviews,      setReviews]      = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [uploading,    setUploading]    = useState<'avatar' | 'cover' | null>(null);
  const [officeImages, setOfficeImages] = useState<string[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!token || !user?.id) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [pRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/insurance/me`, { headers }),
        fetch(`${API_BASE}/insurance/${user.id}/reviews?limit=2`, { headers }),
      ]);
      if (pRes.ok) setProfile(await pRes.json());
      if (rRes.ok) setReviews(await rRes.json());
    } catch { /* offline */ }
    finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function pickOfficeImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photo library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (result.canceled || !result.assets?.length) return;
    try {
      const asset    = result.assets[0];
      const filename = asset.uri.split('/').pop() || 'photo.jpg';
      const ext      = filename.split('.').pop() || 'jpg';
      const form     = new FormData();
      form.append('file', { uri: asset.uri, name: filename, type: `image/${ext}` } as any);
      const upRes = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (!upRes.ok) return;
      const data = await upRes.json();
      const fullUrl = `${SERVER}${data.url}`;
      setOfficeImages(prev => [...prev, fullUrl]);
    } catch { Alert.alert('Error', 'Could not upload image.'); }
  }

  async function pickAndUpload(type: 'avatar' | 'cover') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photo library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    setUploading(type);
    try {
      const asset    = result.assets[0];
      const filename = asset.uri.split('/').pop() || 'photo.jpg';
      const ext      = filename.split('.').pop() || 'jpg';
      const form     = new FormData();
      form.append('file', { uri: asset.uri, name: filename, type: `image/${ext}` } as any);

      const upRes = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (!upRes.ok) { Alert.alert('Upload Failed', 'Could not upload image.'); return; }

      const data    = await upRes.json();
      const fullUrl = `${SERVER}${data.url}`;
      const body    = type === 'avatar' ? { avatar_url: fullUrl } : { cover_photo_url: fullUrl };

      const putRes = await fetch(`${API_BASE}/insurance/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!putRes.ok) { Alert.alert('Update Failed', 'Could not update profile.'); return; }
      setProfile((p: any) => ({ ...p, ...body }));
    } catch { Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally { setUploading(null); }
  }

  const name         = profile?.full_name     || profile?.company_name || user?.full_name || 'Insurance Provider';
  const bio          = profile?.bio           || 'Leading insurance solutions in Pakistan.';
  const city         = profile?.city          || '—';
  const phone        = profile?.phone         || user?.phone || '—';
  const email        = profile?.email         || user?.email || '—';
  const workingHours = profile?.working_hours || 'Mon - Sat  9:00 AM - 7:00 PM';
  const location     = profile?.location      || city;
  const estYear      = profile?.established_year;
  const avgRating    = profile?.avg_rating    ?? 0;
  const reviewCount  = profile?.review_count  ?? 0;
  const followers    = profile?.follower_count ?? 0;
  const policyCount  = profile?.policy_count  ?? 0;
  const avatarUrl    = resolveUrl(profile?.avatar_url || profile?.logo_url);
  const coverUrl     = resolveUrl(profile?.cover_photo_url || profile?.banner_url);
  const isVerified   = profile?.is_verified   ?? false;
  const initials     = name.charAt(0).toUpperCase();

  if (loading) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={ORANGE} size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
          </TouchableOpacity>
          <Image source={require('@/assets/images/autowizor-logo-text.png')} style={s.logoImg} resizeMode="contain" />
          <View style={s.topActions}>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={20} color={C.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/profile/settings' as any)}>
              <Ionicons name="settings-outline" size={20} color={C.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
      >

        {/* Cover / Hero image */}
        <TouchableOpacity style={s.hero} activeOpacity={0.85} onPress={() => pickAndUpload('cover')}>
          {coverUrl
            ? <Image
                source={{ uri: coverUrl }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                key={coverUrl}
              />
            : <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#061B4A', alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="image-outline" size={40} color="#4B5A7A" />
              </View>
          }
          {uploading === 'cover'
            ? <View style={s.uploadOverlay}><ActivityIndicator color="#fff" /></View>
            : <View style={s.editCoverBtn}><Feather name="camera" size={13} color="#fff" /><Text style={s.editCoverTxt}>Edit Cover</Text></View>
          }
          {isVerified && (
            <View style={s.badge}><Text style={s.badgeText}>VERIFIED</Text></View>
          )}
        </TouchableOpacity>

        {/* Profile row */}
        <View style={s.profileRow}>
          <TouchableOpacity style={s.avatarWrap} onPress={() => pickAndUpload('avatar')} activeOpacity={0.85}>
            {avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={s.avatar} />
              : <View style={[s.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#032a69' }]}>
                  <Text style={{ color: '#fff', fontSize: 26, fontFamily: 'Poppins_700Bold' }}>{initials}</Text>
                </View>
            }
            {uploading === 'avatar'
              ? <View style={[s.avatarBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}><ActivityIndicator size="small" color="#fff" /></View>
              : <View style={s.avatarBadge}><Feather name="camera" size={11} color="#fff" /></View>
            }
          </TouchableOpacity>

          <View style={s.profileInfo}>
            <View style={s.nameRow}>
              <Text style={s.name} numberOfLines={1}>{name}</Text>
              {isVerified && <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />}
            </View>
            <Text style={s.tagline} numberOfLines={2}>{bio}</Text>
            <View style={s.metaRow}>
              {avgRating > 0 && (
                <View style={s.metaItem}>
                  <Ionicons name="star" size={12} color={ORANGE} />
                  <Text style={s.metaText}>{avgRating.toFixed(1)} ({reviewCount} Reviews)</Text>
                </View>
              )}
              <View style={s.metaItem}>
                <Ionicons name="location-outline" size={12} color="#8f9cb5" />
                <Text style={s.metaText}>{city}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.stats}>
          <StatItem icon={<MaterialCommunityIcons name="shield-check-outline" size={22} color={ORANGE} />} num={policyCount > 0 ? `${policyCount}+` : '—'} label="POLICIES" />
          <StatItem icon={<Ionicons name="people-outline" size={22} color={ORANGE} />} num={followers > 0 ? `${followers}+` : '—'} label="FOLLOWERS" />
          <StatItem icon={<Ionicons name="star-outline" size={22} color={ORANGE} />} num={avgRating > 0 ? avgRating.toFixed(1) : '—'} label="RATING" />
          <StatItem icon={<Ionicons name="ribbon-outline" size={22} color={ORANGE} />} num={String(reviewCount)} label="REVIEWS" />
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={s.editBtn} activeOpacity={0.85} onPress={() => router.push('/profile/edit' as any)}>
          <CardShade />
          <Text style={s.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>
          <View style={s.aboutCard}>
            <Text style={s.aboutText}>{bio}</Text>
            <View style={s.infoRow}>
              <InfoItem icon={<Ionicons name="location-outline" size={14} color={ORANGE} />} label="Location" value={location || city} />
              <InfoItem icon={<Ionicons name="call-outline" size={14} color={ORANGE} />} label="Contact" value={`${phone}\n${email}`} />
              <InfoItem icon={<Ionicons name="time-outline" size={14} color={ORANGE} />} label="Working Hours" value={workingHours} />
            </View>
          </View>
        </View>

        {/* Achievement */}
        {(estYear || followers > 0 || policyCount > 0) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Achievement</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.achieveRow}>
              {estYear && <InfoCard icon={<Feather name="calendar" size={18} color={ORANGE} />} num={`${new Date().getFullYear() - estYear}+ Yrs`} label="In Business" />}
              {followers > 0 && <InfoCard icon={<Ionicons name="people-outline" size={18} color={ORANGE} />} num={`${followers}+`} label="Followers" />}
              {policyCount > 0 && <InfoCard icon={<MaterialCommunityIcons name="shield-check-outline" size={18} color={ORANGE} />} num={`${policyCount}+`} label="Policies" />}
              {avgRating > 0 && <InfoCard icon={<Ionicons name="star-outline" size={18} color={ORANGE} />} num={avgRating.toFixed(1)} label="Avg Rating" />}
            </ScrollView>
          </View>
        )}

        {/* Our Offices */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Our Offices</Text>
            <TouchableOpacity onPress={pickOfficeImage}>
              <Text style={s.viewAll}>+ Add Photo</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {officeImages.map((uri, i) => (
              <Image key={i} source={{ uri }} style={s.officeThumb} />
            ))}
            <TouchableOpacity style={s.officeAddBtn} onPress={pickOfficeImage} activeOpacity={0.8}>
              <Ionicons name="add" size={28} color={ORANGE} />
              <Text style={s.officeAddTxt}>Add</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Reviews summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Reviews</Text>
          <View style={s.reviewsCard}>
            <CardShade />
            <View style={{ flex: 1 }}>
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviews.filter(r => Math.round(r.rating) === star).length;
                const pct   = reviewCount > 0 ? count / reviewCount : 0;
                return <ReviewBar key={star} star={star} pct={pct} />;
              })}
            </View>
            <View style={s.reviewsSummary}>
              <Text style={s.score}>{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</Text>
              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Ionicons key={i} name={i <= Math.round(avgRating) ? 'star' : 'star-outline'} size={14} color={ORANGE} />
                  ))}
                </View>
                <Text style={s.reviewCount}>{reviewCount} Reviews</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Review items */}
        <View style={s.section}>
          {reviews.length === 0
            ? <Text style={{ color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingVertical: 16 }}>No reviews yet</Text>
            : reviews.map((r, i) => (
                <ReviewItem
                  key={i}
                  initial={(r.reviewer_name || 'U').charAt(0).toUpperCase()}
                  color={i === 0 ? ORANGE : '#6b7280'}
                  name={r.reviewer_name || 'User'}
                  stars={Math.round(r.rating)}
                  time={r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}
                  text={r.comment || ''}
                />
              ))
          }
          <TouchableOpacity style={s.seeMoreRow} onPress={() => router.push('/(insurance_provider)/reviews' as any)}>
            <Text style={s.seeMore}>See More Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom actions */}
        <View style={s.bottomActions}>
          <TouchableOpacity style={s.btnLogout} onPress={logout} activeOpacity={0.85}>
            <CardShade />
            <Feather name="log-out" size={16} color={C.textPrimary} />
            <Text style={s.btnLogoutText}>Logout from Session</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topbar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  logoImg:    { width: 130, height: 28 },
  topActions: { flexDirection: 'row', gap: 16 },

  hero:          { marginHorizontal: 18, height: 190, borderRadius: 18, overflow: 'hidden', backgroundColor: '#061B4A' },
  badge:         { position: 'absolute', top: 12, left: 12, backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText:     { color: '#fff', fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  editCoverBtn:  { position: 'absolute', bottom: 10, right: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  editCoverTxt:  { color: '#fff', fontSize: 11, fontFamily: 'Poppins_500Medium' },

  profileRow:  { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 18, marginTop: -34, gap: 12 },
  avatarWrap:  { position: 'relative' },
  avatar:      { width: 66, height: 66, borderRadius: 33, backgroundColor: '#032a69', borderWidth: 3, borderColor: C.bg },
  avatarBadge: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },
  profileInfo: { flex: 1, paddingTop: 40 },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:        { fontSize: 17, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  tagline:     { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', marginTop: 2 },
  metaRow:     { flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:    { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8f9cb5' },

  stats:     { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22, marginTop: 18 },
  statItem:  { alignItems: 'center', flex: 1, gap: 4 },
  statNum:   { fontSize: 15, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  statLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', letterSpacing: 0.4 },

  editBtn:     { marginHorizontal: 18, marginTop: 18, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', paddingVertical: 13, alignItems: 'center', marginBottom: 4 },
  editBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  section:       { paddingHorizontal: 18, marginTop: 20 },
  sectionTitle:  { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll:       { fontSize: 12, fontFamily: 'Poppins_500Medium', color: ORANGE },

  aboutCard:    { borderRadius: 14, padding: 14 },
  aboutText:    { fontSize: 13, fontFamily: 'Poppins_400Regular', color: C.textSecondary, lineHeight: 20, marginBottom: 14 },
  infoRow:      { flexDirection: 'row', gap: 10 },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  infoLabel:    { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  infoValue:    { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', lineHeight: 16 },

  achieveRow: { flexDirection: 'row', gap: 12, paddingRight: 4 },
  infoCard:   { width: 160, borderRadius: 14, backgroundColor: '#061B4A', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox:    { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(226,103,27,0.12)', alignItems: 'center', justifyContent: 'center' },
  cardNum:    { fontSize: 11, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  cardLabel:  { fontSize: 8, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', marginTop: 1 },

  officeThumb:  { width: 130, height: 100, borderRadius: 12, marginRight: 10 },
  officeAddBtn: { width: 100, height: 100, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(226,103,27,0.4)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(226,103,27,0.05)', marginRight: 10, gap: 4 },
  officeAddTxt: { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_500Medium' },

  reviewsCard:    { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(6,27,74,1)', padding: 16, flexDirection: 'row', gap: 16, alignItems: 'center' },
  reviewBarRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  reviewBarLabel: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary, width: 10 },
  barTrack:       { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
  barFill:        { height: '100%', backgroundColor: ORANGE, borderRadius: 4 },
  reviewsSummary: { alignItems: 'center', gap: 4 },
  score:          { fontSize: 34, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  reviewCount:    { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', marginTop: 4 },

  reviewItem:       { paddingVertical: 14, marginBottom: 4 },
  reviewHead:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 14 },
  reviewName:       { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  starsTimeRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  reviewTime:       { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8f9cb5' },
  reviewText:       { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary, lineHeight: 18 },
  seeMoreRow:       { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  seeMore:          { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: ORANGE },

  bottomActions: { paddingHorizontal: 18, marginTop: 22, gap: 12 },
  btnLogout:     { borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'transparent', paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnLogoutText: { color: C.textPrimary, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
});
