// Review list item, rating summary and "Write Your Review" sheet — Book flow
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { API_BASE } from '@/constants/api';
import { G, Glass, GradientButton } from '@/components/shared/GlowUI';

export function timeAgo(iso?: string) {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min${m > 1 ? 's' : ''} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo > 1 ? 's' : ''} ago`;
}

export function Stars({ value, size = 14, gap = 4 }: { value: number; size?: number; gap?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons key={i} name="star" size={size} color={i <= Math.round(value) ? G.orange : '#C9BDC4'} />
      ))}
    </View>
  );
}

export function ReviewItem({ r, index, divider = true }: { r: any; index: number; divider?: boolean }) {
  return (
    <View style={[rv.item, divider && rv.itemLine]}>
      <View style={rv.head}>
        <View style={[rv.avatar, { backgroundColor: index % 2 === 0 ? G.orange : '#C9BDC4' }]} />
        <View style={{ flex: 1 }}>
          <Text style={rv.name} numberOfLines={1}>{r.reviewer_name || 'User'}</Text>
          <View style={rv.starRow}>
            <Stars value={r.rating || 0} size={15} />
            <Text style={rv.time}>{r.time ?? timeAgo(r.created_at)}</Text>
          </View>
        </View>
        <Ionicons name="ellipsis-vertical" size={18} color="#C9BDC4" />
      </View>
      {r.comment ? <Text style={rv.comment}>{`"${r.comment}"`}</Text> : null}
    </View>
  );
}

export function RatingSummary({ avg, count, reviews, breakdown }: { avg: number; count: number; reviews: any[]; breakdown?: Record<number, number> }) {
  // `breakdown` (star → count) comes from the backend when available; otherwise count the loaded reviews
  const dist = [5, 4, 3, 2, 1].map(n => breakdown ? Number(breakdown[n] || 0) : reviews.filter(r => Math.round(r.rating) === n).length);
  const max = Math.max(1, ...dist);
  return (
    <View style={rv.summary}>
      <View style={{ flex: 1, gap: 6 }}>
        {[5, 4, 3, 2, 1].map((n, i) => (
          <View key={n} style={rv.barRow}>
            <Text style={rv.barNum}>{n}</Text>
            <Ionicons name="star" size={13} color={G.orange} />
            <View style={rv.barTrack}>
              {dist[i] > 0 && <View style={[rv.bar, { width: `${Math.max(4, (dist[i] / max) * 100)}%` }]} />}
            </View>
          </View>
        ))}
      </View>
      <View style={{ alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 12 }}>
        <Text style={rv.big}>{(avg || 0).toFixed(1)}</Text>
        <Stars value={avg || 0} size={14} gap={6} />
        <Text style={rv.count}>{count} Reviews</Text>
      </View>
    </View>
  );
}

export function WriteReviewModal({
  visible, onClose, dealerId, token, onDone, endpoint,
}: {
  visible: boolean; onClose: () => void; dealerId: string; token?: string | null; onDone: (review: any) => void; endpoint?: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!token) { Alert.alert('Login Required', 'Please login to submit a review.'); return; }
    if (!comment.trim()) { Alert.alert('Required', 'Please write a comment.'); return; }
    setBusy(true);
    try {
      const res = await fetch(endpoint || `${API_BASE}/dealers/${dealerId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { Alert.alert('Error', d.detail || 'Could not submit review.'); return; }
      setComment(''); setRating(5);
      onDone(d);
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setBusy(false); }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} />
        <View style={rv.sheet}>
          <View style={rv.sheetHead}>
            <Text style={rv.sheetTitle}>Write Your Review</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color="#C9C6D0" /></TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginVertical: 14 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <TouchableOpacity key={i} onPress={() => setRating(i)}>
                <Ionicons name={i <= rating ? 'star' : 'star-outline'} size={32} color={G.orange} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={rv.input}>
            <Glass radius={18} blur={14} />
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience..."
              placeholderTextColor="#8F8A96"
              multiline
              style={rv.inputTxt}
            />
          </View>
          {busy
            ? <ActivityIndicator color={G.orange} style={{ marginTop: 20, height: 48 }} />
            : <GradientButton title="Submit Review" style={{ marginTop: 20 }} onPress={submit} />}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const rv = StyleSheet.create({
  item:     { paddingVertical: 14 },
  itemLine: { borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  head:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:   { width: 40, height: 40, borderRadius: 20 },
  name:     { color: '#C9BDC4', fontSize: 15, fontFamily: 'Poppins_500Medium' },
  starRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  time:     { color: '#C9BDC4', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  comment:  { color: '#C9BDC4', fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20, marginTop: 10 },

  summary:  { flexDirection: 'row', backgroundColor: '#0A1F4F', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  barRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  barNum:   { color: '#C9BDC4', fontSize: 13, fontFamily: 'Poppins_400Regular', width: 10 },
  barTrack: { flex: 1, height: 8, marginLeft: 6, justifyContent: 'center' },
  bar:      { height: 8, minWidth: 8, borderRadius: 4, backgroundColor: '#C9BDC4' },
  big:      { color: '#C9BDC4', fontSize: 46, fontFamily: 'Poppins_600SemiBold', lineHeight: 54 },
  count:    { color: '#C9BDC4', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginTop: 6 },

  sheet:      { backgroundColor: G.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(255,255,255,0.18)', padding: 20, paddingBottom: 36 },
  sheetHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { color: G.white, fontSize: 18, fontFamily: 'Poppins_500Medium' },
  input:      { minHeight: 120, borderRadius: 18, overflow: 'hidden' },
  inputTxt:   { color: G.white, fontSize: 14, fontFamily: 'Poppins_400Regular', padding: 16, minHeight: 120, textAlignVertical: 'top' },
});
