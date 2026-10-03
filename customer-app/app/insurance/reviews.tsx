// Figma: Reviews (Insurance company profile → See More)
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { DUMMY_REVIEWS } from '@/constants/dummyReviews';
import { G, GlowBackground, GradientButton, ScreenHeader } from '@/components/shared/GlowUI';
import { ReviewItem, WriteReviewModal } from '@/components/book/reviews';

// Profile reviews ({ name, comment, rating, date }) → ReviewItem shape
const toItem = (r: any) => ({ id: r.id, reviewer_name: r.name || r.reviewer_name, comment: r.comment, rating: r.rating, time: r.date, created_at: r.created_at });

export default function InsuranceReviews() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/sellers/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (res.ok) setReviews(((await res.json())?.reviews || []).map(toItem));
      } catch { }
      finally { setLoading(false); }
    })();
  }, [id]);

  // No reviews yet → dummy reviews for now
  const list = reviews.length ? reviews : DUMMY_REVIEWS.map(toItem);

  return (
    <GlowBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Reviews" />
        {loading ? <ActivityIndicator color={G.orange} style={{ marginTop: 40 }} /> : (
          <FlatList
            data={list}
            keyExtractor={(r, i) => String(r.id ?? i)}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => <ReviewItem r={item} index={index} divider={index < list.length - 1} />}
          />
        )}
        <View style={[s.bottom, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <GradientButton title="Write Your Review" height={50} fontSize={17} onPress={() => setWriting(true)} />
        </View>
      </SafeAreaView>
      <WriteReviewModal
        visible={writing}
        onClose={() => setWriting(false)}
        dealerId={String(id)}
        endpoint={`${API_BASE}/sellers/${id}/reviews`}
        token={token}
        onDone={r => { setReviews(prev => [toItem({ ...r, name: r.name || r.reviewer_name || 'You', date: r.date || 'Just now' }), ...prev]); setWriting(false); Alert.alert('Thank you!', 'Your review has been submitted.'); }}
      />
    </GlowBackground>
  );
}

const s = StyleSheet.create({
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 8 },
});
