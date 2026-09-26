import { AntDesign, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearButton from '@/components/auth/LinearButton';
import { useAppColors } from '@/constants/theme';

const { width: W, height: H } = Dimensions.get('window');

// Figma screen: 390x844
// Scale factors to adapt to any device
const SX = W / 390;
const SY = H / 844;

export default function OnboardingScreen() {
  const router = useRouter();
  const C = useAppColors();

  const borderColor = C.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(3,12,40,0.12)';

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>

      {/* Soft radial glow — top-right */}
      <LinearGradient
        colors={['rgba(5,55,160,0.45)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.1, y: 0.7 }}
        style={styles.glowTopRight}
      />

      {/* Soft radial glow — bottom-left */}
      <LinearGradient
        colors={['rgba(5,55,160,0.35)', 'transparent']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0.9, y: 0.3 }}
        style={styles.glowBottomLeft}
      />

      {/* Car image — zoomed, overflows both edges */}
      <Image
        source={require('@/assets/images/onboarding-car.png')}
        style={styles.carImage}
        resizeMode="contain"
      />

      <SafeAreaView style={styles.safe}>

        {/* Top row — back arrow + company name 4x bigger */}
        <View style={styles.logoRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color={C.textPrimary} />
          </TouchableOpacity>
          {C.isDark ? (
            <Image
              source={require('@/assets/images/autowizor-logo-text.png')}
              style={styles.logoText}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.logoTextLight}>
              <Text style={{ color: '#032a69' }}>Auto</Text>
              <Text style={{ color: '#e2671b' }}>wizor</Text>
            </Text>
          )}
        </View>

        {/* Headline + subtitle — exact Figma text (844:2954, 844:2955) */}
        <View style={styles.textBlock}>
          <Text style={[styles.headline, { color: C.textPrimary }]}>
            Welcome to Pakistan's{'\n'}First Integrated{' '}
            <Text style={{ color: '#e2671b' }}>Auto Ecosystem</Text>
          </Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>
            Marketplace, financing, insurance, and trackers in one place.
          </Text>
        </View>

        {/* Spacer pushes card to bottom */}
        <View style={{ flex: 1 }} />

        {/* Button card — AGENTS.md Card 4-Side Border Shade (both moods) */}
        <View style={[styles.cardGlowOuter]}>
        <View style={[styles.card, { backgroundColor: C.glassBg, borderColor: C.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,12,40,0.12)', overflow: 'hidden' }]}>
          {/* Top shade */}
          <LinearGradient
            colors={['rgba(22,64,136,0.35)', 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }}
            style={StyleSheet.absoluteFillObject} pointerEvents="none"
          />
          {/* Bottom shade */}
          <LinearGradient
            colors={['transparent', 'rgba(29,83,175,0.35)']}
            start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject} pointerEvents="none"
          />
          {/* Left shade */}
          <LinearGradient
            colors={['rgba(13,37,84,0.35)', 'transparent']}
            start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }}
            style={StyleSheet.absoluteFillObject} pointerEvents="none"
          />
          {/* Right shade */}
          <LinearGradient
            colors={['transparent', 'rgba(13,37,84,0.35)']}
            start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject} pointerEvents="none"
          />

          <TouchableOpacity
            style={[styles.socialBtn, { borderColor: C.glassBorder, backgroundColor: '#ffffff', overflow: 'hidden' }]}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <View style={styles.socialInner}>
              <AntDesign name="google" size={22} color="#DB4437" />
              <Text style={[styles.socialText, { color: '#000000' }]}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialBtn, { borderColor: C.glassBorder, backgroundColor: '#ffffff', overflow: 'hidden' }]}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <View style={styles.socialInner}>
              <Ionicons name="logo-apple" size={22} color="#000000" />
              <Text style={[styles.socialText, { color: '#000000' }]}>Continue with Apple</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: C.divider }]} />
            <Text style={[styles.dividerText, { color: C.textSecondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: C.divider }]} />
          </View>

          <LinearButton
            title="Get Started"
            onPress={() => router.push('/(auth)/register')}
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={[styles.orSignIn, { color: C.textSecondary }]}>
              Don't have any account?{' '}
              <Text style={{ color: '#e2671b', fontFamily: 'Poppins_600SemiBold' }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  glowTopRight: {
    position: 'absolute',
    right: -80,
    top: -60,
    width: 360,
    height: 360,
    borderRadius: 180,
  },
  glowBottomLeft: {
    position: 'absolute',
    left: -80,
    bottom: 40,
    width: 340,
    height: 340,
    borderRadius: 170,
  },

  // Car image — zoomed: 130% screen width, centred overflow on both sides
  carImage: {
    position: 'absolute',
    left: -(W * 0.28),
    top: 240 * SY,
    width: W * 1.2,
    height: W * 1.2,
    opacity: 0.75,
  },

  safe: {
    flex: 1,
    paddingHorizontal: 20,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    height: 88,
  },
  backBtn: {
    position: 'absolute',
    left: 0,
  },
  logoText: {
    width: 140,
    height: 26,
  },
  logoTextLight: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },

  // Text block
  textBlock: {
    marginTop: 0,
    gap: 8,
    alignItems: 'flex-start',
  },
  headline: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 36,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
    textAlign: 'left',
  },

  cardShade: {
    position: 'absolute',
    bottom: 0,
    left: -20,
    right: -20,
    height: 220,
  },

  cardGlowOuter: {
    borderRadius: 36,
  },

  // Glass card — Figma: y=533, x=20, w=350
  card: {
    borderRadius: 34,
    borderWidth: 1.5,
    padding: 20,
    gap: 12,
    marginBottom: 16,
  },
  socialBtn: {
    height: 48,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(29,83,175,0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  socialInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBg: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  socialIcon: { width: 24, height: 24 },
  socialText: { fontSize: 15, fontFamily: 'Poppins_500Medium' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginVertical: 2 },
  dividerLine: { flex: 1, height: 0.5 },
  dividerText: { fontSize: 14, fontFamily: 'Poppins_500Medium' },

  // Figma: "Or Sign in with" h=21 → fontSize 14
  orSignIn: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 21,
  },
});
