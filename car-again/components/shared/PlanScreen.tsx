import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Send, Zap, Building2, Crown, Car, TrendingUp, ChevronLeft } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { D, DHeader, DICON, DIcon, PillGlow, SegTabs, WarmCard } from '@/components/dealer/DealerUI';
import { Image } from 'react-native';

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;

const ICON_MAP: Record<string, any> = {
  basic:      Send,
  premium:    Zap,
  enterprise: Building2,
};

type Plan = {
  id:            string;
  name:          string;
  tagline:       string;
  description:   string;
  monthly_price: number;
  yearly_price:  number | null;
  features:      string[];
  is_popular:    boolean;
  color:         string;
};

function fmt(price: number) {
  if (price === 0) return 'Custom';
  return `PKR ${price.toLocaleString('en-PK')}`;
}

/* ── Feature Row ── */
function Feature({ text, color, dc }: { text: string; color: string; dc?: boolean }) {
  return (
    <View style={s.feature}>
      <View style={[s.checkCircle, { backgroundColor: dc ? D.orange : ORANGE }]}>
        <Check size={12} color="#fff" strokeWidth={3} />
      </View>
      <Text style={[s.featureText, dc && { color: '#C9BDC4', fontSize: 15 }]}>{text}</Text>
    </View>
  );
}

