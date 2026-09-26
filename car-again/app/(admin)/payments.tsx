import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "@/constants/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, BadgeCheck } from "lucide-react-native";
import AdminFooter from "@/components/admin/AdminFooter";
import { useAppColors } from '@/constants/theme';

const WHITE = "#F4F5F7";
const ORANGE = "#E2671B";

const SERVER_BASE = API_BASE.replace('/api/v1', '');
function avatarUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER_BASE}${url}`;
}

const ROLE_LABELS: Record<string, string> = {
  dealership_owner: "Dealer",
  individual_seller: "Seller",
  customer: "Customer",
  bank_representative: "Bank",
  insurance_provider: "Insurance",
  tracker_provider: "Tracker",
  admin: "Admin",
};

const OVERVIEW_FALLBACK = [
  { label: "Total Dealers", value: "0" },
  { label: "Active Subscriptions", value: "0" },
  { label: "Expired / Cancelled", value: "0" },
];

const FILTERS = ["All", "Subscription", "Ads", "Reserver", "Tracker", "Advertisement", "Promote Vehicle", "Insurance"];

// Display labels (spelling/label fix)
const FILTER_LABELS: Record<string, string> = {
  Reserver: "Reserver Vehicle",
};

const PAYMENTS: any[] = [];

export default function PaymentsScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const [filter, setFilter] = useState("All");
  const [live, setLive] = useState<any[]>([]);
  const [overview, setOverview] = useState(OVERVIEW_FALLBACK);
  const [companies, setCompanies] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("All");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("access_token");
        const r1 = await fetch(`${API_BASE}/admin/payments`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (r1.ok) { const d = await r1.json(); setLive(d.items || []); }
        const r2 = await fetch(`${API_BASE}/admin/payments/overview`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (r2.ok) {
          const o = await r2.json();
          setOverview([
            { label: "Total Dealers", value: String(o.total_dealers ?? 0) },
            { label: "Active Subscriptions", value: String(o.active_subscriptions ?? 0) },
            { label: "Expired / Cancelled", value: String(o.expired_cancelled ?? 0) },
          ]);
        }
        const r3 = await fetch(`${API_BASE}/sellers?role=tracker_provider`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (r3.ok) { const d3 = await r3.json(); setCompanies(Array.isArray(d3) ? d3 : d3.items || []); }
        // Dealers list (tracker jaisa — Reserver Vehicle chips ke liye)
        const r4 = await fetch(`${API_BASE}/sellers?role=dealership_owner&limit=100`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (r4.ok) { const d4 = await r4.json(); setDealers(Array.isArray(d4) ? d4 : d4.items || []); }
      } catch {}
    })();
  }, []);
  useEffect(() => { setSelectedCompany("All"); setSelectedMonth("All"); }, [filter]);
  useEffect(() => { setSelectedMonth("All"); }, [selectedCompany]);

  // Companies derived from payment tags: "Type • Company • Detail"
  function tagCompanies(type: string) {
    const seen = new Set<string>();
    const tags: string[] = [];
    [...PAYMENTS, ...live].filter(p => p.type === type).forEach(p => {
      const v = (p.tag || "").split("•")[1]?.trim();
      if (v && !seen.has(v)) { seen.add(v); tags.push(v); }
    });
    return tags.map(t => ({ id: t, business_name: t }));
  }

  // Months available for current insurance selection (month-wise filter)
  function insuranceMonths(): { id: string; label: string }[] {
    const seen = new Map<string, string>();
    [...PAYMENTS, ...live]
      .filter(p => p.type === "Insurance")
      .filter(p => selectedCompany === "All" || (p.tag || "").toLowerCase().includes(selectedCompany.toLowerCase()))
      .forEach(p => {
        if (p.month && !seen.has(p.month)) seen.set(p.month, p.month_label || p.month);
      });
    return [...seen.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([id, label]) => ({ id, label }));
  }
  return (
    <View style={[styles.container, { backgroundColor: aC.bg }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color={aC.isDark ? "rgba(255,255,255,0.9)" : "#010a1f"} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Payments</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Overview</Text>
          <View style={styles.overviewGrid}>
            {overview.map(item => (
              <View key={item.label} style={[styles.overviewCard, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(100,160,255,0.5)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={{ marginBottom: 12, marginHorizontal: -20, paddingHorizontal: 20 }}>
            {FILTERS.map(f => {
              const active = filter === f;
              return (
                <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterChip, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : (active ? 'rgba(226,103,27,0.08)' : '#ffffff'), borderColor: aC.isDark ? "rgba(100,160,255,0.3)" : (active ? ORANGE : "rgba(3,42,105,0.12)") }, active && styles.filterChipActive]}>
                  {active && aC.isDark && (<><LinearGradient colors={['rgba(22,64,136,0.3)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /><LinearGradient colors={['transparent', 'rgba(29,83,175,0.3)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /></>)}
                  <Text style={[styles.filterTxt, { color: active ? ORANGE : (aC.isDark ? "#8090B0" : "#475569") }, active && styles.filterTxtActive]}>{FILTER_LABELS[f] || f}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {(filter === "Tracker" || filter === "Reserver" || filter === "Insurance") && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }} style={{ marginBottom: 16, marginHorizontal: -20, paddingHorizontal: 20 }}>
              <TouchableOpacity onPress={() => setSelectedCompany("All")} style={[styles.filterChip, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : (selectedCompany === "All" ? 'rgba(226,103,27,0.08)' : '#ffffff'), borderColor: aC.isDark ? "rgba(100,160,255,0.3)" : (selectedCompany === "All" ? ORANGE : "rgba(3,42,105,0.12)") }, selectedCompany === "All" && styles.filterChipActive]}>
                {selectedCompany === "All" && aC.isDark && (<><LinearGradient colors={['rgba(22,64,136,0.3)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /><LinearGradient colors={['transparent', 'rgba(29,83,175,0.3)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /></>)}
                <Text style={[styles.filterTxt, { color: selectedCompany === "All" ? ORANGE : (aC.isDark ? "#8090B0" : "#475569") }, selectedCompany === "All" && styles.filterTxtActive]}>{filter === "Reserver" ? "All Dealership" : "All Companies"}</Text>
              </TouchableOpacity>
              {(filter === "Tracker" ? companies : filter === "Insurance" ? tagCompanies("Insurance") : filter === "Reserver" ? (() => {
                // Tracker jaisa: pehle dealers list, phir payment tags se extra names
                const seen = new Set<string>();
                const tags: string[] = [];
                dealers.forEach((d: any) => {
                  const n = (d.business_name || d.full_name || "").trim();
                  if (n && !seen.has(n.toLowerCase())) { seen.add(n.toLowerCase()); tags.push(n); }
                });
                [...PAYMENTS, ...live].filter(p => p.type === "Reserver").forEach(p => {
                  const parts = (p.tag || "").split("•").map((s: string) => s.trim());
                  const key = parts.length >= 4 ? parts[1] : "";
                  if (key && !seen.has(key.toLowerCase())) { seen.add(key.toLowerCase()); tags.push(key); }
                });
                if (tags.length === 0) tags.push("New Car Reservation");
                return tags.map((t: string) => ({ id: t, business_name: t }));
              })() : []).map((c: any) => {
                const name = c.business_name || c.full_name || c.name || "Company";
                const active = selectedCompany === name;
                return (
                  <TouchableOpacity key={c.id || name} onPress={() => setSelectedCompany(name)} style={[styles.filterChip, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : (active ? 'rgba(226,103,27,0.08)' : '#ffffff'), borderColor: aC.isDark ? "rgba(100,160,255,0.3)" : (active ? ORANGE : "rgba(3,42,105,0.12)") }, active && styles.filterChipActive]}>
                    {active && aC.isDark && (<><LinearGradient colors={['rgba(22,64,136,0.3)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /><LinearGradient colors={['transparent', 'rgba(29,83,175,0.3)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /></>)}
                    <Text style={[styles.filterTxt, { color: active ? ORANGE : (aC.isDark ? "#8090B0" : "#475569") }, active && styles.filterTxtActive]}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          {(filter === "Tracker" || filter === "Reserver" || filter === "Insurance") && selectedCompany !== "All" && (() => {
            const filtered = [...PAYMENTS, ...live].filter(p => p.type === filter && (p.tag || "").toLowerCase().includes(selectedCompany.toLowerCase()));
            const total = filtered.reduce((s, p) => s + (Number(String(p.amount).replace(/[^0-9]/g, "")) || 0), 0);
            return (
              <View style={[styles.overviewCard, { overflow: "hidden", marginBottom: 14, alignItems: "center", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(100,160,255,0.5)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <Text style={[styles.overviewLabel, { color: aC.isDark ? "#8090B0" : "#475569" }]}>{selectedCompany} Total</Text>
                <Text style={[styles.overviewValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>PKR {total.toLocaleString()}</Text>
                <Text style={[styles.overviewLabel, { marginBottom: 0, color: aC.isDark ? "#8090B0" : "#475569" }]}>{filtered.length} payments</Text>
              </View>
            );
          })()}
          {/* Subscription total payments */}
          {filter === "Subscription" && (() => {
            const filtered = [...PAYMENTS, ...live].filter(p => p.type === "Subscription");
            if (filtered.length === 0) return null;
            const total = filtered.reduce((s, p) => s + (Number(String(p.amount).replace(/[^0-9]/g, "")) || 0), 0);
            return (
              <View style={[styles.overviewCard, { overflow: "hidden", marginBottom: 14, alignItems: "center", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(100,160,255,0.5)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <Text style={[styles.overviewLabel, { color: aC.isDark ? "#8090B0" : "#475569" }]}>Subscription Total</Text>
                <Text style={[styles.overviewValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>PKR {total.toLocaleString()}</Text>
                <Text style={[styles.overviewLabel, { marginBottom: 0, color: aC.isDark ? "#8090B0" : "#475569" }]}>{filtered.length} payments</Text>
              </View>
            );
          })()}
          {/* Month-wise filter for Insurance */}          {filter === "Insurance" && insuranceMonths().length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }} style={{ marginBottom: 16, marginHorizontal: -20, paddingHorizontal: 20 }}>
              {[{ id: "All", label: "All Months" }, ...insuranceMonths()].map(m => {
                const active = selectedMonth === m.id;
                return (
                  <TouchableOpacity key={m.id} onPress={() => setSelectedMonth(m.id)} style={[styles.filterChip, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : (active ? 'rgba(226,103,27,0.08)' : '#ffffff'), borderColor: aC.isDark ? "rgba(100,160,255,0.3)" : (active ? ORANGE : "rgba(3,42,105,0.12)") }, active && styles.filterChipActive]}>
                    {active && aC.isDark && (<><LinearGradient colors={['rgba(22,64,136,0.3)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /><LinearGradient colors={['transparent', 'rgba(29,83,175,0.3)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /></>)}
                    <Text style={[styles.filterTxt, { color: active ? ORANGE : (aC.isDark ? "#8090B0" : "#475569") }, active && styles.filterTxtActive]}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Recent Payments</Text>
          <View style={styles.paymentsList}>
            {(() => {
              let list = filter === "All" ? [...PAYMENTS, ...live] : [...PAYMENTS, ...live].filter(p => p.type === filter);
              if ((filter === "Tracker" || filter === "Reserver" || filter === "Insurance") && selectedCompany !== "All") {
                list = list.filter(p => (p.tag || "").toLowerCase().includes(selectedCompany.toLowerCase()));
              }
              if (filter === "Insurance" && selectedMonth !== "All") {
                list = list.filter(p => p.month === selectedMonth);
              }
              return list;
            })().map(p => (
              <View key={p.id} style={[styles.paymentCard, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(100,160,255,0.5)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <View style={styles.cardTopRow}>
                  {(() => {
                    const uri = avatarUrl(p.avatar_url);
                    return uri ? (
                      <Image source={{ uri }} style={styles.logoImg} />
                    ) : (
                      <View style={[styles.logoBadge, { borderColor: p.accent || ORANGE }]}>
                        <Text style={[styles.logoInitial, { color: p.accent || ORANGE }]}>{(p.name || p.title || "U").trim().charAt(0).toUpperCase()}</Text>
                      </View>
                    );
                  })()}
                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.cardName, { color: aC.isDark ? WHITE : '#010a1f' }]}>{p.name}</Text>
                      <BadgeCheck size={14} color="#3B82F6" strokeWidth={1.8} />
                      {!!p.role && (
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleTxt}>{ROLE_LABELS[p.role] || p.role}</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.tagBadge, { backgroundColor: aC.isDark ? "rgba(226,103,27,0.1)" : "rgba(226,103,27,0.08)" }]}><Text style={styles.tagTxt}>{p.tag}</Text></View>
                    {!!(p.email || p.phone) && (
                      <Text style={[styles.contactTxt, { color: aC.isDark ? "#8090B0" : "#475569" }]} numberOfLines={1}>{p.email || p.phone}</Text>
                    )}
                    <Text style={[styles.txnTxt, { marginTop: 4, color: aC.isDark ? "#8090B0" : "#475569" }]}>{p.txn}</Text>
                    <Text style={[styles.timeTxt, { color: aC.isDark ? "#8090B0" : "#475569" }]}>{p.date ? `${p.date} • ${p.time}` : p.time}</Text>
                  </View>
                  <View style={styles.amountBox}>
                    <Text style={[styles.pkrLabel, { color: aC.isDark ? "#8090B0" : "#475569" }]}>PKR</Text>
                    <Text style={[styles.amountVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>{p.amount}</Text>
                    <View style={styles.statusRow}><View style={styles.statusDot} /><Text style={styles.statusTxt}>{p.status}</Text></View>
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
  safeArea: { flex: 1, backgroundColor: "#010A1F" },
  header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, marginTop: 4 },
  backBtn: { width: 36, height: 44, justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 17, fontFamily: "Poppins_600SemiBold" },
  scroll: { paddingHorizontal: 20 },
  sectionTitle: { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold", marginBottom: 12 },
  overviewGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  overviewCard: { flex: 1, backgroundColor: "#010A1F", borderRadius: 16, borderWidth: 1, borderColor: "rgba(100,160,255,0.5)", paddingHorizontal: 10, paddingVertical: 8, alignItems: "center" },
  overviewLabel: { color: "#8090B0", fontSize: 10, fontFamily: "Poppins_400Regular", textAlign: "center", marginBottom: 8, lineHeight: 14 },
  overviewValue: { color: WHITE, fontSize: 20, fontFamily: "Poppins_700Bold" },
  filterRow: { flexDirection: "row", gap: 8, paddingRight: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "rgba(100,160,255,0.3)", backgroundColor: "#010A1F" },
  filterChipActive: { borderColor: "rgba(100,160,255,0.4)" },
  filterTxt: { color: "#8090B0", fontSize: 13, fontFamily: "Poppins_500Medium" },
  filterTxtActive: { color: ORANGE },
  paymentsList: { gap: 14 },
  paymentCard: { backgroundColor: "#010A1F", borderRadius: 20, borderWidth: 1, borderColor: "rgba(100,160,255,0.5)", padding: 10 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  logoBadge: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoImg: { width: 38, height: 38, borderRadius: 19, flexShrink: 0, backgroundColor: "#0a1e3a" },
  logoInitial: { fontSize: 14, fontFamily: "Poppins_700Bold" },
  roleBadge: { backgroundColor: "rgba(59,130,246,0.12)", borderWidth: 1, borderColor: "rgba(59,130,246,0.35)", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  roleTxt: { color: "#3B82F6", fontSize: 9, fontFamily: "Poppins_600SemiBold" },
  contactTxt: { fontSize: 10, fontFamily: "Poppins_400Regular", marginTop: 3 },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  cardName: { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  tagBadge: { alignSelf: "flex-start", backgroundColor: "rgba(226,103,27,0.1)", borderWidth: 1, borderColor: "rgba(226,103,27,0.3)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagTxt: { color: ORANGE, fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  amountBox: { alignItems: "flex-end", flexShrink: 0 },
  pkrLabel: { color: "#8090B0", fontSize: 11, fontFamily: "Poppins_400Regular" },
  amountVal: { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  txnTxt: { color: "#8090B0", fontSize: 11, fontFamily: "Poppins_400Regular" },
  timeTxt: { color: "#8090B0", fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#34D399" },
  statusTxt: { color: "#34D399", fontSize: 13, fontFamily: "Poppins_500Medium" },
});
