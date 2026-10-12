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
import { ChevronRight, Check } from 'lucide-react-native';
import { D, DHeader, FilterPills, GlowCard, SearchBar, StatusPill as DStatusPill } from '@/components/dealer/DealerUI';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useTabBarSpace } from '@/components/shared/PillTabBar';

const SERVER = API_BASE.replace('/api/v1', '');
function resolveUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}

const ORANGE = '#e2671b';
const C = AppColors;

const FILTERS = ['All', 'New', 'Under Review', 'Survey Assigned', 'Approved', 'Reject'] as const;

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
  // Figma tones: Under Review = warm brown/orange, Approved = green, Reject = red
  const tone = status === 'Approved' ? 'green' : status === 'Reject' ? 'red' : status === 'New' ? 'blue' : 'orange';
  return <DStatusPill label={status} tone={tone as any} style={{ paddingHorizontal: 9, paddingVertical: 2, borderRadius: 11 }} textStyle={{ fontSize: 10 }} />;
}

function ClaimCard({ item, onView }: { item: any; onView: () => void }) {
  const allPhotos: string[] = item.photos || (item.image ? [item.image] : []);
  return (
    <GlowCard style={cc.card} radius={22}>

      <View style={cc.topRow}>
        {item.image
          ? <Image source={{ uri: item.image }} style={cc.carImg} resizeMode="cover" />
          : <View style={[cc.carImg, { backgroundColor: '#061B4A', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#4B5A7A', fontSize: 22 }}>🚗</Text>
            </View>
        }
        <View style={{ flex: 1, marginLeft: 6 }}>
          <View style={cc.nameRow}>
            <Text style={cc.name} numberOfLines={1}>{item.customer}</Text>
            <StatusPill status={item.status} />
          </View>
          <Text style={cc.vehicleTxt}>{item.vehicle} • {item.reason}</Text>
          <Text style={cc.amount} numberOfLines={1}>{item.amount}</Text>
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
        <Text style={cc.dateTxt} numberOfLines={1}>Claim date: {item.date}</Text>
        <TouchableOpacity style={cc.viewBtn} onPress={onView}>
          <Text style={cc.viewTxt}>View Details</Text>
          <ChevronRight size={15} color={ORANGE} />
        </TouchableOpacity>
      </View>
    </GlowCard>
  );
}

const cc = StyleSheet.create({
  card:       { padding: 6, paddingBottom: 14, marginBottom: 16 },
  topRow:     { flexDirection: 'row', marginBottom: 2 },
  carImg:     { width: 96, height: 90, borderRadius: 12, backgroundColor: '#1a2a4a', margin: 8 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 8, marginBottom: 4, paddingRight: 6 },
  name:       { fontSize: 15, fontFamily: 'Poppins_400Regular', color: '#FFFFFF', flexShrink: 1 },
  vehicleTxt: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#FFFFFF', lineHeight: 20, marginBottom: 4 },
  amount:     { fontSize: 13, fontFamily: 'Poppins_400Regular', color: ORANGE, alignSelf: 'flex-end', paddingRight: 6 },
  divider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginHorizontal: 8, marginBottom: 12 },
  bottomRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  dateTxt:    { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#FFFFFF', flexShrink: 1, marginRight: 8 },
  viewBtn:    { flexDirection: 'row', alignItems: 'center' },
  viewTxt:    { fontSize: 12, fontFamily: 'Poppins_500Medium', color: ORANGE, marginRight: 2 },
});

export default function InsuranceClaimsScreen() {
  const tabSpace = useTabBarSpace(100);
  const router = useRouter();
  const { token } = useAuth();
  const [claims,       setClaims]     = useState<any[]>([]);
  const [loading,      setLoading]    = useState(true);
  const [refreshing,   setRefreshing] = useState(false);
  const [activeFilter, setFilter]     = useState<typeof FILTERS[number]>('All');
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
        <DHeader title="Claims" />

        <View style={s.searchRow}>
          <SearchBar placeholder="Search by Claim ID, Customer, Vehicle..." value={search} onChangeText={setSearch} onSort={() => setSortModal(true)} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow} style={{ marginBottom: 8, flexGrow: 0 }}>
          <FilterPills items={FILTERS} value={activeFilter} onChange={setFilter} style={{ flexWrap: 'nowrap', gap: 10 }} />
        </ScrollView>

        <Text style={s.itemCount}>Showing {filtered.length} items</Text>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={ORANGE} size="large" style={{ marginTop: 60 }} />
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[s.list, { paddingBottom: tabSpace }]}
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
  root:         { flex: 1, backgroundColor: D.bg },
  searchRow:    { paddingHorizontal: 16, marginBottom: 16 },
  filterRow:    { paddingHorizontal: 16, paddingRight: 16 },
  itemCount:    { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#FFFFFF', paddingHorizontal: 16, marginTop: 8, marginBottom: 10 },
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
