// Figma: Reviews (Book flow)
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { G, GlowBackground, GradientButton, ScreenHeader } from '@/components/shared/GlowUI';
import { ReviewItem, WriteReviewModal } from '@/components/book/reviews';

export default function BookReviews() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/dealers/${id}/reviews?limit=50`);
        if (res.ok) setReviews((await res.json()) || []);
      } catch { }
      finally { setLoading(false); }
    })();
  }, [id]);

  return (
    <GlowBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Reviews" />
        {loading ? <ActivityIndicator color={G.orange} style={{ marginTop: 40 }} /> : (
          <FlatList
            data={reviews}
            keyExtractor={r => r.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={s.empty}>No reviews yet. Be the first to review!</Text>}
            renderItem={({ item, index }) => <ReviewItem r={item} index={index} divider={index < reviews.length - 1} />}
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
        token={token}
        onDone={r => { setReviews(prev => [r, ...prev]); setWriting(false); Alert.alert('Thank you!', 'Your review has been submitted.'); }}
      />
    </GlowBackground>
  );
}

const s = StyleSheet.create({
  empty:  { color: G.muted, fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 40 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 8 },
});
