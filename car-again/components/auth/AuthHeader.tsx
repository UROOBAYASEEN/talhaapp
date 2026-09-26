import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppColors } from '@/constants/theme';

interface AuthHeaderProps {
  showBack?: boolean;
}

export default function AuthHeader({ showBack = true }: AuthHeaderProps) {
  const router = useRouter();
  const C = useAppColors();

  return (
    <View style={styles.header}>
      {showBack && (
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
      )}

      {C.isDark ? (
        <Image
          source={require('@/assets/images/autowizor-logo-text.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      ) : (
        <Text style={styles.logoTextLight}>
          <Text style={{ color: '#032a69' }}>Auto</Text>
          <Text style={{ color: '#e2671b' }}>wizor</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    height: 44,
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    padding: 4,
    zIndex: 1,
  },
  logo: {
    width: 140,
    height: 26,
  },
  logoTextLight: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
    lineHeight: 26,
  },
});
