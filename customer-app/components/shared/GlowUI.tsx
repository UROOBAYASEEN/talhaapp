// Figma "glow" UI kit — shared by the Book-Vehicle flow and the Auth screens.
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ActivityIndicator, Image, StyleProp, StyleSheet, Text, TextInput,
  TextInputProps, TouchableOpacity, View, ViewStyle,
} from 'react-native';
import InnerGlow from '@/components/shared/InnerGlow';
import LightGradientBorder from '@/components/shared/LightGradientBorder';
import { LIGHT_POP_SHADOW, useAppColors } from '@/constants/theme';

export const G = {
  bg:     '#010A1F',
  white:  '#F2F1F5',
  muted:  '#BAACB6',
  orange: '#E2671B',
  navy:   '#0A1F4F',
  line:   'rgba(255,255,255,0.12)',
  green:  '#2ECC71',
};

export const BTN_COLORS = ['#0B3585', '#7E4F5C', '#E8702A'] as const;


// ── Light mode is opt-in ──
// This kit is dark by design (Auth + dealer screens stay dark in both themes).
// Screens that pass `themed` to GlowBackground (or wrap themselves in GlowThemed)
// follow the app theme: in light mode every kit component below renders its light look.
const GlowLightCtx = React.createContext(false);
export function useGlowLight() { return React.useContext(GlowLightCtx); }
export function GlowThemed({ children }: { children?: React.ReactNode }) {
  const aC = useAppColors();
  return <GlowLightCtx.Provider value={!aC.isDark}>{children}</GlowLightCtx.Provider>;
}

// ── Screen background: flat #010A1F (Figma Book-vehicle screens) ──
export function GlowBackground({ children, style, themed }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; themed?: boolean }) {
  const aC = useAppColors();
  const light = !!themed && !aC.isDark;
  return (
    <GlowLightCtx.Provider value={light}>
      <View style={[{ flex: 1, backgroundColor: light ? '#ffffff' : G.bg }, style]}>
        <StatusBar style={light ? 'dark' : 'light'} />
        {children}
      </View>
    </GlowLightCtx.Provider>
  );
}

// ── Glass surface (inner blue glow + light border) — first child of an overflow-hidden box ──
export function Glass({
  radius = 16, fill = '#030C24', glow = '#1E4A8F', blur = 18, border = ['#A3B8E2', '#6F8BC4'], borderWidth = 1.2,
}: { radius?: number; fill?: string; glow?: string; blur?: number; border?: [string, string]; borderWidth?: number }) {
  const light = useGlowLight();
  if (light) return <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderRadius: radius, backgroundColor: '#F2F4F8', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]} />;
  return <InnerGlow radius={radius} fill={fill} glowColor={glow} blur={blur} borderColors={border} borderWidth={borderWidth} />;
}

