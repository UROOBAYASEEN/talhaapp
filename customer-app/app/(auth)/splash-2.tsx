import { AUTH_EDGES } from '@/constants/authEdges';
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
import AuthGlowBackground from '@/components/auth/AuthGlowBackground';
import { GradientButton } from '@/components/shared/GlowUI';

const { width: W } = Dimensions.get('window');
// assets/images/onboarding-phone.png is 500×590
const PHONE_W = Math.min(W * 0.9, 360);

export default function Splash2Screen() {
  const router = useRouter();

  const carAnim  = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const btnAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(carAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
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
    <AuthGlowBackground>
      <SafeAreaView edges={AUTH_EDGES} style={styles.safe}>

        <Image
          source={require('@/assets/images/autowizor-logo-text.png')}
          style={styles.logoText}
          resizeMode="contain"
        />

        <Animated.View style={[styles.textBlock, { opacity: textAnim }]}>
          <Text style={styles.headline}>
            {'Everything You need\nin '}
            <Text style={{ color: '#e2671b' }}>one Place</Text>
          </Text>
          <Text style={styles.subtext}>
            From Buying your Dream vehicle to managing finances, Insurance & Tracking.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.phoneWrap, { opacity: carAnim, transform: [{ translateY: carY }] }]}>
          <Image
            source={require('@/assets/images/onboarding-phone.png')}
            style={styles.phone}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.btnWrap, { opacity: btnAnim }]}>
          <GradientButton
            title="Continue"
            height={52}
            fontSize={18}
            onPress={() => router.replace('/(auth)/onboarding')}
          />
        </Animated.View>

      </SafeAreaView>
    </AuthGlowBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: 16,
  },
  logoText: {
    width: 104,
    height: 20,
    alignSelf: 'center',
    marginTop: 14,
  },
  textBlock: {
    marginTop: 44,
    gap: 12,
    alignItems: 'center',
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 36,
    textAlign: 'center',
  },
  subtext: {
    color: '#D0C8CF',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
    textAlign: 'center',
  },
  phoneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    width: PHONE_W,
    height: PHONE_W * (590 / 500),
    maxHeight: '100%',
  },
  btnWrap: {
    paddingBottom: 20,
  },
});
