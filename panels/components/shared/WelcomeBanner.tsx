// Dashboard "Welcome Back" banner (Figma) — shared by the Admin and Tracker dashboards.
import React from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

const CAR = require('@/assets/DealerPanelIcons/dealershipCar.png');

export default function WelcomeBanner({
  title = "Let's grow your\ndealership today!", style,
}: { title?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.card, style]}>
      <View style={s.text}>
        <Text style={s.sub}>Welcome Back,</Text>
        <Text style={s.title} numberOfLines={2}>{title}</Text>
      </View>
      <Image source={CAR} style={s.car} resizeMode="contain" />
    </View>
  );
}

const s = StyleSheet.create({
  card:  { minHeight: 124, borderRadius: 22, backgroundColor: '#061B4A', flexDirection: 'row', alignItems: 'center', paddingLeft: 22, paddingRight: 10, paddingVertical: 18, overflow: 'hidden' },
  text:  { flex: 1 },
  sub:   { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
  title: { color: '#FFFFFF', fontSize: 17, lineHeight: 27, fontFamily: 'Poppins_700Bold' },
  car:   { width: 140, height: 82 },
});
