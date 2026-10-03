import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, LinearGradient, RoundedRect, Shadow, vec } from '@shopify/react-native-skia';

type Props = {
  /** Corner radius of the card */
  radius?: number;
  /** Centre fill of the card */
  fill?: string;
  /** Inner-shadow (glow) colour coming in from every edge */
  glowColor?: string;
  /** Inner-shadow blur — how far the glow reaches inwards */
  blur?: number;
  /** Border gradient (top → bottom); top is a little brighter */
  borderColors?: [string, string];
  borderWidth?: number;
};

/**
 * Figma-style "Inner Shadow" glass card background.
 * Real inner shadow (Skia) — follows the rounded corners and is equal on all sides.
 * Place it as the first child of a card with overflow: 'hidden'; it fills the card.
 */
export default function InnerGlow({
  radius = 16,
  fill = '#0A1430',
  glowColor = '#1E4A8F',
  blur = 22,
  borderColors = ['#A3B8E2', '#6F8BC4'],
  borderWidth = 1.5,
}: Props) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const half = borderWidth / 2;

  return (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
      onLayout={e => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size && (
        <Canvas style={StyleSheet.absoluteFillObject}>
          {/* Fill + inner shadow */}
          <RoundedRect x={0} y={0} width={size.w} height={size.h} r={radius} color={fill}>
            <Shadow dx={0} dy={0} blur={blur} color={glowColor} inner />
          </RoundedRect>
          {/* Border (slightly brighter at the top) */}
          <RoundedRect
            x={half}
            y={half}
            width={size.w - borderWidth}
            height={size.h - borderWidth}
            r={Math.max(radius - half, 0)}
            style="stroke"
            strokeWidth={borderWidth}
          >
            <LinearGradient start={vec(0, 0)} end={vec(0, size.h)} colors={borderColors} />
          </RoundedRect>
        </Canvas>
      )}
    </View>
  );
}
