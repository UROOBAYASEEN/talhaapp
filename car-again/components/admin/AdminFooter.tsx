import React from 'react';
import { Image, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PillTabIcon, pillTabStyles } from '@/components/shared/PillTabBar';

type TabName = 'home' | 'partners' | 'ads' | 'payments' | 'actions';

// Same pill bottom bar design as the customer / dealer / insurance panels (Figma)
function img(src: any) {
  return function ImgIcon(c: string) { return <Image source={src} style={{ width: 20, height: 20, tintColor: c }} resizeMode="contain" />; };
}

const TABS: { name: TabName; label: string; route: string; icon: (c: string) => React.ReactNode }[] = [
  { name: 'home',     label: 'Home',     route: '/(admin)',                  icon: c => <MaterialCommunityIcons name="view-dashboard" size={18} color={c} /> },
  { name: 'partners', label: 'Partners', route: '/(admin)/partners',         icon: img(require('@/assets/AdminIcons/partners.png')) },
  { name: 'ads',      label: 'Ads list', route: '/(admin)/approve-listings', icon: img(require('@/assets/AdminIcons/AdsList.png')) },
  { name: 'payments', label: 'Payments', route: '/(admin)/payments',         icon: img(require('@/assets/AdminIcons/Payments.png')) },
  { name: 'actions',  label: 'Actions',  route: '/(admin)/settings',         icon: img(require('@/assets/AdminIcons/Actions.png')) },
];

export default function AdminFooter({ active }: { active: TabName }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[pillTabStyles.bar, { bottom: insets.bottom + 4 }]}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={pillTabStyles.barItem}
          activeOpacity={0.8}
          onPress={() => tab.route && router.replace(tab.route as any)}
        >
          <PillTabIcon label={tab.label} focused={active === tab.name} renderIcon={tab.icon} />
        </TouchableOpacity>
      ))}
    </View>
  );
}
