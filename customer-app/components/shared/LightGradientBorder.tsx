import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

// Light mode (Figma): hairline orange ↔ navy gradient border + solid fill.
// Parent ke andar sab se pehle rakho; parent ka apna borderWidth 0 hona chahiye.
export default function LightGradientBorder({
  radius = 16,
  fill = '#F2F4F8',
  colors = ['rgba(226,103,27,0.75)', 'rgba(3,42,105,0.75)'],
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
}: {
  radius?: number;
  fill?: string;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}) {
  return (
    <>
      <LinearGradient colors={colors as any} start={start} end={end} style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]} pointerEvents="none" />
      <View pointerEvents="none" style={{ position: 'absolute', top: 1, left: 1, right: 1, bottom: 1, borderRadius: radius - 1, backgroundColor: fill }} />
    </>
  );
}
