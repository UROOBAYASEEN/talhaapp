import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Eye, ShoppingCart, Wallet, Target, Play, Trash2 } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = AppColors.gradientEnd;
const C      = AppColors;

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent','rgba(29,83,175,0.15)']} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

function MiniChart({ data, maxVal }: { data: {day:string;value:number}[]; maxVal: number }) {
  const chartH = 70;
  return (
    <View style={{ height: chartH, flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginVertical: 6 }}>
      {data.map((d, i) => {
        const barH   = Math.max(4, (d.value / maxVal) * chartH);
        const isLast = i === data.length - 1;
        return (
          <View key={d.day} style={{ flex: 1, height: barH, borderRadius: 4, overflow: 'hidden' }}>
            <LinearGradient
              colors={isLast ? [ORANGE, '#ff9a00'] : ['rgba(226,103,27,0.65)', 'rgba(226,103,27,0.25)']}
              start={{x:0.5,y:0}} end={{x:0.5,y:1}}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
        );
      })}
    </View>
  );
}

export default function AdvertisementAnalyticsScreen() {
  const router    = useRouter();
  const { token } = useAuth();
  const [tab,      setTab]      = useState<'Banner' | 'Video ads'>('Banner');
  const [overview, setOverview] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/ads/analytics/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setOverview(await res.json());
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const allCampaigns: any[] = overview?.top_campaigns ?? [];
  const bannerCampaigns = allCampaigns.filter((c: any) => c.ad_type === 'banner');
  const videoCampaigns  = allCampaigns.filter((c: any) => c.ad_type === 'video');

  const trendData = overview?.trend_7days ?? [
    { day: 'Mon', value: 0 }, { day: 'Tue', value: 0 }, { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 }, { day: 'Fri', value: 0 }, { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ];
  const maxVal = Math.max(...trendData.map((d: any) => d.value), 1);

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={24} color={ORANGE} strokeWidth={2}/>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Advertisements Analytics</Text>
        </View>

        {loading && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={ORANGE} size="large"/>
          </View>
        )}
        {!loading && <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

          {/* TABS */}
          <View style={s.tabsRow}>
            {(['Banner', 'Video ads'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[s.tab, tab === t && s.tabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.separator}/>

          {/* OVERVIEW */}
          <Text style={s.sectionTitle}>Overview</Text>

          {/* Row 1 — chart + impressions */}
          <View style={s.row2}>
            {/* Chart card */}
            <View style={s.chartCard}>
              <GlassInset/>
              <Text style={s.cardLabel}>Performance Trend</Text>
              <Text style={s.cardSub}>Last 7 Days</Text>
              <MiniChart data={trendData} maxVal={maxVal}/>
              <View style={s.chartXRow}>
                {['Mon','Wed','Fri','Sun'].map(d => (
                  <Text key={d} style={s.chartX}>{d}</Text>
                ))}
              </View>
            </View>

            {/* Impressions card */}
            <View style={s.impCard}>
              <GlassInset/>
              <Eye size={22} color={ORANGE}/>
              <Text style={s.impLabel}>Impressions</Text>
              <Text style={s.impValue}>
                {overview?.total_impressions >= 1000000
                  ? `${(overview.total_impressions / 1000000).toFixed(1)}M`
                  : overview?.total_impressions >= 1000
                  ? `${(overview.total_impressions / 1000).toFixed(1)}K`
                  : String(overview?.total_impressions ?? 0)}
              </Text>
              <Text style={s.impGrowth}>+{overview?.avg_ctr ?? 0}% CTR</Text>
            </View>
          </View>

          {/* Row 2 — 3 stat cards */}
          <View style={s.row3}>
            {[
              { Icon: ShoppingCart, label: 'Conversions', value: String(overview?.total_clicks ?? 0) },
              { Icon: Wallet,       label: 'Total Spend',  value: overview?.total_spend >= 1000 ? `PKR ${Math.round((overview.total_spend)/1000)}K` : `PKR ${overview?.total_spend ?? 0}` },
              { Icon: Target,       label: 'Avg. CTR',     value: `${overview?.avg_ctr ?? 0}%` },
            ].map(({ Icon, label, value }) => (
              <View key={label} style={s.statCard}>
                <GlassInset/>
                <Icon size={20} color={ORANGE}/>
                <Text style={s.statLabel}>{label}</Text>
                <Text style={s.statValue}>{value}</Text>
              </View>
            ))}
          </View>

          {/* BANNER: Top Campaigns */}
          {tab === 'Banner' && (
            <>
              <Text style={[s.sectionTitle, { marginTop: 10 }]}>Top Campaigns</Text>
              {(bannerCampaigns.length > 0 ? bannerCampaigns : [null]).map((c: any, i: number) => (
                <View key={i} style={s.campaignCard}>
                  <View style={s.campaignImg}>
                    <LinearGradient colors={['#4a5568','#2d3748','#000']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject}/>
                    <View style={s.campaignTagPill}><Text style={s.campaignTagText}>Banner Ad</Text></View>
                    <View style={s.campaignTopBadge}>
                      <View style={s.topDot}/>
                      <Text style={s.topText}>Top</Text>
                    </View>
                    <View style={s.campaignBottom}>
                      <Text style={s.campaignCar}>{c?.title ?? 'No Banner Ads'}</Text>
                      <Text style={s.campaignSub}>Promoted Campaign</Text>
                    </View>
                  </View>
                  <View style={s.campaignInfo}>
                    <Text style={s.campaignTitle}>{c?.title ?? 'No campaigns yet'}</Text>
                    <Text style={s.campaignMeta}>Status: {c?.status ?? '—'} • Spend: PKR {c?.amount ?? 0}</Text>
                    <View style={s.analyticsGrid}>
                      {[
                        { label: 'Impression', value: c?.impressions ?? 0 },
                        { label: 'Clicks',     value: c?.clicks      ?? 0 },
                        { label: 'Calls',      value: c?.calls       ?? 0 },
                        { label: 'Favorited',  value: c?.favorites   ?? 0 },
                        { label: 'Enquiry',    value: c?.enquiries   ?? 0 },
                        { label: 'Shares',     value: c?.shares      ?? 0 },
                      ].map(({ label, value }) => (
                        <View key={label} style={s.analyticsCell}>
                          <Text style={s.analyticsCellLabel}>{label}</Text>
                          <Text style={s.analyticsCellValue}>{value.toLocaleString()}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* VIDEO ADS: Discover Ads */}
          {tab === 'Video ads' && (
            <>
              <Text style={[s.sectionTitle, { marginTop: 10 }]}>Discover Ads</Text>
              {(videoCampaigns.length > 0 ? videoCampaigns : [null]).map((c: any, i: number) => (
                <View key={i} style={s.videoCard}>
                  <LinearGradient colors={['rgba(22,64,136,0.2)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                  <LinearGradient colors={['transparent','rgba(29,83,175,0.15)']} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>

                  <View style={s.videoCardInner}>
                    {/* Text + stats */}
                    <View style={{ flex: 1 }}>
                      <Text style={s.videoTitle}>{c?.title ?? 'No Video Ads'}</Text>
                      <View style={s.analyticsGrid}>
                        {[
                          { label: 'Impression', value: c?.impressions ?? 0 },
                          { label: 'Clicks',     value: c?.clicks      ?? 0 },
                          { label: 'Calls',      value: c?.calls       ?? 0 },
                          { label: 'Favorited',  value: c?.favorites   ?? 0 },
                          { label: 'Enquiry',    value: c?.enquiries   ?? 0 },
                          { label: 'Shares',     value: c?.shares      ?? 0 },
                        ].map(({ label, value }) => (
                          <View key={label} style={s.analyticsCell}>
                            <Text style={s.analyticsCellLabel}>{label}</Text>
                            <Text style={s.analyticsCellValue}>{value.toLocaleString()}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Video thumbnail */}
                    <View style={s.videoThumb}>
                      <LinearGradient colors={['#4a5568','#2d3748','#000']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject}/>
                      {/* PROMOTED badge */}
                      <View style={s.promotedBadge}>
                        <LinearGradient colors={[AppColors.gradientStart, ORANGE]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject}/>
                        <Text style={s.promotedTxt}>PROMOTED</Text>
                      </View>
                      {/* Trash */}
                      <TouchableOpacity style={s.trashBtn}>
                        <Trash2 size={9} color="#fff"/>
                      </TouchableOpacity>
                      {/* Play */}
                      <View style={s.playBtn}>
                        <LinearGradient colors={[AppColors.gradientStart, ORANGE]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject}/>
                        <Play size={11} color="#fff" fill="#fff"/>
                      </View>
                      {/* Bottom label */}
                      <View style={s.videoThumbBottom}>
                        <Text style={s.videoThumbTitle} numberOfLines={1}>{c?.title ?? 'Video Ad'}</Text>
                        <Text style={s.videoThumbSub} numberOfLines={1}>{c?.status ?? 'active'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={{ height: 30 }}/>
        </ScrollView>}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },

  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, height: 60 },
  backBtn:     { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },

  scrollContent: { paddingHorizontal: 18, paddingTop: 4, gap: 14, paddingBottom: 20 },

  /* TABS */
  tabsRow:      { flexDirection: 'row', gap: 10 },
  tab:          { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, borderWidth: 1, borderColor: 'transparent' },
  tabActive:    { borderColor: ORANGE, backgroundColor: 'rgba(226,103,27,0.1)' },
  tabText:      { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  tabTextActive:{ color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
  separator:    { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: -4 },

  sectionTitle: { color: C.textPrimary, fontSize: 18, fontFamily: 'Poppins_700Bold' },

  /* ROW 2 */
  row2: { flexDirection: 'row', gap: 12 },

  chartCard: {
    flex: 1, borderRadius: 18, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: C.glassBg, overflow: 'hidden', padding: 12,
  },
  cardLabel:  { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  cardSub:    { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  chartXRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  chartX:     { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'Poppins_400Regular' },

  impCard: {
    flex: 1, borderRadius: 18, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: C.glassBg, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    padding: 12, gap: 4,
  },
  impLabel:  { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  impValue:  { color: C.textPrimary, fontSize: 22, fontFamily: 'Poppins_700Bold' },
  impGrowth: { color: '#4ade80', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  /* ROW 3 */
  row3: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: C.glassBg, overflow: 'hidden',
    alignItems: 'center', padding: 12, gap: 4,
  },
  statLabel: { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  statValue: { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_700Bold' },

  /* CAMPAIGN */
  campaignCard: {
    borderRadius: 18, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: C.glassBg, overflow: 'hidden',
  },
  campaignImg:     { height: 190, position: 'relative', padding: 12, justifyContent: 'space-between' },
  campaignTagPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  campaignTagText: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontFamily: 'Poppins_400Regular' },
  campaignTopBadge:{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${ORANGE}ee`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  topDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  topText:         { color: '#fff', fontSize: 10, fontFamily: 'Poppins_700Bold' },
  campaignBottom:  {},
  campaignCar:     { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontFamily: 'Poppins_700Bold' },
  campaignSub:     { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'Poppins_400Regular' },

  campaignInfo:     { padding: 14, gap: 8, backgroundColor: 'rgba(6,27,74,1)' },
  campaignTitle:    { color: C.textPrimary, fontSize: 15, fontFamily: 'Poppins_700Bold' },
  campaignMeta:     { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular' },

  analyticsGrid:      { flexDirection: 'row', flexWrap: 'wrap' },
  analyticsCell:      { width: '33.33%', paddingVertical: 8 },
  analyticsCellLabel: { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  analyticsCellValue: { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },

  /* VIDEO CARD */
  videoCard: {
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: C.glassBg, overflow: 'hidden', padding: 14,
  },
  videoCardInner: { flexDirection: 'row', gap: 12 },
  videoTitle:     { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_700Bold', marginBottom: 4 },

  videoThumb: {
    width: 100, borderRadius: 14, overflow: 'hidden',
    backgroundColor: '#2d3748',
  },
  promotedBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, overflow: 'hidden', zIndex: 2,
  },
  promotedTxt: { color: '#fff', fontSize: 7, fontFamily: 'Poppins_700Bold' },
  trashBtn: {
    position: 'absolute', top: 8, right: 8, zIndex: 2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  playBtn: {
    position: 'absolute', alignSelf: 'center',
    top: '35%', left: '50%', marginLeft: -16,
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', zIndex: 2,
  },
  videoThumbBottom: {
    position: 'absolute', bottom: 8, left: 8, right: 8, zIndex: 2,
  },
  videoThumbTitle: { color: '#fff', fontSize: 8, fontFamily: 'Poppins_700Bold' },
  videoThumbSub:   { color: 'rgba(255,255,255,0.5)', fontSize: 7, fontFamily: 'Poppins_400Regular' },
});
