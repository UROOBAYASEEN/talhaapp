import VerifiedIcon from '@/components/shared/VerifiedIcon';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_W } = Dimensions.get('window');
const COVER_H = 220;
const ORANGE  = '#e2671b';
const BLUE    = '#032a69';

const C = AppColors;

// ── Rating Bar Component ────────────────────────────────────────────────────
function RatingBar({ star, fill }: { star: number; fill: number }) {
  return (
    <View style={rb.row}>
      <Text style={rb.num}>{star}</Text>
      <Ionicons name="star" size={12} color={ORANGE} style={{ marginHorizontal: 4 }} />
      <View style={rb.track}>
        <View style={[rb.fill, { width: `${fill}%` }]} />
      </View>
    </View>
  );
}

const rb = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  num:  { width: 10, fontSize: 11, fontFamily: 'Poppins_400Regular', color: C.textSecondary, textAlign: 'right' },
  track:{ flex: 1, height: 5, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  fill: { height: 5, backgroundColor: ORANGE, borderRadius: 4 },
});

// ── Review Card ─────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: any }) {
  const stars = Math.round(review.rating);
  const ago   = timeAgo(review.created_at);
  const initials = (review.reviewer_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={rc.card}>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      <View style={rc.header}>
        <View style={rc.avatar}>
          <Text style={rc.avatarTxt}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rc.name}>{review.reviewer_name}</Text>
          <View style={rc.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <Ionicons key={i} name={i <= stars ? 'star' : 'star-outline'} size={12} color={ORANGE} />
            ))}
            <Text style={rc.time}>{ago}</Text>
          </View>
        </View>
      </View>
      {review.comment ? (
        <Text style={rc.comment}>"{review.comment}"</Text>
      ) : null}
    </View>
  );
}

