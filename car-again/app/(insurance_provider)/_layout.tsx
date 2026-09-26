import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  DollarSign,
  User,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { StyleSheet, Text, View } from 'react-native';

const ORANGE = '#e2671b';

function TabIcon({ Icon, label, focused }: { Icon: any; label: string; focused: boolean }) {
  if (focused) {
    return (
      <LinearGradient
        colors={['#032a69', 'rgba(3,42,105,0.36)', '#e2671b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.iconActive}
      >
        <Icon size={15} color="#fff" />
        <Text style={styles.labelActive}>{label}</Text>
      </LinearGradient>
    );
  }
  return (
    <View style={styles.iconInactive}>
      <Icon size={15} color="#9ca8c0" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
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
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        sceneStyle: { backgroundColor: '#010a1f' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={LayoutDashboard} label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="policies"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={ShieldCheck} label="Policies" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="claims"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={FileText} label="Claims" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={DollarSign} label="Plan" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={User} label="Profile" focused={focused} />
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

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: '#061B4A',
    borderTopWidth: 0,
    borderRadius: 32,
    height: 60,
    bottom: 18,
    left: 10,
    right: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  iconActive: {
    width: 48,
    height: 47,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconInactive: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  labelActive: { fontSize: 7, color: '#fff', fontFamily: 'Poppins_500Medium' },
  label: { fontSize: 8, color: '#9ca8c0', marginTop: 4, fontFamily: 'Poppins_500Medium' },
});
