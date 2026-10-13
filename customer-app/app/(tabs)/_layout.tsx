/**
 * Tab layout — Figma exact (node 2095:10052)
 * Pill bar: bg #061b4a, rounded-32, h=63, bottom=10, mx=10
 * Active icon: gradient circle (navy→transparent navy→orange) + orange border 47×47
 * 6 tabs: Home · Chat · Buy · Sell · My Ads · Profile
 * Sell tab: custom button — directly opens /vehicle/create (no black screen flash)
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '@/constants/theme';
import { useAndroidKeyboardHeight } from '@/hooks/use-android-keyboard-height';

// Figma bottom bar (exact colours sampled from the design):
// bar #071C49 · active circle navy → orange with orange ring · white outline icons,
// active icon orange · white labels.
const BAR_BG = '#071C49';

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
  // Light mode (Figma): light-grey circle, navy → orange ring, orange icon + label
  if (focused && !C.isDark) {
    return (
      // Ring: navy on top fading to orange at the bottom (Figma light)
      <LinearGradient
        colors={['#0A2A66', '#0A2A66', '#E2671B']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.activeRing, { padding: 1.5 }]}
      >
        <View style={[styles.iconActive, { backgroundColor: '#E8EAEF' }]}>
          <Ionicons name={name} size={17} color="#E2671B" />
          <Text style={[styles.label, { color: '#E2671B' }]}>{label}</Text>
        </View>
      </LinearGradient>
    );
  }
  if (focused) {
    return (
      <LinearGradient
        // Ring: orange on top fading to blue at the bottom (Figma)
        colors={['#E2671B', '#9E5536', '#4A3D4F', '#2A4A8F']}
        locations={[0, 0.3, 0.62, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.activeRing}
      >
        <LinearGradient
          colors={['#072B64', '#072356', '#0C2454', '#3C3448', '#634040', '#A55531', '#CD612C']}
          locations={[0, 0.3, 0.4, 0.6, 0.72, 0.86, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.iconActive}
        >
          <Ionicons name={name} size={17} color="#E2671B" />
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      </LinearGradient>
    );
  }
  return (
    <View style={styles.iconInactive}>
      <Ionicons name={name} size={17} color="#FFFFFF" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

// Sell tab — straight line — minus sign for Sell
function SellTabButton({ style }: { style?: any }) {
  const router = useRouter();
  const color = '#FFFFFF';
  return (
    <TouchableOpacity
      style={[styles.sellBtnWrap, style]}
      onPress={() => router.push('/vehicle/create')}
      activeOpacity={0.8}
    >
      <View style={styles.iconInactive}>
        <Ionicons name="remove-circle-outline" size={17} color={color} />
        <Text style={[styles.label, { color }]}>Sell</Text>
      </View>
    </TouchableOpacity>
  );
}

// Custom bar (Figma): rounded pill, 6 equal-width tabs, every tab centred vertically and
// horizontally. Sits just above the device's back/home buttons.
const BAR_H = 60;
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  // Android: keyboard khula ho to floating tab bar keyboard ke upar na aaye
  const keyboardH = useAndroidKeyboardHeight();
  const C = useAppColors();
  if (keyboardH > 0) return null;
  return (
    <View style={[styles.bar, { bottom: insets.bottom + 4 }, !C.isDark && { backgroundColor: '#1F3F7A' }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        if (route.name === 'sell') {
          return <SellTabButton key={route.key} style={styles.barItem} />;
        }
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <TouchableOpacity key={route.key} style={styles.barItem} activeOpacity={0.8} onPress={onPress}>
            {options.tabBarIcon?.({ focused, color: focused ? '#e2671b' : '#FFFFFF', size: 17 })}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const C = useAppColors();

  // Customer app — every logged-in role uses the customer tabs
  // (sellers switch to their panel from settings / Become a Seller)

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#e2671b',
        tabBarInactiveTintColor: '#FFFFFF',
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chatbubble-ellipses-outline" label="Chat" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="add-circle-outline" label="Buy" focused={focused} />
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
            <TabIcon name="megaphone-outline" label="Ads" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person-outline" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: BAR_H,
    borderRadius: BAR_H / 2,
    backgroundColor: BAR_BG,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  barItem: {
    flex: 1,
    height: BAR_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRing: {
    width: 47,
    height: 47,
    borderRadius: 23.5,
    padding: 1.8,
  },
  iconActive: {
    flex: 1,
    borderRadius: 23.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconInactive: {
    width: 47,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 8.5,
    fontFamily: 'Poppins_500Medium',
    color: '#FFFFFF',
  },
  sellBtnWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
