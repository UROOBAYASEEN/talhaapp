import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { PillTabBarHost, PillTabIcon } from '@/components/shared/PillTabBar';

// Same bottom bar design + colours as the customer / dealer / insurance side
function mci(name: any) {
  return function McIcon(c: string) { return <MaterialCommunityIcons name={name} size={18} color={c} />; };
}
function ion(name: any) {
  return function IonIcon(c: string) { return <Ionicons name={name} size={17} color={c} />; };
}
function img(src: any) {
  return function ImgIcon(c: string) { return <Image source={src} style={{ width: 18, height: 18, tintColor: c }} resizeMode="contain" />; };
}

export default function TrackerLayout() {
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => {
    if (user && user.docs_status !== 'approved') {
      router.replace('/(auth)/verification-status' as any);
    }
  }, [user?.docs_status]);
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
        name="tracker"
        options={{
          tabBarIcon: ({ focused }) => (
            <PillTabIcon label="Tracker" focused={focused} renderIcon={mci('shield-search')} />
          ),
        }}
      />
      <Tabs.Screen
        name="claims"
        options={{
          tabBarIcon: ({ focused }) => (
            <PillTabIcon label="Claims" focused={focused} renderIcon={ion('document-text-outline')} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          tabBarIcon: ({ focused }) => (
            <PillTabIcon label="Plan" focused={focused} renderIcon={img(require('@/assets/DealerPanelIcons/planIcon.png'))} />
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
      <Tabs.Screen name="analytics"     options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="advertisement"  options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="special-offer"  options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="video-ads"      options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="clients"        options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="compare-plans"  options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="reviews"        options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="alerts"        options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="claim-detail"   options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="new-tracker"    options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="devices"        options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
