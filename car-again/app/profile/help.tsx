import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppColors } from '@/constants/theme';

const BG     = '#010a1f';
const ORANGE = '#e2671b';
const WHITE  = '#f9fafc';
const SUB    = '#baacb6';
const BORDER = 'rgba(49,95,173,0.8)';
const CARD   = 'rgba(6,17,60,0.85)';
const SHADOW = '#1D53AF';

const FAQS = [
  { q: 'How do I post a vehicle listing?',  a: 'Tap the "Sell" tab, fill in your vehicle details, upload photos, and tap "Publish Listing".' },
  { q: 'How do I contact a seller?',        a: 'Open any vehicle listing and tap the "Chat" or "Call" button to connect with the seller.' },
  { q: 'Is Autowizor free to use?',         a: 'Basic listings and browsing are completely free. Premium features may have plans.' },
  { q: 'How do I save a vehicle?',          a: 'Tap the heart icon on any vehicle card or detail page to save it to your favourites.' },
  { q: 'How do I verify my account?',       a: 'After registration, enter the OTP sent to your phone or email to verify your account.' },
];

const CONTACT = [
  { icon: 'mail-outline',  label: 'Email Support', value: 'support@autowizor.pk', onPress: () => Linking.openURL('mailto:support@autowizor.pk') },
  { icon: 'call-outline',  label: 'Call Us',       value: '+92 300 0000000',       onPress: () => Linking.openURL('tel:+923000000000') },
  { icon: 'logo-whatsapp', label: 'WhatsApp',      value: 'Chat on WhatsApp',      onPress: () => Alert.alert('WhatsApp', 'Coming soon') },
];

export default function HelpScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: aC.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={aC.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: aC.textPrimary }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={[s.scrollView, { backgroundColor: aC.bg }]} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <LinearGradient colors={['#032a69', '#061b4a']} style={s.banner}>
          <View style={s.bannerIcon}>
            <Ionicons name="headset-outline" size={36} color={ORANGE} />
          </View>
          <Text style={s.bannerTitle}>How can we help?</Text>
          <Text style={s.bannerSub}>Our support team is here for you</Text>
        </LinearGradient>

        {/* Contact Us */}
        <Text style={s.sectionLabel}>CONTACT US</Text>
        <View style={s.card}>
          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          {CONTACT.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity style={s.contactRow} onPress={item.onPress} activeOpacity={0.8}>
                <View style={s.iconWrap}>
                  <Ionicons name={item.icon as any} size={20} color={ORANGE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.contactLabel}>{item.label}</Text>
                  <Text style={s.contactValue}>{item.value}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={SUB} />
              </TouchableOpacity>
              {i < CONTACT.length - 1 && <View style={s.sep} />}
            </View>
          ))}
        </View>

        {/* FAQ */}
        <Text style={s.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={s.card}>
          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          {FAQS.map((faq, i) => (
            <View key={i}>
              <TouchableOpacity
                style={s.faqRow}
                onPress={() => setExpanded(expanded === i ? null : i)}
                activeOpacity={0.8}
              >
                <Text style={s.faqQ}>{faq.q}</Text>
                <Ionicons
                  name={expanded === i ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={SUB}
                />
              </TouchableOpacity>
              {expanded === i && <Text style={s.faqA}>{faq.a}</Text>}
              {i < FAQS.length - 1 && <View style={s.sep} />}
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: BG },
  scrollView:   { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(49,95,173,0.4)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: CARD,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: WHITE,
  },

  scroll:       { padding: 16, gap: 14 },

  banner: {
    borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 8,
  },
  bannerIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(226,103,27,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: WHITE },
  bannerSub:   { fontSize: 13, fontFamily: 'Poppins_400Regular', color: SUB, textAlign: 'center' },

  sectionLabel: {
    fontSize: 11, fontFamily: 'Poppins_600SemiBold',
    color: SUB, letterSpacing: 1.2,
  },

  card: {
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)',
    backgroundColor: 'rgba(3,12,40,0.6)',
    overflow: 'hidden',
  },

  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(226,103,27,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  contactRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  contactLabel: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: WHITE },
  contactValue: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: SUB, marginTop: 1 },

  sep: { height: 0.5, backgroundColor: 'rgba(49,95,173,0.4)', marginHorizontal: 16 },

  faqRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
  faqQ:   { flex: 1, fontSize: 14, fontFamily: 'Poppins_500Medium', color: WHITE },
  faqA:   { fontSize: 13, fontFamily: 'Poppins_400Regular', color: SUB, paddingHorizontal: 16, paddingBottom: 16, lineHeight: 20 },
});
