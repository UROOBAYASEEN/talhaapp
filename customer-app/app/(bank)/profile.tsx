import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ImageBackground, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Globe, Phone, Mail, MapPin, Edit2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { API_BASE } from '@/constants/api';
import { GlowCard } from '@/components/dealer/DealerUI';
import { useTabBarSpace } from '@/components/shared/PillTabBar';

const ORANGE = '#e8703a';
const BG     = '#010A1F';

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

function BankIcon() {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 46, height: 46 }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: 23, borderRightWidth: 23, borderBottomWidth: 14, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: ORANGE, marginBottom: 2 }} />
      <View style={{ flexDirection: 'row', gap: 3, marginBottom: 2 }}>
        {[0,1,2,3].map(i => <View key={i} style={{ width: 5, height: 18, backgroundColor: ORANGE, borderRadius: 1 }} />)}
      </View>
      <View style={{ width: 40, height: 4, backgroundColor: ORANGE, borderRadius: 1 }} />
    </View>
  );
}

export default function BankProfileScreen() {
  const tabSpace = useTabBarSpace(120);
  const { logout, token, user } = useAuth();
  const router = useRouter();

  const [profile,  setProfile]  = useState<any>(null);
  const [stats,    setStats]    = useState({ submitted: 0, approved: 0, reviewing: 0, total: 0 });
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [pRes, sRes] = await Promise.all([
          fetch(`${API_BASE}/profile/me`,           { headers }),
          fetch(`${API_BASE}/financing/bank/stats`, { headers }),
        ]);
        if (pRes.ok) setProfile(await pRes.json());
        if (sRes.ok) setStats(await sRes.json());
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  const statCards = [
    { label: 'Branches',          value: profile?.branches    || '35+'                },
    { label: 'Active Customers',  value: String(stats.total)                          },
    { label: 'Financing Cases',   value: String(stats.approved)                       },
  ];

  const infoRows = [
    { Icon: Globe,  label: 'Website',     value: user?.website     || profile?.website    || 'N/A' },
    { Icon: Phone,  label: 'Phone',       value: user?.phone       || profile?.phone      || 'N/A' },
    { Icon: Mail,   label: 'Email',       value: user?.email       || profile?.email      || 'N/A' },
    { Icon: MapPin, label: 'Head Office', value: user?.location    || user?.city          || profile?.location || profile?.city || 'N/A' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ActivityIndicator color={ORANGE} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabSpace }}>

        {/* HERO */}
        <ImageBackground
          source={
            user?.cover_photo_url
              ? { uri: user.cover_photo_url }
              : { uri: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1200&auto=format&fit=crop' }
          }
          style={s.hero}
        >
          <LinearGradient colors={['rgba(10,26,51,0.35)', 'rgba(10,26,51,0.55)', '#010A1F']} style={StyleSheet.absoluteFillObject} />
          <View style={s.logoCircle}>
            {user?.avatar_url
              ? <Image source={{ uri: user.avatar_url }} style={{ width: 92, height: 92, borderRadius: 46 }} resizeMode="cover" />
              : <BankIcon />
            }
          </View>
          <Text style={s.bankName}>{user?.full_name || profile?.full_name || 'Bank'}</Text>
          <Text style={s.bankSub}>{user?.bio || profile?.bio || 'Bank Representative'}</Text>
        </ImageBackground>

        {/* STATS */}
        <View style={s.statsRow}>
          {statCards.map(item => (
            <GlowCard key={item.label} style={s.statCard} radius={14}>
              <Text style={s.statLabel}>{item.label}</Text>
              <Text style={s.statValue}>{item.value}</Text>
            </GlowCard>
          ))}
        </View>

        {/* INFO CARD */}
        <View style={s.infoCard}>
          {infoRows.map((row, i) => (
            <View key={row.label} style={[s.infoRow, i !== infoRows.length - 1 && s.infoRowBorder]}>
              <row.Icon size={20} color={ORANGE} style={{ flexShrink: 0 }} />
              <View style={s.infoTexts}>
                <Text style={s.infoLabel}>{row.label}</Text>
                <Text style={s.infoValue} numberOfLines={2}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* EDIT PROFILE */}
        <GlowCard style={s.editWrap} radius={26} onPress={() => router.push('/bank-edit-profile' as any)}>
          <Text style={s.editText}>Edit Profile</Text>
        </GlowCard>


      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  hero:       { height: 300, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 22 },
  logoCircle: { position: 'absolute', top: 72, width: 100, height: 100, borderRadius: 50, backgroundColor: '#f4ede3', borderWidth: 4, borderColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  bankName:   { color: '#fff', fontSize: 24, fontFamily: 'Poppins_600SemiBold', marginTop: 34 },
  bankSub:    { color: '#C9BDC4', fontSize: 15, fontFamily: 'Poppins_400Regular', marginTop: 4 },

  statsRow:  { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 4 },
  statCard:  { flex: 1, padding: 14, minHeight: 92 },
  statLabel: { color: '#E6E1E8', fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 4, lineHeight: 17 },
  statValue: { color: '#ffffff', fontSize: 20, fontFamily: 'Poppins_600SemiBold' },

  infoCard:      { marginHorizontal: 16, marginTop: 22, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: BG },
  infoRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 20 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.14)' },
  infoTexts:     { flex: 1, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 },
  infoLabel:     { color: '#9C96A2', fontSize: 16, fontFamily: 'Poppins_400Regular' },
  infoValue:     { color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'right', flex: 1, minWidth: 100, lineHeight: 20 },

  editWrap: { alignItems: 'center', justifyContent: 'center', marginHorizontal: 26, marginTop: 26, height: 52 },
  editText: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_500Medium' },

  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.4)', borderRadius: 30, paddingVertical: 12 },
  logoutText: { color: '#f87171', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});
