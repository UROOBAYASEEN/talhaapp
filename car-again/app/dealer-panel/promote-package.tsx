import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Flame, ChevronRight, Zap } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
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

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD */}
        <View style={s.card}>
          <LinearGradient
            colors={['#0b1642', '#0d1a4a', '#0a1338']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* CLOSE */}
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <X size={26} color={ORANGE} strokeWidth={2.5}/>
          </TouchableOpacity>

          {/* HEADER */}
          <View style={s.header}>
            <View style={s.fireBox}>
              <Flame size={30} color={ORANGE} fill={ORANGE}/>
            </View>
            <Text style={s.headerTitle}>
              Promote to Get Your Vehicle Seen Faster
            </Text>
          </View>

          {/* OPTIONS */}
          <View style={s.optionsCol}>
            {OPTIONS.map(opt => {
              const isSelected = selected === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setSelected(opt.id)}
                  activeOpacity={0.85}
                  style={[s.optCard, isSelected && s.optCardSelected]}
                >
                  {/* Top row — title + radio */}
                  <View style={s.optTop}>
                    <View style={s.optTitleRow}>
                      {opt.icon && (
                        <Flame size={20} color={ORANGE} fill={ORANGE} style={{ marginRight: 8 }}/>
                      )}
                      <Text style={s.optTitle}>{opt.title}</Text>
                    </View>
                    <View style={[s.radioOuter, isSelected && s.radioOuterSelected]}>
                      {isSelected && <View style={s.radioInner}/>}
                    </View>
                  </View>

                  {/* Bottom row — subtitle + price */}
                  <View style={s.optBottom}>
                    <Text style={s.optSubtitle}>{opt.subtitle}</Text>
                    <View style={s.priceRow}>
                      <Text style={s.price}>{opt.price}</Text>
                      <ChevronRight size={18} color={ORANGE}/>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* PROMOTE NOW */}
          <TouchableOpacity
            style={s.promoteBtn}
            onPress={handlePromote}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[NAVY, ORANGE]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Zap size={20} color="#fff" fill="#fff"/>
            <Text style={s.promoteTxt}>Promote Now</Text>
          </TouchableOpacity>

          {/* CANCEL */}
          <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={s.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: C.bg },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, backgroundColor: C.bg },

  /* CARD */
  card: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },

  /* CLOSE */
  closeBtn: { position: 'absolute', top: 14, right: 14, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', zIndex: 10 },

  /* HEADER */
  header:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16, paddingRight: 28, marginTop: 6 },
  fireBox:    { width: 50, height: 50, borderRadius: 14, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle:{ flex: 1, color: '#fff', fontSize: 17, fontFamily: 'Poppins_700Bold', lineHeight: 25, paddingTop: 2 },

  /* OPTIONS */
  optionsCol: { gap: 10 },
  optCard: {
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  optCardSelected: {
    backgroundColor: '#12206b',
    borderColor: '#2a3a8f',
  },

  optTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  optTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  optTitle:    { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold', flexShrink: 1 },

  radioOuter:         { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: '#fff' },
  radioInner:         { width: 11, height: 11, borderRadius: 6, backgroundColor: '#fff' },

  optBottom:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  optSubtitle:{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Poppins_400Regular', flex: 1, flexShrink: 1 },
  priceRow:   { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 },
  price:      { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_700Bold' },

  /* PROMOTE */
  promoteBtn: {
    height: 50, borderRadius: 40, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, marginTop: 18,
  },
  promoteTxt: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },

  /* CANCEL */
  cancelBtn: {
    height: 46, borderRadius: 40, marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelTxt: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