export function GlassCard({ children, radius = 16, style, onPress }: { children?: React.ReactNode; radius?: number; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const Box: any = onPress ? TouchableOpacity : View;
  return (
    <Box style={[{ borderRadius: radius, overflow: 'hidden' }, style]} activeOpacity={0.88} onPress={onPress}>
      <Glass radius={radius} />
      {children}
    </Box>
  );
}

// ── Primary navy → orange pill button ──
export function GradientButton({
  title, onPress, loading, loadingTitle, disabled, height = 48, fontSize = 16, icon, style,
}: {
  title: string; onPress?: () => void; loading?: boolean; loadingTitle?: string; disabled?: boolean;
  height?: number; fontSize?: number; icon?: React.ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const light = useGlowLight();
  return (
    <TouchableOpacity
      style={[{ height, borderRadius: height / 2, overflow: 'hidden' }, light && { boxShadow: LIGHT_POP_SHADOW }, disabled && { opacity: 0.6 }, style]}
      onPress={onPress} disabled={disabled || loading} activeOpacity={0.88}
    >
      <LinearGradient colors={(light ? ['#27467F', '#8C6A78', '#FF9654'] : BTN_COLORS) as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnInner}>
        {loading && !loadingTitle ? <ActivityIndicator color="#fff" /> : (
          <>
            {icon}
            <Text style={[s.btnTxt, { fontSize }]}>{loading && loadingTitle ? loadingTitle : title}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Secondary glass pill button ──
export function GlassButton({
  title, onPress, height = 48, fontSize = 16, color = '#C9C6D0', icon, style, loading, textStyle, radius,
}: {
  title: string; onPress?: () => void; height?: number; fontSize?: number; color?: string;
  icon?: React.ReactNode; style?: StyleProp<ViewStyle>; loading?: boolean; textStyle?: any; radius?: number;
}) {
  const r = radius ?? height / 2;
  const light = useGlowLight();
  return (
    <TouchableOpacity style={[{ height, borderRadius: r, overflow: 'hidden' }, style]} onPress={onPress} activeOpacity={0.88} disabled={loading}>
      {light
        ? <LightGradientBorder radius={r} fill="#ffffff" colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />
        : <Glass radius={r} blur={14} />}
      <View style={s.btnInner}>
        {loading ? <ActivityIndicator color={light ? '#000' : '#fff'} /> : (
          <>
            {icon}
            <Text style={[{ color, fontSize, fontFamily: 'Poppins_400Regular' }, textStyle, light && { color: '#000000' }]}>{title}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Glass input pill ──
export function GlassField({
  right, containerStyle, height = 48, ...props
}: TextInputProps & { right?: React.ReactNode; containerStyle?: StyleProp<ViewStyle>; height?: number }) {
  const light = useGlowLight();
  return (
    <View style={[{ height, borderRadius: height / 2, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' }, light && s.lightField, containerStyle]}>
      {!light && <Glass radius={height / 2} blur={14} />}
      <TextInput
        placeholderTextColor="#8F8A96"
        {...props}
        style={[s.fieldInput, light && { color: '#000000' }, props.style]}
      />
      {right ? <View style={{ paddingRight: 18 }}>{right}</View> : null}
    </View>
  );
}

// ── Pressable glass pill that shows a value (dropdown / picker) ──
export function GlassSelect({
  value, placeholder, onPress, right, height = 48, style, textStyle,
}: {
  value?: string; placeholder?: string; onPress?: () => void; right?: React.ReactNode;
  height?: number; style?: StyleProp<ViewStyle>; textStyle?: any;
}) {
  const light = useGlowLight();
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[{ height, borderRadius: height / 2, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' }, light && s.lightField, style]}>
      {!light && <Glass radius={height / 2} blur={14} />}
      <Text style={[s.selectTxt, light && { color: '#000000' }, !value && { color: '#8F8A96' }, textStyle]} numberOfLines={1}>{value || placeholder}</Text>
      {right ? <View style={{ paddingRight: 18 }}>{right}</View> : null}
    </TouchableOpacity>
  );
}

// ── Centered-title header with thin back chevron (and optional close X) ──
export function ScreenHeader({ title, onBack, onClose, logo }: { title?: string; onBack?: () => void; onClose?: () => void; logo?: boolean }) {
  const router = useRouter();
  const light = useGlowLight();
  return (
    <View style={s.header}>
      <TouchableOpacity style={s.headerLeft} onPress={onBack ?? (() => router.back())} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="chevron-back" size={26} color={light ? '#000000' : G.muted} />
      </TouchableOpacity>
      {logo
        ? (light
          ? <Text style={{ fontSize: 20, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 }}><Text style={{ color: '#032a69' }}>Auto</Text><Text style={{ color: '#e2671b' }}>wizor</Text></Text>
          : <Image source={require('@/assets/images/autowizor-logo-text.png')} style={s.logo} resizeMode="contain" />)
        : <Text style={[s.headerTitle, light && { color: '#000000' }]} numberOfLines={1}>{title}</Text>}
      {onClose ? (
        <TouchableOpacity style={s.headerRight} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={light ? '#000000' : G.muted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── Round check / cross badges used in comparison tables ──
export function CheckBadge({ ok = true, size = 22 }: { ok?: boolean; size?: number }) {
  if (!ok) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#0C1C45', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="close" size={size * 0.72} color="#FF3B3B" />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#1D3B78', borderWidth: 1.2, borderColor: '#8FA8D8', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="checkmark" size={size * 0.62} color="#fff" />
    </View>
  );
}

// ── "or" divider ──
export function OrDivider() {
  return (
    <View style={s.orRow}>
      <View style={s.orLine} />
      <Text style={s.orTxt}>or</Text>
      <View style={s.orLine} />
    </View>
  );
}

const s = StyleSheet.create({
  lightField:  { backgroundColor: '#E8EAEF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.18)', boxShadow: LIGHT_POP_SHADOW },
  btnInner:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16 },
  btnTxt:      { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },
  fieldInput:  { flex: 1, height: '100%', paddingHorizontal: 22, color: G.white, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  selectTxt:   { flex: 1, paddingHorizontal: 22, color: G.white, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  header:      { height: 52, alignItems: 'center', justifyContent: 'center', marginHorizontal: 16 },
  headerLeft:  { position: 'absolute', left: 0, height: 52, justifyContent: 'center', zIndex: 2 },
  headerRight: { position: 'absolute', right: 0, height: 52, justifyContent: 'center', zIndex: 2 },
  headerTitle: { color: G.white, fontSize: 20, fontFamily: 'Poppins_500Medium', maxWidth: '75%' },
  logo:        { width: 128, height: 24 },
  orRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine:      { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.45)' },
  orTxt:       { color: G.muted, fontSize: 14, fontFamily: 'Poppins_400Regular' },
});
