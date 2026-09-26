import React, { useState } from 'react';
import {
  Alert, View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import AdminFooter from '@/components/admin/AdminFooter';
import { Image } from 'react-native';
import { AppColors, useAppColors } from '@/constants/theme';

const ORANGE = '#FF6B00';
const WHITE  = '#F4F4F7';

const SETTINGS = [
  { title: 'Add Partner',                     icon: 'person-add-outline',       route: '/(admin)/add-partner'           },
  { title: 'Add Banner',                       icon: 'image-outline',             route: '/(admin)/add-banner'            },
  { title: 'Send Notification',               icon: 'send-outline',              route: '/(admin)/send-notification'     },
  { title: 'Approve Listings',                icon: 'checkmark-circle-outline',  route: '/(admin)/approve-listings'      },
  { title: 'Manage Subscriptions',            icon: 'settings-outline',          route: '/(admin)/manage-subscriptions'  },
];

const PAYMENT_ITEMS = [
  { title: 'Subscription',           icon: 'card-outline',    route: '/(admin)/subscription' },
  { title: 'Advertisement Payment',  icon: 'cash-outline',    route: '/(admin)/ad-payment'   },
];

function OptionRow({
  icon, title, onPress, danger = false, chevron = true,
}: {
  icon: string; title: string; onPress: () => void; danger?: boolean; chevron?: boolean;
}) {
  const aC = useAppColors();
  return (
    <TouchableOpacity
      style={[s.option, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {aC.isDark ? (
        <>
          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      ) : (
        <>
          <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      )}
      <View style={s.optionLeft}>
        <Ionicons name={icon as any} size={20} color={danger ? '#FF4B4B' : ORANGE} />
        <Text style={[s.optionText, { color: danger ? '#FF4B4B' : (aC.isDark ? WHITE : '#010a1f') }]}>{title}</Text>
      </View>
      {chevron && <Ionicons name="chevron-forward" size={20} color={aC.isDark ? "rgba(255,255,255,0.35)" : "rgba(3,42,105,0.35)"} />}
    </TouchableOpacity>
  );
}

export default function ActionsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const aC = useAppColors();
  const [payOpen, setPayOpen] = useState(false);

  return (
    <View style={[s.container, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />
      <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]}>

        {/* Header */}
        <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={25} color={aC.isDark ? WHITE : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* Main options */}
          <View style={s.list}>
            {SETTINGS.map((item) => (
              <OptionRow
                key={item.title}
                icon={item.icon}
                title={item.title}
                onPress={() => router.push(item.route as any)}
              />
            ))}

            {/* Payments — expandable */}
            <TouchableOpacity style={[s.option, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]} activeOpacity={0.8} onPress={() => setPayOpen(p => !p)}>
              {aC.isDark ? (
                <>
                  <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              ) : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              <View style={s.optionLeft}>
                <Ionicons name="card-outline" size={20} color={ORANGE} />
                <Text style={[s.optionText, { color: aC.isDark ? WHITE : '#010a1f' }]}>Payments</Text>
              </View>
              <Ionicons
                name={payOpen ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color={aC.isDark ? "rgba(255,255,255,0.35)" : "rgba(3,42,105,0.35)"}
              />
            </TouchableOpacity>

            {/* Payment dropdown */}
            {payOpen && (
              <View style={[s.dropdown, { backgroundColor: aC.isDark ? 'rgba(1,10,31,0.95)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.25)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
                {PAYMENT_ITEMS.map((item, i) => (
                  <TouchableOpacity
                    key={item.title}
                    style={[s.dropItem, i < PAYMENT_ITEMS.length - 1 && [s.dropBorder, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.06)' }]]}
                    activeOpacity={0.8}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View style={s.dropDot} />
                    <Ionicons name={item.icon as any} size={16} color={ORANGE} style={{ marginRight: 10 }} />
                    <Text style={[s.dropTxt, { color: aC.isDark ? WHITE : '#010a1f' }]}>{item.title}</Text>
                    <Ionicons name="chevron-forward" size={16} color={aC.isDark ? "rgba(255,255,255,0.3)" : "rgba(3,42,105,0.35)"} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Logout */}
            <TouchableOpacity
              style={[s.option, { borderColor: 'rgba(255,75,75,0.35)', backgroundColor: aC.isDark ? 'rgba(255,56,60,0.05)' : 'rgba(255,56,60,0.06)' }]}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert('Logout', 'Are you sure you want to logout?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: logout },
                ])
              }
            >
              <View style={s.optionLeft}>
                <Ionicons name="log-out-outline" size={20} color="#FF4B4B" />
                <Text style={[s.optionText, { color: '#FF4B4B' }]}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        <AdminFooter active="actions" />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.bg },
  safe:      { flex: 1, backgroundColor: AppColors.bg },

  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: WHITE, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },

  scroll: { paddingBottom: 20 },

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
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionText: { color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium' },

  dropdown: {
    marginTop: -4,
    marginHorizontal: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(1,10,31,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.25)',
    overflow: 'hidden',
  },
  dropItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  dropBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  dropDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE, marginRight: 10 },
  dropTxt: { flex: 1, color: WHITE, fontSize: 13, fontFamily: 'Poppins_400Regular' },
});
