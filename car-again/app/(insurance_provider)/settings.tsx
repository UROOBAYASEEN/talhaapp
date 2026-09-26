import React from 'react';
import {
  Alert, View, Text, StyleSheet,
  TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const BG = '#010A1F';
const ORANGE = '#e2671b';

const SETTINGS = [
  { title: 'Edit Profile',       icon: 'person-outline',             route: '/(insurance_provider)/profile' },
  { title: 'Analytics',          icon: 'bar-chart-outline',          route: '/(insurance_provider)/analytics' },
  { title: 'Change Password',    icon: 'lock-closed-outline',        route: '/profile/change-password' },
  { title: 'Help Center',        icon: 'help-circle-outline',        route: '/profile/help' },
  { title: 'Terms & Conditions', icon: 'document-text-outline',      route: '/profile/terms' },
  { title: 'About Autowizor',    icon: 'information-circle-outline', route: '/profile/about' },
];

export default function InsuranceSettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={25} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Options */}
      <View style={s.list}>
        {SETTINGS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={s.option}
            activeOpacity={0.8}
            onPress={() => router.push(item.route as any)}
          >
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <View style={s.optionLeft}>
              <Ionicons name={item.icon as any} size={20} color={ORANGE} />
              <Text style={s.optionText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7A99" />
          </TouchableOpacity>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={s.option}
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: logout },
            ])
          }
        >
          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <View style={s.optionLeft}>
            <Ionicons name="log-out-outline" size={20} color="#FF4B4B" />
            <Text style={s.logoutText}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  backButton:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },

  list: { paddingHorizontal: 20, paddingTop: 10, gap: 10 },

  option: {
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)',
    overflow: 'hidden',
  },
  optionLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionText:  { color: '#D6DCEF', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  logoutText:  { color: '#FF4B4B', fontSize: 13, fontFamily: 'Poppins_500Medium' },
});
