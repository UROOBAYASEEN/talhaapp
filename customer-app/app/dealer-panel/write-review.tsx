import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Star } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = AppColors.gradientEnd;
const C      = AppColors;

export default function WriteReviewScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{ dealer_id: string }>();
  const { token } = useAuth();

  const dealer_id = params.dealer_id || '';

  const [rating,      setRating]      = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment,     setComment]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/dealers/${dealer_id}/reviews`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });

      if (res.ok) {
        Alert.alert('Thank you!', 'Your review has been submitted.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.detail || 'Could not submit review.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const displayStar = hoveredStar || rating;

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={27} color={C.textSecondary} strokeWidth={1.8}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Write a Review</Text>
          <View style={s.headerRight}/>
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

          {/* STAR RATING */}
          <Text style={s.label}>Your Rating</Text>
          <View style={s.starsRow}>
            {[1,2,3,4,5].map(i => (
              <TouchableOpacity
                key={i}
                onPress={() => setRating(i)}
                onPressIn={() => setHoveredStar(i)}
                onPressOut={() => setHoveredStar(0)}
                activeOpacity={0.7}
              >
                <Star
                  size={42}
                  color={i <= displayStar ? ORANGE : 'rgba(255,255,255,0.15)'}
                  fill={i <= displayStar ? ORANGE : 'transparent'}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Text style={s.ratingLabel}>{LABELS[rating]}</Text>
          )}

          {/* COMMENT INPUT */}
          <Text style={[s.label, { marginTop: 28 }]}>Your Review</Text>
          <View style={s.inputWrap}>
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <TextInput
              style={s.input}
              placeholder="Share your experience with this dealership..."
              placeholderTextColor={C.textPlaceholder}
              multiline
              numberOfLines={6}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
          </View>

          {/* SUBMIT */}
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
            <LinearGradient
              colors={[AppColors.gradientStart, AppColors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            {submitting
              ? <ActivityIndicator color="#fff" size="small"/>
              : <Text style={s.submitText}>Submit Review</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },

  header: {
    height: 66, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn:     { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: {
    position: 'absolute', left: 0, right: 0,
    textAlign: 'center', color: C.textPrimary,
    fontSize: 20, fontFamily: 'Poppins_600SemiBold',
  },
  headerRight: { width: 40 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },

  label: { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 14 },

  starsRow:    { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 10 },
  ratingLabel: { textAlign: 'center', color: ORANGE, fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },

  inputWrap: {
    borderRadius: 20, borderWidth: 1,
    borderColor: AppColors.glassBorder,
    backgroundColor: AppColors.glassBg,
    overflow: 'hidden', padding: 16,
    minHeight: 150,
  },
  input: {
    color: C.textPrimary, fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22, minHeight: 120,
  },

  submitBtn: {
    height: 52, borderRadius: 26, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 32,
  },
  submitText: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
});
