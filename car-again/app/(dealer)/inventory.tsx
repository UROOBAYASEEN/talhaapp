import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Search,
  SlidersHorizontal,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Car,
  Megaphone,
  ChevronLeft,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#ff6900';
const BLUE   = 'rgba(100,160,255,0.5)';
const C      = AppColors;

const TABS = ['All', 'Latest', 'Boosted ads'];

function GlassInset() {
  // AGENTS.md — Card 4-Side Border Shade (0.35) + bg #010A1F
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

function VehicleCard({
  vehicle,
  onEdit,
  onDelete,
}: {
  vehicle: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isSold = vehicle.status === 'sold' || vehicle.status === 'Sold Out';

  return (
    <View style={vc.card}>
      <GlassInset />

      <View style={vc.row}>
        {/* IMAGE */}
        <View style={vc.imgWrap}>
          {vehicle.images?.[0] ? (
            <Image source={{ uri: vehicle.images[0] }} style={vc.img} resizeMode="cover" />
          ) : (
            <View style={[vc.img, vc.imgFallback]}>
              <Car size={28} color="rgba(255,255,255,0.25)"/>
            </View>
          )}
          {vehicle.is_promoted && (
            <View style={vc.promotedBadge}>
              <Megaphone size={8} color="#fff" />
              <Text style={vc.promotedText}>Promoted</Text>
            </View>
          )}
        </View>

        {/* INFO */}
        <View style={vc.info}>
          <Text style={vc.name} numberOfLines={2}>
            {vehicle.title || `${vehicle.make || 'Honda'} ${vehicle.model || 'City'} ${vehicle.variant || ''}`}
            {'\n'}{vehicle.color || 'White'}
          </Text>

          <View style={vc.locationRow}>
            <Text style={vc.locationText} numberOfLines={1}>
              {vehicle.location || 'Honda Gateway Karachi'}
            </Text>
            <CheckCircle size={13} color="#0499ff" fill="#0499ff" style={{ marginLeft: 4 }} />
          </View>

          {/* ACTION ROW */}
          <View style={vc.actionRow}>
            <TouchableOpacity style={vc.trashBtn} onPress={onDelete}>
              <Trash2 size={15} color={ORANGE} />
            </TouchableOpacity>

            <View style={[vc.statusBadge, isSold ? vc.soldBadge : vc.availBadge]}>
              {isSold
                ? <XCircle size={11} color="#ff4050" />
                : <CheckCircle size={11} color="#00d084" />}
              <Text style={[vc.statusText, isSold ? vc.soldText : vc.availText]}>
                {isSold ? 'Sold Out' : 'Available'}
              </Text>
            </View>

            <TouchableOpacity
              style={[vc.editBtn, isSold && vc.deleteBtn]}
              onPress={onEdit}
            >
              <LinearGradient
                colors={isSold ? ['#7b1a1a', '#c0392b'] : [AppColors.gradientStart, AppColors.gradientEnd]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={vc.editText}>{isSold ? 'Delete' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const vc = StyleSheet.create({
  card:          { borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(1,6,20,1)', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', padding: 11, marginBottom: 12 },
  row:           { flexDirection: 'row' },
  imgWrap:       { width: 125, height: 100, borderRadius: 12, overflow: 'hidden' },
  imgFallback:   { backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  img:           { width: '100%', height: '100%' },
  promotedBadge: { position: 'absolute', top: 5, left: 4, backgroundColor: ORANGE, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 3, shadowColor: ORANGE, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 6 },
  promotedText:  { color: '#fff', fontSize: 8, fontFamily: 'Poppins_600SemiBold' },
  info:          { flex: 1, marginLeft: 11, paddingTop: 2 },
  name:          { color: C.textPrimary, fontSize: 13, lineHeight: 21, fontFamily: 'Poppins_600SemiBold' },
  locationRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locationText:  { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', flex: 1 },
  actionRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 7 },
  trashBtn:      { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 4, gap: 3 },
  availBadge:    { backgroundColor: 'rgba(0,208,132,0.12)', borderWidth: 1, borderColor: 'rgba(0,208,132,0.3)' },
  soldBadge:     { backgroundColor: 'rgba(255,64,80,0.12)', borderWidth: 1, borderColor: 'rgba(255,64,80,0.3)' },
  statusText:    { fontSize: 9, fontFamily: 'Poppins_500Medium' },
  availText:     { color: '#00d084' },
  soldText:      { color: '#ff4050' },
  editBtn:       { height: 26, paddingHorizontal: 14, borderRadius: 13, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginLeft: 'auto' },
  deleteBtn:     {},
  editText:      { color: '#fff', fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
});

export default function InventoryScreen() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [vehicles, setVehicles]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRef]      = useState(false);
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy]       = useState('Newest');
  const [showSort, setShowSort]   = useState(false);

  const SORT_OPTIONS = ['Newest', 'Oldest', 'Price: High to Low', 'Price: Low to High', 'Name: A–Z'];

  useEffect(() => { fetchVehicles(); }, []);

  async function fetchVehicles() {
    if (!token || !user?.id) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/vehicles/my?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setVehicles(d.items || d || []);
      }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }

  async function onRefresh() { setRef(true); await fetchVehicles(); setRef(false); }

  function applyFilter(list: any[]) {
    let result = [...list];
    if (search) result = result.filter(v => (v.title || v.make || '').toLowerCase().includes(search.toLowerCase()));
    if (activeTab === 'Boosted ads') result = result.filter(v => v.is_boosted || v.is_promoted);

    switch (sortBy) {
      case 'Newest':           result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case 'Oldest':           result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case 'Price: High to Low': result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'Price: Low to High': result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'Name: A–Z':        result.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
    }
    return result;
  }

  const filtered = applyFilter(vehicles);

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={24} color={ORANGE} strokeWidth={2}/>
          </TouchableOpacity>
          <Text style={s.title}>My Inventory</Text>
          <View style={s.backBtn}/>
        </View>

        {/* SEARCH + SORT */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <GlassInset />
            <Search size={18} color={C.textSecondary} strokeWidth={1.5} />
            <TextInput
              style={s.searchInput}
              placeholder="Search vehicles..."
              placeholderTextColor={C.textPlaceholder}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <View style={{ zIndex: 100 }}>
            <TouchableOpacity style={s.sortBtn} onPress={() => setShowSort(v => !v)}>
              <SlidersHorizontal size={15} color={ORANGE}/>
              <Text style={s.sortText}>Sort</Text>
            </TouchableOpacity>
            {showSort && (
              <View style={s.sortDropdown}>
                <LinearGradient colors={['rgba(22,64,136,0.3)', 'rgba(3,12,40,0.98)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject}/>
                {SORT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[s.sortItem, sortBy === opt && s.sortItemActive]}
                    onPress={() => { setSortBy(opt); setShowSort(false); }}
                  >
                    <Text style={[s.sortItemTxt, sortBy === opt && s.sortItemTxtActive]}>{opt}</Text>
                    {sortBy === opt && <View style={s.sortDot}/>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* TABS */}
        <View style={s.tabsRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.carsLabel}>Cars</Text>
      </SafeAreaView>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={ORANGE} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id || Math.random())}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              onEdit={() => router.push({ pathname: '/dealer-panel/edit-vehicle', params: { id: item.id } } as any)}
              onDelete={() => {
                Alert.alert(
                  'Delete Vehicle',
                  'Are you sure you want to delete this listing?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete', style: 'destructive',
                      onPress: async () => {
                        try {
                          const res = await fetch(`${API_BASE}/vehicles/${item.id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (res.ok) setVehicles(prev => prev.filter(v => v.id !== item.id));
                          else Alert.alert('Error', 'Could not delete vehicle.');
                        } catch { Alert.alert('Error', 'Network error.'); }
                      },
                    },
                  ]
                );
              }}
            />
          )}
          ListEmptyComponent={() => (
            <View style={s.empty}>
              <Car size={48} color={C.textSecondary} />
              <Text style={s.emptyTxt}>No vehicles found</Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => router.push('/dealer-panel/add-vehicle' as any)}
              >
                <Text style={s.emptyBtnTxt}>Add Your First Vehicle</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* FLOATING ADD */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => router.push('/dealer-panel/add-vehicle' as any)}
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },

  /* HEADER */
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  title:        { fontSize: 20, fontFamily: 'Poppins_700Bold', color: C.textPrimary, flex: 1, textAlign: 'center' },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  addBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: ORANGE, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addTxt:       { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  /* SEARCH */
  searchRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, marginBottom: 14, zIndex: 100 },
  searchBox:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.glassBg, borderWidth: 1, borderColor: BLUE, borderRadius: 30, paddingHorizontal: 16, paddingVertical: 11, overflow: 'hidden' },
  searchInput:  { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: C.textPrimary, paddingVertical: 0 },
  sortBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,105,0,0.4)', backgroundColor: 'rgba(255,105,0,0.08)' },
  sortText:        { color: ORANGE, fontSize: 10, fontFamily: 'Poppins_500Medium' },
  sortDropdown:    { position: 'absolute', top: 40, right: 0, width: 180, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', overflow: 'hidden', zIndex: 99, backgroundColor: 'rgba(0,5,18,1)' },
  sortItem:        { paddingHorizontal: 16, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortItemActive:  { backgroundColor: 'rgba(255,105,0,0.1)' },
  sortItemTxt:     { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  sortItemTxtActive:{ color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  sortDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE },

  /* TABS */
  tabsRow:      { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 14 },
  tab:          { height: 36, paddingHorizontal: 18, borderRadius: 18, backgroundColor: C.glassBg, borderWidth: 1, borderColor: C.glassBorder, justifyContent: 'center', alignItems: 'center' },
  tabActive:    { borderColor: ORANGE, backgroundColor: 'rgba(255,105,0,0.12)' },
  tabText:      { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  tabTextActive:{ color: ORANGE, fontFamily: 'Poppins_600SemiBold' },

  carsLabel:    { color: C.textSecondary, fontSize: 14, fontFamily: 'Poppins_500Medium', paddingHorizontal: 16, marginBottom: 10 },

  /* LIST */
  list:         { paddingHorizontal: 16, paddingBottom: 120 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyTxt:     { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  emptyBtn:     { backgroundColor: ORANGE, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 },
  emptyBtnTxt:  { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  /* FAB */
  fab:          { position: 'absolute', bottom: 90, right: 20, width: 58, height: 58, borderRadius: 29, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', shadowColor: ORANGE, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
});
