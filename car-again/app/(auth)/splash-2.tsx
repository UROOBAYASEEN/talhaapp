import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearButton from '@/components/auth/LinearButton';
import { useAppColors } from '@/constants/theme';

const { width: W, height: H } = Dimensions.get('window');

export default function Splash2Screen() {
  const router = useRouter();
  const C = useAppColors();

  const carAnim  = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const btnAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(carAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(btnAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const carY = carAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] });

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>

      {/* Soft radial glow — top-right */}
      <LinearGradient
        colors={['rgba(5,55,160,0.18)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.1, y: 0.7 }}
        style={styles.glowTopRight}
      />

      {/* Soft radial glow — bottom-left */}
      <LinearGradient
        colors={['rgba(5,55,160,0.14)', 'transparent']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0.9, y: 0.3 }}
        style={styles.glowBottomLeft}
      />

      <SafeAreaView style={styles.safe}>

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

        <Animated.View style={[styles.textBlock, { opacity: textAnim }]}>
          <Text style={[styles.headline, { color: C.textPrimary }]}>
            {'Everything You need\nin '}
            <Text style={{ color: '#e2671b' }}>one Place</Text>
          </Text>
          <Text style={[styles.subtext, { color: C.textPrimary }]}>
            From Buying your Dream Car to managing finances, Insurance & Tracking.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.carWrap, { opacity: carAnim, transform: [{ translateY: carY }] }]}>
          <Image
            source={require('@/assets/images/auth-car-bg.png')}
            style={styles.carImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.btnWrap, { opacity: btnAnim }]}>
          <LinearButton
            title="Get Started"
            onPress={() => router.replace('/(auth)/onboarding')}
          />
        </Animated.View>

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

  safe: {
    flex: 1,
    paddingHorizontal: 20,
  },

  logoText: {
    width: 112,
    height: 21,
    alignSelf: 'center',
    marginTop: 16,
  },
  logoTextLight: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: 16,
  },

  textBlock: {
    marginTop: 48,
    gap: 10,
    alignItems: 'center',
  },
  headline: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 36,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
    textAlign: 'center',
  },

  carWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carImage: {
    width: W * 0.82,
    height: W * 1.2,
  },

  btnWrap: {
    paddingBottom: 24,
  },
});
