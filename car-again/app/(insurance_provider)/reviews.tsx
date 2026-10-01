import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList, StyleSheet, Text,
  TouchableOpacity, View, ActivityIndicator, RefreshControl,
  Modal, TextInput, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MoreVertical } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { DHeader } from '@/components/dealer/DealerUI';
import { ReviewItem as SharedReviewItem } from '@/components/book/reviews';

const ORANGE = '#e2671b';
const C = AppColors;

const AVATAR_COLORS = [ORANGE, '#6b7280', '#3b82f6', '#22c55e', '#a855f7'];

function fmtTime(iso: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ReviewItem({ item }: { item: any }) {
  return (
    <View style={s.reviewItem}>
      <View style={s.reviewHead}>
        <View style={[s.avatar, { backgroundColor: item.color }]}>
          <Text style={s.avatarTxt}>{item.initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{item.name}</Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <Ionicons key={i} name={i <= item.stars ? 'star' : 'star-outline'} size={13} color={ORANGE} />
            ))}
            <Text style={s.time}>{item.time}</Text>
          </View>
        </View>
        <TouchableOpacity><MoreVertical size={16} color="#8f9cb5" /></TouchableOpacity>
      </View>
      <Text style={s.reviewTxt}>{item.text}</Text>
      <View style={s.divider} />
    </View>
  );
}

export default function ReviewsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [reviews,     setReviews]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [myRating,    setMyRating]    = useState(0);
  const [myComment,   setMyComment]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!token || !user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/insurance/${user.id}/reviews?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReviews((data || []).map((r: any, i: number) => ({
          id:      r.id || String(i),
          name:    r.reviewer_name || 'User',
          initial: (r.reviewer_name || 'U').charAt(0).toUpperCase(),
          color:   AVATAR_COLORS[i % AVATAR_COLORS.length],
          stars:   Math.round(r.rating ?? 0),
          time:    fmtTime(r.created_at || ''),
          text:    r.comment || '',
          raw:     r,
        })));
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token, user?.id]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  async function submitReview() {
    if (myRating === 0) { Alert.alert('Required', 'Please select a star rating.'); return; }
    if (!myComment.trim()) { Alert.alert('Required', 'Please write a comment.'); return; }
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/insurance/${user?.id}/reviews`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: myRating, comment: myComment.trim() }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail ?? 'Failed to submit');
      }
      Alert.alert('Thank you!', 'Your review has been submitted.');
      setShowModal(false);
      setMyRating(0);
      setMyComment('');
      fetchReviews();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <DHeader title="Reviews" center />
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={ORANGE} size="large" style={{ marginTop: 60 }} />
      ) : (
      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReviews(); }} tintColor={ORANGE} />}
        // Same review row as the Book-a-vehicle / dealer Reviews screens
        renderItem={({ item, index }) => <SharedReviewItem r={item.raw} index={index} divider={index < reviews.length - 1} />}
        ListEmptyComponent={
          <Text style={{ color: '#8f9cb5', textAlign: 'center', marginTop: 60, fontFamily: 'Poppins_400Regular' }}>
            No reviews yet
          </Text>
        }
      />
      )}

      {/* Write Your Review Button */}
      <View style={s.bottomWrap}>
        <TouchableOpacity style={s.writeBtn} activeOpacity={0.85} onPress={() => setShowModal(true)}>
          <LinearGradient colors={['#0B3585', '#7E4F5C', '#E8702A']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          <Text style={s.writeBtnTxt}>Write Your Review</Text>
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      <Modal transparent visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={s.modalSheet}>
            <Text style={s.modalTitle}>Write a Review</Text>

            {/* Stars */}
            <Text style={s.modalLabel}>Your Rating</Text>
            <View style={s.starsSelect}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setMyRating(star)} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
                  <Ionicons name={star <= myRating ? 'star' : 'star-outline'} size={32} color={star <= myRating ? ORANGE : '#6b7280'} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment */}
            <Text style={s.modalLabel}>Your Comment</Text>
            <TextInput
              style={s.commentInput}
              placeholder="Share your experience with this insurance provider..."
              placeholderTextColor="#6b7280"
              value={myComment}
              onChangeText={setMyComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              selectionColor={ORANGE}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[s.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={submitReview}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#032a69', ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.submitTxt}>Submit Review</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={s.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },

  list:        { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 },

  reviewItem:  { marginBottom: 4 },
  reviewHead:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar:      { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#fff' },
  name:        { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary, marginBottom: 3 },
  starsRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  time:        { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', marginLeft: 4 },
  reviewTxt:   { fontSize: 13, fontFamily: 'Poppins_400Regular', color: C.textSecondary, lineHeight: 20, marginBottom: 16 },
  divider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },

  bottomWrap:  { position: 'absolute', bottom: 28, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: 'transparent' },
  writeBtn:    { borderRadius: 30, overflow: 'hidden', height: 52, justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 },
  writeBtnTxt: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0D1E3F',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.2)',
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40,
  },
  modalTitle:  { color: '#fff', fontSize: 17, fontFamily: 'Poppins_700Bold', marginBottom: 20, textAlign: 'center' },
  modalLabel:  { color: '#c3cee2', fontSize: 13, fontFamily: 'Poppins_500Medium', marginBottom: 10 },
  starsSelect: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  commentInput:{
    height: 110, borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.4)',
    backgroundColor: 'rgba(1,6,20,1)',
    color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular',
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20,
  },
  submitBtn:   { borderRadius: 30, overflow: 'hidden', paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  submitTxt:   { color: '#fff', fontSize: 14, fontFamily: 'Poppins_700Bold' },
  cancelBtn:   { alignItems: 'center', paddingVertical: 8 },
  cancelTxt:   { color: '#6b7280', fontSize: 13, fontFamily: 'Poppins_400Regular' },
});
