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
import { ChevronLeft, Search, Eye, CheckCircle, Shield, Check, Car, Crosshair } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlowCard, PillGlow } from '@/components/dealer/DealerUI';
import { SearchInputEffect } from '@/components/shared/FigmaEffects';
import InnerGlow from '@/components/shared/InnerGlow';
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
  'Pending':     { bg: '#3A2420', text: ORANGE,    border: 'rgba(226,103,27,0.45)' },
  'In progress': { bg: '#0E2A55', text: '#7FB0FF', border: 'rgba(127,176,255,0.35)' },
  'Approved':    { bg: '#0B2A22', text: '#2ECC71', border: 'rgba(46,204,113,0.4)' },
  'Rejected':    { bg: '#3A1520', text: '#E0363A', border: 'rgba(224,54,58,0.4)' },
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
    <GlowCard style={s.card} radius={20}>
      {/* Customer + Status */}
      <View style={s.cardTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.customerName}>{item.name}</Text>
          <View style={s.vehicleRow}>
            <Car size={13} color="#E6E1E8" />
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
          <Shield size={20} color={ORANGE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.infoLabel}>Selected Insurance</Text>
          <Text style={s.infoValue}>{item.insurance}</Text>
          <Text style={s.infoRate}>{item.insuranceRate}</Text>
        </View>
      </View>

      {/* Tracker info */}
      <View style={s.infoBox}>
        <View style={s.infoIconWrap}>
          <Crosshair size={20} color={ORANGE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.infoLabel}>Tracker Package</Text>
          <Text style={s.infoValue}>{item.tracker}</Text>
          <Text style={s.infoRate}>{item.trackerModel}</Text>
        </View>
      </View>

      <View style={s.divider} />

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
          <InnerGlow radius={20} fill="#131F38" glowColor="#2C55A0" blur={12} borderColors={['#6F8CC0', '#5873A6']} borderWidth={1} />
          <Eye size={16} color="#C9C6D0" />
          <Text style={s.detailsTxt}>DETAILS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.approveBtn} activeOpacity={0.85}>
          <LinearGradient colors={['#082C66', '#DF6728']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} />
          <CheckCircle size={16} color="#fff" />
          <Text style={s.approveTxt}>APPROVE</Text>
        </TouchableOpacity>
      </View>
    </GlowCard>
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
            <ChevronLeft size={28} color="#BAACB6" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Tracker Requests</Text>
        </View>

        {/* Search + Sort */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <SearchInputEffect radius={32} />
            <Search size={20} color="#C9C6D0" />
            <TextInput style={s.searchInput} placeholder="Search by Claim ID, Customer, Vehicle..." placeholderTextColor="#9C96A2" value={search} onChangeText={setSearch} />
          </View>
          <TouchableOpacity style={s.sortBtn} onPress={() => setSortModal(true)}>
            <MaterialIcons name="sort" size={26} color={ORANGE} />
            <Text style={[s.sortTxt, { color: sortKey ? ORANGE : '#FFFFFF' }]}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow} style={{ marginBottom: 14, flexGrow: 0 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.chip, activeFilter === f && s.chipActive]} onPress={() => setFilter(f)}>
              {activeFilter === f && <PillGlow />}
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
  root:        { flex: 1, backgroundColor: '#010A1F' },
  header:      { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  backBtn:     { width: 30, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_500Medium', color: '#F2F1F5' },

  searchRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16, gap: 12 },
  searchBox:   { flex: 1, height: 48, flexDirection: 'row', alignItems: 'center', borderRadius: 32, paddingHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#829fd0', backgroundColor: '#061124' },
  searchInput: { flex: 1, height: '100%', fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#F2F1F5', padding: 0, marginLeft: 10 },
  sortBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortTxt:     { fontSize: 18, fontFamily: 'Poppins_400Regular' },

  filterRow:   { paddingHorizontal: 16, paddingRight: 8, gap: 12 },
  chip:        { height: 48, minWidth: 64, paddingHorizontal: 22, borderRadius: 16, borderWidth: 1, borderColor: '#0B2358', backgroundColor: '#0B2358', alignItems: 'center', justifyContent: 'center' },
  chipActive:  { backgroundColor: '#05122A', borderColor: '#7F98C4', overflow: 'hidden' },
  chipTxt:     { fontSize: 15, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  chipTxtActive:{ color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  itemCount:   { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#E6E1E8', paddingHorizontal: 16, marginBottom: 12 },

  list:        { paddingHorizontal: 16, paddingBottom: 100, gap: 16 },

  card:        { padding: 22 },
  cardTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  customerName:{ fontSize: 16, fontFamily: 'Poppins_500Medium', color: '#FFFFFF', marginBottom: 2 },
  vehicleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vehicleTxt:  { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#E6E1E8' },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 14, borderWidth: 1 },
  statusTxt:   { fontSize: 11, fontFamily: 'Poppins_500Medium', letterSpacing: 1 },

  infoBox:     { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(230,225,232,0.22)' },
  infoIconWrap:{ width: 24, alignItems: 'center', justifyContent: 'center' },
  infoLabel:   { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#FFFFFF', marginBottom: 2 },
  infoValue:   { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  infoRate:    { fontSize: 11, fontFamily: 'Poppins_400Regular', color: ORANGE, marginTop: 1 },

  divider:     { height: 1, backgroundColor: 'rgba(230,225,232,0.2)', marginBottom: 18 },
  feeRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 },
  feeLabel:    { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#FFFFFF', marginBottom: 3 },
  feeValue:    { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#FFFFFF' },
  dateValue:   { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#FFFFFF' },

  btnRow:      { flexDirection: 'row', gap: 12 },
  detailsBtn:  { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 20, overflow: 'hidden' },
  detailsTxt:  { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#E3E5EF', letterSpacing: 1.5 },
  approveBtn:  { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 20, overflow: 'hidden' },
  approveTxt:  { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#fff', letterSpacing: 1.5 },

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
