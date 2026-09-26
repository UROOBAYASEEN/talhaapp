import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, TextInput,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, MoreVertical, Star } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = AppColors.gradientEnd;
const C      = AppColors;

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

function ReviewItem({ review }: { review: Review }) {
  const initial = (review.reviewer_name || 'U')[0].toUpperCase();
  const colors  = [ORANGE, C.textSecondary, '#4fc3f7', '#a5d6a7', '#ce93d8'];
  const color   = colors[initial.charCodeAt(0) % colors.length];

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <View style={s.review}>
      <View style={[s.avatar, { backgroundColor: color }]}>
        <Text style={s.avatarInitial}>{initial}</Text>
      </View>
      <View style={s.reviewContent}>
        <View style={s.nameRow}>
          <Text style={s.name}>{review.reviewer_name}</Text>
          <MoreVertical size={20} color={C.textSecondary} strokeWidth={2}/>
        </View>
        <View style={s.ratingRow}>
          <View style={s.stars}>
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={13}
                color={i <= review.rating ? ORANGE : 'rgba(255,255,255,0.2)'}
                fill={i <= review.rating ? ORANGE : 'rgba(255,255,255,0.2)'}
                strokeWidth={1.5}
              />
            ))}
          </View>
          <Text style={s.time}>{timeAgo(review.created_at)}</Text>
        </View>
        {review.comment ? (
          <Text style={s.reviewText}>"{review.comment}"</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function TrackerReviewsScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { tracker_id } = useLocalSearchParams<{ tracker_id: string }>();

  const id = tracker_id || '';

  const [reviews,  setReviews]  = useState<Review[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating,   setRating]   = useState(0);
  const [comment,  setComment]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/tracker-providers/${id}/reviews?limit=50`);
      if (res.ok) setReviews(await res.json());
    } catch {
      Alert.alert('Error', 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReviews(); }, []);

  async function submitReview() {
    if (rating === 0) { Alert.alert('Rating required', 'Please select a star rating.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/tracker-providers/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Your review has been submitted!');
        setShowForm(false); setRating(0); setComment('');
        loadReviews();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.detail || 'Could not submit review.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={s.container}>

          {/* HEADER */}
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={27} color={C.textSecondary} strokeWidth={1.8}/>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Reviews</Text>
            <View style={s.headerRight}/>
          </View>

          {loading ? (
            <View style={s.center}>
              <ActivityIndicator color={ORANGE} size="large"/>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

              {/* Write review form */}
              {showForm && (
                <View style={s.formCard}>
                  <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                  <Text style={s.formTitle}>Your Review</Text>

                  {/* Star selector */}
                  <View style={s.starSelector}>
                    {[1,2,3,4,5].map(i => (
                      <TouchableOpacity key={i} onPress={() => setRating(i)}>
                        <Star size={28} color={i <= rating ? ORANGE : 'rgba(255,255,255,0.2)'} fill={i <= rating ? ORANGE : 'rgba(255,255,255,0.2)'} strokeWidth={1.5}/>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={s.commentInput}
                    placeholder="Share your experience..."
                    placeholderTextColor={C.textPlaceholder}
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  <View style={s.formBtns}>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
                      <Text style={s.cancelTxt}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.submitBtn} activeOpacity={0.85} onPress={submitReview} disabled={submitting}>
                      <LinearGradient colors={[AppColors.gradientStart, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject}/>
                      <Text style={s.submitTxt}>{submitting ? 'Submitting...' : 'Submit'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {reviews.length === 0 ? (
                <Text style={s.emptyText}>No reviews yet. Be the first to review!</Text>
              ) : (
                reviews.map(r => <ReviewItem key={r.id} review={r}/>)
              )}
              <View style={{ height: 100 }}/>
            </ScrollView>
          )}

          {/* WRITE REVIEW BUTTON */}
          {!showForm && (
            <View style={s.bottomContainer}>
              <TouchableOpacity style={s.writeBtn} onPress={() => setShowForm(true)}>
                <LinearGradient
                  colors={[AppColors.gradientStart, ORANGE]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={s.writeBtnText}>Write Your Review</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:      { height: 66, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:     { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { position: 'absolute', left: 0, right: 0, textAlign: 'center', color: C.textPrimary, fontSize: 20, fontFamily: 'Poppins_600SemiBold' },
  headerRight: { width: 40 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 16 },
  emptyText:     { color: C.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 40 },

  /* Write form */
  formCard:      { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', backgroundColor: 'rgba(1,6,20,1)', padding: 16, marginBottom: 20, overflow: 'hidden' },
  formTitle:     { color: C.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginBottom: 12 },
  starSelector:  { flexDirection: 'row', gap: 8, marginBottom: 14 },
  commentInput:  { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', backgroundColor: C.glassBg, color: C.textPrimary, fontFamily: 'Poppins_400Regular', fontSize: 13, padding: 12, minHeight: 100, marginBottom: 14 },
  formBtns:      { flexDirection: 'row', gap: 10 },
  cancelBtn:     { flex: 1, height: 42, borderRadius: 21, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  cancelTxt:     { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  submitBtn:     { flex: 1, height: 42, borderRadius: 21, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  submitTxt:     { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  /* Review item */
  review:        { flexDirection: 'row', marginBottom: 20 },
  avatar:        { width: 40, height: 40, borderRadius: 20, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  reviewContent: { flex: 1, marginLeft: 10 },
  nameRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:          { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  stars:         { flexDirection: 'row', alignItems: 'center', gap: 3 },
  time:          { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', marginLeft: 8 },
  reviewText:    { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19, marginTop: 10 },

  /* Bottom */
  bottomContainer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 28, paddingBottom: 20, paddingTop: 10, backgroundColor: C.bg },
  writeBtn:        { height: 50, borderRadius: 25, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(99,148,214,0.5)' },
  writeBtnText:    { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
});
