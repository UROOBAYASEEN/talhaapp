/**
 * Tab layout — Figma exact (node 2095:10052)
 * Pill bar: bg #061b4a, rounded-32, h=63, bottom=10, mx=10
 * Active icon: gradient circle (navy→transparent navy→orange) + orange border 47×47
 * 6 tabs: Home · Chat · Buy · Sell · My Ads · Profile
 * Sell tab: custom button — directly opens /vehicle/create (no black screen flash)
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

function TabIcon({
  name,
  label,
  focused,
}: {
  name: any;
  label: string;
  focused: boolean;
}) {
  const C = useAppColors();
  const inactiveColor = C.isDark ? '#f9fafc' : '#032a69';
  const labelColor = C.isDark ? '#f9fafc' : '#032a69';
  if (focused) {
    return (
      <LinearGradient
        colors={['#032a69', 'rgba(3,42,105,0.36)', '#e2671b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.iconActive}
      >
        <Ionicons name={name} size={16} color="#f9fafc" />
        <Text style={[styles.label, { color: '#f9fafc' }]}>{label}</Text>
      </LinearGradient>
    );
  }
  return (
    <View style={styles.iconInactive}>
      <Ionicons name={name} size={16} color={inactiveColor} />
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

// Sell tab — straight line — minus sign for Sell
function SellTabButton({ style }: { style?: any }) {
  const router = useRouter();
  const C = useAppColors();
  const color = C.isDark ? '#f9fafc' : '#032a69';
  return (
    <TouchableOpacity
      style={[styles.sellBtnWrap, style]}
      onPress={() => router.push('/vehicle/create')}
      activeOpacity={0.8}
    >
      <View style={styles.iconInactive}>
        <Ionicons name="remove-outline" size={16} color={color} />
        <Text style={[styles.label, { color }]}>Sell</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { user } = useAuth();
  const router   = useRouter();
  const C = useAppColors();

  useEffect(() => {
    if (user?.role === 'dealership_owner') {
      router.replace('/(dealer)' as any);
    }
  }, [user]);

  // Don't render customer tabs for dealers at all
  if (user?.role === 'dealership_owner') return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: C.isDark ? '#032a69' : '#ffffff', borderColor: C.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', borderWidth: C.isDark ? 0 : 1, shadowColor: C.isDark ? '#000' : 'rgba(3,42,105,0.18)', shadowOpacity: C.isDark ? 0.35 : 0.12, elevation: 10 }],
        tabBarActiveTintColor: '#e2671b',
        tabBarInactiveTintColor: C.isDark ? '#f9fafc' : '#032a69',
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'chatbubble' : 'chatbubble-outline'} label="Chat" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="add-outline" label="Buy" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          // Override the tab button entirely — no screen render, direct navigation
          tabBarButton: (props) => <SellTabButton style={props.style} />,
        }}
      />
      <Tabs.Screen
        name="sellers"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'megaphone' : 'megaphone-outline'} label="Ads" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: '#061b4a',
    borderTopWidth: 0,
    borderRadius: 32,
    height: 63,
    bottom: 10,
    left: 10,
    right: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  iconActive: {
    width: 47,
    height: 47,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e2671b',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconInactive: {
    width: 47,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 8,
    fontFamily: 'Poppins_500Medium',
    color: '#f9fafc',
  },
  sellBtnWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -6 }],
  },
});
