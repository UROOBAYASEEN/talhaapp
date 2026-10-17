// Drafts — vehicles saved with "Save Draft" on Vehicle Details (dealer-panel/add-vehicle).
// Shared by the Dealer and Become_a_Seller panels (Quick Actions → Drafts).
// Real data: GET /vehicles/my?status=draft  •  delete: DELETE /vehicles/{id}
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { D, DHeader, FilterPills, GlowCard, MiniGradBtn, SearchBar, StatusPill, TipBanner } from '@/components/dealer/DealerUI';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyDrafts, deleteDraft } from '@/constants/draftApi';

const TABS = ['All', 'Cars', 'Bikes'] as const;
type Tab = typeof TABS[number];

// Same order as the Vehicle Details form
const STEPS = ['Images', 'Details', 'Specs', 'Price', 'Features'] as const;
type Step = typeof STEPS[number];

type Draft = {
  id: string;
  type: 'car' | 'bike';
  title: string;
  city?: string;
  year?: string;
  price?: number;
  photos: number;
  done: Step[];
  savedAgo: string;
  // Ad-type drafts (video_ad / special_offer waghaira) — vehicle ke ilawa
  kind?: string;        // undefined/'vehicle' = gaari; warna ad draft
  subtitle?: string;
  route?: string;       // Continue par kaun si editor screen khule
};

// "2026-10-17T..." → "2 hours ago"
function timeAgo(iso?: string): string {
  if (!iso) return 'recently';
  let s = iso;
  if (!/[Z+-]/.test(s.slice(-6)) && !s.endsWith('Z')) s = s.replace(' ', 'T') + 'Z';
  const t = new Date(s).getTime();
  if (!isFinite(t)) return 'recently';
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

// Backend vehicle (status=draft) → Draft card. "done" steps bhari hui fields se bante hain.
function mapToDraft(v: any): Draft {
  const done: Step[] = [];
  if (v.images?.length) done.push('Images');
  if (v.make && v.model && v.city) done.push('Details');
  if (v.transmission && v.fuel_type && v.year && v.body_type) done.push('Specs');
  if (v.price > 0) done.push('Price');
  if (v.features?.length) done.push('Features');
  return {
    id:       String(v.id),
    type:     v.category === 'bike' ? 'bike' : 'car',
    title:    v.title || `${v.make || ''} ${v.model || ''}`.trim(),
    city:     v.city || undefined,
    year:     v.year ? String(v.year) : undefined,
    price:    v.price || undefined,
    photos:   v.images?.length || 0,
    done,
    savedAgo: timeAgo(v.created_at),
    kind:     'vehicle',
  };
}

function fmtPrice(p?: number) {
  if (!p) return null;
  if (p >= 10000000) return `PKR ${(p / 10000000).toFixed(2)} Crore`;
  if (p >= 100000) return `PKR ${(p / 100000).toFixed(2)} Lacs`;
  return `PKR ${p.toLocaleString()}`;
}

const KIND_LABEL: Record<string, string> = {
  video_ad:      'Video Ad',
  special_offer: 'Special Offer',
  advertisement: 'Advertisement',
  tracker:       'Tracker',
};

// Generic draft (video ad / special offer waghaira) → Draft card
function mapGenericToDraft(d: any): Draft {
  return {
    id:       String(d.id),
    type:     'car',   // ad drafts Cars/Bikes tab me count nahi hote (kind se filter)
    title:    d.title || KIND_LABEL[d.kind] || 'Untitled draft',
    subtitle: d.subtitle || KIND_LABEL[d.kind] || 'Draft',
    photos:   d.media_url ? 1 : 0,
    done:     [],
    savedAgo: timeAgo(d.updated_at || d.created_at),
    kind:     d.kind || 'draft',
    route:    d.data?.route,
  };
}

// Ad-type draft ke liye compact card (vehicle steps/progress ke bagair)
function AdDraftCard({ d, onContinue, onDelete }: { d: Draft; onContinue: () => void; onDelete: () => void }) {
  const icon = d.kind === 'special_offer' ? 'pricetag-outline'
    : d.kind === 'video_ad' ? 'videocam-outline'
    : d.kind === 'tracker' ? 'locate-outline'
    : 'megaphone-outline';
  return (
    <GlowCard style={s.card} onPress={onContinue}>
      <View style={s.topRow}>
        <View style={s.thumb}>
          <Ionicons name={icon as any} size={28} color={D.muted} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.titleRow}>
            <StatusPill label="Draft" tone="orange" style={s.draftPill} />
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="trash-outline" size={20} color={D.muted} />
            </TouchableOpacity>
          </View>
          <Text style={s.title} numberOfLines={1}>{d.title || 'Untitled draft'}</Text>
          <Text style={s.meta} numberOfLines={1}>{d.subtitle || 'Draft'}</Text>
        </View>
      </View>
      <View style={s.divider} />
      <View style={s.footer}>
        <View style={{ flex: 1 }}>
          <View style={s.savedRow}>
            <Ionicons name="time-outline" size={13} color={D.muted} />
            <Text style={s.savedTxt}>Saved {d.savedAgo}</Text>
          </View>
        </View>
        <MiniGradBtn title="Continue" onPress={onContinue} />
      </View>
    </GlowCard>
  );
}

