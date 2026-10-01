import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors, useAppColors } from '@/constants/theme';
import { BottomActions, D, DHeader, TermsRow, WarmCard } from '@/components/dealer/DealerUI';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';
import { ApplicantCard, DocGallery, InfoTable, StatusBand, Timeline } from '@/components/insurance/AppDetailUI';

const BG = AppColors.bg;
const ORANGE = AppColors.gradientEnd;
const BLUE = '#2f6fed';
const BORDER = 'rgba(255,255,255,0.08)';
const DIM = '#8b93ab';
const SERVER = API_BASE.replace('/api/v1', '');
function resolveUrl(u?: string | null) {
  if (!u) return null;
  if (u.startsWith('http')) return u.replace(/http:\/\/[\d.]+:\d+/, SERVER);
  return `${SERVER}${u}`;
}

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const aC = useAppColors();
  const [app, setApp] = useState<any>(null);
  const [claim, setClaim] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [docsModal, setDocsModal] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);

  useEffect(() => {
    if (!id || !token) return;
    (async () => {
      try {
        // Try provider applications list and find by id
        const res = await fetch(`${API_BASE}/insurance/provider/applications`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const list: any[] = await res.json();
          const found = list.find((x: any) => String(x.id) === String(id) || String(x.policy_id) === String(id));
          if (found) {
            setApp(found);
            // try fetch claim details if claim_id available via provider/claims
            const cRes = await fetch(`${API_BASE}/insurance/provider/claims`, { headers: { Authorization: `Bearer ${token}` } });
            if (cRes.ok) {
              const cList: any[] = await cRes.json();
              const cFound = cList.find((c: any) => String(c.id) === String(found.id) || String(c.claim_id) === String(found.claim_id));
              if (cFound) {
                setClaim({ brand: cFound.vehicle?.split(' ')[0] || '—', model: cFound.vehicle?.split(' ')[1] || '—', vehicle: cFound.vehicle, estimated_value: cFound.estimated_value, photos: cFound.photos });
              }
            }
            // plan info already in found
            setPlan({ company_name: found.plan_name, annual_premium: found.premium });
          }
        }
        // fallback: fetch claim directly if app found has claim_id
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id, token]);

  // Fetch REAL user-uploaded documents (both InsuranceDocument and generic UserDocument)
  useEffect(() => {
    if (!app || !token) return;
    (async () => {
      try {
        const all: any[] = [];
        const claimId = app.claim_id;
        // 1) Insurance claim-specific docs (if any)
        if (claimId) {
          try {
            const r1 = await fetch(`${API_BASE}/insurance/documents/${claimId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (r1.ok) {
              const d1 = await r1.json();
              if (Array.isArray(d1)) all.push(...d1.map((x: any) => ({ file_url: x.file_url, doc_type: x.doc_type || x.type || 'DOC', type: x.doc_type || x.type })));
            }
          } catch {}
        }
        // 2) Generic user docs — REAL documents user gave (CNIC, RC, License, Vehicle Photos) via /documents/user/{user_id}
        if (app.user_id) {
          try {
            const r2 = await fetch(`${API_BASE}/documents/user/${app.user_id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (r2.ok) {
              const d2 = await r2.json();
              if (Array.isArray(d2)) all.push(...d2.map((x: any) => ({ file_url: x.file_url, doc_type: x.type || x.doc_type || 'DOC', type: x.type })));
            }
          } catch {}
        }
        // Dedupe by file_url
        const seen = new Set<string>();
        const uniq = all.filter((d) => {
          const url = d.file_url;
          if (!url || seen.has(url)) return false;
          seen.add(url);
          return true;
        });
        if (uniq.length) setDocs(uniq);
      } catch {}
    })();
  }, [app, token]);

  async function handleAction(status: 'approved' | 'rejected') {
    if (!app || !token) return;
    setActionLoading(status);
    try {
      const res = await fetch(`${API_BASE}/insurance/provider/claims/${app.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || 'Failed');
      }
      Alert.alert(status === 'approved' ? 'Approved' : 'Rejected', `Policy ${status} successfully`);
      setApp((p: any) => ({ ...p, status }));
      setTimeout(() => router.back(), 600);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  function copyChassis() {
    const chassis = app?.id ? `AWZ-2026-${String(app.id).slice(-6).toUpperCase()}` : 'AWZ-2026-000145';
    Alert.alert('Copied', chassis);
  }

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]}>
        <ActivityIndicator color={ORANGE} style={{ marginTop: 80 }} size="large" />
      </SafeAreaView>
    );
  }
  if (!app) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: aC.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={aC.isDark ? DIM : '#94a3b8'} />
        <Text style={{ color: aC.isDark ? '#fff' : '#010a1f', fontFamily: 'Poppins_600SemiBold' }}>Application not found</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: ORANGE }}>Go Back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusUpper = String(app.status || 'pending').toUpperCase();
  const isPending = ['submitted', 'pending', 'reviewing'].includes(String(app.status).toLowerCase());
  const appliedDate = app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '10 May 2024';
  const avatarUrl = resolveUrl(app.customer_avatar || app.avatar_url);
  const chassis = app.id ? `AWZ-2026-${String(app.id).slice(-6).toUpperCase()}` : 'AWZ-2026-000145';
  const vehicleName = app.vehicle || 'Toyota Corolla 2022';
  const estimated = app.estimated_value || 4500000;
  const basePremium = app.premium || 38000;
  const taxes = Math.round(basePremium * 0.118);
  const total = basePremium + taxes;

  const galleryDocs = (docs.length ? docs.slice(0, 6) : [
    { file_url: 'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=200&h=140&fit=crop', doc_type: 'CNIC FRONT' },
    { file_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=140&fit=crop', doc_type: 'REG. BOOK' },
    { file_url: 'https://images.unsplash.com/photo-1605559911160-a3d95d213904?w=200&h=140&fit=crop', doc_type: 'VEHICLE IMG 1' },
  ]).map((d: any, i: number) => ({ uri: resolveUrl(d.file_url) || d.file_url, label: String(d.doc_type || d.type || `DOC ${i + 1}`).toUpperCase() }));

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: D.bg }]} edges={['top', 'bottom']}>
      <DHeader title="Applications Details" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 200 }}>
        <StatusBand label={statusUpper === 'SUBMITTED' ? 'PENDING REVIEW' : statusUpper} date={appliedDate} />

        <ApplicantCard
          name={app.customer || app.name || 'Hamza'}
          phone={app.phone || '0300 1234567'}
          email={app.email || 'hamza@example.pk'}
          avatar={avatarUrl}
          chassis={chassis}
          onCopy={copyChassis}
        />

        <InfoTable
          title="Vehicle Information"
          rows={[
            { label: 'Make / Model',   value: vehicleName },
            { label: 'Registration #', value: app.registration_number || 'LEA-21-1334' },
            { label: 'Engine #',       value: app.engine_number || 'ABC123456789' },
            { label: 'Chassis #',      value: chassis },
            { label: 'Color',          value: app.color || 'Super White' },
            { label: 'Mileage',        value: app.mileage ? `${Number(app.mileage).toLocaleString()} km` : '24,500 km' },
          ]}
        />

        <InfoTable rows={[{ label: 'Coverage Limit', value: <Text style={s.coverageVal}>PKR {Number(estimated).toLocaleString()}</Text> }]}>
          <Text style={s.addonsLabel}>Selected Add-Ons</Text>
          <View style={s.addons}>
            <View style={s.addonChip}><Ionicons name="location-outline" size={13} color={ORANGE} /><Text style={s.addonTxt}>TRACKER</Text></View>
            <View style={s.addonChip}><Ionicons name="briefcase-outline" size={13} color={ORANGE} /><Text style={s.addonTxt}>ROADSIDE</Text></View>
          </View>
        </InfoTable>

        {/* Premium Summary — warm card (brown top → navy bottom) */}
        <WarmCard style={s.premiumCard} colors={['#4A2E28', '#2A2238', '#101C45', '#0A1A45']} locations={[0, 0.35, 0.75, 1]}>
          <View style={s.premiumHeader}>
            <Text style={s.premiumTitle}>Premium Summary</Text>
            <View style={s.pendingPill}><Text style={s.pendingTxt}>{isPending ? 'Pending' : String(app.status).charAt(0).toUpperCase() + String(app.status).slice(1)}</Text></View>
          </View>
          <View style={s.premiumRow}><Text style={s.premiumLabel}>Base Premium</Text><Text style={s.premiumVal}>PKR {Number(basePremium).toLocaleString()}</Text></View>
          <View style={s.premiumRow}><Text style={s.premiumLabel}>Govt. Taxes (FSL)</Text><Text style={s.premiumVal}>PKR {Number(taxes).toLocaleString()}</Text></View>
          <View style={s.premiumTotal}><Text style={s.premiumTotalLabel}>Total Annual Premium</Text><Text style={s.premiumTotalVal}>PKR {Number(total).toLocaleString()}</Text></View>
          <View style={s.paymentBox}>
            <Ionicons name="card-outline" size={26} color={ORANGE} />
            <View>
              <Text style={s.pLabel}>Payment Method</Text>
              <Text style={s.pVal}>Visa Credit Card (•••• 4567)</Text>
            </View>
          </View>
        </WarmCard>

        <DocGallery docs={galleryDocs} onViewAll={() => setDocsModal(true)} onOpen={uri => setPreviewUri(uri)} />

        <View style={{ marginHorizontal: 22 }}>
          <Timeline steps={[
            { title: 'Application Submitted', sub: `${appliedDate}, 09:45 AM • by ${app.customer || 'Usama'}` },
            { title: 'Documents Verified',    sub: `${appliedDate}, 11:20 AM • by System Auto-check` },
            { title: 'Awaiting Admin Approval', sub: 'Assigned to: Usman Khan (Senior Manager)', current: true },
          ]} />
          <TermsRow checked={agreedTerms} onToggle={() => setAgreedTerms(v => !v)} />
        </View>
      </ScrollView>

      {/* Footer — Approve / Reject / Document */}
      <BottomActions>
        <GradientButton title="Approve Policy" height={50} fontSize={17} loading={actionLoading === 'approved'} disabled={!!actionLoading} onPress={() => handleAction('approved')} />
        <View style={s.actionRow}>
          <TouchableOpacity style={s.rejectBtn} activeOpacity={0.85} onPress={() => handleAction('rejected')} disabled={!!actionLoading}>
            {actionLoading === 'rejected' ? <ActivityIndicator color="#E0363A" size="small" /> : <Text style={s.rejectTxt}>Reject</Text>}
          </TouchableOpacity>
          <GlassButton
            title="Document"
            height={50}
            fontSize={16}
            color="#C9BDC4"
            radius={14}
            style={{ flex: 1 }}
            onPress={() => {
              if (app.claim_id) router.push({ pathname: '/insurance/documents' as any, params: { claimId: app.claim_id } });
              else Alert.alert('Documents', docs.length ? `${docs.length} documents uploaded` : 'No documents');
            }}
          />
        </View>
      </BottomActions>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  coverageVal: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  addonsLabel: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginTop: 6, marginBottom: 10 },
  addons:      { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 6 },
  addonChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: '#5A2E1E' },
  addonTxt:    { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },

  premiumCard:       { marginHorizontal: 16, marginTop: 20, padding: 22, borderRadius: 20 },
  premiumHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  premiumTitle:      { color: '#FFFFFF', fontSize: 22, fontFamily: 'Poppins_600SemiBold' },
  pendingPill:       { backgroundColor: ORANGE, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16 },
  pendingTxt:        { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  premiumRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  premiumLabel:      { color: '#E6E1E8', fontSize: 15, fontFamily: 'Poppins_400Regular' },
  premiumVal:        { color: '#E6E1E8', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  premiumTotal:      { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)', alignItems: 'center' },
  premiumTotalLabel: { color: D.muted, fontSize: 13, fontFamily: 'Poppins_500Medium', letterSpacing: 0.5, textTransform: 'uppercase' },
  premiumTotalVal:   { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_700Bold' },
  paymentBox:        { marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#0B2358', borderRadius: 12, padding: 14 },
  pLabel:            { color: D.muted, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  pVal:              { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginTop: 1 },

  actionRow: { flexDirection: 'row', gap: 16 },
  rejectBtn: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: '#E0363A', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050A18' },
  rejectTxt: { color: '#E0363A', fontSize: 16, fontFamily: 'Poppins_500Medium' },
});
