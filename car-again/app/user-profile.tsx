import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors } from '@/constants/theme';

const BG = AppColors.bg;
const ORANGE = AppColors.gradientEnd;
const SERVER = API_BASE.replace('/api/v1', '');
function resolveUrl(u?: string | null) {
  if (!u) return null;
  if (u.startsWith('http')) return u.replace(/http:\/\/[\d.]+:\d+/, SERVER);
  return `${SERVER}${u}`;
}

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const h: any = token ? { Authorization: `Bearer ${token}` } : {};
        // sellers/{id} returns any role (customer also) — dealers/{id} would 404 for customer
        const res = await fetch(`${API_BASE}/sellers/${id}`, { headers: h });
        if (res.ok) setUser(await res.json());
        else {
          // fallback: try dealers
          const r2 = await fetch(`${API_BASE}/dealers/${id}`, { headers: h });
          if (r2.ok) setUser(await r2.json());
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id, token]);

  if (loading)
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: BG }]}>
        <ActivityIndicator color={ORANGE} style={{ marginTop: 80 }} size="large" />
      </SafeAreaView>
    );
  if (!user)
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: BG, alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
        <Ionicons name="person-circle-outline" size={56} color="#8f9cb5" />
        <Text style={{ color: '#f9fafc', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }}>User not found</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: ORANGE, fontFamily: 'Poppins_500Medium' }}>Go Back</Text></TouchableOpacity>
      </SafeAreaView>
    );

  const avatar = resolveUrl(user.avatar_url);
  const cover = resolveUrl(user.cover_url || user.cover_photo_url);
  const name = user.full_name || 'User';
  const initial = name.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: BG }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#f9fafc" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>User Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={s.bannerWrap}>
          {cover ? <Image source={{ uri: cover }} style={s.banner} resizeMode="cover" /> : <LinearGradient colors={['#1a2440', '#0e1526']} style={s.banner} />}
          <View style={s.avatarWrap}>
            {avatar ? <Image source={{ uri: avatar }} style={s.avatar} resizeMode="cover" /> : <View style={[s.avatar, { backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: '#fff', fontSize: 28, fontFamily: 'Poppins_700Bold' }}>{initial}</Text></View>}
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.name}>{name}</Text>
          <Text style={s.role}>{(user.role || 'customer').replace(/_/g, ' ')} {user.is_verified ? '• Verified' : ''}</Text>

          <View style={s.infoCard}>
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <View style={s.row}><Ionicons name="call-outline" size={16} color={ORANGE} /><Text style={s.rowLabel}>Phone</Text><Text style={s.rowVal}>{user.phone || '—'}</Text></View>
            <View style={s.divider} />
            <View style={s.row}><Ionicons name="mail-outline" size={16} color={ORANGE} /><Text style={s.rowLabel}>Email</Text><Text style={s.rowVal} numberOfLines={1}>{user.email || '—'}</Text></View>
            <View style={s.divider} />
            <View style={s.row}><Ionicons name="location-outline" size={16} color={ORANGE} /><Text style={s.rowLabel}>City</Text><Text style={s.rowVal}>{user.city || '—'}</Text></View>
            <View style={s.divider} />
            <View style={s.row}><Ionicons name="calendar-outline" size={16} color={ORANGE} /><Text style={s.rowLabel}>Member Since</Text><Text style={s.rowVal}>{user.member_since ? new Date(user.member_since).toLocaleDateString() : '—'}</Text></View>
            {user.bio ? <><View style={s.divider} /><View style={s.row}><Ionicons name="person-outline" size={16} color={ORANGE} /><Text style={s.rowLabel}>Bio</Text><Text style={[s.rowVal, { flex: 1, marginLeft: 8, textAlign: 'right' }]}>{user.bio}</Text></View></> : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#f9fafc', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  bannerWrap: { height: 180, position: 'relative' },
  banner: { width: '100%', height: 180 },
  avatarWrap: { position: 'absolute', bottom: -36, left: 20, width: 78, height: 78, borderRadius: 39, borderWidth: 3, borderColor: '#010A1F', overflow: 'hidden', backgroundColor: '#1a2a4a' },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  body: { paddingHorizontal: 20, paddingTop: 52 },
  name: { color: '#f9fafc', fontSize: 20, fontFamily: 'Poppins_700Bold' },
  role: { color: '#8f9cb5', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2, textTransform: 'capitalize' },
  infoCard: { marginTop: 18, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', backgroundColor: 'rgba(3,12,40,0.6)', padding: 16, overflow: 'hidden', gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowLabel: { color: '#8f9cb5', fontSize: 12, fontFamily: 'Poppins_400Regular', width: 90 },
  rowVal: { color: '#f9fafc', fontSize: 13, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
});
