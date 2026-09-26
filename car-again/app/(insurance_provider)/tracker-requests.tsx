import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
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
import { ChevronLeft, Search, ArrowDownUp, Eye, CheckCircle, Shield, MapPin, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#e2671b';
const C = AppColors;

const FILTERS = ['All', 'Pending', 'In progress', 'Approved', 'Rejected'];

const SORT_OPTIONS = [
  { key: 'name_asc',  label: 'Name (A → Z)' },
  { key: 'name_desc', label: 'Name (Z → A)' },
  { key: 'fee_high',  label: 'Fee (High → Low)' },
  { key: 'fee_low',   label: 'Fee (Low → High)' },
  { key: 'date_new',  label: 'Date (Newest first)' },
  { key: 'date_old',  label: 'Date (Oldest first)' },
];

const STATUS_STYLES: any = {
  'Pending':     { bg: 'rgba(226,103,27,0.15)', text: ORANGE, border: ORANGE },
  'In progress': { bg: 'rgba(59,111,214,0.15)', text: '#6ab0ff', border: '#6ab0ff' },
  'Approved':    { bg: 'rgba(10,60,35,0.4)',    text: '#22c55e', border: '#22c55e' },
  'Rejected':    { bg: 'rgba(90,15,25,0.4)',    text: '#F45B69', border: '#F45B69' },
};

const STATUS_LABEL_MAP: Record<string, string> = {
  submitted: 'Pending',
  reviewing: 'In progress',
  approved:  'Approved',
  rejected:  'Rejected',
  draft:     'Pending',
};

function applySortKey(list: any[], key: string) {
  const s = [...list];
  switch (key) {
    case 'name_asc':  return s.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc': return s.sort((a, b) => b.name.localeCompare(a.name));
    case 'fee_high':  return s.sort((a, b) => b.feeVal - a.feeVal);
    case 'fee_low':   return s.sort((a, b) => a.feeVal - b.feeVal);
    case 'date_new':  return s.sort((a, b) => b.dateTs - a.dateTs);
    case 'date_old':  return s.sort((a, b) => a.dateTs - b.dateTs);
    default:          return s;
  }
}

function RequestCard({ item, onDetails }: { item: any; onDetails: () => void }) {
  const st = STATUS_STYLES[item.status] || STATUS_STYLES['Pending'];
  return (
    <View style={s.card}>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      {/* Customer + Status */}
      <View style={s.cardTopRow}>
        <View>
          <Text style={s.customerName}>{item.name}</Text>
          <View style={s.vehicleRow}>
            <MapPin size={11} color="#8f9cb5" />
            <Text style={s.vehicleTxt}>{item.vehicle}</Text>
          </View>
        </View>
        <View style={[s.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
          <Text style={[s.statusTxt, { color: st.text }]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Insurance info */}
      <View style={s.infoBox}>
        <View style={s.infoIconWrap}>
          <Shield size={16} color={ORANGE} />
        </View>
        <View>
          <Text style={s.infoLabel}>Selected Insurance</Text>
          <Text style={s.infoValue}>{item.insurance}</Text>
          <Text style={s.infoRate}>{item.insuranceRate}</Text>
        </View>
      </View>

      {/* Tracker info */}
      <View style={s.infoBox}>
        <View style={s.infoIconWrap}>
          <MapPin size={16} color={ORANGE} />
        </View>
        <View>
          <Text style={s.infoLabel}>Tracker Package</Text>
          <Text style={s.infoValue}>{item.tracker}</Text>
          <Text style={s.infoRate}>{item.trackerModel}</Text>
        </View>
      </View>

      {/* Fee + Date */}
      <View style={s.feeRow}>
        <View>
          <Text style={s.feeLabel}>Est. Total Fee</Text>
          <Text style={s.feeValue}>{item.fee}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.feeLabel}>Requested</Text>
          <Text style={s.dateValue}>{item.date}</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={s.btnRow}>
        <TouchableOpacity style={s.detailsBtn} activeOpacity={0.8} onPress={onDetails}>
          <Eye size={14} color={C.textPrimary} />
          <Text style={s.detailsTxt}>DETAILS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.approveBtn} activeOpacity={0.85}>
          <LinearGradient colors={['#032a69', ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          <CheckCircle size={14} color="#fff" />
          <Text style={s.approveTxt}>APPROVE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TrackerRequestsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [activeFilter, setFilter] = useState('All');
  const [search,       setSearch] = useState('');
  const [sortKey,      setSortKey]    = useState('');
  const [sortModal,    setSortModal]  = useState(false);
  const [requests,     setRequests]   = useState<any[]>([]);
  const [loading,      setLoading]    = useState(true);
  const [refreshing,   setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!token || !user?.id) return;
    try {
      const params = new URLSearchParams();
      if (activeFilter !== 'All') params.append('status', activeFilter);
      if (search.trim())          params.append('search', search.trim());
      const res = await fetch(`${API_BASE}/insurance/${user.id}/requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Only Insurance+Tracker requests should appear here — filter has_tracker
        const filtered = (data || []).filter((r: any) => r.has_tracker);
        const list = filtered.length ? filtered : data; // fallback to all if none yet
        setRequests(list.map((r: any) => ({
          ...r,
          status:  STATUS_LABEL_MAP[r.status] || r.status,
          fee:     r.premium ? `PKR ${Number(r.premium).toLocaleString()}` : '—',
          feeVal:  r.premium || 0,
          dateTs:  new Date(r.created_at).getTime(),
          insurance: r.plan_name || '—',
          insuranceRate: r.premium ? `${r.premium} @ ${(r as any).rate || '—'}` : '—',
          tracker:   r.has_tracker ? (r.selected_addons?.join(', ') || 'Tracker Included') : '—',
          trackerModel: r.has_tracker ? 'Tracker Device' : '—',
        })));
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token, user?.id, activeFilter, search]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  let filtered = requests;
  if (sortKey) filtered = applySortKey(filtered, sortKey);

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Tracker Requests</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search + Sort */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <LinearGradient colors={['rgba(22,64,136,0.5)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.5)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.5)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <Search size={16} color="#8f9cb5" />
            <TextInput style={s.searchInput} placeholder="Search by Claim ID, Customer, Vehicle..." placeholderTextColor={C.textPlaceholder} value={search} onChangeText={setSearch} />
          </View>
          <TouchableOpacity style={s.sortBtn} onPress={() => setSortModal(true)}>
            <ArrowDownUp size={15} color={sortKey ? ORANGE : '#8f9cb5'} />
            <Text style={[s.sortTxt, { color: sortKey ? ORANGE : '#8f9cb5' }]}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
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
        <ActivityIndicator color={ORANGE} size="large" style={{ marginTop: 40 }} />
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRequests(); }} tintColor={ORANGE} />}
        renderItem={({ item }) => (
              <RequestCard
                item={item}
                onDetails={() => router.push({ pathname: '/insurance-application-detail' as any, params: { id: item.id } })}
              />
            )}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyTxt}>No requests found</Text></View>}
      />
      )}

      {/* Sort Modal */}
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
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },

  searchRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  searchBox:   { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 30, paddingHorizontal: 14, paddingVertical: 11, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: C.bg, marginRight: 12 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: C.textPrimary, padding: 0, marginLeft: 8 },
  sortBtn:     { flexDirection: 'row', alignItems: 'center' },
  sortTxt:     { fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginLeft: 4 },

  filterRow:   { paddingHorizontal: 16, paddingRight: 8 },
  chip:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(6,27,74,1)', marginRight: 8 },
  chipActive:  { borderColor: ORANGE },
  chipTxt:     { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#c3cee2' },
  chipTxtActive:{ color: ORANGE },
  itemCount:   { fontSize: 12, fontFamily: 'Poppins_400Regular', color: C.textSecondary, paddingHorizontal: 16, marginTop: 6, marginBottom: 10 },

  list:        { paddingHorizontal: 16, paddingBottom: 100, gap: 14 },

  card:        { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(1,6,20,1)', padding: 10 },
  cardTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  customerName:{ fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary, marginBottom: 4 },
  vehicleRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vehicleTxt:  { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#8f9cb5' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusTxt:   { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },

  infoBox:     { padding: 8, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  infoIconWrap:{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(226,103,27,0.12)', alignItems: 'center', justifyContent: 'center' },
  infoLabel:   { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', marginBottom: 2 },
  infoValue:   { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  infoRate:    { fontSize: 11, fontFamily: 'Poppins_400Regular', color: ORANGE, marginTop: 1 },

  feeRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8, marginBottom: 10 },
  feeLabel:    { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#8f9cb5', marginBottom: 3 },
  feeValue:    { fontSize: 16, fontFamily: 'Poppins_700Bold', color: C.textPrimary },
  dateValue:   { fontSize: 13, fontFamily: 'Poppins_500Medium', color: C.textPrimary },

  btnRow:      { flexDirection: 'row', gap: 10 },
  detailsBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)' },
  detailsTxt:  { fontSize: 12, fontFamily: 'Poppins_700Bold', color: C.textPrimary, letterSpacing: 0.5 },
  approveBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 30, overflow: 'hidden' },
  approveTxt:  { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: 0.5 },

  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyTxt:    { fontSize: 14, fontFamily: 'Poppins_500Medium', color: C.textSecondary },
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
