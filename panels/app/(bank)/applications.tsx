import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors } from '@/constants/theme';

const ORANGE = '#e2671b';
const BG     = '#010A1F';

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

function fmt(v: number) {
  if (v >= 10_000_000) return `PKR ${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000)    return `PKR ${(v / 100_000).toFixed(1)}L`;
  return `PKR ${v.toLocaleString()}`;
}

function statusColor(s: string) {
  if (s === 'approved')  return '#22C55E';
  if (s === 'rejected')  return '#f87171';
  if (s === 'reviewing') return '#60a5fa';
  return ORANGE;
}

export default function ApplicationsScreen() {
  const router    = useRouter();
  const { token } = useAuth();
  const [apps,    setApps]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/financing/bank/applications`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setApps(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchApps(); }, []);

  async function updateStatus(id: string, status: 'approved' | 'rejected' | 'reviewing') {
    setUpdating(id);
    try {
      const res = await fetch(`${API_BASE}/financing/bank/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { Alert.alert('Updated', `Application marked as ${status}.`); fetchApps(); }
    } catch {}
    finally { setUpdating(null); }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={AppColors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Loan Applications</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={ORANGE} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={apps}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="document-text-outline" size={48} color={AppColors.textSecondary} />
              <Text style={s.emptyTxt}>No applications yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.card}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/bank-case-detail', params: { id: item.id } } as any)}
            >
              <GlassInset />

              {/* Top */}
              <View style={s.cardHeader}>
                <View>
                  <Text style={s.refNo}>{item.reference_no}</Text>
                  <Text style={s.vehicle}>{item.vehicle}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: statusColor(item.status) + '22' }]}>
                  <Text style={[s.badgeTxt, { color: statusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>

              {/* Info rows */}
              <View style={s.infoGrid}>
                <View style={s.infoItem}>
                  <Text style={s.infoLabel}>Customer</Text>
                  <Text style={s.infoVal}>{item.customer}</Text>
                </View>
                <View style={s.infoItem}>
                  <Text style={s.infoLabel}>City</Text>
                  <Text style={s.infoVal}>{item.city}</Text>
                </View>
                <View style={s.infoItem}>
                  <Text style={s.infoLabel}>Loan Amount</Text>
                  <Text style={[s.infoVal, { color: ORANGE }]}>{fmt(item.loan_amount || 0)}</Text>
                </View>
                <View style={s.infoItem}>
                  <Text style={s.infoLabel}>Monthly</Text>
                  <Text style={[s.infoVal, { color: ORANGE }]}>{fmt(item.monthly_installment || 0)}</Text>
                </View>
                <View style={s.infoItem}>
                  <Text style={s.infoLabel}>Tenure</Text>
                  <Text style={s.infoVal}>{item.tenure_years} yrs</Text>
                </View>
                <View style={s.infoItem}>
                  <Text style={s.infoLabel}>Income</Text>
                  <Text style={s.infoVal}>{fmt(item.monthly_income || 0)}/mo</Text>
                </View>
              </View>

              {/* Actions */}
              {(item.status === 'submitted' || item.status === 'reviewing') && (
                <View style={s.actions}>
                  <TouchableOpacity
                    style={[s.actionBtn, { borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.08)' }]}
                    disabled={updating === item.id}
                    onPress={() => Alert.alert('Approve', 'Approve this application?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Approve', onPress: () => updateStatus(item.id, 'approved') },
                    ])}
                  >
                    <Text style={[s.actionTxt, { color: '#22C55E' }]}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.actionBtn, { borderColor: 'rgba(148,163,184,0.3)', backgroundColor: 'rgba(96,165,250,0.08)' }]}
                    disabled={updating === item.id}
                    onPress={() => updateStatus(item.id, 'reviewing')}
                  >
                    <Text style={[s.actionTxt, { color: '#60a5fa' }]}>Review</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.actionBtn, { borderColor: 'rgba(248,113,113,0.3)', backgroundColor: 'rgba(248,113,113,0.08)' }]}
                    disabled={updating === item.id}
                    onPress={() => Alert.alert('Reject', 'Reject this application?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Reject', style: 'destructive', onPress: () => updateStatus(item.id, 'rejected') },
                    ])}
                  >
                    <Text style={[s.actionTxt, { color: '#f87171' }]}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  title:  { color: AppColors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  list:   { paddingHorizontal: 16, paddingTop: 14 },

  card:       { backgroundColor: BG, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', padding: 14, marginBottom: 14, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  refNo:      { color: AppColors.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  vehicle:    { color: AppColors.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },
  badge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt:   { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'capitalize' },

  infoGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 12 },
  infoItem:  { width: '30%' },
  infoLabel: { color: AppColors.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  infoVal:   { color: AppColors.textPrimary, fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 2 },

  actions:   { flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 12 },
  actionBtn: { flex: 1, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionTxt: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  empty:    { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTxt: { color: AppColors.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular' },
});
