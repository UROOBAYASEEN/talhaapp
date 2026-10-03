import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft, Trash2, Eye, MousePointer, Phone,
  Heart, MessageSquare, Share2, Clock, MapPin, TrendingUp,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.35)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.25}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent','rgba(29,83,175,0.35)']} start={{x:0.5,y:0.75}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.35)','transparent']} start={{x:0,y:0.5}} end={{x:0.25,y:0.5}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent','rgba(13,37,84,0.35)']} start={{x:0.75,y:0.5}} end={{x:1,y:0.5}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

function statusColor(status: string) {
  if (status === 'active')  return '#00d084';
  if (status === 'expired') return '#ff4050';
  if (status === 'paused')  return '#f59e0b';
  return '#9ca3af';
}

function daysLeft(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

function fmtDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function MiniChart({ data, maxVal }: { data: { day: string; value: number }[]; maxVal: number }) {
  const chartH = 80;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: chartH + 18 }}>
      {data.map((d, i) => {
        const barH   = Math.max(4, (d.value / maxVal) * chartH);
        const isLast = i === data.length - 1;
        return (
          <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View style={{ width: '100%', height: barH, borderRadius: 4, overflow: 'hidden' }}>
              <LinearGradient
                colors={isLast ? [ORANGE, '#ff9a00'] : ['rgba(226,103,27,0.6)', 'rgba(226,103,27,0.2)']}
                start={{x:0.5,y:0}} end={{x:0.5,y:1}}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontFamily: 'Poppins_400Regular' }}>{d.day}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function AdDetailScreen() {
  const router       = useRouter();
  const { token }    = useAuth();
  const { id, type } = useLocalSearchParams<{ id: string; type: 'banner' | 'video' }>();

  const [ad,        setAd]        = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      const listEndpoint = type === 'banner'
        ? `${API_BASE}/banner-ads/my`
        : `${API_BASE}/video-ads/my`;
      const res = await fetch(listEndpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const list: any[] = await res.json();
        const found = list.find((item: any) => String(item.id) === String(id) || String(item._id) === String(id));
        if (found) setAd(found);
      }

      const aRes = await fetch(`${API_BASE}/ads/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (aRes.ok) setAnalytics(await aRes.json());
    } catch {}
    finally { setLoading(false); }
  }, [token, id, type]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    Alert.alert('Delete Ad', 'Are you sure you want to remove this ad?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const adId = ad?.id ?? ad?._id ?? id;
            const endpoint = type === 'banner'
              ? `${API_BASE}/banner-ads/${adId}`
              : `${API_BASE}/video-ads/${adId}`;
            const res = await fetch(endpoint, {
              method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) router.back();
            else Alert.alert('Error', 'Could not delete ad.');
          } catch { Alert.alert('Error', 'Network error.'); }
        },
      },
    ]);
  }

  const sColor   = ad ? statusColor(ad.status) : '#9ca3af';
  const leftDays = ad?.expires_at ? daysLeft(ad.expires_at) : 0;
  const imageUrl = type === 'banner'
    ? ad?.banner_image_url
    : (ad?.thumbnail_url ?? ad?.media_url);

  const trendData = analytics?.trend_7days ?? [
    { day: 'Mon', value: 0 }, { day: 'Tue', value: 0 }, { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 }, { day: 'Fri', value: 0 }, { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ];
  const maxVal = Math.max(...trendData.map((d: any) => d.value), 1);

  const stats = [
    { Icon: Eye,           label: 'Impressions', value: ad?.impressions ?? analytics?.impressions ?? 0 },
    { Icon: MousePointer,  label: 'Clicks',       value: ad?.clicks      ?? analytics?.clicks      ?? 0 },
    { Icon: Phone,         label: 'Calls',         value: ad?.calls       ?? analytics?.calls       ?? 0 },
    { Icon: Heart,         label: 'Favorited',     value: ad?.favorites   ?? analytics?.favorites   ?? 0 },
    { Icon: MessageSquare, label: 'Enquiries',     value: ad?.enquiries   ?? analytics?.enquiries   ?? 0 },
    { Icon: Share2,        label: 'Shares',        value: ad?.shares      ?? analytics?.shares      ?? 0 },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.container}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={24} color={ORANGE} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Ad Details</Text>
          <TouchableOpacity style={s.deleteIconBtn} onPress={handleDelete}>
            <Trash2 size={18} color="#ff4050" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={ORANGE} size="large" />
          </View>
        ) : !ad ? (
          <View style={s.center}>
            <Text style={{ color: C.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular' }}>
              Ad not found
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

            {/* HERO */}
            <View style={s.heroCard}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : (
                <LinearGradient
                  colors={['#1e3a5f', '#0d2040', '#000']}
                  start={{x:0,y:0}} end={{x:1,y:1}}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <LinearGradient
                colors={['rgba(0,0,0,0.08)', 'rgba(1,10,31,0.88)']}
                start={{x:0.5,y:0}} end={{x:0.5,y:1}}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Top row */}
              <View style={s.heroTopRow}>
                <View style={[s.statusBadge, { backgroundColor: sColor + '33', borderColor: sColor + '66' }]}>
                  <View style={[s.statusDot, { backgroundColor: sColor }]} />
                  <Text style={[s.statusText, { color: sColor }]}>{ad.status}</Text>
                </View>
                <View style={s.typeBadge}>
                  <Text style={s.typeText}>{type === 'banner' ? 'Banner Ad' : 'Video Ad'}</Text>
                </View>
              </View>

              {/* Bottom info */}
              <View>
                <Text style={s.heroTitle} numberOfLines={2}>{ad.title ?? ad.campaign_name ?? 'Untitled'}</Text>
                {ad.display_location ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
                    <MapPin size={12} color="rgba(255,255,255,0.55)" />
                    <Text style={s.heroSub}>{ad.display_location}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* INFO CARDS */}
            <View style={s.infoRow}>
              <View style={s.infoCard}>
                <GlassInset />
                <Clock size={18} color={ORANGE} />
                <Text style={s.infoValue}>{leftDays}d</Text>
                <Text style={s.infoLabel}>Days Left</Text>
              </View>
              <View style={s.infoCard}>
                <GlassInset />
                <TrendingUp size={18} color={ORANGE} />
                <Text style={s.infoValue}>
                  {(ad.amount ?? 0) >= 1000
                    ? `${Math.round((ad.amount) / 1000)}K`
                    : String(ad.amount ?? 0)}
                </Text>
                <Text style={s.infoLabel}>PKR Spend</Text>
              </View>
              <View style={s.infoCard}>
                <GlassInset />
                <Eye size={18} color={ORANGE} />
                <Text style={s.infoValue}>{analytics?.avg_ctr ?? 0}%</Text>
                <Text style={s.infoLabel}>Avg. CTR</Text>
              </View>
            </View>

            {/* DURATION */}
            <View style={s.durationCard}>
              <GlassInset />
              <View style={s.durationRow}>
                <View style={s.durationItem}>
                  <Text style={s.durationLabel}>Start Date</Text>
                  <Text style={s.durationValue}>{fmtDate(ad.created_at ?? ad.start_date)}</Text>
                </View>
                <View style={s.durationDivider} />
                <View style={[s.durationItem, { alignItems: 'flex-end' }]}>
                  <Text style={s.durationLabel}>End Date</Text>
                  <Text style={s.durationValue}>{fmtDate(ad.expires_at ?? ad.end_date)}</Text>
                </View>
              </View>
            </View>

            {/* PERFORMANCE */}
            <Text style={s.sectionTitle}>Performance</Text>
            <View style={s.statsGrid}>
              {stats.map(({ Icon, label, value }) => (
                <View key={label} style={s.statCell}>
                  <GlassInset />
                  <Icon size={16} color={ORANGE} />
                  <Text style={s.statValue}>{Number(value).toLocaleString()}</Text>
                  <Text style={s.statLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {/* 7-DAY TREND */}
            <Text style={[s.sectionTitle, { marginTop: 4 }]}>7-Day Trend</Text>
            <View style={s.chartCard}>
              <GlassInset />
              <MiniChart data={trendData} maxVal={maxVal} />
            </View>

            {/* DELETE BUTTON */}
            <TouchableOpacity style={s.deleteFullBtn} onPress={handleDelete} activeOpacity={0.85}>
              <LinearGradient
                colors={['rgba(255,64,80,0.18)', 'rgba(255,64,80,0.04)']}
                start={{x:0,y:0}} end={{x:1,y:0}}
                style={StyleSheet.absoluteFillObject}
              />
              <Trash2 size={16} color="#ff4050" />
              <Text style={s.deleteFullTxt}>Delete Ad</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, height: 60 },
  backBtn:      { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle:  { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  deleteIconBtn:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: 18, paddingTop: 4, gap: 14, paddingBottom: 20 },

  /* HERO */
  heroCard: {
    height: 220, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)',
    justifyContent: 'space-between', padding: 14,
  },
  heroTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'capitalize' },
  typeBadge:  {
    backgroundColor: 'rgba(3,42,105,0.7)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)',
  },
  typeText:   { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontFamily: 'Poppins_500Medium' },
  heroTitle:  { color: '#fff', fontSize: 18, fontFamily: 'Poppins_700Bold', lineHeight: 24 },
  heroSub:    { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'Poppins_400Regular' },

  /* INFO ROW */
  infoRow:  { flexDirection: 'row', gap: 10 },
  infoCard: {
    flex: 1, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)',
    backgroundColor: C.glassBg, overflow: 'hidden',
    alignItems: 'center', paddingVertical: 14, gap: 4,
  },
  infoValue: { color: C.textPrimary, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  infoLabel: { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular' },

  /* DURATION */
  durationCard: {
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)',
    backgroundColor: C.glassBg, overflow: 'hidden', padding: 16,
  },
  durationRow:    { flexDirection: 'row', alignItems: 'center' },
  durationItem:   { flex: 1, gap: 4 },
  durationDivider:{ width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 12 },
  durationLabel:  { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  durationValue:  { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  /* STATS */
  sectionTitle: { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell:     {
    width: '30.5%', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)',
    backgroundColor: C.glassBg, overflow: 'hidden',
    alignItems: 'center', paddingVertical: 14, gap: 4,
  },
  statValue: { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  statLabel: { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular' },

  /* CHART */
  chartCard: {
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)',
    backgroundColor: C.glassBg, overflow: 'hidden', padding: 16,
  },

  /* DELETE BUTTON */
  deleteFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 50, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,64,80,0.3)', marginTop: 4,
  },
  deleteFullTxt: { color: '#ff4050', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});
