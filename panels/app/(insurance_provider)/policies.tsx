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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Check } from 'lucide-react-native';
import { D, DHeader, FilterPills, GlowCard, SearchBar } from '@/components/dealer/DealerUI';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

const ORANGE = '#e2671b';
const C = AppColors;

const FILTERS = ['All', 'Insurance', 'Insurance + Tracker'] as const;

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

// "4500000" / 4500000 / "4,500,000" → "PKR 4,500,000" (commas without relying on Intl)
function pkr(v: any): string {
  const n = Math.round(parseFloat(String(v ?? 0).replace(/[^0-9.]/g, '')) || 0);
  return n > 0 ? `PKR ${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : '—';
}

function mapApp(app: any, idx: number): any {
  const status = app.status ?? 'submitted';
  const avatar = app.customer_avatar || app.avatar_url || null;
  const premiumVal = app.premium ?? 0;
  const premiumTxt = pkr(premiumVal);
  const estimatedVal = app.estimated_value ?? 0;
  const priceTxt = pkr(estimatedVal);
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
    <GlowCard style={pc.card} radius={22}>

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
          <Text style={pc.name} numberOfLines={1}>{policy.name}</Text>
          <Text style={pc.policyId} numberOfLines={1}>{policy.policy_id}{policy.plan_name && policy.plan_name !== '—' ? ` • ${policy.plan_name}` : ''}</Text>
          {policy.has_tracker ? (
            <View style={{ alignSelf: 'flex-start', marginTop: 4, backgroundColor: 'rgba(232,121,43,0.15)', borderWidth: 1, borderColor: ORANGE, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
              <Text style={{ color: ORANGE, fontSize: 9, fontFamily: 'Poppins_600SemiBold' }}>Insurance + Tracker</Text>
            </View>
          ) : null}
        </TouchableOpacity>
        {/* Figma: approved/active = warm brown pill with orange text, others = navy pill with white text */}
        <View style={[pc.statusBadge, policy.status === 'Approved' || policy.status === 'Active' ? pc.statusWarm : pc.statusNavy]}>
          <View style={[pc.statusDot, (policy.status === 'Approved' || policy.status === 'Active') && { backgroundColor: ORANGE }]} />
          <Text style={[pc.statusTxt, (policy.status === 'Approved' || policy.status === 'Active') && { color: ORANGE }]} numberOfLines={1}>{policy.status}</Text>
        </View>
      </View>

      <View style={pc.midRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={pc.fieldLabel}>VEHICLE</Text>
          <Text style={pc.fieldValue} numberOfLines={1}>{policy.vehicle}</Text>
          {policy.phone ? <Text style={[pc.fieldLabel, { marginTop: 4, color: '#9fb0cc' }]} numberOfLines={1}>{policy.phone}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end', flexShrink: 0, maxWidth: '55%' }}>
          <Text style={pc.fieldLabel}>PREMIUM</Text>
          <Text style={pc.premium} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{policy.premium}</Text>
          <Text style={[pc.fieldLabel, { marginTop: 2, color: '#9fb0cc', fontSize: 10 }]} numberOfLines={1}>Price: {policy.price}</Text>
        </View>
      </View>

      <View style={pc.divider} />

      <View style={pc.footer}>
        <Text style={pc.expires}>Expires: {policy.expires}</Text>
        <TouchableOpacity style={pc.viewBtn} onPress={() => router.push({ pathname: '/insurance-application-detail' as any, params: { id: policy.id } })}>
          <Text style={pc.viewTxt}>View Details</Text>
          <ChevronRight size={16} color={ORANGE} />
        </TouchableOpacity>
      </View>
    </GlowCard>
  );
}

const pc = StyleSheet.create({
  card:        { padding: 18, paddingTop: 20, marginBottom: 16 },
  topRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  avatar:      { width: 70, height: 70, borderRadius: 35, backgroundColor: '#1a2a4a' },
  name:        { fontSize: 20, fontFamily: 'Poppins_500Medium', color: '#FFFFFF', marginTop: 4 },
  policyId:    { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#FFFFFF', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginLeft: 8, flexShrink: 0 },
  statusWarm:  { backgroundColor: '#3A2420' },
  statusNavy:  { backgroundColor: '#0B2A66' },
  statusDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  statusTxt:   { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#fff' },
  midRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  fieldLabel:  { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#C9BDC4', letterSpacing: 0.8, marginBottom: 1 },
  fieldValue:  { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  premium:     { fontSize: 17, fontFamily: 'Poppins_600SemiBold', color: ORANGE },
  divider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginBottom: 12 },
  footer:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expires:     { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  viewBtn:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewTxt:     { fontSize: 13, fontFamily: 'Poppins_400Regular', color: ORANGE },
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
  const [activeFilter, setFilter] = useState<typeof FILTERS[number]>('All');
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
        <DHeader title="Policy Applications" />

        <View style={s.searchRow}>
          <SearchBar placeholder="Search by name, vehicle or ID..." value={search} onChangeText={setSearch} onSort={() => setSortModal(true)} />
        </View>

        {/* One line — scrolls sideways if it doesn't fit */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={s.filterRow}>
          <FilterPills items={FILTERS} value={activeFilter} onChange={setFilter} labels={{ 'Insurance + Tracker': 'Insurance  + Tracker' }} style={{ flexWrap: 'nowrap' }} />
        </ScrollView>
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
  root:         { flex: 1, backgroundColor: D.bg },
  searchRow:    { paddingHorizontal: 16, marginBottom: 18 },
  filterRow:    { paddingHorizontal: 16, marginBottom: 20 },
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
