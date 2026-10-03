// Figma: Vehicle Booked — success
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { G, Glass, GlowBackground, GradientButton, ScreenHeader } from '@/components/shared/GlowUI';
import { SuccessHero } from '@/components/book/common';

function fmtDate(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const mon = d.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${d.getDate()} ${mon} ${d.getFullYear()}, ${time}`;
}

export default function BookBooked() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useLocalSearchParams<{ bookingId?: string; vehicle?: string; dealer?: string; date?: string }>();
  const digits = String(p.bookingId || '').replace(/\D/g, '');
  const bookingId = `#AW-TRK-${(digits.slice(-5) || String(p.bookingId || '').slice(-5) || '00000').toUpperCase()}`;
  const home = () => router.dismissTo('/(tabs)' as any);

  const rows = [
    { l: 'Vehicle', v: p.vehicle || '—' },
    { l: 'Dealer', v: p.dealer || '—' },
    { l: 'Date', v: fmtDate(p.date) },
  ];

  return (
    <GlowBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Vehicle Booked" onBack={home} />
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 56 }}>
          <SuccessHero title={'Your vehicle has been\nbooked successfully!'} sub="Your booking is confirmed. Dealer will contact you shortly." />
          <View style={s.card}>
            <Glass radius={16} blur={20} />
            <View style={s.row}>
              <Text style={s.idLabel}>Installation Booking ID</Text>
              <Text style={s.id}>{bookingId}</Text>
            </View>
            {rows.map(r => (
              <View key={r.l} style={s.row}>
                <Text style={s.l}>{r.l}</Text>
                <Text style={s.v} numberOfLines={1}>{r.v}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 12) + 8 }}>
          <GradientButton title="Back to home" height={50} onPress={home} />
        </View>
      </SafeAreaView>
    </GlowBackground>
  );
}

const s = StyleSheet.create({
  card:    { borderRadius: 16, overflow: 'hidden', paddingHorizontal: 16, paddingVertical: 12, marginTop: 28, gap: 6 },
  row:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 2 },
  idLabel: { color: G.white, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  id:      { color: G.orange, fontSize: 16, fontFamily: 'Poppins_500Medium' },
  l:       { color: G.muted, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  v:       { color: G.white, fontSize: 13, fontFamily: 'Poppins_400Regular', flexShrink: 1, textAlign: 'right' },
});
