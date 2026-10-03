// Figma bottom action panel (dark theme) — "Publish Banner / Save as Draft" effect from app/(admin)/add-banner.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import InnerGlow from '@/components/shared/InnerGlow';

// Panel background: dark navy centre, blue glow from every edge, thin top line.
// First child of an overflow-hidden footer View.
export function ActionPanelBg() {
  return (
    <>
      <InnerGlow radius={0} fill="#0B1731" glowColor="#2B56A3" blur={20} borderColors={['#2A4C88', '#163262']} borderWidth={1} />
      <LinearGradient colors={['rgba(32,42,66,0.3)', 'transparent', 'transparent', 'rgba(32,42,66,0.3)']} locations={[0, 0.16, 0.84, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

// Ready-made footer: panel background + Figma padding (32 sides). Put the buttons inside.
export function ActionFooter({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.footer, style]}>
      <ActionPanelBg />
      {children}
    </View>
  );
}

// Primary: navy → orange pill
export function GlowPublishButton({
  title, onPress, loading, loadingTitle, disabled, style, height = 48, radius,
}: { title: string; onPress?: () => void; loading?: boolean; loadingTitle?: string; disabled?: boolean; style?: StyleProp<ViewStyle>; height?: number; radius?: number }) {
  return (
    <TouchableOpacity activeOpacity={disabled || loading ? 1 : 0.85} disabled={disabled || loading} style={[s.btn, { height, borderRadius: radius ?? height / 2 }, style]} onPress={onPress}>
      <LinearGradient colors={['#082C66', '#DF6728']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} />
      {loading && !loadingTitle ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.publishTxt}>{loading && loadingTitle ? loadingTitle : title}</Text>}
    </TouchableOpacity>
  );
}

// Secondary: glass pill (blue inner glow, light-blue border, warm tint on the right)
export function GlowDraftButton({
  title, onPress, loading, disabled, style, height = 48, radius,
}: { title: string; onPress?: () => void; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; height?: number; radius?: number }) {
  const r = radius ?? height / 2;
  return (
    <TouchableOpacity activeOpacity={0.8} disabled={disabled || loading} style={[s.btn, { height, borderRadius: r }, style]} onPress={onPress}>
      <InnerGlow radius={r} fill="#131F38" glowColor="#2C55A0" blur={14} borderColors={['#6F8CC0', '#5873A6']} borderWidth={1} />
      <LinearGradient colors={['transparent', 'transparent', 'rgba(58,36,42,0.45)', 'transparent']} locations={[0, 0.5, 0.82, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[StyleSheet.absoluteFillObject, { top: 10, bottom: 10 }]} pointerEvents="none" />
      {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.draftTxt}>{title}</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  footer:     { overflow: 'hidden', backgroundColor: '#0A1838', paddingHorizontal: 32, paddingTop: 12, paddingBottom: 22, gap: 11 },
  btn:        { height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  publishTxt: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  draftTxt:   { color: '#E3E5EF', fontSize: 15, fontFamily: 'Poppins_400Regular' },
});
