import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft, Phone, Check, ShieldAlert,
  Award, Cpu, Wrench, Calendar, Clock,
  Building2, MapPin, DollarSign,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomActions, D, DHeader, OutlineCard, TermsRow } from '@/components/dealer/DealerUI';
import { ApplicantCard, InfoTable, StatusBand } from '@/components/insurance/AppDetailUI';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';

const ORANGE = '#e2671b';
const BG     = '#010A1F';
const SERVER = API_BASE.replace('/api/v1', '');
function resolveUrl(url?: string | null) { if (!url) return ''; if (url.startsWith('http')) return url; return `${SERVER}${url}`; }

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

function CardShade() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function DetailField({ Icon, label, value }: { Icon: any; label: string; value: string }) {
  return (
    <View style={s.detailField}>
      <GlassInset />
      <View style={s.detailFieldLabel}>
        <Icon size={12} color="#94a3b8" />
        <Text style={s.detailFieldLabelText}>{label}</Text>
      </View>
      <Text style={s.detailFieldValue}>{value || '—'}</Text>
    </View>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'confirmed':    return '#3b82f6';
    case 'installation': return '#8b5cf6';
    case 'completed':    return '#22c55e';
    case 'cancelled':    return '#ef4444';
    default:             return ORANGE;
  }
}

