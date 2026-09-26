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
import { useAppColors } from '@/constants/theme';

const WORDS = ['BUY.', 'FINANCE.', 'INSURE.', 'TRACK.', 'DRIVE'];
const STAY_MS = 6000;
const { width: SCREEN_W } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const C = useAppColors();

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
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <View style={styles.content}>

        <Animated.Image
          source={require('@/assets/images/autowizor-logo-icon.png')}
          style={[
            styles.icon,
            { transform: [{ rotate: spin }, { scale: iconScale }] },
          ]}
          resizeMode="contain"
        />

        {C.isDark ? (
          <Animated.Image
            source={require('@/assets/images/autowizor-logo-text.png')}
            style={[
              styles.textLogo,
              { opacity: textOpacity, transform: [{ scale: textScale }] },
            ]}
            resizeMode="contain"
          />
        ) : (
          <Animated.Text
            style={[
              styles.textLogoLight,
              { opacity: textOpacity, transform: [{ scale: textScale }] },
            ]}
          >
            <Text style={{ color: '#032a69' }}>Auto</Text>
            <Text style={{ color: '#e2671b' }}>wizor</Text>
          </Animated.Text>
        )}

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
                  { color: C.textPrimary, opacity: wordAnims[i], transform: [{ scale }] },
                ]}
              >
                {word}
              </Animated.Text>
            );
          })}
        </View>

      </View>
    </SafeAreaView>
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
    gap: 20,
  },
  icon: {
    width: 210,
    height: 210,
  },
  textLogo: {
    width: 112,
    height: 21,
  },
  textLogoLight: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  taglineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: -10,
  },
  word: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.5,
  },
});
