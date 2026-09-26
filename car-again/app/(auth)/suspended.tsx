import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

const SUPPORT_EMAIL = 'support@autowizor.pk';

export default function SuspendedScreen() {
  const { logout } = useAuth();
  const C = useAppColors();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]}>
      <LinearGradient
        colors={C.isDark ? ['#010a1f', '#06112a', '#010a1f'] : ['#eef1ff', '#dde4ff', '#eef1ff']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={s.container}>

        {/* Icon */}
        <View style={s.iconWrap}>
          <LinearGradient
            colors={['rgba(255,56,60,0.2)', 'rgba(255,56,60,0.05)']}
            style={s.iconBg}
          >
            <Ionicons name="ban-outline" size={56} color="#ff383c" />
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={[s.title, { color: C.textPrimary }]}>Account Suspended</Text>
        <Text style={[s.sub, { color: C.textSecondary }]}>
          Your account has been suspended by the admin. You cannot access the app at this time.
        </Text>

        {/* Contact card */}
        <View style={[s.card, { backgroundColor: C.glassBg, borderColor: C.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,12,40,0.12)' }]}>
          <LinearGradient colors={['rgba(22,64,136,0.3)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <Ionicons name="mail-outline" size={20} color="#e2671b" />
          <View style={s.cardText}>
            <Text style={[s.cardLabel, { color: C.textSecondary }]}>Contact Support</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
              <Text style={s.cardEmail}>{SUPPORT_EMAIL}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.85}>
          <Text style={s.logoutTxt}>Logout</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  iconWrap: { marginBottom: 28 },
  iconBg: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,56,60,0.3)',
  },

  title: {
    fontSize: 22, fontFamily: 'Poppins_700Bold',
    textAlign: 'center', marginBottom: 12,
  },
  sub: {
    fontSize: 14, fontFamily: 'Poppins_400Regular',
    textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    width: '100%', borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 20, paddingVertical: 16,
    overflow: 'hidden', marginBottom: 32,
  },
  cardText:  { flex: 1 },
  cardLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginBottom: 4 },
  cardEmail: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#e2671b', textDecorationLine: 'underline' },

  logoutBtn: {
    height: 48, width: '100%', borderRadius: 32,
    borderWidth: 1, borderColor: 'rgba(255,56,60,0.5)',
    backgroundColor: 'rgba(255,56,60,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoutTxt: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#ff383c' },
});
