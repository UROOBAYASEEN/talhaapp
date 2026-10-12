import React, { useState } from 'react';
import {
  Alert, View, Text, StyleSheet,
  TouchableOpacity, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTabBarSpace } from '@/components/shared/PillTabBar';

const SETTINGS = [
  { title: 'Change Password',    icon: 'lock-closed-outline',        route: '/profile/change-password' },
  { title: 'Help Center',        icon: 'help-circle-outline',        route: '/profile/help'            },
  { title: 'Terms & Conditions', icon: 'document-text-outline',      route: '/profile/terms'           },
  { title: 'About Autowizor',    icon: 'information-circle-outline', route: '/profile/about'           },
];

// Same row glow as the Dealer settings screen (app/profile/settings.tsx, dark)
function RowGlow() {
  return (
    <>
      <LinearGradient colors={['#163565', '#061124', '#061124', '#0D2146']} locations={[0, 0.24, 0.76, 1]} style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} pointerEvents="none" />
      <LinearGradient colors={['#24518F8F', '#16356552', 'transparent', 'transparent', '#16356552', '#24518F8F']} locations={[0, 0.025, 0.075, 0.925, 0.975, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} pointerEvents="none" />
    </>
  );
}

export default function BecomeSellerSettingsScreen() {
  const tabSpace = useTabBarSpace(40);
  const router = useRouter();
  const { logout } = useAuth();
  const [sellerOn, setSellerOn] = useState(true);

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={25} color="#f9fafc" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: tabSpace }]}>
        <View style={s.list}>

          {/* Become A Seller toggle — OFF → back to the customer flow */}
          <View style={s.option}>
            <RowGlow />
            <View style={s.optionLeft}>
              <Ionicons name="pricetag-outline" size={20} color="#e2671b" />
              <Text style={s.optionText}>Become A Seller</Text>
            </View>
            <Switch
              value={sellerOn}
              onValueChange={v => { setSellerOn(v); if (!v) router.replace('/(tabs)' as any); }}
              trackColor={{ false: '#0B2E6B', true: '#0B2E6B' }}
              thumbColor="#ffffff"
              ios_backgroundColor="#0B2E6B"
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginRight: -6 }}
            />
          </View>

          {SETTINGS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={s.option}
              activeOpacity={0.8}
              onPress={() => router.push(item.route as any)}
            >
              <RowGlow />
              <View style={s.optionLeft}>
                <Ionicons name={item.icon as any} size={20} color="#e2671b" />
                <Text style={s.optionText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#baacb6" />
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
            <View style={s.optionLeft}>
              <Ionicons name="log-out-outline" size={20} color="#FF4B4B" />
              <Text style={[s.optionText, { color: '#FF4B4B' }]}>Logout</Text>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#010A1F' },

  header: {
    height: 70, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 24,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },

  scroll: { paddingBottom: 40 },
  list:   { paddingHorizontal: 20, paddingTop: 10, gap: 10 },

  option: {
    height: 54, borderRadius: 16,
    paddingHorizontal: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#010A1F',
    borderWidth: 1, borderColor: '#829fd0',
    overflow: 'hidden',
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionText: { color: '#E6E1E8', fontSize: 13, fontFamily: 'Poppins_500Medium' },
});
