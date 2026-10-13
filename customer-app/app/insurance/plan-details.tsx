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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PRIMARY_BTN_COLORS, WARM_CARD_COLORS, WARM_CARD_LOCATIONS } from "@/components/shared/FigmaEffects";
const SERVER = API_BASE.replace('/api/v1','');
function resolveUrl(u?:string|null){ if(!u) return ''; if(u.startsWith('http')) return u; return `${SERVER}${u}`; }

const BG     = "#010a1f";
const CARD   = "#020d24";
const WHITE  = "#f9fafc";
const SUB    = "#baacb6";
const ORANGE = "#e2671b";
const BORDER = "#1a3a6a";

const claimSteps = [
  "Report Incident In-App",
  "Upload Photos & FIR",
  "Assessment Within 48h",
  "Cashless Repair Or Reimbursement",
];

const DEFAULT_FEATURES = ["Accident Damage", "Theft", "Fire", "Flood", "Third Party Liability", "Windscreen", "Natural Disaster"];

const TRACKER_FEATURES = [
  { icon: "headset",            label: "Stolen Vehicle\nRecovery Assistance" },
  { icon: "map-marker-radius",  label: "Geo-Fencing\nAlerts" },
  { icon: "bell-alert-outline", label: "Ignition & Battery\nTampering Alerts" },
];

