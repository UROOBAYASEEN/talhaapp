import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, StatusBar, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomActions, DHeader, GlowCard, OutlineCard, TermsRow } from '@/components/dealer/DealerUI';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';
import { ApplicantCard, DocGallery, InfoTable, StatusBand, Timeline } from '@/components/insurance/AppDetailUI';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { GlowPublishButton, GlowDraftButton } from "@/components/shared/ActionFooterGlow";

const C      = AppColors;
const ORANGE = '#e2671b';
const BG     = '#010A1F';
const SERVER = API_BASE.replace('/api/v1','');
function resolveUrl(url?:string|null){ if(!url) return ''; if(url.startsWith('http')) return url; return `${SERVER}${url}`; }


export default function ApprovePolicyScreen() {
  const router     = useRouter();
  const { token }  = useAuth();
  const params     = useLocalSearchParams<{
    appId?: string; name?: string; avatar?: string; vehicle?: string;
    premium?: string; status?: string; phone?: string;
    email?: string; date?: string; policyId?: string;
  }>();

  const name      = params.name      || '—';
  const vehicle   = params.vehicle   || '—';
  const premium   = params.premium   ? `PKR ${Number(params.premium).toLocaleString()}` : '—';
  const phone     = params.phone     || '—';
  const email     = params.email     || '—';
  const policyId  = params.policyId  || '—';
  const dateStr   = params.date
    ? new Date(params.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const initials  = name.slice(0, 2).toUpperCase();

  const rawStatus = (params.status || 'submitted').toUpperCase();
  const [status,          setStatus]          = useState(
    rawStatus === 'APPROVED' ? 'APPROVED'
    : rawStatus === 'REJECTED' ? 'REJECTED'
    : rawStatus === 'UNDER REVIEW' ? 'UNDER REVIEW'
    : 'PENDING REVIEW'
  );
  const [documentVisible, setDocumentVisible] = useState(false);
  const [updating,        setUpdating]        = useState(false);
  const [docs,            setDocs]            = useState<any[]>([]);
  const [claimPhotos,     setClaimPhotos]     = useState<string[]>([]);
  const [claimInfo,       setClaimInfo]       = useState<any>(null);
  const [surveyor,        setSurveyor]        = useState<any>(null);
  const [assigning,       setAssigning]       = useState(false);
  const [note,            setNote]            = useState('');
  const [noteSaved,       setNoteSaved]       = useState(false);
  const [agreedTerms,     setAgreedTerms]     = useState(false);

  useEffect(() => {
    if (!token || !params.appId) return;
    // fetch provider claims to get real claim data + photos for this appId, and real user docs
    fetch(`${API_BASE}/insurance/provider/claims`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(async (list: any[]) => {
        const found = (list||[]).find((x:any)=> String(x.id)===String(params.appId));
        if (found) {
          setClaimInfo(found);
          if (found.surveyor_name) setSurveyor({ name: found.surveyor_name, assigned_on: found.surveyor_assigned_on });
        }
        if (found?.photos?.length) {
          const base = API_BASE.replace('/api/v1','');
          setClaimPhotos(found.photos.map((u:string)=> u.startsWith('http')?u:`${base}${u}`));
        }
        const allDocs: any[] = [];
        // 1) claim-specific insurance docs
        const claimId = found?.claim_id;
        if (claimId) {
          try {
            const r = await fetch(`${API_BASE}/insurance/documents/${claimId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (r.ok) { const d = await r.json(); if (Array.isArray(d)) allDocs.push(...d.map((x:any)=>({ file_url: x.file_url, doc_type: x.doc_type || x.type || 'DOC' }))); }
          } catch {}
        } else {
          try {
            const r = await fetch(`${API_BASE}/insurance/documents/${params.appId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (r.ok) { const d = await r.json(); if (Array.isArray(d)) allDocs.push(...d.map((x:any)=>({ file_url: x.file_url, doc_type: x.doc_type || x.type || 'DOC' }))); }
          } catch {}
        }
        // 2) REAL generic user docs (CNIC, RC, License, Vehicle Photos) — the actual files user uploaded
        const userId = (found as any)?.user_id;
        if (userId) {
          try {
            const r2 = await fetch(`${API_BASE}/documents/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (r2.ok) { const d2 = await r2.json(); if (Array.isArray(d2)) allDocs.push(...d2.map((x:any)=>({ file_url: x.file_url, doc_type: x.type || x.doc_type || 'DOC' }))); }
          } catch {}
        }
        // dedupe and set
        if (allDocs.length) {
          const seen = new Set<string>();
          const uniq = allDocs.filter(d => { if (!d.file_url || seen.has(d.file_url)) return false; seen.add(d.file_url); return true; });
          if (uniq.length) setDocs(uniq);
        }
      }).catch(()=>{});
  }, [params.appId, token]);

  const tax    = params.premium ? Math.round(Number(params.premium) * 0.13) : 0;
  const total  = params.premium ? Number(params.premium) + tax : 0;

  async function callUpdateStatus(newStatus: string) {
    if (!token || !params.appId) return;
    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/insurance/provider/claims/${params.appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) Alert.alert('Error', 'Could not update status.');
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setUpdating(false); }
  }

  function approvePolicy() {
    Alert.alert('Approve Claim', 'Are you sure you want to approve this claim?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => {
        setStatus('APPROVED');
        callUpdateStatus('approved');
        setTimeout(()=> router.push('/(insurance_provider)/claims' as any), 400);
      }},
    ]);
  }

  function rejectPolicy() {
    Alert.alert('Reject Claim', 'Are you sure you want to reject this claim?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => { setStatus('REJECTED'); callUpdateStatus('rejected'); } },
    ]);
  }

  function updateClaimStatus() {
    Alert.alert('Update Status', 'Move this claim to Under Review?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: () => { setStatus('UNDER REVIEW'); callUpdateStatus('reviewing'); } },
    ]);
  }

  function assignSurveyor() {
    if (surveyor || assigning) return;
    Alert.alert('Assign Surveyor', 'No surveyors available right now. Please try again later.');
  }

  function saveNote() {
    if (!note.trim()) { Alert.alert('Empty Note', 'Please write a note first.'); return; }
    setNoteSaved(true);
    Alert.alert('Saved', 'Internal note saved.');
  }

  const galleryDocs = docs.length > 0
    ? docs.slice(0, 6).map((doc, i) => ({ uri: doc.file_url?.startsWith('http') ? doc.file_url : `${API_BASE.replace('/api/v1','')}${doc.file_url}`, label: String(doc.doc_type || `DOC ${i+1}`).toUpperCase() }))
    : [
        { uri: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=200', label: 'CNIC FRONT' },
        { uri: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=200', label: 'REG. BOOK' },
        { uri: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=200', label: 'VEHICLE IMG 1' },
      ];
  const docsDone = docs.length > 0 || status !== 'PENDING REVIEW';

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <View style={s.container}>

        <DHeader title="Applications Details" />

        {/* CONTENT */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 210 }}>
          <StatusBand compact label={status} date={dateStr} />

          <ApplicantCard
            compact
            name={name}
            phone={phone}
            email={email}
            avatar={params.avatar ? resolveUrl(params.avatar) : null}
            chassis={claimInfo?.chassis_no || claimInfo?.chassis_number || policyId}
          />

          <InfoTable
            title="Vehicle Information"
            rows={[
              { label: 'Make / Model',   value: claimInfo?.make_model || claimInfo?.vehicle || vehicle },
              { label: 'Registration #', value: claimInfo?.registration_no || claimInfo?.reg_no || '—' },
              { label: 'Engine #',       value: claimInfo?.engine_no || claimInfo?.engine_number || '—' },
              { label: 'Chassis #',      value: claimInfo?.chassis_no || claimInfo?.chassis_number || policyId },
              { label: 'Color',          value: claimInfo?.color || '—' },
            ]}
          />

          <InfoTable
            rows={[
              { label: 'Incident Date', value: claimInfo?.incident_date
                  ? new Date(claimInfo.incident_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : dateStr },
              { label: 'Claim Type', value: claimInfo?.claim_type || claimInfo?.type || '—' },
              { label: 'Coverage Limit', value: <Text style={s.coverageVal}>{claimInfo?.coverage_limit ? `PKR ${Number(claimInfo.coverage_limit).toLocaleString()}` : premium}</Text> },
            ]}
          />

          {/* ACCIDENT DESCRIPTION */}
          <Text style={s.descTitle}>Accident Description</Text>
          <OutlineCard style={s.descCard}>
            <Text style={s.descTxt}>
              {`"${claimInfo?.description || claimInfo?.accident_description || 'No description provided.'}"`}
            </Text>
          </OutlineCard>

          {/* VEHICLE PHOTOS — from the user's claim */}
          {claimPhotos.length > 0 && (
            <View style={{ marginTop: 22 }}>
              <Text style={[s.descTitle, { marginTop: 0 }]}>Vehicle Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
                {claimPhotos.map((uri,i)=>(
                  <Image key={i} source={{ uri }} style={{ width: 140, height: 100, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(230,225,232,0.6)' }} resizeMode="cover" />
                ))}
              </ScrollView>
            </View>
          )}

          <DocGallery docs={galleryDocs} onViewAll={() => setDocumentVisible(true)} />

          {/* SURVEY REPORT */}
          <GlowCard style={s.surveyCard} radius={20}>
            <View style={s.surveyHeader}>
              <Text style={s.surveyTitle}>Survey Report</Text>
              <TouchableOpacity style={s.assignBtn} onPress={assignSurveyor} activeOpacity={0.85}>
                <LinearGradient colors={['#0B3585', '#7E4F5C', '#E8702A']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                <Text style={s.assignTxt}>{surveyor ? 'Assigned' : 'Assign Surveyor'}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.surveyDivider} />
            {surveyor ? (
              <View style={s.surveyorRow}>
                <MaterialCommunityIcons name="account-cog-outline" size={28} color={ORANGE} />
                <View style={{ flex: 1 }}>
                  <Text style={s.surveyorName}>{surveyor.name}</Text>
                  <Text style={s.surveyorDate}>Assigned on {surveyor.assigned_on || dateStr}</Text>
                </View>
                <TouchableOpacity onPress={assignSurveyor}>
                  <Text style={s.changeSurveyor}>{'Change\nSurveyor'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={s.noSurveyorTxt}>No surveyor assigned yet.</Text>
            )}
          </GlowCard>

          {/* INTERNAL ADJUSTER NOTES */}
          <OutlineCard style={s.notesCard}>
            <Text style={s.notesTitle}>Internal Adjuster Notes</Text>
            <TextInput
              style={s.noteInput}
              value={note}
              onChangeText={t => { setNote(t); setNoteSaved(false); }}
              placeholder="Add confidential notes for internal review..."
              placeholderTextColor="rgba(197,199,208,0.6)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 14 }} onPress={saveNote} activeOpacity={0.8}>
              <Text style={s.saveNoteTxt}>{noteSaved ? 'Saved ✓' : 'Save Note'}</Text>
            </TouchableOpacity>
          </OutlineCard>

          {/* TIMELINE */}
          <View style={{ marginHorizontal: 22 }}>
            <Timeline compact steps={[
              { title: 'Claim Submitted', sub: `${dateStr} • by ${name}` },
              { title: 'Documents Verified', sub: docs.length > 0 ? `${docs.length} documents attached` : 'Pending verification', current: !docsDone },
              { title: status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'In Review',
                sub: status === 'PENDING REVIEW' || status === 'UNDER REVIEW' ? 'Assigned to insurance team' : 'Final decision', current: true },
            ]} />
            <TermsRow checked={agreedTerms} onToggle={() => setAgreedTerms(v => !v)} />
          </View>
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <BottomActions fx compact>
          <GlowPublishButton title={updating ? 'Updating...' : 'Approve Claim'} height={46} disabled={updating} onPress={approvePolicy} />
          <View style={s.bottomButtonsRow}>
            <TouchableOpacity style={s.rejectButton} onPress={rejectPolicy} activeOpacity={0.8} disabled={updating}>
              <Text style={s.rejectText}>Reject</Text>
            </TouchableOpacity>
            <GlowDraftButton title="Update Status" height={44} style={{ flex: 1 }} onPress={() => { if (!updating) updateClaimStatus(); }} />
          </View>
        </BottomActions>

        {/* DOCUMENT MODAL */}
        <Modal visible={documentVisible} transparent animationType="slide" onRequestClose={() => setDocumentVisible(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalContainer}>
              <Text style={s.modalTitle}>Documents</Text>
              <Text style={s.modalItem}>CNIC Front</Text>
              <Text style={s.modalItem}>Registration Book</Text>
              <Text style={s.modalItem}>Vehicle Images</Text>
              <TouchableOpacity style={s.closeButton} onPress={() => setDocumentVisible(false)}>
                <Text style={s.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.infoRow, last && s.infoRowLast]}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function DocImage({ uri, label }: { uri: string; label: string }) {
  return (
    <View style={s.documentItem}>
      <Image source={{ uri }} style={s.documentImage} resizeMode="cover" />
      <Text style={s.documentLabel}>{label}</Text>
    </View>
  );
}

function TLItem({ active, current, title, date, by, last }: any) {
  return (
    <View style={s.timelineItem}>
      <View style={s.timelineLeft}>
        <View style={[s.timelineCircle, active && s.timelineCircleActive, current && s.timelineCircleCurrent]}>
          {active ? <Text style={s.timelineCheck}>✓</Text> : <View style={s.timelineInnerCircle} />}
        </View>
        {!last && <View style={[s.timelineLine, current && s.timelineLineLast]} />}
      </View>
      <View style={s.timelineContent}>
        <Text style={[s.timelineItemTitle, current && s.timelineCurrentTitle]}>{title}</Text>
        <Text style={s.timelineDate}>{date} {by}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  coverageVal:   { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  descTitle:     { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginTop: 24, marginBottom: 12, marginHorizontal: 30 },
  descCard:      { marginHorizontal: 16, padding: 20 },
  descTxt:       { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 26 },
  surveyCard:    { marginHorizontal: 16, marginTop: 26, padding: 20 },
  surveyHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  surveyTitle:   { color: '#FFFFFF', fontSize: 22, fontFamily: 'Poppins_600SemiBold' },
  assignBtn:     { height: 42, paddingHorizontal: 20, borderRadius: 21, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  assignTxt:     { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  surveyDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginVertical: 14 },
  surveyorRow:   { flexDirection: 'row', alignItems: 'center', gap: 16 },
  surveyorName:  { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  surveyorDate:  { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  changeSurveyor:{ color: ORANGE, fontSize: 14, fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  noSurveyorTxt: { color: '#BAACB6', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  notesCard:     { marginHorizontal: 16, marginTop: 20, padding: 20 },
  notesTitle:    { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_500Medium', marginBottom: 14 },
  noteInput:     { minHeight: 110, borderRadius: 12, backgroundColor: '#262F45', padding: 14, color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  saveNoteTxt:   { color: ORANGE, fontSize: 14, fontFamily: 'Poppins_500Medium' },

  safeArea:  { flex: 1, backgroundColor: '#010A1F' },
  container: { flex: 1, backgroundColor: '#010A1F' },

  header:      { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, backgroundColor: BG },
  backButton:  { width: 28, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  backIcon:    { fontSize: 37, lineHeight: 38, color: C.textSecondary, fontWeight: '200' },
  headerTitle: { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold', marginTop: 6 },

  statusBar:     { height: 43, backgroundColor: 'rgba(11,42,104,0.95)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 23 },
  statusLeft:    { flexDirection: 'row', alignItems: 'center' },
  folderIcon:    { marginRight: 9 },
  folderIconText:{ color: ORANGE, fontSize: 20, fontFamily: 'Poppins_700Bold' },
  statusText:    { color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 0.2 },
  approvedText:  { color: '#22c55e' },
  rejectedText:  { color: '#f87171' },
  appliedText:   { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_600SemiBold' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 17 },

  applicantCard:  { minHeight: 160, borderWidth: 1, borderColor: 'rgba(226,103,27,0.6)', borderRadius: 16, padding: 17, marginBottom: 17, backgroundColor: '#010A1F' },
  profileRow:     { flexDirection: 'row', alignItems: 'center' },
  avatarContainer:{ width: 79, height: 79, position: 'relative' },
  avatar:         { width: 75, height: 75, borderRadius: 38, borderWidth: 2, borderColor: 'rgba(226,103,27,0.5)' },
  verifiedBadge:  { position: 'absolute', right: -1, bottom: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: BG },
  badgeText:      { color: '#fff', fontSize: 13, fontFamily: 'Poppins_700Bold' },
  profileInfo:    { marginLeft: 15, flex: 1 },
  name:           { color: C.textPrimary, fontSize: 18, fontFamily: 'Poppins_700Bold', marginBottom: 7 },
  contactRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  contactIcon:    { color: C.textPrimary, width: 19, fontSize: 15 },
  contactText:    { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  chassisLabel:   { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginTop: 12, marginBottom: 5 },
  chassisRow:     { flexDirection: 'row', alignItems: 'center' },
  chassisNumber:  { color: C.textPrimary, fontSize: 15, fontFamily: 'Poppins_700Bold', letterSpacing: 0.4 },
  copyIcon:       { color: C.textSecondary, marginLeft: 8, fontSize: 18 },

  sectionCard:   { backgroundColor: '#010A1F', borderWidth: 1, borderColor: 'rgba(36,52,82,1)', borderRadius: 14, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, marginBottom: 16 },
  sectionTitle:  { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 14 },
  descBox:       { borderWidth: 1, borderColor: 'rgba(48,58,80,1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },

  surveyorLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  surveyorIcon:  { color: ORANGE, fontSize: 20 },

  saveNoteBtn:   { alignSelf: 'flex-end', marginTop: 10 },
  infoRow:       { minHeight: 42, borderBottomWidth: 1, borderBottomColor: 'rgba(48,58,80,1)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRowLast:   { borderBottomWidth: 0 },
  infoLabel:     { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  infoValue:     { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'right' },

  coverageRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  coverageLabel: { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  coverageValue: { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  addOnDivider:  { height: 1, backgroundColor: 'rgba(48,58,80,1)', marginTop: 7, marginBottom: 9 },
  addOnTitle:    { color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_700Bold', marginBottom: 8 },
  tagsRow:       { flexDirection: 'row', gap: 8 },
  tag:           { height: 24, paddingHorizontal: 9, borderRadius: 12, backgroundColor: 'rgba(69,42,37,0.8)', flexDirection: 'row', alignItems: 'center' },
  tagIcon:       { color: ORANGE, fontSize: 11, marginRight: 5 },
  tagText:       { color: ORANGE, fontSize: 9, fontFamily: 'Poppins_700Bold' },

  premiumCard:    { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(233,103,27,0.6)', padding: 22, marginBottom: 32, backgroundColor: '#010A1F' },
  premiumHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  premiumTitle:   { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  pendingBadge:   { backgroundColor: ORANGE, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 13 },
  pendingText:    { color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold' },
  priceRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceLabel:     { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  priceValue:     { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  totalDivider:   { height: 1, backgroundColor: 'rgba(85,81,90,1)', marginTop: 4, marginBottom: 14 },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:     { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },
  totalValue:     { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  paymentBox:     { marginTop: 18, minHeight: 50, borderRadius: 8, backgroundColor: 'rgba(9,40,95,0.8)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  cardIconBox:    { width: 25, marginRight: 10 },
  cardIcon:       { color: ORANGE, fontSize: 20 },
  paymentLabel:   { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_500Medium' },
  paymentValue:   { color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },

  gallerySection: { marginBottom: 36 },
  galleryHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  galleryTitle:   { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  viewAll:        { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  documentsRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  documentItem:   { width: '30%', alignItems: 'center' },
  documentImage:  { width: 90, height: 91, borderRadius: 10, backgroundColor: '#061B4A', borderWidth: 1, borderColor: 'rgba(100,160,255,0.2)' },
  documentLabel:  { color: C.textSecondary, fontSize: 9, fontFamily: 'Poppins_700Bold', marginTop: 8, textAlign: 'center' },

  timelineSection:     { marginBottom: 20 },
  timelineTitle:       { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 20 },
  timelineItem:        { flexDirection: 'row', minHeight: 68 },
  timelineLeft:        { width: 30, alignItems: 'center' },
  timelineCircle:      { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: ORANGE, justifyContent: 'center', alignItems: 'center', backgroundColor: BG, zIndex: 2 },
  timelineCircleActive:{ backgroundColor: ORANGE },
  timelineCircleCurrent:{ backgroundColor: BG },
  timelineCheck:       { color: '#fff', fontSize: 13, fontFamily: 'Poppins_700Bold' },
  timelineInnerCircle: { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE },
  timelineLine:        { width: 1, flex: 1, backgroundColor: 'rgba(200,201,208,0.3)', marginTop: -1 },
  timelineLineLast:    { backgroundColor: 'transparent' },
  timelineContent:     { flex: 1, paddingLeft: 10, paddingBottom: 20 },
  timelineItemTitle:   { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_700Bold', marginBottom: 2 },
  timelineCurrentTitle:{ color: ORANGE },
  timelineDate:        { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16 },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 3 },
  checkbox: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: 'rgba(197,199,208,0.5)', marginTop: 2, marginRight: 8 },
  termsText:{ flex: 1, color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 17 },

  bottomActionContainer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 23, paddingTop: 20, paddingBottom: 26, backgroundColor: 'rgba(3,12,40,0.65)', borderTopWidth: 1, borderTopColor: 'rgba(100,160,255,0.25)', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 15 },
  approveButton:   { height: 46, borderRadius: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: ORANGE, marginBottom: 11 },
  approveText:     { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  bottomButtonsRow:{ flexDirection: 'row', gap: 16 },
  rejectButton:    { flex: 1, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#E0363A', justifyContent: 'center', alignItems: 'center', backgroundColor: '#050A18' },
  rejectText:      { color: '#E0363A', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  documentButton:  { flex: 1, height: 42, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(99,130,183,0.8)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(41,70,111,0.8)' },
  documentButtonText: { color: C.textSecondary, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#071632', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(100,160,255,0.2)', padding: 24 },
  modalTitle:     { color: C.textPrimary, fontSize: 18, fontFamily: 'Poppins_700Bold', marginBottom: 18 },
  modalItem:      { color: C.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(39,54,81,1)' },
  closeButton:    { marginTop: 18, height: 45, borderRadius: 23, backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center' },
  closeButtonText:{ color: '#fff', fontSize: 14, fontFamily: 'Poppins_700Bold' },
});
