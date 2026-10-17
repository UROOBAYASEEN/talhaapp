import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const VERIFIED = require('@/assets/Icons/verified.png');
const VERIFIED_ORANGE = require('@/assets/Icons/orange_tick_verified.png');

// Verified tick — blue (assets/Icons/verified.png) by default (Dealer, Insurance, Tracker…);
// tone="orange" (assets/Icons/orange_tick_verified.png) for Non-dealer / Become a Seller.
export default function VerifiedIcon({ size = 16, style, tone = 'blue' }: { size?: number; style?: StyleProp<ImageStyle>; tone?: 'blue' | 'orange' }) {
  return <Image source={tone === 'orange' ? VERIFIED_ORANGE : VERIFIED} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}
