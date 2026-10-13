import { useAppColors, withLightStyles, LIGHT_POP_SHADOW } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { RingGlow } from '@/components/shared/FigmaEffects';

const BG     = '#010A1F';
const ORANGE = '#e2671b';

const SERVER_BASE = API_BASE.replace('/api/v1', '');
function imgUrl(url?: string) {
  if (!url || url.startsWith('file://')) return null;
  if (url.startsWith('http')) return url.replace(/http:\/\/[\d.]+:\d+/, SERVER_BASE);
  return `${SERVER_BASE}${url}`;
}
function formatPrice(p: number) {
  if (p >= 10_000_000) return `PKR ${(p / 10_000_000).toFixed(2)} Crore`;
  if (p >= 100_000)    return `PKR ${(p / 100_000).toFixed(2)} Lacs`;
  return `PKR ${p.toLocaleString()}`;
}
// "27th july 2026"
function postedDate(d = new Date()) {
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  const month = d.toLocaleDateString('en-GB', { month: 'long' }).toLowerCase();
  return `${day}${suffix} ${month} ${d.getFullYear()}`;
}

export default function TestDriveSuccessScreen() {
  const aC = useAppColors();
  const s = aC.isDark ? s_dark : s_light;
  const router = useRouter();
  const { title = '', price = '', photo = '', city = '', year = '', trans = '', id = '' } =
    useLocalSearchParams<{ title?: string; price?: string; photo?: string; city?: string; year?: string; trans?: string; id?: string }>();

  const img  = imgUrl(String(photo));
  const meta = [city, year, trans].filter(Boolean).join(' • ');
  const priceTxt = price ? formatPrice(Number(price)) : '';

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.isDark ? BG : '#ffffff'} />

      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={26} color="#C9C6D0" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.body}>
          <Text style={s.emoji}>🎉</Text>
          <Text style={s.title}>Test Drive Booked Successfully!</Text>
          <Text style={s.sub}>Your test drive request has been{'\n'}confirmed.</Text>
        </View>

        {/* Vehicle card */}
        <TouchableOpacity
          style={s.card}
          activeOpacity={0.88}
          onPress={() => id && router.push({ pathname: '/buy/car-detail', params: { id: String(id) } } as any)}
        >
          {aC.isDark && <RingGlow radius={16} />}
          <View style={s.imgBox}>
            {img
              ? <Image source={{ uri: img }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              : <Ionicons name="car-outline" size={32} color="#BAB6C4" />}
          </View>
          <View style={s.info}>
            <Text style={s.carName} numberOfLines={2}>{title || 'Your Vehicle'}</Text>
            {!!priceTxt && <Text style={s.carPrice}>{priceTxt}</Text>}
            {!!meta && (
              <View style={s.metaRow}>
                <Ionicons name="location-outline" size={16} color="#BAB6C4" />
                <Text style={s.metaTxt} numberOfLines={1}>{meta}</Text>
              </View>
            )}
            <View style={s.statusRow}>
              <View style={s.badge}><Text style={s.badgeTxt}>•  Active</Text></View>
              <Text style={s.posted} numberOfLines={1}>Posted on {postedDate()}</Text>
              <Ionicons name="chevron-forward" size={18} color={ORANGE} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1, minHeight: 60 }} />

        {/* Back to home */}
        <TouchableOpacity style={s.homeBtn} activeOpacity={0.88} onPress={() => router.dismissTo('/(tabs)' as any)}>
          {aC.isDark && <RingGlow radius={28} peak={0.5} rings={14} />}
          <Text style={s.homeTxt}>Back to home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s_dark = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  backBtn: { width: 44, height: 40, justifyContent: 'center', paddingLeft: 12, marginTop: 4 },
  scroll:  { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 30 },

  body:  { alignItems: 'center', paddingTop: 110, paddingBottom: 16 },
  emoji: { fontSize: 60, textAlign: 'center', marginBottom: 14 },
  title: { color: '#F2F1F5', fontSize: 18, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  sub:   { color: '#BAB6C4', fontSize: 13.5, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 21, marginTop: 6 },

  card:    { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: '#0A1838', borderWidth: 1, borderColor: '#7E9FD6', borderRadius: 16, padding: 10, overflow: 'hidden', shadowColor: '#4F7FD0', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  imgBox:  { width: 128, height: 104, borderRadius: 10, overflow: 'hidden', backgroundColor: '#102348', alignItems: 'center', justifyContent: 'center' },
  info:    { flex: 1, gap: 5 },
  carName: { color: '#F2F1F5', fontSize: 12.5, fontFamily: 'Poppins_500Medium', lineHeight: 18 },
  carPrice:{ color: ORANGE, fontSize: 15, fontFamily: 'Poppins_500Medium' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaTxt: { color: '#BAB6C4', fontSize: 12.5, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge:     { backgroundColor: 'rgba(0,112,74,0.23)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3 },
  badgeTxt:  { color: '#19d273', fontSize: 11, fontFamily: 'Poppins_500Medium' },
  posted:    { flex: 1, color: '#BAB6C4', fontSize: 8.5, fontFamily: 'Poppins_400Regular' },

  homeBtn: { height: 52, borderRadius: 26, borderWidth: 1, borderColor: '#7E9FD6', backgroundColor: '#07142F', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  homeTxt: { color: '#EDEBF0', fontSize: 16, fontFamily: 'Poppins_400Regular' },
});
// Light mode layer for `s` — dark mode uses s_dark as is
const s_light = withLightStyles(s_dark, {
  root: { backgroundColor: '#ffffff' },
  title: { color: '#000000' },
  sub: { color: '#4b5563' },
  card: { backgroundColor: '#F2F4F8', borderColor: 'rgba(0,0,0,0.04)', boxShadow: LIGHT_POP_SHADOW },
  imgBox: { backgroundColor: '#F2F4F8' },
  carName: { color: '#000000' },
  metaTxt: { color: '#4b5563' },
  posted: { color: '#4b5563' },
  homeBtn: { backgroundColor: '#F2F4F8', borderColor: 'rgba(0,0,0,0.04)', boxShadow: LIGHT_POP_SHADOW },
  homeTxt: { color: '#000000' },
});

