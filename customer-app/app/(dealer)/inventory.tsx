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
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { D, DHeader, FilterPills, MiniGradBtn, SearchBar, StatusPill, VehicleRowCard } from '@/components/dealer/DealerUI';
import { useTabBarSpace } from '@/components/shared/PillTabBar';

const ORANGE = '#E2671B';
const C      = AppColors;

const TABS = ['All', 'Latest', 'Boosted ads'] as const;

function VehicleCard({
  vehicle,
  dealer,
  onEdit,
  onDelete,
}: {
  vehicle: any;
  dealer?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isSold = vehicle.status === 'sold' || vehicle.status === 'Sold Out';
  return (
    <VehicleRowCard
      v={vehicle}
      dealer={dealer}
      promoted={!!(vehicle.is_promoted || vehicle.is_boosted)}
      style={{ marginBottom: 14 }}
      footer={
        <>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={20} color={ORANGE} />
          </TouchableOpacity>
          <StatusPill label={isSold ? 'Sold Out' : 'Available'} tone={isSold ? 'red' : 'green'} style={{ paddingHorizontal: 12, paddingVertical: 4 }} />
          {/* Sold listings: the button deletes (same as before) */}
          <MiniGradBtn title={isSold ? 'Delete' : 'Edit'} onPress={isSold ? onDelete : onEdit} />
        </>
      }
    />
  );
}

export default function InventoryScreen() {
  const tabSpace = useTabBarSpace(120);
  const fabBottom = useTabBarSpace(100, 16);
  const { user, token } = useAuth();
  const router = useRouter();

  const [vehicles, setVehicles]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRef]      = useState(false);
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
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
        <DHeader title="My Inventory" />

        {/* SEARCH + SORT */}
        <View style={s.searchRow}>
          <SearchBar placeholder="Search" value={search} onChangeText={setSearch} onSort={() => setShowSort(v => !v)} />
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

        {/* TABS */}
        <FilterPills items={TABS} value={activeTab} onChange={setActiveTab} style={s.tabsRow} />

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
          contentContainerStyle={[s.list, { paddingBottom: tabSpace }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              dealer={user?.full_name}
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
              <Ionicons name="car-outline" size={48} color={C.textSecondary} />
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
        style={[s.fab, { bottom: fabBottom }]}
        onPress={() => router.push('/dealer-panel/add-vehicle' as any)}
      >
        <View style={s.fabIcon}><Ionicons name="add" size={22} color="#fff" /></View>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: D.bg },

  /* SEARCH */
  searchRow:    { paddingHorizontal: 16, marginBottom: 14, zIndex: 100 },
  sortDropdown:    { position: 'absolute', top: 52, right: 16, width: 190, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(130,165,213,0.5)', overflow: 'hidden', zIndex: 99, backgroundColor: '#061234' },
  sortItem:        { paddingHorizontal: 16, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortItemActive:  { backgroundColor: 'rgba(226,103,27,0.1)' },
  sortItemTxt:     { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  sortItemTxtActive:{ color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  sortDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE },

  /* TABS */
  tabsRow:      { paddingHorizontal: 16, marginBottom: 16 },

  carsLabel:    { color: D.muted, fontSize: 16, fontFamily: 'Poppins_400Regular', paddingHorizontal: 16, marginBottom: 12 },

  /* LIST */
  list:         { paddingHorizontal: 16, paddingBottom: 120 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyTxt:     { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: C.textPrimary },
  emptyBtn:     { backgroundColor: ORANGE, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 },
  emptyBtnTxt:  { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  /* FAB */
  fab:          { position: 'absolute', bottom: 100, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', shadowColor: ORANGE, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
  fabIcon:      { width: 26, height: 26, borderRadius: 5, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
