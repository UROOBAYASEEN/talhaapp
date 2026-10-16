import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, AlertTriangle, Info } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;

export default function AdLimitReachedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ plan: string; limit: string; used: string }>();

  const plan  = params.plan  || 'basic';
  const limit = Number(params.limit || 5);
  const used  = Number(params.used  || 5);
  const pct   = Math.min(100, (used / limit) * 100);
  const pendingPayload = params.pendingPayload as string | undefined;
  const vehicleTitle = params.vehicleTitle as string | undefined;
  const vehicleImage = params.vehicleImage as string | undefined;

  const planLabel: Record<string, string> = {
    basic:      'Dealer Basic',
    premium:    'Dealer Premium',
    enterprise: 'Dealer Enterprise',
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={24} color={C.textPrimary} strokeWidth={2}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Vehicle Details</Text>
          <View style={{ width: 36 }}/>
        </View>

        {/* MAIN CARD — bg #010A1F + 4-side shade agents.md */}
        <View style={s.card}>
          <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

          {/* Warning Icon */}
          <View style={s.iconCircle}>
            <AlertTriangle size={30} color={ORANGE} strokeWidth={2.2}/>
          </View>

          {/* Text */}
          <Text style={s.title}>Ad Limit Reached!</Text>
          <Text style={s.body}>
            You've used all {limit} ads included in your current plan.
          </Text>
          <Text style={s.body}>
            You can post another ad by paying a small fee separately or upgrade your plan for more listings.
          </Text>

          {/* Plan card */}
          <View style={s.planCard}>
            <LinearGradient
              colors={['rgba(22,64,136,0.2)','transparent']}
              start={{x:0.5,y:0}} end={{x:0.5,y:0.6}}
              style={StyleSheet.absoluteFillObject} pointerEvents="none"
            />
            <Text style={s.planLabel}>CURRENT PLAN</Text>
            <Text style={s.planName}>{planLabel[plan] ?? 'Dealer Basic'}</Text>

            <View style={s.usageRow}>
              <Text style={s.usageTxt}>{used} / {limit} Ads Used</Text>
            </View>

            {/* Progress bar */}
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${pct}%` }]}>
                <LinearGradient
                  colors={[ORANGE, ORANGE]}
                  start={{x:0,y:0}} end={{x:1,y:0}}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            </View>

            <View style={s.infoRow}>
              <Info size={14} color={ORANGE} fill={ORANGE}/>
              <Text style={s.infoTxt}>No ads remaining</Text>
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={s.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/insurance/payment-summary' as any, params: { type: 'dealer_extra', price: '500', providerName: 'Extra Ad', deviceName: vehicleTitle || 'Dealer Vehicle Listing', vehicle: vehicleTitle || 'Extra Vehicle Listing', deviceImage: vehicleImage || '', pendingPayload: pendingPayload || '' } })}
          >
            <LinearGradient
              colors={[NAVY, ORANGE]}
              start={{x:0,y:0}} end={{x:1,y:0}}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={s.primaryTxt}>Post Extra Ad — PKR 500</Text>
          </TouchableOpacity>

          {/* Upgrade Plan button removed (user request) */}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: 'rgba(1,10,31,1)' },
  container: { flex: 1, backgroundColor: 'rgba(1,10,31,1)' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18, height: 60,
  },
  backBtn:     { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },

  /* CARD — compact height + AGENTS.md */
  card: {
    marginHorizontal: 16, marginTop: 4,
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)',
    backgroundColor: 'rgba(1,6,20,1)',
    overflow: 'hidden', padding: 12,
    paddingBottom: 14,
    alignItems: 'center', gap: 6,
  },

  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1.5, borderColor: ORANGE,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 1,
  },

  title: { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  body:  { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 16, paddingHorizontal: 4 },

  /* PLAN CARD — compact */
  planCard: {
    width: '100%', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden', padding: 10, gap: 4,
  },
  planLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontFamily: 'Poppins_500Medium', letterSpacing: 1.2 },
  planName:  { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  usageRow:  {},
  usageTxt:  { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Poppins_400Regular' },

  progressTrack: { height: 4, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3, overflow: 'hidden' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoTxt: { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_500Medium' },

  /* BUTTONS — as before */
  primaryBtn: {
    width: '100%', height: 54, borderRadius: 30,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  primaryTxt: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

  secondaryBtn: {
    width: '100%', height: 54, borderRadius: 30,
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    marginTop: 8, marginBottom: 8,
  },
  secondaryTxt: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});
