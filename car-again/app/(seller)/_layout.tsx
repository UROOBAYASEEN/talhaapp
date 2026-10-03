import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { PillTabBarHost, PillTabIcon } from '@/components/shared/PillTabBar';

// Same bottom bar design as the Dealer panel / Figma (components/shared/PillTabBar)
function mci(name: any) {
  return function McIcon(c: string) { return <MaterialCommunityIcons name={name} size={18} color={c} />; };
}
function img(src: any) {
  return function ImgIcon(c: string) { return <Image source={src} style={{ width: 18, height: 18, tintColor: c }} resizeMode="contain" />; };
}
function ion(name: any) {
  return function IonIcon(c: string) { return <Ionicons name={name} size={17} color={c} />; };
}

export default function SellerLayout() {
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => {
    if (user && user.is_active === false) {
      router.replace('/(auth)/suspended' as any);
    }
  }, [user?.is_active]);
  return (
    <Tabs
      tabBar={props => <PillTabBarHost {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: '#010a1f' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <PillTabIcon label="Home" focused={focused} renderIcon={mci('view-dashboard')} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          tabBarIcon: ({ focused }) => <PillTabIcon label="Leads" focused={focused} renderIcon={img(require('@/assets/DealerPanelIcons/leadsTabIcon.png'))} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          tabBarIcon: ({ focused }) => <PillTabIcon label="Inventory" focused={focused} renderIcon={img(require('@/assets/DealerPanelIcons/inventoryTabIcon.png'))} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          tabBarIcon: ({ focused }) => <PillTabIcon label="Plan" focused={focused} renderIcon={img(require('@/assets/DealerPanelIcons/planIcon.png'))} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <PillTabIcon label="Profile" focused={focused} renderIcon={ion('person-outline')} />,
        }}
      />
      {/* hidden tabs */}
      <Tabs.Screen name="my-ads"    options={{ href: null }} />
      <Tabs.Screen name="chats"     options={{ href: null }} />
      <Tabs.Screen name="settings"  options={{ href: null }} />
    </Tabs>
  );
}
