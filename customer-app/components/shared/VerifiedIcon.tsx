import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const VERIFIED = require('@/assets/Icons/verified.png');

// Blue verified tick (assets/Icons/verified.png) — used wherever a blue tick is shown.
export default function VerifiedIcon({ size = 16, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={VERIFIED} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}
