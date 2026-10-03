import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, StatusBar, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const C = AppColors;
const SERVER = API_BASE.replace('/api/v1', '');
function resolveUrl(u?: string | null) { if (!u) return null; if (u.startsWith('http')) return u.replace(/http:\/\/[\d.]+:\d+/, SERVER); return `${SERVER}${u}`; }

export default function TrackerRequestDetailScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams<{
    id?: string; name?: string; vehicle?: string; status?: string;
    insurance?: string; insuranceRate?: string; tracker?: string;
    trackerModel?: string; fee?: string; date?: string;
  }>();

  const [realApp, setRealApp] = useState<any>(null);
  const [realClaim, setRealClaim] = useState<any>(null);
  const [loadingReal, setLoadingReal] = useState(true);

  useEffect(() => {
    if (!token || !params.id) { setLoadingReal(false); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/insurance/provider/applications`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const list: any[] = await res.json();
          const found = list.find((x: any) => String(x.id) === String(params.id));
          if (found) {
            setRealApp(found);
            // try fetch claim for vehicle details
            try {
              const cr = await fetch(`${API_BASE}/insurance/provider/claims`, { headers: { Authorization: `Bearer ${token}` } });
              if (cr.ok) {
                const cl: any[] = await cr.json();
                const cf = cl.find((c: any) => String(c.id) === String(found.id) || String(c.claim_id) === String(found.claim_id));
                if (cf) setRealClaim(cf);
              }
            } catch {}
          }
        }
      } catch {}
      finally { setLoadingReal(false); }
    })();
  }, [params.id, token]);

  const name          = realApp?.customer || realApp?.name || params.name          || '—';
  const vehicle       = realApp?.vehicle || realClaim?.vehicle || params.vehicle       || '—';
  const rawStatus     = realApp?.status || params.status        || 'Pending';
  const insurance     = realApp?.plan_name || params.insurance     || '—';
  const insuranceRate = realApp?.premium ? `PKR ${Number(realApp.premium).toLocaleString()}` : (params.insuranceRate || '—');
  const tracker       = realApp?.has_tracker ? (realApp.selected_addons?.join(', ') || 'Tracker Included') : (params.tracker || (realApp?.has_tracker ? 'Tracker' : '—'));
  const trackerModel  = params.trackerModel  || (realApp?.has_tracker ? 'Tracker Device' : '—');
  const fee           = realApp?.premium ? `PKR ${Number(realApp.premium).toLocaleString()}` : (params.fee || '—');
  const date          = realApp?.created_at ? new Date(realApp.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (params.date || '—');
  const avatarUrl     = resolveUrl(realApp?.customer_avatar || realApp?.avatar_url);
  const initials      = (name || '—').slice(0, 2).toUpperCase();

  const [status,          setStatus]          = useState(rawStatus.toUpperCase());
  const [documentVisible, setDocumentVisible] = useState(false);

  const vehicleInfo = [
    ['Make / Model',   vehicle],
    ['Insurance',      insurance],
    ['Premium Rate',   insuranceRate],
    ['Tracker',        tracker],
    ['Tracker Model',  trackerModel],
  ];

  function approvePolicy() {
    setStatus('APPROVED');
    Alert.alert('Policy Approved', 'The insurance policy has been approved successfully.');
  }

  function rejectPolicy() {
    Alert.alert('Reject Policy', 'Are you sure you want to reject this application?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => setStatus('REJECTED') },
    ]);
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#020D25" />
      <View style={s.container}>

        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Applications Details</Text>
        </View>

        {/* STATUS BAR */}
        <View style={s.statusBar}>
          <View style={s.statusLeft}>
            <View style={s.folderIcon}><Text style={s.folderIconText}>▣</Text></View>
            <Text style={[s.statusText, status === 'APPROVED' && s.approvedText, status === 'REJECTED' && s.rejectedText]}>
              {status}
            </Text>
          </View>
          <Text style={s.appliedText}>Applied: {date}</Text>
        </View>

        {/* CONTENT */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

          {/* APPLICANT CARD */}
          <View style={s.applicantCard}>
            {loadingReal ? <ActivityIndicator color="#e2671b" style={{ paddingVertical: 12 }} /> : null}
            <View style={s.profileRow}>
              <View style={s.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={s.avatar} resizeMode="cover" />
                ) : (
                  <View style={[s.avatar, { backgroundColor: '#09265A', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#E7EBF4', fontSize: 22, fontWeight: '700' }}>{initials}</Text>
                  </View>
                )}
                <View style={s.verifiedBadge}><Text style={s.badgeText}>✓</Text></View>
              </View>
              <View style={s.profileInfo}>
                <Text style={s.name}>{name}</Text>
                <View style={s.contactRow}>
                  <Text style={s.contactIcon}>⌕</Text>
                  <Text style={s.contactText}>{realApp?.phone || insurance}</Text>
                </View>
                <View style={s.contactRow}>
                  <Text style={s.contactIcon}>⌖</Text>
                  <Text style={s.contactText}>{vehicle}</Text>
                </View>
                {realApp?.email ? <View style={s.contactRow}><Text style={s.contactIcon}>✉</Text><Text style={s.contactText} numberOfLines={1}>{realApp.email}</Text></View> : null}
              </View>
            </View>
            <Text style={s.chassisLabel}>Request ID</Text>
            <View style={s.chassisRow}>
              <Text style={s.chassisNumber}>REQ-{params.id ? String(params.id).slice(-6).toUpperCase() : '0001'}</Text>
              <Text style={s.copyIcon}>□</Text>
            </View>
          </View>

          {/* VEHICLE INFORMATION */}
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Vehicle Information</Text>
            {vehicleInfo.map(([label, value], i) => (
              <InfoRow key={label} label={label} value={value} last={i === vehicleInfo.length - 1} />
            ))}
          </View>

          {/* COVERAGE */}
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Coverage Details</Text>
            <View style={s.coverageRow}>
              <Text style={s.coverageLabel}>Total Fee</Text>
              <Text style={s.coverageValue}>{fee}</Text>
            </View>
            <View style={s.addOnDivider} />
            <Text style={s.addOnTitle}>Selected Add-Ons</Text>
            <View style={s.tagsRow}>
              <View style={s.tag}><Text style={s.tagIcon}>⌖</Text><Text style={s.tagText}>TRACKER</Text></View>
              <View style={s.tag}><Text style={s.tagIcon}>▣</Text><Text style={s.tagText}>ROADSIDE</Text></View>
            </View>
          </View>

          {/* PREMIUM SUMMARY */}
          <View style={s.premiumCard}>
            <View style={s.premiumHeader}>
              <Text style={s.premiumTitle}>Premium Summary</Text>
              <View style={s.pendingBadge}>
                <Text style={s.pendingText}>
                  {status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'Pending'}
                </Text>
              </View>
            </View>
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>Insurance Plan</Text>
              <Text style={s.priceValue}>{insurance}</Text>
            </View>
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>Premium Rate</Text>
              <Text style={s.priceValue}>{insuranceRate}</Text>
            </View>
            <View style={s.totalDivider} />
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TOTAL AMOUNT</Text>
              <Text style={s.totalValue}>{fee}</Text>
            </View>
            <View style={s.paymentBox}>
              <View style={s.cardIconBox}><Text style={s.cardIcon}>▤</Text></View>
              <View>
                <Text style={s.paymentLabel}>Payment Method</Text>
                <Text style={s.paymentValue}>SafePay</Text>
              </View>
            </View>
          </View>

          {/* DOCUMENT GALLERY */}
          <View style={s.gallerySection}>
            <View style={s.galleryHeader}>
              <Text style={s.galleryTitle}>Document Gallery</Text>
              <TouchableOpacity><Text style={s.viewAll}>View All</Text></TouchableOpacity>
            </View>
            <View style={s.documentsRow}>
              <DocumentItem uri="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=200" label="CNIC FRONT" />
              <DocumentItem uri="https://images.unsplash.com/photo-1568667256549-094345857637?w=200" label="REG. BOOK" />
              <DocumentItem uri="https://images.unsplash.com/photo-1550355291-bbee04a92027?w=200" label="VEHICLE IMG 1" />
            </View>
          </View>

          {/* TIMELINE */}
          <View style={s.timelineSection}>
            <Text style={s.timelineTitle}>Application Timeline</Text>
            <TimelineItem active title="Application Submitted" date={date} by={`by ${name}`} />
            <TimelineItem active={status !== 'PENDING REVIEW'} current={status === 'PENDING REVIEW'} title="Under Review" date="Assigned to insurance team" />
            <TimelineItem current={status === 'APPROVED' || status === 'REJECTED'} title={status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'Awaiting Decision'} date="Final decision pending" last />
          </View>

          {/* TERMS */}
          <View style={s.termsRow}>
            <View style={s.checkbox} />
            <Text style={s.termsText}>
              I confirm that I have read and accept the terms and conditions and privacy policy.
            </Text>
          </View>

          <View style={{ height: 125 }} />
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View style={s.bottomActionContainer}>
          <TouchableOpacity style={s.approveButton} onPress={approvePolicy} activeOpacity={0.8}>
            <Text style={s.approveText}>Approve Policy</Text>
          </TouchableOpacity>
          <View style={s.bottomButtonsRow}>
            <TouchableOpacity style={s.rejectButton} onPress={rejectPolicy} activeOpacity={0.8}>
              <Text style={s.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.documentButton} onPress={() => setDocumentVisible(true)} activeOpacity={0.8}>
              <Text style={s.documentButtonText}>Document</Text>
            </TouchableOpacity>
          </View>
        </View>

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

function DocumentItem({ uri, label }: { uri: string; label: string }) {
  return (
    <View style={s.documentItem}>
      <Image source={{ uri }} style={s.documentImage} resizeMode="cover" />
      <Text style={s.documentLabel}>{label}</Text>
    </View>
  );
}

function TimelineItem({ active, current, title, date, by, last }: any) {
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

const ORANGE = '#e2671b';
const NAVY   = '#032a69';
const BG     = '#010A1F';

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },

  header:      { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, backgroundColor: BG },
  backButton:  { width: 28, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  backIcon:    { fontSize: 37, lineHeight: 38, color: C.textSecondary, fontWeight: '200' },
  headerTitle: { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },

  statusBar:     { height: 43, backgroundColor: 'rgba(3,42,105,0.8)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 23, borderBottomWidth: 1, borderBottomColor: 'rgba(100,160,255,0.2)' },
  statusLeft:    { flexDirection: 'row', alignItems: 'center' },
  folderIcon:    { marginRight: 9 },
  folderIconText:{ color: ORANGE, fontSize: 20, fontWeight: '700' },
  statusText:    { color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 0.2 },
  approvedText:  { color: '#22c55e' },
  rejectedText:  { color: '#f87171' },
  appliedText:   { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_600SemiBold' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 17 },

  applicantCard:  { minHeight: 160, borderWidth: 1, borderColor: 'rgba(226,103,27,0.6)', borderRadius: 16, padding: 16, marginBottom: 16, backgroundColor: 'rgba(3,12,40,0.8)', overflow: 'hidden' },
  profileRow:     { flexDirection: 'row', alignItems: 'center' },
  avatarContainer:{ width: 79, height: 79, position: 'relative' },
  avatar:         { width: 75, height: 75, borderRadius: 38, borderWidth: 2, borderColor: 'rgba(226,103,27,0.5)' },
  verifiedBadge:  { position: 'absolute', right: -1, bottom: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: BG },
  badgeText:      { color: '#fff', fontSize: 13, fontFamily: 'Poppins_700Bold' },
  profileInfo:    { marginLeft: 14, flex: 1 },
  name:           { color: C.textPrimary, fontSize: 17, fontFamily: 'Poppins_700Bold', marginBottom: 6 },
  contactRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  contactIcon:    { color: ORANGE, width: 18, fontSize: 14 },
  contactText:    { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  chassisLabel:   { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_600SemiBold', marginTop: 12, marginBottom: 5 },
  chassisRow:     { flexDirection: 'row', alignItems: 'center' },
  chassisNumber:  { color: C.textPrimary, fontSize: 15, fontFamily: 'Poppins_700Bold', letterSpacing: 0.4 },
  copyIcon:       { color: C.textSecondary, marginLeft: 8, fontSize: 18 },

  sectionCard:   { backgroundColor: 'rgba(1,6,20,0.9)', borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', borderRadius: 14, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, marginBottom: 14 },
  sectionTitle:  { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 14 },
  infoRow:       { minHeight: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRowLast:   { borderBottomWidth: 0 },
  infoLabel:     { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  infoValue:     { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'right' },

  coverageRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  coverageLabel: { color: C.textPrimary, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  coverageValue: { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  addOnDivider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 7, marginBottom: 9 },
  addOnTitle:    { color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_600SemiBold', marginBottom: 8 },
  tagsRow:       { flexDirection: 'row', gap: 8 },
  tag:           { height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: 'rgba(226,103,27,0.15)', borderWidth: 1, borderColor: 'rgba(226,103,27,0.4)', flexDirection: 'row', alignItems: 'center' },
  tagIcon:       { color: ORANGE, fontSize: 11, marginRight: 5 },
  tagText:       { color: ORANGE, fontSize: 9, fontFamily: 'Poppins_700Bold' },

  premiumCard:    { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(226,103,27,0.5)', padding: 20, marginBottom: 32, backgroundColor: 'rgba(1,6,20,0.95)', overflow: 'hidden' },
  premiumHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  premiumTitle:   { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  pendingBadge:   { backgroundColor: ORANGE, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pendingText:    { color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold' },
  priceRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priceLabel:     { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  priceValue:     { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  totalDivider:   { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 4, marginBottom: 12 },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:     { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },
  totalValue:     { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  paymentBox:     { marginTop: 18, minHeight: 50, borderRadius: 10, backgroundColor: 'rgba(9,40,95,0.8)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  cardIconBox:    { width: 25, marginRight: 10 },
  cardIcon:       { color: ORANGE, fontSize: 20 },
  paymentLabel:   { color: C.textSecondary, fontSize: 10, fontFamily: 'Poppins_500Medium' },
  paymentValue:   { color: C.textPrimary, fontSize: 11, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },

  gallerySection: { marginBottom: 36 },
  galleryHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  galleryTitle:   { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  viewAll:        { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  documentsRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  documentItem:   { width: '30%', alignItems: 'center' },
  documentImage:  { width: 90, height: 91, borderRadius: 10, backgroundColor: '#061B4A', borderWidth: 1, borderColor: 'rgba(100,160,255,0.25)' },
  documentLabel:  { color: C.textSecondary, fontSize: 9, fontFamily: 'Poppins_600SemiBold', marginTop: 8, textAlign: 'center' },

  timelineSection:     { marginBottom: 20 },
  timelineTitle:       { color: C.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 20 },
  timelineItem:        { flexDirection: 'row', minHeight: 68 },
  timelineLeft:        { width: 30, alignItems: 'center' },
  timelineCircle:      { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: ORANGE, justifyContent: 'center', alignItems: 'center', backgroundColor: BG, zIndex: 2 },
  timelineCircleActive:{ backgroundColor: ORANGE },
  timelineCircleCurrent:{ backgroundColor: BG },
  timelineCheck:       { color: '#fff', fontSize: 13, fontFamily: 'Poppins_700Bold' },
  timelineInnerCircle: { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE },
  timelineLine:        { width: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: -1 },
  timelineLineLast:    { backgroundColor: 'transparent' },
  timelineContent:     { flex: 1, paddingLeft: 10, paddingBottom: 20 },
  timelineItemTitle:   { color: C.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 2 },
  timelineCurrentTitle:{ color: ORANGE },
  timelineDate:        { color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16 },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 3 },
  checkbox: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: 'rgba(100,160,255,0.5)', marginTop: 2, marginRight: 8 },
  termsText:{ flex: 1, color: C.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 17 },

  bottomActionContainer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 26, backgroundColor: 'rgba(3,42,105,0.97)', borderTopWidth: 1, borderTopColor: 'rgba(100,160,255,0.2)' },
  approveButton:   { height: 48, borderRadius: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: ORANGE, marginBottom: 10 },
  approveText:     { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  bottomButtonsRow:{ flexDirection: 'row', gap: 12 },
  rejectButton:    { flex: 1, height: 42, borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(248,113,113,0.8)', justifyContent: 'center', alignItems: 'center' },
  rejectText:      { color: '#f87171', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  documentButton:  { flex: 1, height: 42, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(3,12,40,0.6)' },
  documentButtonText: { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#061B4A', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', padding: 24 },
  modalTitle:     { color: C.textPrimary, fontSize: 18, fontFamily: 'Poppins_700Bold', marginBottom: 18 },
  modalItem:      { color: C.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  closeButton:    { marginTop: 18, height: 46, borderRadius: 23, backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center' },
  closeButtonText:{ color: '#fff', fontSize: 14, fontFamily: 'Poppins_700Bold' },
});
