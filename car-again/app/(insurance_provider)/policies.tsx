import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, ArrowDownUp, ChevronRight, Check } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

const ORANGE = '#e2671b';
const C = AppColors;

const FILTERS = ['All', 'Insurance', 'Insurance + Tracker'];

const SORT_OPTIONS = [
  { key: 'name_asc',     label: 'Name (A → Z)' },
  { key: 'name_desc',    label: 'Name (Z → A)' },
  { key: 'premium_high', label: 'Premium (High → Low)' },
  { key: 'premium_low',  label: 'Premium (Low → High)' },
  { key: 'expires_asc',  label: 'Expires (Soonest)' },
  { key: 'expires_desc', label: 'Expires (Latest)' },
  { key: 'status',       label: 'Status (Active first)' },
];

const STATUS_COLOR: Record<string, string> = {
  submitted: '#3b6fd6',
  reviewing: '#f59e0b',
  approved:  '#e2671b',
  rejected:  '#ef4444',
  draft:     '#6b7280',
};

const SERVER_BASE = API_BASE.replace('/api/v1', '');
function mapApp(app: any, idx: number): any {
  const status = app.status ?? 'submitted';
  const avatar = app.customer_avatar || app.avatar_url || null;
  const premiumVal = app.premium ?? 0;
  const premiumTxt = premiumVal ? `PKR ${Number(premiumVal).toLocaleString()}` : '—';
  const estimatedVal = app.estimated_value ?? 0;
  const priceTxt = estimatedVal ? `PKR ${Number(estimatedVal).toLocaleString()}` : '—';
  const vehicle = app.vehicle || (app.brand && app.model ? `${app.brand} ${app.model} ${app.year || ''}`.trim() : '—');
  return {
    id:         app.id,
    userId:     app.user_id || app.userId || '',
    name:       app.customer || app.name || app.full_name || '—',
    policy_id:  app.policy_id || `IC-${String(app.id).slice(-8).toUpperCase()}`,
    status:     status.charAt(0).toUpperCase() + status.slice(1),
    statusColor: STATUS_COLOR[status] ?? '#6b7280',
    vehicle,
    premium:    premiumTxt,
    price:      priceTxt,
    premiumVal,
    estimatedVal,
    expires:    app.preferred_date || '—',
    expiresTs:  app.created_at ? new Date(app.created_at).getTime() : 0,
    img:        avatar ? (avatar.startsWith('http') ? avatar : `${SERVER_BASE}${avatar}`) : null,
    plan_name:  app.plan_name || '—',
    phone:      app.phone || '',
    email:      app.email || '',
    has_tracker: !!app.has_tracker,
    type:       app.has_tracker ? 'Insurance + Tracker' : 'Insurance',
  };
}

function applySortKey(list: any[], key: string) {
  const sorted = [...list];
  switch (key) {
    case 'name_asc':     return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc':    return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'premium_high': return sorted.sort((a, b) => (b.premiumVal ?? 0) - (a.premiumVal ?? 0));
    case 'premium_low':  return sorted.sort((a, b) => (a.premiumVal ?? 0) - (b.premiumVal ?? 0));
    case 'expires_asc':  return sorted.sort((a, b) => (a.expiresTs ?? 0) - (b.expiresTs ?? 0));
    case 'expires_desc': return sorted.sort((a, b) => (b.expiresTs ?? 0) - (a.expiresTs ?? 0));
    case 'status':       return sorted.sort((a, b) => (a.status === 'Active' ? -1 : 1) - (b.status === 'Active' ? -1 : 1));
    default:             return sorted;
  }
}