export default function TrackerClaimDetailScreen() {
  const router  = useRouter();
  const { token } = useAuth();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking,       setBooking]       = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [agreed,        setAgreed]        = useState(false);

  useEffect(() => {
    if (!bookingId) { setLoading(false); return; }
    fetch(`${API_BASE}/tracker-bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBooking(d); })
      .finally(() => setLoading(false));
  }, [bookingId]);

  async function updateStatus(status: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tracker-bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBooking(updated);
        Alert.alert('Updated', `Status changed to ${status}`);
      } else Alert.alert('Error', 'Could not update status.');
    } finally { setActionLoading(false); }
  }

  function confirmOrder() {
    if (!agreed) { Alert.alert('Terms', 'Please accept the terms and conditions first.'); return; }
    Alert.alert('Confirm Order', 'Are you sure you want to confirm this installation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => updateStatus('confirmed') },
    ]);
  }

  function rejectOrder() {
    Alert.alert('Reject Order', 'Are you sure you want to reject this request?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => updateStatus('cancelled') },
    ]);
  }

  if (loading) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={ORANGE} size="large" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: AppColors.textSecondary, fontFamily: 'Poppins_400Regular' }}>Booking not found</Text>
      </View>
    );
  }

  const color      = statusColor(booking.status);
  const initials   = (booking.customer_name || 'C').charAt(0).toUpperCase();
  const createdAt  = booking.created_at
    ? new Date(booking.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const isPending  = booking.status === 'new';

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']}>
        <DHeader title="Applications Details" />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* Status band */}
        <StatusBand small label={(booking.status === 'new' ? 'PENDING REVIEW' : booking.status?.toUpperCase()) || 'PENDING REVIEW'} date={createdAt} />

        {/* Customer card */}
        <ApplicantCard
          compact
          name={booking.customer_name || 'Customer'}
          phone={booking.customer_phone || '—'}
          email={booking.customer_email}
          avatar={booking.customer_avatar_url ? resolveUrl(booking.customer_avatar_url) : null}
          chassis={booking.id}
          idLabel="REG NO"
          colors={['#0A2058', '#0C1A40', '#0F162D', '#2A1F28', '#55301F']}
          locations={[0, 0.28, 0.5, 0.78, 1]}
        />

        {/* Vehicle info */}
        <InfoTable
          title="Vehicle Information"
          rows={[
            { label: 'Vehicle', value: booking.vehicle || '—' },
            { label: 'City',    value: booking.city    || '—' },
            { label: 'Center',  value: booking.center  || '—' },
            { label: 'Address', value: booking.address || '—' },
          ]}
        />

        {/* Package Details */}
        <OutlineCard style={s.pkgCard}>
          <View style={s.pkgRow}>
            <View style={s.pkgLeft}>
              <View style={s.pkgIconCircle}>
                <Award size={24} color={ORANGE} strokeWidth={2} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={s.pkgName} numberOfLines={1}>{booking.device_name || 'Tracker Package'}</Text>
                <Text style={s.pkgDuration}>Installation Request</Text>
              </View>
            </View>
            <Text style={s.pkgPrice}>PKR {Number(booking.amount || 0).toLocaleString()}</Text>
          </View>

          <View style={s.pkgDeviceRow}>
            <View style={s.pkgDeviceLeft}>
              <MaterialCommunityIcons name="router-wireless" size={22} color={ORANGE} />
              <Text style={s.pkgDeviceTitle}>Device Status</Text>
            </View>
            <View style={[s.pendingActivationBadge, { backgroundColor: `${color}26` }]}>
              <Text style={[s.pendingActivationText, { color }]}>{isPending ? 'Pending Activation' : booking.status}</Text>
            </View>
          </View>
          <View style={s.devRow}><Text style={s.devLabel}>Booking ID</Text><Text style={s.devVal} numberOfLines={1}>{booking.id}</Text></View>
          <View style={s.devRow}><Text style={s.devLabel}>Amount</Text><Text style={s.devVal}>PKR {Number(booking.amount || 0).toLocaleString()}</Text></View>
        </OutlineCard>

        {/* Installation details */}
        <View style={s.installSection}>
          <View style={s.installHeader}>
            <Ionicons name="construct-outline" size={22} color={ORANGE} />
            <Text style={s.installTitle}>Installation Details</Text>
          </View>
          <View style={s.detailGrid}>
            <DetailField Icon={Calendar}  label="Date"   value={booking.date   || '—'} />
            <DetailField Icon={Clock}     label="Time"   value={booking.time   || '—'} />
            <DetailField Icon={Building2} label="Branch" value={booking.center || '—'} />
            <DetailField Icon={MapPin}    label="City"   value={booking.city   || '—'} />
          </View>
        </View>

        {/* Terms checkbox — only for pending */}
        {isPending && (
          <View style={{ paddingHorizontal: 16 }}>
            <TermsRow checked={agreed} onToggle={() => setAgreed(!agreed)} />
          </View>
        )}

        <View style={{ height: isPending ? 190 : 40 }} />
      </ScrollView>

      {/* Sticky action bar — only for pending */}
      {isPending && (
        <BottomActions glass>
          <GradientButton title="Confirm Order" height={50} fontSize={17} loading={actionLoading} onPress={confirmOrder} />
          <View style={s.actionRow}>
            <TouchableOpacity style={s.rejectBtn} activeOpacity={0.85} disabled={actionLoading} onPress={rejectOrder}>
              <Text style={s.rejectText}>Reject</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <GlassButton title="Assign Technician" height={44} fontSize={12.5} color="#C9C6D0" onPress={() => updateStatus('installation')} />
            </View>
          </View>
        </BottomActions>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: D.bg },

  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  infoLabel: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#94a3b8' },
  infoValue: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff', textAlign: 'right', flex: 1, marginLeft: 12 },

  pkgCard:      { marginHorizontal: 16, marginTop: 20, padding: 18 },
  pkgRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  pkgLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  pkgIconCircle:{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(226,103,27,0.25)', alignItems: 'center', justifyContent: 'center' },
  pkgName:      { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: ORANGE },
  pkgDuration:  { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)' },
  pkgPrice:     { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF' },
  pkgDeviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pkgDeviceLeft:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  pkgDeviceTitle:{ fontSize: 17, fontFamily: 'Poppins_400Regular', color: '#fff' },
  pendingActivationBadge:{ borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  pendingActivationText: { fontSize: 11, fontFamily: 'Poppins_500Medium', textTransform: 'capitalize' },
  devRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, gap: 12 },
  devLabel:     { fontSize: 12, fontFamily: 'Poppins_400Regular', color: D.muted },
  devVal:       { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#FFFFFF', flexShrink: 1 },

  installSection: { marginHorizontal: 16, marginTop: 26 },
  installHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.14)' },
  installTitle:   { fontSize: 18, fontFamily: 'Poppins_500Medium', color: '#fff' },
  detailGrid:     { gap: 12 },
  detailField:    { backgroundColor: '#0B2358', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(127,152,196,0.4)', paddingHorizontal: 14, paddingVertical: 10, overflow: 'hidden' },
  detailFieldLabel:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  detailFieldLabelText:{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#E6E1E8' },
  detailFieldValue:    { fontSize: 15, fontFamily: 'Poppins_400Regular', color: '#fff' },

  actionRow:   { flexDirection: 'row', gap: 10, alignItems: 'center' },
  rejectBtn:   { flex: 1, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#B3261E', backgroundColor: 'rgba(70,10,20,0.4)', alignItems: 'center', justifyContent: 'center' },
  rejectText:  { fontSize: 15, fontFamily: 'Poppins_500Medium', color: '#F45B69' },
});
