import { AUTH_EDGES } from '@/constants/authEdges';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthGlowBackground from '@/components/auth/AuthGlowBackground';


const WORDS = ['Buy.', 'Finance.', 'Insure.', 'Track.', 'Drive.'];
const STAY_MS = 6000;
const { width: SCREEN_W } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  const spinAnim    = useRef(new Animated.Value(0)).current;
  const iconScale   = useRef(new Animated.Value(0.6)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale   = useRef(new Animated.Value(0.8)).current;
  const wordAnims   = useRef(WORDS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.back(1.3)),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(textScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(150),
      Animated.stagger(
        200,
        wordAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.back(1.8)),
            useNativeDriver: true,
          })
        )
      ),
    ]).start();

    const timer = setTimeout(() => router.replace('/(auth)/splash-2'), STAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const spin = spinAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <AuthGlowBackground>
    <SafeAreaView edges={AUTH_EDGES} style={styles.container}>
      <View style={styles.content}>

        <Animated.Image
          source={require('@/assets/images/autowizor-logo-icon.png')}
          style={[
            styles.icon,
            { transform: [{ rotate: spin }, { scale: iconScale }] },
          ]}
          resizeMode="contain"
        />

        <Animated.Image
          source={require('@/assets/images/autowizor-logo-text.png')}
          style={[
            styles.textLogo,
            { opacity: textOpacity, transform: [{ scale: textScale }] },
          ]}
          resizeMode="contain"
        />

        <View style={styles.taglineRow}>
          {WORDS.map((word, i) => {
            const scale = wordAnims[i].interpolate({
              inputRange:  [0, 1],
              outputRange: [0.3, 1],
            });
            return (
              <Animated.Text
                key={word}
                style={[
                  styles.word,
                  { opacity: wordAnims[i], transform: [{ scale }] },
                ]}
              >
                {word}
              </Animated.Text>
            );
          })}
        </View>

      </View>
    </SafeAreaView>
    </AuthGlowBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  icon: {
    width: 162,
    height: 162,
  },
  textLogo: {
    width: 196,
    height: 37,
    marginTop: 4,
  },
  taglineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    marginTop: -10,
  },
  word: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
});