function DraftCard({ d, onContinue, onDelete }: { d: Draft; onContinue: () => void; onDelete: () => void }) {
  const pct = Math.round((d.done.length / STEPS.length) * 100);
  const nextStep = STEPS.find(st => !d.done.includes(st));
  const meta = [d.city, d.year].filter(Boolean).join('  •  ');
  const price = fmtPrice(d.price);

  return (
    <GlowCard style={s.card} onPress={onContinue}>
      {/* Top row: thumbnail + info + delete */}
      <View style={s.topRow}>
        <View style={s.thumb}>
          <Ionicons name={d.type === 'bike' ? 'bicycle-outline' : 'car-outline'} size={30} color={D.muted} />
          <View style={s.photoTag}>
            <Ionicons name="images-outline" size={11} color="#fff" />
            <Text style={s.photoTagTxt}>{d.photos}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <View style={s.titleRow}>
            <StatusPill label="Draft" tone="orange" style={s.draftPill} />
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="trash-outline" size={20} color={D.muted} />
            </TouchableOpacity>
          </View>
          <Text style={s.title} numberOfLines={1}>{d.title || 'Untitled vehicle'}</Text>
          <Text style={s.meta} numberOfLines={1}>{meta || 'Details not added yet'}</Text>
          <Text style={[s.price, !price && { color: D.muted }]} numberOfLines={1}>{price || 'Price not set'}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={s.progressHead}>
        <Text style={s.progressLbl}>{pct === 100 ? 'Ready to publish' : `${pct}% complete`}</Text>
        <Text style={s.progressStep}>{d.done.length}/{STEPS.length} steps</Text>
      </View>
      <View style={s.track}>
        <LinearGradient
          colors={['#1D3A7A', '#6E4A52', D.orange]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[s.fill, { width: `${Math.max(pct, 4)}%` }]}
        />
      </View>

      {/* Step checklist */}
      <View style={s.steps}>
        {STEPS.map(st => {
          const ok = d.done.includes(st);
          return (
            <View key={st} style={[s.step, ok ? s.stepOk : s.stepTodo]}>
              <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={ok ? D.green : D.muted} />
              <Text style={[s.stepTxt, ok && { color: D.white }]}>{st}</Text>
            </View>
          );
        })}
      </View>

      <View style={s.divider} />

      {/* Footer */}
      <View style={s.footer}>
        <View style={{ flex: 1 }}>
          <View style={s.savedRow}>
            <Ionicons name="time-outline" size={13} color={D.muted} />
            <Text style={s.savedTxt}>Saved {d.savedAgo}</Text>
          </View>
          {nextStep ? <Text style={s.nextTxt} numberOfLines={1}>Next: add {nextStep.toLowerCase()}</Text> : null}
        </View>
        <MiniGradBtn title={pct === 100 ? 'Review & Publish' : 'Continue'} onPress={onContinue} />
      </View>
    </GlowCard>
  );
}

