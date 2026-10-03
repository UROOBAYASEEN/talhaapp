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
      colors={['#153970', '#c8d1df']}
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
    height: 112,
    marginBottom: 10,
    flexDirection: 'row',
    paddingLeft: 18,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  finLeft: { flex: 1, gap: 4, justifyContent: 'center' },
  finTitle: { color: '#f9fafc', fontSize: 16, fontFamily: 'Poppins_600SemiBold', lineHeight: 23 },
  finSub: { color: '#f9fafc', fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 14, maxWidth: 174 },
  finBtn: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 22, paddingVertical: 6, marginTop: 5, marginLeft: -5 },
  finBtnTxt: { color: '#f9fafc', fontSize: 9, fontFamily: 'Poppins_600SemiBold' },
  bankLogo: { position: 'absolute', top: 8, right: 11, width: 70, height: 20 },
  bankCar: { position: 'absolute', bottom: -10, right: 5, width: 170, height: 134 },
});
