import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useAppColors } from '@/constants/theme';

interface GlassInputProps extends TextInputProps {
  hint?: string;
  rightIcon?: React.ReactNode;
  error?: string;
  accentBorderColor?: string;
}

export default function GlassInput({ hint, rightIcon, error, accentBorderColor, style, ...props }: GlassInputProps) {
  const [focused, setFocused] = useState(false);
  const C = useAppColors();

  const defaultBorder = focused
    ? C.isDark ? 'rgba(255,255,255,0.9)' : 'rgba(3,12,40,0.5)'
    : C.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(3,12,40,0.15)';

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            borderColor: error ? '#e74c3c' : accentBorderColor ?? defaultBorder,
            backgroundColor: C.glassBg,
            shadowColor: error ? '#e74c3c' : accentBorderColor ?? 'rgba(29,83,175,0.5)',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: accentBorderColor ? 0.35 : 1,
            shadowRadius: accentBorderColor ? 8 : 8,
            elevation: accentBorderColor ? 4 : 2,
            overflow: 'hidden',
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(22,64,136,0.2)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['rgba(13,37,84,0.18)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.45, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', 'rgba(29,83,175,0.2)']}
          start={{ x: 0.5, y: 0.4 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <TextInput
          style={[styles.input, { color: C.textPrimary }, style]}
          placeholderTextColor={C.textPlaceholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {hint ? <Text style={[styles.hint, { color: C.textHint }]}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 32,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    height: '100%',
  },
  rightIcon: {
    paddingRight: 16,
  },
  hint: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    paddingHorizontal: 4,
  },
  error: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    paddingHorizontal: 4,
    color: '#e74c3c',
  },
});
