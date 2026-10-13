import { AUTH_EDGES } from '@/constants/authEdges';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SavedCardEffect, savedCardOuter } from '@/components/shared/FigmaEffects';
import AuthGlowBackground from '@/components/auth/AuthGlowBackground';
import { GradientButton, OrDivider, ScreenHeader } from '@/components/shared/GlowUI';

const { width: W } = Dimensions.get('window');
// neoCar.png is 1080×1428 (transparent); the car itself fills x 0–1028, y 435–1214.
// Figma (390 wide): car spans 0–340pt with the headlights just above the login card,
// so the image is anchored from the bottom of the screen.
const S = W / 390;
const CAR_W = 357 * S;
const CAR_H = CAR_W * (1428 / 1080);
// Headlights are at y≈770 of the 1428px image; in Figma they sit ~41pt above the card's top edge.
const HEADLIGHT_Y = CAR_H * (770 / 1428);
const HEADLIGHT_GAP = 41 * S;

function WhitePill({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.whitePill} activeOpacity={0.85} onPress={onPress}>
      {icon}
      <Text style={styles.whitePillTxt}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  // Card's top edge (measured) — the car is placed relative to it so the front + headlights stay visible
  const [cardTop, setCardTop] = useState<number | null>(null);

  return (
    <AuthGlowBackground>
      {/* Car — sits behind the card, cropped on the left edge */}
      {cardTop !== null && (
        <Image
          source={require('@/assets/images/neoCar.png')}
          style={[styles.carImage, { top: cardTop - HEADLIGHT_GAP - HEADLIGHT_Y }]}
          resizeMode="contain"
        />
      )}

      <SafeAreaView edges={AUTH_EDGES} style={styles.safe}>
        <ScreenHeader logo />

        <View style={styles.textBlock}>
          <Text style={styles.headline}>
            {"Welcome to Pakistan's\nFirst Integrated "}
            <Text style={{ color: '#e2671b' }}>Auto{'\n'}Ecosystem</Text>
          </Text>
          <Text style={styles.subtitle}>
            Connecting buyers, dealers, banks, insurance, and tracker companies on one platform.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Glass card */}
        <View style={[savedCardOuter, styles.card]} onLayout={e => setCardTop(e.nativeEvent.layout.y)}>
          <SavedCardEffect band={22} />
          <WhitePill
            icon={<Image source={require('@/assets/Icons/google.png')} style={{ width: 26, height: 26 }} resizeMode="contain" />}
            label="Continue with Google"
          />
          {/* <WhitePill icon={<Ionicons name="logo-apple" size={26} color="#000000" />} label="Continue with Apple" /> */}
          <View style={{ paddingHorizontal: 10 }}><OrDivider /></View>
          <GradientButton title="Login" height={52} fontSize={18} onPress={() => router.push('/(auth)/login')} />
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.signUp}>
              {"Don't have any account? "}
              <Text style={{ color: '#e2671b', fontFamily: 'Poppins_500Medium' }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </AuthGlowBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 16 },

  carImage: {
    position: 'absolute',
    left: 0,
    width: CAR_W,
    height: CAR_H,
  },

  textBlock: { marginTop: 22, gap: 12, paddingHorizontal: 6 },
  headline: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 36,
  },
  subtitle: {
    color: '#D0C8CF',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 24,
  },

  card: {
    borderRadius: 30,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 14,
    marginBottom: 14,
  },
  whitePill: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  whitePillTxt: { color: '#000000', fontSize: 17, fontFamily: 'Poppins_500Medium' },
  signUp: {
    textAlign: 'center',
    color: '#BAACB6',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
});
