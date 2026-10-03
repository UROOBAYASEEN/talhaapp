// Figma auth background — used by every auth screen.
// Base #010A1F with two soft #02123D glows: right side (~40% height) and bottom-left corner.
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop } from 'react-native-svg';

export const AUTH_BG = '#010A1F';
export const AUTH_GLOW = '#02123D';

export default function AuthGlowBackground({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  return (
    <View
      style={[styles.root, style]}
      onLayout={e => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <StatusBar style="light" />
      {size && (
        <Svg style={StyleSheet.absoluteFill} width={size.w} height={size.h} pointerEvents="none">
          <Defs>
            <RadialGradient id="authGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={AUTH_GLOW} stopOpacity="1" />
              <Stop offset="0.45" stopColor={AUTH_GLOW} stopOpacity="0.7" />
              <Stop offset="1" stopColor={AUTH_GLOW} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill={AUTH_BG} />
          {/* Right-side glow */}
          <Ellipse cx={size.w * 0.84} cy={size.h * 0.41} rx={size.w * 0.52} ry={size.h * 0.24} fill="url(#authGlow)" />
          {/* Bottom-left glow */}
          <Ellipse cx={size.w * 0.02} cy={size.h * 0.93} rx={size.w * 0.5} ry={size.h * 0.2} fill="url(#authGlow)" />
        </Svg>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AUTH_BG },
});
