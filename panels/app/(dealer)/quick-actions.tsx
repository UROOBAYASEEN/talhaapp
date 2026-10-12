import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { useTabBarSpace } from '@/components/shared/PillTabBar';

const { width: W } = Dimensions.get('window');
const ORANGE = '#e2671b';
const C = AppColors;

const ACTIONS = [
  {
    icon: 'add-circle-outline',
    label: 'Add Vehicle',
    desc: 'List a new vehicle in your inventory',
    color: '#34c759',
    route: '/dealer-panel/add-vehicle',
  },
  {
    icon: 'calendar-outline',
    label: 'Reservations',
    desc: 'View and manage vehicle reservations',
    color: '#4fc3f7',
    route: '/(dealer)/leads',
    params: { tab: 'Reservation' },
  },
  {
    icon: 'people-outline',
    label: 'Customers',
    desc: 'Manage your customer relationships',
    color: '#a78bfa',
    route: '/dealer-panel/customers',
  },
  {
    icon: 'card-outline',
    label: 'Subscription',
    desc: 'Upgrade or manage your plan',
    color: ORANGE,
    route: '/dealer-panel/subscription',
  },
  {
    icon: 'megaphone-outline',
    label: 'Promote Vehicle',
    desc: 'Boost your listing for more visibility',
    color: '#f59e0b',
    route: '/dealer-panel/promote-vehicle',
  },
  {
    icon: 'videocam-outline',
    label: 'Add Video Ads',
    desc: 'Showcase your vehicles with video',
    color: '#ef4444',
    route: '/dealer-panel/video-ads',
  },
  {
    icon: 'pricetag-outline',
    label: 'Special Offer',
    desc: 'Create banners and special deals',
    color: '#06b6d4',
    route: '/dealer-panel/special-offer',
  },
  {
    icon: 'tv-outline',
    label: 'Advertisement',
    desc: 'Run homepage and featured ads',
    color: '#84cc16',
    route: '/dealer-panel/advertisement',
  },
];

function ActionCard({ action }: { action: typeof ACTIONS[0] }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={ac.card}
      onPress={() =>
        router.push(
          (action as any).params
            ? ({ pathname: action.route, params: (action as any).params } as any)
            : (action.route as any),
        )
      }
      activeOpacity={0.82}
    >
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      <View style={[ac.iconBox, { backgroundColor: action.color + '1A' }]}>
        <Ionicons name={action.icon as any} size={26} color={action.color} />
      </View>
      <Text style={ac.label}>{action.label}</Text>
      <Text style={ac.desc} numberOfLines={2}>{action.desc}</Text>

      <View style={ac.arrow}>
        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" />
      </View>
    </TouchableOpacity>
  );
}

const ac = StyleSheet.create({
  card:   { width: (W - 44) / 2, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: C.glassBg, overflow: 'hidden', padding: 16, gap: 6, position: 'relative' },
  iconBox:{ width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  label:  { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  desc:   { fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.textSecondary, lineHeight: 15 },
  arrow:  { position: 'absolute', top: 12, right: 12 },
});

export default function QuickActionsScreen() {
  const tabSpace = useTabBarSpace(100);
  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <Text style={s.title}>Quick Actions</Text>
          <Text style={s.sub}>Manage your dealership operations</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.grid, { paddingBottom: tabSpace }]}>
        {ACTIONS.map(a => (
          <ActionCard key={a.label} action={a} />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingVertical: 20 },
  title:  { fontSize: 22, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  sub:    { fontSize: 13, fontFamily: 'Poppins_400Regular', color: C.textSecondary, marginTop: 2 },
  grid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingBottom: 100 },
});