/* ── Plan Card ── */
function PlanCard({ plan, billing, isCurrent, onChoose, figma, dc }: {
  plan: Plan; billing: 'monthly' | 'yearly'; isCurrent: boolean; onChoose: () => void; figma?: boolean; dc?: boolean;
}) {
  const price    = billing === 'monthly' ? plan.monthly_price : (plan.yearly_price ?? plan.monthly_price);
  const priceStr = fmt(price);
  const perLabel = priceStr === 'Custom' ? '' : billing === 'monthly' ? '/ month' : '/ year';
  const PlanIcon = ICON_MAP[plan.name.toLowerCase()] ?? Send;

  // Figma (dealer panel): outlined card, light icon circle, grey-lilac text, orange check circles
  if (figma) {
    return (
      <View style={[fc.card, isCurrent && { borderColor: D.orange }]}>
        {isCurrent && <View style={fc.current}><Text style={fc.currentTxt}>CURRENT PLAN</Text></View>}
        <Text style={fc.name}>{plan.name}</Text>
        <Text style={fc.desc}>{plan.description || plan.tagline}</Text>
        <View style={fc.iconCircle}>
          {plan.name.toLowerCase() === 'basic'
            ? <Image source={DICON.basicPlan} style={{ width: 36, height: 36 }} resizeMode="contain" />
            : <PlanIcon size={32} color={D.orange} fill={D.orange} strokeWidth={1} />}
        </View>
        <Text style={fc.price}>{priceStr}</Text>
        {perLabel ? <Text style={fc.per}>{perLabel}</Text> : null}
        <View style={{ marginTop: 14, gap: 14 }}>
          {plan.features.map((f, i) => (
            <View key={i} style={fc.feat}>
              <View style={fc.check}><Check size={14} color="#fff" strokeWidth={3} /></View>
              <Text style={fc.featTxt}>{f}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[fc.btn, isCurrent && { borderWidth: 1, borderColor: D.orange }]} disabled={isCurrent} activeOpacity={0.85} onPress={onChoose}>
          {!isCurrent && <LinearGradient colors={['#0B3585', '#7E4F5C', '#E8702A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />}
          <Text style={[fc.btnTxt, isCurrent && { color: D.orange }]}>
            {isCurrent ? 'Current Plan' : priceStr === 'Custom' ? 'Contact Us' : `Choose ${plan.name}`}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[pc.card, dc && dcs.card, isCurrent && { borderColor: dc ? D.orange : plan.color }]}>
      {!dc && <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      </>}

      {plan.is_popular && (
        <View style={[pc.popularBadge, { backgroundColor: ORANGE }]}>
          <Text style={pc.popularTxt}>Most Popular</Text>
        </View>
      )}
      {isCurrent && (
        <View style={[pc.currentBadge, { borderColor: plan.color }, dc && fc.current]}>
          <Text style={[pc.currentTxt, { color: plan.color }, dc && fc.currentTxt]}>Current Plan</Text>
        </View>
      )}

      <Text style={[pc.planName, { color: plan.color }, dc && fc.name]}>{plan.name}</Text>
      {plan.tagline ? <Text style={[pc.tagline, dc && { color: '#C9BDC4' }]}>{plan.tagline}</Text> : null}
      <Text style={[pc.planDesc, dc && fc.desc]}>{plan.description}</Text>

      <View style={[pc.planIconWrap, { backgroundColor: isCurrent ? ORANGE : `${plan.color}22` }, dc && fc.iconCircle]}>
        <PlanIcon size={30} color={dc ? D.orange : isCurrent ? '#fff' : plan.color} fill={dc ? D.orange : isCurrent ? '#fff' : plan.color} strokeWidth={1} />
      </View>

      <Text style={[pc.price, dc && fc.price]}>{priceStr}</Text>
      {perLabel ? <Text style={[pc.perLabel, dc && fc.per]}>{perLabel}</Text> : null}

      <View style={[pc.divider, dc && { backgroundColor: 'rgba(230,225,232,0.18)' }]} />

      {plan.features.map((f, i) => <Feature key={i} text={f} color={plan.color} dc={dc} />)}

      <TouchableOpacity
        style={[pc.btn, { overflow: 'hidden', borderColor: isCurrent ? (dc ? D.orange : plan.color) : 'transparent' }, dc && { borderRadius: 24, marginTop: 22 }]}
        disabled={isCurrent}
        activeOpacity={0.8}
        onPress={onChoose}
      >
        {!isCurrent && (
          <LinearGradient colors={(dc ? ['#0B3585', '#7E4F5C', '#E8702A'] : [NAVY, ORANGE]) as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
        )}
        <Text style={[pc.btnTxt, dc && fc.btnTxt, isCurrent && { color: dc ? D.orange : plan.color }]}>
          {isCurrent ? 'Current Plan' : priceStr === 'Custom' ? 'Contact Us' : `Choose ${plan.name}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── Main Screen ── */
type Props = {
  role:       string;
  promoTitle: string;
  promoDesc:  string;
  /** Figma dealer-panel look (only the dealer Plan tab sets this) */
  figma?:     boolean;
  /** Dealer colours / borders / backgrounds only — keeps this layout's icons & text (Seller Plan tab) */
  dealerColors?: boolean;
};

export default function PlanScreen({ role, promoTitle, promoDesc, figma, dealerColors }: Props) {
  const dc = !!dealerColors && !figma;
  const { token } = useAuth();
  const router    = useRouter();
  const [billing,     setBilling]     = useState<'monthly' | 'yearly'>('monthly');
  const [plans,       setPlans]       = useState<Plan[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const [subStatus,   setSubStatus]   = useState<{active: boolean; remaining_days: number; plan?: string} | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/plans?role=${role}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) setPlans(await res.json());
        if (token) {
          const r2 = await fetch(`${API_BASE}/plans/my/status`, { headers: { Authorization: `Bearer ${token}` } });
          if (r2.ok) setSubStatus(await r2.json());
        }
      } catch { /* offline */ }
      finally { setLoading(false); }
    })();
  }, [role, token]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={ORANGE} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.safeArea, dc && { backgroundColor: D.bg }]} edges={['top']}>
      <View style={[s.container, dc && { backgroundColor: D.bg }]}>

        {figma ? (
          <>
            <DHeader
              title="Subscription Plans"
              titleStyle={{ fontSize: 18 }}
              right={
                <TouchableOpacity onPress={() => router.push('/dealer-panel/compare-plans' as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <DIcon src={DICON.comparePlans} size={20} />
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins_400Regular' }} numberOfLines={1}>Compare Plans</Text>
                </TouchableOpacity>
              }
            />
            <View style={{ marginHorizontal: 16 }}>
              <SegTabs
                items={['Monthly', 'Yearly(save 20%)'] as const}
                value={billing === 'monthly' ? 'Monthly' : 'Yearly(save 20%)'}
                onChange={v => setBilling(v === 'Monthly' ? 'monthly' : 'yearly')}
              />
            </View>
          </>
        ) : (<>
        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={24} color={dc ? D.muted : C.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, dc && { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_500Medium' }]}>Subscription Plans</Text>
          <TouchableOpacity onPress={() => router.push('/compare-plans' as any)}>
            <Text style={s.compareTxt}>Compare Plans</Text>
          </TouchableOpacity>
        </View>

        {/* BILLING TABS */}
        <View style={s.tabsWrapper}>
          {(['monthly', 'yearly'] as const).map(b => (
            <TouchableOpacity key={b} onPress={() => setBilling(b)} style={[s.tab, billing === b && s.activeTab, dc && billing === b && dcs.tabOn]}>
              {dc && billing === b && <PillGlow />}
              <Text style={[s.tabText, dc && { color: '#E6E1E8', fontSize: 16 }, billing === b && s.activeTabText, dc && billing === b && { color: D.orange }]}>
                {b === 'monthly' ? 'Monthly' : 'Yearly'}
              </Text>
              {b === 'yearly' && <Text style={s.saveText}>(save 20%)</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.separator, dc && { backgroundColor: 'rgba(255,255,255,0.14)' }]} />
        </>)}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

          {/* PROMO CARD */}
          {figma ? (
            <WarmCard style={fc.promo}>
              <View style={s.promoLeft}>
                <DIcon src={DICON.subscription} size={34} />
                <Text style={fc.promoTitle}>{promoTitle}</Text>
                <Text style={fc.promoDesc}>{promoDesc}</Text>
              </View>
              <View style={s.promoRight}>
                {[
                  { icon: DICON.increaseVisiblity, t: 'Increase Visibility', d: 'Your ads reach thousands\nof serious buyers' },
                  { icon: DICON.generateMoreLeads, t: 'Generate More Leads', d: 'Get more enquiries and\nreservation requests' },
                  { icon: DICON.generateMoreLeads, t: 'Build Trust & Credibility', d: 'Verified dealerships get\nmore trust and sales' },
                ].map(it => (
                  <View key={it.t} style={[s.promoItem, { minHeight: 50 }]}>
                    <View style={[s.promoIcon, { width: 30 }]}><DIcon src={it.icon} size={20} /></View>
                    <View style={s.promoTextContainer}>
                      <Text style={fc.promoItemTitle}>{it.t}</Text>
                      <Text style={fc.promoItemText}>{it.d}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </WarmCard>
          ) : (
          <View style={[s.promoCard, dc && dcs.promoCard]}>
            {dc ? (
              <LinearGradient colors={['#0A1A45', '#0E1E45', '#2C2A45', '#5A3A36']} locations={[0, 0.45, 0.75, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            ) : (<>
            <LinearGradient colors={['rgba(22,64,136,0.25)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.15)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            </>)}
            <View style={s.promoLeft}>
              <Crown size={32} color={ORANGE} fill={ORANGE} strokeWidth={1.5} />
              <Text style={[s.promoTitle, dc && fc.promoTitle]}>{promoTitle}</Text>
              <Text style={[s.promoDescription, dc && fc.promoDesc]}>{promoDesc}</Text>
            </View>
            <View style={s.promoRight}>
              <View style={s.promoItem}>
                <View style={s.promoIcon}><Car size={17} color={ORANGE} /></View>
                <View style={s.promoTextContainer}>
                  <Text style={[s.promoItemTitle, dc && fc.promoItemTitle]}>Increase Visibility</Text>
                  <Text style={[s.promoItemText, dc && fc.promoItemText]}>{'Your ads reach thousands\nof serious buyers'}</Text>
                </View>
              </View>
              <View style={s.promoItem}>
                <View style={s.promoIcon}><TrendingUp size={17} color={ORANGE} /></View>
                <View style={s.promoTextContainer}>
                  <Text style={[s.promoItemTitle, dc && fc.promoItemTitle]}>Generate More Leads</Text>
                  <Text style={[s.promoItemText, dc && fc.promoItemText]}>{'Get more enquiries and\nreservation requests'}</Text>
                </View>
              </View>
              <View style={s.promoItem}>
                <View style={s.promoIcon}><Crown size={17} color={ORANGE} /></View>
                <View style={s.promoTextContainer}>
                  <Text style={[s.promoItemTitle, dc && fc.promoItemTitle]}>Build Trust</Text>
                  <Text style={[s.promoItemText, dc && fc.promoItemText]}>{'Verified partners get\nmore trust and sales'}</Text>
                </View>
              </View>
            </View>
          </View>
          )}

          {subStatus?.active && (
            <View style={[s.promoCard, { borderColor: '#00d084', backgroundColor: 'rgba(0,208,132,0.08)' }]}>
              <Text style={{ color: '#00d084', fontFamily: 'Poppins_600SemiBold', fontSize: 13 }}>
                Already Active — {subStatus.remaining_days} days remaining
              </Text>
              <Text style={{ color: C.textSecondary, fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 4 }}>
                {subStatus.plan} • Monthly • 30 days
              </Text>
            </View>
          )}
          {plans.length === 0 ? (
            <Text style={s.emptyTxt}>No plans available yet</Text>
          ) : (
            plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billing={billing}
                figma={figma}
                dc={dc}
                isCurrent={currentPlan === plan.id}
                onChoose={async () => {
                  if (subStatus?.active) {
                    const { Alert } = await import('react-native');
                    Alert.alert('Already Active', `Subscription active — ${subStatus.remaining_days} days remaining.`);
                    return;
                  }
                  try {
                    const res = await fetch(`${API_BASE}/plans/${plan.id}/subscribe`, {
                      method: 'POST',
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
                    const { Alert } = await import('react-native');
                    Alert.alert('Success', `Subscribed to ${plan.name} successfully!`);
                    setCurrentPlan(plan.id);
                    setSubStatus({ active: true, remaining_days: 30, plan: `Subscription • ${plan.name}` });
                  } catch (e: any) {
                    const { Alert } = await import('react-native');
                    Alert.alert('Error', e.message || 'Subscription failed');
                  }
                }}
              />
            ))
          )}

          <View style={s.helpBox}>
            <Text style={s.helpTxt}>
              Need help choosing a plan?{' '}
              <Text style={{ color: ORANGE }}>Contact support</Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  center:    { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  emptyTxt:  { color: C.textSecondary, textAlign: 'center', marginTop: 40, fontFamily: 'Poppins_400Regular' },

  header:      { height: 62, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', flex: 1, textAlign: 'center' },
  backBtn:     { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  compareTxt:  { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_500Medium' },

  tabsWrapper: { height: 60, marginHorizontal: 20, flexDirection: 'row' },
  tab:         { flex: 1, height: 46, marginTop: 4, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 5 },
  activeTab:   { backgroundColor: NAVY, borderWidth: 1, borderColor: 'rgba(99,148,214,0.7)' },
  tabText:     { fontSize: 15, fontFamily: 'Poppins_500Medium', color: C.textSecondary },
  activeTabText: { color: ORANGE },
  saveText:    { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  separator:     { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 },

  promoCard: {
    borderRadius: 24, borderWidth: 1, borderColor: ORANGE,
    paddingHorizontal: 18, paddingVertical: 18, flexDirection: 'row',
    overflow: 'hidden', backgroundColor: C.bg, marginBottom: 16,
  },
  promoLeft:  { width: '47%', paddingTop: 3 },
  promoRight: { flex: 1, paddingLeft: 4, justifyContent: 'space-between' },
  promoTitle: { color: C.textPrimary, fontSize: 13, lineHeight: 18, fontFamily: 'Poppins_700Bold', marginTop: 7 },
  promoDescription: { color: C.textSecondary, fontSize: 8.5, lineHeight: 13, marginTop: 8, fontFamily: 'Poppins_400Regular' },
  promoItem:         { flexDirection: 'row', minHeight: 43 },
  promoIcon:         { width: 25, alignItems: 'center', paddingTop: 1 },
  promoTextContainer:{ flex: 1 },
  promoItemTitle:    { color: C.textPrimary, fontSize: 9.5, fontFamily: 'Poppins_700Bold', marginBottom: 3 },
  promoItemText:     { color: C.textSecondary, fontSize: 8.5, lineHeight: 12, fontFamily: 'Poppins_400Regular' },

  feature:     { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  featureText: { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', flex: 1 },

  helpBox: { alignItems: 'center', padding: 16 },
  helpTxt: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: C.textSecondary, textAlign: 'center' },
});

const fc = StyleSheet.create({
  promo:          { flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 20, marginBottom: 20, borderRadius: 26 },
  promoTitle:     { color: '#FFFFFF', fontSize: 14, lineHeight: 20, fontFamily: 'Poppins_600SemiBold', marginTop: 8 },
  promoDesc:      { color: '#E6E1E8', fontSize: 10.5, lineHeight: 15, marginTop: 6, fontFamily: 'Poppins_400Regular' },
  promoItemTitle: { color: '#FFFFFF', fontSize: 11.5, fontFamily: 'Poppins_600SemiBold', marginBottom: 2 },
  promoItemText:  { color: '#E6E1E8', fontSize: 10.5, lineHeight: 14, fontFamily: 'Poppins_400Regular' },

  card:       { borderRadius: 30, borderWidth: 1, borderColor: 'rgba(230,225,232,0.3)', paddingHorizontal: 22, paddingTop: 24, paddingBottom: 24, marginBottom: 18 },
  current:    { alignSelf: 'flex-start', backgroundColor: D.orange, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2, marginBottom: 8 },
  currentTxt: { color: '#3A1A0A', fontSize: 10, fontFamily: 'Poppins_700Bold' },
  name:       { color: '#C9BDC4', fontSize: 24, fontFamily: 'Poppins_600SemiBold' },
  desc:       { color: '#C9BDC4', fontSize: 15, fontFamily: 'Poppins_400Regular', marginTop: 8 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E3EEFF', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  price:      { color: '#C9BDC4', fontSize: 34, fontFamily: 'Poppins_600SemiBold', marginTop: 12 },
  per:        { color: '#C9BDC4', fontSize: 15, fontFamily: 'Poppins_400Regular' },
  feat:       { flexDirection: 'row', alignItems: 'center', gap: 14 },
  check:      { width: 22, height: 22, borderRadius: 11, backgroundColor: D.orange, alignItems: 'center', justifyContent: 'center' },
  featTxt:    { flex: 1, color: '#C9BDC4', fontSize: 15, fontFamily: 'Poppins_400Regular' },
  btn:        { height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 22, overflow: 'hidden' },
  btnTxt:     { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});

const pc = StyleSheet.create({
  card: {
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: C.glassBg, overflow: 'hidden',
    paddingHorizontal: 22, paddingTop: 18, paddingBottom: 22, marginBottom: 16, position: 'relative',
  },
  popularBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  popularTxt:   { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  currentBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  currentTxt:   { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },

  planName:    { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  tagline:     { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 2 },
  planDesc:    { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 6 },
  planIconWrap:{ width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  price:       { color: C.textPrimary, fontSize: 28, fontFamily: 'Poppins_700Bold', marginTop: 10 },
  perLabel:    { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 4 },
  divider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 },

  btn:    { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 18, borderWidth: 1 },
  btnTxt: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});

// Dealer colours for the standard layout (dealerColors prop)
const dcs = StyleSheet.create({
  card:      { backgroundColor: 'transparent', borderRadius: 30, borderColor: 'rgba(230,225,232,0.3)', paddingTop: 24, paddingBottom: 24, marginBottom: 18 },
  tabOn:     { backgroundColor: '#05122A', borderColor: '#7F98C4', overflow: 'hidden' },
  promoCard: { borderRadius: 26, borderWidth: 1.2, borderColor: '#B0603A', backgroundColor: 'transparent', marginBottom: 20 },
});
