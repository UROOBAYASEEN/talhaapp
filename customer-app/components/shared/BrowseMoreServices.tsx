import LightGradientBorder from '@/components/shared/LightGradientBorder';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppColors } from '@/constants/theme';

const WHITE    = '#f9fafc';
const SUBTITLE = '#baacb6';
const ORANGE   = '#e2671b';
const DARK_NAV = '#061b4a';

const SERVICES = [
  {
    icon: 'business-outline' as const,
    title: 'Apply for Auto Financing',
    sub: 'Submit your financing application online in just a few easy steps.',
    route: '/(tabs)/sellers',
    params: { role: 'bank_representative' },
    serviceRoute: '/auto-financing',
  },
  {
    icon: 'location-outline' as const,
    title: 'Get an Installation Tracker for Your Vehicle',
    sub: 'Compare Prices and Schedule Installation.',
    route: '/(tabs)/sellers',
    params: { role: 'tracker_provider' },
    serviceRoute: '/tracker-search',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Protect Your Vehicle with Insurance',
    sub: 'Pick the Right Coverage and Get Insured Easily.',
    route: '/(tabs)/sellers',
    params: { role: 'insurance_provider' },
    serviceRoute: '/insurance-search',
  },
];

// directRoutes: card seedha us service ki screen kholta hai (Home). Baaki screens purana behaviour rakhti hain.
export default function BrowseMoreServices({ hideIconCircle = false, directRoutes = false }: { hideIconCircle?: boolean; directRoutes?: boolean }) {
  const router = useRouter();
  const C = useAppColors();

  return (
    <View style={s.wrap}>
      <Text style={[s.heading, { color: C.textPrimary }]}>Browse More Services</Text>

      {SERVICES.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={[s.item, { backgroundColor: C.isDark ? '#061B4A' : '#F5F6F8', borderColor: C.isDark ? 'rgba(100,160,255,0.15)' : 'transparent', borderWidth: C.isDark ? 1 : 0 }, !C.isDark && { borderRadius: 18 }]}
          activeOpacity={0.84}
          onPress={() => directRoutes ? router.push(item.serviceRoute as any) : router.push({ pathname: item.route as any, params: item.params })}
        >
          {!C.isDark && <LightGradientBorder radius={18} fill="#F5F6F8" />}
          <View style={[s.iconWrap, hideIconCircle ? { backgroundColor: 'transparent', borderWidth: 0 } : { backgroundColor: C.isDark ? DARK_NAV : '#e8eeff', borderColor: C.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,12,40,0.1)' }]}>
            <Ionicons name={item.icon} size={22} color={ORANGE} />
          </View>
          <View style={s.txt}>
            <Text style={[s.title, { color: C.textPrimary }]}>{item.title}</Text>
            <Text style={[s.sub, { color: C.textSecondary }]}>{item.sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={C.isDark ? 18 : 22} color={C.isDark ? ORANGE : '#000000'} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { marginTop: 20 },
  heading: { color: WHITE, fontSize: 16, fontFamily: 'Poppins_500Medium', textTransform: 'capitalize', marginBottom: 12 },

  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: DARK_NAV, borderRadius: 16,
    paddingHorizontal: 17, paddingVertical: 12, marginBottom: 10,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: DARK_NAV,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  txt:   { flex: 1 },
  title: { color: WHITE,    fontSize: 12, fontFamily: 'Poppins_500Medium' },
  sub:   { color: SUBTITLE, fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 14 },
});
