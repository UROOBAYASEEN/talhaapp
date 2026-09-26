import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, ArrowDownUp, ChevronRight, Check } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

const SERVER = API_BASE.replace('/api/v1', '');
function resolveUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}

const ORANGE = '#e2671b';
const C = AppColors;

const FILTERS = ['All', 'New', 'Under Review', 'Survey Assigned', 'Approved', 'Reject'];

const SORT_OPTIONS = [
  { key: 'name_asc',    label: 'Customer (A → Z)' },
  { key: 'name_desc',   label: 'Customer (Z → A)' },
  { key: 'amount_high', label: 'Amount (High → Low)' },
  { key: 'amount_low',  label: 'Amount (Low → High)' },
  { key: 'date_new',    label: 'Date (Newest first)' },
  { key: 'date_old',    label: 'Date (Oldest first)' },
  { key: 'status',      label: 'Status (Approved first)' },
];

const STATUS_COLORS: any = {
  'New':             { bg: 'rgba(30,60,120,0.6)',  text: '#6ab0ff' },
  'Under Review':    { bg: 'rgba(100,70,10,0.6)',  text: '#F5A623' },
  'Survey Assigned': { bg: 'rgba(40,30,90,0.6)',   text: '#a78bfa' },
  'Approved':        { bg: 'rgba(10,60,35,0.6)',   text: '#3DDC84' },
  'Reject':          { bg: 'rgba(90,15,25,0.6)',   text: '#F45B69' },
};

const STATUS_LABEL_MAP: Record<string, string> = {
  submitted: 'New',
  reviewing: 'Under Review',
  approved:  'Approved',
  rejected:  'Reject',
  draft:     'New',
};

function mapClaim(app: any): any {
  const rawStatus = app.status ?? 'submitted';
  const status    = STATUS_LABEL_MAP[rawStatus] || rawStatus;
  const photos = (app.photos || []).map((u:string)=> resolveUrl(u)).filter(Boolean) as string[] ;
  return {
    id:        app.id,
    customer:  app.customer || app.full_name || '—',
    avatar:    resolveUrl(app.customer_avatar),
    phone:     app.phone || '',
    email:     app.email || '',
    status,
    vehicle:   app.vehicle || '—',
    reason:    'Insurance Application',
    amount:    (() => {
                 const v = parseFloat(String(app.estimated_value ?? 0).replace(/[^0-9.]/g, ''));
                 return v > 0 ? `PKR ${v.toLocaleString('en-PK')}` : '—';
               })(),
    amountVal: parseFloat(String(app.estimated_value ?? 0).replace(/[^0-9.]/g, '')) || 0,
    date:      app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    dateTs:    app.created_at ? new Date(app.created_at).getTime() : 0,
    image:     photos[0] || null,
    photos,
  };
}

function applySortKey(list: any[], key: string) {
  const s = [...list];
  switch (key) {
    case 'name_asc':    return s.sort((a, b) => a.customer.localeCompare(b.customer));
    case 'name_desc':   return s.sort((a, b) => b.customer.localeCompare(a.customer));
    case 'amount_high': return s.sort((a, b) => b.amountVal - a.amountVal);
    case 'amount_low':  return s.sort((a, b) => a.amountVal - b.amountVal);
    case 'date_new':    return s.sort((a, b) => b.dateTs - a.dateTs);
    case 'date_old':    return s.sort((a, b) => a.dateTs - b.dateTs);
    case 'status':      return s.sort((a, b) => (a.status === 'Approved' ? -1 : 1) - (b.status === 'Approved' ? -1 : 1));
    default:            return s;
  }
}

function StatusPill({ status }: { status: string }) {
  const sc = STATUS_COLORS[status] || STATUS_COLORS['Under Review'];
  return (
    <View style={[cc.pill, { backgroundColor: sc.bg }]}>
      <Text style={[cc.pillTxt, { color: sc.text }]}>{status}</Text>
    </View>
  );
}

