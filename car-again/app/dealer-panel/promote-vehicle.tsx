import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Lightbulb, CheckCircle } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;

type TabType = 'All' | 'Active' | 'Expired';

interface Promo {
  id: string;
  vehicle_id: string;
  promotion_type: string;
  amount: number;
  status: string;
  duration_days: number;
  promoted_at: string;
  expires_at: string;
}

interface VehicleMap { [id: string]: any }

function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

function isActive(promo: Promo): boolean {
  return promo.status === 'success' && new Date(promo.expires_at) > new Date();
}

export default function PromoteVehicleScreen() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [promos,    setPromos]    = useState<Promo[]>([]);
  const [vehicles,  setVehicles]  = useState<VehicleMap>({});
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefresh]   = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('All');

  async function load() {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/ads/promotions/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setLoading(false); return; }
      const data: Promo[] = await res.json();
      setPromos(data);

      // load vehicle details for each unique vehicle
      const uniqueIds = [...new Set(data.map(p => p.vehicle_id))];
      const map: VehicleMap = {};
      await Promise.all(uniqueIds.map(async (vid) => {
        try {
          const vRes = await fetch(`${API_BASE}/vehicles/${vid}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (vRes.ok) map[vid] = await vRes.json();
        } catch {}
      }));
      setVehicles(map);
    } catch {}
    finally { setLoading(false); setRefresh(false); }
  }

  useEffect(() => { load(); }, []);

  function filtered() {
    if (activeTab === 'Active')  return promos.filter(p => isActive(p));
    if (activeTab === 'Expired') return promos.filter(p => !isActive(p));
    return promos;
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={27} color={C.textSecondary} strokeWidth={2}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Vehicle Promotion Analytics</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor={ORANGE}/>}
        >
          {/* INFO BANNER — AGENTS.md 4-side shade + bg #010A1F */}
          <View style={[s.infoCard, { backgroundColor: 'rgba(1,6,20,1)', borderColor: 'rgba(100,160,255,0.5)' }]}>
            <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <View style={s.lightIconWrap}>
              <Lightbulb size={28} color="#FFD400" fill="#FFD400" strokeWidth={1.5}/>
            </View>
            <Text style={s.infoText}>
              Promote Vehicle is ideal for getting your listing in front of more buyers for Increased visibility & faster buyer discovery.
            </Text>
          </View>

          {/* PROMOTE NEW LISTING BUTTON */}
          <TouchableOpacity
            style={s.promoteNewBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/dealer-panel/promote-new' as any)}
          >
            <LinearGradient
              colors={[NAVY, ORANGE]}
              start={{x:0,y:0}} end={{x:1,y:0}}
              style={StyleSheet.absoluteFillObject}
            />
            <Plus size={22} color="#fff" strokeWidth={2.5}/>
            <Text style={s.promoteNewText}>Promote New Listing</Text>
          </TouchableOpacity>

          {/* TABS */}
          <View style={s.tabsRow}>
            {(['All','Active','Expired'] as TabType[]).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[s.tab, activeTab === tab && s.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CONTENT */}
          {loading ? (
            <ActivityIndicator color={ORANGE} size="large" style={{ marginTop: 40 }}/>
          ) : filtered().length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyText}>No promotions found</Text>
              <Text style={s.emptySubText}>Tap "Promote New Listing" to get started</Text>
            </View>
          ) : (
            filtered().map(promo => (
              <PromoCard
                key={promo.id}
                promo={promo}
                vehicle={vehicles[promo.vehicle_id]}
                onViewAd={() => router.push({ pathname: '/vehicle/[id]', params: { id: promo.vehicle_id } } as any)}
              />
            ))
          )}

          <View style={{ height: 40 }}/>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ─── PROMO CARD ─── */

function PromoCard({ promo, vehicle, onViewAd }: { promo: Promo; vehicle: any; onViewAd: () => void }) {
  const active  = isActive(promo);
  const left    = daysLeft(promo.expires_at);
  const title   = vehicle?.title || `${vehicle?.make || 'Vehicle'} ${vehicle?.model || ''}`.trim();
  const color   = vehicle?.color || '';
  const imgUri  = vehicle?.images?.[0];
  const price   = promo.amount;
  const dealer  = vehicle?.location || 'Honda Gateway Karachi';

  // static analytics placeholders (backend has no impression tracking yet)
  const analytics = [
    { label: 'Impression', value: vehicle?.view_count    ?? '8,420' },
    { label: 'Clicks',     value: vehicle?.click_count   ?? '642'   },
    { label: 'Calls',      value: vehicle?.call_count    ?? '38'    },
    { label: 'Favorited',  value: vehicle?.save_count    ?? '124'   },
    { label: 'Enquiry',    value: vehicle?.enquiry_count ?? '26'    },
    { label: 'Shares',     value: vehicle?.share_count   ?? '18'    },
  ];

  return (
    <View style={[pc.card, { backgroundColor: 'rgba(1,6,20,1)', borderColor: 'rgba(100,160,255,0.5)' }]}>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      {/* TOP */}
      <View style={pc.top}>
        {/* Image */}
        <View style={pc.imgWrap}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={pc.img} resizeMode="cover"/>
          ) : (
            <View style={[pc.img, pc.imgFb]}/>
          )}
          <View style={pc.promotedBadge}>
            <Text style={pc.promotedText}>Promoted</Text>
          </View>
        </View>

        {/* Details */}
        <View style={pc.details}>
          <View style={pc.titleRow}>
            <Text style={pc.vehicleTitle} numberOfLines={2}>{title}</Text>
            <View style={[pc.statusBadge, active ? pc.activeBadge : pc.expiredBadge]}>
              <Text style={[pc.statusText, active ? pc.activeText : pc.expiredText]}>
                {active ? 'Active' : 'Expired'}
              </Text>
            </View>
          </View>

          {!!color && <Text style={pc.colorText}>{color}</Text>}

          <View style={pc.dealerRow}>
            <Text style={pc.dealerName} numberOfLines={1}>{dealer}</Text>
            <CheckCircle size={14} color="#008EFF" fill="#008EFF" style={{ marginLeft: 4 }}/>
          </View>
        </View>
      </View>

      {/* ANALYTICS GRID */}
      <View style={pc.analyticsWrap}>
        <View style={pc.analyticsRow}>
          {analytics.slice(0, 3).map(a => <StatBox key={a.label} label={a.label} value={String(a.value)}/>)}
        </View>
        <View style={pc.analyticsRow}>
          {analytics.slice(3, 6).map(a => <StatBox key={a.label} label={a.label} value={String(a.value)}/>)}
        </View>
      </View>

      {/* BOTTOM */}
      <View style={pc.bottom}>
        <View>
          <Text style={pc.price}>PKR {Number(price).toLocaleString()}</Text>
          <Text style={pc.daysLeft}>{active ? `${left} day${left !== 1 ? 's' : ''} left` : 'Expired'}</Text>
        </View>
        <TouchableOpacity onPress={onViewAd} activeOpacity={0.7}>
          <Text style={pc.viewAd}>VIEW AD</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={pc.statBox}>
      <Text style={pc.statLabel}>{label}</Text>
      <Text style={pc.statValue}>{value}</Text>
    </View>
  );
}

/* ─── STYLES ─── */

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    height: 60, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn:     { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },

  scrollContent: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 40 },

  /* INFO CARD */
  infoCard: {
    minHeight: 72, borderRadius: 16,
    borderWidth: 1, borderColor: ORANGE,
    backgroundColor: C.glassBg,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 13, paddingVertical: 10,
    overflow: 'hidden', marginBottom: 16,
  },
  lightIconWrap: { width: 42, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  infoText:      { flex: 1, color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_500Medium', lineHeight: 17 },

  /* PROMOTE BUTTON */
  promoteNewBtn: {
    height: 50, borderRadius: 28, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, marginBottom: 22,
  },
  promoteNewText: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },

  /* TABS */
  tabsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: {
    height: 44, minWidth: 76, paddingHorizontal: 18,
    borderRadius: 14, backgroundColor: NAVY,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  tabActive:     { borderColor: 'rgba(99,148,214,0.7)', backgroundColor: 'rgba(3,42,105,0.8)' },
  tabText:       { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  tabTextActive: { color: ORANGE, fontFamily: 'Poppins_700Bold' },

  /* EMPTY */
  empty:       { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText:   { color: C.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  emptySubText:{ color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
});

const pc = StyleSheet.create({
  card: {
    borderRadius: 18, borderWidth: 1,
    borderColor: 'rgba(99,148,214,0.5)',
    backgroundColor: C.bg,
    overflow: 'hidden', marginBottom: 16,
  },

  /* TOP */
  top:     { flexDirection: 'row', padding: 14, paddingBottom: 10 },
  imgWrap: { width: 130, height: 105, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  img:     { width: '100%', height: '100%' },
  imgFb:   { backgroundColor: 'rgba(3,12,40,0.8)' },
  promotedBadge: { position: 'absolute', left: 4, top: 5, backgroundColor: ORANGE, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  promotedText:  { color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold' },

  details:   { flex: 1, marginLeft: 12, paddingTop: 4 },
  titleRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  vehicleTitle: { flex: 1, color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', lineHeight: 20 },

  statusBadge:  { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  activeBadge:  { backgroundColor: 'rgba(0,208,132,0.15)', borderWidth: 1, borderColor: 'rgba(0,208,132,0.4)' },
  expiredBadge: { backgroundColor: 'rgba(255,64,80,0.12)', borderWidth: 1, borderColor: 'rgba(255,64,80,0.3)' },
  statusText:   { fontSize: 9, fontFamily: 'Poppins_600SemiBold' },
  activeText:   { color: '#00d084' },
  expiredText:  { color: '#ff4050' },

  colorText:  { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 3 },
  dealerRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  dealerName: { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', flex: 1 },

  /* ANALYTICS */
  analyticsWrap: { paddingHorizontal: 14, paddingBottom: 6 },
  analyticsRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  statBox:   { flex: 1, alignItems: 'center' },
  statLabel: { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', marginBottom: 5 },
  statValue: { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_700Bold' },

  /* BOTTOM */
  bottom: {
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
    minHeight: 68, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  price:    { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  daysLeft: { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  viewAd:   { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_700Bold' },
});
