import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Image, ActivityIndicator,
  RefreshControl, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/constants/api";

const BG       = "#010a1f";
const WHITE    = "#f9fafc";
const SUBTITLE = "#baacb6";
const ORANGE   = "#e2671b";
const GLASS    = "rgba(3,12,40,0.6)";
const BORDER   = "rgba(255,255,255,0.1)";

const FILTERS = [
  { key: "",        label: "All Ads", dot: ORANGE    },
  { key: "active",  label: "Active",  dot: "#22c55e" },
  { key: "pending", label: "Pending", dot: "#eab308" },
  { key: "sold",    label: "Sold",    dot: "#3b82f6" },
  { key: "expired", label: "Expired", dot: "#ef4444" },
];

const STATUS_STYLE: Record<string, { color: string; dot: string; bg: string }> = {
  active:  { color: "#22c55e", dot: "#22c55e", bg: "rgba(34,197,94,0.15)"  },
  sold:    { color: "#3b82f6", dot: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  pending: { color: "#eab308", dot: "#eab308", bg: "rgba(234,179,8,0.15)"  },
  expired: { color: "#ef4444", dot: "#ef4444", bg: "rgba(239,68,68,0.15)"  },
  draft:   { color: "#9ca3af", dot: "#9ca3af", bg: "rgba(156,163,175,0.15)"},
};

function ordinalDate(iso: string): string {
  const d    = new Date(iso);
  const day  = d.getDate();
  const sfx  = [11,12,13].includes(day % 100) ? "th"
               : ["th","st","nd","rd"][Math.min(day % 10, 3)] || "th";
  const mon  = d.toLocaleDateString("en-US", { month: "long" });
  return `${day}${sfx} ${mon} ${d.getFullYear()}`;
}

function formatPrice(p: number): string {
  if (p >= 10000000) return `PKR ${(p / 10000000).toFixed(1)} Crore`;
  if (p >= 100000)   return `PKR ${(p / 100000).toFixed(0)} Lac`;
  return `PKR ${p.toLocaleString()}`;
}

export default function MyAdsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [filter, setFilter]       = useState("");
  const [ads, setAds]             = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAds = useCallback(async () => {
    if (!token) return;
    try {
      const q   = filter ? `&status=${filter}` : "";
      const res = await fetch(`${API_BASE}/vehicles/my?limit=50${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAds(data.items || []);
      }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token, filter]);

  useFocusEffect(useCallback(() => { setLoading(true); loadAds(); }, [loadAds]));

  const renderAd = ({ item }: { item: any }) => {
    const sc          = STATUS_STYLE[item.status] || STATUS_STYLE.draft;
    const statusLabel = item.status.charAt(0).toUpperCase() + item.status.slice(1);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: "/vehicle/[id]", params: { id: item.id } })}
      >
        <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        {/* Car image */}
        <View style={styles.imgBox}>
          {item.images?.[0]
            ? <Image source={{ uri: item.images[0] }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            : <Ionicons name="car-outline" size={30} color={SUBTITLE} />
          }
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <Text style={styles.meta}>
            {item.city || "Pakistan"}  •  {item.year}  •  {item.transmission || "CVT"}
          </Text>

          {/* Status + Date */}
          <View style={styles.statusRow}>
            <View style={[styles.badge, { backgroundColor: sc.bg }]}>
              <View style={[styles.dot, { backgroundColor: sc.dot }]} />
              <Text style={[styles.badgeTxt, { color: sc.color }]}>{statusLabel}</Text>
            </View>
            <Text style={styles.dateTxt}>  Posted on {ordinalDate(item.created_at)}</Text>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={16} color={ORANGE} style={styles.arrow} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconWrap} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Ads</Text>
        <View style={styles.iconWrap} />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && { backgroundColor: ORANGE, borderColor: ORANGE }]}
              onPress={() => setFilter(f.key)}
            >
              <View style={[styles.chipDot, { backgroundColor: active ? WHITE : f.dot }]} />
              <Text style={[styles.chipTxt, active && { color: WHITE }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {loading
        ? <ActivityIndicator color={ORANGE} style={{ flex: 1 }} />
        : <FlatList
            data={ads}
            keyExtractor={i => i.id}
            renderItem={renderAd}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); loadAds(); }}
                tintColor={ORANGE}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="car-outline" size={56} color={SUBTITLE} />
                <Text style={styles.emptyTitle}>No ads found</Text>
                <Text style={styles.emptySub}>Tap + to create your first listing</Text>
              </View>
            }
          />
      }

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/vehicle/create")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color={WHITE} />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  iconWrap:    { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 20, fontFamily: "Poppins_700Bold" },

  /* Filter */
  filterBar:    { flexGrow: 0, marginBottom: 12 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: GLASS,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipTxt: { color: SUBTITLE, fontSize: 12, fontFamily: "Poppins_500Medium" },

  /* List */
  list: { paddingHorizontal: 14, paddingBottom: 110, gap: 10 },

  /* Card */
  card: {
    flexDirection: "row",
    backgroundColor: GLASS,
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.5)",
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    minHeight: 105,
  },
  imgBox: {
    width: 120,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  title: {
    color: WHITE,
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    lineHeight: 19,
  },
  price: {
    color: ORANGE,
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
  meta: {
    color: SUBTITLE,
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },

  /* Status row */
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  dot:      { width: 6, height: 6, borderRadius: 3 },
  badgeTxt: { fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  dateTxt:  { color: SUBTITLE, fontSize: 10, fontFamily: "Poppins_400Regular" },

  arrow: { marginRight: 12, flexShrink: 0 },

  /* Empty */
  empty:      { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { color: WHITE,    fontSize: 15, fontFamily: "Poppins_600SemiBold" },
  emptySub:   { color: SUBTITLE, fontSize: 13, fontFamily: "Poppins_400Regular"  },

  /* FAB */
  fab: {
    position: "absolute",
    bottom: 28, right: 20,
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
});
