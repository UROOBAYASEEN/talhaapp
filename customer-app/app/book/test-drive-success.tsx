// Figma: Test Drive Booked Successfully
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { G, Glass, GlowBackground, GradientButton, ScreenHeader } from '@/components/shared/GlowUI';
import { authHeaders, fmtLac, imgUrl, SuccessHero } from '@/components/book/common';

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function postedOn(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return `Posted on ${ordinal(d.getDate())} ${d.toLocaleString('en-US', { month: 'long' }).toLowerCase()} ${d.getFullYear()}`;
}

export default function BookTestDriveSuccess() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [v, setV] = useState<any>(null);
  const home = () => router.dismissTo('/(tabs)' as any);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/vehicles/${id}`, { headers: authHeaders(token) });
        if (res.ok) setV(await res.json());
      } catch { }
    })();
  }, [id]);

  const img = imgUrl(v?.images?.[0]);
  const meta = [v?.city, v?.year, v?.transmission].filter(Boolean).join(' • ');

  return (
    <GlowBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Book Test Drive" onBack={() => router.back()} onClose={home} />
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 64 }}>
          <SuccessHero title="Test Drive Booked Successfully!" sub="Your test drive request has been confirmed." />
          <TouchableOpacity style={s.card} activeOpacity={0.88} onPress={() => router.back()}>
            <Glass radius={18} blur={20} />
            {img
              ? <Image source={{ uri: img }} style={s.img} resizeMode="cover" />
              : <View style={[s.img, { backgroundColor: '#0B1D4A', alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="car-outline" size={30} color={G.muted} /></View>}
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.title} numberOfLines={1}>{v?.title || '—'}</Text>
              <Text style={s.price}>{fmtLac(v?.price)}</Text>
              <View style={s.metaRow}>
                <Ionicons name="location-outline" size={15} color={G.muted} />
                <Text style={s.meta} numberOfLines={1}>{meta || '—'}</Text>
              </View>
              <View style={s.metaRow}>
                <View style={s.active}><Text style={s.activeTxt}>• Active</Text></View>
                <Text style={s.posted} numberOfLines={1}>{postedOn(v?.created_at)}</Text>
                <Ionicons name="chevron-forward" size={18} color={G.orange} style={{ marginLeft: 'auto' }} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 12) + 8 }}>
          <GradientButton title="Back to home" height={50} fontSize={18} onPress={home} />
        </View>
      </SafeAreaView>
    </GlowBackground>
  );
}

const s = StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, overflow: 'hidden', padding: 9, paddingRight: 12, marginTop: 20 },
  img:       { width: 100, height: 82, borderRadius: 12 },
  title:     { color: G.white, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  price:     { color: G.orange, fontSize: 16, fontFamily: 'Poppins_500Medium' },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta:      { color: G.muted, fontSize: 12, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  active:    { backgroundColor: '#0E2A2A', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 1 },
  activeTxt: { color: '#2ECC71', fontSize: 11, fontFamily: 'Poppins_400Regular' },
  posted:    { color: G.muted, fontSize: 8, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
});
