import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { PillTabBarHost, PillTabIcon } from '@/components/shared/PillTabBar';

// Same bottom bar design + colours as the customer / dealer side
function mci(name: any) {
  return function McIcon(c: string) { return <MaterialCommunityIcons name={name} size={18} color={c} />; };
}
function ion(name: any) {
  return function IonIcon(c: string) { return <Ionicons name={name} size={17} color={c} />; };
}

export default function InsuranceProviderLayout() {
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
        name="policies"
        options={{
          tabBarIcon: ({ focused }) => (
            <PillTabIcon label="Policies" focused={focused} renderIcon={mci('shield-search')} />
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
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <PillTabIcon label="Profile" focused={focused} renderIcon={ion('person-outline')} />
          ),
        }}
      />
      <Tabs.Screen name="reviews"       options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="customers"        options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tracker-requests"       options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tracker-request-detail" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="approve-policy"          options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="alerts"                  options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="analytics"     options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="advertisement" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="special-offer" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="video-ads"     options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="settings"      options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
