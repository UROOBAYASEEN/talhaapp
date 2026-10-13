import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

const ORANGE = '#e2671b';
const RED    = '#e74c3c';

type ToggleKey = 'profileVisible' | 'showPhone' | 'showEmail' | 'loginAlerts';

export default function SecurityScreen() {
  const router     = useRouter();
  const T          = useAppColors();
  const { token, logout } = useAuth();

  const [settings, setSettings] = useState<Record<ToggleKey, boolean>>({
    profileVisible: true, showPhone: false, showEmail: false, loginAlerts: true,
  });

  function toggle(key: ToggleKey) { setSettings(p => ({ ...p, [key]: !p[key] })); }

  function handleDeleteAccount() {
    Alert.alert('Delete Account', 'This will permanently deactivate your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await fetch(`${API_BASE}/profile/me`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
          logout();
        } catch { Alert.alert('Error', 'Could not delete account. Try again later.'); }
      }},
    ]);
  }

  const PRIVACY: { key: ToggleKey; icon: string; label: string; sub: string }[] = [
    { key: 'profileVisible', icon: 'eye-outline',    label: 'Public Profile',    sub: 'Allow others to view your profile' },
    { key: 'showPhone',      icon: 'call-outline',   label: 'Show Phone Number', sub: 'Display phone on your listings' },
    { key: 'showEmail',      icon: 'mail-outline',   label: 'Show Email',        sub: 'Display email on your listings' },
    { key: 'loginAlerts',    icon: 'shield-outline', label: 'Login Alerts',      sub: 'Get notified of new logins' },
  ];

  const LINKS = [
    { icon: 'lock-closed-outline',      label: 'Change Password', onPress: () => router.push('/profile/change-password' as any) },
    { icon: 'document-text-outline',    label: 'Terms of Service', onPress: () => Alert.alert('Terms of Service', 'Coming soon') },
    { icon: 'shield-checkmark-outline', label: 'Privacy Policy',  onPress: () => Alert.alert('Privacy Policy', 'Coming soon') },
  ];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: T.bg }]}>
      <View style={[s.header, { borderBottomColor: T.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { backgroundColor: T.glassBg }]}>
          <Ionicons name="arrow-back" size={22} color={T.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: T.textPrimary }]}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[s.sectionLabel, { color: T.textSecondary }]}>PRIVACY</Text>
        <View style={[s.card, { backgroundColor: T.glassBg, borderColor: T.glassBorder }]}>
          {PRIVACY.map((item, i) => (
            <View key={item.key}>
              <View style={s.row}>
                <View style={s.iconWrap}><Ionicons name={item.icon as any} size={20} color={ORANGE} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.rowLabel, { color: T.textPrimary }]}>{item.label}</Text>
                  <Text style={[s.rowSub, { color: T.textSecondary }]}>{item.sub}</Text>
                </View>
                <Switch
                  value={settings[item.key]}
                  onValueChange={() => toggle(item.key)}
                  trackColor={{ false: T.isDark ? '#1a2a4a' : '#ccc', true: ORANGE }}
                  thumbColor={T.isDark ? T.textPrimary : '#ffffff'}
                  ios_backgroundColor={T.isDark ? '#1a2a4a' : '#ccc'}
                />
              </View>
              {i < PRIVACY.length - 1 && <View style={[s.sep, { backgroundColor: T.divider }]} />}
            </View>
          ))}
        </View>

        <Text style={[s.sectionLabel, { color: T.textSecondary }]}>SECURITY</Text>
        <View style={[s.card, { backgroundColor: T.glassBg, borderColor: T.glassBorder }]}>
          {LINKS.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity style={s.linkRow} onPress={item.onPress} activeOpacity={0.8}>
                <View style={s.iconWrap}><Ionicons name={item.icon as any} size={20} color={ORANGE} /></View>
                <Text style={[s.rowLabel, { color: T.textPrimary, flex: 1 }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={T.textSecondary} />
              </TouchableOpacity>
              {i < LINKS.length - 1 && <View style={[s.sep, { backgroundColor: T.divider }]} />}
            </View>
          ))}
        </View>

        <Text style={[s.sectionLabel, { color: T.textSecondary }]}>DANGER ZONE</Text>
        <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={20} color={RED} />
          <Text style={s.deleteTxt}>Delete Account</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#010a1f' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  backBtn:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  scroll:      { padding: 16, gap: 14, paddingBottom: 40 },
  sectionLabel:{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1.2 },
  card:        { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  iconWrap:    { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(226,103,27,0.12)', alignItems: 'center', justifyContent: 'center' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  linkRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  sep:         { height: 0.5, marginHorizontal: 16 },
  rowLabel:    { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  rowSub:      { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  deleteBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 32, borderWidth: 1, borderColor: RED, backgroundColor: 'rgba(231,76,60,0.08)', gap: 8 },
  deleteTxt:   { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: RED },
});
