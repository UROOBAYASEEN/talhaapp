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
import { D, DHeader, OutlineCard, StatusPill, WarmCard } from "@/components/dealer/DealerUI";
import { SavedCardEffect, savedCardOuter } from "@/components/shared/FigmaEffects";
import { GlassButton, GradientButton } from "@/components/shared/GlowUI";

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
    <OutlineCard style={s.infoCard}>
      <Text style={s.infoCardTitle}>{title}</Text>
      {children}
    </OutlineCard>
  );
}

/* ── Info Row ── */
function InfoRow({ icon, label, value, last = false, colorDot = false }: any) {
  return (
    <View style={[s.infoRow, !last && s.infoRowBorder]}>
      <View style={s.infoLabelWrap}>
        {icon && <Ionicons name={icon} size={20} color={ORANGE} style={{ marginRight: 12 }} />}
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

  const [open, setOpen] = useState<string | null>(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 16 }}>
        <View style={[savedCardOuter, { borderRadius: 24, maxHeight: '85%', borderColor: 'rgba(60,100,180,0.8)' }]}>
          <SavedCardEffect band={24} />

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 22, paddingBottom: 12 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_600SemiBold' }}>Customer Documents</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={30} color={ORANGE} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 26, gap: 16 }} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator color={ORANGE} style={{ marginTop: 40, marginBottom: 40 }} />
            ) : docs.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
                <Ionicons name="document-outline" size={48} color="rgba(255,255,255,0.15)" />
                <Text style={{ color: AppColors.textSecondary, fontSize: 14, fontFamily: 'Poppins_500Medium' }}>No documents uploaded</Text>
                <Text style={{ color: AppColors.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', opacity: 0.6 }}>Customer has not submitted any documents yet</Text>
              </View>
            ) : (
              docs.map((doc, i) => {
                const key = String(doc.id || i);
                const isOpen = open === key;
                return (
                  <View key={key}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                      <View style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="document-text-outline" size={26} color={ORANGE} />
                      </View>
                      <Text style={{ flex: 1, color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_400Regular' }} numberOfLines={2}>{doc.desc || 'Document'}</Text>
                      <TouchableOpacity
                        onPress={() => setOpen(isOpen ? null : key)}
                        style={{ height: 36, paddingHorizontal: 22, borderRadius: 10, backgroundColor: '#1B2336', borderWidth: 1, borderColor: 'rgba(200,210,230,0.45)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ color: ORANGE, fontSize: 15, fontFamily: 'Poppins_500Medium' }}>{isOpen ? 'Hide' : 'View'}</Text>
                      </TouchableOpacity>
                    </View>
                    {isOpen && (
                      <View style={{ marginTop: 12 }}>
                        {doc.file_url
                          ? <DocImage url={doc.file_url} />
                          : <View style={{ height: 120, backgroundColor: '#061B4A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                              <Ionicons name="image-outline" size={32} color="#4B5A7A" />
                              <Text style={{ color: '#4B5A7A', fontSize: 11, marginTop: 6, fontFamily: 'Poppins_400Regular' }}>No image</Text>
                            </View>}
                        <Text style={{ color: doc.status === 'verified' ? '#27ae60' : ORANGE, fontSize: 11, fontFamily: 'Poppins_500Medium', marginTop: 6, textTransform: 'capitalize' }}>
                          {doc.status}{doc.uploaded_at ? ` • ${doc.uploaded_at}` : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
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
      <DHeader
        title="Reservation Details"
        right={
          <TouchableOpacity style={s.printBtn}>
            <Ionicons name="print-outline" size={28} color={ORANGE} />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* RESERVATION SUMMARY CARD */}
        <WarmCard style={s.summaryCard}>
          <View style={s.summaryTop}>
            <View>
              <Text style={s.smallLabel}>RESERVATION ID</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                <Text style={s.resId}>{reservationId}</Text>
                <Ionicons name="copy-outline" size={18} color="#E6E1E8" />
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.smallLabel}>STATUS</Text>
              <StatusPill label={status} tone={isConfirmed ? 'green' : 'orange'} style={{ marginTop: 4 }} />
            </View>
          </View>

          <View style={{ flexDirection: "row", marginTop: 18 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.smallLabel}>Reservation Date</Text>
              <Text style={s.dateVal}>{reservedDate}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.smallLabel}>Expected Visit</Text>
              <Text style={s.dateVal}>{expectedVisit}</Text>
            </View>
          </View>
        </WarmCard>

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
          <GradientButton title="View Customer Documents" height={50} fontSize={17} style={{ marginTop: 16 }} onPress={() => setShowDocs(true)} />
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
          <Text style={s.priceCardTitle}>Price Breakdown</Text>
          <PriceRow label="Vehicle Price (On Road)"    value={vehiclePrice} />
          <PriceRow label="Reservation Amount Paid"   value={`- ${reservedAmount}`} color="#E0363A" />
          <View style={s.priceDivider} />
          <Text style={s.totalPrice}>{vehiclePrice}</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[s.priceLabel, { color: ORANGE, fontSize: 16, fontFamily: "Poppins_500Medium" }]}>Remaining Amount</Text>
            <Text style={[s.priceValue, { color: ORANGE, fontSize: 18, fontFamily: "Poppins_700Bold" }]}>
              PKR {(() => {
                const total = parseInt((vehiclePrice || "").replace(/\D/g, "")) || 1450000;
                const paid  = parseInt((reservedAmount || "").replace(/\D/g, "")) || 10000;
                return (total - paid).toLocaleString();
              })()}
            </Text>
          </View>
        </View>

        {/* DEALER NOTES */}
        <WarmCard style={s.notesCard} colors={['#5A3526', '#3A2A35', '#101C45', '#0A1A45']} locations={[0, 0.3, 0.75, 1]}>
          <Text style={s.notesTitleHeader}>Internal Dealer Notes</Text>
          <View style={s.notesInner}>
            <Note text="Customer requested their preferred color." />
            <Note text="Delivery expected within 5 working days." />
            <Note text="Reservation confirmed by phone." />
            <Note text="Customer will visit dealership on scheduled date." />
          </View>
        </WarmCard>

        {/* CANCEL */}
        <GlassButton title="Cancel Reservation" height={48} fontSize={16} color="#E6E1E8" style={{ marginTop: 20, marginHorizontal: 34 }} onPress={() => {}} />

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
  safe:   { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },

  printBtn:    { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  summaryCard:   { marginTop: 8, paddingHorizontal: 18, paddingVertical: 18, borderRadius: 20 },
  summaryTop:    { flexDirection: "row", justifyContent: "space-between" },
  smallLabel:    { color: "#E6E1E8", fontSize: 12, letterSpacing: 0.8, marginBottom: 2, fontFamily: "Poppins_400Regular" },
  resId:         { color: "#FFFFFF", fontSize: 20, fontFamily: "Poppins_700Bold" },
  dateVal:       { color: "#FFFFFF", fontSize: 14, fontFamily: "Poppins_500Medium", marginTop: 2, lineHeight: 20 },

  sectionTitle:  { color: "#FFFFFF", fontSize: 17, fontFamily: "Poppins_600SemiBold", marginTop: 28, marginBottom: 16, paddingHorizontal: 12 },

  timeline:      { paddingHorizontal: 12, marginBottom: 8 },
  timelineItem:  { minHeight: 54, flexDirection: "row", position: "relative" },
  timelineCircle:{ width: 26, height: 26, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 3, borderColor: "#B9B4C4", alignItems: "center", justifyContent: "center", zIndex: 2, flexShrink: 0 },
  timelineCircleDone:{ backgroundColor: ORANGE, borderColor: ORANGE },
  timelineLine:  { position: "absolute", width: 2, left: 12, top: 26, bottom: 0, backgroundColor: "#B9B4C4" },
  timelineLineDone:  { backgroundColor: ORANGE },
  timelineContent:   { marginLeft: 16, marginTop: 0, flex: 1, paddingBottom: 12 },
  timelineTitle:     { color: "#FFFFFF", fontSize: 15, fontFamily: "Poppins_500Medium" },
  timelineDate:      { color: D.muted, fontSize: 12, fontFamily: "Poppins_400Regular" },

  infoCard:      { marginTop: 14, paddingTop: 20, paddingBottom: 16, borderRadius: 18 },
  infoCardTitle: { color: "#FFFFFF", fontSize: 17, fontFamily: "Poppins_600SemiBold", marginBottom: 8 },
  infoRow:       { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.12)" },
  infoLabelWrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  infoLabel:     { color: "#FFFFFF", fontSize: 14, fontFamily: "Poppins_400Regular" },
  infoValue:     { color: D.muted, fontSize: 14, fontFamily: "Poppins_400Regular", textAlign: "right" },
  colorDot:      { width: 16, height: 16, borderRadius: 8, backgroundColor: "#F3F3F3", marginRight: 8 },
  vehicleImg:    { width: "100%", height: 190, borderRadius: 12, marginBottom: 8, marginTop: 4 },

  priceCard:      { marginTop: 16, borderWidth: 1, borderColor: "rgba(230,225,232,0.6)", borderRadius: 18, padding: 18 },
  priceCardTitle: { color: "#C9BDC4", fontSize: 17, fontFamily: "Poppins_600SemiBold", marginBottom: 10 },
  priceRow:       { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  priceLabel:     { color: "#C9BDC4", fontSize: 14, fontFamily: "Poppins_400Regular" },
  priceValue:     { color: "#E6E1E8", fontSize: 14, fontFamily: "Poppins_500Medium" },
  priceDivider:   { height: 1, backgroundColor: "rgba(255,255,255,0.8)", marginVertical: 8 },
  totalPrice:     { color: "#FFFFFF", fontSize: 13, fontFamily: "Poppins_500Medium", marginBottom: 12 },

  notesCard:        { marginTop: 18, borderRadius: 18, paddingBottom: 16 },
  notesTitleHeader: { color: "#FFFFFF", fontSize: 16, fontFamily: "Poppins_600SemiBold", paddingHorizontal: 18, paddingTop: 20, paddingBottom: 12 },
  notesInner:       { marginHorizontal: 18, padding: 18, paddingBottom: 6, borderRadius: 12, borderWidth: 1, borderColor: "rgba(230,225,232,0.6)" },
  noteRow:          { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  bullet:           { color: ORANGE, fontSize: 18, marginRight: 12, lineHeight: 20 },
  noteText:         { color: "#FFFFFF", fontSize: 14, fontFamily: "Poppins_400Regular", lineHeight: 20, flex: 1 },
});
