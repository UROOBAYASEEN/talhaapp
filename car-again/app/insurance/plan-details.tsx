import React from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE } from "@/constants/api";
import { AppColors, useAppColors } from "@/constants/theme";
const SERVER = API_BASE.replace('/api/v1','');
function resolveUrl(u?:string|null){ if(!u) return ''; if(u.startsWith('http')) return u; return `${SERVER}${u}`; }

const BG     = "#010a1f";
const CARD   = "#020d24";
const WHITE  = "#f9fafc";
const SUB    = "#baacb6";
const ORANGE = "#e2671b";
const BORDER = "#1a3a6a";

const claimSteps = [
  "Report Incident via App",
  "Upload Photos & File",
  "Assessment Within 48h",
  "Claim/Repair or Reimbursement",
];

export default function PlanDetails() {
  const router = useRouter();
  const aC = useAppColors();
  const params = useLocalSearchParams<{
    planId?: string; claimId?: string; company?: string; rating?: string;
    claims?: string; rate?: string; premium?: string;
    badge?: string; features?: string; trackerAdded?: string; avatarUrl?: string;
    has_tracker?: string; selected_addons?: string;
  }>();

  const company      = params.company     || "Insurance Company";
  const rating       = params.rating      || "—";
  const claims       = params.claims      || "—";
  const rate         = params.rate        || "—";
  const premium      = Number(params.premium || 0);
  const badge        = params.badge       || "";
  const features: string[] = params.features ? JSON.parse(params.features) : ["Comprehensive", "Third Party Liability", "Fire & Theft"];
  const initials     = company.slice(0, 3).toUpperCase();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      <View style={[styles.container, { backgroundColor: aC.bg }]}>

        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomColor: aC.isDark ? "rgba(255,255,255,0.08)" : "rgba(3,42,105,0.08)" }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={23} color={aC.isDark ? WHITE : '#010a1f'} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Plan Details</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { backgroundColor: aC.bg }]}
          style={{ backgroundColor: aC.bg }}
        >

          {/* ── Insurance Summary Card — orange top border, blue bottom border ── */}
          <LinearGradient
            colors={aC.isDark ? ['transparent', 'rgba(226,103,27,0.25)', '#e2671b'] : ['transparent', 'rgba(226,103,27,0.15)', '#e2671b']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={{ borderRadius: 18, padding: 1.5 }}
          >
          <View style={[styles.insuranceCard, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderWidth: 0, shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
            {aC.isDark ? (
              <>
                <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              </>
            ) : (
              <>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              </>
            )}
            <View style={styles.insuranceTopRow}>
              {params.avatarUrl ? (
                <Image source={{ uri: resolveUrl(params.avatarUrl) }} style={[styles.logo, { overflow:'hidden', backgroundColor: aC.isDark ? "#032a69" : "#eef2ff", borderColor: aC.isDark ? BORDER : "rgba(3,42,105,0.12)" }]} />
              ) : (
                <View style={[styles.logo, { backgroundColor: aC.isDark ? "#032a69" : "#eef2ff", borderColor: aC.isDark ? BORDER : "rgba(3,42,105,0.12)" }]}>
                  <Text style={[styles.logoText, { color: aC.isDark ? WHITE : '#032a69' }]}>{initials}</Text>
                </View>
              )}

              <View style={styles.companyInfo}>
                <Text style={[styles.companyName, { color: aC.isDark ? WHITE : '#010a1f' }]}>{company}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color="#FFD700" />
                  <Text style={[styles.rating, { color: aC.isDark ? SUB : '#475569' }]}>{rating} • Claim {claims}%</Text>
                </View>
                {badge ? <Text style={{ color: ORANGE, fontSize: 10, fontFamily: "Poppins_600SemiBold", marginTop: 2 }}>{badge}</Text> : null}
              </View>

              <View style={styles.priceBox}>
                <Text style={[styles.priceLabel, { color: aC.isDark ? SUB : '#64748b' }]}>Annual</Text>
                <Text style={styles.price}>PKR {premium.toLocaleString()}</Text>
              </View>
            </View>

            <View style={[styles.cardDivider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.08)" : "rgba(3,42,105,0.08)" }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: aC.isDark ? SUB : '#64748b' }]}>Annual Rate</Text>
              <Text style={[styles.detailValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>{rate}%</Text>
            </View>

            <View style={[styles.cardDivider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.08)" : "rgba(3,42,105,0.08)" }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: aC.isDark ? SUB : '#64748b' }]}>Claim Success</Text>
              <Text style={[styles.detailValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>{claims}%</Text>
            </View>

            <View style={[styles.cardDivider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.08)" : "rgba(3,42,105,0.08)" }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: aC.isDark ? SUB : '#64748b' }]}>Total Amount</Text>
              <Text style={[styles.detailValue, { color: ORANGE }]}>PKR {premium.toLocaleString()} / Year</Text>
            </View>

          </View>
          </LinearGradient>

          {/* ── Key Features of Insurance ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Key Features of Insurance</Text>

            <Text style={[styles.description, { color: aC.isDark ? SUB : '#475569' }]}>
              Free roadside assistance, 150+ cashless workshops, windshield
              replacement up to insured value and more coverage options.
            </Text>

            <View style={styles.featuresList}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={12} color={aC.isDark ? WHITE : '#fff'} />
                  </View>
                  <Text style={[styles.featureText, { color: aC.isDark ? WHITE : '#010a1f' }]}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Key Features of Tracker ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Key Features of Tracker</Text>

            <View style={styles.trackerFeatures}>
              <View style={styles.trackerItem}>
                <View style={[styles.trackerIconCircle, { backgroundColor: aC.isDark ? CARD : '#eef2ff', borderColor: aC.isDark ? WHITE : 'rgba(3,42,105,0.12)' }]}>
                  <Ionicons name="car-outline" size={24} color={aC.isDark ? WHITE : '#032a69'} />
                </View>
                <Text style={[styles.trackerText, { color: aC.isDark ? SUB : '#475569' }]}>{"Vehicle\nProtection"}</Text>
              </View>

              <View style={styles.trackerItem}>
                <View style={[styles.trackerIconCircle, { backgroundColor: aC.isDark ? CARD : '#eef2ff', borderColor: aC.isDark ? WHITE : 'rgba(3,42,105,0.12)' }]}>
                  <Ionicons name="shield-checkmark-outline" size={24} color={aC.isDark ? WHITE : '#032a69'} />
                </View>
                <Text style={[styles.trackerText, { color: aC.isDark ? SUB : '#475569' }]}>{"Geo-Fencing\nAlerts"}</Text>
              </View>

              <View style={styles.trackerItem}>
                <View style={[styles.trackerIconCircle, { backgroundColor: aC.isDark ? CARD : '#eef2ff', borderColor: aC.isDark ? WHITE : 'rgba(3,42,105,0.12)' }]}>
                  <Ionicons name="location-outline" size={24} color={aC.isDark ? WHITE : '#032a69'} />
                </View>
                <Text style={[styles.trackerText, { color: aC.isDark ? SUB : '#475569' }]}>{"Real Time\nTracking"}</Text>
              </View>
            </View>
          </View>

          {/* ── Claim Process ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Claim Process</Text>

            <View style={styles.claimList}>
              {claimSteps.map((step, index) => (
                <View key={index} style={styles.claimRow}>
                  <LinearGradient
                    colors={["#032a69", "#1a6fd4"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.stepCircle}
                  >
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  </LinearGradient>
                  <Text style={[styles.stepText, { color: aC.isDark ? WHITE : '#010a1f' }]}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Buy Insurance Button ── */}
          <TouchableOpacity
            activeOpacity={0.87}
            style={styles.buyButton}
            onPress={() => router.push({
              pathname: '/insurance/application-submit' as any,
              params: {
                planId:   params.planId   || '',
                claimId:  params.claimId  || '',
                company,
                avatarUrl: params.avatarUrl || '',
                premium:  String(premium),
                rate,
                features: params.features || '[]',
                has_tracker: params.has_tracker || 'false',
                selected_addons: params.selected_addons || '[]',
              },
            })}

          >
            <LinearGradient
              colors={["#032a69", "#e2671b"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buyGradient}
            >
              <Text style={styles.buyButtonText}>Buy Insurance</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    height: 80, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 18,
    paddingTop: 24,
    borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backButton:   { width: 35, height: 35, justifyContent: "center", alignItems: "flex-start" },
  headerTitle:  { fontSize: 17, fontFamily: "Poppins_600SemiBold", color: WHITE },
  headerSpacer: { width: 35 },

  // Scroll
  scrollContent: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 30, gap: 0 },

  // Insurance Card
  insuranceCard: {
    backgroundColor: 'rgba(3,12,40,0.6)', borderRadius: 15,
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    paddingHorizontal: 14, paddingVertical: 12,
    overflow: 'hidden',
  },
  insuranceTopRow: { flexDirection: "row", alignItems: "center" },
  logo: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#032a69", borderWidth: 1, borderColor: BORDER,
    justifyContent: "center", alignItems: "center", marginRight: 10,
  },
  logoText:    { color: WHITE, fontSize: 10, fontFamily: "Poppins_700Bold" },
  companyInfo: { flex: 1 },
  companyName: { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold", marginBottom: 3 },
  ratingRow:   { flexDirection: "row", alignItems: "center" },
  rating:      { color: SUB, fontSize: 11, fontFamily: "Poppins_400Regular", marginLeft: 4 },
  priceBox:    { alignItems: "flex-end" },
  priceLabel:  { color: SUB, fontSize: 10, fontFamily: "Poppins_400Regular", marginBottom: 2 },
  price:       { color: ORANGE, fontSize: 13, fontFamily: "Poppins_700Bold" },
  cardDivider: { height: 0.5, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 8 },
  detailRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 22 },
  detailLabel: { color: SUB, fontSize: 12, fontFamily: "Poppins_400Regular" },
  detailValue: { color: WHITE, fontSize: 12, fontFamily: "Poppins_500Medium" },

  // Sections
  section:      { marginTop: 20 },
  sectionTitle: { color: WHITE, fontSize: 15, fontFamily: "Poppins_700Bold", marginBottom: 10 },
  description:  { color: SUB, fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 18, marginBottom: 12 },

  // Insurance Features
  featuresList: { gap: 10 },
  featureRow:   { flexDirection: "row", alignItems: "center", gap: 10 },
  checkCircle:  {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: ORANGE, justifyContent: "center", alignItems: "center",
  },
  featureText: { color: WHITE, fontSize: 13, fontFamily: "Poppins_400Regular" },

  // Tracker
  trackerFeatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  trackerItem:     { width: "31%", alignItems: "center" },
  trackerIconCircle: {
    width: 58, height: 58, borderRadius: 29,
    borderWidth: 1.5, borderColor: WHITE,
    justifyContent: "center", alignItems: "center",
    marginBottom: 8, backgroundColor: CARD,
  },
  trackerText: { color: SUB, fontSize: 11, fontFamily: "Poppins_400Regular", lineHeight: 15, textAlign: "center" },

  // Claim Process
  claimList: { marginTop: 6, gap: 12 },
  claimRow:  { flexDirection: "row", alignItems: "center", gap: 12 },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: "center", alignItems: "center",
    overflow: "hidden",
  },
  stepNumber: { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  stepText:   { color: WHITE, fontSize: 13, fontFamily: "Poppins_400Regular", flex: 1 },

  // Buy Button
  buyButton:     { borderRadius: 32, overflow: "hidden", marginTop: 24 },
  buyGradient:   { height: 52, justifyContent: "center", alignItems: "center" },
  buyButtonText: { color: WHITE, fontSize: 16, fontFamily: "Poppins_600SemiBold" },

  bottomSpace: { height: 20 },
});
