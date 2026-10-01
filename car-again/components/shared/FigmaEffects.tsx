import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

// Exact search-input effect from app/profile/saved.tsx (dark theme)
export function SearchInputEffect({ radius = 32 }: { radius?: number }) {
  return (
    <>
      <LinearGradient
        colors={['#163565', '#061124', '#061124', '#0D2146']}
        locations={[0, 0.24, 0.76, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['#24518F8F', '#16356552', 'transparent', 'transparent', '#16356552', '#24518F8F']}
        locations={[0, 0.025, 0.075, 0.925, 0.975, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
        pointerEvents="none"
      />
    </>
  );
}

// Exact vehicle-card effect from app/profile/saved.tsx (dark theme).
// saved.tsx uses 8% / 5% of its ~220×350 card ≈ an 18px glow band on every side.
// Percent-based bands look much thinner on smaller cards, so the band is kept at a
// fixed pixel size (default 18px) — the same look as the saved card at any size.
export function SavedCardEffect({ band = 18, color = '#16408880' }: { band?: number; color?: string }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const v  = size && size.h > 0 ? Math.min(band / size.h, 0.45) : 0.08;
  const hz = size && size.w > 0 ? Math.min(band / size.w, 0.45) : 0.05;
  return (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
      onLayout={e => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <LinearGradient colors={[color, 'transparent', 'transparent', color]} locations={[0, v, 1 - v, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={[color, 'transparent', 'transparent', color]} locations={[0, hz, 1 - hz, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </View>
  );
}

// Rounded inner glow, equal on all four sides (Figma glass cards / buttons)
export function RingGlow({ radius = 16, peak = 0.45, rings = 10 }: { radius?: number; peak?: number; rings?: number }) {
  return (
    <>
      {Array.from({ length: rings }).map((_, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute', top: i, left: i, right: i, bottom: i,
            borderRadius: Math.max(radius - i, 0), borderWidth: 1,
            borderColor: `rgba(40,86,168,${(peak * Math.pow(1 - i / rings, 1.6)).toFixed(3)})`,
          }}
        />
      ))}
    </>
  );
}

// Saved-file vehicle card outer border/shadow (dark theme)
export const savedCardOuter = {
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#82a5d5',
  backgroundColor: '#010A1F',
  shadowColor: '#638ed0',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.15,
  shadowRadius: 5,
  elevation: 2,
  overflow: 'hidden' as const,
};

// Figma navy → brown/orange card background (dealer / reservation cards)
export const WARM_CARD_COLORS = ['#0B1D4A', '#0E2152', '#3A2F4A', '#7D4B3C'] as const;
export const WARM_CARD_LOCATIONS = [0, 0.45, 0.75, 1] as const;

// Figma primary button gradient (navy → orange)
export const PRIMARY_BTN_COLORS = ['#0B3585', '#7E4F5C', '#E8702A'] as const;

// Figma "Select Vehicle Type" inner glow — blue (#143265) fading in from every edge to a
// dark centre (#030D20), rounded like the card. Built from thin rings (no Skia), so it is cheap.
export function InsetGlow({
  radius = 16, band = 20, rgb = [20, 50, 101], peak = 1,
}: { radius?: number; band?: number; rgb?: [number, number, number]; peak?: number }) {
  return (
    <>
      {Array.from({ length: band }).map((_, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute', top: i, left: i, right: i, bottom: i,
            // inner rings keep (almost) the full corner radius so the glow stays nicely rounded
            borderRadius: Math.max(radius - i * 0.35, radius * 0.7), borderWidth: 1,
            borderColor: `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(peak * Math.pow(1 - i / band, 1.8)).toFixed(3)})`,
          }}
        />
      ))}
    </>
  );
}

// Card shell for InsetGlow: dark centre + light-blue border (a little lighter at the bottom)
export const insetGlowCard = {
  backgroundColor: '#030D20',
  borderWidth: 1,
  borderTopColor: '#4F6C9E',
  borderLeftColor: '#5A74A0',
  borderRightColor: '#5A74A0',
  borderBottomColor: '#6F82A2',
  overflow: 'hidden' as const,
};

// Glassy panel behind fixed bottom buttons (vehicle detail CTA): dark navy centre, soft lighter edges
export function CtaPanelGlass({ radius = 20 }: { radius?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderTopLeftRadius: radius, borderTopRightRadius: radius, overflow: 'hidden', backgroundColor: '#030B1F' }}>
      <InsetGlow radius={radius} band={30} rgb={[52, 70, 108]} peak={0.55} />
    </View>
  );
}
