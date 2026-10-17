import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthGlowBackground from '@/components/auth/AuthGlowBackground';
import { OrangeGlass } from '@/components/auth/PartnerCard';
import { G, Glass, GradientButton, ScreenHeader } from '@/components/shared/GlowUI';

const OPTIONS = [
  { key: 'new_seller',      title: 'New Seller',      desc: 'Starting your first\nautomotive business.',      icon: require('@/assets/Icons/new-seller-storefront.png') },
  { key: 'non_dealer',      title: 'Non-Dealer',      desc: 'Selling independently,\nwithout a dealership.',  icon: require('@/assets/Icons/non-dealer.png') },
  { key: 'official_dealer', title: 'Official Dealer', desc: 'Representing an authorized\nbrand dealership.',  icon: require('@/assets/Icons/official-dealer.png') },
];

export default function PartnerRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string>('new_seller');

  return (
    <AuthGlowBackground>
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        <ScreenHeader logo />
        <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: 24 + (Platform.OS === 'ios' ? insets.bottom : 0) }]} showsVerticalScrollIndicator={false}>
          <Text style={s.eyebrow}>PARTNER REGISTRATION</Text>
          <Text style={s.title}>Start your seller journey</Text>
          <Text style={s.subtitle}>Choose the option that best describes you.</Text>

          <View style={{ gap: 14 }}>
            {OPTIONS.map(o => {
              const on = selected === o.key;
              return (
                <TouchableOpacity key={o.key} style={s.option} activeOpacity={0.88} onPress={() => setSelected(o.key)}>
                  {on ? <OrangeGlass radius={16} /> : <Glass radius={16} />}
                  <Image source={o.icon} style={{ width: 44, height: 44 }} resizeMode="contain" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.optTitle}>{o.title}</Text>
                    <Text style={s.optDesc}>{o.desc}</Text>
                  </View>
                  <View style={[s.radio, on && { borderColor: G.orange }]}>
                    {on && <View style={s.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <GradientButton title="Continue" height={50} fontSize={17} style={{ marginTop: 28 }} onPress={() => router.push({ pathname: '/(auth)/register', params: { from: 'partner', partnerType: selected } } as any)} />

          <TouchableOpacity onPress={() => router.push('/(auth)/partner-login' as any)} style={{ marginTop: 22 }} activeOpacity={0.8}>
            <Text style={s.footer}>Already a partner?  <Text style={s.footerLink}>Partner Login</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </AuthGlowBackground>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1 },
  scroll:     { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24 },
  eyebrow:    { color: G.orange, fontSize: 12, fontFamily: 'Poppins_500Medium', letterSpacing: 0.8, marginTop: 14 },
  title:      { color: '#FFFFFF', fontSize: 24, fontFamily: 'Poppins_600SemiBold', marginTop: 4 },
  subtitle:   { color: G.muted, fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 2, marginBottom: 18 },
  option:     { borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 18, paddingVertical: 16 },
  optTitle:   { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  optDesc:    { color: G.muted, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18, marginTop: 2 },
  radio:      { width: 24, height: 24, borderRadius: 12, borderWidth: 1.6, borderColor: '#A9B4D0', alignItems: 'center', justifyContent: 'center' },
  radioDot:   { width: 12, height: 12, borderRadius: 6, backgroundColor: G.orange },
  footer:     { textAlign: 'center', color: G.muted, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  footerLink: { color: '#FFFFFF', fontFamily: 'Poppins_500Medium' },
});
