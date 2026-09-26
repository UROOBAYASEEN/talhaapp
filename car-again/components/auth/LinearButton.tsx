import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { AppColors } from '@/constants/theme';

interface LinearButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
}

export default function LinearButton({ title, loading, style, disabled, ...props }: LinearButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.wrapper, style]}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...props}
    >
      <LinearGradient
        colors={[AppColors.gradientStart, AppColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
  },
  gradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});
