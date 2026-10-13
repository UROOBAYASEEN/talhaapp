import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAppColors } from '@/constants/theme';

const ORANGE = '#e2671b';

const FILTERS = ['All', 'Dealer', 'Non-Dealership', 'Tracker', 'Bank', 'Insurance'];

function typeLabel(t: string) {
  return t === 'Seller' ? 'Non-Dealership' : t;
}

function CardShades() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

function LimitEditor({
  label, used, value, custom, onChange, onSave, saving,
}: {
  label: string; used: number; value: number; custom: boolean;
  onChange: (v: number) => void; onSave: () => void; saving: boolean;
}) {
  const aC = useAppColors();
  const unlimited = value === -1;
  return (
    <View style={[s.limitBox, { borderColor: aC.isDark ? 'rgba(100,160,255,0.25)' : 'rgba(3,42,105,0.12)', backgroundColor: aC.isDark ? 'rgba(3,12,40,0.5)' : '#f6f8ff' }]}>
      <View style={s.limitTop}>
        <Text style={[s.limitLabel, { color: aC.textSecondary }]}>{label}</Text>
        <Text style={[s.limitUsed, { color: aC.textPrimary }]}>
          {used} / {unlimited ? '∞' : value}
          {!custom && <Text style={[s.limitDef, { color: ORANGE }]}> (default 5)</Text>}
        </Text>
      </View>
      <View style={s.limitRow}>
        <TouchableOpacity
          style={[s.stepBtn, { borderColor: aC.isDark ? '#83a8db' : 'rgba(3,42,105,0.2)' }, unlimited && s.stepDisabled]}
          disabled={unlimited}
          onPress={() => onChange(Math.max(0, (unlimited ? 5 : value) - 1))}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={16} color={aC.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.limitVal, { color: aC.textPrimary }]}>{unlimited ? '∞' : value}</Text>
        <TouchableOpacity
          style={[s.stepBtn, { borderColor: aC.isDark ? '#83a8db' : 'rgba(3,42,105,0.2)' }, unlimited && s.stepDisabled]}
          disabled={unlimited}
          onPress={() => onChange((unlimited ? 5 : value) + 1)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={16} color={aC.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.unlimBtn, unlimited && s.unlimOn]}
          onPress={() => onChange(unlimited ? 5 : -1)}
          activeOpacity={0.7}
        >
          <Text style={[s.unlimTxt, unlimited && { color: '#fff' }]}>∞</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.saveBtn} onPress={onSave} disabled={saving} activeOpacity={0.8}>
          <LinearGradient colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveGrad}>
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.saveTxt}>Save</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function InventoryPermissionScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [drafts, setDrafts] = useState<Record<string, { inv: number; trk: number }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const res = await fetch(`${API_BASE}/admin/inventory-limits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
        const d: Record<string, { inv: number; trk: number }> = {};
        data.forEach((p: any) => { d[p.id] = { inv: p.inventory_limit, trk: p.tracker_limit }; });
        setDrafts(d);
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(id: string, field: 'inv' | 'trk') {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id + field);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const body = field === 'inv' ? { inventory_limit: draft.inv } : { tracker_limit: draft.trk };
      const res = await fetch(`${API_BASE}/admin/inventory-limits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || 'Failed to save');
      }
      setPartners(prev => prev.map(p => p.id === id ? {
        ...p,
        ...(field === 'inv'
          ? { inventory_limit: draft.inv, inventory_custom: true }
          : { tracker_limit: draft.trk, tracker_custom: true }),
      } : p));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSavingId(null);
    }
  }

  const visible = partners.filter(p => {
    if (filter === 'All') return true;
    if (filter === 'Non-Dealership') return p.type === 'Seller';
    return p.type === filter;
  });

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={aC.isDark ? '#A9ADBD' : '#475569'} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: aC.textPrimary }]}>Inventory Permission</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filters}
        style={{ flexGrow: 0 }}
      >
        {FILTERS.map(f => {
          const on = filter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
              style={[s.chip, on ? s.chipOn : { borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', backgroundColor: aC.isDark ? '#061b4a' : '#ffffff' }]}
            >
              <Text style={[s.chipTxt, { color: on ? ORANGE : aC.textSecondary }, on && s.chipTxtOn]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={ORANGE} />}
      >
        {loading ? (
          <ActivityIndicator color={ORANGE} style={{ marginTop: 40 }} size="large" />
        ) : visible.length === 0 ? (
          <Text style={[s.empty, { color: aC.textSecondary }]}>No profiles found</Text>
        ) : visible.map(p => (
          <View
            key={p.id}
            style={[s.card, { backgroundColor: 'rgba(1,6,20,1)', borderColor: 'rgba(100,160,255,0.5)' }]}
          >
            <CardShades />
            <View style={s.topRow}>
              <View style={[s.avatar, { backgroundColor: '#12306A' }]}>
                <Text style={s.avatarTxt}>{(p.name || 'U').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.name, { color: aC.textPrimary }]} numberOfLines={1}>{p.name}</Text>
                <View style={s.badgeRow}>
                  <View style={[s.badge, { backgroundColor: 'rgba(226,103,27,0.15)' }]}>
                    <Text style={s.badgeTxt}>{typeLabel(p.type)}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: 'rgba(100,160,255,0.12)' }]}>
                    <Text style={[s.badgeTxt, { color: '#8FAEE3' }]}>{p.plan}</Text>
                  </View>
                </View>
              </View>
            </View>

            {(p.role === 'dealership_owner' || p.role === 'individual_seller') && (
              <LimitEditor
                label="Free Inventory (vehicles)"
                used={p.inventory_used}
                value={drafts[p.id]?.inv ?? p.inventory_limit}
                custom={p.inventory_custom}
                onChange={v => setDrafts(d => ({ ...d, [p.id]: { inv: v, trk: d[p.id]?.trk ?? p.tracker_limit } }))}
                onSave={() => save(p.id, 'inv')}
                saving={savingId === p.id + 'inv'}
              />
            )}
            {p.role === 'tracker_provider' && (
              <LimitEditor
                label="Trackers Allowed"
                used={p.trackers_used}
                value={drafts[p.id]?.trk ?? p.tracker_limit}
                custom={p.tracker_custom}
                onChange={v => setDrafts(d => ({ ...d, [p.id]: { inv: d[p.id]?.inv ?? p.inventory_limit, trk: v } }))}
                onSave={() => save(p.id, 'trk')}
                saving={savingId === p.id + 'trk'}
              />
            )}
            {(p.role !== 'dealership_owner' && p.role !== 'individual_seller' && p.role !== 'tracker_provider') && (
              <Text style={[s.note, { color: aC.textSecondary }]}>No listing limits apply to this profile.</Text>
            )}
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  filters: { gap: 10, paddingHorizontal: 20, paddingVertical: 8 },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  chipOn: { borderWidth: 1, borderColor: '#7298cf', backgroundColor: '#0b2048', overflow: 'hidden' },
  chipTxt: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  chipTxtOn: { color: ORANGE, fontFamily: 'Poppins_700Bold' },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 14 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 14, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#F2F1F5', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  name: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeTxt: { color: ORANGE, fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  limitBox: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 10 },
  limitTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  limitLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  limitUsed: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  limitDef: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepDisabled: { opacity: 0.35 },
  limitVal: { minWidth: 36, textAlign: 'center', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  unlimBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  unlimOn: { backgroundColor: ORANGE, borderColor: ORANGE },
  unlimTxt: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#8FAEE3' },
  saveBtn: { flex: 1, borderRadius: 20, overflow: 'hidden', marginLeft: 4 },
  saveGrad: { height: 36, alignItems: 'center', justifyContent: 'center' },
  saveTxt: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  note: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
});
