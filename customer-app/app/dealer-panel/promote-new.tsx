import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Image, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Car } from 'lucide-react-native';
import { D, DHeader, MiniGradBtn, Radio, SearchBar, StatusPill, VehicleRowCard } from '@/components/dealer/DealerUI';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = AppColors.gradientEnd;
const C      = AppColors;

export default function SelectVehicleToPromote() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [vehicles,  setVehicles]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (!token || !user?.id) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE}/vehicles/my?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const d = await res.json();
          const list = d.items || d || [];
          setVehicles(list);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return vehicles;
    return vehicles.filter(v =>
      (v.title || `${v.make} ${v.model}`).toLowerCase().includes(search.toLowerCase())
    );
  }, [search, vehicles]);

  function toggleSelect(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  }

  function handlePromote() {
    if (selected.length === 0) { Alert.alert('Select at least one vehicle'); return; }
    router.push({ pathname: '/dealer-panel/promote-package', params: { vehicle_ids: selected.join(',') } } as any);
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.mainContainer}>

        {/* HEADER */}
        <View style={{ marginHorizontal: -14 }}><DHeader title="Select Vehicle to Promote" /></View>

        {/* SEARCH + SORT */}
        <View style={s.searchSortRow}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search" returnKeyType="search" onSort={() => {}} />
        </View>

        {/* LIST */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={ORANGE} size="large"/>
          </View>
        ) : (
          <ScrollView
            style={s.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
          >
            {filtered.length === 0 ? (
              <View style={s.emptyWrap}>
                <Car size={40} color={C.textSecondary}/>
                <Text style={s.emptyText}>No vehicles found</Text>
              </View>
            ) : (
              filtered.map(vehicle => {
                const isSelected = selected.includes(vehicle.id);
                const title      = vehicle.title || `${vehicle.make || ''} ${vehicle.model || ''}`.trim();
                const isSold     = vehicle.status === 'sold';

                return (
                  <View key={vehicle.id} style={s.cardRow}>

                    {/* Radio — OUTSIDE card */}
                    <TouchableOpacity
                      style={s.radioBtn}
                      onPress={() => toggleSelect(vehicle.id)}
                      activeOpacity={0.8}
                    >
                      <Radio on={isSelected} />
                    </TouchableOpacity>

                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.9} onPress={() => toggleSelect(vehicle.id)}>
                      <VehicleRowCard
                        v={{ ...vehicle, title }}
                        dealer={vehicle.location || user?.full_name || 'Dealership'}
                        style={{ paddingRight: 10 }}
                        footer={
                          <>
                            <StatusPill label={isSold ? 'Sold Out' : 'Available'} tone={isSold ? 'red' : 'green'} style={{ paddingHorizontal: 12 }} />
                            <MiniGradBtn title="Edit" onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: vehicle.id } } as any)} />
                          </>
                        }
                      />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
            <View style={{ height: 20 }}/>
          </ScrollView>
        )}

        {/* BOTTOM BUTTON */}
        <View style={s.bottomContainer}>
          <TouchableOpacity style={s.promoteBtn} onPress={handlePromote} activeOpacity={0.85}>
            <LinearGradient
              colors={['#0B3585', '#7E4F5C', '#E8702A']}
              locations={[0, 0.5, 1]}
              start={{x:0,y:0}} end={{x:1,y:0}}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={s.promoteText}>
              Promote {selected.length > 0 ? `${selected.length} ` : ''}Selected Listing{selected.length > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: C.bg },
  mainContainer: { flex: 1, backgroundColor: D.bg, paddingHorizontal: 14 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* SEARCH */
  searchSortRow: { marginTop: 4, marginBottom: 16 },

  /* LIST */
  list:        { flex: 1 },
  listContent: { paddingTop: 4, paddingBottom: 10 },
  emptyWrap:   { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText:   { color: C.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular' },

  /* VEHICLE CARD ROW WRAPPER */
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },

  radioBtn:    { width: 26, alignItems: 'center', justifyContent: 'center', marginRight: 6 },

  /* BOTTOM */
  bottomContainer: { paddingTop: 12, paddingBottom: 16, alignItems: 'center' },
  promoteBtn:  { height: 54, width: '86%', borderRadius: 27, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  promoteText: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
});
