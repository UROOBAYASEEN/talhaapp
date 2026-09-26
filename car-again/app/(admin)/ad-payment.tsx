import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, TrendingUp, ImageIcon, Car } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import AdminFooter from "@/components/admin/AdminFooter";
import { API_BASE } from "@/constants/api";
import { useAppColors } from '@/constants/theme';

const WHITE  = "#F4F5F7";
const ORANGE = "#E2671B";

const FILTERS = ["All", "Banner Ads", "Video Ads", "Boosted Ads"];

export default function AdPaymentScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const [filter,   setFilter]   = useState("All");
  const [data,     setData]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);

  const fetchData = useCallback(async (f: string) => {
    try {
      setLoading(true);
      const token  = await SecureStore.getItemAsync("access_token");
      const params = f !== "All" ? `?ad_type=${encodeURIComponent(f)}` : "";
      const res    = await fetch(`${API_BASE}/admin/ad-payments${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(filter); }, [filter, fetchData]);

  return (
    <View style={[styles.container, { backgroundColor: aC.bg }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>

        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color={aC.isDark ? "rgba(255,255,255,0.9)" : "#010a1f"} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Advertisement Payment</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* OVERVIEW CARD */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Overview</Text>
          <View style={[styles.overviewCard, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(100,160,255,0.3)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
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
            <View style={styles.overviewTopRow}>
              <Text style={[styles.overviewLabel, { color: aC.isDark ? "#8090B0" : "#475569" }]}>Total Advertisement Revenue</Text>
              <View style={styles.trendRow}>
                <TrendingUp size={13} color="#34D399" strokeWidth={1.8} />
              </View>
            </View>
            {loading
              ? <ActivityIndicator color={ORANGE} style={{ marginVertical: 8 }} />
              : <Text style={[styles.overviewAmount, { color: aC.isDark ? WHITE : '#010a1f' }]}>{data?.total_revenue ?? "PKR 0"}</Text>
            }
            <Text style={[styles.overviewSub, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>All time</Text>
          </View>

          {/* SUB STATS */}
          <View style={styles.statsGrid}>
            {(data?.stats ?? []).map((s: any) => (
              <View key={s.label} style={[styles.statCard, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(100,160,255,0.2)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
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
                <Text style={[styles.statLabel, { color: aC.isDark ? "#8090B0" : "#475569" }]}>{s.label}</Text>
                <Text style={[styles.statValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* FILTERS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map(f => {
              const active = filter === f;
              return (
                <TouchableOpacity
                  key={f} onPress={() => setFilter(f)}
                  style={[styles.filterChip, { backgroundColor: aC.isDark ? "#010A1F" : (active ? 'rgba(226,103,27,0.08)' : '#ffffff'), borderColor: aC.isDark ? "rgba(100,160,255,0.3)" : (active ? ORANGE : "rgba(3,42,105,0.12)") }, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterTxt, { color: active ? ORANGE : (aC.isDark ? "#8090B0" : "#475569") }, active && styles.filterTxtActive]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* RECENT PAYMENTS */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Recent Advertisement Payments</Text>
          {loading ? (
            <ActivityIndicator color={ORANGE} style={{ marginTop: 20 }} />
          ) : (data?.payments ?? []).length === 0 ? (
            <Text style={{ color: aC.isDark ? "#6B7A99" : "#475569", textAlign: "center", marginTop: 20, fontFamily: "Poppins_400Regular", fontSize: 13 }}>
              No payments found
            </Text>
          ) : (
            <View style={styles.paymentsList}>
              {(data?.payments ?? []).map((p: any) => (
                <View key={p.id} style={[styles.paymentCard, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(100,160,255,0.5)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
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
                  <View style={styles.cardRow}>
                    {/* THUMB */}
                    <View style={[styles.thumb, { backgroundColor: aC.isDark ? "#010A1F" : "#f1f5f9", borderColor: aC.isDark ? "#232B45" : "rgba(3,42,105,0.12)" }]}>
                      <LinearGradient colors={aC.isDark ? ["rgba(58,75,220,0.3)", "#0a0f1f"] : ["rgba(3,42,105,0.06)", "rgba(226,103,27,0.04)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                      {p.type === "Video Ad"
                        ? <Car size={22} color={aC.isDark ? "#6B7A99" : "#475569"} strokeWidth={1.5} />
                        : <ImageIcon size={20} color={aC.isDark ? "#6B7A99" : "#475569"} strokeWidth={1.5} />
                      }
                    </View>

                    {/* INFO */}
                    <View style={styles.cardInfo}>
                      <Text style={[styles.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={1}>{p.title}</Text>
                      <Text style={[styles.cardSub, { color: aC.isDark ? "#8090B0" : "#475569" }]} numberOfLines={1}>{p.subtitle}</Text>
                      <Text style={[styles.cardMeta, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>{p.date}</Text>
                    </View>

                    {/* AMOUNT + STATUS */}
                    <View style={styles.amountBox}>
                      <Text style={[styles.amountVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>{p.amount}</Text>
                      <View style={[styles.statusPill, p.status === "Success" ? styles.paidPill : styles.pendingPill]}>
                        {p.status === "Success"
                          ? <Text style={styles.paidTxt}>✓ Paid</Text>
                          : <Text style={styles.pendingTxt}>{p.status}</Text>
                        }
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

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
  sectionTitle: { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold", marginBottom: 10 },

  overviewCard: {
    borderRadius: 16, borderWidth: 1, borderColor: "rgba(100,160,255,0.3)",
    paddingHorizontal: 18, paddingVertical: 16, marginBottom: 14,
    backgroundColor: "#010A1F",
  },
  overviewTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  overviewLabel:  { color: "#8090B0", fontSize: 12, fontFamily: "Poppins_400Regular" },
  trendRow:       { flexDirection: "row", alignItems: "center", gap: 4 },
  trendTxt:       { color: "#34D399", fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  overviewAmount: { color: WHITE, fontSize: 22, fontFamily: "Poppins_700Bold" },
  overviewSub:    { color: "#6B7A99", fontSize: 11, fontFamily: "Poppins_400Regular", textAlign: "right", marginTop: 4 },

  statsGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: "#010A1F", borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(100,160,255,0.2)",
    paddingHorizontal: 6, paddingVertical: 10, alignItems: "center",
    justifyContent: "space-between", minHeight: 60,
  },
  statLabel: { color: "#8090B0", fontSize: 9, fontFamily: "Poppins_400Regular", textAlign: "center", lineHeight: 12 },
  statValue: { color: WHITE, fontSize: 14, fontFamily: "Poppins_700Bold", marginTop: 6 },

  filterRow: { gap: 8, paddingBottom: 16 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: "#232B45", backgroundColor: "#010A1F",
  },
  filterChipActive: { borderColor: "rgba(100,160,255,0.4)" },
  filterTxt:        { color: "#8090B0", fontSize: 12, fontFamily: "Poppins_500Medium" },
  filterTxtActive:  { color: ORANGE },

  paymentsList: { gap: 12 },
  paymentCard: {
    backgroundColor: "#010A1F", borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(100,160,255,0.5)", padding: 12,
  },

  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  thumb: {
    width: 60, height: 52, borderRadius: 12, overflow: "hidden",
    backgroundColor: "#010A1F", borderWidth: 1, borderColor: "#232B45",
    alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative",
  },
  kiaBox:        { backgroundColor: "#fff", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  kiaTxt:        { color: "#DC2626", fontSize: 11, fontFamily: "Poppins_700Bold", fontStyle: "italic" },
  thumbBadge:    { position: "absolute", top: 4, left: 4, backgroundColor: ORANGE, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  thumbBadgeTxt: { color: "#fff", fontSize: 8, fontFamily: "Poppins_600SemiBold" },

  cardInfo:  { flex: 1 },
  cardTitle: { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  cardSub:   { color: "#8090B0", fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 2 },
  cardMeta:  { color: "#6B7A99", fontSize: 10, fontFamily: "Poppins_400Regular", marginTop: 2 },

  amountBox:   { alignItems: "flex-end", gap: 6, flexShrink: 0 },
  amountVal:   { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  statusPill:  { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  paidPill:    { backgroundColor: "rgba(52,211,153,0.15)" },
  pendingPill: { backgroundColor: "rgba(226,103,27,0.15)" },
  paidTxt:     { color: "#34D399", fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  pendingTxt:  { color: ORANGE, fontSize: 11, fontFamily: "Poppins_600SemiBold" },
});
