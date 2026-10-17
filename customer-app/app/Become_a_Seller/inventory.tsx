import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Image, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Search, SlidersHorizontal, Trash2, Plus,
  CheckCircle, XCircle, Car, Bike, Megaphone, ChevronLeft,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { D, GlowCard, PillGlow } from '@/components/dealer/DealerUI';
import { SavedCardEffect, savedCardOuter } from '@/components/shared/FigmaEffects';
import { useTabBarSpace } from '@/components/shared/PillTabBar';

const ORANGE = '#E2671B';
const BLUE   = 'rgba(100,160,255,0.5)';
const C      = AppColors;

const TABS = ['All', 'Car', 'Bike'];

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

function VehicleCard({ vehicle, onEdit, onDelete }: { vehicle: any; onEdit: () => void; onDelete: () => void }) {
  const isSold  = vehicle.status === 'sold' || vehicle.status === 'Sold Out';
  const isBike  = vehicle.category === 'bike' || vehicle.body_type?.toLowerCase() === 'bike';
  const VehicleIcon = isBike ? Bike : Car;
  return (
    <GlowCard style={vc.card}>
      <View style={vc.row}>
        <View style={vc.imgWrap}>
          {vehicle.images?.[0] ? (
            <Image source={{ uri: vehicle.images[0] }} style={vc.img} resizeMode="cover" />
          ) : (
            <View style={[vc.img, vc.imgFallback]}>
              <VehicleIcon size={30} color={D.muted}/>
            </View>
          )}
          {vehicle.is_promoted && (
            <View style={vc.promotedBadge}>
              <Megaphone size={10} color="#fff" />
              <Text style={vc.promotedText}>Promoted</Text>
            </View>
          )}
        </View>
        <View style={vc.info}>
          <Text style={vc.name} numberOfLines={2}>
            {vehicle.title || `${vehicle.make || 'Honda'} ${vehicle.model || 'City'} ${vehicle.variant || ''}`}
            {'\n'}{vehicle.color || 'White'}
          </Text>
          <View style={vc.locationRow}>
            <Text style={vc.locationText} numberOfLines={1}>{vehicle.location || 'My Location'}</Text>
            <CheckCircle size={16} color="#0499ff" fill="#0499ff" style={{ marginLeft: 6 }} />
          </View>
          <View style={vc.actionRow}>
            <TouchableOpacity style={vc.trashBtn} onPress={onDelete}>
              <Trash2 size={20} color={ORANGE} />
            </TouchableOpacity>
            <View style={[vc.statusBadge, isSold ? vc.soldBadge : vc.availBadge]}>
              {isSold ? <XCircle size={11} color="#E0363A" /> : <CheckCircle size={11} color="#2ECC71" />}
              <Text style={[vc.statusText, isSold ? vc.soldText : vc.availText]}>
                {isSold ? 'Sold Out' : 'Available'}
              </Text>
            </View>
            <TouchableOpacity style={[vc.editBtn, isSold && vc.deleteBtn]} onPress={onEdit}>
              <LinearGradient
                colors={['#1D3A7A', '#6E4A52', '#C8622E']} locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={vc.editText}>{isSold ? 'Delete' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </GlowCard>
  );
}

const vc = StyleSheet.create({
  card:          { padding: 14, marginBottom: 14 },
  row:           { flexDirection: 'row' },
  imgWrap:       { width: 118, height: 108, borderRadius: 12, overflow: 'hidden', alignSelf: 'center' },
  imgFallback:   { backgroundColor: '#0B1D4A', alignItems: 'center', justifyContent: 'center' },
  img:           { width: '100%', height: '100%' },
  promotedBadge: { position: 'absolute', top: 6, left: 0, backgroundColor: ORANGE, borderTopRightRadius: 10, borderBottomRightRadius: 10, paddingHorizontal: 8, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 },
  promotedText:  { color: '#fff', fontSize: 11, fontFamily: 'Poppins_500Medium' },
  info:          { flex: 1, marginLeft: 14 },
  name:          { color: D.white, fontSize: 15, lineHeight: 24, fontFamily: 'Poppins_500Medium' },
  locationRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locationText:  { color: D.white, fontSize: 13, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
  actionRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 12, gap: 8 },
  trashBtn:      { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, gap: 4 },
  availBadge:    { backgroundColor: '#0B2A22', borderColor: 'rgba(46,204,113,0.35)' },
  soldBadge:     { backgroundColor: '#3A1520', borderColor: 'rgba(224,54,58,0.3)' },
  statusText:    { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  availText:     { color: '#2ECC71' },
  soldText:      { color: '#E0363A' },
  editBtn:       { height: 28, paddingHorizontal: 16, borderRadius: 14, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  deleteBtn:     {},
  editText:      { color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins_500Medium' },
});

export default function BecomeSellerInventoryScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  // FAB floating tab bar ke thora uper (same as Dealer inventory)
  const fabBottom = useTabBarSpace(100, 16);

  const [vehicles,  setVehicles]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRef]      = useState(false);
  const [search,    setSearch]    = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy,    setSortBy]    = useState('Newest');
  const [showSort,  setShowSort]  = useState(false);

  const SORT_OPTIONS = ['Newest', 'Oldest', 'Price: High to Low', 'Price: Low to High', 'Name: A–Z'];

  useEffect(() => { fetchVehicles(); }, []);

  async function fetchVehicles() {
    if (!token || !user?.id) { setVehicles([]); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/vehicles/my?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        const items = d.items || d || [];
        setVehicles(items);
      } else {
        setVehicles([]);
      }
    } catch { setVehicles([]); }
    finally { setLoading(false); }
  }

  async function onRefresh() { setRef(true); await fetchVehicles(); setRef(false); }

  function applyFilter(list: any[]) {
    let result = [...list];
    if (search) result = result.filter(v => (v.title || v.make || '').toLowerCase().includes(search.toLowerCase()));
    if      (activeTab === 'Car')  result = result.filter(v => v.category !== 'bike' && v.body_type?.toLowerCase() !== 'bike');
    else if (activeTab === 'Bike') result = result.filter(v => v.category === 'bike' || v.body_type?.toLowerCase() === 'bike');
    switch (sortBy) {
      case 'Newest':             result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case 'Oldest':             result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case 'Price: High to Low': result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'Price: Low to High': result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'Name: A–Z':          result.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
    }
    return result;
  }

  const filtered = applyFilter(vehicles);

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={26} color={D.muted} strokeWidth={2}/>
          </TouchableOpacity>
          <Text style={s.title}>My Inventory</Text>
          <View style={s.backBtn}/>
        </View>

        <View style={s.searchRow}>
          <View style={[savedCardOuter, s.searchBox]}>
            <SavedCardEffect band={10} />
            <Search size={22} color="#C9C6D0" strokeWidth={1.5} />
            <TextInput
              style={s.searchInput}
              placeholder="Search vehicles..."
              placeholderTextColor="#9C96A2"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <View style={{ zIndex: 100 }}>
            <TouchableOpacity style={s.sortBtn} onPress={() => setShowSort(v => !v)}>
              <SlidersHorizontal size={24} color={ORANGE}/>
              <Text style={s.sortText}>Sort</Text>
            </TouchableOpacity>
            {showSort && (
              <View style={s.sortDropdown}>
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

        <View style={s.tabsRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              {activeTab === tab && <PillGlow />}
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
                Alert.alert('Delete Vehicle', 'Are you sure you want to delete this listing?', [
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
                ]);
              }}
            />
          )}
          ListEmptyComponent={() => (
            <View style={s.empty}>
              <Car size={48} color={C.textSecondary} />
              <Text style={s.emptyTxt}>No vehicles found</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/dealer-panel/add-vehicle' as any)}>
                <Text style={s.emptyBtnTxt}>Add Your First Vehicle</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={[s.fab, { bottom: fabBottom }]} onPress={() => router.push('/dealer-panel/add-vehicle' as any)}>
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: D.bg },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  title:  { fontSize: 20, fontFamily: 'Poppins_500Medium', color: D.white, flex: 1 },
  backBtn:{ width: 30, height: 40, justifyContent: 'center' },

  searchRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, marginBottom: 14, zIndex: 100 },
  searchBox:        { flex: 1, height: 46, borderRadius: 23, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, gap: 4 },
  searchInput:      { flex: 1, height: '100%', paddingHorizontal: 12, fontSize: 14, fontFamily: 'Poppins_400Regular', color: D.white, paddingVertical: 0 },
  sortBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortText:         { color: D.white, fontSize: 18, fontFamily: 'Poppins_400Regular' },
  sortDropdown:     { position: 'absolute', top: 40, right: 0, width: 190, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(130,165,213,0.5)', overflow: 'hidden', zIndex: 99, backgroundColor: '#061234' },
  sortItem:         { paddingHorizontal: 16, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortItemActive:   { backgroundColor: 'rgba(226,103,27,0.1)' },
  sortItemTxt:      { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  sortItemTxtActive:{ color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  sortDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE },

  tabsRow:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  tab:          { height: 48, minWidth: 64, paddingHorizontal: 22, borderRadius: 16, borderWidth: 1, backgroundColor: D.navy, borderColor: D.navy, justifyContent: 'center', alignItems: 'center' },
  tabActive:    { backgroundColor: '#05122A', borderColor: '#7F98C4', overflow: 'hidden' },
  tabText:      { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  tabTextActive:{ color: ORANGE, fontFamily: 'Poppins_600SemiBold' },

  carsLabel: { color: D.muted, fontSize: 16, fontFamily: 'Poppins_400Regular', paddingHorizontal: 16, marginBottom: 12 },
  list:      { paddingHorizontal: 16, paddingBottom: 120 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:     { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyTxt:  { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  emptyBtn:  { backgroundColor: ORANGE, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 },
  emptyBtnTxt:{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  fab:       { position: 'absolute', bottom: 100, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', shadowColor: ORANGE, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
});