function ClaimCard({ item, onView }: { item: any; onView: () => void }) {
  const allPhotos: string[] = item.photos || (item.image ? [item.image] : []);
  return (
    <View style={cc.card}>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      <View style={cc.topRow}>
        {item.image
          ? <Image source={{ uri: item.image }} style={cc.carImg} resizeMode="cover" />
          : <View style={[cc.carImg, { backgroundColor: '#061B4A', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#4B5A7A', fontSize: 22 }}>🚗</Text>
            </View>
        }
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={cc.nameRow}>
            <Text style={cc.name}>{item.customer}</Text>
            <StatusPill status={item.status} />
          </View>
          <Text style={cc.vehicleTxt}>{item.vehicle} • {item.reason}</Text>
          <Text style={cc.amount}>{item.amount}</Text>
        </View>
      </View>
      {allPhotos.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 8, marginBottom: 12 }}>
          {allPhotos.slice(0,5).map((uri:string,i:number)=>(
            <Image key={i} source={{ uri }} style={{ width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)' }} resizeMode="cover" />
          ))}
        </ScrollView>
      )}

      <View style={cc.divider} />

      <View style={cc.bottomRow}>
        <Text style={cc.dateTxt}>Claim date: {item.date}</Text>
        <TouchableOpacity style={cc.viewBtn} onPress={onView}>
          <Text style={cc.viewTxt}>View Details</Text>
          <ChevronRight size={14} color={ORANGE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cc = StyleSheet.create({
  card:       { borderRadius: 16, overflow: 'hidden', padding: 4, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)' },
  topRow:     { flexDirection: 'row', marginBottom: 12 },
  carImg:     { width: 100, height: 100, borderRadius: 10, backgroundColor: '#1a2a4a', margin: 8 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name:       { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  vehicleTxt: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', lineHeight: 16, marginBottom: 6 },
  amount:     { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: ORANGE },
  pill:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  pillTxt:    { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  divider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 12 },
  bottomRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateTxt:    { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#9fb0cc' },
  viewBtn:    { flexDirection: 'row', alignItems: 'center' },
  viewTxt:    { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: ORANGE, marginRight: 2 },
});

export default function InsuranceClaimsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [claims,       setClaims]     = useState<any[]>([]);
  const [loading,      setLoading]    = useState(true);
  const [refreshing,   setRefreshing] = useState(false);
  const [activeFilter, setFilter]     = useState('All');
  const [search,       setSearch]     = useState('');
  const [sortKey,      setSortKey]    = useState('');
  const [sortModal,    setSortModal]  = useState(false);

  const fetchClaims = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/insurance/provider/claims`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const raw = await res.json();
        setClaims((raw || []).map(mapClaim));
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  let filtered = claims.filter(p => {
    const matchFilter = activeFilter === 'All' || p.status === activeFilter;
    const matchSearch = !search ||
      p.customer.toLowerCase().includes(search.toLowerCase()) ||
      p.vehicle.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });
  if (sortKey) filtered = applySortKey(filtered, sortKey);

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <Text style={s.title}>Claims</Text>
        </View>

        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <LinearGradient colors={['rgba(22,64,136,0.5)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.5)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.5)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <Search size={16} color="#8f9cb5" />
            <TextInput style={s.searchInput} placeholder="Search by customer or vehicle..." placeholderTextColor={C.textPlaceholder} value={search} onChangeText={setSearch} />
          </View>
          <TouchableOpacity style={s.sortBtn} onPress={() => setSortModal(true)}>
            <ArrowDownUp size={15} color={ORANGE} />
            <Text style={[s.sortTxt, { color: sortKey ? ORANGE : '#8f9cb5' }]}>Sort</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow} style={{ marginBottom: 8 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.chip, activeFilter === f && s.chipActive]} onPress={() => setFilter(f)}>
              <Text style={[s.chipTxt, activeFilter === f && s.chipTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.itemCount}>Showing {filtered.length} items</Text>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={ORANGE} size="large" style={{ marginTop: 60 }} />
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchClaims(); }} tintColor={ORANGE} />}
        renderItem={({ item }) => <ClaimCard item={item} onView={() => router.push({ pathname: '/(insurance_provider)/approve-policy' as any, params: { appId: item.id, name: item.customer, avatar: item.avatar || '', phone: item.phone || '', email: item.email || '', vehicle: item.vehicle, premium: String(item.amountVal), status: item.status, date: item.dateTs ? new Date(item.dateTs).toISOString() : '', policyId: item.id } })} />}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyTxt}>No claims found</Text></View>}
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
  searchRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  searchBox:    { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 30, paddingHorizontal: 14, paddingVertical: 11, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: C.bg, marginRight: 12 },
  searchInput:  { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: C.textPrimary, padding: 0, marginLeft: 8 },
  sortBtn:      { flexDirection: 'row', alignItems: 'center' },
  sortTxt:      { fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginLeft: 4 },
  filterRow:    { paddingHorizontal: 16, paddingRight: 8 },
  chip:         { paddingHorizontal: 22, paddingVertical: 8, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(6,27,74,1)', marginRight: 8 },
  chipActive:   { borderColor: ORANGE },
  chipTxt:      { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#c3cee2' },
  chipTxtActive:{ color: ORANGE },
  itemCount:    { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary, paddingHorizontal: 16, marginTop: 8, marginBottom: 10 },
  list:         { paddingHorizontal: 16, paddingBottom: 100 },
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
