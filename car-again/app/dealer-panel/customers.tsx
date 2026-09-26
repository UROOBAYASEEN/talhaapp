import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#e2671b';
const C = AppColors;

function CustomerCard({ customer }: { customer: any }) {
  const router = useRouter();
  const initials = (customer.full_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={cc.card}>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      <View style={cc.row}>
        <View style={cc.avatar}>
          <Text style={cc.avatarTxt}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cc.name}>{customer.full_name || 'Customer'}</Text>
          <Text style={cc.meta}>{customer.email || customer.phone || 'No contact'}</Text>
          {customer.last_enquiry && (
            <Text style={cc.enquiry} numberOfLines={1}>Last: {customer.last_enquiry}</Text>
          )}
        </View>
        <TouchableOpacity style={cc.chatBtn} onPress={() => router.push({ pathname: '/chat-room/[id]', params: { id: customer.id, name: customer.full_name || 'Customer' } })}>
          <Ionicons name="chatbubble-outline" size={16} color={ORANGE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cc = StyleSheet.create({
  card:     { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: C.glassBg, overflow: 'hidden', padding: 12, marginBottom: 10 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:   { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a4a8a', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:{ fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#fff' },
  name:     { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  meta:     { fontSize: 11, fontFamily: 'Poppins_400Regular', color: C.textSecondary, marginTop: 1 },
  enquiry:  { fontSize: 11, fontFamily: 'Poppins_400Regular', color: ORANGE, marginTop: 2 },
  chatBtn:  { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(226,103,27,0.4)', alignItems: 'center', justifyContent: 'center' },
});

export default function CustomersScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRef]      = useState(false);
  const [search, setSearch]       = useState('');

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    if (!token || !user?.id) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/dealers/${user.id}/customers?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setCustomers(d.items || d || []);
      }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }

  const filtered = search
    ? customers.filter(c => (c.full_name || '').toLowerCase().includes(search.toLowerCase()))
    : customers;

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={s.title}>Customers</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={s.searchWrap}>
          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <Ionicons name="search-outline" size={18} color={C.textSecondary} />
          <TextInput
            style={s.searchInput}
            placeholder="Search customers..."
            placeholderTextColor={C.textPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={ORANGE} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id || String(Math.random())}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRef(true); await fetchCustomers(); setRef(false); }} tintColor={ORANGE} />}
          renderItem={({ item }) => <CustomerCard customer={item} />}
          ListEmptyComponent={() => (
            <View style={s.empty}>
              <Ionicons name="people-outline" size={48} color={C.textSecondary} />
              <Text style={s.emptyTxt}>No customers yet</Text>
              <Text style={s.emptySub}>Customers who interact with you will appear here</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  back:           { width: 36, height: 36, borderRadius: 18, backgroundColor: C.glassBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)' },
  title:          { fontSize: 18, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  searchWrap:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 12, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: C.glassBg, paddingHorizontal: 16, paddingVertical: 12, overflow: 'hidden' },
  searchInput:    { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', color: C.textPrimary },
  list:           { paddingHorizontal: 16, paddingBottom: 40 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:          { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTxt:       { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  emptySub:       { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary, textAlign: 'center', paddingHorizontal: 24 },
});
