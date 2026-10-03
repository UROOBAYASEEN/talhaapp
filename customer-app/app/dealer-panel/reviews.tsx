import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { PRIMARY_BTN_COLORS } from '@/components/shared/FigmaEffects';
import { ReviewItem as SharedReviewItem } from '@/components/book/reviews';
import { Ionicons } from '@expo/vector-icons';

const ORANGE = AppColors.gradientEnd;
const C      = AppColors;

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ReviewsScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{ dealer_id: string }>();
  const { token, user } = useAuth();

  const dealer_id = params.dealer_id || user?.id || '';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/dealers/${dealer_id}/reviews?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setReviews(await res.json());
    } catch {
      Alert.alert('Error', 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReviews(); }, []);

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={C.textSecondary} />
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
            {reviews.length === 0 ? (
              <Text style={s.emptyText}>No reviews yet. Be the first to review!</Text>
            ) : (
              // Same review row as the Book-a-vehicle Reviews screen
              reviews.map((r, i) => (
                <SharedReviewItem key={r.id} r={r} index={i} divider={i < reviews.length - 1} />
              ))
            )}
            <View style={{ height: 95 }}/>
          </ScrollView>
        )}

        {/* WRITE REVIEW BUTTON */}
        <View style={s.bottomContainer}>
          <TouchableOpacity
            style={s.writeBtn}
            onPress={() => router.push({ pathname: '/dealer-panel/write-review', params: { dealer_id } } as any)}
          >
            <LinearGradient
              colors={PRIMARY_BTN_COLORS as any}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={s.writeBtnText}>Write Your Review</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    height: 60, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn:     { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: {
    position: 'absolute', left: 0, right: 0,
    textAlign: 'center', color: '#F2F1F5',
    fontSize: 20, fontFamily: 'Poppins_500Medium',
  },
  headerRight: { width: 40 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 12 },
  emptyText:     { color: '#BAB6C4', fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 40 },

  review:        { marginBottom: 16 },
  reviewTop:     { flexDirection: 'row', alignItems: 'center' },
  avatar:        { width: 42, height: 42, borderRadius: 21, flexShrink: 0 },
  avatarInitial: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  reviewContent: { flex: 1, marginLeft: 12 },

  nameRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:      { color: '#C9C6D0', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  stars:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  time:      { color: '#BAB6C4', fontSize: 15, fontFamily: 'Poppins_400Regular', marginLeft: 8 },
  reviewText:{ color: '#C9C6D0', fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20, marginTop: 12 },

  bottomContainer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 36, paddingBottom: 20, paddingTop: 10,
    backgroundColor: 'transparent',
  },
  writeBtn: {
    height: 54, borderRadius: 27, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  writeBtnText: { color: '#EDEBF0', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