export default function DraftsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('All');
  const [search, setSearch] = useState('');

  // DB se apne drafts (status=draft) — dealer aur non-dealer dono
  const load = useCallback(async () => {
    if (!token) { setDrafts([]); setLoading(false); return; }
    try {
      // 1) Vehicle drafts  2) Generic ad drafts (video ad / special offer) — dono mila do
      const [vehRes, gen] = await Promise.all([
        fetch(`${API_BASE}/vehicles/my?status=draft&limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchMyDrafts(token),
      ]);
      const vehicleDrafts = vehRes.ok ? ((await vehRes.json()).items || []).map(mapToDraft) : [];
      const adDrafts = (gen || []).map(mapGenericToDraft);
      setDrafts([...vehicleDrafts, ...adDrafts]);
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, [token]);

  // Screen pe aate hi (aur draft save/publish ke baad wapas aane pe) fresh karo
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isVehicle = (d: Draft) => !d.kind || d.kind === 'vehicle';

  const counts = useMemo(() => ({
    All: drafts.length,
    Cars: drafts.filter(d => isVehicle(d) && d.type === 'car').length,
    Bikes: drafts.filter(d => isVehicle(d) && d.type === 'bike').length,
  }), [drafts]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drafts.filter(d =>
      // Cars/Bikes tabs sirf vehicle drafts; ad drafts sirf "All" me
      (tab === 'All' || (isVehicle(d) && (tab === 'Cars' ? d.type === 'car' : d.type === 'bike'))) &&
      (!q || d.title.toLowerCase().includes(q) || (d.city || '').toLowerCase().includes(q)),
    );
  }, [drafts, tab, search]);

  // Vehicle → add-vehicle; ad draft → uski apni editor screen (draft.data.route)
  const openEditor = (id?: string) =>
    router.push({ pathname: '/dealer-panel/add-vehicle', params: id ? { draftId: id } : {} } as any);

  const continueDraft = (d: Draft) => {
    if (isVehicle(d)) { openEditor(d.id); return; }
    const route = d.route
      || (d.kind === 'special_offer' ? '/dealer-panel/special-offer'
        : d.kind === 'tracker' ? '/(tracker)/new-tracker'
        : '/dealer-panel/video-ads');
    router.push({ pathname: route, params: { draftId: d.id } } as any);
  };

  // Delete confirm modal — `target` stays set while the close animation runs
  const [target, setTarget] = useState<Draft | null>(null);
  const [delOpen, setDelOpen] = useState(false);

  function confirmDelete(d: Draft) {
    setTarget(d);
    setDelOpen(true);
  }

  async function doDelete() {
    if (target) {
      if (isVehicle(target)) {
        try { await fetch(`${API_BASE}/vehicles/${target.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); } catch { /* offline */ }
      } else if (token) {
        await deleteDraft(token, target.id);
      }
      setDrafts(prev => prev.filter(x => x.id !== target.id));
    }
    setDelOpen(false);
  }

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <DHeader
          title="Drafts"
          center
          right={
            <TouchableOpacity onPress={() => openEditor()} style={s.newBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="add-circle-outline" size={24} color={D.orange} />
            </TouchableOpacity>
          }
        />

        <View style={s.searchRow}>
          <SearchBar placeholder="Search drafts" value={search} onChangeText={setSearch} savedSearch />
        </View>

        {/* Menu — always one line (scrolls sideways on narrow screens) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
          <FilterPills
            items={TABS}
            value={tab}
            onChange={setTab}
            labels={{ All: `All (${counts.All})`, Cars: `Cars (${counts.Cars})`, Bikes: `Bikes (${counts.Bikes})` }}
            style={{ flexWrap: 'nowrap', gap: 10 }}
          />
        </ScrollView>
      </SafeAreaView>

      <FlatList
        data={list}
        keyExtractor={d => d.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          drafts.length > 0 ? (
            <TipBanner
              title="Finish your drafts"
              text="Drafts stay saved until you publish or delete them. Complete all steps to publish."
              style={{ marginBottom: 16 }}
            />
          ) : null
        }
        renderItem={({ item }) => (
          isVehicle(item)
            ? <DraftCard d={item} onContinue={() => continueDraft(item)} onDelete={() => confirmDelete(item)} />
            : <AdDraftCard d={item} onContinue={() => continueDraft(item)} onDelete={() => confirmDelete(item)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={
          loading ? (
            <View style={s.empty}>
              <ActivityIndicator color={D.orange} />
            </View>
          ) : (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="document-text-outline" size={38} color={D.orange} />
            </View>
            <Text style={s.emptyTitle}>{drafts.length === 0 ? 'No drafts yet' : 'No matching drafts'}</Text>
            <Text style={s.emptySub}>
              {drafts.length === 0
                ? 'Tap "Save Draft" while adding a vehicle and it will show up here.'
                : 'Try a different search or filter.'}
            </Text>
            {drafts.length === 0 && (
              <TouchableOpacity activeOpacity={0.85} onPress={() => openEditor()} style={s.emptyBtnWrap}>
                <LinearGradient colors={['#032a69', D.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.emptyBtn}>
                  <Text style={s.emptyBtnTxt}>Add Vehicle</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
          )
        }
      />

      <DeleteDraftModal visible={delOpen} draft={target} onCancel={() => setDelOpen(false)} onConfirm={doDelete} />
    </View>
  );
}

// ── Premium delete confirmation (replaces the plain system alert) ──
function DeleteDraftModal({
  visible, draft, onCancel, onConfirm,
}: { visible: boolean; draft: Draft | null; onCancel: () => void; onConfirm: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      fade.setValue(0); scale.setValue(0.9);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
      ]).start();
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    }
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.94, duration: 160, useNativeDriver: true }),
    ]).start(() => setMounted(false));
  }, [visible]);

  if (!mounted || !draft) return null;

  const pct = Math.round((draft.done.length / STEPS.length) * 100);
  const meta = [draft.city, draft.year].filter(Boolean).join('  •  ');

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onCancel}>
      <Animated.View style={[m.overlay, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />

        <Animated.View style={[m.cardWrap, { transform: [{ scale }] }]}>
          {/* Gradient border: red glow on top → navy at the bottom */}
          <LinearGradient
            colors={['rgba(255,90,90,0.75)', 'rgba(130,165,213,0.55)', 'rgba(29,58,128,0.6)']}
            locations={[0, 0.45, 1]}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={m.border}
          >
            <View style={m.card}>
              {/* Inset glow layers */}
              <LinearGradient colors={['rgba(224,54,58,0.16)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.45 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.22)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(22,64,136,0.3)', 'transparent', 'transparent', 'rgba(22,64,136,0.3)']} locations={[0, 0.08, 0.92, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

              {/* Close */}
              <TouchableOpacity style={m.close} onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={20} color={D.muted} />
              </TouchableOpacity>

              {/* Icon with pulsing halo */}
              <View style={m.iconArea}>
                <Animated.View style={[m.halo, { transform: [{ scale: pulse }] }]} />
                <LinearGradient colors={['#4A1620', '#2A0E18']} style={m.iconCircle}>
                  <View style={m.iconRing}>
                    <Ionicons name="trash" size={28} color="#FF5A5F" />
                  </View>
                </LinearGradient>
              </View>

              <Text style={m.title}>Delete this draft?</Text>
              <Text style={m.sub}>
                This draft and everything you've added to it will be removed permanently.
              </Text>

              {/* Draft preview */}
              <View style={m.preview}>
                <View style={m.previewThumb}>
                  <Ionicons name={draft.type === 'bike' ? 'bicycle-outline' : 'car-outline'} size={22} color={D.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={m.previewTitle} numberOfLines={1}>{draft.title || 'Untitled vehicle'}</Text>
                  <Text style={m.previewMeta} numberOfLines={1}>{meta || 'Details not added yet'}</Text>
                  <View style={m.previewTrack}>
                    <LinearGradient colors={['#1D3A7A', '#6E4A52', D.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[m.previewFill, { width: `${Math.max(pct, 4)}%` }]} />
                  </View>
                </View>
                <Text style={m.previewPct}>{pct}%</Text>
              </View>

              {/* Warning strip */}
              <View style={m.warn}>
                <Ionicons name="alert-circle" size={16} color="#FFB020" />
                <Text style={m.warnTxt}>This action can't be undone.</Text>
              </View>

              {/* Buttons */}
              <View style={m.btnRow}>
                <TouchableOpacity activeOpacity={0.85} onPress={onCancel} style={m.keepBtn}>
                  <LinearGradient colors={['#163565', '#061124', '#061124', '#0D2146']} locations={[0, 0.24, 0.76, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <Text style={m.keepTxt}>Keep Draft</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.85} onPress={onConfirm} style={m.delWrap}>
                  <LinearGradient colors={['#7A1C2A', '#C8323A', '#FF5A5F']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={m.delBtn}>
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                    <Text style={m.delTxt}>Delete</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(1,6,20,0.78)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  cardWrap: { width: '100%', maxWidth: 400, shadowColor: '#FF5A5F', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 16 },
  border:   { borderRadius: 26, padding: 1.2 },
  card:     { borderRadius: 25, overflow: 'hidden', backgroundColor: '#030C26', paddingHorizontal: 22, paddingTop: 30, paddingBottom: 22, alignItems: 'center' },
  close:    { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(11,35,88,0.7)', borderWidth: 1, borderColor: 'rgba(130,165,213,0.3)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },

  iconArea:   { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  halo:       { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,90,95,0.12)', borderWidth: 1, borderColor: 'rgba(255,90,95,0.25)' },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,90,95,0.55)' },
  iconRing:   { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,90,95,0.1)' },

  title: { color: D.white, fontSize: 20, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  sub:   { color: D.muted, fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20, marginTop: 6, paddingHorizontal: 4 },

  preview:      { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', marginTop: 18, padding: 12, borderRadius: 16, backgroundColor: 'rgba(11,35,88,0.45)', borderWidth: 1, borderColor: 'rgba(130,165,213,0.3)' },
  previewThumb: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#0B1D4A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(130,165,213,0.25)' },
  previewTitle: { color: D.white, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  previewMeta:  { color: D.muted, fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  previewTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(130,165,213,0.18)', marginTop: 7, overflow: 'hidden' },
  previewFill:  { height: '100%', borderRadius: 2 },
  previewPct:   { color: D.orange, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  warn:    { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'stretch', marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,176,32,0.08)', borderWidth: 1, borderColor: 'rgba(255,176,32,0.25)' },
  warnTxt: { color: '#F5C46B', fontSize: 12, fontFamily: 'Poppins_500Medium' },

  btnRow:  { flexDirection: 'row', gap: 12, alignSelf: 'stretch', marginTop: 20 },
  keepBtn: { flex: 1, height: 50, borderRadius: 25, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#829fd0' },
  keepTxt: { color: D.white, fontSize: 15, fontFamily: 'Poppins_500Medium' },
  delWrap: { flex: 1, borderRadius: 25, overflow: 'hidden' },
  delBtn:  { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  delTxt:  { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: D.bg },
  newBtn:    { width: 34, alignItems: 'flex-end' },
  searchRow: { paddingHorizontal: 20, marginTop: 4 },
  tabsRow:   { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  list:      { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40, flexGrow: 1 },

  card:      { padding: 14 },
  topRow:    { flexDirection: 'row', gap: 14 },
  thumb:     { width: 96, height: 92, borderRadius: 12, backgroundColor: '#0B1D4A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(130,165,213,0.25)', borderStyle: 'dashed' },
  photoTag:  { position: 'absolute', bottom: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(1,10,31,0.75)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  photoTagTxt: { color: '#fff', fontSize: 10, fontFamily: 'Poppins_500Medium' },
  titleRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  draftPill: { paddingHorizontal: 10, paddingVertical: 2 },
  title:     { color: D.white, fontSize: 15, fontFamily: 'Poppins_500Medium', marginTop: 6 },
  meta:      { color: D.muted, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  price:     { color: D.orange, fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginTop: 4 },

  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  progressLbl:  { color: D.white, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  progressStep: { color: D.muted, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  track:     { height: 6, borderRadius: 3, backgroundColor: 'rgba(130,165,213,0.18)', marginTop: 6, overflow: 'hidden' },
  fill:      { height: '100%', borderRadius: 3 },

  steps:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  step:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  stepOk:    { backgroundColor: 'rgba(46,204,113,0.08)', borderColor: 'rgba(46,204,113,0.35)' },
  stepTodo:  { backgroundColor: D.navy, borderColor: 'rgba(130,165,213,0.3)' },
  stepTxt:   { color: D.muted, fontSize: 10.5, fontFamily: 'Poppins_500Medium' },

  divider:   { height: 1, backgroundColor: D.line, marginTop: 14 },
  footer:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  savedRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  savedTxt:  { color: D.muted, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  nextTxt:   { color: D.text, fontSize: 11, fontFamily: 'Poppins_500Medium', marginTop: 2 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24, gap: 8 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: D.navy, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { color: D.white, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  emptySub:   { color: D.muted, fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20 },
  emptyBtnWrap: { borderRadius: 24, overflow: 'hidden', marginTop: 12 },
  emptyBtn:   { paddingHorizontal: 32, paddingVertical: 13 },
  emptyBtnTxt:{ color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});
