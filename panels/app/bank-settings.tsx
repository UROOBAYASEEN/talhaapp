import React from 'react';
import {
  Alert, View, Text, StyleSheet,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

export default function BankSettingsScreen() {
  const router     = useRouter();
  const { logout } = useAuth();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
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
            <GlassInset />
            <View style={s.optLeft}>
              <View style={s.iconWrap}>
                <Ionicons name={item.icon as any} size={18} color={ORANGE} />
              </View>
              <Text style={s.optText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={[s.option, { borderColor: 'rgba(248,113,113,0.4)' }]}
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: logout },
            ])
          }
        >
          <GlassInset />
          <View style={s.optLeft}>
            <View style={[s.iconWrap, { backgroundColor: 'rgba(248,113,113,0.12)' }]}>
              <Ionicons name="log-out-outline" size={18} color="#f87171" />
            </View>
            <Text style={[s.optText, { color: '#f87171' }]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(49,95,173,0.4)',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title:   { color: '#fff', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },

  list: { paddingHorizontal: 20, paddingTop: 14, gap: 10, paddingBottom: 40 },

  option: {
    height: 56, borderRadius: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    overflow: 'hidden',
  },
  optLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(226,103,27,0.12)', alignItems: 'center', justifyContent: 'center' },
  optText:  { color: '#f9fafc', fontSize: 13, fontFamily: 'Poppins_500Medium' },
});
