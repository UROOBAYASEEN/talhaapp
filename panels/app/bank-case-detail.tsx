import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft, Phone, Mail, User, CreditCard,
  Smartphone, MapPin, ShieldCheck, Copy, FileText,
} from 'lucide-react-native';
import { Clipboard } from 'react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Modal, Pressable } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { BottomActions, D, DHeader, OutlineCard, StatusPill, WarmCard } from '@/components/dealer/DealerUI';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';

const ORANGE = '#e2671b';
const BG     = '#010A1F';
const SERVER = API_BASE.replace('/api/v1', '');

function resolveUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url.replace(/http:\/\/[\d.]+:\d+/, SERVER);
  return `${SERVER}${url.startsWith('/') ? url : '/' + url}`;
}

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

function InfoRow({ Icon, label, value, last, bold }: { Icon?: any; label: string; value: string; last?: boolean; bold?: boolean }) {
  return (
    <View style={[s.infoRow, !last && s.infoRowBorder]}>
      <View style={s.infoLeft}>
        {Icon && <Icon size={15} color={ORANGE} />}
        <Text style={s.infoLabel}>{label}</Text>
      </View>
      <Text style={[s.infoValue, bold && { fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
}

// Full amount, e.g. PKR 1,200,000 (Figma financing table)
function pkr(v: number) {
  if (!v) return '—';
  return `PKR ${Number(v).toLocaleString()}`;
}

function fmt(v: number) {
  if (!v) return '—';
  if (v >= 10_000_000) return `PKR ${(v / 10_000_000).toFixed(1)} Cr`;
  if (v >= 100_000)    return `PKR ${(v / 100_000).toFixed(1)} L`;
  return `PKR ${v.toLocaleString()}`;
}

function statusColor(s: string) {
  if (s === 'approved')  return '#4ade80';
  if (s === 'rejected')  return '#f87171';
  if (s === 'reviewing') return '#60a5fa';
  return ORANGE;
}

export default function BankCaseDetail() {
  const router     = useRouter();
  const { token }  = useAuth();
  const { id }     = useLocalSearchParams<{ id: string }>();

  const [app,      setApp]      = useState<any>(null);
  const [docs,     setDocs]     = useState<any[]>([]);
  const [userDocs, setUserDocs] = useState<{ uri: string; label: string }[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  function isImgDoc(uri?: string | null) {
    return !!uri && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(uri);
  }
  // Images open in-app viewer; other files fall back to browser
  function openDoc(uri?: string | null) {
    if (!uri) return;
    if (isImgDoc(uri)) setPreviewDoc(uri);
    else Linking.openURL(uri);
  }

  const DUMMY_DATA: Record<string, any> = {
    '1': { id: '1', reference_no: 'AWZ-2025-08421', full_name: 'Ahmed Raza',   vehicle_type: 'car', condition: 'new',  brand: 'Honda',   car_model: 'City',     variant: 'Aspire CVT', color: 'White',  year: '2024', city: 'Karachi',    vehicle_price: 4500000, down_payment: 1000000, loan_amount: 3500000, monthly_installment: 58300, tenure_years: 5, markup_rate: 13.9, rate_type: 'variable', employment_type: 'Salaried',    monthly_income: 150000, cnic: '42101-1234567-1', bank_name: 'Meezan', bank_product: 'Car Ijarah', status: 'submitted',  documents: [] },
    '2': { id: '2', reference_no: 'AWZ-2025-08422', full_name: 'Sara Khan',    vehicle_type: 'car', condition: 'new',  brand: 'Toyota',  car_model: 'Corolla',  variant: 'Altis 1.6X',year: '2025', city: 'Lahore',     vehicle_price: 6800000, down_payment: 1600000, loan_amount: 5200000, monthly_installment: 74100, tenure_years: 5, markup_rate: 16.0, rate_type: 'variable', employment_type: 'Business',     monthly_income: 280000, cnic: '35201-9876543-2', bank_name: 'HBL',    bank_product: 'Car Loan',    status: 'reviewing',  documents: [] },
    '3': { id: '3', reference_no: 'AWZ-2025-08423', full_name: 'Usman Tariq',  vehicle_type: 'car', condition: 'used', brand: 'Suzuki',  car_model: 'Swift',    variant: '1.3 GL CVT', year: '2023', city: 'Islamabad',  vehicle_price: 3200000, down_payment:  600000, loan_amount: 2600000, monthly_installment: 38500, tenure_years: 5, markup_rate: 15.5, rate_type: 'fixed',    employment_type: 'Salaried',    monthly_income: 120000, cnic: '61101-5554321-3', bank_name: 'MCB',    bank_product: 'Car4U',       status: 'approved',   documents: [] },
    '4': { id: '4', reference_no: 'AWZ-2025-08424', full_name: 'Ali Hassan',   vehicle_type: 'car', condition: 'new',  brand: 'Kia',     car_model: 'Sportage', variant: 'AWD Alpha',  year: '2024', city: 'Rawalpindi', vehicle_price: 9500000, down_payment: 1700000, loan_amount: 7800000, monthly_installment: 112000,tenure_years: 5, markup_rate: 17.3, rate_type: 'variable', employment_type: 'Business',     monthly_income: 400000, cnic: '37405-1122334-4', bank_name: 'UBL',    bank_product: 'Drive',       status: 'rejected',   documents: [] },
    '5': { id: '5', reference_no: 'AWZ-2025-08425', full_name: 'Fatima Noor',  vehicle_type: 'car', condition: 'new',  brand: 'Hyundai', car_model: 'Tucson',   variant: '2.0 GLS',    year: '2024', city: 'Karachi',    vehicle_price: 8000000, down_payment: 1600000, loan_amount: 6400000, monthly_installment: 91000, tenure_years: 5, markup_rate: 14.9, rate_type: 'variable', employment_type: 'Salaried',    monthly_income: 320000, cnic: '42201-7788990-5', bank_name: 'Meezan', bank_product: 'Car Ijarah', status: 'submitted',  documents: [] },
  };

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [aRes, dRes] = await Promise.all([
          fetch(`${API_BASE}/financing/applications/${id}`, { headers }),
          fetch(`${API_BASE}/financing/documents/${id}`,    { headers }),
        ]);
        if (aRes.ok) {
          const appData = await aRes.json();
          setApp(appData);
          // Applicant's own uploaded documents (CNIC, license, …) — bank is authorized
          if (appData.user_id) {
            try {
              const uRes = await fetch(`${API_BASE}/documents/user/${appData.user_id}`, { headers });
              if (uRes.ok) {
                const uDocs = await uRes.json();
                const items = Array.isArray(uDocs) ? uDocs : (uDocs.items || []);
                setUserDocs(items.map((d: any) => ({
                  uri: resolveUrl(d.file_url) || d.file_url,
                  label: d.type || d.desc || 'Document',
                })));
              }
            } catch { /* no user docs */ }
          }
        } else {
          setApp(DUMMY_DATA[id] || null);
        }
        if (dRes.ok) setDocs(await dRes.json());
      } catch {
        setApp(DUMMY_DATA[id] || null);
      }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  // Prefetch gallery images so they appear instantly (disk-cached)
  useEffect(() => {
    const fromApp = (((app as any)?.documents || []) as string[]).map(u => resolveUrl(u) || u);
    const urls = [
      ...userDocs.map(d => d.uri),
      ...docs.map((d: any) => resolveUrl(d.file_url) || d.file_url),
      ...fromApp,
    ].filter((u): u is string => !!u && isImgDoc(u));
    if (urls.length > 0) ExpoImage.prefetch(urls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs.length, userDocs.length, ((app as any)?.documents || []).length]);

  async function updateStatus(status: 'approved' | 'rejected' | 'reviewing') {
    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/financing/bank/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setApp((prev: any) => ({ ...prev, status }));
        Alert.alert('Updated', `Application ${status}.`);
      }
    } catch {}
    finally { setUpdating(false); }
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ActivityIndicator color={ORANGE} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!app) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 20 }}>
          <ChevronLeft size={24} color={AppColors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: AppColors.textSecondary, fontFamily: 'Poppins_400Regular' }}>Application not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sColor = statusColor(app.status);
  const statusLabel = app.status === 'reviewing' ? 'Under Review' : app.status === 'submitted' ? 'New' : String(app.status || '');
  const tone: any = app.status === 'approved' ? 'green' : app.status === 'rejected' ? 'red' : app.status === 'reviewing' ? 'green' : 'orange';

  // All documents — applicant's own docs first, then uploaded docs, then files on the application
  const allDocs: { uri: string; label: string }[] = [
    ...userDocs,
    ...docs.map((d: any) => ({ uri: resolveUrl(d.file_url) || d.file_url, label: d.doc_type || 'Document' })),
    ...(((app as any).documents || []) as string[]).map((u, i) => ({ uri: resolveUrl(u) || u, label: `Document ${i + 1}` })),
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <DHeader title="Case Details" center right={<Ionicons name="print-outline" size={26} color={ORANGE} />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* SUMMARY CARD */}
        <WarmCard style={s.summary}>
          <View style={s.avatarRow}>
            <View style={s.avatarWrap}>
              {(() => {
                const avatarUrl = resolveUrl((app as any).applicant_avatar || (app as any).avatar_url);
                return avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={s.avatarImage} resizeMode="cover" />
                ) : (
                  <View style={s.avatarInitial}>
                    <Text style={s.avatarInitialTxt}>{(app.full_name || 'U').charAt(0).toUpperCase()}</Text>
                  </View>
                );
              })()}
              <View style={s.shieldBadge}>
                <ShieldCheck size={12} color="#fff" />
              </View>
            </View>
            <View style={s.customerMeta}>
              <View style={s.nameRow}>
                <Text style={s.customerName} numberOfLines={1}>{app.full_name || '—'}</Text>
                <StatusPill label={statusLabel} tone={tone} style={{ paddingHorizontal: 10, paddingVertical: 2 }} />
              </View>
              {(app as any).applicant_phone ? (
                <View style={s.contactRow}>
                  <Phone size={15} color="#fff" />
                  <Text style={s.contactText}>{(app as any).applicant_phone}</Text>
                </View>
              ) : null}
              {(app as any).applicant_email ? (
                <View style={s.contactRow}>
                  <Mail size={15} color="#fff" />
                  <Text style={s.contactText} numberOfLines={1}>{(app as any).applicant_email}</Text>
                </View>
              ) : null}
              <View style={s.contactRow}>
                <MapPin size={15} color="#fff" />
                <Text style={s.contactText}>{app.city || '—'}</Text>
              </View>
            </View>
          </View>

          <Text style={s.caseIdLabel}>CASE ID #</Text>
          <View style={s.caseIdValueRow}>
            <Text style={s.caseIdValue}>{app.reference_no}</Text>
            <TouchableOpacity onPress={() => Clipboard.setString(app.reference_no)}>
              <Copy size={16} color="#E6E1E8" />
            </TouchableOpacity>
          </View>
        </WarmCard>

        {/* CUSTOMER INFORMATION */}
        <OutlineCard style={s.section}>
          <Text style={s.sectionTitle}>Customer Information</Text>
          <InfoRow Icon={User}       label="Customer Name"   value={app.full_name} />
          <InfoRow Icon={CreditCard} label="CNIC Number"     value={app.cnic} />
          <InfoRow Icon={Phone}      label="Mobile Number"   value={(app as any).applicant_phone || (app as any).phone} />
          <InfoRow Icon={Mail}       label="Email Address"   value={(app as any).applicant_email || (app as any).email} />
          <InfoRow Icon={MapPin}     label="City"            value={app.city} />
          <InfoRow Icon={Smartphone} label="Employment Type" value={app.employment_type} />
          <InfoRow                   label="Monthly Income"  value={fmt(app.monthly_income)} last />
        </OutlineCard>

        {/* VEHICLE INFORMATION */}
        <OutlineCard style={s.section}>
          <Text style={s.sectionTitle}>Vehicle Information</Text>
          {(() => {
            const vImg = resolveUrl((app as any).vehicle_image);
            return vImg ? (
              <Image source={{ uri: vImg }} style={s.vehicleImage} resizeMode="cover" />
            ) : (
              <View style={s.vehiclePlaceholder}>
                <Text style={s.vehiclePlaceholderTxt}>{(app.brand || 'V').charAt(0).toUpperCase()}</Text>
              </View>
            );
          })()}
          <InfoRow label="Brand/Model" value={[app.brand, app.car_model, app.variant].filter(Boolean).join(' ')} />
          <InfoRow label="Variant"     value={app.variant} />
          <InfoRow label="Year"        value={app.year} />
          <View style={[s.infoRow, s.infoRowBorder]}>
            <View style={s.infoLeft}><Text style={s.infoLabel}>Color</Text></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {app.color ? <View style={[s.colorDot, { backgroundColor: String(app.color).toLowerCase() }]} /> : null}
              <Text style={s.infoValue}>{app.color || '—'}</Text>
            </View>
          </View>
          <InfoRow label="Fuel Type"   value={(app as any).fuel_type} />
          <InfoRow label="Type"        value={app.vehicle_type + ' · ' + app.condition} last />
        </OutlineCard>

        {/* FINANCING DETAILS */}
        <OutlineCard style={s.section}>
          <Text style={s.sectionTitle}>Financing Details</Text>
          <InfoRow bold label="Down Payment"        value={pkr(app.down_payment)} />
          <InfoRow bold label="Financed Amount"     value={pkr(app.loan_amount)} />
          <InfoRow bold label="Markup Rate"         value={`${app.markup_rate}%`} />
          <InfoRow bold label="Monthly Installment" value={pkr(app.monthly_installment)} />
          <InfoRow bold label="Financing Period"    value={`${app.tenure_years} Years`} />
          <InfoRow bold label="Processing Fee"      value={(app as any).processing_fee != null ? pkr((app as any).processing_fee) : '—'} />
          <InfoRow bold label="Vehicle Price"       value={pkr(app.vehicle_price)} />
          <InfoRow bold label="Bank"                value={app.bank_name + ' · ' + app.bank_product} />
          <InfoRow bold label="Rate Type"           value={app.rate_type} last />
        </OutlineCard>

        {/* DOCUMENT GALLERY */}
        <View style={s.docHeader}>
          <Text style={s.docTitle}>Document Gallery</Text>
          <TouchableOpacity onPress={() => setShowDocs(true)}><Text style={s.viewAll}>View All</Text></TouchableOpacity>
        </View>
        {allDocs.length === 0 ? (
          <View style={s.emptyDocs}>
            <FileText size={32} color={D.muted} />
            <Text style={s.emptyDocsTxt}>No documents uploaded</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }} style={{ marginBottom: 20 }}>
            {allDocs.map((d, i) => {
              const isImg = d.uri?.match(/\.(jpg|jpeg|png|webp)$/i);
              return (
                <TouchableOpacity key={i} style={s.docItem} activeOpacity={0.85} onPress={() => openDoc(d.uri)}>
              {isImg ? (
                <ExpoImage source={{ uri: d.uri }} style={s.docImg} contentFit="cover" cachePolicy="disk" transition={200} />
              ) : (
                    <View style={[s.docImg, s.docFile]}>
                      <FileText size={24} color={ORANGE} />
                    </View>
                  )}
                  <Text style={s.docLabel} numberOfLines={1}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <GradientButton title="View Customer Documents" height={52} fontSize={17} onPress={() => setShowDocs(true)} />

        {/* ACTIONS — at the end of the page (Figma) */}
        <View style={s.actionPanel}>
          <LinearGradient colors={['rgba(23,52,110,0.92)', 'rgba(12,30,70,0.96)']} style={StyleSheet.absoluteFillObject} />
          {app.status !== 'approved' && (
            <GradientButton
              title="Approve Financing"
              height={50}
              fontSize={17}
              loading={updating}
              onPress={() => Alert.alert('Approve', 'Approve this financing application?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Approve', onPress: () => updateStatus('approved') },
              ])}
            />
          )}
          {app.status !== 'rejected' && (
            <GlassButton
              title="Reject Financing"
              height={46}
              fontSize={15}
              color="#E6E1E8"
              onPress={() => !updating && Alert.alert('Reject', 'Reject this financing application?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reject', style: 'destructive', onPress: () => updateStatus('rejected') },
              ])}
            />
          )}
          {app.status === 'submitted' && (
            <GlassButton title="Mark Under Review" height={46} fontSize={15} color="#60a5fa" onPress={() => !updating && updateStatus('reviewing')} />
          )}
      </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* CUSTOMER DOCUMENTS POPUP */}
      <Modal visible={showDocs} transparent animationType="fade" onRequestClose={() => setShowDocs(false)}>
        <Pressable style={s.docOverlay} onPress={() => setShowDocs(false)}>
          <Pressable style={s.docSheet}>
            <LinearGradient colors={['#0A1B44', '#030B1F']} style={StyleSheet.absoluteFillObject} />
            <View style={s.docSheetHead}>
              <Text style={s.docSheetTitle}>Customer Documents</Text>
              <TouchableOpacity onPress={() => setShowDocs(false)}><Ionicons name="close" size={28} color={ORANGE} /></TouchableOpacity>
            </View>
            {allDocs.length === 0 ? (
              <Text style={s.emptyDocsTxt}>No documents uploaded</Text>
            ) : allDocs.map((d, i) => (
              <View key={i} style={s.docRow}>
                <View style={s.docRowIcon}><Ionicons name="document-text-outline" size={24} color={ORANGE} /></View>
                <Text style={s.docRowTxt} numberOfLines={1}>{d.label}</Text>
                <TouchableOpacity style={s.docViewBtn} onPress={() => openDoc(d.uri)}>
                  <Text style={s.docViewTxt}>View</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
      {/* IN-APP DOCUMENT VIEWER (images open here, not in browser) */}
      <Modal visible={!!previewDoc} transparent animationType="fade" onRequestClose={() => setPreviewDoc(null)}>
        <Pressable style={s.previewOverlay} onPress={() => setPreviewDoc(null)}>
          <TouchableOpacity style={s.previewClose} onPress={() => setPreviewDoc(null)}>
            <Ionicons name="close" size={28} color={ORANGE} />
          </TouchableOpacity>
          {previewDoc ? (
            <Pressable style={{ width: '100%', height: '75%' }} onPress={() => setPreviewDoc(null)}>
              <ExpoImage source={{ uri: previewDoc }} style={s.previewImg} contentFit="contain" cachePolicy="disk" transition={200} />
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: D.bg },
  content: { paddingHorizontal: 16, paddingTop: 4 },

  summary:      { padding: 18, borderRadius: 20, marginBottom: 18, marginTop: 4 },
  avatarRow:    { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  avatarWrap:   { position: 'relative', width: 84, height: 84 },
  avatarInitial:{ width: 84, height: 84, borderRadius: 42, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E6E1E8' },
  avatarInitialTxt: { color: '#fff', fontSize: 30, fontFamily: 'Poppins_700Bold' },
  avatarImage:  { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: '#E6E1E8', backgroundColor: '#061B4A' },
  shieldBadge:  { position: 'absolute', bottom: 0, right: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  customerMeta: { flex: 1 },
  nameRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  customerName: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_600SemiBold', flexShrink: 1 },
  contactRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  contactText:  { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_400Regular', flex: 1 },
  caseIdLabel:  { marginTop: 16, color: '#D9C6F0', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  caseIdValueRow:{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  caseIdValue:  { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_700Bold' },

  section:      { paddingHorizontal: 16, paddingVertical: 16, marginBottom: 18 },
  sectionTitle: { color: '#FFFFFF', fontSize: 17, fontFamily: 'Poppins_500Medium', marginBottom: 6 },

  vehicleImage: { width: '100%', height: 170, borderRadius: 12, marginTop: 6, marginBottom: 6, backgroundColor: '#061B4A' },
  vehiclePlaceholder: { width: '100%', height: 130, borderRadius: 12, marginTop: 6, marginBottom: 6, backgroundColor: '#061B4A', alignItems: 'center', justifyContent: 'center' },
  vehiclePlaceholderTxt: { color: ORANGE, fontSize: 36, fontFamily: 'Poppins_700Bold' },

  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.14)' },
  infoLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  infoLabel:     { color: '#E6E1E8', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  infoValue:     { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'right', maxWidth: '55%', textTransform: 'none' },

  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 14 },
  docTitle:  { color: '#FFFFFF', fontSize: 22, fontFamily: 'Poppins_600SemiBold' },
  viewAll:   { color: ORANGE, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  docItem:   { width: 110, alignItems: 'center' },
  docImg:    { width: 110, height: 110, borderRadius: 12, borderWidth: 1, borderColor: '#E6E1E8' },
  docFile:   { backgroundColor: '#061B4A', alignItems: 'center', justifyContent: 'center' },
  docLabel:  { color: D.muted, fontSize: 10, fontFamily: 'Poppins_600SemiBold', marginTop: 6, textAlign: 'center', textTransform: 'uppercase' },
  emptyDocs: { alignItems: 'center', paddingVertical: 24, gap: 8, marginBottom: 16 },
  colorDot:  { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  actionPanel: { marginTop: 22, marginHorizontal: -16, paddingHorizontal: 20, paddingVertical: 18, gap: 12, overflow: 'hidden', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(130,165,213,0.35)' },
  emptyDocsTxt:{ color: D.muted, fontSize: 12, fontFamily: 'Poppins_400Regular' },

  docOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 20 },
  docSheet:      { borderRadius: 20, overflow: 'hidden', padding: 20, borderWidth: 1, borderColor: 'rgba(127,152,196,0.35)', gap: 14 },
  docSheetHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  docSheetTitle: { color: '#FFFFFF', fontSize: 19, fontFamily: 'Poppins_600SemiBold' },
  docRow:        { flexDirection: 'row', alignItems: 'center', gap: 14 },
  docRowIcon:    { width: 46, height: 46, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  docRowTxt:     { flex: 1, color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_400Regular' },
  docViewBtn:    { borderRadius: 10, borderWidth: 1, borderColor: 'rgba(230,225,232,0.35)', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 14, paddingVertical: 6 },
  docViewTxt:    { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  previewImg:     { width: '100%', height: '100%' },
  previewClose:   { position: 'absolute', top: 48, right: 20, zIndex: 2, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
