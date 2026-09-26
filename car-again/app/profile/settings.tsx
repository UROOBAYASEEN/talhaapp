import React from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

const SETTINGS = [
  { title: 'Change Password',    icon: 'lock-closed-outline',        route: '/profile/change-password' },
  { title: 'Help Center',        icon: 'help-circle-outline',        route: '/profile/help'            },
  { title: 'Terms & Conditions', icon: 'document-text-outline',      route: '/profile/terms'           },
  { title: 'About Autowizor',    icon: 'information-circle-outline', route: '/profile/about'           },
];

export default function SettingScreen() {
  const router = useRouter();
  const C      = useAppColors();
  const { logout } = useAuth();

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={C.isDark ? "light-content" : "dark-content"} backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={25} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: C.textPrimary }]}>Setting</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Options */}
      <View style={s.list}>
        {SETTINGS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[s.option, { backgroundColor: C.glassBg, borderColor: C.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.2)' }]}
            activeOpacity={0.8}
            onPress={() => item.route && router.push(item.route as any)}
          >
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <View style={s.optionLeft}>
              <Ionicons name={item.icon as any} size={20} color="#FF8A00" />
              <Text style={[s.optionText, { color: C.textPrimary }]}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.textSecondary} />
          </TouchableOpacity>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={[s.option, { backgroundColor: C.glassBg, borderColor: C.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.2)' }]}
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
  container: {
    flex: 1,
    backgroundColor: '#010A1F',
  },

  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  list: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 10,
  },

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

  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  optionText: {
    color: '#D6DCEF',
    fontSize: 13,
    fontWeight: '500',
  },

  logoutText: {
    color: '#FF4B4B',
    fontSize: 13,
    fontWeight: '500',
  },
});
