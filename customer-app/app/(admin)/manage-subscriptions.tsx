import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Check, Trash2 } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import AdminFooter from "@/components/admin/AdminFooter";
import { API_BASE } from "@/constants/api";
import { useAppColors } from '@/constants/theme';
import { SavedCardEffect } from "@/components/shared/FigmaEffects";
import { Ionicons } from "@expo/vector-icons";

const WHITE = "#F4F5F7";
const ORANGE = "#E2671B";

type Plan = {
  id:            string;
  name:          string;
  tagline:       string;
  description:   string;
  monthly_price: number;
  yearly_price:  number | null;
  features:      string[];
  role_for:      string | null;
  is_popular:    boolean;
  color:         string;
};

function fmt(price: number) {
  if (price === 0) return 'Custom';
  return `PKR ${price.toLocaleString('en-PK')}`;
}

export default function ManageSubscriptionsScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const [plans,   setPlans]   = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      const res   = await fetch(`${API_BASE}/plans/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPlans(await res.json());
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  async function handleDelete(plan: Plan) {
    Alert.alert("Delete Plan", `Remove "${plan.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            const token = await SecureStore.getItemAsync("access_token");
            await fetch(`${API_BASE}/plans/${plan.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            setPlans(p => p.filter(x => x.id !== plan.id));
          } catch { Alert.alert("Error", "Could not delete."); }
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: aC.bg }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>

        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color={aC.isDark ? "rgba(255,255,255,0.9)" : "#010a1f"} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Add Plans</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(admin)/add-plan' as any)}>
            <Plus size={24} color={ORANGE} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={ORANGE} size="large" style={{ marginTop: 60 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {plans.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyTxt, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>No plans yet</Text>
                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={() => router.push('/(admin)/add-plan' as any)}
                >
                  <LinearGradient colors={["#032A69", "#E2671B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 25 }]} />
                  <Plus size={16} color="#fff" />
                  <Text style={styles.createBtnTxt}>Create First Plan</Text>
                </TouchableOpacity>
              </View>
            ) : (
              plans.map(plan => (
                <View key={plan.id} style={[styles.planCard, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(230,225,232,0.3)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
                  {aC.isDark ? null : (
                    <>
                      <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                      <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    </>
                  )}

                  {/* Name + tagline */}
                  <Text style={[styles.planName, { color: aC.isDark ? "#C9BDC4" : plan.color }]}>{plan.name}</Text>
                  {plan.tagline ? <Text style={[styles.planTagline, { color: aC.isDark ? "#C9BDC4" : "#475569" }]}>{plan.tagline}</Text> : null}
                  {plan.role_for && (
                    <View style={[styles.roleBadge, { backgroundColor: aC.isDark ? "rgba(100,160,255,0.15)" : "rgba(3,42,105,0.06)", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)" }]}>
                      <Text style={[styles.roleTxt, { color: aC.isDark ? "#64A0FF" : "#032a69" }]}>{plan.role_for}</Text>
                    </View>
                  )}

                  {/* Plan icon */}
                  <View style={styles.planIcon}>
                    <Ionicons name="paper-plane" size={30} color={ORANGE} />
                  </View>

                  {/* Price */}
                  <Text style={[styles.priceVal, { color: aC.isDark ? "#C9BDC4" : '#010a1f' }]}>{fmt(plan.monthly_price)}</Text>
                  <Text style={[styles.pricePer, { color: aC.isDark ? "#C9BDC4" : "#475569" }]}>/ month</Text>
                  {plan.yearly_price ? (
                    <Text style={[styles.yearlyVal, { color: aC.isDark ? "#8090B0" : "#475569" }]}>{fmt(plan.yearly_price)} / yr</Text>
                  ) : null}

                  {plan.description ? (
                    <Text style={[styles.planDesc, { color: aC.isDark ? "#8090B0" : "#475569" }]}>{plan.description}</Text>
                  ) : null}

                  {/* Features */}
                  {plan.features.length > 0 && (
                    <View style={styles.featuresList}>
                      {plan.features.map((f, i) => (
                        <View key={i} style={styles.featureRow}>
                          <View style={styles.checkCircle}>
                            <Check size={11} color="#fff" strokeWidth={3} />
                          </View>
                          <Text style={[styles.featureTxt, { color: aC.isDark ? "#C0C8DC" : "#475569" }]}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action buttons */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { overflow: "hidden" }]}
                      onPress={() => router.push({ pathname: '/(admin)/add-plan', params: { editId: plan.id } } as any)}
                    >
                      <LinearGradient colors={["#032A69", "#E2671B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                      <Text style={styles.actionBtnTxt}>Edit Plan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.deleteBtn, { borderColor: aC.isDark ? "rgba(255,68,68,0.4)" : "rgba(255,68,68,0.25)", backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]} onPress={() => handleDelete(plan)}>
                      <Trash2 size={18} color="#FF4444" strokeWidth={1.8} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        <AdminFooter active="actions" />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#010A1F" },
  safeArea:  { flex: 1, backgroundColor: "#010A1F" },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, marginTop: 4 },
  headerBtn:   { width: 36, height: 44, justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 18, fontFamily: "Poppins_500Medium" },

  scroll: { paddingHorizontal: 20 },

  emptyWrap:    { alignItems: "center", marginTop: 60, gap: 16 },
  emptyTxt:     { color: "#6B7A99", fontSize: 15, fontFamily: "Poppins_400Regular" },
  createBtn:    { flexDirection: "row", alignItems: "center", gap: 8, height: 46, paddingHorizontal: 24, borderRadius: 25, overflow: "hidden" },
  createBtnTxt: { color: WHITE, fontSize: 14, fontFamily: "Poppins_600SemiBold" },

  planCard: {
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(100,160,255,0.3)",
    backgroundColor: "#010A1F", padding: 18, marginBottom: 16,
  },
  cardTop:      { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  planName:     { fontSize: 22, fontFamily: "Poppins_600SemiBold" },
  planIcon:     { width: 76, height: 76, borderRadius: 38, backgroundColor: "#DCE8FB", alignItems: "center", justifyContent: "center", marginTop: 12 },
  planTagline:  { color: "#8090B0", fontSize: 14, fontFamily: "Poppins_400Regular", marginTop: 4 },
  roleBadge:    { alignSelf: "flex-start", marginTop: 6, backgroundColor: "rgba(100,160,255,0.15)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(100,160,255,0.3)" },
  roleTxt:      { color: "#64A0FF", fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  priceCol:     { alignItems: "flex-end" },
  priceVal:     { color: WHITE, fontSize: 32, fontFamily: "Poppins_700Bold", marginTop: 10 },
  pricePer:     { color: "#8090B0", fontSize: 15, fontFamily: "Poppins_400Regular", marginBottom: 10 },
  yearlyVal:    { color: "#8090B0", fontSize: 10, fontFamily: "Poppins_400Regular", marginTop: 2 },

  planDesc:     { color: "#8090B0", fontSize: 13, fontFamily: "Poppins_400Regular", marginBottom: 12 },

  featuresList: { gap: 8, marginBottom: 16 },
  featureRow:   { flexDirection: "row", alignItems: "center", gap: 10 },
  checkCircle:  { width: 22, height: 22, borderRadius: 11, backgroundColor: ORANGE, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  featureTxt:   { color: "#C0C8DC", fontSize: 15, fontFamily: "Poppins_400Regular", flex: 1 },

  actionRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  actionBtn:   { flex: 1, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  actionBtnTxt:{ color: WHITE, fontSize: 17, fontFamily: "Poppins_600SemiBold" },
  deleteBtn:   { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,68,68,0.4)", alignItems: "center", justifyContent: "center" },
});
