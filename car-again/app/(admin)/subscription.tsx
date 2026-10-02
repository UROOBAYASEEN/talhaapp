import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, BadgeCheck } from "lucide-react-native";
import { PillGlow } from "@/components/dealer/DealerUI";
import AdminFooter from "@/components/admin/AdminFooter";
import { useAppColors } from '@/constants/theme';
import { SavedCardEffect } from "@/components/shared/FigmaEffects";

const WHITE = "#F4F5F7";
const ORANGE = "#E2671B";

const OVERVIEW = [
  { label: "Total Dealers",            value: "142" },
  { label: "Active Subscriptions",     value: "118" },
  { label: "Expired / Cancelled",      value: "24"  },
];

const FILTERS = ["All", "Subscriptions", "Extra Listing"];

const PAYMENTS = [
  { id: 1, name: "Honda Khair",     tag: "Official Dealer", amount: "45,000", txn: "TXN-20260807021", time: "09:45 PM", status: "Completed", accent: "#c0392b" },
  { id: 2, name: "Kia Corporation", tag: "Official Dealer", amount: "35,000", txn: "TXN-20260807021", time: "09:45 PM", status: "Completed", accent: "#7f1d1d" },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const [filter, setFilter] = useState("All");

  return (
    <View style={[styles.container, { backgroundColor: aC.bg }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>

        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color={aC.isDark ? "rgba(255,255,255,0.9)" : "#010a1f"} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Subscription Payment</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* OVERVIEW */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Overview</Text>
          <View style={styles.overviewGrid}>
            {OVERVIEW.map(item => (
              <View key={item.label} style={[styles.overviewCard, { overflow: "hidden", backgroundColor: aC.isDark ? "#061B4A" : "#ffffff", borderColor: aC.isDark ? "rgba(100,160,255,0.2)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
                {aC.isDark ? (
                  <SavedCardEffect band={12} />
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <Text style={[styles.overviewLabel, { color: aC.isDark ? "#8090B0" : "#475569" }]}>{item.label}</Text>
                <Text style={[styles.overviewValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* FILTERS */}
          <View style={styles.filterRow}>
            {FILTERS.map(f => {
              const active = filter === f;
              return (
                <TouchableOpacity
                  key={f} onPress={() => setFilter(f)}
                  style={[styles.filterChip, { backgroundColor: aC.isDark ? (active ? "#05122A" : "#0B2358") : (active ? 'rgba(226,103,27,0.08)' : '#ffffff'), borderColor: aC.isDark ? (active ? "#7F98C4" : "transparent") : (active ? ORANGE : "rgba(3,42,105,0.12)"), overflow: "hidden" } , active && styles.filterChipActive]}
                >
                  {active && aC.isDark && <PillGlow />}
                  <Text style={[styles.filterTxt, { color: active ? ORANGE : (aC.isDark ? "#8090B0" : "#475569") }, active && styles.filterTxtActive]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* RECENT PAYMENTS */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Recent Subscription Payments</Text>
          <View style={styles.paymentsList}>
            {PAYMENTS.filter(p => filter === "All" || p.tag.toLowerCase().includes(filter.toLowerCase())).map(p => (
              <View key={p.id} style={[styles.paymentCard, { overflow: "hidden", backgroundColor: aC.isDark ? "#061B4A" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
                {aC.isDark ? (
                  <SavedCardEffect band={12} />
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}

                {/* TOP ROW */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.logoBadge, { borderColor: p.accent }]}>
                    <Text style={[styles.logoInitial, { color: p.accent }]}>
                      {p.name.trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.cardName, { color: aC.isDark ? WHITE : '#010a1f' }]}>{p.name}</Text>
                      <BadgeCheck size={14} color="#3B82F6" strokeWidth={1.8} />
                    </View>
                    <View style={[styles.tagBadge, { backgroundColor: aC.isDark ? "rgba(226,103,27,0.1)" : "rgba(226,103,27,0.08)" }]}>
                      <Text style={styles.tagTxt}>{p.tag}</Text>
                    </View>
                    <Text style={[styles.txnTxt, { marginTop: 4, color: aC.isDark ? "#8090B0" : "#475569" }]}>{p.txn}</Text>
                    <Text style={[styles.timeTxt, { color: aC.isDark ? "#8090B0" : "#475569" }]}>{p.time}</Text>
                  </View>

                  <View style={styles.amountBox}>
                    <Text style={[styles.pkrLabel, { color: aC.isDark ? "#8090B0" : "#475569" }]}>PKR</Text>
                    <Text style={[styles.amountVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>{p.amount}</Text>
                    <View style={styles.statusRow}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusTxt}>{p.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <AdminFooter active="payments" />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#010A1F" },
  safeArea:  { flex: 1, backgroundColor: "#010A1F" },

  header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, marginTop: 4 },
  backBtn:     { width: 36, height: 44, justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 17, fontFamily: "Poppins_600SemiBold" },

  scroll: { paddingHorizontal: 20 },

  sectionTitle: { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold", marginBottom: 12 },

  overviewGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  overviewCard: {
    flex: 1, backgroundColor: "#061B4A", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(100,160,255,0.2)",
    paddingHorizontal: 10, paddingVertical: 8, alignItems: "center",
  },
  overviewLabel: { color: "#8090B0", fontSize: 10, fontFamily: "Poppins_400Regular", textAlign: "center", marginBottom: 8, lineHeight: 14 },
  overviewValue: { color: WHITE, fontSize: 20, fontFamily: "Poppins_700Bold" },

  filterRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  filterChip: {
    paddingHorizontal: 20, height: 46, justifyContent: "center", borderRadius: 16,
    borderWidth: 1, borderColor: "#232B45", backgroundColor: "#061B4A",
  },
  filterChipActive: { borderColor: "rgba(100,160,255,0.4)" },
  filterTxt:        { color: "#8090B0", fontSize: 13, fontFamily: "Poppins_500Medium" },
  filterTxtActive:  { color: ORANGE },

  paymentsList: { gap: 14 },
  paymentCard: {
    backgroundColor: "#061B4A", borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(100,160,255,0.5)", padding: 10,
  },

  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  logoBadge: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 2,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  logoInitial: { fontSize: 14, fontFamily: "Poppins_700Bold" },

  cardInfo:  { flex: 1 },
  nameRow:   { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  cardName:  { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  tagBadge:  {
    alignSelf: "flex-start", backgroundColor: "rgba(226,103,27,0.1)",
    borderWidth: 1, borderColor: "rgba(226,103,27,0.3)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  tagTxt:    { color: ORANGE, fontSize: 11, fontFamily: "Poppins_600SemiBold" },

  amountBox: { alignItems: "flex-end", flexShrink: 0 },
  pkrLabel:  { color: "#8090B0", fontSize: 11, fontFamily: "Poppins_400Regular" },
  amountVal: { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold" },

  cardBottomRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  txnTxt:    { color: "#8090B0", fontSize: 11, fontFamily: "Poppins_400Regular" },
  timeTxt:   { color: "#8090B0", fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#34D399" },
  statusTxt: { color: "#34D399", fontSize: 13, fontFamily: "Poppins_500Medium" },
});
