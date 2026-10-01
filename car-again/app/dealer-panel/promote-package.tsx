import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PlanOption } from '@/components/dealer/DealerUI';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SavedCardEffect, savedCardOuter } from '@/components/shared/FigmaEffects';
import { GlassButton } from '@/components/shared/GlowUI';
import { AppColors } from '@/constants/theme';

const ORANGE = AppColors.gradientEnd;
const C      = AppColors;

const OPTIONS = [
  {
    id: 'hot',
    icon: true,
    title: 'Hot Selling Listing',
    subtitle: 'Recommended for popular cars',
    price: 'PKR 6,650',
    amount: 6650,
    duration: 7,
  },
  {
    id: 'home',
    icon: true,
    title: 'Home Page Listing',
    subtitle: 'Balanced exposure for more buyers',
    price: 'PKR 5,500',
    amount: 5500,
    duration: 7,
  },
  {
    id: 'new',
    icon: false,
    title: 'New Listing',
    subtitle: 'Notify buyers about new listings',
    price: 'PKR 4,450',
    amount: 4450,
    duration: 3,
  },
];

export default function PromotePackageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ vehicle_ids: string }>();
  const vehicle_ids = (params.vehicle_ids || '').split(',').filter(Boolean);

  const [selected, setSelected] = useState('hot');

  function handlePromote() {
    const opt = OPTIONS.find(o => o.id === selected);
    if (!opt) return;
    if (vehicle_ids.length === 0) { Alert.alert('Error', 'No vehicles selected.'); return; }
    router.push({
      pathname: '/dealer-panel/promote-payment',
      params: {
        vehicle_ids: params.vehicle_ids,
        plan_id:     opt.id,
        plan_title:  opt.title,
        amount:      String(opt.amount),
        duration:    String(opt.duration),
      },
    } as any);
  }

  // Figma wording (plan_title sent to payment stays the same)
  const LABEL: Record<string, { t: string; sub: string }> = {
    hot:  { t: 'Hot Selling listing', sub: 'Recommended for popular cars' },
    home: { t: 'Home page Listing',   sub: 'Balanced exposure for more buyers' },
    new:  { t: 'New Listing',         sub: 'Notify Buyers About New Listings' },
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD */}
        <View style={[savedCardOuter, s.card]}>
          <SavedCardEffect band={26} color="#2A4F9A80" />
          {/* CLOSE */}
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="close" size={30} color={ORANGE} />
          </TouchableOpacity>

          {/* HEADER */}
          <View style={s.header}>
            <View style={s.fireBox}>
              <Ionicons name="flame-outline" size={30} color={ORANGE} />
            </View>
            <Text style={s.headerTitle}>
              Promote to Get Your Vehicle Seen Faster
            </Text>
          </View>

          {/* OPTIONS */}
          <View style={s.optionsCol}>
            {OPTIONS.map(opt => (
              <PlanOption
                key={opt.id}
                title={LABEL[opt.id]?.t || opt.title}
                sub={LABEL[opt.id]?.sub || opt.subtitle}
                price={`Rs ${opt.amount.toLocaleString()}`}
                fire={opt.id === 'home'}
                selected={selected === opt.id}
                onPress={() => setSelected(opt.id)}
              />
            ))}
          </View>

          {/* PROMOTE NOW */}
          <TouchableOpacity style={s.promoteBtn} onPress={handlePromote} activeOpacity={0.85}>
            <LinearGradient
              colors={['#0B3585', '#7E4F5C', '#E8702A']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons name="flash-outline" size={24} color="#fff" />
            <Text style={s.promoteTxt}>Promote Now</Text>
          </TouchableOpacity>

          {/* CANCEL */}
          <GlassButton title="Cancel" height={50} fontSize={16} color="#E6E1E8" style={{ marginTop: 12, marginHorizontal: 20 }} onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: C.bg },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, backgroundColor: C.bg },

  /* CARD — blurred slate panel */
  card: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#232B3F',
    borderColor: 'rgba(90,120,190,0.8)',
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 22,
  },

  closeBtn: { position: 'absolute', top: 14, right: 16, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', zIndex: 10 },

  header:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18, paddingRight: 40, paddingLeft: 16, marginTop: 34 },
  fireBox:    { width: 52, height: 52, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ flex: 1, color: '#fff', fontSize: 18, fontFamily: 'Poppins_600SemiBold', lineHeight: 28 },

  optionsCol: { gap: 12 },

  promoteBtn: {
    height: 52, borderRadius: 26, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 12, marginTop: 26, marginHorizontal: 20,
  },
  promoteTxt: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
});
