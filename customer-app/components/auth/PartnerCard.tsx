import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { G, Glass } from '@/components/shared/GlowUI';

// Orange glow glass — partner cards / selected option
export function OrangeGlass({ radius = 16 }: { radius?: number }) {
  return <Glass radius={radius} fill="#0B0E1C" glow="#7A3A14" blur={20} border={['#F28A3E', '#E2671B']} borderWidth={1.3} />;
}

// Orange partner card (Login: "Grow with AutoWizor", Partner Login: "New to AutoWizor?")
export default function PartnerCard({
  icon, title, subtitle, onBecomePartner, onPartnerLogin, compact,
}: {
  icon: ImageSourcePropType;
  title: string;
  subtitle: string;
  onBecomePartner: () => void;
  // Diya ho to neeche "Already a partner? Partner Login" dikhta hai
  onPartnerLogin?: () => void;
  // Kam height — Login screen pe poora content ek screen mein aa jaye
  compact?: boolean;
}) {
  return (
    <View style={[s.card, compact && { paddingTop: 11, paddingBottom: 10 }]}>
      <OrangeGlass radius={16} />
      <View style={s.top}>
        <Image source={icon} style={{ width: compact ? 38 : 42, height: compact ? 38 : 42 }} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <TouchableOpacity style={[s.btn, compact && { height: 40, marginTop: 9 }]} activeOpacity={0.85} onPress={onBecomePartner}>
        <Text style={s.btnTxt}>Become an AutoWizor Partner</Text>
        <Ionicons name="arrow-forward" size={18} color={G.orange} />
      </TouchableOpacity>

      {onPartnerLogin ? (
        <>
          <View style={[s.line, compact && { marginTop: 10 }]} />
          <TouchableOpacity onPress={onPartnerLogin} activeOpacity={0.8}>
            <Text style={[s.footer, compact && { marginTop: 7 }]}>Already a partner?  <Text style={s.footerLink}>Partner Login</Text></Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card:       { borderRadius: 16, overflow: 'hidden', paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14 },
  top:        { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 8 },
  title:      { color: '#FFFFFF', fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  subtitle:   { color: G.muted, fontSize: 12.5, fontFamily: 'Poppins_400Regular', marginTop: -2 },
  btn:        { height: 44, borderRadius: 14, borderWidth: 1.3, borderColor: G.orange, backgroundColor: 'rgba(1,10,31,0.55)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14 },
  btnTxt:     { color: G.orange, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  line:       { height: 1, backgroundColor: G.line, marginTop: 14, marginHorizontal: 6 },
  footer:     { textAlign: 'center', color: G.muted, fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 10 },
  footerLink: { color: '#FFFFFF', fontFamily: 'Poppins_500Medium' },
});