function PolicyCard({ policy }: { policy: any }) {
  const router = useRouter();
  return (
    <View style={pc.card}>
      <LinearGradient colors={['rgba(22,64,136,0.5)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.5)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.5)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      <View style={pc.topRow}>
        <TouchableOpacity
          onPress={() => policy.userId && router.push({ pathname: '/user-profile' as any, params: { id: policy.userId } })}
          activeOpacity={0.85}
        >
          {policy.img ? (
            <Image source={{ uri: policy.img }} style={pc.avatar} />
          ) : (
            <View style={[pc.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: ORANGE }]}>
              <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' }}>{String(policy.name).charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={() => policy.userId && router.push({ pathname: '/user-profile' as any, params: { id: policy.userId } })} activeOpacity={0.75}>
          <Text style={pc.name}>{policy.name}</Text>
          <Text style={pc.policyId}>{policy.policy_id}{policy.plan_name && policy.plan_name !== '—' ? ` • ${policy.plan_name}` : ''}</Text>
          {policy.has_tracker ? (
            <View style={{ alignSelf: 'flex-start', marginTop: 4, backgroundColor: 'rgba(232,121,43,0.15)', borderWidth: 1, borderColor: ORANGE, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
              <Text style={{ color: ORANGE, fontSize: 9, fontFamily: 'Poppins_600SemiBold' }}>Insurance + Tracker</Text>
            </View>
          ) : null}
        </TouchableOpacity>
        <View style={[pc.statusBadge, { backgroundColor: policy.statusColor }]}>
          <View style={pc.statusDot} />
          <Text style={pc.statusTxt}>{policy.status}</Text>
        </View>
      </View>

      <View style={pc.midRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={pc.fieldLabel}>VEHICLE</Text>
          <Text style={pc.fieldValue} numberOfLines={1}>{policy.vehicle}</Text>
          {policy.phone ? <Text style={[pc.fieldLabel, { marginTop: 4, color: '#9fb0cc' }]} numberOfLines={1}>{policy.phone}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
          <Text style={pc.fieldLabel}>PREMIUM</Text>
          <Text style={[pc.fieldValue, { color: ORANGE }]}>{policy.premium}</Text>
          <Text style={[pc.fieldLabel, { marginTop: 2, color: '#9fb0cc', fontSize: 9 }]}>Price: {policy.price}</Text>
        </View>
      </View>

      <View style={pc.divider} />

      <View style={pc.footer}>
        <Text style={pc.expires}>Expires: {policy.expires}</Text>
        <TouchableOpacity style={pc.viewBtn} onPress={() => router.push({ pathname: '/insurance-application-detail' as any, params: { id: policy.id } })}>
          <Text style={pc.viewTxt}>View Details</Text>
          <ChevronRight size={14} color={ORANGE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pc = StyleSheet.create({
  card:        { borderRadius: 16, overflow: 'hidden', padding: 14, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)' },
  topRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar:      { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a2a4a' },
  name:        { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  policyId:    { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  statusTxt:   { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  midRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  fieldLabel:  { fontSize: 10, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', letterSpacing: 0.8, marginBottom: 3 },
  fieldValue:  { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  divider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 12 },
  footer:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expires:     { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#9fb0cc' },
  viewBtn:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewTxt:     { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: ORANGE },
});

export default function InsurancePoliciesScreen() {
  const { token } = useAuth();
  const [data, setData]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRef]      = useState(false);

  const fetchPolicies = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/insurance/provider/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const raw = await res.json();
        setData((raw || []).map((a: any, i: number) => mapApp(a, i)));
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRef(false); }
  }, [token]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);
  const [activeFilter, setFilter] = useState('All');
  const [search, setSearch]       = useState('');
  const [sortKey, setSortKey]     = useState('');
  const [sortModal, setSortModal] = useState(false);

  const filtered = (() => {
    let list = data.filter(p => {
      const matchFilter = activeFilter === 'All' || p.type === activeFilter;
      const matchSearch = !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.vehicle?.toLowerCase().includes(search.toLowerCase()) ||
        p.policy_id?.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
    if (sortKey) list = applySortKey(list, sortKey);
    return list;
  })();

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <Text style={s.title}>Policy Applications</Text>
        </View>

        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <Search size={16} color="#8f9cb5" />
            <TextInput style={s.searchInput} placeholder="Search by name, vehicle or ID..." placeholderTextColor="#8f9cb5" value={search} onChangeText={setSearch} />
          </View>
          <TouchableOpacity style={s.sortBtn} onPress={() => setSortModal(true)}>
            <ArrowDownUp size={15} color={sortKey ? ORANGE : '#8f9cb5'} />
            <Text style={[s.sortTxt, { color: sortKey ? ORANGE : '#8f9cb5' }]}>Sort</Text>
          </TouchableOpacity>
        </View>

        <View style={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.chip, activeFilter === f && s.chipActive]} onPress={() => setFilter(f)}>
              <Text style={[s.chipTxt, activeFilter === f && s.chipTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={ORANGE} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRef(true); fetchPolicies(); }} tintColor={ORANGE} />}
          renderItem={({ item }) => <PolicyCard policy={item} />}
          ListEmptyComponent={() => (
            <View style={s.empty}><Text style={s.emptyTxt}>No policies found</Text></View>
          )}
        />
      )}

      <Modal visible={sortModal} transparent animationType="fade" onRequestClose={() => setSortModal(false)}>
        <TouchableWithoutFeedback onPress={() => setSortModal(false)}>
          <View style={m.overlay}>
            <TouchableWithoutFeedback>
              <View style={m.sheet}>
                <LinearGradient colors={['rgba(22,64,136,0.3)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(29,83,175,0.3)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <Text style={m.title}>Sort By</Text>
                <View style={m.divider} />
                {SORT_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt.key} style={m.row} onPress={() => { setSortKey(opt.key === sortKey ? '' : opt.key); setSortModal(false); }}>
                    <Text style={[m.label, sortKey === opt.key && { color: ORANGE }]}>{opt.label}</Text>
                    {sortKey === opt.key && <Check size={16} color={ORANGE} />}
                  </TouchableOpacity>
                ))}
                {sortKey ? (
                  <TouchableOpacity style={m.clearBtn} onPress={() => { setSortKey(''); setSortModal(false); }}>
                    <Text style={m.clearTxt}>Clear Sort</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  header:       { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title:        { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  searchRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  searchBox:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 30, paddingHorizontal: 14, paddingVertical: 11, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: C.bg },
  searchInput:  { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: C.textPrimary, padding: 0 },
  sortBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortTxt:      { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  filterRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(6,27,74,1)' },
  chipActive:   { borderColor: ORANGE },
  chipTxt:      { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#c3cee2' },
  chipTxtActive:{ color: ORANGE },
  list:         { paddingHorizontal: 16, paddingBottom: 100 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:        { alignItems: 'center', paddingTop: 80 },
  emptyTxt:     { fontSize: 14, fontFamily: 'Poppins_500Medium', color: C.textSecondary },
});

const m = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: 'rgba(1,6,20,1)', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', overflow: 'hidden', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36 },
  title:    { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary, marginBottom: 12 },
  divider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 8 },
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  label:    { fontSize: 14, fontFamily: 'Poppins_400Regular', color: C.textPrimary },
  clearBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 10, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(226,103,27,0.4)' },
  clearTxt: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: ORANGE },
});
