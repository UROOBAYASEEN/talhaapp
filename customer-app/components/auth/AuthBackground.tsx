import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ImageBackground, StyleSheet, useColorScheme } from 'react-native';

interface AuthBackgroundProps {
  children: React.ReactNode;
}

export default function AuthBackground({ children }: AuthBackgroundProps) {
  const isDark = useColorScheme() !== 'light';

  return (
    <ImageBackground
      source={require('@/assets/images/auth-car-bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <LinearGradient
        colors={
          isDark
            ? ['rgba(1,10,31,0.85)', 'rgba(1,10,31,0.97)']
            : ['rgba(238,241,255,0.78)', 'rgba(238,241,255,0.95)']
        }
        style={StyleSheet.absoluteFill}
      />
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
});
