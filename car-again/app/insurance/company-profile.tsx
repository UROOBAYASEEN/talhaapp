import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, ActivityIndicator, Modal, TextInput, Alert, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { AppColors, useAppColors } from "@/constants/theme";

const { width } = Dimensions.get("window");

const ORANGE        = "#e2671b";
const BG            = "#010a1f";
const CARD          = "#020d24";
const LIGHT_CARD    = "#061b4a";
const TEXT_SEC      = "#baacb6";
const WHITE         = "#f9fafc";
const BORDER        = "#1a3a6a";

const BASE_URL = API_BASE.replace('/api/v1', '');

export default function CompanyProfileScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();
  const { id, company, rating: ratingParam } = useLocalSearchParams<{ id: string; company: string; rating: string }>();

  const [profile,     setProfile]     = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [showReviews, setShowReviews] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [starPick,    setStarPick]    = useState(5);
  const [comment,     setComment]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => { if (id) loadProfile(); }, [id]);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sellers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setProfile(await res.json());
    } catch { /* offline */ }
    finally { setLoading(false); }
  }

  async function submitReview() {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/sellers/${id}/reviews`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ rating: starPick, comment }),
      });
      setComment('');
      setStarPick(5);
      setShowAddReview(false);
      await loadProfile();
    } catch { /* offline */ }
    finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>
        <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomColor: aC.isDark ? "rgba(255,255,255,0.08)" : "rgba(3,42,105,0.08)" }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={27} color={aC.isDark ? "#fff" : "#010a1f"} />
          </TouchableOpacity>
          <Text style={[styles.logoText, { color: aC.isDark ? WHITE : '#010a1f' }]}>Auto<Text style={styles.logoOrange}>wizor</Text></Text>
          <View style={{ width: 27 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: aC.bg }}>
          <ActivityIndicator color={ORANGE} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const name         = profile?.full_name     || company   || '—';
  const bio          = profile?.bio           || 'Insurance provider on Autowizor.';
  const city         = profile?.city          || '—';
  const phone        = profile?.phone         || '—';
  const email        = profile?.email         || '—';
  const workingHours = profile?.working_hours || 'Mon–Sat  9:00 AM – 7:00 PM';
  const avgRating    = profile?.avg_rating    ?? parseFloat(ratingParam || '0') ?? 0;
  const reviewCount  = profile?.review_count  ?? 0;
  const breakdown    = profile?.rating_breakdown ?? {};
  const reviews      = profile?.reviews       ?? [];
  const followers    = profile?.follower_count ?? 0;
  const listings     = profile?.listing_count  ?? 0;
  const customers    = profile?.customers      ?? 0;
  const estYear      = profile?.established_year;
  const yearsAgo     = estYear ? `${new Date().getFullYear() - estYear}+ Years` : '—';
  const coverUrl     = profile?.cover_url && !profile.cover_url.startsWith('http')
    ? `${BASE_URL}${profile.cover_url}` : profile?.cover_url;
  const avatarUrl    = profile?.avatar_url && !profile.avatar_url.startsWith('http')
    ? `${BASE_URL}${profile.avatar_url}` : profile?.avatar_url;
  const initials     = name.slice(0, 2).toUpperCase();

  const maxBar = Math.max(...Object.values(breakdown as Record<string, number>), 1);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]} edges={['top']}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />
      <View style={[styles.container, { backgroundColor: aC.bg }]}>

        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomColor: aC.isDark ? "rgba(255,255,255,0.08)" : "rgba(3,42,105,0.08)" }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={27} color={aC.isDark ? "#fff" : "#010a1f"} />
          </TouchableOpacity>
          <Text style={[styles.logoText, { color: aC.isDark ? WHITE : '#010a1f' }]}>Auto<Text style={styles.logoOrange}>wizor</Text></Text>
          <View style={{ width: 27 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { backgroundColor: aC.bg }]} style={{ backgroundColor: aC.bg }}>

          {/* COVER */}
          <View style={styles.coverContainer}>
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
            ) : (
              <LinearGradient colors={aC.isDark ? ['#032a69', '#010a1f'] : ['#e0e7ff', '#f8fafc']} style={styles.coverImage} />
            )}

            {/* Logo */}
            <View style={styles.companyLogoWrapper}>
              <View style={[styles.companyLogo, { backgroundColor: aC.isDark ? CARD : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} resizeMode="cover" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={28} color={ORANGE} />
                    <Text style={styles.logoSmallText}>{initials}</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* COMPANY INFO */}
          <View style={[styles.companyInfo, { backgroundColor: aC.bg }]}>
            <View style={styles.companyTitleRow}>
              <View>
                <View style={styles.nameRow}>
                  <Text style={[styles.companyName, { color: aC.isDark ? WHITE : '#010a1f' }]}>{name}</Text>
                  {profile?.is_verified && (
                    <Ionicons name="checkmark-circle" size={16} color="#168DE2" style={{ marginLeft: 7 }} />
                  )}
                </View>
                <Text style={[styles.companyCategory, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>Insurance Provider</Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="star" size={13} color={ORANGE} />
              <Text style={[styles.locationText, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{avgRating.toFixed(1)} ({reviewCount} Reviews)</Text>
              {city && city !== '—' && (
                <>
                  <Ionicons name="location-outline" size={15} color={ORANGE} style={{ marginLeft: 15 }} />
                  <Text style={[styles.locationText, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{city}</Text>
                </>
              )}
            </View>
          </View>

          {/* STATS */}
          <View style={[styles.statsContainer, { borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)', backgroundColor: aC.bg }]}>
            <Stat icon="shield-checkmark-outline" value={String(listings || '—')} label="POLICIES" />
            <Stat icon="people-outline"           value={String(followers || '—')} label="FOLLOWERS" />
            <Stat icon="star-outline"             value={avgRating.toFixed(1)}    label="RATING" />
            <Stat icon="ribbon-outline"           value={String(customers || '—')} label="CUSTOMERS" />
          </View>

          {/* ABOUT */}
          <SectionTitle title="About" />
          <Text style={[styles.aboutText, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{bio}</Text>

          <View style={styles.contactInfoRow}>
            <ContactItem icon="location-outline" title="Location" line1={city !== '—' ? city : '—'} line2="Pakistan" />
            <ContactItem icon="call-outline"     title="Contact"  line1={phone} line2={email} />
            <ContactItem icon="time-outline"     title="Working Hours" line1={workingHours.split(/\s{2,}/)[0] || workingHours} line2={workingHours.split(/\s{2,}/)[1] || ''} />
          </View>

          {/* ACHIEVEMENT */}
          <SectionTitle title="Achievement" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <Achievement icon="star"    title="Top Rated"    subtitle={`${avgRating.toFixed(1)} Star Rating`} />
            <Achievement icon="ribbon"  title="Premium"      subtitle={estYear ? `Since ${estYear}` : 'Verified'} />
            <Achievement icon="trophy"  title="Trusted"      subtitle="Verified Partner" />
          </ScrollView>

          {/* INFO GRID */}
          <SectionTitle title={`About ${name}`} />
          <View style={styles.aboutGrid}>
            <InfoCard icon="calendar-outline"  value={yearsAgo}          label="In Business" />
            <InfoCard icon="people-outline"    value={`${followers}+`}   label="Followers" />
            <InfoCard icon="shield-outline"    value={`${listings}`}     label="Active Listings" />
            <InfoCard icon="handshake-outline" value={`${customers}+`}   label="Customers" />
          </View>

          {/* RATING */}
          <View style={[styles.ratingCard, { backgroundColor: aC.isDark ? CARD : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
            {aC.isDark ? null : (
              <>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              </>
            )}
            <View style={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map(n => {
                const count = breakdown[String(n)] ?? 0;
                const barW  = reviewCount ? Math.round((count / Math.max(maxBar, 1)) * 145) : 0;
                return <RatingBar key={n} number={String(n)} width={barW} />;
              })}
            </View>
            <View style={styles.ratingScore}>
              <Text style={[styles.score, { color: aC.isDark ? WHITE : '#010a1f' }]}>{avgRating.toFixed(1)}</Text>
              <View style={styles.stars}>
                {[1,2,3,4,5].map(i => (
                  <Ionicons key={i} name="star" size={13} color={i <= Math.round(avgRating) ? ORANGE : (aC.isDark ? '#8995AA' : '#cbd5e1')} />
                ))}
              </View>
              <Text style={[styles.reviewCount, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{reviewCount} Reviews</Text>
            </View>
          </View>

          {/* REVIEWS */}
          {reviews.slice(0, 2).map((r: any) => (
            <ReviewCard key={r.id} name={r.name} text={r.comment} rating={r.rating} date={r.date} />
          ))}
          {reviews.length === 0 && (
            <Text style={{ color: aC.isDark ? TEXT_SEC : '#475569', fontSize: 12, fontFamily: 'Poppins_400Regular', marginHorizontal: 20, marginTop: 8 }}>
              No reviews yet.
            </Text>
          )}

          <View style={styles.reviewActions}>
            {reviews.length > 2 && (
              <TouchableOpacity onPress={() => setShowReviews(true)}>
                <Text style={styles.seeMoreText}>See More</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setShowAddReview(true)}>
              <Text style={[styles.seeMoreText, { color: aC.isDark ? '#60a5fa' : '#032a69' }]}>+ Add Review</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* BOTTOM BUTTON */}
        <View style={[styles.bottomButtonContainer, { backgroundColor: aC.isDark ? BG : '#ffffff', borderTopColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 8 }]}>
          <TouchableOpacity
            style={styles.contactButton}
            activeOpacity={0.85}
            onPress={async () => {
              if (!token) { Alert.alert('Login Required', 'Please login to chat.'); return; }
              if (!id) return;
              try {
                const res = await fetch(`${API_BASE}/chat/send`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ to_user_id: id, content: `Hello ${name}, I'm interested in your insurance plan.`, message_type: 'text' }),
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                  const convId = data.conversation_id || data.conversationId;
                  if (convId) {
                    router.push({ pathname: '/chat-room/[id]' as any, params: { id: String(convId), name, otherId: String(id) } });
                  } else {
                    try {
                      const cr = await fetch(`${API_BASE}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } });
                      if (cr.ok) {
                        const d = await cr.json();
                        const found = (d.items || []).find((c: any) => c.participants?.includes(String(id)));
                        if (found) router.push({ pathname: '/chat-room/[id]' as any, params: { id: String(found.id), name, otherId: String(id) } });
                        else router.push({ pathname: '/(tabs)/chat' as any });
                      } else router.push({ pathname: '/(tabs)/chat' as any });
                    } catch { router.push({ pathname: '/(tabs)/chat' as any }); }
                  }
                } else if (res.status === 404) {
                  Alert.alert('Not found', data.detail || 'Company not found');
                } else {
                  router.push({ pathname: '/(tabs)/chat' as any });
                }
              } catch {
                router.push({ pathname: '/(tabs)/chat' as any });
              }
            }}
          >
            <LinearGradient colors={["#032a69", "#e2671b"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={styles.contactButtonText}>Contact Company</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* ALL REVIEWS MODAL */}
      <Modal visible={showReviews} transparent animationType="slide" onRequestClose={() => setShowReviews(false)}>
        <View style={modal.overlay}>
          <View style={[modal.sheet, { backgroundColor: aC.isDark ? '#020d24' : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', borderWidth: aC.isDark ? 0 : 1, shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.12, elevation: aC.isDark ? 0 : 8 }]}>
            <View style={modal.sheetHeader}>
              <Text style={[modal.sheetTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>All Reviews</Text>
              <TouchableOpacity onPress={() => setShowReviews(false)}>
                <Ionicons name="close" size={22} color={aC.isDark ? WHITE : '#010a1f'} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {reviews.map((r: any) => (
                <ReviewCard key={r.id} name={r.name} text={r.comment} rating={r.rating} date={r.date} />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ADD REVIEW MODAL */}
      <Modal visible={showAddReview} transparent animationType="fade" onRequestClose={() => setShowAddReview(false)}>
        <View style={modal.overlay}>
          <View style={[modal.card, { backgroundColor: aC.isDark ? '#020d24' : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.12, elevation: aC.isDark ? 0 : 8 }]}>
            <View style={modal.cardHeader}>
              <Text style={[modal.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Add Review</Text>
              <TouchableOpacity onPress={() => setShowAddReview(false)}>
                <Ionicons name="close" size={22} color={aC.isDark ? WHITE : '#010a1f'} />
              </TouchableOpacity>
            </View>
            <View style={modal.starRow}>
              {[1,2,3,4,5].map(i => (
                <TouchableOpacity key={i} onPress={() => setStarPick(i)}>
                  <Ionicons name="star" size={28} color={i <= starPick ? ORANGE : (aC.isDark ? '#8995AA' : '#cbd5e1')} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[modal.input, { borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', color: aC.isDark ? WHITE : '#010a1f', backgroundColor: aC.isDark ? 'transparent' : '#f8fafc' }]}
              placeholder="Write your review..."
              placeholderTextColor={aC.isDark ? "#6b7280" : "#94a3b8"}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity style={modal.submitBtn} onPress={submitReview} disabled={submitting} activeOpacity={0.85}>
              <LinearGradient colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
              <Text style={modal.submitTxt}>{submitting ? 'Submitting...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function Stat({ icon, value, label }: { icon: any; value: string; label: string }) {
  const aC = useAppColors();
  return (
    <View style={[styles.statItem, { borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]}>
      <Ionicons name={icon} size={22} color={ORANGE} />
      <Text style={[styles.statValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  const aC = useAppColors();
  return <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>{title}</Text>;
}

function ContactItem({ icon, title, line1, line2 }: { icon: any; title: string; line1: string; line2: string }) {
  const aC = useAppColors();
  return (
    <View style={styles.contactItem}>
      <View style={styles.contactTitleRow}>
        <Ionicons name={icon} size={17} color={ORANGE} />
        <Text style={[styles.contactTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>{title}</Text>
      </View>
      <Text style={[styles.contactText, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{line1}</Text>
      {!!line2 && <Text style={[styles.contactText, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{line2}</Text>}
    </View>
  );
}

function Achievement({ icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  const aC = useAppColors();
  return (
    <View style={[styles.achievementCard, { backgroundColor: aC.isDark ? CARD : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
      {aC.isDark ? null : (
        <>
          <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      )}
      <View style={styles.achievementIcon}>
        <Ionicons name={icon} size={19} color="#fff" />
      </View>
      <View>
        <Text style={[styles.achievementTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>{title}</Text>
        <Text style={[styles.achievementSubtitle, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

function InfoCard({ icon, value, label }: { icon: any; value: string; label: string }) {
  const aC = useAppColors();
  return (
    <View style={[styles.infoCard, { backgroundColor: aC.isDark ? LIGHT_CARD : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
      {aC.isDark ? null : (
        <>
          <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      )}
      <Ionicons name={icon} size={22} color={ORANGE} />
      <View style={{ marginLeft: 13 }}>
        <Text style={[styles.infoValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>{value}</Text>
        <Text style={[styles.infoLabel, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{label}</Text>
      </View>
    </View>
  );
}

function RatingBar({ number, width: w }: { number: string; width: number }) {
  const aC = useAppColors();
  return (
    <View style={styles.ratingRow}>
      <Text style={[styles.ratingNumber, { color: aC.isDark ? WHITE : '#010a1f' }]}>{number}</Text>
      <Ionicons name="star" size={11} color={ORANGE} />
      <View style={[styles.barBackground, { backgroundColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]}>
        <View style={[styles.barFill, { width: w }]} />
      </View>
    </View>
  );
}

function ReviewCard({ name, text, rating, date }: { name: string; text: string; rating: number; date?: string }) {
  const aC = useAppColors();
  return (
    <View style={[styles.reviewContainer, { borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]}>
      <View style={[styles.avatar, { backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' }}>{(name || 'U').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.reviewContent}>
        <View style={styles.reviewTopRow}>
          <View>
            <Text style={[styles.reviewerName, { color: aC.isDark ? WHITE : '#010a1f' }]}>{name}</Text>
            <View style={styles.reviewStars}>
              {[1,2,3,4,5].map(i => (
                <Ionicons key={i} name="star" size={12} color={i <= Math.round(rating) ? ORANGE : (aC.isDark ? '#8995AA' : '#cbd5e1')} />
              ))}
              {date && <Text style={[styles.reviewTime, { color: aC.isDark ? TEXT_SEC : '#64748b' }]}>{date}</Text>}
            </View>
          </View>
        </View>
        {!!text && <Text numberOfLines={3} style={[styles.reviewText, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{text}</Text>}
      </View>
    </View>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const modal = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#020d24', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  sheetHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { color: WHITE, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  card:       { margin: 20, backgroundColor: '#020d24', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle:  { color: WHITE, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  starRow:    { flexDirection: 'row', gap: 10, marginBottom: 16 },
  input:      { borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12, color: WHITE, fontSize: 13, fontFamily: 'Poppins_400Regular', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  submitBtn:  { height: 48, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  submitTxt:  { color: WHITE, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },

  header: {
    height: 56, paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  logoText:   { color: WHITE, fontSize: 18, fontFamily: "Poppins_700Bold" },
  logoOrange: { color: ORANGE },

  scrollContent: { paddingBottom: 100 },

  coverContainer: { height: 200, position: "relative" },
  coverImage:     { width: "100%", height: "100%" },

  companyLogoWrapper: { position: "absolute", left: 20, bottom: -34, width: 80, height: 80 },
  companyLogo: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: CARD, borderWidth: 2, borderColor: BORDER,
    justifyContent: "center", alignItems: "center", overflow: "hidden",
  },
  logoSmallText: { color: ORANGE, fontSize: 11, fontFamily: "Poppins_700Bold", marginTop: 2 },

  companyInfo:     { paddingHorizontal: 20, paddingTop: 42 },
  companyTitleRow: { flexDirection: "row", justifyContent: "space-between" },
  nameRow:         { flexDirection: "row", alignItems: "center" },
  companyName:     { color: WHITE, fontSize: 16, fontFamily: "Poppins_600SemiBold" },
  companyCategory: { color: TEXT_SEC, fontSize: 12, fontFamily: "Poppins_400Regular", marginTop: 2 },
  locationRow:     { flexDirection: "row", alignItems: "center", marginTop: 8 },
  locationText:    { color: TEXT_SEC, fontSize: 12, fontFamily: "Poppins_400Regular", marginLeft: 4 },

  statsContainer: {
    marginTop: 20, marginHorizontal: 20, flexDirection: "row",
    borderBottomWidth: 0.5, borderColor: BORDER, paddingBottom: 14,
  },
  statItem:  { flex: 1, alignItems: "center", borderRightWidth: 0.5, borderColor: BORDER },
  statValue: { color: WHITE, fontSize: 14, fontFamily: "Poppins_700Bold", marginTop: 4 },
  statLabel: { color: TEXT_SEC, fontSize: 10, fontFamily: "Poppins_400Regular", marginTop: 2 },

  sectionTitle: {
    color: WHITE, fontSize: 16, fontFamily: "Poppins_600SemiBold",
    marginHorizontal: 20, marginTop: 22, marginBottom: 10,
  },
  aboutText: {
    color: TEXT_SEC, fontSize: 13, fontFamily: "Poppins_400Regular",
    lineHeight: 22, marginHorizontal: 20,
  },

  contactInfoRow:  { flexDirection: "row", marginHorizontal: 20, marginTop: 18 },
  contactItem:     { flex: 1 },
  contactTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  contactTitle:    { color: WHITE, fontSize: 12, fontFamily: "Poppins_500Medium", marginLeft: 6 },
  contactText:     { color: TEXT_SEC, fontSize: 11, fontFamily: "Poppins_400Regular", lineHeight: 16 },

  horizontalScroll: { paddingLeft: 20 },
  achievementCard: {
    width: 160, height: 62, borderRadius: 12,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    marginRight: 10, paddingHorizontal: 14,
    flexDirection: "row", alignItems: "center",
  },
  achievementIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(226,103,27,0.15)",
    justifyContent: "center", alignItems: "center", marginRight: 10,
  },
  achievementTitle:    { color: WHITE, fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  achievementSubtitle: { color: TEXT_SEC, fontSize: 10, fontFamily: "Poppins_400Regular", marginTop: 2 },

  aboutGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 10 },
  infoCard: {
    width: (width - 50) / 2, height: 76, borderRadius: 14,
    backgroundColor: LIGHT_CARD, borderWidth: 1, borderColor: BORDER,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 14,
  },
  infoValue: { color: WHITE, fontSize: 14, fontFamily: "Poppins_700Bold" },
  infoLabel: { color: TEXT_SEC, fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 2 },

  ratingCard: {
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: CARD, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    minHeight: 130, padding: 14, flexDirection: "row",
  },
  ratingBars:   { flex: 1, justifyContent: "center" },
  ratingRow:    { flexDirection: "row", alignItems: "center", marginVertical: 3 },
  ratingNumber: { color: WHITE, width: 14, fontSize: 11, fontFamily: "Poppins_400Regular" },
  barBackground:{ height: 5, width: 140, backgroundColor: BORDER, borderRadius: 5, marginLeft: 6 },
  barFill:      { height: 5, backgroundColor: ORANGE, borderRadius: 5 },
  ratingScore:  { width: 100, justifyContent: "center", alignItems: "center" },
  score:        { color: WHITE, fontSize: 42, fontFamily: "Poppins_700Bold" },
  stars:        { flexDirection: "row", gap: 4, marginTop: 2 },
  reviewCount:  { color: TEXT_SEC, fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 8 },

  reviewContainer: {
    marginHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderColor: BORDER, flexDirection: "row",
  },
  avatar:        { width: 40, height: 40, borderRadius: 20 },
  reviewContent: { flex: 1, marginLeft: 10 },
  reviewTopRow:  { flexDirection: "row", justifyContent: "space-between" },
  reviewerName:  { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  reviewStars:   { flexDirection: "row", alignItems: "center", marginTop: 3, gap: 2 },
  reviewTime:    { color: TEXT_SEC, fontSize: 10, fontFamily: "Poppins_400Regular", marginLeft: 4 },
  reviewText:    { color: TEXT_SEC, fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 18, marginTop: 6 },

  reviewActions: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 8 },
  seeMoreText:   { color: ORANGE, fontSize: 12, fontFamily: "Poppins_500Medium", textDecorationLine: "underline" },

  bottomButtonContainer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 16, paddingTop: 10,
    backgroundColor: BG, borderTopWidth: 0.5, borderTopColor: BORDER,
  },
  contactButton:     { height: 52, borderRadius: 32, overflow: "hidden" },
  contactButtonText: { color: WHITE, fontSize: 16, fontFamily: "Poppins_600SemiBold" },
});
