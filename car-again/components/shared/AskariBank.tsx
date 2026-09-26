import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const IMG_BANK_CAR = require('@/screenshot/bankpanelcar.png');
const IMG_BANK_LOGO = require('@/screenshot/bankislami.png');

export default function AskariBank() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#032A69', '#F9FAFC']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.43 }}
      style={styles.finBanner}
    >
      <View style={styles.finLeft}>
        <Text style={styles.finTitle}>Askari Bank Car Ijarah</Text>
        <Text style={styles.finSub}>
          Drive your dream car today with flexible monthly plans
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: '/(tabs)/sellers', params: { role: 'bank_representative' } } as any)}
        >
          <LinearGradient
            colors={['#032a69', '#e2671b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.finBtn}
          >
            <Text style={styles.finBtnTxt}>Apply Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Image source={IMG_BANK_LOGO} style={styles.bankLogo} resizeMode="contain" />
      <Image source={IMG_BANK_CAR} style={styles.bankCar} resizeMode="contain" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  finBanner: {
    borderRadius: 16,
    height: 110,
    flexDirection: 'row',
    paddingLeft: 20,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  finLeft:   { flex: 1, gap: 4, justifyContent: 'center' },
  finTitle:  { color: '#f9fafc', fontSize: 14, fontFamily: 'Poppins_600SemiBold', lineHeight: 20 },
  finSub:    { color: 'rgba(249,250,252,0.85)', fontSize: 7, fontFamily: 'Poppins_400Regular', lineHeight: 11, maxWidth: 130 },
  finBtn:    { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5, marginTop: 6 },
  finBtnTxt: { color: '#f9fafc', fontSize: 9, fontFamily: 'Poppins_600SemiBold' },
  bankLogo: { position: 'absolute', top: 10, right: 10, width: 64, height: 18 },
  bankCar:   { position: 'absolute', bottom: -2, right: 6, width: 120, height: 88 },
});
