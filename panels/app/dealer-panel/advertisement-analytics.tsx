import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Play, Trash2 } from 'lucide-react-native';
import { Image } from 'react-native';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { D, DHeader, DICON, DIcon, GlowCard, SegTabs, dImg } from '@/components/dealer/DealerUI';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = AppColors.gradientEnd;
const C      = AppColors;

// Smooth orange line over the last-7-days trend (Figma "Performance Trend")
function MiniChart({ data, maxVal }: { data: {day:string;value:number}[]; maxVal: number }) {
  const [w, setW] = React.useState(0);
  const H = 62, LEFT = 26;
  const pw = Math.max(w - LEFT, 1);
  const pts = data.map((d, i) => ({
    x: LEFT + (data.length > 1 ? (i / (data.length - 1)) * pw : 0),
    y: H - 4 - (d.value / maxVal) * (H - 10),
  }));
  let path = pts.length ? `M ${pts[0].x} ${pts[0].y}` : '';
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i], cx = (p0.x + p1.x) / 2;
    path += ` C ${cx} ${p0.y} ${cx} ${p1.y} ${p1.x} ${p1.y}`;
  }
  const fmt = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)));
  return (
    <View style={{ height: H, marginTop: 8 }} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={H}>
          {[0, 0.5, 1].map(f => (
            <React.Fragment key={f}>
              <Line x1={LEFT} x2={w} y1={H - 4 - f * (H - 10)} y2={H - 4 - f * (H - 10)} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
              <SvgText x={0} y={H - 1 - f * (H - 10)} fill="rgba(230,225,232,0.7)" fontSize={7}>{fmt(maxVal * f)}</SvgText>
            </React.Fragment>
          ))}
          <Path d={path} stroke={ORANGE} strokeWidth={2} fill="none" />
        </Svg>
      )}
    </View>
  );
}