const rc = StyleSheet.create({
  card:     { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: C.glassBg, padding: 14, marginBottom: 10, overflow: 'hidden' },
  header:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar:   { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1a4a8a', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:{ fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff' },
  name:     { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  time:     { fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.textSecondary, marginLeft: 4 },
  comment:  { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary, fontStyle: 'italic', lineHeight: 18 },
});

// ── Info Tile ────────────────────────────────────────────────────────────────
function InfoTile({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={it.tile}>
      <Ionicons name={icon} size={18} color={ORANGE} />
      <Text style={it.label}>{label}</Text>
      <Text style={it.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const it = StyleSheet.create({
  tile:  { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  label: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: C.textSecondary, marginTop: 4, marginBottom: 2 },
  value: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.textPrimary, textAlign: 'center', lineHeight: 14 },
});

// ── Utilities ────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function computeRatingBars(reviews: any[]): number[] {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach(r => {
    const idx = Math.round(r.rating) - 1;
    if (idx >= 0 && idx < 5) counts[idx]++;
  });
  const max = Math.max(...counts, 1);
  return counts.map(c => Math.round((c / max) * 100));
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function DealerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [dealer,   setDealer]   = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [reviews,  setReviews]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (id) { fetchAll(); }
  }, [id]);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchDealer(), fetchVehicles(), fetchReviews()]);
    setLoading(false);
  }

  async function fetchDealer() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/dealers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDealer(data);
        setFollowing(data.is_following);
      }
    } catch { /* offline */ }
  }

  async function fetchVehicles() {
    try {
      const res = await fetch(`${API_BASE}/vehicles?seller_id=${id}&limit=10&status=active`);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.items || []);
      }
    } catch { /* offline */ }
  }

  async function fetchReviews() {
    try {
      const res = await fetch(`${API_BASE}/dealers/${id}/reviews?limit=20`);
      if (res.ok) setReviews(await res.json());
    } catch { /* offline */ }
  }

  async function toggleFollow() {
    if (!token) return;
    setFollowLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dealers/${id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.is_following);
        setDealer((prev: any) => prev ? {
          ...prev,
          follower_count: data.is_following ? prev.follower_count + 1 : prev.follower_count - 1,
        } : prev);
      }
    } catch { /* offline */ }
    finally { setFollowLoading(false); }
  }

  function handleCall() {
    const phone = dealer?.phone;
    if (!phone) return Alert.alert('No phone number available');
    Linking.openURL(`tel:${phone}`);
  }

  function handleChat() {
    router.push('/(tabs)/chat' as any);
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={ORANGE} size="large" />
      </View>
    );
  }

  if (!dealer) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Ionicons name="storefront-outline" size={48} color={C.textSecondary} />
          <Text style={[s.emptyTxt, { marginTop: 12 }]}>Dealership not found</Text>
          <TouchableOpacity style={s.backFallback} onPress={() => router.back()}>
            <Text style={{ color: ORANGE, fontFamily: 'Poppins_500Medium' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = dealer.dealership_name || dealer.full_name;
  const memberYear  = dealer.established_year || (dealer.member_since ? new Date(dealer.member_since).getFullYear() : null);
  const ratingBars  = computeRatingBars(reviews);
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  return (
    <View style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 220 }}>

        {/* ── Cover Photo ── */}
        <View style={s.coverWrap}>
          {dealer.cover_photo_url ? (
            <Image source={{ uri: dealer.cover_photo_url }} style={s.cover} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[BLUE, '#1a4a8a', '#0d1f3c']} style={s.cover} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="storefront" size={64} color="rgba(255,255,255,0.15)" />
            </LinearGradient>
          )}
          {/* Nav row */}
          <View style={s.navRow}>
            <TouchableOpacity style={s.navBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Image source={require('@/assets/images/autowizor-logo-text.png')} style={s.navLogo} resizeMode="contain" />
            <View style={{ width: 36 }} />
          </View>

          {/* Avatar overlapping cover */}
          <View style={s.avatarWrap}>
            {dealer.avatar_url ? (
              <Image source={{ uri: dealer.avatar_url }} style={s.avatar} resizeMode="cover" />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Text style={s.avatarInitials}>
                  {displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Info Section ── */}
        <View style={s.infoSection}>
          {/* Name + badges */}
          <View style={s.nameRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.dealerName} numberOfLines={1}>{displayName}</Text>
                {dealer.is_verified && (
                  <VerifiedIcon size={18} />
                )}
              </View>
              <Text style={s.dealerType}>Official Dealership</Text>
              {dealer.avg_rating > 0 && (
                <View style={s.ratingRow}>
                  <Ionicons name="star" size={14} color={ORANGE} />
                  <Text style={s.ratingTxt}>{dealer.avg_rating.toFixed(1)} ({dealer.review_count}+ Reviews)</Text>
                </View>
              )}
            </View>
            <View style={s.actionIcons}>
              <View style={{ flexDirection: 'row', gap: 14, marginBottom: 8 }}>
                <Ionicons name="share-social-outline" size={20} color={C.textSecondary} />
                <Ionicons name="heart-outline" size={20} color={C.textSecondary} />
              </View>
              <TouchableOpacity style={s.followBtn} onPress={toggleFollow} disabled={followLoading}>
                {followLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.followBtnTxt}>{following ? 'Following' : 'Follow'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Stats Bar ── */}
          <View style={[s.glassCard, s.statsBar]}>
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

            <View style={s.statItem}>
              <Ionicons name="car-outline" size={16} color={ORANGE} />
              <Text style={s.statNum}>{dealer.vehicle_count}+</Text>
              <Text style={s.statLabel}>Vehicles</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Ionicons name="people-outline" size={16} color={ORANGE} />
              <Text style={s.statNum}>{dealer.follower_count}+</Text>
              <Text style={s.statLabel}>Customers</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Ionicons name="time-outline" size={16} color={ORANGE} />
              <Text style={s.statNum}>{memberYear ? `Since ${memberYear}` : '—'}</Text>
              <Text style={s.statLabel}>Established</Text>
            </View>
          </View>

          {/* ── About ── */}
          {dealer.bio ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>About Dealership</Text>
              <Text style={s.aboutTxt}>{dealer.bio}</Text>
            </View>
          ) : null}

          {/* ── Info Tiles: Location / Contact / Hours ── */}
          <View style={[s.glassCard, s.infoTilesRow]}>
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

            <InfoTile
              icon="location-outline"
              label="Location"
              value={dealer.location || dealer.city || 'Not specified'}
            />
            <View style={s.statDivider} />
            <InfoTile
              icon="call-outline"
              label="Contact"
              value={[dealer.phone, dealer.email].filter(Boolean).join('\n') || 'Not available'}
            />
            <View style={s.statDivider} />
            <InfoTile
              icon="time-outline"
              label="Working hours"
              value={dealer.working_hours || 'Mon–Sat\n9AM – 7PM'}
            />
          </View>

          {/* ── Vehicle Inventory ── */}
          {vehicles.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Available Vehicles</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/buy/search-results', params: { seller_id: id } } as any)}>
                  <Text style={s.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                data={vehicles}
                keyExtractor={v => v.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.vehicleCard}
                    onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: item.id } })}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    {item.images?.[0] ? (
                      <Image source={{ uri: item.images[0] }} style={s.vehicleImg} resizeMode="cover" />
                    ) : (
                      <View style={s.vehicleImgFallback}>
                        <Ionicons name="car" size={28} color={C.textSecondary} />
                      </View>
                    )}
                    <View style={{ padding: 10 }}>
                      <Text style={s.vehicleTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={s.vehiclePrice}>PKR {Number(item.price).toLocaleString()}</Text>
                      <Text style={s.vehicleMeta}>{item.year} • {item.condition}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* ── Reviews ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Reviews & Ratings</Text>

            {reviews.length > 0 ? (
              <>
                {/* Rating summary */}
                <View style={[s.glassCard, s.ratingSummary]}>
                  <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

                  {/* Bar chart */}
                  <View style={{ flex: 1 }}>
                    {[5, 4, 3, 2, 1].map((star, idx) => (
                      <RatingBar key={star} star={star} fill={ratingBars[star - 1]} />
                    ))}
                  </View>

                  {/* Score */}
                  <View style={s.scoreBox}>
                    <Text style={s.scoreNum}>{dealer.avg_rating.toFixed(1)}</Text>
                    <View style={{ flexDirection: 'row', gap: 2, marginBottom: 4 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <Ionicons key={i} name="star" size={12} color={ORANGE} />
                      ))}
                    </View>
                    <Text style={s.scoreCount}>{dealer.review_count} Reviews</Text>
                  </View>
                </View>

                {/* Review list */}
                {visibleReviews.map(r => (
                  <ReviewCard key={r.id} review={r} />
                ))}

                {reviews.length > 3 && (
                  <TouchableOpacity onPress={() => setShowAllReviews(v => !v)} style={s.seeMoreBtn}>
                    <Text style={s.seeAll}>{showAllReviews ? 'Show Less' : `See All ${reviews.length} Reviews`}</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={s.emptyReviews}>
                <Ionicons name="star-outline" size={32} color={C.textSecondary} />
                <Text style={s.emptyTxt}>No reviews yet</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Fixed Bottom CTAs ── */}
      <View style={s.bottomBar}>
        <LinearGradient
          colors={['rgba(1,10,31,0)', 'rgba(1,10,31,0.95)', '#010A1F']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          pointerEvents="none"
        />
        <View style={s.bottomBtns}>
          {/* Call Dealer */}
          <TouchableOpacity style={s.callBtn} onPress={handleCall} activeOpacity={0.85}>
            <LinearGradient
              colors={[BLUE, ORANGE]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons name="call-outline" size={20} color="#fff" />
            <Text style={s.callBtnTxt}>Call Dealer</Text>
          </TouchableOpacity>

          {/* Chat */}
          <TouchableOpacity
            style={[s.chatBtn]}
            onPress={handleChat}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <Ionicons name="chatbubble-outline" size={20} color={C.textPrimary} />
            <Text style={s.chatBtnTxt}>Chat</Text>
          </TouchableOpacity>
        </View>

        {/* View Available Cars */}
        <TouchableOpacity
          style={s.viewCarsBtn}
          onPress={() => router.push({ pathname: '/buy/search-results', params: { seller_id: id } } as any)}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <Ionicons name="car-outline" size={20} color={C.textPrimary} />
          <Text style={s.viewCarsTxt}>View Available Cars</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  center:    { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  emptyTxt:  { fontSize: 14, fontFamily: 'Poppins_400Regular', color: C.textSecondary },
  backFallback: { marginTop: 16, padding: 12 },

  // Cover
  coverWrap: { width: SCREEN_W, height: COVER_H + 40, position: 'relative' },
  cover:     { width: SCREEN_W, height: COVER_H, alignItems: 'center', justifyContent: 'center' },
  navRow:    { position: 'absolute', top: 48, left: 0, right: 0, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  navLogo:   { width: 110, height: 20 },
  avatarWrap:{ position: 'absolute', bottom: 0, left: 16 },
  avatar:    { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: ORANGE },
  avatarFallback: { backgroundColor: '#1a4a8a', alignItems: 'center', justifyContent: 'center' },
  avatarInitials:  { fontSize: 24, fontFamily: 'Poppins_700Bold', color: '#fff' },

  // Info
  infoSection: { paddingHorizontal: 16, paddingTop: 8, gap: 16 },

  nameRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingLeft: 90 },
  dealerName:  { fontSize: 16, fontFamily: 'Poppins_700Bold', color: C.textPrimary, flexShrink: 1 },
  dealerType:  { fontSize: 11, fontFamily: 'Poppins_500Medium', color: ORANGE, marginTop: 2 },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingTxt:   { fontSize: 11, fontFamily: 'Poppins_400Regular', color: C.textSecondary },
  actionIcons: { alignItems: 'flex-end' },
  followBtn:   { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 18, backgroundColor: BLUE, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', minWidth: 80, alignItems: 'center' },
  followBtnTxt:{ fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  // Glass card base
  glassCard: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: C.glassBg, overflow: 'hidden' },

  // Stats bar
  statsBar:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8 },
  statItem:  { flex: 1, alignItems: 'center', gap: 3 },
  statNum:   { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  statLabel: { fontSize: 9, fontFamily: 'Poppins_400Regular', color: C.textSecondary },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Section
  section:      { gap: 10 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  seeAll:       { fontSize: 12, fontFamily: 'Poppins_500Medium', color: ORANGE },
  seeMoreBtn:   { alignItems: 'flex-end', paddingTop: 4 },
  aboutTxt:     { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary, lineHeight: 20 },

  // Info tiles
  infoTilesRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 8 },

  // Vehicles
  vehicleCard:        { width: 168, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: C.glassBg, overflow: 'hidden' },
  vehicleImg:         { width: 168, height: 110 },
  vehicleImgFallback: { width: 168, height: 110, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(3,12,40,0.8)' },
  vehicleTitle:       { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  vehiclePrice:       { fontSize: 13, fontFamily: 'Poppins_700Bold', color: ORANGE },
  vehicleMeta:        { fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.textSecondary },

  // Rating summary
  ratingSummary: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 14 },
  scoreBox:      { alignItems: 'center' },
  scoreNum:      { fontSize: 40, fontFamily: 'Poppins_700Bold', color: C.textPrimary, lineHeight: 44 },
  scoreCount:    { fontSize: 11, fontFamily: 'Poppins_400Regular', color: C.textSecondary },

  // Empty reviews
  emptyReviews: { alignItems: 'center', paddingVertical: 24, gap: 8 },

  // Bottom bar
  bottomBar:  { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 32, paddingTop: 40, gap: 10 },
  bottomBtns: { flexDirection: 'row', gap: 10 },

  callBtn:    { flex: 1, height: 48, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)' },
  callBtnTxt: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  chatBtn:    { flex: 1, height: 48, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: C.glassBg },
  chatBtnTxt: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },

  viewCarsBtn:  { height: 48, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: C.glassBg },
  viewCarsTxt:  { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
});
