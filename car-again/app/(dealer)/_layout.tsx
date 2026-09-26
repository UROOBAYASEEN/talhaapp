import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import {
  Package,
  MessageCircle,
  Car,
  WalletCards,
  User,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#ff6900';

function TabIcon({
  Icon,
  label,
  focused,
}: {
  Icon: any;
  label: string;
  focused: boolean;
}) {
  if (focused) {
    return (
      <View style={styles.activeWrap}>
        <LinearGradient
          colors={['#032a69', 'rgba(3,42,105,0.36)', '#e2671b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.iconActive}
        >
          <Icon size={15} color="#fff" />
          <Text style={styles.labelActive}>{label}</Text>
        </LinearGradient>
      </View>
    );
  }
  return (
    <View style={styles.iconInactive}>
      <Icon size={15} color="#9ca8c0" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function DealerLayout() {
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
            <TabIcon Icon={Package} label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={MessageCircle} label="Leads" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Car} label="Inventory" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={WalletCards} label="Plan" focused={focused} />
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
      {/* hidden tabs — not shown in tab bar */}
      <Tabs.Screen name="quick-actions" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'rgba(3,12,40,0.96)',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    height: 59,
    bottom: 10,
    left: 18,
    right: 18,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  activeWrap: { alignItems: 'center', justifyContent: 'center' },
  iconActive: {
    width: 47,
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