export default function AdvertisementAnalyticsScreen({ forceVariant }: { forceVariant?: string } = {}) {
  const router    = useRouter();
  const { token } = useAuth();
  // Insurance / bank panels reuse this screen with their own wording (Figma)
  const { variant } = useLocalSearchParams<{ variant?: string }>();
  const isIns = (forceVariant || variant) === 'insurance';
  // Admin panel adds a "Featured Banner" section (Figma)
  const isAdmin = (forceVariant || variant) === 'admin';
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

  // One banner campaign card (image + stats)
  function renderCampaign(c: any, i: number, badge: string) {
    return (
                <View key={i} style={s.campaignCard}>
                  <View style={s.campaignImg}>
                    <LinearGradient colors={['#4a5568','#2d3748','#000']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject}/>
                    {dImg(c?.media_url || c?.image_url) ? <Image source={{ uri: dImg(c?.media_url || c?.image_url)! }} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
                    <View style={s.campaignTopBadge}>
                      <View style={s.topDot}/>
                      <Text style={s.topText}>{badge}</Text>
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
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>

        {/* HEADER */}
        <DHeader title="Advertisements Analytics" />

        {loading && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={ORANGE} size="large"/>
          </View>
        )}
        {!loading && <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

          {/* TABS */}
          <SegTabs items={['Banner', 'Video ads'] as const} value={tab} onChange={setTab} />

          {/* OVERVIEW */}
          <Text style={s.sectionTitle}>Overview</Text>

          {/* Row 1 — chart + impressions */}
          <View style={s.row2}>
            {/* Chart card */}
            <GlowCard style={s.chartCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.cardLabel}>Performance Trend</Text>
                <Text style={s.cardSub}>Last 7 Days</Text>
              </View>
              <MiniChart data={trendData} maxVal={maxVal}/>
              <View style={s.chartXRow}>
                {['Mon','Wed','Fri','Sun'].map(d => (
                  <Text key={d} style={s.chartX}>{d}</Text>
                ))}
              </View>
            </GlowCard>

            {/* Impressions card */}
            <GlowCard style={s.impCard}>
              <DIcon src={DICON.impressions} size={26} />
              <Text style={s.impLabel}>Impressions</Text>
              <Text style={s.impValue}>
                {overview?.total_impressions >= 1000000
                  ? `${(overview.total_impressions / 1000000).toFixed(1)}M`
                  : overview?.total_impressions >= 1000
                  ? `${(overview.total_impressions / 1000).toFixed(1)}K`
                  : String(overview?.total_impressions ?? 0)}
              </Text>
              <Text style={s.impGrowth}>+{overview?.avg_ctr ?? 0}% CTR</Text>
            </GlowCard>
          </View>

          {/* Row 2 — 3 stat cards */}
          <View style={s.row3}>
            {[
              { icon: DICON.conversions, label: 'Conversions', value: String(overview?.total_clicks ?? 0) },
              { icon: DICON.totalSpend,  label: 'Total Spend',  value: overview?.total_spend >= 1000 ? `PKR ${Math.round((overview.total_spend)/1000)}K` : `PKR ${overview?.total_spend ?? 0}` },
              { icon: DICON.avgCTR,      label: 'Avg. CTR',     value: `${overview?.avg_ctr ?? 0}%` },
            ].map(({ icon, label, value }) => (
              <GlowCard key={label} style={s.statCard}>
                <DIcon src={icon} size={26} />
                <Text style={s.statLabel}>{label}</Text>
                <Text style={s.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
              </GlowCard>
            ))}
          </View>

          {/* BANNER: Top Campaigns */}
          {tab === 'Banner' && (
            <>
              <Text style={[s.sectionTitle, { marginTop: 10 }]}>{isIns ? 'Banner Campaigns' : 'Top Campaigns'}</Text>
              {(bannerCampaigns.length > 0 ? bannerCampaigns : [null]).map((c: any, i: number) => renderCampaign(c, i, isIns ? 'LIVE' : 'Top'))}
              {isAdmin && (
                <>
                  <Text style={[s.sectionTitle, { marginTop: 10 }]}>Featured Banner</Text>
                  {(() => {
                    const featured = bannerCampaigns.filter((c: any) => c?.is_featured || c?.featured || c?.promoted);
                    const list = featured.length ? featured : bannerCampaigns.slice(0, 1);
                    return (list.length ? list : [null]).map((c: any, i: number) => renderCampaign(c, i, 'Promotion'));
                  })()}
                </>
              )}
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

  scrollContent: { paddingHorizontal: 16, paddingTop: 4, gap: 14, paddingBottom: 20 },

  sectionTitle: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Poppins_600SemiBold' },

  /* ROW 2 */
  row2: { flexDirection: 'row', gap: 12 },

  chartCard:  { flex: 1.9, padding: 12 },
  cardLabel:  { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins_500Medium' },
  cardSub:    { color: '#E6E1E8', fontSize: 9, fontFamily: 'Poppins_400Regular' },
  chartXRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingLeft: 22 },
  chartX:     { color: 'rgba(230,225,232,0.8)', fontSize: 8, fontFamily: 'Poppins_400Regular' },

  impCard:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10, gap: 2 },
  impLabel:  { color: '#E6E1E8', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  impValue:  { color: '#E6E1E8', fontSize: 20, fontFamily: 'Poppins_500Medium' },
  impGrowth: { color: '#2ECC71', fontSize: 11, fontFamily: 'Poppins_400Regular' },

  /* ROW 3 */
  row3: { flexDirection: 'row', gap: 10 },
  statCard:  { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6, gap: 2 },
  statLabel: { color: '#E6E1E8', fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  statValue: { color: '#E6E1E8', fontSize: 22, fontFamily: 'Poppins_400Regular', marginTop: 6 },

  /* CAMPAIGN */
  campaignCard:    { borderRadius: 16, overflow: 'hidden', backgroundColor: D.navy },
  campaignImg:     { height: 200, position: 'relative', padding: 16 },
  campaignTagPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  campaignTagText: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontFamily: 'Poppins_400Regular' },
  campaignTopBadge:{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(226,103,27,0.45)', borderWidth: 1, borderColor: ORANGE, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16 },
  topDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF8A7A' },
  topText:         { color: '#FFB8A8', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  campaignBottom:  {},
  campaignCar:     { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontFamily: 'Poppins_700Bold' },
  campaignSub:     { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'Poppins_400Regular' },

  campaignInfo:     { padding: 22, gap: 6, backgroundColor: D.navy },
  campaignTitle:    { color: '#E6E1E8', fontSize: 20, fontFamily: 'Poppins_500Medium' },
  campaignMeta:     { color: '#E6E1E8', fontSize: 14, fontFamily: 'Poppins_400Regular' },

  analyticsGrid:      { flexDirection: 'row', flexWrap: 'wrap' },
  analyticsCell:      { width: '33.33%', paddingVertical: 8 },
  analyticsCellLabel: { color: '#E6E1E8', fontSize: 11, fontFamily: 'Poppins_400Regular' },
  analyticsCellValue: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_500Medium', marginTop: 2 },

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
