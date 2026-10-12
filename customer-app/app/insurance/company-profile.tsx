import VerifiedIcon from '@/components/shared/VerifiedIcon';
import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, ActivityIndicator, Modal, TextInput, Alert, StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { AppColors, useAppColors } from "@/constants/theme";
import { PRIMARY_BTN_COLORS, RingGlow } from "@/components/shared/FigmaEffects";
import { DUMMY_REVIEWS } from "@/constants/dummyReviews";

import SheetModal from '@/components/shared/SheetModal';
// Dummy office photos until the company uploads its own
const DUMMY_OFFICES = [
  require("@/assets/images/office.png"),
  require("@/assets/images/Office 2.png"),
  require("@/assets/images/Office3.png"),
];

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
  const insets = useSafeAreaInsets();
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
  const tagline      = profile?.tagline || profile?.company_type || 'Premier General Insurance Company';
  const enquiries    = profile?.enquiry_count ?? profile?.enquiries;
  const renewal      = profile?.renewal_rate;
  const teamMembers  = profile?.team_members ?? profile?.team_size;
  const branches     = profile?.branch_count ?? profile?.branches;
  const officePhotos: string[] = (profile?.office_photos || profile?.gallery || []).map((u: string) => (u && !u.startsWith('http') ? `${BASE_URL}${u}` : u));
  const fmtCount = (n: any) => {
    const v = Number(n);
    if (!n && n !== 0) return '—';
    if (v >= 1000) return `${Number((v / 1000).toFixed(1))}K`;
    return String(v);
  };

  const maxBar = Math.max(...Object.values(breakdown as Record<string, number>), 1);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]} edges={['top']}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />
      <View style={[styles.container, { backgroundColor: aC.bg }]}>

        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 84 }}>
            <Ionicons name="chevron-back" size={27} color={aC.isDark ? "#fff" : "#010a1f"} />
          </TouchableOpacity>
          <Text style={[styles.logoText, { color: aC.isDark ? WHITE : '#010a1f' }]}>Auto<Text style={styles.logoOrange}>wizor</Text></Text>
          <View style={styles.headerIcons}>
            <Ionicons name="eye-outline" size={22} color={ORANGE} />
            <Ionicons name="notifications-outline" size={21} color={aC.isDark ? WHITE : '#010a1f'} />
            <Ionicons name="settings-outline" size={21} color={aC.isDark ? WHITE : '#010a1f'} />
          </View>
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
              <View style={styles.companyLogo}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={28} color={ORANGE} />
                    <Text style={styles.logoSmallText}>{initials}</Text>
                  </>
                )}
              </View>
              <View style={styles.logoBadge}><Ionicons name="create-outline" size={13} color="#fff" /></View>
            </View>
          </View>

          {/* COMPANY INFO */}
          <View style={[styles.companyInfo, { backgroundColor: aC.bg }]}>
            <View style={styles.companyTitleRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.companyName, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={1}>{name}</Text>
                  <VerifiedIcon size={17} style={{ marginLeft: 7 }} />
                </View>
                <Text style={[styles.companyCategory, { color: aC.isDark ? TEXT_SEC : '#475569' }]} numberOfLines={1}>{tagline}</Text>
              </View>
              <Ionicons name="ellipsis-vertical" size={20} color={ORANGE} />
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="star" size={13} color={ORANGE} />
              <Text style={[styles.locationText, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{avgRating.toFixed(1)} ({fmtCount(reviewCount)} Reviews)</Text>
              {city && city !== '—' && (
                <>
                  <Ionicons name="location-outline" size={15} color={ORANGE} style={{ marginLeft: 16 }} />
                  <Text style={[styles.locationText, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{city}, Pakistan</Text>
                </>
              )}
            </View>
          </View>

          {/* STATS */}
          <View style={styles.statsContainer}>
            <Stat icon="shield-search"          value={fmtCount(listings)}   label="POLICIES" />
            <Stat icon="chat-processing-outline" value={fmtCount(enquiries)} label="ENQUIRIES" />
            <Stat icon="account-group-outline"  value={fmtCount(customers)}  label="CUSTOMERS" />
            <Stat icon="medal-outline"          value={renewal != null ? `${renewal}%` : '—'} label="RENEWAL" last />
          </View>

          {/* ABOUT */}
          <SectionTitle title="About" />
          <Text style={[styles.aboutText, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{bio}</Text>

          <View style={styles.contactInfoRow}>
            <ContactItem icon="location-outline" title="Location" line1={city !== '—' ? city : '—'} line2="Pakistan" />
            <ContactItem icon="call-outline"     title="Contact"  line1={phone} line2={email} />
            <ContactItem icon="time-outline"     title="Working hour" line1={workingHours.split(/\s{2,}/)[0] || workingHours} line2={workingHours.split(/\s{2,}/)[1] || ''} />
          </View>

          {/* ACHIEVEMENT */}
          <SectionTitle title="Achievement" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingRight: 20 }}>
            <Achievement icon="star"   title="Top Rated"         subtitle={`${avgRating.toFixed(1)} Star Rating`} />
            <Achievement icon="ribbon" title={"Premium\nPartner"} subtitle={estYear ? `Since ${estYear}` : 'Verified'} />
            <Achievement icon="trophy" title="Trusted"           subtitle="Verified Partner" />
          </ScrollView>

          {/* INFO GRID */}
          <Text style={[styles.sectionTitleBold, { color: aC.isDark ? WHITE : '#010a1f' }]}>About {name}</Text>
          <View style={styles.aboutGrid}>
            <InfoCard icon="calendar-month-outline" value={yearsAgo} label="In Business" />
            <InfoCard icon="account-group"          value={teamMembers ? `${Number(teamMembers).toLocaleString()}+` : '—'} label="Team Members" />
            <InfoCard icon="office-building"        value={branches != null ? String(branches) : '—'} label="Branch Network" />
            <InfoCard icon="handshake-outline"      value={customers ? `${fmtCount(customers)}+` : '—'} label="Happy Clients" />
          </View>

          {/* OUR OFFICES */}
          <View style={styles.officesHeader}>
            <Text style={[styles.sectionTitleBold, { marginHorizontal: 0, marginTop: 0, marginBottom: 0, color: aC.isDark ? WHITE : '#010a1f' }]}>Our Offices</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingRight: 20, gap: 12 }}>
            {officePhotos.length
              ? officePhotos.map((u, i) => (
                  u
                    ? <Image key={i} source={{ uri: u }} style={styles.officeImg} resizeMode="cover" />
                    : <Image key={i} source={DUMMY_OFFICES[i % DUMMY_OFFICES.length]} style={styles.officeImg} resizeMode="cover" />
                ))
              : DUMMY_OFFICES.map((src, i) => <Image key={i} source={src} style={styles.officeImg} resizeMode="cover" />)}
          </ScrollView>

          {/* RATING */}
          <View style={[styles.ratingCard, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff', borderWidth: aC.isDark ? 0 : 1, borderColor: 'rgba(3,42,105,0.12)' }]}>
            <View style={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map(n => {
                const count = breakdown[String(n)] ?? 0;
                const barW  = reviewCount ? Math.round((count / Math.max(maxBar, 1)) * 150) : 0;
                return <RatingBar key={n} number={String(n)} width={barW} />;
              })}
            </View>
            <View style={styles.ratingScore}>
              <Text style={[styles.score, { color: aC.isDark ? '#C3BCC8' : '#010a1f' }]}>{avgRating.toFixed(1)}</Text>
              <View style={styles.stars}>
                {[1,2,3,4,5].map(i => (
                  <Ionicons key={i} name="star" size={15} color={i <= Math.round(avgRating) ? ORANGE : '#C3BCC8'} />
                ))}
              </View>
              <Text style={[styles.reviewCount, { color: aC.isDark ? '#C3BCC8' : '#475569' }]}>{reviewCount} Reviews</Text>
            </View>
          </View>

          {/* REVIEWS */}
          {(reviews.length ? reviews : DUMMY_REVIEWS).slice(0, 2).map((r: any, i: number) => (
            <ReviewCard key={r.id} name={r.name} text={r.comment} rating={r.rating} date={r.date} index={i} />
          ))}
          {/* No reviews yet → dummy reviews shown above for now */}

          <View style={styles.reviewActions}>
            <TouchableOpacity onPress={() => setShowAddReview(true)}>
              <Text style={[styles.addReviewText, { color: aC.isDark ? '#60a5fa' : '#032a69' }]}>+ Add Review</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push({ pathname: '/insurance/reviews' as any, params: { id: String(id) } })}>
              <Text style={[styles.seeMoreText, { color: aC.isDark ? WHITE : '#010a1f' }]}>See More</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 + insets.bottom }} />
        </ScrollView>

        {/* BOTTOM BUTTON */}
        <View style={[styles.bottomButtonContainer, { backgroundColor: 'transparent', borderTopWidth: 0, paddingBottom: insets.bottom + 16 }]}>
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
            <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={styles.contactButtonText}>Contact Company</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* ALL REVIEWS MODAL */}
      <SheetModal visible={showReviews} transparent animationType="slide" onRequestClose={() => setShowReviews(false)}>
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
      </SheetModal>

      {/* ADD REVIEW MODAL */}
      <SheetModal visible={showAddReview} transparent animationType="fade" onRequestClose={() => setShowAddReview(false)}>
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
      </SheetModal>
    </SafeAreaView>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function Stat({ icon, value, label, last }: { icon: any; value: string; label: string; last?: boolean }) {
  const aC = useAppColors();
  return (
    <View style={[styles.statItem, !last && { borderRightWidth: 1, borderColor: aC.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(3,42,105,0.08)' }]}>
      <MaterialCommunityIcons name={icon} size={26} color={ORANGE} />
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
        <Ionicons name={icon} size={20} color={ORANGE} />
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
    <View style={[styles.achievementCard, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff', borderWidth: aC.isDark ? 0 : 1, borderColor: 'rgba(3,42,105,0.12)' }]}>
      <View style={styles.achievementIcon}>
        <Ionicons name={icon} size={19} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.achievementTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>{title}</Text>
        <Text style={[styles.achievementSubtitle, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

function InfoCard({ icon, value, label }: { icon: any; value: string; label: string }) {
  const aC = useAppColors();
  return (
    <View style={[styles.infoCard, { backgroundColor: aC.isDark ? '#0A1838' : '#ffffff', borderColor: aC.isDark ? '#7E9FD6' : 'rgba(3,42,105,0.12)' }]}>
      {aC.isDark ? <RingGlow radius={16} /> : (
        <>
          <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      )}
      <MaterialCommunityIcons name={icon} size={24} color={ORANGE} />
      <View style={{ marginLeft: 14, flex: 1 }}>
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
      <Text style={[styles.ratingNumber, { color: aC.isDark ? '#C3BCC8' : '#010a1f' }]}>{number}</Text>
      <Ionicons name="star" size={13} color={ORANGE} />
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: Math.max(w, 6) }]} />
      </View>
    </View>
  );
}

function ReviewCard({ name, text, rating, date, index = 0 }: { name: string; text: string; rating: number; date?: string; index?: number }) {
  const aC = useAppColors();
  return (
    <View style={[styles.reviewContainer, { borderColor: aC.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(3,42,105,0.08)' }]}>
      <View style={styles.reviewTopRow}>
        <View style={[styles.avatar, { backgroundColor: index % 2 === 0 ? ORANGE : '#C3BCC8' }]} />
        <View style={styles.reviewContent}>
          <Text style={[styles.reviewerName, { color: aC.isDark ? '#C9C6D0' : '#010a1f' }]}>{name}</Text>
          <View style={styles.reviewStars}>
            {[1,2,3,4,5].map(i => (
              <Ionicons key={i} name="star" size={15} color={i <= Math.round(rating) ? ORANGE : '#C3BCC8'} />
            ))}
            {date && <Text style={[styles.reviewTime, { color: aC.isDark ? TEXT_SEC : '#64748b' }]}>{date}</Text>}
          </View>
        </View>
        <Ionicons name="ellipsis-vertical" size={18} color={aC.isDark ? '#C9C6D0' : '#64748b'} />
      </View>
      {!!text && <Text numberOfLines={2} style={[styles.reviewText, { color: aC.isDark ? TEXT_SEC : '#475569' }]}>"{text}"</Text>}
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

  header:      { height: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerIcons: { width: 84, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12 },
  logoText:    { color: WHITE, fontSize: 18, fontFamily: "Poppins_700Bold" },
  logoOrange:  { color: ORANGE },

  scrollContent: { paddingBottom: 100 },

  coverContainer: { height: 190, position: "relative", zIndex: 2, elevation: 2 },
  coverImage:     { width: "100%", height: "100%" },

  companyLogoWrapper: { position: "absolute", left: 10, bottom: -40, width: 68, height: 68 },
  companyLogo:   { width: 68, height: 68, borderRadius: 34, backgroundColor: "#ffffff", borderWidth: 1.5, borderColor: "#0B1D4A", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  logoBadge:     { position: "absolute", right: -2, bottom: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: ORANGE, alignItems: "center", justifyContent: "center" },
  logoSmallText: { color: ORANGE, fontSize: 11, fontFamily: "Poppins_700Bold", marginTop: 2 },

  companyInfo:     { paddingLeft: 88, paddingRight: 14, paddingTop: 6 },
  companyTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  nameRow:         { flexDirection: "row", alignItems: "center" },
  companyName:     { fontSize: 17, fontFamily: "Poppins_500Medium", flexShrink: 1 },
  companyCategory: { fontSize: 13, fontFamily: "Poppins_400Regular" },
  locationRow:     { flexDirection: "row", alignItems: "center", marginTop: 4 },
  locationText:    { fontSize: 11.5, fontFamily: "Poppins_400Regular", marginLeft: 4 },

  statsContainer: { marginTop: 22, marginHorizontal: 14, flexDirection: "row" },
  statItem:  { flex: 1, alignItems: "center", paddingVertical: 4 },
  statValue: { fontSize: 16, fontFamily: "Poppins_700Bold", marginTop: 4 },
  statLabel: { fontSize: 9.5, fontFamily: "Poppins_400Regular", marginTop: 1 },

  sectionTitle:     { fontSize: 17, fontFamily: "Poppins_400Regular", marginHorizontal: 14, marginTop: 24, marginBottom: 8 },
  sectionTitleBold: { fontSize: 15, fontFamily: "Poppins_600SemiBold", marginHorizontal: 14, marginTop: 24, marginBottom: 12 },
  aboutText:        { fontSize: 13, fontFamily: "Poppins_400Regular", lineHeight: 24, marginHorizontal: 14 },

  contactInfoRow:  { flexDirection: "row", marginHorizontal: 14, marginTop: 18, gap: 8 },
  contactItem:     { flex: 1 },
  contactTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  contactTitle:    { fontSize: 13.5, fontFamily: "Poppins_400Regular", marginLeft: 8 },
  contactText:     { fontSize: 11, fontFamily: "Poppins_400Regular", lineHeight: 16, marginLeft: 28 },

  horizontalScroll: { paddingLeft: 14 },
  achievementCard:  { width: 172, height: 62, borderRadius: 10, marginRight: 10, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" },
  achievementIcon:  { width: 34, height: 34, borderRadius: 8, backgroundColor: ORANGE, justifyContent: "center", alignItems: "center", marginRight: 12 },
  achievementTitle:    { fontSize: 12.5, fontFamily: "Poppins_600SemiBold", lineHeight: 16 },
  achievementSubtitle: { fontSize: 11.5, fontFamily: "Poppins_400Regular", marginTop: 1 },

  aboutGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 14, gap: 10 },
  infoCard:  { width: (width - 38) / 2, height: 60, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, overflow: "hidden" },
  infoValue: { fontSize: 13.5, fontFamily: "Poppins_600SemiBold" },
  infoLabel: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 1 },

  officesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 14, marginTop: 24, marginBottom: 12 },
  viewAll:       { color: "#6AA6FF", fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  officeImg:     { width: 118, height: 82, borderRadius: 8 },
  officePh:      { backgroundColor: "#0B1D4A", alignItems: "center", justifyContent: "center" },

  ratingCard:   { marginHorizontal: 14, marginTop: 16, borderRadius: 10, minHeight: 130, paddingHorizontal: 12, paddingVertical: 12, flexDirection: "row" },
  ratingBars:   { flex: 1, justifyContent: "center" },
  ratingRow:    { flexDirection: "row", alignItems: "center", marginVertical: 3 },
  ratingNumber: { width: 14, fontSize: 13, fontFamily: "Poppins_400Regular" },
  barBackground:{ height: 5, width: 150, borderRadius: 5, marginLeft: 8 },
  barFill:      { height: 5, backgroundColor: "#C3BCC8", borderRadius: 5 },
  ratingScore:  { width: 110, justifyContent: "center", alignItems: "flex-end" },
  score:        { fontSize: 42, fontFamily: "Poppins_700Bold" },
  stars:        { flexDirection: "row", gap: 5, marginTop: 2 },
  reviewCount:  { fontSize: 13, fontFamily: "Poppins_600SemiBold", marginTop: 8 },

  reviewContainer: { marginHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  avatar:        { width: 40, height: 40, borderRadius: 20 },
  reviewContent: { flex: 1, marginLeft: 12 },
  reviewTopRow:  { flexDirection: "row", alignItems: "center" },
  reviewerName:  { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  reviewStars:   { flexDirection: "row", alignItems: "center", marginTop: 3, gap: 6 },
  reviewTime:    { fontSize: 12, fontFamily: "Poppins_400Regular", marginLeft: 4 },
  reviewText:    { fontSize: 11.5, fontFamily: "Poppins_400Regular", lineHeight: 18, marginTop: 10 },

  reviewActions: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 14, marginTop: 8 },
  addReviewText: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  seeMoreText:   { fontSize: 13, fontFamily: "Poppins_400Regular", textDecorationLine: "underline" },

  bottomButtonContainer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 14, paddingBottom: 16, paddingTop: 10 },
  contactButton:     { height: 50, borderRadius: 26, overflow: "hidden" },
  contactButtonText: { color: "#EDEBF0", fontSize: 17, fontFamily: "Poppins_400Regular" },
});
