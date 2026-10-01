import React from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

const SETTINGS = [
  { title: 'Change Password',    asset: require('../../assets/Icons/changePasswordIcon.png'), route: '/profile/change-password' },
  { title: 'Help Center',        icon: 'help-circle-outline',                                      route: '/profile/help'            },
  { title: 'Terms & Conditions', asset: require('../../assets/Icons/terms&ConditionIcon.png'),   route: '/profile/terms'           },
  { title: 'About Autowizor',    asset: require('../../assets/Icons/aboutIcon.png'),              route: '/profile/about'           },
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
            style={[s.option, { backgroundColor: C.isDark ? '#010A1F' : C.glassBg, borderColor: C.isDark ? '#829fd0' : 'rgba(3,42,105,0.2)' }]}
            activeOpacity={0.8}
            onPress={() => item.route && router.push(item.route as any)}
          >
            {C.isDark ? (
              <>
                <LinearGradient
                  colors={['#163565', '#061124', '#061124', '#0D2146']}
                  locations={[0, 0.24, 0.76, 1]}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={['#24518F8F', '#16356552', 'transparent', 'transparent', '#16356552', '#24518F8F']}
                  locations={[0, 0.025, 0.075, 0.925, 0.975, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
                  pointerEvents="none"
                />
              </>
            ) : (
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            )}
            <View style={s.optionLeft}>
              {'asset' in item && item.asset ? (
                <Image source={item.asset} style={s.menuIcon} resizeMode="contain" />
              ) : (
                <Ionicons name={item.icon as any} size={20} color="#FF8A00" />
              )}
              <Text style={[s.optionText, { color: C.textPrimary }]}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.textSecondary} />
          </TouchableOpacity>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={[s.option, { backgroundColor: C.isDark ? '#010A1F' : C.glassBg, borderColor: C.isDark ? '#829fd0' : 'rgba(3,42,105,0.2)' }]}
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: logout },
            ])
          }
        >
          {C.isDark ? (
            <>
              <LinearGradient
                colors={['#163565', '#061124', '#061124', '#0D2146']}
                locations={[0, 0.24, 0.76, 1]}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['#24518F8F', '#16356552', 'transparent', 'transparent', '#16356552', '#24518F8F']}
                locations={[0, 0.025, 0.075, 0.925, 0.975, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
                pointerEvents="none"
              />
            </>
          ) : (
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          )}
          <View style={s.optionLeft}>
            <Image source={require('../../assets/Icons/logoutIcon.png')} style={s.menuIcon} resizeMode="contain" />
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

  menuIcon: {
    width: 20,
    height: 20,
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
