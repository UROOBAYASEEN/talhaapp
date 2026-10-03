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


// ── Screen background: flat #010A1F (Figma Book-vehicle screens) ──
export function GlowBackground({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flex: 1, backgroundColor: G.bg }, style]}>
      <StatusBar style="light" />
      {children}
    </View>
  );
}

// ── Glass surface (inner blue glow + light border) — first child of an overflow-hidden box ──
export function Glass({
  radius = 16, fill = '#030C24', glow = '#1E4A8F', blur = 18, border = ['#A3B8E2', '#6F8BC4'], borderWidth = 1.2,
}: { radius?: number; fill?: string; glow?: string; blur?: number; border?: [string, string]; borderWidth?: number }) {
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
  return (
    <TouchableOpacity
      style={[{ height, borderRadius: height / 2, overflow: 'hidden' }, disabled && { opacity: 0.6 }, style]}
      onPress={onPress} disabled={disabled || loading} activeOpacity={0.88}
    >
      <LinearGradient colors={BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnInner}>
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
  return (
    <TouchableOpacity style={[{ height, borderRadius: r, overflow: 'hidden' }, style]} onPress={onPress} activeOpacity={0.88} disabled={loading}>
      <Glass radius={r} blur={14} />
      <View style={s.btnInner}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <>
            {icon}
            <Text style={[{ color, fontSize, fontFamily: 'Poppins_400Regular' }, textStyle]}>{title}</Text>
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
  return (
    <View style={[{ height, borderRadius: height / 2, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' }, containerStyle]}>
      <Glass radius={height / 2} blur={14} />
      <TextInput
        placeholderTextColor="#8F8A96"
        {...props}
        style={[s.fieldInput, props.style]}
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
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[{ height, borderRadius: height / 2, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' }, style]}>
      <Glass radius={height / 2} blur={14} />
      <Text style={[s.selectTxt, !value && { color: '#8F8A96' }, textStyle]} numberOfLines={1}>{value || placeholder}</Text>
      {right ? <View style={{ paddingRight: 18 }}>{right}</View> : null}
    </TouchableOpacity>
  );
}

// ── Centered-title header with thin back chevron (and optional close X) ──
export function ScreenHeader({ title, onBack, onClose, logo }: { title?: string; onBack?: () => void; onClose?: () => void; logo?: boolean }) {
  const router = useRouter();
  return (
    <View style={s.header}>
      <TouchableOpacity style={s.headerLeft} onPress={onBack ?? (() => router.back())} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="chevron-back" size={26} color={G.muted} />
      </TouchableOpacity>
      {logo
        ? <Image source={require('@/assets/images/autowizor-logo-text.png')} style={s.logo} resizeMode="contain" />
        : <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>}
      {onClose ? (
        <TouchableOpacity style={s.headerRight} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={G.muted} />
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
