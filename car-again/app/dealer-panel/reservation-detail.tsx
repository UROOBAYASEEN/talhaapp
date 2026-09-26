import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Modal, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "@/constants/theme";
import { API_BASE } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";

const ORANGE = "#e2671b";
const C      = AppColors;

/* ── Timeline ── */
function Timeline({ steps }: { steps: { title: string; date?: string; completed: boolean }[] }) {
  return (
    <View style={s.timeline}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <View key={i} style={s.timelineItem}>
            {!isLast && (
              <View style={[s.timelineLine, step.completed && s.timelineLineDone]} />
            )}
            <View style={[s.timelineCircle, step.completed && s.timelineCircleDone]}>
              {step.completed && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
            <View style={s.timelineContent}>
              <Text style={s.timelineTitle}>{step.title}</Text>
              {step.date && <Text style={s.timelineDate}>{step.date}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ── Info Card ── */
function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.infoCard}>
      <LinearGradient colors={["rgba(22,64,136,0.2)","transparent"]} start={{x:0.5,y:0}} end={{x:0.5,y:0.5}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <Text style={s.infoCardTitle}>{title}</Text>
      {children}
    </View>
  );
}

/* ── Info Row ── */
function InfoRow({ icon, label, value, last = false, colorDot = false }: any) {
  return (
    <View style={[s.infoRow, !last && s.infoRowBorder]}>
      <View style={s.infoLabelWrap}>
        {icon && <Ionicons name={icon} size={16} color={ORANGE} style={{ marginRight: 8 }} />}
        <Text style={s.infoLabel}>{label}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", maxWidth: "55%" }}>
        {colorDot && <View style={s.colorDot} />}
        <Text style={s.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

/* ── Price Row ── */
function PriceRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={s.priceRow}>
      <Text style={s.priceLabel}>{label}</Text>
      <Text style={[s.priceValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

/* ── Note ── */
function Note({ text }: { text: string }) {
  return (
    <View style={s.noteRow}>
      <Text style={s.bullet}>•</Text>
      <Text style={s.noteText}>{text}</Text>
    </View>
  );
}

const SERVER = API_BASE.replace('/api/v1', '');

/* ── Document Image with loading ── */
function DocImage({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const resolved = url.startsWith('http') ? url : `${SERVER}${url}`;

  if (error || !url.startsWith('http')) {
    return (
      <View style={{ height: 180, backgroundColor: '#061B4A', borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Ionicons name="document-outline" size={36} color="#4B5A7A" />
        <Text style={{ color: '#4B5A7A', fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingHorizontal: 16 }}>
          {error ? 'Could not load image' : 'Old document — re-upload required'}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ height: 180, borderRadius: 10, overflow: 'hidden', backgroundColor: '#061B4A' }}>
      {loading && (
        <View style={{ ...StyleSheet.absoluteFillObject as any, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={ORANGE} />
        </View>
      )}
      <Image
        source={{ uri: resolved }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      />
    </View>
  );
}

/* ── Documents Modal ── */
function DocumentsModal({ visible, onClose, buyerId, token }: {
  visible: boolean; onClose: () => void; buyerId: string; token: string | null;
}) {
  const [docs,    setDocs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!visible || !buyerId || !token) return;
    setLoading(true);
    fetch(`${API_BASE}/users/${buyerId}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => setDocs(d))
      .finally(() => setLoading(false));
  }, [visible, buyerId]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#060f2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(100,160,255,0.2)', maxHeight: '85%' }}>
          <LinearGradient colors={['rgba(22,64,136,0.3)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginTop: 12 }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
            <Text style={{ color: AppColors.textPrimary, fontSize: 17, fontFamily: 'Poppins_700Bold' }}>Customer Documents</Text>
            <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
              <Ionicons name="close" size={18} color={AppColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36, gap: 16 }} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator color={ORANGE} style={{ marginTop: 40, marginBottom: 40 }} />
            ) : docs.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
                <Ionicons name="document-outline" size={48} color="rgba(255,255,255,0.15)" />
                <Text style={{ color: AppColors.textSecondary, fontSize: 14, fontFamily: 'Poppins_500Medium' }}>No documents uploaded</Text>
                <Text style={{ color: AppColors.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', opacity: 0.6 }}>Customer has not submitted any documents yet</Text>
              </View>
            ) : (
              docs.map((doc, i) => (
                <View key={doc.id || i} style={{ borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.2)', backgroundColor: 'rgba(3,12,40,0.6)', overflow: 'hidden' }}>
                  {/* Doc header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(226,103,27,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="document-text-outline" size={18} color={ORANGE} />
                      </View>
                      <View>
                        <Text style={{ color: AppColors.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' }}>{doc.desc}</Text>
                        <Text style={{ color: AppColors.textSecondary, fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 1 }}>{doc.uploaded_at || '—'}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: doc.status === 'verified' ? 'rgba(39,174,96,0.12)' : 'rgba(226,103,27,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: doc.status === 'verified' ? 'rgba(39,174,96,0.3)' : 'rgba(226,103,27,0.3)' }}>
                      <Text style={{ color: doc.status === 'verified' ? '#27ae60' : ORANGE, fontSize: 9, fontFamily: 'Poppins_600SemiBold', textTransform: 'capitalize' }}>{doc.status}</Text>
                    </View>
                  </View>
                  {/* Doc image */}
                  <View style={{ padding: 12 }}>
                    {doc.file_url
                      ? <DocImage url={doc.file_url} />
                      : <View style={{ height: 120, backgroundColor: '#061B4A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="image-outline" size={32} color="#4B5A7A" />
                          <Text style={{ color: '#4B5A7A', fontSize: 11, marginTop: 6, fontFamily: 'Poppins_400Regular' }}>No image</Text>
                        </View>
                    }
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ── Main Screen ── */
export default function ReservationDetailScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams<any>();

  const [showDocs, setShowDocs] = useState(false);

  const buyerId        = params.buyer_id         || '';
  const reservationId  = params.reservation_id  || "AWZ-2026-000145";
  const status         = params.status          || "Confirmed";
  const reservedDate   = params.created_at
    ? new Date(params.created_at).toLocaleString("en-US", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
    : "15 May 2026, 11:30 AM";
  const expectedVisit  = params.expected_visit  || "16 May 2026";
  const buyerName      = params.buyer_name      || "Muhammad Hamza";
  const cnic           = params.cnic            || "42301-1234567-1";
  const phone          = params.phone           || "0321-1234567";
  const email          = params.email           || "—";
  const city           = params.location        || "Lahore";
  const vehicleName    = params.vehicle_title   || "Toyota Corolla Altis 1.6X";
  const vehicleVariant = params.variant         || "Automatic";
  const vehicleYear    = params.year            || "2025";
  const vehicleColor   = params.vehicle_color   || "White";
  const vehicleImage   = params.vehicle_image   || "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=900";
  const vehiclePrice   = params.price           || "PKR 1,450,000";
  const reservedAmount = params.reserved_amount || "PKR 10,000";

  const isConfirmed = status.toLowerCase() === "confirmed" || status.toLowerCase() === "new";

  const steps = [
    { title: "Reservation Created",        date: reservedDate,             completed: true  },
    { title: "Reservation Payment Received",date: reservedDate,            completed: true  },
    { title: "Vehicle Reserved",            date: reservedDate,            completed: true  },
    { title: "Customer Visited Dealership", completed: false },
    { title: "Remaining Payment Received",  completed: false },
    { title: "Vehicle Delivered",           completed: false },
    { title: "Reservation Completed",       completed: false },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textSecondary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Reservation Details</Text>
        <TouchableOpacity style={s.printBtn}>
          <Ionicons name="print-outline" size={22} color={ORANGE} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* RESERVATION SUMMARY CARD */}
        <View style={s.summaryCard}>
          <LinearGradient colors={["rgba(226,103,27,0.08)","transparent"]} start={{x:0.5,y:0}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          <View style={s.summaryTop}>
            <View>
              <Text style={s.smallLabel}>RESERVATION ID</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                <Text style={s.resId}>{reservationId}</Text>
                <Ionicons name="copy-outline" size={16} color="#7F899E" />
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.smallLabel}>STATUS</Text>
              <View style={[s.statusBadge, { backgroundColor: isConfirmed ? "#064E38" : "rgba(226,103,27,0.15)" }]}>
                <Text style={[s.statusTxt, { color: isConfirmed ? "#5BE5A5" : ORANGE }]}>{status}</Text>
              </View>
            </View>
          </View>

          <View style={s.summaryDivider} />

          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <Text style={s.smallLabel}>Reservation Date</Text>
              <Text style={s.dateVal}>{reservedDate}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.smallLabel}>Expected Visit</Text>
              <Text style={s.dateVal}>{expectedVisit}</Text>
            </View>
          </View>
        </View>

        {/* TIMELINE */}
        <Text style={s.sectionTitle}>Reservation Timeline</Text>
        <Timeline steps={steps} />

        {/* CUSTOMER INFO */}
        <InfoCard title="Customer Information">
          <InfoRow icon="person-outline"   label="Customer Name"  value={buyerName} />
          <InfoRow icon="card-outline"     label="CNIC Number"    value={cnic} />
          <InfoRow icon="call-outline"     label="Mobile Number"  value={phone} />
          <InfoRow icon="mail-outline"     label="Email Address"  value={email} />
          <InfoRow icon="location-outline" label="City"           value={city} last />
          <TouchableOpacity style={s.docsBtn} onPress={() => setShowDocs(true)}>
            <Ionicons name="document-text-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={s.docsBtnTxt}>View Customer Documents</Text>
          </TouchableOpacity>
        </InfoCard>

        {/* VEHICLE INFO */}
        <InfoCard title="Vehicle Information">
          <Image source={{ uri: vehicleImage }} style={s.vehicleImg} resizeMode="cover" />
          <InfoRow label="Brand / Model" value={vehicleName} />
          <InfoRow label="Variant"       value={vehicleVariant} />
          <InfoRow label="Year"          value={vehicleYear} />
          <InfoRow label="Color"         value={vehicleColor} colorDot />
          <InfoRow label="Fuel Type"     value="Petrol" last />
        </InfoCard>

        {/* PRICE BREAKDOWN */}
        <View style={s.priceCard}>
          <LinearGradient colors={["rgba(22,64,136,0.2)","transparent"]} start={{x:0.5,y:0}} end={{x:0.5,y:0.5}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          <Text style={s.priceCardTitle}>Price Breakdown</Text>
          <PriceRow label="Vehicle Price (On Road)"    value={vehiclePrice} />
          <PriceRow label="Reservation Amount Paid"   value={`- ${reservedAmount}`} color="#ff4050" />
          <View style={s.priceDivider} />
          <Text style={s.totalPrice}>{vehiclePrice}</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[s.priceLabel, { color: ORANGE, fontSize: 13, fontFamily: "Poppins_600SemiBold" }]}>Remaining Amount</Text>
            <Text style={[s.priceValue, { color: ORANGE, fontSize: 16, fontFamily: "Poppins_700Bold" }]}>
              PKR {(() => {
                const total = parseInt((vehiclePrice || "").replace(/\D/g, "")) || 1450000;
                const paid  = parseInt((reservedAmount || "").replace(/\D/g, "")) || 10000;
                return (total - paid).toLocaleString();
              })()}
            </Text>
          </View>
        </View>

        {/* DEALER NOTES */}
        <View style={s.notesCard}>
          <Text style={s.notesTitleHeader}>Internal Dealer Notes</Text>
          <View style={s.notesInner}>
            <Note text="Customer requested their preferred color." />
            <Note text="Delivery expected within 5 working days." />
            <Note text="Reservation confirmed by phone." />
            <Note text="Customer will visit dealership on scheduled date." />
          </View>
        </View>

        {/* CANCEL */}
        <TouchableOpacity style={s.cancelBtn}>
          <Text style={s.cancelTxt}>Cancel Reservation</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <DocumentsModal
        visible={showDocs}
        onClose={() => setShowDocs(false)}
        buyerId={buyerId}
        token={token}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },

  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 60 },
  backBtn:     { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: C.textPrimary, fontSize: 17, fontFamily: "Poppins_600SemiBold" },
  printBtn:    { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  summaryCard:   { marginTop: 8, padding: 16, borderRadius: 16, borderWidth: 1.3, borderColor: "rgba(226,103,27,0.45)", backgroundColor: C.glassBg, overflow: "hidden" },
  summaryTop:    { flexDirection: "row", justifyContent: "space-between" },
  smallLabel:    { color: "#B7B4C9", fontSize: 9, letterSpacing: 0.5, marginBottom: 4, fontFamily: "Poppins_400Regular" },
  resId:         { color: C.textPrimary, fontSize: 16, fontFamily: "Poppins_700Bold" },
  statusBadge:   { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginTop: 4 },
  statusTxt:     { fontSize: 10, fontFamily: "Poppins_700Bold" },
  summaryDivider:{ height: 1, backgroundColor: "rgba(255,255,255,0.07)", marginVertical: 14 },
  dateVal:       { color: C.textPrimary, fontSize: 12, fontFamily: "Poppins_500Medium", marginTop: 2, lineHeight: 18 },

  sectionTitle:  { color: C.textPrimary, fontSize: 15, fontFamily: "Poppins_700Bold", marginTop: 28, marginBottom: 16, paddingHorizontal: 4 },

  timeline:      { paddingHorizontal: 4, marginBottom: 8 },
  timelineItem:  { minHeight: 52, flexDirection: "row", position: "relative" },
  timelineCircle:{ width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 2, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", zIndex: 2, flexShrink: 0 },
  timelineCircleDone:{ backgroundColor: ORANGE, borderColor: ORANGE },
  timelineLine:  { position: "absolute", width: 2, left: 10, top: 22, bottom: 0, backgroundColor: "rgba(255,255,255,0.1)" },
  timelineLineDone:  { backgroundColor: ORANGE },
  timelineContent:   { marginLeft: 14, marginTop: -2, flex: 1, paddingBottom: 14 },
  timelineTitle:     { color: C.textPrimary, fontSize: 13, fontFamily: "Poppins_600SemiBold", marginBottom: 3 },
  timelineDate:      { color: C.textSecondary, fontSize: 10, fontFamily: "Poppins_400Regular" },

  infoCard:      { marginTop: 12, borderWidth: 1, borderColor: "rgba(100,160,255,0.2)", borderRadius: 14, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12, backgroundColor: "#010A1F", overflow: "hidden" },
  infoCardTitle: { color: C.textPrimary, fontSize: 15, fontFamily: "Poppins_700Bold", marginBottom: 10 },
  infoRow:       { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  infoLabelWrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  infoLabel:     { color: C.textSecondary, fontSize: 11, fontFamily: "Poppins_400Regular" },
  infoValue:     { color: C.textSecondary, fontSize: 11, fontFamily: "Poppins_400Regular", textAlign: "right" },
  colorDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: "#F3F3F3", marginRight: 6 },
  docsBtn:       { height: 42, borderRadius: 22, marginTop: 12, backgroundColor: "#0C3C82", alignItems: "center", justifyContent: "center" },
  docsBtnTxt:    { color: C.textPrimary, fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  vehicleImg:    { width: "100%", height: 190, borderRadius: 10, marginBottom: 10 },

  priceCard:      { marginTop: 14, borderWidth: 1, borderColor: "rgba(100,160,255,0.3)", borderRadius: 14, padding: 14, backgroundColor: "#010A1F", overflow: "hidden" },
  priceCardTitle: { color: C.textSecondary, fontSize: 15, fontFamily: "Poppins_700Bold", marginBottom: 14 },
  priceRow:       { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  priceLabel:     { color: C.textSecondary, fontSize: 12, fontFamily: "Poppins_400Regular" },
  priceValue:     { color: C.textPrimary, fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  priceDivider:   { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginBottom: 10 },
  totalPrice:     { color: C.textPrimary, fontSize: 13, fontFamily: "Poppins_700Bold", marginBottom: 16 },

  notesCard:        { marginTop: 14, borderRadius: 14, borderWidth: 1, borderColor: "rgba(100,160,255,0.2)", backgroundColor: "#010A1F", overflow: "hidden" },
  notesTitleHeader: { color: C.textPrimary, fontSize: 15, fontFamily: "Poppins_700Bold", backgroundColor: "rgba(226,103,27,0.2)", paddingHorizontal: 16, paddingVertical: 14 },
  notesInner:       { margin: 14, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  noteRow:          { flexDirection: "row", marginBottom: 12 },
  bullet:           { color: ORANGE, fontSize: 16, marginRight: 8, lineHeight: 18 },
  noteText:         { color: C.textSecondary, fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 18, flex: 1 },

  cancelBtn: { marginTop: 14, height: 42, borderRadius: 22, borderWidth: 1, borderColor: "rgba(100,160,255,0.4)", backgroundColor: "rgba(9,36,92,0.5)", alignItems: "center", justifyContent: "center" },
  cancelTxt: { color: C.textSecondary, fontSize: 13, fontFamily: "Poppins_500Medium" },
});