export default function PlanDetails() {
  const router = useRouter();
  const aC = useAppColors();
  const params = useLocalSearchParams<{
    planId?: string; claimId?: string; company?: string; rating?: string;
    claims?: string; rate?: string; premium?: string;
    badge?: string; features?: string; trackerAdded?: string; avatarUrl?: string;
    has_tracker?: string; selected_addons?: string;
    car_model?: string; market_value?: string;
  }>();

  const company      = params.company     || "Insurance Company";
  const rating       = params.rating      || "—";
  const claims       = params.claims      || "—";
  const rate         = params.rate        || "—";
  const premium      = Number(params.premium || 0);
  const badge        = params.badge       || "";
  const parsedFeatures: string[] = params.features ? JSON.parse(params.features) : [];
  const features: string[] = parsedFeatures.length ? parsedFeatures : DEFAULT_FEATURES;
  const initials     = company.slice(0, 3).toUpperCase();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      <View style={[styles.container, { backgroundColor: aC.bg }]}>

        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}>
          <TouchableOpacity activeOpacity={0.7} style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={aC.isDark ? "#C9C6D0" : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? "#F2F1F5" : '#010a1f' }]}>Plan Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { backgroundColor: aC.bg }]}
          style={{ backgroundColor: aC.bg }}
        >

          {/* ── Insurance Summary Card — border: orange (top) → blue (bottom) ── */}
          <LinearGradient
            colors={aC.isDark ? ['#E2671B', '#8A5A55', '#2E4F8E'] : ['rgba(3,42,105,0.12)', 'rgba(3,42,105,0.12)']}
            locations={aC.isDark ? [0, 0.5, 1] : undefined}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={{ borderRadius: 16, padding: 1 }}
          >
          <View style={[styles.insuranceCard, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff' }]}>
            {aC.isDark && <LinearGradient colors={WARM_CARD_COLORS as any} locations={WARM_CARD_LOCATIONS as any} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
            <View style={styles.insuranceTopRow}>
              {params.avatarUrl ? (
                <Image source={{ uri: resolveUrl(params.avatarUrl) }} style={[styles.logo, { overflow: 'hidden' }]} />
              ) : (
                <View style={styles.logo}>
                  <Text style={styles.logoText}>{initials}</Text>
                </View>
              )}
              <View style={styles.companyInfo}>
                <Text style={[styles.companyName, { color: aC.isDark ? "#F2F1F5" : '#010a1f' }]} numberOfLines={1}>{company}</Text>
                <Text style={[styles.planSub, { color: aC.isDark ? "#BAB6C4" : '#475569' }]} numberOfLines={1}>{badge || "Comprehensive · Gold Plan"}</Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={[styles.priceLabel, { color: aC.isDark ? "#BAB6C4" : '#64748b' }]}>Annual</Text>
                <Text style={styles.price}>PKR {premium.toLocaleString()}</Text>
              </View>
            </View>

            {[
              { label: "Car Model",              value: params.car_model || "—" },
              { label: "Estimated Market Value", value: params.market_value || "—" },
              { label: "Final Amount",           value: `PKR ${premium.toLocaleString()}/year` },
            ].map((row, i, arr) => (
              <View key={row.label} style={[styles.detailRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(3,42,105,0.08)' }]}>
                <Text style={[styles.detailLabel, { color: aC.isDark ? "#E6E4EA" : '#475569' }]}>{row.label}</Text>
                <Text style={[styles.detailValue, { color: aC.isDark ? "#E6E4EA" : '#010a1f' }]}>{row.value}</Text>
              </View>
            ))}
          </View>
          </LinearGradient>

          {/* ── Key Features of Insurance ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: aC.isDark ? "#F2F1F5" : '#010a1f' }]}>Key Features Of Insurance</Text>
            <Text style={[styles.description, { color: aC.isDark ? "#C9C6D0" : '#475569' }]}>
              Free roadside assistance, 120+ cashless workshops nationwide, tracker discount up to 15%, and 24/7 claim support.
            </Text>
            <View style={styles.featuresList}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                  <Text style={[styles.featureText, { color: aC.isDark ? "#C9C6D0" : '#010a1f' }]}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Key Features of Tracker ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: aC.isDark ? "#F2F1F5" : '#010a1f' }]}>Key Features Of Tracker</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trackerFeatures}>
              {TRACKER_FEATURES.map(t => (
                <View key={t.label} style={styles.trackerItem}>
                  <View style={[styles.trackerIconCircle, { borderColor: aC.isDark ? "#E6E4EA" : 'rgba(3,42,105,0.3)' }]}>
                    <MaterialCommunityIcons name={t.icon as any} size={24} color={aC.isDark ? "#E6E4EA" : '#032a69'} />
                  </View>
                  <Text style={[styles.trackerText, { color: aC.isDark ? "#C9C6D0" : '#475569' }]}>{t.label}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ── Claim Process ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: aC.isDark ? "#F2F1F5" : '#010a1f' }]}>Claim Process</Text>
            <View style={styles.claimList}>
              {claimSteps.map((step, index) => (
                <View key={index} style={styles.claimRow}>
                  <View style={[styles.stepCircle, { backgroundColor: aC.isDark ? '#0B1D4A' : '#032a69' }]}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: aC.isDark ? "#F2F1F5" : '#010a1f' }]}>{step}</Text>
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
                car_model: params.car_model || '',
                badge,
              },
            })}

          >
            <LinearGradient
              colors={(aC.isDark ? PRIMARY_BTN_COLORS : ['#27467F', '#8C6A78', '#FF9654']) as any}
              locations={[0, 0.5, 1]}
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

  header:       { height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, marginTop: 20 },
  backButton:   { width: 36, height: 36, justifyContent: "center", alignItems: "flex-start" },
  headerTitle:  { fontSize: 19, fontFamily: "Poppins_500Medium" },
  headerSpacer: { width: 36 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 30 },

  insuranceCard:   { borderRadius: 15, paddingHorizontal: 12, paddingTop: 14, paddingBottom: 6, overflow: 'hidden' },
  insuranceTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  logo:        { width: 40, height: 40, borderRadius: 20, backgroundColor: "#12306A", borderWidth: 1, borderColor: "#8FAEE3", justifyContent: "center", alignItems: "center", marginRight: 12 },
  logoText:    { color: "#F2F1F5", fontSize: 11, fontFamily: "Poppins_500Medium" },
  companyInfo: { flex: 1 },
  companyName: { fontSize: 16, fontFamily: "Poppins_500Medium" },
  planSub:     { fontSize: 11.5, fontFamily: "Poppins_400Regular", marginTop: 1 },
  priceBox:    { alignItems: "flex-end" },
  priceLabel:  { fontSize: 12, fontFamily: "Poppins_400Regular" },
  price:       { color: ORANGE, fontSize: 15, fontFamily: "Poppins_500Medium" },
  detailRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  detailLabel: { fontSize: 11.5, fontFamily: "Poppins_400Regular" },
  detailValue: { fontSize: 11.5, fontFamily: "Poppins_400Regular" },

  section:      { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontFamily: "Poppins_500Medium", marginBottom: 8 },
  description:  { fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 19, marginBottom: 10 },

  featuresList: { gap: 12 },
  featureRow:   { flexDirection: "row", alignItems: "center", gap: 14 },
  checkCircle:  { width: 22, height: 22, borderRadius: 11, backgroundColor: ORANGE, justifyContent: "center", alignItems: "center" },
  featureText:  { fontSize: 12.5, fontFamily: "Poppins_400Regular" },

  trackerFeatures:   { gap: 18, paddingTop: 6, paddingRight: 10 },
  trackerItem:       { width: 124, alignItems: "center" },
  trackerIconCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: 1.5, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  trackerText:       { fontSize: 11.5, fontFamily: "Poppins_400Regular", lineHeight: 15, textAlign: "center" },

  claimList:  { marginTop: 4, gap: 14 },
  claimRow:   { flexDirection: "row", alignItems: "center", gap: 14 },
  stepCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  stepNumber: { color: "#F2F1F5", fontSize: 13, fontFamily: "Poppins_500Medium" },
  stepText:   { fontSize: 12.5, fontFamily: "Poppins_500Medium", flex: 1 },

  buyButton:     { borderRadius: 28, overflow: "hidden", marginTop: 24 },
  buyGradient:   { height: 50, justifyContent: "center", alignItems: "center" },
  buyButtonText: { color: "#EDEBF0", fontSize: 17, fontFamily: "Poppins_600SemiBold" },

  bottomSpace: { height: 20 },
});
