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
import { D, GlowCard, Verified } from '@/components/dealer/DealerUI';
import { RatingSummary, ReviewItem as SharedReviewItem } from '@/components/book/reviews';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';
import { useTabBarSpace } from '@/components/shared/PillTabBar';

const SERVER = API_BASE.replace('/api/v1', '');
function resolveUrl(url?: string) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${SERVER}${url}`;
}

const ORANGE = '#e2671b';
const C = AppColors;


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



export default function InsuranceProfileScreen() {
  const tabSpace = useTabBarSpace(120);
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

  const yearsInBiz = estYear ? `${new Date().getFullYear() - estYear}+ Years` : '—';
  const ABOUT_GRID = [
    { icon: <Ionicons name="calendar-outline" size={24} color={ORANGE} />, num: yearsInBiz, label: 'In Business' },
    { icon: <Ionicons name="people-outline" size={24} color={ORANGE} />, num: profile?.team_members ? `${profile.team_members}+` : '—', label: 'Team Members' },
    { icon: <MaterialCommunityIcons name="office-building-outline" size={24} color={ORANGE} />, num: profile?.branch_count ? String(profile.branch_count) : '—', label: 'Branch Network' },
    { icon: <MaterialCommunityIcons name="handshake-outline" size={24} color={ORANGE} />, num: followers > 0 ? `${followers}+` : '—', label: 'Happy Clients' },
  ];

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 70 }}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Image source={require('@/assets/images/autowizor-logo-text.png')} style={s.logoImg} resizeMode="contain" />
          <View style={s.topActions}>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/profile/settings' as any)}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabSpace }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
      >
        {/* Cover (tap to change) */}
        <TouchableOpacity style={s.hero} activeOpacity={0.9} onPress={() => pickAndUpload('cover')}>
          {coverUrl
            ? <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" key={coverUrl} />
            : <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#061B4A', alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="image-outline" size={40} color="#4B5A7A" />
              </View>}
          {uploading === 'cover' && <View style={s.uploadOverlay}><ActivityIndicator color="#fff" /></View>}
        </TouchableOpacity>

        {/* Profile row */}
        <View style={s.profileRow}>
          <TouchableOpacity style={s.avatarWrap} onPress={() => pickAndUpload('avatar')} activeOpacity={0.85}>
            {avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={s.avatar} />
              : <View style={[s.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#032a69' }]}>
                  <Text style={{ color: '#fff', fontSize: 30, fontFamily: 'Poppins_700Bold' }}>{initials}</Text>
                </View>}
            {uploading === 'avatar'
              ? <View style={[s.avatarBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}><ActivityIndicator size="small" color="#fff" /></View>
              : <View style={s.avatarBadge}><MaterialCommunityIcons name="square-edit-outline" size={16} color="#fff" /></View>}
          </TouchableOpacity>

          <View style={s.profileInfo}>
            <View style={s.nameRow}>
              <Text style={s.name} numberOfLines={1}>{name}</Text>
              {isVerified && <Verified size={20} />}
              <View style={{ flex: 1 }} />
              <Ionicons name="ellipsis-vertical" size={22} color={ORANGE} />
            </View>
            <Text style={s.tagline} numberOfLines={2}>{bio}</Text>
            <View style={s.metaRow}>
              {avgRating > 0 && (
                <View style={s.metaItem}>
                  <Ionicons name="star" size={16} color={ORANGE} />
                  <Text style={s.metaText}>{avgRating.toFixed(1)} ({reviewCount} Reviews)</Text>
                </View>
              )}
              <View style={s.metaItem}>
                <Ionicons name="location-outline" size={16} color={ORANGE} />
                <Text style={s.metaText}>{city}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.stats}>
          <StatItem icon={<MaterialCommunityIcons name="shield-search" size={26} color={ORANGE} />} num={policyCount > 0 ? `${policyCount}+` : '—'} label="POLICIES" />
          <View style={s.statSep} />
          <StatItem icon={<Ionicons name="people-outline" size={26} color={ORANGE} />} num={followers > 0 ? `${followers}+` : '—'} label="FOLLOWERS" />
          <View style={s.statSep} />
          <StatItem icon={<Ionicons name="star-outline" size={24} color={ORANGE} />} num={avgRating > 0 ? avgRating.toFixed(1) : '—'} label="RATING" />
          <View style={s.statSep} />
          <StatItem icon={<Ionicons name="ribbon-outline" size={24} color={ORANGE} />} num={String(reviewCount)} label="REVIEWS" />
        </View>

        {/* Edit Profile */}
        <GlowCard style={s.editBtn} radius={26} onPress={() => router.push('/profile/edit' as any)}>
          <Text style={s.editBtnText}>Edit Profile</Text>
        </GlowCard>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>
          <Text style={s.aboutText}>{bio}</Text>
          <View style={s.infoRow}>
            <InfoItem icon={<Ionicons name="location-outline" size={20} color={ORANGE} />} label="Location" value={location || city} />
            <InfoItem icon={<Ionicons name="call-outline" size={20} color={ORANGE} />} label="Contact" value={`${phone}\n${email}`} />
            <InfoItem icon={<Ionicons name="time-outline" size={20} color={ORANGE} />} label="Working hour" value={workingHours} />
          </View>
        </View>

        {/* Achievement */}
        {(estYear || followers > 0 || policyCount > 0) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Achievement</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.achieveRow}>
              {estYear && <InfoCard icon={<Feather name="calendar" size={16} color="#fff" />} num={`${new Date().getFullYear() - estYear}+ Yrs`} label="In Business" />}
              {followers > 0 && <InfoCard icon={<Ionicons name="people-outline" size={16} color="#fff" />} num={`${followers}+`} label="Followers" />}
              {policyCount > 0 && <InfoCard icon={<MaterialCommunityIcons name="shield-check-outline" size={16} color="#fff" />} num={`${policyCount}+`} label="Policies" />}
              {avgRating > 0 && <InfoCard icon={<Ionicons name="star-outline" size={16} color="#fff" />} num={avgRating.toFixed(1)} label="Avg Rating" />}
            </ScrollView>
          </View>
        )}

        {/* About <company> */}
        <View style={s.section}>
          <Text style={s.sectionTitleBold}>About {name}</Text>
          <View style={s.aboutGrid}>
            {ABOUT_GRID.map(g => (
              <GlowCard key={g.label} style={s.aboutGridCard}>
                {g.icon}
                <View style={{ flex: 1 }}>
                  <Text style={s.gridNum}>{g.num}</Text>
                  <Text style={s.gridLabel}>{g.label}</Text>
                </View>
              </GlowCard>
            ))}
          </View>
        </View>

        {/* Our Offices */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitleBold}>Our Offices</Text>
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

        {/* Reviews (same as the Book-a-vehicle / dealer profile) */}
        <View style={[s.section, { marginTop: 22 }]}>
          <RatingSummary avg={avgRating} count={reviewCount} reviews={reviews} />
          {reviews.length === 0
            ? <Text style={{ color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingVertical: 16 }}>No reviews yet</Text>
            : reviews.map((r, i) => <SharedReviewItem key={r.id || i} r={r} index={i} />)}
          <TouchableOpacity style={s.seeMoreRow} onPress={() => router.push('/(insurance_provider)/reviews' as any)}>
            <Text style={s.seeMore}>See More</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom actions */}
        <View style={s.bottomActions}>
          <GradientButton title="Get a Quote Now" height={52} fontSize={17} onPress={() => {}} />
          <GlassButton
            title="Logout from Session"
            height={52}
            fontSize={16}
            color="#E6E1E8"
            icon={<Feather name="log-out" size={20} color="#E6E1E8" />}
            onPress={logout}
          />
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg },

  topbar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
  logoImg:    { width: 128, height: 24 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12, width: 100, justifyContent: 'flex-end' },

  hero:          { height: 240, backgroundColor: '#061B4A', overflow: 'hidden' },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

  profileRow:  { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, marginTop: -40, gap: 12 },
  avatarWrap:  { position: 'relative' },
  avatar:      { width: 104, height: 104, borderRadius: 52, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF' },
  avatarBadge: { position: 'absolute', bottom: 4, right: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  profileInfo: { flex: 1, paddingTop: 46 },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name:        { fontSize: 19, fontFamily: 'Poppins_500Medium', color: '#FFFFFF', flexShrink: 1 },
  tagline:     { fontSize: 13, fontFamily: 'Poppins_400Regular', color: D.muted, marginTop: 1 },
  metaRow:     { flexDirection: 'row', gap: 14, marginTop: 4, flexWrap: 'wrap' },
  metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:    { fontSize: 13, fontFamily: 'Poppins_400Regular', color: D.muted },

  stats:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 24 },
  statItem:  { alignItems: 'center', flex: 1, gap: 4 },
  statSep:   { width: 1, height: 52, backgroundColor: 'rgba(255,255,255,0.14)' },
  statNum:   { fontSize: 17, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF' },
  statLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: D.muted, letterSpacing: 0.6 },

  editBtn:     { marginHorizontal: 16, marginTop: 24, height: 52, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_500Medium' },

  section:          { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle:     { fontSize: 18, fontFamily: 'Poppins_500Medium', color: '#FFFFFF', marginBottom: 6 },
  sectionTitleBold: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', marginBottom: 12 },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll:          { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#5B9BFF' },

  aboutText:    { fontSize: 14, fontFamily: 'Poppins_400Regular', color: D.muted, lineHeight: 24, marginBottom: 16 },
  infoRow:      { flexDirection: 'row', gap: 8 },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  infoLabel:    { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  infoValue:    { fontSize: 11, fontFamily: 'Poppins_400Regular', color: D.muted, lineHeight: 16, marginLeft: 26 },

  achieveRow: { flexDirection: 'row', gap: 10, paddingRight: 4 },
  infoCard:   { height: 44, borderRadius: 10, backgroundColor: D.navy, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox:    { width: 26, height: 26, borderRadius: 6, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  cardNum:    { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  cardLabel:  { fontSize: 10, fontFamily: 'Poppins_400Regular', color: D.muted },

  aboutGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  aboutGridCard: { width: '47.5%', height: 76, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18 },
  gridNum:       { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF' },
  gridLabel:     { fontSize: 12, fontFamily: 'Poppins_400Regular', color: D.muted },

  officeThumb:  { width: 170, height: 106, borderRadius: 10, marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  officeAddBtn: { width: 106, height: 106, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(226,103,27,0.4)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(226,103,27,0.05)', marginRight: 10, gap: 4 },
  officeAddTxt: { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_500Medium' },

  seeMoreRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  seeMore:    { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#E6E1E8', textDecorationLine: 'underline' },

  bottomActions: { paddingHorizontal: 16, marginTop: 20, gap: 14 },
});
