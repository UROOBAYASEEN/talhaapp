import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors, useAppColors } from '@/constants/theme';

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

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140, backgroundColor: aC.bg }} style={{ backgroundColor: aC.bg }}>
        {/* Topbar */}
        <View style={[s.topbar, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }]}>
            <Ionicons name="chevron-back" size={22} color={aC.isDark ? "#fff" : "#010a1f"} />
          </TouchableOpacity>
          <Text style={[s.topTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Applications Details</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Status bar */}
        <LinearGradient colors={aC.isDark ? ['#2f6fed', '#6a3fd9'] : ['#e0e7ff', '#c7d2fe']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.statusBar, { borderColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.12)' }]}>
          <View style={s.statusLeft}>
            <Ionicons name="briefcase-outline" size={14} color={aC.isDark ? "#fff" : "#032a69"} />
            <Text style={[s.statusTxt, { color: aC.isDark ? '#fff' : '#032a69' }]}>{statusUpper === 'SUBMITTED' ? 'PENDING REVIEW' : statusUpper}</Text>
          </View>
          <Text style={[s.appliedTxt, { color: aC.isDark ? 'rgba(255,255,255,0.85)' : '#475569' }]}>Applied: {appliedDate}</Text>
        </LinearGradient>

        {/* Applicant card */}
        <View style={[s.applicantCard, { backgroundColor: aC.isDark ? '#182448' : '#ffffff', borderColor: aC.isDark ? 'rgba(232,121,43,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
          {aC.isDark ? (
            <LinearGradient colors={['#182448', '#2a2244', '#3a2a20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            </>
          )}
          <View style={s.applicantTop}>
            <View style={s.avatarWrap}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={s.avatar} /> : <View style={[s.avatar, { backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 20 }}>{String(app.customer || app.name || 'H')[0].toUpperCase()}</Text></View>}
              <View style={s.avatarBadge}><Ionicons name="checkmark" size={10} color="#fff" /></View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.applicantName, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{app.customer || app.name || 'Hamza'}</Text>
              <View style={s.rowGap}><Ionicons name="call-outline" size={13} color={aC.isDark ? DIM : '#64748b'} /><Text style={[s.applicantSub, { color: aC.isDark ? DIM : '#475569' }]}>{app.phone || '0300 1234567'}</Text></View>
              <View style={s.rowGap}><Ionicons name="mail-outline" size={13} color={aC.isDark ? DIM : '#64748b'} /><Text style={[s.applicantSub, { color: aC.isDark ? DIM : '#475569' }]} numberOfLines={1}>{app.email || 'hamza@example.pk'}</Text></View>
            </View>
          </View>
          <Text style={s.chassisLabel}>Chassis #</Text>
          <TouchableOpacity style={s.chassisRow} onPress={copyChassis} activeOpacity={0.7}>
            <Text style={[s.chassisVal, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{chassis}</Text>
            <Ionicons name="copy-outline" size={16} color={aC.isDark ? DIM : '#64748b'} />
          </TouchableOpacity>
        </View>

        {/* Vehicle Information */}
        <View style={[s.sectionCard, { backgroundColor: aC.isDark ? '#131a2e' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
          <Text style={[s.secTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Vehicle Information</Text>
          <View style={[s.infoRow, { borderBottomColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]}><Text style={[s.infoLabel, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Make / Model</Text><Text style={[s.infoVal, { color: aC.isDark ? DIM : '#475569' }]}>{vehicleName}</Text></View>
          <View style={[s.infoRow, { borderBottomColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]}><Text style={[s.infoLabel, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Registration #</Text><Text style={[s.infoVal, { color: aC.isDark ? DIM : '#475569' }]}>{app.registration_number || 'LEA-21-1334'}</Text></View>
          <View style={[s.infoRow, { borderBottomColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]}><Text style={[s.infoLabel, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Engine #</Text><Text style={[s.infoVal, { color: aC.isDark ? DIM : '#475569' }]}>{app.engine_number || 'ABC123456789'}</Text></View>
          <View style={[s.infoRow, { borderBottomColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]}><Text style={[s.infoLabel, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Chassis #</Text><Text style={[s.infoVal, { color: aC.isDark ? DIM : '#475569' }]}>{chassis}</Text></View>
          <View style={[s.infoRow, { borderBottomColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]}><Text style={[s.infoLabel, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Color</Text><Text style={[s.infoVal, { color: aC.isDark ? DIM : '#475569' }]}>{app.color || 'Super White'}</Text></View>
          <View style={[s.infoRow, { borderBottomWidth: 0 }]}><Text style={[s.infoLabel, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Mileage</Text><Text style={[s.infoVal, { color: aC.isDark ? DIM : '#475569' }]}>{app.mileage ? `${Number(app.mileage).toLocaleString()} km` : '24,500 km'}</Text></View>
        </View>

        {/* Coverage */}
        <View style={[s.sectionCard, { backgroundColor: aC.isDark ? '#131a2e' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
          <View style={s.coverageRow}><Text style={[s.coverageLabel, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Coverage Limit</Text><Text style={[s.coverageVal, { color: aC.isDark ? '#fff' : '#010a1f' }]}>PKR {Number(estimated).toLocaleString()}</Text></View>
          <Text style={[s.addonsLabel, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Selected Add-Ons</Text>
          <View style={s.addons}>
            <View style={[s.addonChip, { backgroundColor: aC.isDark ? 'rgba(232,121,43,0.15)' : '#fff7ed', borderColor: ORANGE }]}><Ionicons name="location-outline" size={12} color={ORANGE} /><Text style={s.addonTxt}>TRACKER</Text></View>
            <View style={[s.addonChip, { backgroundColor: aC.isDark ? 'rgba(232,121,43,0.15)' : '#fff7ed', borderColor: ORANGE }]}><Ionicons name="briefcase-outline" size={12} color={ORANGE} /><Text style={s.addonTxt}>ROADSIDE</Text></View>
          </View>
        </View>

        {/* Premium Summary — bg #010A1F + orange shade */}
        <View style={[s.premiumCard, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(232,121,43,0.4)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
          {aC.isDark ? (
            <>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.28)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(22,64,136,0.12)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            </>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            </>
          )}
          <View style={s.premiumHeader}>
            <Text style={[s.premiumTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Premium Summary</Text>
            <View style={s.pendingPill}><Text style={s.pendingTxt}>{isPending ? 'Pending' : String(app.status).charAt(0).toUpperCase() + String(app.status).slice(1)}</Text></View>
          </View>
          <View style={s.premiumRow}><Text style={[s.premiumLabel, { color: aC.isDark ? DIM : '#475569' }]}>Base Premium</Text><Text style={[s.premiumVal, { color: aC.isDark ? DIM : '#475569' }]}>PKR {Number(basePremium).toLocaleString()}</Text></View>
          <View style={s.premiumRow}><Text style={[s.premiumLabel, { color: aC.isDark ? DIM : '#475569' }]}>Govt. Taxes (FSL)</Text><Text style={[s.premiumVal, { color: aC.isDark ? DIM : '#475569' }]}>PKR {Number(taxes).toLocaleString()}</Text></View>
          <View style={[s.premiumTotal, { borderTopColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]}><Text style={[s.premiumTotalLabel, { color: aC.isDark ? DIM : '#475569' }]}>Total Annual Premium</Text><Text style={[s.premiumTotalVal, { color: aC.isDark ? '#fff' : '#010a1f' }]}>PKR {Number(total).toLocaleString()}</Text></View>
          <View style={[s.paymentBox, { backgroundColor: aC.isDark ? 'rgba(47,111,237,0.12)' : '#f8fafc' }]}>
            <View style={s.paymentIcon}><Ionicons name="card-outline" size={16} color="#fff" /></View>
            <View>
              <Text style={[s.pLabel, { color: aC.isDark ? DIM : '#475569' }]}>Payment Method</Text>
              <Text style={[s.pVal, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Visa Credit Card •••• 4567</Text>
            </View>
          </View>
        </View>

        {/* Document Gallery — real docs, click to preview */}
        <View style={s.docGallery}>
          <View style={s.docHeader}><Text style={[s.docTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Document Gallery</Text><TouchableOpacity onPress={() => setDocsModal(true)}><Text style={s.viewAll}>View All</Text></TouchableOpacity></View>
          <View style={s.docGrid}>
            {(docs.length ? docs.slice(0, 3) : [
              { file_url: 'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=200&h=140&fit=crop', doc_type: 'CNIC FRONT' },
              { file_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=140&fit=crop', doc_type: 'REG. BOOK' },
              { file_url: 'https://images.unsplash.com/photo-1605559911160-a3d95d213904?w=200&h=140&fit=crop', doc_type: 'VEHICLE IMG 1' },
            ]).map((d: any, i: number) => (
              <TouchableOpacity key={i} style={s.docItem} activeOpacity={0.85} onPress={() => setPreviewUri(resolveUrl(d.file_url) || d.file_url)}>
                <Image source={{ uri: resolveUrl(d.file_url) || d.file_url }} style={[s.docImg, { borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]} resizeMode="cover" />
                <Text style={[s.docLabel, { color: aC.isDark ? DIM : '#475569' }]}>{String(d.doc_type || d.type || `DOC ${i + 1}`).toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Timeline */}
        <View style={s.timeline}>
          <Text style={[s.timelineTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Application Timeline</Text>
          <View style={s.tlItem}>
            <View style={s.tlLine} />
            <View style={s.tlDot}><Ionicons name="checkmark" size={14} color="#fff" /></View>
            <View>
              <Text style={[s.tlH, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Application Submitted</Text>
              <Text style={[s.tlP, { color: aC.isDark ? DIM : '#475569' }]}>{appliedDate}, 09:45 AM • by {app.customer || 'Usama'}</Text>
            </View>
          </View>
          <View style={s.tlItem}>
            <View style={s.tlLine} />
            <View style={s.tlDot}><Ionicons name="checkmark" size={14} color="#fff" /></View>
            <View>
              <Text style={[s.tlH, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Documents Verified</Text>
              <Text style={[s.tlP, { color: aC.isDark ? DIM : '#475569' }]}>{appliedDate}, 11:20 AM • by System Auto-check</Text>
            </View>
          </View>
          <View style={s.tlItem}>
            <View style={s.tlDot}><Ionicons name="time-outline" size={14} color="#fff" /></View>
            <View>
              <Text style={[s.tlH, { color: ORANGE }]}>Awaiting Admin Approval</Text>
              <Text style={[s.tlP, { color: aC.isDark ? DIM : '#475569' }]}>Assigned to: Usman Khan (Senior Manager)</Text>
            </View>
          </View>
        </View>

        <View style={s.termsRow}>
          <View style={[s.radio, { borderColor: aC.isDark ? DIM : '#94a3b8' }]} />
          <Text style={[s.termsTxt, { color: aC.isDark ? DIM : '#475569' }]}>I confirm that I have read and accept the terms and conditions and privacy policy.</Text>
        </View>
      </ScrollView>

      {/* Footer Fixed - Approve/Reject/Document */}
      <View style={[s.footerFixed, { backgroundColor: aC.isDark ? '#0f1830' : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)', shadowColor: aC.isDark ? '#000' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0.35 : 0.08 }]}>
        <TouchableOpacity style={s.approveBtn} activeOpacity={0.88} onPress={() => handleAction('approved')} disabled={!!actionLoading}>
          <LinearGradient colors={[AppColors.gradientStart, AppColors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          {actionLoading === 'approved' ? <ActivityIndicator color="#fff" /> : <Text style={s.approveTxt}>Approve Policy</Text>}
        </TouchableOpacity>
        <View style={s.actionRow}>
          <TouchableOpacity style={s.rejectBtn} activeOpacity={0.85} onPress={() => handleAction('rejected')} disabled={!!actionLoading}>
            {actionLoading === 'rejected' ? <ActivityIndicator color="#ef4444" size="small" /> : <Text style={s.rejectTxt}>Reject</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.documentBtn, { backgroundColor: aC.isDark ? '#1c2440' : '#f8fafc', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]}
            activeOpacity={0.85}
            onPress={() => {
              if (app.claim_id) router.push({ pathname: '/insurance/documents' as any, params: { claimId: app.claim_id } });
              else Alert.alert('Documents', docs.length ? `${docs.length} documents uploaded` : 'No documents');
            }}
          >
            <Text style={[s.documentTxt, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Document</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 18, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: ORANGE, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusTxt: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_700Bold', letterSpacing: 0.3 },
  appliedTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: 'Poppins_500Medium' },
  applicantCard: { marginHorizontal: 20, marginBottom: 18, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(232,121,43,0.5)', overflow: 'hidden' },
  applicantTop: { flexDirection: 'row', gap: 14 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: ORANGE },
  avatarBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#131a2e' },
  applicantName: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_700Bold' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  applicantSub: { color: DIM, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  chassisLabel: { marginTop: 16, color: ORANGE, fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 0.4, textTransform: 'uppercase' },
  chassisRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  chassisVal: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  sectionCard: { marginHorizontal: 20, marginBottom: 18, borderRadius: 16, padding: 18, backgroundColor: '#131a2e', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  secTitle: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  infoLabel: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  infoVal: { color: DIM, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  footerFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: '#0f1830',
    borderTopWidth: 1,
    borderColor: BORDER,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  approveBtn: { height: 48, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  approveTxt: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  actionRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: { flex: 1, height: 44, borderRadius: 24, borderWidth: 1.5, borderColor: '#ef4444', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  rejectTxt: { color: '#ef4444', fontSize: 14, fontFamily: 'Poppins_700Bold' },
  documentBtn: { flex: 1, height: 44, borderRadius: 24, borderWidth: 1, borderColor: BORDER, backgroundColor: '#1c2440', alignItems: 'center', justifyContent: 'center' },
  documentTxt: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_700Bold' },
  coverageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  coverageLabel: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  coverageVal: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_700Bold' },
  addonsLabel: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_700Bold', marginTop: 10, marginBottom: 10 },
  addons: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  addonChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(232,121,43,0.15)', borderWidth: 1, borderColor: ORANGE },
  addonTxt: { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_700Bold' },
  premiumCard: { marginHorizontal: 20, marginBottom: 18, borderRadius: 16, padding: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(232,121,43,0.4)' },
  premiumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  premiumTitle: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  pendingPill: { backgroundColor: ORANGE, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  pendingTxt: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_700Bold' },
  premiumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  premiumLabel: { color: DIM, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  premiumVal: { color: DIM, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  premiumTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: BORDER, alignItems: 'center' },
  premiumTotalLabel: { color: DIM, fontSize: 11, fontFamily: 'Poppins_500Medium', letterSpacing: 0.3, textTransform: 'uppercase' },
  premiumTotalVal: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_800ExtraBold' },
  paymentBox: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(47,111,237,0.12)', borderRadius: 12, padding: 12 },
  paymentIcon: { width: 34, height: 26, borderRadius: 5, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  pLabel: { color: DIM, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  pVal: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_700Bold', marginTop: 2 },
  docGallery: { marginHorizontal: 20, marginBottom: 22 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  docTitle: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  viewAll: { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_700Bold' },
  docGrid: { flexDirection: 'row', gap: 10 },
  docItem: { flex: 1, alignItems: 'center' },
  docImg: { width: '100%', height: 78, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  docLabel: { color: DIM, fontSize: 9, fontFamily: 'Poppins_700Bold', marginTop: 6, letterSpacing: 0.3 },
  timeline: { marginHorizontal: 20, marginBottom: 24 },
  timelineTitle: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_700Bold', marginBottom: 18 },
  tlItem: { flexDirection: 'row', gap: 14, paddingBottom: 26, position: 'relative' },
  tlLine: { position: 'absolute', left: 15, top: 32, bottom: 0, width: 2, backgroundColor: ORANGE },
  tlDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  tlH: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_700Bold' },
  tlP: { color: DIM, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  termsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 10, alignItems: 'flex-start' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: DIM, marginTop: 1 },
  termsTxt: { color: DIM, fontSize: 12, fontFamily: 'Poppins_400Regular', flex: 1, lineHeight: 18 },
});
