import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';

const ORANGE = AppColors.gradientEnd;
const C      = AppColors;

const ROWS = [
  { icon: '🚗', title: 'Active Vehicle\nListings',       basic: 'Up to 5',  premium: 'Up to 20', pro: 'Unlimited' },
  { icon: '●●', title: 'Enquiries / month',              basic: '50',       premium: '200',      pro: 'Unlimited' },
  { icon: '⚑',  title: 'Ad Placement',                  basic: 'Standard', premium: 'Featured', pro: 'Top\nFeatured' },
  { icon: '♧',  title: 'Support',                        basic: 'Chat',     premium: 'Priority', pro: '24/7\nPriority' },
  { icon: '▥',  title: 'Analytics',                      basic: 'Basic',    premium: 'Detailed', pro: 'Advanced' },
  { icon: '▤',  title: 'Brochure Upload',                basic: '—',        premium: '✓',        pro: '✓' },
  { icon: '▣',  title: 'Gallery Photos',                 basic: '10',       premium: '20',       pro: '50' },
  { icon: '',   title: 'Verified Dealer\nBadge',         basic: '—',        premium: '✓',        pro: '✓' },
  { icon: '',   title: 'Custom\nDealership Page',        basic: '—',        premium: '—',        pro: '✓' },
];

function ComparisonRow({ icon, title, basic, premium, pro }: any) {
  const isPremiumCheck = premium === '✓';
  const isProCheck     = pro === '✓';

  return (
    <View style={s.row}>
      <LinearGradient colors={['rgba(22,64,136,0.08)', 'transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <View style={s.featureCol}>
        {icon ? <Text style={s.rowIcon}>{icon}</Text> : <View style={s.iconGap}/>}
        <Text style={s.featureTxt}>{title}</Text>
      </View>
      <View style={s.planCol}>
        <Text style={s.valueTxt}>{basic}</Text>
      </View>
      <View style={s.planCol}>
        <Text style={[s.valueTxt, isPremiumCheck ? s.checkOrange : s.orangeVal]}>{premium}</Text>
      </View>
      <View style={s.planCol}>
        <Text style={[s.valueTxt, isProCheck ? s.checkWhite : undefined]}>{pro}</Text>
      </View>
    </View>
  );
}

export default function ComparePlansScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={24} color={C.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Compare Plans</Text>
          <View style={s.backBtn} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* TABLE HEADER */}
          <View style={s.tableHeader}>
            <LinearGradient colors={['rgba(22,64,136,0.25)', 'transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <View style={s.featureCol} />
            <View style={s.planCol}>
              <Text style={s.planTxt}>Basic</Text>
            </View>
            <View style={s.planCol}>
              <Text style={[s.planTxt, { color: ORANGE }]}>Premium</Text>
            </View>
            <View style={s.planCol}>
              <Text style={s.planTxt}>Pro</Text>
            </View>
          </View>

          {/* ROWS */}
          {ROWS.map((r, i) => (
            <ComparisonRow key={i} {...r} />
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, height: 60 },
  backBtn:     { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },

  scroll: { paddingBottom: 30 },

  tableHeader: {
    flexDirection: 'row', alignItems: 'center', minHeight: 52,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 18, overflow: 'hidden',
  },
  planTxt: { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },

  row: {
    flexDirection: 'row', minHeight: 64, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 18, overflow: 'hidden',
  },

  featureCol: { width: '40%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  planCol:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  rowIcon:    { fontSize: 16, color: C.textPrimary, width: 24, textAlign: 'center' },
  iconGap:    { width: 24 },
  featureTxt: { flex: 1, color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_600SemiBold', lineHeight: 16 },

  valueTxt:   { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 16 },
  orangeVal:  { color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  checkOrange:{ color: ORANGE, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  checkWhite: { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_700Bold' },
});
