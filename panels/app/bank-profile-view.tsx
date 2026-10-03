import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Phone, Mail, MapPin, Globe } from 'lucide-react-native';
import { API_BASE } from '@/constants/api';

const ORANGE = '#e2671b';
const SERVER = API_BASE.replace('/api/v1', '');

function resolveUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}

function InfoRow({ icon, label, value, isLast }: {
  icon: React.ReactNode; label: string; value: string; isLast?: boolean;
}) {
  return (
    <View style={[ir.row, !isLast && ir.border]}>
      <View style={ir.left}>
        {icon}
        <Text style={ir.label}>{label}</Text>
      </View>
      <Text style={ir.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}
const ir = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingVertical: 18 },
  border:{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  left:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { color: '#9A97A6', fontSize: 15, fontFamily: 'Poppins_400Regular' },
  value: { color: '#F2F1F5', fontSize: 12.5, fontFamily: 'Poppins_400Regular', maxWidth: '55%', textAlign: 'right', lineHeight: 20 },
});

export default function BankProfileViewScreen() {
  const router  = useRouter();
  const { bankId } = useLocalSearchParams<{ bankId?: string }>();

  const [bank,    setBank]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bankId) { setLoading(false); return; }
    fetch(`${API_BASE}/financing/banks/${bankId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBank(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bankId]);

  const avatarUrl  = resolveUrl(bank?.avatar_url);
  const coverUrl   = resolveUrl(bank?.cover_url || bank?.cover_photo_url);
  const initials   = (bank?.name || 'B').slice(0, 2).toUpperCase();
  const isIslamic  = bank?.bank_type === 'Islamic';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={ORANGE} size="large" />
        </View>
      ) : !bank ? (
        <View style={s.center}>
          <Text style={{ color: '#94a3b8', fontFamily: 'Poppins_400Regular' }}>Bank not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: ORANGE, fontFamily: 'Poppins_500Medium' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* COVER / HEADER */}
          <View style={s.coverWrap}>
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={['#0b1e4b', '#061B4A', '#010A1F']}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)']}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <ChevronLeft size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* LOGO + NAME */}
          <View style={s.profileRow}>
            <View style={s.logoWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.logoImg} resizeMode="cover" />
              ) : (
                <Text style={s.logoInitials}>{initials}</Text>
              )}
            </View>
            <View style={s.nameWrap}>
              <Text style={s.bankName}>{bank.name}</Text>
              <Text style={s.productName}>
                {bank.tagline || (isIslamic ? "Pakistan's Premier Islamic Bank" : bank.product_name || 'Commercial Bank')}
              </Text>
            </View>
          </View>

          {/* INFO CARD — Website / Phone / Email / Head Office */}
          <View style={[s.card, { backgroundColor: '#010A1F' }]}>
            {!!bank.website && (
              <InfoRow icon={<Globe size={20} color={ORANGE} />} label="Website" value={bank.website} />
            )}
            {!!bank.phone && (
              <InfoRow icon={<Phone size={20} color={ORANGE} />} label="Phone" value={bank.phone} />
            )}
            {!!bank.email && (
              <InfoRow icon={<Mail size={20} color={ORANGE} />} label="Email" value={bank.email} />
            )}
            <InfoRow
              icon={<MapPin size={20} color={ORANGE} />}
              label="Head Office"
              value={bank.head_office || bank.address || (bank.city ? `${bank.city}, Pakistan` : 'Pakistan')}
              isLast
            />
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#010A1F' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  coverWrap: { height: 180, width: '100%', overflow: 'hidden' },
  backBtn:   { position: 'absolute', top: 16, left: 16, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  profileRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, marginTop: -40 },
  logoWrap:    { width: 78, height: 78, borderRadius: 39, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#2E6B4F', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  logoImg:     { width: 74, height: 74, borderRadius: 37 },
  logoInitials:{ color: ORANGE, fontSize: 20, fontFamily: 'Poppins_700Bold' },
  nameWrap:    { paddingTop: 30, flex: 1 },
  bankName:    { color: '#F2F1F5', fontSize: 20, fontFamily: 'Poppins_500Medium' },
  productName: { color: '#C9C6D0', fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 6 },

  tagsRow:   { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 12, marginBottom: 20 },
  tag:       { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  tagTxt:    { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  ratingTag: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(226,103,27,0.3)', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(226,103,27,0.08)' },
  ratingTxt: { color: ORANGE, fontSize: 12, fontFamily: 'Poppins_500Medium' },

  sectionTitle: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold', paddingHorizontal: 20, marginBottom: 10 },

  card: {
    marginHorizontal: 6, borderRadius: 16, marginBottom: 20,
    marginTop: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#010A1F',
    paddingHorizontal: 8, paddingVertical: 4, overflow: 'hidden',
  },
});
