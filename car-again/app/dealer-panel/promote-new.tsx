import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, Image, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, SlidersHorizontal, Check, Car } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
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
    <SafeAreaView style={s.safeArea}>
      <View style={s.mainContainer}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={29} color={C.textSecondary} strokeWidth={2}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Select Vehicle to Promote</Text>
        </View>

        {/* SEARCH + SORT */}
        <View style={s.searchSortRow}>
          <View style={s.searchBox}>
            <LinearGradient colors={['rgba(22,64,136,0.2)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            <Search size={18} color={C.textSecondary} strokeWidth={1.5}/>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search"
              placeholderTextColor={C.textPlaceholder}
              style={s.searchInput}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={s.sortBtn} activeOpacity={0.7}>
            <SlidersHorizontal size={19} color={ORANGE} strokeWidth={2.2}/>
            <Text style={s.sortText}>Sort</Text>
          </TouchableOpacity>
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
                const imgUri     = vehicle.images?.[0];
                const isSold     = vehicle.status === 'sold';

                return (
                  <View key={vehicle.id} style={s.cardRow}>

                    {/* Checkbox — OUTSIDE card */}
                    <TouchableOpacity
                      style={s.radioBtn}
                      onPress={() => toggleSelect(vehicle.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[s.radioOuter, isSelected && s.radioOuterSelected]}>
                        {isSelected && <View style={s.radioInner}/>}
                      </View>
                    </TouchableOpacity>

                  <View style={[s.vehicleCard, isSelected && s.selectedCard]}>
                    <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

                    {/* Image */}
                    {imgUri ? (
                      <Image source={{ uri: imgUri }} style={s.vehicleImg} resizeMode="cover"/>
                    ) : (
                      <View style={[s.vehicleImg, s.vehicleImgFb]}>
                        <Car size={22} color={C.textSecondary}/>
                      </View>
                    )}

                    {/* Details */}
                    <View style={s.details}>
                      <Text style={s.vehicleTitle} numberOfLines={1}>{title}</Text>
                      {!!vehicle.color && <Text style={s.vehicleColor}>{vehicle.color}</Text>}

                      <View style={s.dealerRow}>
                        <Text style={s.dealerName} numberOfLines={1}>
                          {vehicle.location || user?.full_name || 'Dealership'}
                        </Text>
                        <View style={s.verifiedBadge}>
                          <Check size={9} color="#fff" strokeWidth={3}/>
                        </View>
                      </View>

                      <View style={s.cardActions}>
                        <View style={[s.statusBadge, isSold ? s.soldBadge : s.availBadge]}>
                          <Text style={[s.statusText, isSold ? s.soldText : s.availText]}>
                            {isSold ? 'Sold Out' : 'Available'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={s.editBtn}
                          onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: vehicle.id } } as any)}
                          activeOpacity={0.7}
                        >
                          <Text style={s.editText}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
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
              colors={[NAVY, ORANGE]}
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
  mainContainer: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* HEADER */
  header:      { height: 80, flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 10 },
  backBtn:     { width: 37, height: 45, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold', marginLeft: 2 },

  /* SEARCH */
  searchSortRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 14, gap: 10 },
  searchBox: {
    flex: 1, height: 42, borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(99,148,214,0.6)',
    backgroundColor: C.glassBg,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, overflow: 'hidden',
  },
  searchInput: { flex: 1, color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_400Regular', marginLeft: 8, paddingVertical: 0 },
  sortBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sortText:    { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_500Medium' },

  /* LIST */
  list:        { flex: 1 },
  listContent: { paddingTop: 4, paddingBottom: 10 },
  emptyWrap:   { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText:   { color: C.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular' },

  /* VEHICLE CARD ROW WRAPPER */
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },

  /* VEHICLE CARD — AGENTS.md shade + bg #010A1F */
  vehicleCard: {
    flex: 1, height: 140,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    backgroundColor: 'rgba(1,6,20,1)',
    flexDirection: 'row', padding: 10,
    overflow: 'hidden', position: 'relative',
  },
  selectedCard: { borderColor: 'rgba(255,255,255,0.15)' },

  /* CHECKBOX */
  radioBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(99,148,214,0.6)', backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: ORANGE, backgroundColor: 'rgba(226,103,27,0.2)' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },

  /* IMAGE */
  vehicleImg:   { width: 126, height: 104, borderRadius: 11 },
  vehicleImgFb: { backgroundColor: 'rgba(3,12,40,0.8)', alignItems: 'center', justifyContent: 'center' },

  /* DETAILS */
  details:      { flex: 1, marginLeft: 9, paddingTop: 2 },
  vehicleTitle: { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 19 },
  vehicleColor: { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  dealerRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dealerName:   { color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  verifiedBadge:{ width: 15, height: 15, borderRadius: 8, backgroundColor: '#008EFF', alignItems: 'center', justifyContent: 'center', marginLeft: 5 },

  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 14, gap: 8 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  availBadge:  { backgroundColor: 'rgba(0,208,132,0.12)', borderWidth: 1, borderColor: 'rgba(0,208,132,0.3)' },
  soldBadge:   { backgroundColor: 'rgba(255,64,80,0.12)', borderWidth: 1, borderColor: 'rgba(255,64,80,0.3)' },
  statusText:  { fontSize: 10, fontFamily: 'Poppins_500Medium' },
  availText:   { color: '#00d084' },
  soldText:    { color: '#ff4050' },
  editBtn:     { minWidth: 52, height: 26, borderRadius: 13, backgroundColor: 'rgba(226,103,27,0.25)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(226,103,27,0.4)' },
  editText:    { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_500Medium' },

  /* BOTTOM */
  bottomContainer: { paddingTop: 10, paddingBottom: 24, alignItems: 'center' },
  promoteBtn:  { height: 50, width: '92%', borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  promoteText: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
});
