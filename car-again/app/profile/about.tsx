import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppColors } from '@/constants/theme';

const ORANGE = '#e2671b';

const FEATURES = [
  { icon: 'car-sport-outline',        label: 'Buy & Sell Vehicles',   sub: "Pakistan's largest auto marketplace" },
  { icon: 'chatbubbles-outline',      label: 'Real-time Chat',        sub: 'Connect directly with sellers' },
  { icon: 'shield-checkmark-outline', label: 'Verified Listings',     sub: 'Safe and trusted transactions' },
  { icon: 'business-outline',         label: 'Multiple Role Support', sub: 'Dealers, banks, insurance & more' },
];

const LEGAL = [
  { label: 'Terms of Service' },
  { label: 'Privacy Policy' },
  { label: 'Cookie Policy' },
];

export default function AboutScreen() {
  const router = useRouter();
  const T      = useAppColors();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: T.bg }]}>
      <View style={[s.header, { borderBottomColor: T.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { backgroundColor: T.glassBg }]}>
          <Ionicons name="arrow-back" size={22} color={T.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: T.textPrimary }]}>About Autowizor</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <LinearGradient colors={['#032a69', ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.logoBanner}>
          <View style={s.logoCircle}>
            <Ionicons name="car-sport" size={38} color="#f9fafc" />
          </View>
          <Text style={s.appName}>Autowizor</Text>
          <Text style={s.tagline}>Pakistan's First Integrated Auto Ecosystem</Text>
          <View style={s.versionBadge}>
            <Text style={s.versionTxt}>Version 1.0.0</Text>
          </View>
        </LinearGradient>

        <View style={[s.card, { backgroundColor: T.glassBg, borderColor: T.glassBorder }]}>
          <Text style={[s.cardTitle, { color: T.textPrimary }]}>Our Mission</Text>
          <Text style={[s.cardBody, { color: T.textSecondary }]}>
            Autowizor is building Pakistan's most trusted and comprehensive automotive ecosystem —
            connecting buyers, sellers, dealers, banks, insurance providers, and tracker services
            in one seamless platform.
          </Text>
        </View>

        <Text style={[s.sectionLabel, { color: T.textSecondary }]}>KEY FEATURES</Text>
        <View style={[s.card, { backgroundColor: T.glassBg, borderColor: T.glassBorder }]}>
          {FEATURES.map((f, i) => (
            <View key={f.label}>
              <View style={s.featureRow}>
                <View style={s.iconWrap}><Ionicons name={f.icon as any} size={20} color={ORANGE} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.featureLabel, { color: T.textPrimary }]}>{f.label}</Text>
                  <Text style={[s.featureSub, { color: T.textSecondary }]}>{f.sub}</Text>
                </View>
              </View>
              {i < FEATURES.length - 1 && <View style={[s.sep, { backgroundColor: T.divider }]} />}
            </View>
          ))}
        </View>

        <Text style={[s.sectionLabel, { color: T.textSecondary }]}>LEGAL</Text>
        <View style={[s.card, { backgroundColor: T.glassBg, borderColor: T.glassBorder }]}>
          {LEGAL.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity style={s.legalRow} onPress={() => Alert.alert(item.label, 'Coming soon')} activeOpacity={0.8}>
                <Text style={[s.legalLabel, { color: T.textPrimary }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={T.textSecondary} />
              </TouchableOpacity>
              {i < LEGAL.length - 1 && <View style={[s.sep, { backgroundColor: T.divider }]} />}
            </View>
          ))}
        </View>

        <View style={s.footer}>
          <Text style={[s.footerTxt, { color: T.textSecondary }]}>Made with ❤️ in Pakistan</Text>
          <Text style={[s.footerSub, { color: T.textSecondary }]}>© 2025 Autowizor. All rights reserved.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#010a1f' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  backBtn:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  scroll:      { padding: 16, gap: 14, paddingBottom: 40 },
  sectionLabel:{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1.2 },
  logoBanner:  { borderRadius: 20, padding: 28, alignItems: 'center', gap: 10 },
  logoCircle:  { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  appName:     { fontSize: 28, fontFamily: 'Poppins_700Bold', color: '#f9fafc' },
  tagline:     { fontSize: 13, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  versionBadge:{ paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  versionTxt:  { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#f9fafc' },
  card:        { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardTitle:   { fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 8 },
  cardBody:    { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  iconWrap:    { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(226,103,27,0.12)', alignItems: 'center', justifyContent: 'center' },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  featureLabel:{ fontSize: 14, fontFamily: 'Poppins_500Medium' },
  featureSub:  { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  sep:         { height: 0.5, marginVertical: 2 },
  legalRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  legalLabel:  { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  footer:      { alignItems: 'center', gap: 4, paddingVertical: 16 },
  footerTxt:   { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  footerSub:   { fontSize: 12, fontFamily: 'Poppins_400Regular' },
});
