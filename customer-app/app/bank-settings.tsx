import React from 'react';
import {
  Alert, View, Text, StyleSheet,
  TouchableOpacity, ScrollView, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const BG     = '#010A1F';
const ORANGE = '#e2671b';

const SETTINGS = [
  { title: 'Change Password',    icon: 'lock-closed-outline',        route: '/profile/change-password'  },
  { title: 'Help Center',        icon: 'help-circle-outline',        route: '/profile/help'             },
  { title: 'Terms & Conditions', icon: 'document-text-outline',      route: '/profile/terms'            },
  { title: 'About Autowizor',    icon: 'information-circle-outline', route: '/profile/about'            },
];

// Same field effect as the Favorites search input (app/profile/saved.tsx, dark)
function RowGlow() {
  return (
    <>
      <LinearGradient colors={['#163565', '#061124', '#061124', '#0D2146']} locations={[0, 0.24, 0.76, 1]} style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} pointerEvents="none" />
      <LinearGradient colors={['#24518F8F', '#16356552', 'transparent', 'transparent', '#16356552', '#24518F8F']} locations={[0, 0.025, 0.075, 0.925, 0.975, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} pointerEvents="none" />
    </>
  );
}

export default function BankSettingsScreen() {
  const router     = useRouter();
  const { logout } = useAuth();

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={25} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={s.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {SETTINGS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={s.option}
            activeOpacity={0.8}
            onPress={() => router.push(item.route as any)}
          >
            <RowGlow />
            <View style={s.optLeft}>
              <Ionicons name={item.icon as any} size={20} color={ORANGE} />
              <Text style={s.optText}>{item.title}</Text>
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
          <RowGlow />
          <View style={s.optLeft}>
            <Ionicons name="log-out-outline" size={20} color="#FF4B4B" />
            <Text style={[s.optText, { color: '#FF4B4B' }]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 24,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title:   { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },

  list: { paddingHorizontal: 20, paddingTop: 10, gap: 10, paddingBottom: 40 },

  option: {
    height: 54, borderRadius: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BG,
    borderWidth: 1, borderColor: '#829fd0',
    overflow: 'hidden',
  },
  optLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optText:  { color: '#D6DCEF', fontSize: 13, fontFamily: 'Poppins_500Medium' },
});
