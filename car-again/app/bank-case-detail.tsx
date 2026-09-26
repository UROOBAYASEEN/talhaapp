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

const ORANGE = '#e2671b';
const BG     = '#010A1F';
const SERVER = API_BASE.replace('/api/v1', '');

function resolveUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
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

function InfoRow({ Icon, label, value, last }: { Icon?: any; label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.infoRow, !last && s.infoRowBorder]}>
      <View style={s.infoLeft}>
        {Icon && <Icon size={15} color={ORANGE} />}
        <Text style={s.infoLabel}>{label}</Text>
      </View>
      <Text style={s.infoValue} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
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
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(false);

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
          setApp(await aRes.json());
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

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content} style={{ marginBottom: 140 }}>

        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft size={24} color={AppColors.textPrimary} />
            </TouchableOpacity>
            <Text style={s.heading}>Case Details</Text>
          </View>
        </View>

        {/* SUMMARY CARD */}
        <View style={s.summaryOuter}>
          <LinearGradient colors={[ORANGE, 'rgba(226,103,27,0.4)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
          <View style={s.summaryInner}>
            <LinearGradient colors={['#010A1F', '#010A1F']} style={StyleSheet.absoluteFillObject} />
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.18)']} start={{ x: 0.5, y: 0.5 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

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
                  <ShieldCheck size={11} color="#fff" />
                </View>
              </View>
              <View style={s.customerMeta}>
                <View style={s.nameRow}>
                  <Text style={s.customerName}>{app.full_name || '—'}</Text>
                  <View style={[s.statusBadge, { backgroundColor: sColor + '22', borderColor: sColor + '55' }]}>
                    <Text style={[s.statusText, { color: sColor }]}>{app.status}</Text>
                  </View>
                </View>
                <View style={s.contactRow}>
                  <MapPin size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={s.contactText}>{app.city || '—'}</Text>
                </View>
                <View style={s.contactRow}>
                  <CreditCard size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={s.contactText}>{app.cnic || '—'}</Text>
                </View>
                {(app as any).applicant_phone || (app as any).applicant_email ? (
                  <>
                    {(app as any).applicant_phone ? (
                      <View style={s.contactRow}>
                        <Phone size={12} color="rgba(255,255,255,0.7)" />
                        <Text style={s.contactText}>{(app as any).applicant_phone}</Text>
                      </View>
                    ) : null}
                    {(app as any).applicant_email ? (
                      <View style={s.contactRow}>
                        <Mail size={12} color="rgba(255,255,255,0.7)" />
                        <Text style={s.contactText}>{(app as any).applicant_email}</Text>
                      </View>
                    ) : null}
                  </>
                ) : null}
              </View>
            </View>

            <View style={s.caseIdRow}>
              <Text style={s.caseIdLabel}>REFERENCE #</Text>
              <View style={s.caseIdValueRow}>
                <Text style={s.caseIdValue}>{app.reference_no}</Text>
                <TouchableOpacity onPress={() => Clipboard.setString(app.reference_no)}>
                  <Copy size={14} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* VEHICLE IMAGE */}
        {(() => {
          const vImg = resolveUrl((app as any).vehicle_image);
          return vImg ? (
            <View style={s.vehicleImageCard}>
              <Text style={s.sectionTitle}>Vehicle</Text>
              <Image source={{ uri: vImg }} style={s.vehicleImage} resizeMode="cover" />
              <Text style={s.vehicleImageLabel}>{[app.brand, app.car_model, app.variant].filter(Boolean).join(' ') || 'Vehicle'} • {app.year || ''} • {app.color || ''}</Text>
            </View>
          ) : (
            <View style={s.vehicleImageCard}>
              <Text style={s.sectionTitle}>Vehicle</Text>
              <View style={s.vehiclePlaceholder}>
                <Text style={s.vehiclePlaceholderTxt}>{(app.brand || 'V').charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={s.vehicleImageLabel}>{[app.brand, app.car_model, app.variant].filter(Boolean).join(' ') || 'Vehicle'} • {app.year || ''}</Text>
            </View>
          );
        })()}

        {/* CUSTOMER INFORMATION */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Customer Information</Text>
          <InfoRow Icon={User}       label="Full Name"        value={app.full_name} />
          <InfoRow Icon={CreditCard} label="CNIC"             value={app.cnic} />
          <InfoRow Icon={MapPin}     label="City"             value={app.city} />
          <InfoRow Icon={Smartphone} label="Employment Type"  value={app.employment_type} />
          <InfoRow                   label="Monthly Income"   value={fmt(app.monthly_income)} last />
        </View>

        {/* VEHICLE INFORMATION */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Vehicle Information</Text>
          <InfoRow label="Type"      value={app.vehicle_type + ' · ' + app.condition} />
          <InfoRow label="Brand"     value={app.brand} />
          <InfoRow label="Model"     value={app.car_model} />
          <InfoRow label="Variant"   value={app.variant} />
          <InfoRow label="Year"      value={app.year} />
          <InfoRow label="Color"     value={app.color} last />
        </View>

        {/* FINANCING DETAILS */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Financing Details</Text>
          <InfoRow label="Bank"               value={app.bank_name + ' · ' + app.bank_product} />
          <InfoRow label="Vehicle Price"      value={fmt(app.vehicle_price)} />
          <InfoRow label="Down Payment"       value={fmt(app.down_payment)} />
          <InfoRow label="Loan Amount"        value={fmt(app.loan_amount)} />
          <InfoRow label="Monthly Installment" value={fmt(app.monthly_installment)} />
          <InfoRow label="Tenure"             value={`${app.tenure_years} Years`} />
          <InfoRow label="Markup Rate"        value={`${app.markup_rate}%`} />
          <InfoRow label="Rate Type"          value={app.rate_type} last />
        </View>

        {/* DOCUMENT GALLERY */}
        <View style={s.docHeader}>
          <Text style={s.sectionTitle}>Documents ({docs.length})</Text>
        </View>
        {docs.length === 0 ? (
          <View style={s.emptyDocs}>
            <FileText size={32} color={AppColors.textSecondary} />
            <Text style={s.emptyDocsTxt}>No documents uploaded</Text>
            {(app as any).documents?.length > 0 ? (
              <View style={s.docGrid}>
                {(app as any).documents.map((url: string, i: number) => {
                  const resolved = resolveUrl(url) || url;
                  const isImg = resolved?.match(/\.(jpg|jpeg|png|webp)$/i);
                  return (
                    <View key={`appdoc-${i}`} style={s.docItem}>
                      {isImg ? (
                        <Image source={{ uri: resolved! }} style={s.docImg} resizeMode="cover" />
                      ) : (
                        <View style={[s.docImg, s.docFile]}>
                          <FileText size={24} color={ORANGE} />
                        </View>
                      )}
                      <Text style={s.docLabel}>Document {i + 1}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={s.docGrid}>
            {docs.map((doc, i) => {
              const resolved = resolveUrl(doc.file_url) || doc.file_url;
              const isImg = resolved?.match(/\.(jpg|jpeg|png|webp)$/i);
              return (
                <View key={i} style={s.docItem}>
                  {isImg ? (
                    <Image source={{ uri: resolved! }} style={s.docImg} resizeMode="cover" />
                  ) : (
                    <View style={[s.docImg, s.docFile]}>
                      <FileText size={24} color={ORANGE} />
                    </View>
                  )}
                  <Text style={s.docLabel}>{doc.doc_type}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* FIXED FOOTER */}
      <BlurView intensity={60} tint="dark" style={s.footer}>
        <LinearGradient colors={['rgba(3,12,40,0.85)', 'rgba(3,12,40,0.95)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <LinearGradient colors={['rgba(22,64,136,0.4)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <LinearGradient colors={['rgba(13,37,84,0.3)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <LinearGradient colors={['transparent', 'rgba(29,83,175,0.3)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View style={s.actionBox}>
          {app.status !== 'approved' && (
            <TouchableOpacity
              style={s.approveWrap}
              activeOpacity={0.85}
              disabled={updating}
              onPress={() => Alert.alert('Approve', 'Approve this financing application?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Approve', onPress: () => updateStatus('approved') },
              ])}
            >
              <LinearGradient colors={['#1B2A63', ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.approveGrad}>
                {updating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.approveText}>Approve Financing</Text>}
              </LinearGradient>
            </TouchableOpacity>
          )}
          {app.status !== 'rejected' && (
            <TouchableOpacity
              style={s.rejectBtn}
              activeOpacity={0.8}
              disabled={updating}
              onPress={() => Alert.alert('Reject', 'Reject this financing application?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reject', style: 'destructive', onPress: () => updateStatus('rejected') },
              ])}
            >
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <Text style={s.rejectText}>Reject Financing</Text>
            </TouchableOpacity>
          )}
          {app.status === 'submitted' && (
            <TouchableOpacity
              style={[s.rejectBtn, { borderColor: '#60a5fa55' }]}
              disabled={updating}
              onPress={() => updateStatus('reviewing')}
            >
              <Text style={[s.rejectText, { color: '#60a5fa' }]}>Mark Under Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 20, paddingTop: 4 },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heading:    { color: AppColors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },

  summaryOuter: { borderRadius: 24, padding: 1.5, overflow: 'hidden', marginBottom: 20, marginTop: 4 },
  summaryInner: { borderRadius: 23, padding: 20, overflow: 'hidden' },
  avatarRow:    { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  avatarWrap:   { position: 'relative', width: 64, height: 64 },
  avatarInitial:{ width: 64, height: 64, borderRadius: 32, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  avatarInitialTxt: { color: '#fff', fontSize: 26, fontFamily: 'Poppins_700Bold' },
  avatarImage:  { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: '#061B4A' },
  shieldBadge:  { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1a1530' },
  vehicleImageCard: { backgroundColor: '#010A1F', borderRadius: 20, padding: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  vehicleImage: { width: '100%', height: 180, borderRadius: 14, marginTop: 8, backgroundColor: '#061B4A' },
  vehicleImageLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 8, textAlign: 'center' },
  vehiclePlaceholder: { width: '100%', height: 140, borderRadius: 14, marginTop: 8, backgroundColor: '#061B4A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  vehiclePlaceholderTxt: { color: ORANGE, fontSize: 36, fontFamily: 'Poppins_700Bold' },
  customerMeta: { flex: 1 },
  nameRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  customerName: { color: AppColors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  statusBadge:  { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  statusText:   { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'capitalize' },
  contactRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  contactText:  { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Poppins_400Regular', flex: 1 },
  caseIdRow:    { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  caseIdLabel:  { color: ORANGE, fontSize: 10, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1 },
  caseIdValueRow:{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  caseIdValue:  { color: AppColors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

  section:      { backgroundColor: '#010A1F', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sectionTitle: { color: AppColors.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },

  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  infoLeft:      { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  infoLabel:     { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'Poppins_400Regular' },
  infoValue:     { color: AppColors.textPrimary, fontSize: 11, fontFamily: 'Poppins_600SemiBold', textAlign: 'right', maxWidth: '50%' },

  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  docGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  docItem:   { width: '30%', alignItems: 'center' },
  docImg:    { width: '100%', aspectRatio: 1, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  docFile:   { backgroundColor: '#010A1F', alignItems: 'center', justifyContent: 'center' },
  docLabel:  { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontFamily: 'Poppins_500Medium', marginTop: 5, textAlign: 'center', textTransform: 'uppercase' },
  emptyDocs: { alignItems: 'center', paddingVertical: 24, gap: 8, marginBottom: 16 },
  emptyDocsTxt:{ color: AppColors.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },

  footer:      { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 32, paddingTop: 14 },
  actionBox:   { gap: 10, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(100,160,255,0.2)', backgroundColor: 'rgba(3,12,40,0.6)', padding: 14, overflow: 'hidden' },
  approveWrap: { borderRadius: 30, overflow: 'hidden' },
  approveGrad: { paddingVertical: 14, alignItems: 'center' },
  approveText: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_700Bold' },
  rejectBtn:   { paddingVertical: 12, alignItems: 'center', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(100,160,255,0.25)', backgroundColor: 'rgba(3,42,105,0.2)', overflow: 'hidden' },
  rejectText:  { color: '#ffffff', fontSize: 13, fontFamily: 'Poppins_500Medium' },
});
