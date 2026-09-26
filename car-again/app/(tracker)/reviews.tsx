import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList, StyleSheet, Text, TouchableOpacity,
  View, ActivityIndicator, RefreshControl, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MoreVertical, Star, X, Send } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#e2671b';
const C      = AppColors;

function formatTime(iso: string) {
  if (!iso) return '';
  const d   = new Date(iso);
  const now = new Date();
  if (isNaN(d.getTime())) return '';
  const isToday     = d.toDateString() === now.toDateString();
  const yesterday   = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const timeStr     = d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (isToday)     return `today at ${timeStr}`;
  if (isYesterday) return `yesterday at ${timeStr}`;
  return `${d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })} at ${timeStr}`;
}

function getInitials(name: string) {
  return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const COLORS = [ORANGE, C.textSecondary, '#4fc3f7', '#a5d6a7', '#ce93d8'];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => onChange(i)} activeOpacity={0.7}>
          <Star size={36} color={ORANGE} fill={i <= value ? ORANGE : 'transparent'} strokeWidth={1.5} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ReviewItem({ item }: { item: any }) {
  const name    = item.reviewer_name || 'User';
  const initial = getInitials(name);
  const color   = COLORS[name.charCodeAt(0) % COLORS.length];
  return (
    <View style={s.reviewItem}>
      <View style={s.reviewHead}>
        <View style={[s.avatar, { backgroundColor: color }]}>
          <Text style={s.avatarTxt}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{name}</Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} size={13} color={ORANGE} fill={i <= item.rating ? ORANGE : 'transparent'} strokeWidth={1.5} />
            ))}
            <Text style={s.time}>{formatTime(item.created_at)}</Text>
          </View>
        </View>
        <TouchableOpacity><MoreVertical size={16} color="#8f9cb5" /></TouchableOpacity>
      </View>
      {item.comment ? <Text style={s.reviewTxt}>"{item.comment}"</Text> : null}
      <View style={s.divider} />
    </View>
  );
}

