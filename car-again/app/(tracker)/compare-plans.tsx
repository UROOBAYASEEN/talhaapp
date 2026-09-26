import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, MapPin, MessageCircle, Megaphone,
  Headphones, BarChart3, FileText, GalleryHorizontal,
  Check, ShieldCheck, LayoutDashboard,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;
const { width } = Dimensions.get('window');

interface Row {
  icon: any | null;
  label: string;
  basic: string | null;
  premium: string | null;
  enterprise: string | null;
}

const ROWS: Row[] = [
  { icon: MapPin,            label: 'Active Devices',          basic: 'Up to 5',  premium: 'Up to 20',  enterprise: 'Unlimited'     },
  { icon: MessageCircle,     label: 'Installations / month',   basic: '50',        premium: '200',        enterprise: 'Unlimited'     },
  { icon: Megaphone,         label: 'Ad Placement',            basic: 'Standard',  premium: 'Featured',   enterprise: 'Top Featured'  },
  { icon: Headphones,        label: 'Support',                 basic: 'Chat',      premium: 'Priority',   enterprise: '24/7 Priority' },
  { icon: BarChart3,         label: 'Analytics',               basic: 'Basic',     premium: 'Detailed',   enterprise: 'Advanced'      },
  { icon: FileText,          label: 'Device Reports',          basic: null,        premium: 'check',      enterprise: 'check'         },
  { icon: GalleryHorizontal, label: 'Gallery Photos',          basic: '10',        premium: '20',         enterprise: '50'            },
  { icon: ShieldCheck,       label: 'Verified Tracker Badge',  basic: null,        premium: 'check',      enterprise: 'check'         },
  { icon: LayoutDashboard,   label: 'Custom Tracker Page',     basic: null,        premium: null,         enterprise: 'check'         },
];

function Cell({ value, highlight }: { value: string | null; highlight: boolean }) {
  if (value === 'check') {
    return (
      <View style={[ct.cell, { width: highlight ? 76 : 66 }]}>
        <View style={ct.checkCircle}>
          <LinearGradient
            colors={[NAVY, ORANGE]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Check size={11} color="#fff" strokeWidth={3} />
        </View>
      </View>
    );
  }
  if (value === null) {
    return (
      <View style={[ct.cell, { width: highlight ? 76 : 66 }]}>
        <Text style={ct.dash}>—</Text>
      </View>
    );
  }
  return (
    <View style={[ct.cell, { width: highlight ? 76 : 66 }]}>
      <Text style={[ct.cellTxt, highlight && { color: ORANGE }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function TrackerComparePlansScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <ChevronLeft size={24} color={ORANGE} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Compare Plans</Text>
          <View style={s.iconBtn} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* COLUMN HEADERS */}
          <View style={[s.row, s.headerRow]}>
            <View style={{ flex: 1 }} />

            <View style={[ct.colHeader, { width: 66 }]}>
              <Text style={ct.colLabel}>Basic</Text>
            </View>

            <View style={[ct.colHeader, { width: 76 }]}>
              <LinearGradient
                colors={['rgba(226,103,27,0.18)', 'rgba(226,103,27,0.06)']}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]}
              />
              <Text style={[ct.colLabel, { color: ORANGE, fontSize: 10 }]}>Premium</Text>
              <View style={ct.popularPill}>
                <Text style={ct.popularTxt}>Popular</Text>
              </View>
            </View>

            <View style={[ct.colHeader, { width: 86 }]}>
              <Text style={[ct.colLabel, { fontSize: 10 }]}>Enterprise</Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* ROWS */}
          {ROWS.map((row, i) => (
            <View key={i}>
              <View style={[s.row, i % 2 === 0 && s.rowAlt]}>
                {i % 2 === 0 && (
                  <LinearGradient
                    colors={['rgba(22,64,136,0.1)', 'transparent']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject} pointerEvents="none"
                  />
                )}
                <View style={s.featureCol}>
                  {row.icon && <row.icon size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />}
                  <Text style={[s.featureLabel, !row.icon && { marginLeft: 22 }]} numberOfLines={2}>
                    {row.label}
                  </Text>
                </View>
                <Cell value={row.basic}      highlight={false} />
                <Cell value={row.premium}    highlight={true} />
                <Cell value={row.enterprise} highlight={false} />
              </View>
              <View style={s.rowDivider} />
            </View>
          ))}

          {/* FOOTER NOTE */}
          <View style={s.note}>
            <Text style={s.noteTxt}>
              All plans include VAT. Upgrade anytime.{' '}
              <Text style={{ color: ORANGE }}>Contact support</Text> for Enterprise pricing.
            </Text>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
  iconBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  scroll:      { paddingHorizontal: 16, paddingBottom: 40 },
  headerRow:   { paddingBottom: 10 },
  divider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 4 },
  rowDivider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  row:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, overflow: 'hidden' },
  rowAlt:      { borderRadius: 10 },
  featureCol:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 8 },
  featureLabel:{ flex: 1, color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_500Medium', lineHeight: 17 },
  note:        { marginTop: 24, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.glassBorder, backgroundColor: C.glassBg },
  noteTxt:     { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 18 },
});

const ct = StyleSheet.create({
  colHeader:   { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8, paddingHorizontal: 4, borderRadius: 12, overflow: 'hidden', minHeight: 56, gap: 6 },
  colLabel:    { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  popularPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  popularTxt:  { color: ORANGE, fontSize: 9, fontFamily: 'Poppins_600SemiBold' },
  cell:        { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  cellTxt:     { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_500Medium', textAlign: 'center', lineHeight: 16 },
  dash:        { color: 'rgba(255,255,255,0.25)', fontSize: 16, fontFamily: 'Poppins_400Regular' },
  checkCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
