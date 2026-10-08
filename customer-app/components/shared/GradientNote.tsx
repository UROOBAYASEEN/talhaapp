import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

// Info note — upar se orange aur neeche se blue border, andar navy → brown gradient
// (Figma: "Dealer will confirm your test drive appointment.")
export default function GradientNote({ icon, text, style, textStyle }: {
  icon: React.ReactNode;
  text: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <LinearGradient
      colors={['#E2671B', '#7A4A4A', '#1D3E8A']}
      locations={[0, 0.5, 1]}
      start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
      style={[styles.border, style]}
    >
      <View style={styles.inner}>
        <LinearGradient
          colors={['#020C2A', '#041747', '#0A1A44', '#2E2638', '#5C3423']}
          locations={[0, 0.5, 0.68, 0.86, 1]}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        {icon}
        <Text style={[styles.txt, textStyle]}>{text}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  border: { borderRadius: 22, padding: 1 },
  inner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 21, overflow: 'hidden', backgroundColor: '#010A1F',
    paddingHorizontal: 20, paddingVertical: 22,
  },
  txt: { flex: 1, color: '#F2F1F5', fontSize: 13, fontFamily: 'Poppins_400Regular' },
});
