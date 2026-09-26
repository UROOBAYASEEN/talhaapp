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
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={22} color={AppColors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Booking Details</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Status bar */}
        <View style={[s.statusBar, { borderLeftColor: color, backgroundColor: `${color}18` }]}>
          <View style={s.statusLeft}>
            <ShieldAlert size={15} color={color} />
            <Text style={[s.statusText, { color }]}>{booking.status?.toUpperCase()}</Text>
          </View>
          <Text style={s.statusDate}>Booked: {createdAt}</Text>
        </View>

        {/* Customer card */}
        <View style={s.applicantCard}>
          <CardShade />
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.18)']} start={{ x: 0.5, y: 0.5 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <View style={s.applicantTop}>
            <View style={s.avatarRing}>
              {booking.customer_avatar_url ? (
                <Image source={{ uri: resolveUrl(booking.customer_avatar_url) }} style={{ width: 54, height: 54, borderRadius: 27 }} />
              ) : (
                <View style={s.avatarFallback}>
                  <Text style={s.avatarInitial}>{initials}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.applicantName}>{booking.customer_name}</Text>
              <View style={s.contactRow}>
                <Phone size={12} color="#94a3b8" />
                <Text style={s.contactText}>{booking.customer_phone || '—'}</Text>
              </View>
            </View>
          </View>
          <Text style={s.regLabel}>BOOKING ID</Text>
          <View style={s.regRow}>
            <Text style={s.regNo}>{booking.id}</Text>
          </View>
        </View>

        {/* Vehicle info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Vehicle & Location</Text>
          <InfoRow label="Vehicle"  value={booking.vehicle || '—'} />
          <InfoRow label="City"     value={booking.city    || '—'} />
          <InfoRow label="Center"   value={booking.center  || '—'} />
          <InfoRow label="Address"  value={booking.address || '—'} />
        </View>

        {/* Package Details */}
        <View style={s.pkgCard}>
          <LinearGradient colors={['rgba(226,103,27,0.25)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

          <View style={s.pkgHeader}>
            <Text style={s.pkgHeading}>Package Details</Text>
            <View style={[s.pendingBadge, { backgroundColor: color }]}>
              <Text style={s.pendingText}>{booking.status?.toUpperCase()}</Text>
            </View>
          </View>

          <View style={s.pkgRow}>
            <View style={s.pkgLeft}>
              <View style={s.pkgIconCircle}>
                <Award size={26} color={ORANGE} strokeWidth={2} />
              </View>
              <View>
                <Text style={s.pkgName}>{booking.device_name || 'Tracker Package'}</Text>
                <Text style={s.pkgDuration}>Installation Request</Text>
              </View>
            </View>
            <Text style={s.pkgPrice}>PKR {Number(booking.amount || 0).toLocaleString()}</Text>
          </View>

          <View style={s.pkgDeviceRow}>
            <View style={s.pkgDeviceLeft}>
              <DollarSign size={16} color="#fff" />
              <Text style={s.pkgDeviceTitle}>Payment Amount</Text>
            </View>
            <View style={[s.pendingActivationBadge, { backgroundColor: `${color}22` }]}>
              <Text style={[s.pendingActivationText, { color }]}>PKR {Number(booking.amount || 0).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Installation details */}
        <View style={s.installSection}>
          <View style={s.installHeader}>
            <Wrench size={15} color={ORANGE} />
            <Text style={s.installTitle}>Installation Details</Text>
          </View>
          <View style={s.detailGrid}>
            <DetailField Icon={Calendar}  label="Date"    value={booking.date   || '—'} />
            <DetailField Icon={Clock}     label="Time"    value={booking.time   || '—'} />
            <DetailField Icon={Building2} label="Center"  value={booking.center || '—'} />
            <DetailField Icon={MapPin}    label="City"    value={booking.city   || '—'} />
          </View>
        </View>

        {/* Terms checkbox — only for pending */}
        {isPending && (
          <TouchableOpacity style={s.checkRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
            <View style={[s.checkbox, agreed && s.checkboxActive]}>
              {agreed && <Check size={11} color="#fff" />}
            </View>
            <Text style={s.checkText}>
              I confirm that I have verified the customer details and accept responsibility for this installation.
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Sticky action bar — only for pending */}
      {isPending && (
        <View style={s.actionBar}>
          <LinearGradient colors={['rgba(1,10,31,0.5)', 'rgba(1,10,31,0.98)']} style={StyleSheet.absoluteFillObject} />

          <TouchableOpacity
            style={[s.confirmWrap, actionLoading && { opacity: 0.6 }]}
            activeOpacity={0.85}
            disabled={actionLoading}
            onPress={confirmOrder}
          >
            <LinearGradient colors={['#032a69', ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 30 }]} />
            {actionLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.confirmText}>Confirm Order</Text>
            }
          </TouchableOpacity>

          <View style={s.actionRow}>
            <TouchableOpacity style={s.rejectBtn} activeOpacity={0.85} disabled={actionLoading} onPress={rejectOrder}>
              <Text style={s.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.assignBtn}
              activeOpacity={0.85}
              onPress={() => updateStatus('installation')}
              disabled={actionLoading}
            >
              <GlassInset />
              <Text style={s.assignText}>Mark as Installation</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: AppColors.textPrimary },

  statusBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderLeftWidth: 4, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  statusLeft:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusText:  { fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },
  statusDate:  { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#94a3b8' },

  applicantCard: { borderRadius: 16, padding: 16, backgroundColor: '#010A1F', borderWidth: 1, borderColor: ORANGE, overflow: 'hidden', marginBottom: 14 },
  applicantTop:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatarRing:    { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: 'rgba(226,103,27,0.6)', overflow: 'hidden' },
  avatarFallback:{ flex: 1, backgroundColor: '#032a69', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 22, fontFamily: 'Poppins_700Bold' },
  applicantName: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: '#fff', marginBottom: 3 },
  contactRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  contactText:   { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#94a3b8' },
  regLabel:      { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#94a3b8', marginBottom: 4 },
  regRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  regNo:         { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: 0.5 },

  card:      { borderRadius: 16, padding: 16, backgroundColor: '#010A1F', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', overflow: 'hidden', marginBottom: 14 },
  cardTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff', marginBottom: 8 },

  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  infoLabel: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#94a3b8' },
  infoValue: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff', textAlign: 'right', flex: 1, marginLeft: 12 },

  pkgCard:      { borderRadius: 24, padding: 20, borderWidth: 2, borderColor: ORANGE, overflow: 'hidden', marginBottom: 14, backgroundColor: '#010A1F' },
  pkgHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  pkgHeading:   { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#fff' },
  pkgRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  pkgLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pkgIconCircle:{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(226,103,27,0.25)', alignItems: 'center', justifyContent: 'center' },
  pkgName:      { fontSize: 13, fontFamily: 'Poppins_700Bold', color: ORANGE },
  pkgDuration:  { fontSize: 10, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  pkgPrice:     { fontSize: 13, fontFamily: 'Poppins_700Bold', color: 'rgba(255,255,255,0.65)' },
  pkgDeviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pkgDeviceLeft:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  pkgDeviceTitle:{ fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  pendingBadge:          { borderRadius: 30, paddingHorizontal: 10, paddingVertical: 4 },
  pendingText:           { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#fff' },
  pendingActivationBadge:{ borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  pendingActivationText: { fontSize: 10, fontFamily: 'Poppins_700Bold' },

  installSection: { marginBottom: 14 },
  installHeader:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  installTitle:   { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff' },
  detailGrid:     { gap: 10 },
  detailField:    { backgroundColor: '#061B4A', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  detailFieldLabel:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  detailFieldLabelText:{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#94a3b8' },
  detailFieldValue:    { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  checkRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6 },
  checkbox:      { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#6f7f9c', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkboxActive:{ backgroundColor: ORANGE, borderColor: ORANGE },
  checkText:     { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#94a3b8', lineHeight: 18 },

  actionBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28, gap: 10 },
  confirmWrap: { borderRadius: 30, overflow: 'hidden', paddingVertical: 14, alignItems: 'center' },
  confirmText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff' },
  actionRow:   { flexDirection: 'row', gap: 10 },
  rejectBtn:   { flex: 1, borderRadius: 30, borderWidth: 1.5, borderColor: '#ef4444', paddingVertical: 12, alignItems: 'center' },
  rejectText:  { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#ef4444' },
  assignBtn:   { flex: 1, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(3,12,40,0.6)', paddingVertical: 12, alignItems: 'center' },
  assignText:  { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#fff' },
});