function RatingSummary({ reviews }: { reviews: any[] }) {
  if (!reviews.length) return null;
  const avg      = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const total    = reviews.length;
  return (
    <View style={s.summaryCard}>
      <LinearGradient colors={['rgba(22,64,136,0.2)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <View style={s.summaryLeft}>
        <Text style={s.avgScore}>{avg.toFixed(1)}</Text>
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {[1,2,3,4,5].map(i => <Star key={i} size={14} color={ORANGE} fill={i <= Math.round(avg) ? ORANGE : 'transparent'} strokeWidth={1.5}/>)}
        </View>
        <Text style={s.totalReviews}>{total} reviews</Text>
      </View>
      <View style={s.summaryBars}>
        {[5,4,3,2,1].map(star => {
          const count = reviews.filter(r => Math.round(r.rating) === star).length;
          const pct   = total > 0 ? count / total : 0;
          return (
            <View key={star} style={s.barRow}>
              <Text style={s.barLabel}>{star}</Text>
              <Star size={10} color={ORANGE} fill={ORANGE} />
              <View style={s.barTrack}><View style={[s.barFill, { width: `${pct * 100}%` as any }]} /></View>
              <Text style={s.barCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function TrackerReviewsScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { tracker_id } = useLocalSearchParams<{ tracker_id?: string }>();

  const targetId = tracker_id || user?.id || '';

  const [reviews,    setReviews]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [rating,     setRating]     = useState(0);
  const [comment,    setComment]    = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token || !targetId) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/tracker-providers/${targetId}/reviews?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setReviews(await res.json());
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [token, targetId]);

  useEffect(() => { load(); }, [load]);
  async function onRefresh() { setRefreshing(true); await load(); }

  async function handleSubmit() {
    if (rating === 0)       { Alert.alert('Rating required', 'Please select a star rating.'); return; }
    if (!comment.trim())    { Alert.alert('Comment required', 'Please write a short review.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/tracker-providers/${targetId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        Alert.alert('Error', err.detail || 'Could not submit review.');
        return;
      }
      Alert.alert('Thank you!', 'Your review has been submitted.');
      setShowModal(false);
      setRating(0);
      setComment('');
      load();
    } catch { Alert.alert('Error', 'Network error. Try again.'); }
    finally { setSubmitting(false); }
  }

  const ratingLabel = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating] || '';

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Reviews</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={ORANGE} size="large" /></View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
          ListHeaderComponent={<RatingSummary reviews={reviews} />}
          renderItem={({ item }) => <ReviewItem item={item} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Star size={40} color={C.textSecondary} />
              <Text style={s.emptyTxt}>No reviews yet</Text>
              <Text style={{ color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' }}>Be the first to write a review</Text>
            </View>
          }
        />
      )}

      {/* Write Review Button */}
      <View style={s.bottomWrap}>
        <TouchableOpacity style={s.writeBtn} activeOpacity={0.85} onPress={() => setShowModal(true)}>
          <LinearGradient colors={['#032a69', ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          <Star size={16} color="#fff" fill="#fff" />
          <Text style={s.writeBtnTxt}>Write Your Review</Text>
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={m.overlay}>
            <View style={m.sheet}>
              <LinearGradient colors={['rgba(22,64,136,0.3)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.5}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>

              {/* Handle */}
              <View style={m.handle} />

              {/* Header */}
              <View style={m.header}>
                <Text style={m.title}>Write a Review</Text>
                <TouchableOpacity style={m.closeBtn} onPress={() => setShowModal(false)}>
                  <X size={20} color={C.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={m.rateLabel}>Rate your experience</Text>
              <StarRating value={rating} onChange={setRating} />
              {rating > 0 && (
                <Text style={m.ratingWord}>{ratingLabel}</Text>
              )}

              <Text style={m.commentLabel}>Your Review</Text>
              <View style={m.inputWrap}>
                <LinearGradient colors={['rgba(22,64,136,0.15)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <TextInput
                  style={m.input}
                  placeholder="Share your experience with this tracker provider..."
                  placeholderTextColor={C.textPlaceholder}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[m.submitBtn, (submitting || rating === 0) && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting || rating === 0}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#032a69', ORANGE]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} />
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Send size={16} color="#fff" /><Text style={m.submitTxt}>Submit Review</Text></>
                }
              </TouchableOpacity>

              <TouchableOpacity style={m.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={m.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:        { paddingHorizontal: 20, paddingBottom: 130, paddingTop: 8 },

  summaryCard: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: 'rgba(3,12,40,0.6)', padding: 16, flexDirection: 'row', gap: 16, marginBottom: 24, overflow: 'hidden' },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 70 },
  avgScore:    { fontSize: 38, fontFamily: 'Poppins_700Bold', color: C.textPrimary, lineHeight: 44 },
  totalReviews:{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: C.textSecondary, marginTop: 2 },
  summaryBars: { flex: 1, gap: 5, justifyContent: 'center' },
  barRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel:    { fontSize: 11, fontFamily: 'Poppins_400Regular', color: C.textSecondary, width: 8 },
  barTrack:    { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  barFill:     { height: '100%', backgroundColor: ORANGE, borderRadius: 3 },
  barCount:    { fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.textSecondary, width: 18, textAlign: 'right' },

  reviewItem:  { marginBottom: 4 },
  reviewHead:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar:      { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#fff' },
  name:        { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary, marginBottom: 3 },
  starsRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  time:        { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', marginLeft: 4 },
  reviewTxt:   { fontSize: 13, fontFamily: 'Poppins_400Regular', color: C.textSecondary, lineHeight: 20, marginBottom: 16 },
  divider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  empty:       { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTxt:    { fontSize: 14, fontFamily: 'Poppins_500Medium', color: C.textSecondary },

  bottomWrap:  { position: 'absolute', bottom: 70, left: 0, right: 0, paddingHorizontal: 20 },
  writeBtn:    { borderRadius: 30, overflow: 'hidden', paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  writeBtnTxt: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
});

const m = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#060f2e', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, borderWidth: 1, borderColor: 'rgba(100,160,255,0.2)', overflow: 'hidden' },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:      { color: C.textPrimary, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  closeBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  rateLabel:  { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_500Medium', textAlign: 'center', marginBottom: 14 },
  ratingWord: { color: ORANGE, fontSize: 14, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', marginBottom: 8, marginTop: -10 },
  commentLabel:{ color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_500Medium', marginBottom: 10 },
  inputWrap:  { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: 'rgba(3,12,40,0.6)', overflow: 'hidden', marginBottom: 20 },
  input:      { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_400Regular', minHeight: 100, paddingHorizontal: 16, paddingVertical: 12 },
  submitBtn:  { height: 52, borderRadius: 26, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  submitTxt:  { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  cancelBtn:  { alignItems: 'center', paddingVertical: 8 },
  cancelTxt:  { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', textDecorationLine: 'underline' },
});
