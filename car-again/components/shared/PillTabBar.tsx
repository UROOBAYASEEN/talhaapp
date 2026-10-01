// Figma bottom bar shared by the customer and dealer tab layouts.
// bar #071C49 · rounded pill · equal-width, centred tabs · active = navy→orange circle with an
// orange→blue ring, orange icon · white labels. Sits just above the device's back/home buttons.
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BAR_BG = '#071C49';
const BAR_H = 60;
export const TAB_ORANGE = '#E2671B';

// renderIcon receives the icon colour (orange when active, white otherwise)
export function PillTabIcon({
  label, focused, renderIcon,
}: { label: string; focused: boolean; renderIcon: (color: string) => React.ReactNode }) {
  if (focused) {
    return (
      <LinearGradient
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
          {renderIcon(TAB_ORANGE)}
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      </LinearGradient>
    );
  }
  return (
    <View style={styles.iconInactive}>
      {renderIcon('#FFFFFF')}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

// `custom` lets a layout replace a route's button (e.g. customer "Sell" opens a screen directly).
export function PillTabBar({
  state, descriptors, navigation, custom,
}: BottomTabBarProps & { custom?: Record<string, (style: any) => React.ReactNode> }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { bottom: insets.bottom + 4 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        // hidden routes (href: null) and screens that hide the bar
        if ((options.tabBarItemStyle as any)?.display === 'none') return null;
        if (custom?.[route.name]) return <React.Fragment key={route.key}>{custom[route.name](styles.barItem)}</React.Fragment>;
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <TouchableOpacity key={route.key} style={styles.barItem} activeOpacity={0.8} onPress={onPress}>
            {options.tabBarIcon?.({ focused, color: focused ? TAB_ORANGE : '#FFFFFF', size: 17 })}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// A focused route can hide the bar with tabBarStyle: { display: 'none' }
export function PillTabBarHost(props: BottomTabBarProps & { custom?: Record<string, (style: any) => React.ReactNode> }) {
  const focused = props.state.routes[props.state.index];
  const style = props.descriptors[focused.key]?.options.tabBarStyle as any;
  if (style?.display === 'none') return null;
  return <PillTabBar {...props} />;
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
  barItem: { flex: 1, height: BAR_H, alignItems: 'center', justifyContent: 'center' },
  activeRing: { width: 47, height: 47, borderRadius: 23.5, padding: 1.8 },
  iconActive: { flex: 1, borderRadius: 23.5, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconInactive: { width: 47, height: 47, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 8.5, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
});

export const pillTabStyles = styles;
