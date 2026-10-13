import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image } from 'react-native';
import { PillTabBarHost, PillTabIcon } from '@/components/shared/PillTabBar';

// Same bottom bar design + colours as the customer side (components/shared/PillTabBar)
function mci(name: any) {
  return function McIcon(c: string) { return <MaterialCommunityIcons name={name} size={18} color={c} />; };
}
// Tab icons from assets/DealerPanelIcons, tinted white / orange like the vector icons
function img(src: any) {
  return function ImgIcon(c: string) { return <Image source={src} style={{ width: 18, height: 18, tintColor: c }} resizeMode="contain" />; };
}
function ion(name: any) {
  return function IonIcon(c: string) { return <Ionicons name={name} size={17} color={c} />; };
}

export default function DealerLayout() {

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
          tabBarIcon: ({ focused }) => (
            <PillTabIcon label="Home" focused={focused} renderIcon={mci('view-dashboard')} />
          ),
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          tabBarIcon: ({ focused }) => (
            <PillTabIcon label="Leads" focused={focused} renderIcon={img(require('@/assets/DealerPanelIcons/leadsTabIcon.png'))} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          tabBarIcon: ({ focused }) => (
            <PillTabIcon label="Inventory" focused={focused} renderIcon={img(require('@/assets/DealerPanelIcons/inventoryTabIcon.png'))} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <PillTabIcon label="Profile" focused={focused} renderIcon={ion('person-outline')} />
          ),
        }}
      />
      {/* hidden tabs — not shown in tab bar */}
      <Tabs.Screen name="quick-actions" options={{ href: null }} />
    </Tabs>
  );
}
