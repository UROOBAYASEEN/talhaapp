import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import AdminFooter from "@/components/admin/AdminFooter";
import WelcomeBanner from "@/components/shared/WelcomeBanner";
import { SavedCardEffect } from "@/components/shared/FigmaEffects";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "@/constants/api";
import { AppColors, useAppColors } from '@/constants/theme';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle,
  Line,
} from "react-native-svg";

const { width } = Dimensions.get("window");

const ORANGE = "#FF6B00";
const WHITE = "#FFFFFF";

const stats = [
  { title: "Total Users",    value: "12,458", route: null },
  { title: "Dealers",        value: "342",    route: "/(admin)/partners" },
  { title: "Insurance Co..", value: "128",    route: "/(admin)/partners" },
  { title: "Banks",          value: "35",     route: "/(admin)/partners" },
  { title: "Tracker Com...", value: "67",     route: "/(admin)/partners" },
  { title: "Active Listings",value: "3,245",  route: null },
];

const actions = [
  {
    title: "Add Partner",
    icon: null,
    image: require("@/screenshot/addpartner.png"),
    route: "/(admin)/add-partner",
  },
  {
    title: "Dealers",
    icon: null,
    image: require("@/screenshot/dealer.png"),
    route: "/(admin)/partners",
  },
  {
    title: "Progress",
    icon: null,
    image: require("@/screenshot/progess.png"),
    route: "/(admin)/analytics",
  },
  {
    title: "Advertisement",
    icon: "bullhorn-outline",
    image: null,
    route: "/(admin)/advertisement",
  },
  {
    title: "Brands",
    icon: "pricetag-outline",
    image: null,
    route: "/(admin)/brands",
  },
  {
    title: "Payments",
    icon: null,
    image: require("@/screenshot/subcription.png"),
    route: "/(admin)/payments",
  },
  {
    title: "Inventory Permission",
    icon: "shield-check-outline",
    image: null,
    route: "/(admin)/inventory-permission",
  },
];

const FALLBACK_ACTIVITIES = [
  { title: "New Dealer Registered", subtitle: "Al-Ghazi Motors", icon: "storefront-outline" },
  { title: "Payment Received", subtitle: "Transaction #8842", icon: "cash-register" },
  { title: "Listing approved", subtitle: "Toyota Corolla 2023", icon: "certificate-outline" },
];

const chartPoints = [
  { x: 34, y: 658 },
  { x: 82, y: 626 },
  { x: 114, y: 648 },
  { x: 146, y: 610 },
  { x: 178, y: 642 },
  { x: 226, y: 594 },
  { x: 260, y: 611 },
  { x: 291, y: 578 },
  { x: 354, y: 554 },
];

const FILTER_OPTIONS = [
  "Today",
  "Weekly",
  "Monthly",
  "Yearly",
];

const FILTER_PERIOD: Record<string, string> = {
  "Today":   "today",
  "Weekly":  "7d",
  "Monthly": "30d",
  "Yearly":  "1y",
};

type RevenueData = {
  total:      number;
  change_pct: number;
  points:     number[];
  labels:     string[];
};

export default function AdminDashboard() {
  const router = useRouter();
  const aC = useAppColors();
  const [selectedFilter, setSelectedFilter] = useState("Monthly");
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const [revenue,        setRevenue]        = useState<RevenueData | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [homeStats,      setHomeStats]      = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const fetchRevenue = useCallback(async (filter: string) => {
    try {
      setRevenueLoading(true);
      const token  = await SecureStore.getItemAsync("access_token");
      const period = FILTER_PERIOD[filter] ?? "30d";
      const res    = await fetch(`${API_BASE}/admin/revenue?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRevenue(await res.json());
    } catch { /* offline */ }
    finally { setRevenueLoading(false); }
  }, []);

  useEffect(() => { fetchRevenue(selectedFilter); }, [selectedFilter, fetchRevenue]);
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("access_token");
        const res = await fetch(`${API_BASE}/admin/home-stats`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setHomeStats(await res.json());
        // Real recent activity — pending vehicles + recent users + payments
        try {
          const [vRes, nRes] = await Promise.all([
            fetch(`${API_BASE}/admin/listings?list_type=vehicles&status=Pending&limit=5`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_BASE}/notifications/?limit=5`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          const acts: any[] = [];
          if (vRes.ok) {
            const vs: any[] = await vRes.json();
            vs.slice(0, 2).forEach((v: any) => acts.push({ title: `New Listing Pending`, subtitle: v.title || `${v.make || ''} ${v.model || ''}`.trim() || 'Vehicle', icon: 'car-outline' }));
          }
          if (nRes.ok) {
            const nd: any = await nRes.json();
            const items = nd.items || nd || [];
            items.slice(0, 3).forEach((n: any) => acts.push({ title: n.title || 'Notification', subtitle: n.body?.slice(0, 40) || '', icon: n.type === 'payment' ? 'cash-register' : 'bell-outline' }));
          }
          if (acts.length) setRecentActivities(acts.slice(0, 5));
        } catch {}
      } catch {}
    })();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: aC.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <View style={styles.profileRow}>
            <Image
              source={require('@/assets/images/autowizor-logo-icon.png')}
              style={{ width: 36, height: 36, borderRadius: 18 }}
              resizeMode="contain"
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.welcomeTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Welcome Admin</Text>
              <Text style={[styles.adminText, { color: aC.isDark ? "#A6B1C5" : "#475569" }]}>Super Admin</Text>
            </View>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => router.push('/(admin)/alerts' as any)}>
              <Ionicons
                name="notifications-outline"
                size={23}
                color={aC.isDark ? "#DCE5F6" : "#475569"}
              />
            </TouchableOpacity>

            <TouchableOpacity>
              <Ionicons
                name="settings-outline"
                size={22}
                color={aC.isDark ? "#DCE5F6" : "#475569"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* WELCOME BANNER */}
        <WelcomeBanner style={{ marginTop: 9, marginBottom: 13 }} />

        {/* OVERVIEW HEADER */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Overview</Text>

          <TouchableOpacity onPress={() => router.push('/(admin)/analytics' as any)}>
            <Text style={styles.analytics}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsGrid}>
          {(homeStats ? [
            { title: "Total Users",    value: String(homeStats.total_users), route: null },
            { title: "Dealers",        value: String(homeStats.dealers), route: "/(admin)/partners" },
            { title: "Insurance Co..", value: String(homeStats.insurance), route: "/(admin)/partners" },
            { title: "Banks",          value: String(homeStats.banks), route: "/(admin)/partners" },
            { title: "Tracker Com...", value: String(homeStats.trackers), route: "/(admin)/partners" },
            { title: "Active Listings",value: String(homeStats.active_listings), route: null },
          ] : stats).map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.statCard, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}
              activeOpacity={item.route ? 0.75 : 1}
              onPress={() => item.route && router.push(item.route as any)}
            >
              {aC.isDark ? (
                <SavedCardEffect />
              ) : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              <Text style={[styles.statTitle, { color: aC.isDark ? "#C6CFDF" : "#475569" }]} numberOfLines={1}>
                {item.title}
              </Text>

              <Text style={[styles.statValue, { color: aC.isDark ? "#DCE5F5" : "#010a1f" }]}>{item.value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* REVENUE CARD */}
        <View
          style={[styles.revenueCard, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}
        >
          {aC.isDark ? (
            <SavedCardEffect />
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            </>
          )}
          <View style={styles.revenueTop}>
            <View>
              <Text style={[styles.revenueLabel, { color: aC.isDark ? "#AEB7CA" : "#475569" }]}>Revenue Overview</Text>
              {revenueLoading ? (
                <ActivityIndicator color={ORANGE} size="small" style={{ marginTop: 6 }} />
              ) : (
                <Text style={[styles.revenueAmount, { color: aC.isDark ? WHITE : '#010a1f' }]}>
                  PKR {revenue ? revenue.total.toLocaleString("en-PK", { maximumFractionDigits: 0 }) : "0"}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderColor: aC.isDark ? "#C4CCDA" : "rgba(3,42,105,0.12)" }]}
              onPress={() => setDropdownOpen(true)}
            >
              <Text style={[styles.dropdownText, { color: aC.isDark ? "#E4E8F0" : "#010a1f" }]}>{selectedFilter}</Text>
              <Ionicons name="chevron-down" size={16} color={aC.isDark ? "#E6EAF3" : "#475569"} />
            </TouchableOpacity>

            <Modal
              transparent
              visible={dropdownOpen}
              animationType="fade"
              onRequestClose={() => setDropdownOpen(false)}
            >
              <Pressable
                style={styles.dropdownOverlay}
                onPress={() => setDropdownOpen(false)}
              >
                <View style={[styles.dropdownMenu, { backgroundColor: aC.isDark ? "#0D2657" : "#ffffff", borderColor: aC.isDark ? "rgba(100,160,255,0.25)" : "rgba(3,42,105,0.12)" }]}>
                  {FILTER_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.dropdownItem,
                        { borderBottomColor: aC.isDark ? "rgba(255,255,255,0.06)" : "rgba(3,42,105,0.06)" },
                        selectedFilter === opt && [styles.dropdownItemActive, { backgroundColor: aC.isDark ? "rgba(255,107,0,0.08)" : "rgba(226,103,27,0.08)" }],
                      ]}
                      onPress={() => {
                        setSelectedFilter(opt);
                        setDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          { color: aC.isDark ? "#C8D3E8" : "#475569" },
                          selectedFilter === opt && { color: ORANGE },
                        ]}
                      >
                        {opt}
                      </Text>
                      {selectedFilter === opt && (
                        <Ionicons name="checkmark" size={14} color={ORANGE} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </Pressable>
            </Modal>
          </View>

          <View style={styles.increaseRow}>
            <Text style={styles.triangle}>{revenue && revenue.change_pct >= 0 ? "▲" : "▼"}</Text>
            <Text style={[styles.increaseText, revenue && revenue.change_pct < 0 && { color: "#ff4050" }]}>
              Revenue ({revenue ? `${revenue.change_pct >= 0 ? "+" : ""}${revenue.change_pct}%` : "0%"})
            </Text>
          </View>

          {/* CHART */}
          <RevenueChart data={revenue?.points} labels={revenue?.labels} />
        </View>

        {/* SMALL SUMMARY CARDS */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: "hidden" }]}>
            {aC.isDark ? (
              <SavedCardEffect />
            ) : (
              <>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              </>
            )}
            <Text style={[styles.summaryTitle, { color: aC.isDark ? "#AAB5CA" : "#475569" }]}>Reservations Today</Text>
            <Text style={[styles.summaryValue, { color: aC.isDark ? "#DDE5F3" : "#010a1f" }]}>{homeStats ? String(homeStats.reservations_today ?? 0) : "0"}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: "hidden" }]}>
            {aC.isDark ? (
              <SavedCardEffect />
            ) : (
              <>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              </>
            )}
            <Text style={[styles.summaryTitle, { color: aC.isDark ? "#AAB5CA" : "#475569" }]}>Monthly Revenue</Text>
            <Text style={[styles.summaryValue, { color: aC.isDark ? "#DDE5F3" : "#010a1f" }]}>{homeStats ? `PKR ${Number(homeStats.monthly_revenue || 0).toLocaleString()}` : "PKR 0"}</Text>
          </View>
        </View>

        {/* ACTIONS */}
        <Text style={[styles.activityHeading, { color: aC.isDark ? WHITE : '#010a1f' }]}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {actions.map((item, index) => (
            <TouchableOpacity key={index} style={[styles.actionCard, { backgroundColor: aC.isDark ? "#0B2358" : "#ffffff", borderColor: aC.isDark ? "transparent" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: "hidden" }]} onPress={() => router.push(item.route as any)}>
              {aC.isDark ? null : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              {item.image ? (
                <Image source={item.image} style={{ width: 30, height: 30 }} resizeMode="contain" />
              ) : (
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={30}
                  color={ORANGE}
                />
              )}
              <Text style={[styles.actionText, { color: aC.isDark ? "#ADB8CD" : "#475569" }]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* RECENT ACTIVITY — real */}
        <Text style={[styles.activityHeading, { color: aC.isDark ? WHITE : '#010a1f' }]}>Recent Activity</Text>

        <View style={styles.activities}>
          {(recentActivities.length ? recentActivities : FALLBACK_ACTIVITIES).map((item, index) => (
            <View
              key={index}
              style={[styles.activityCard, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#82a5d5" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: "hidden" }]}
            >
              {aC.isDark ? (
                <SavedCardEffect />
              ) : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              <View style={[styles.activityIcon, { backgroundColor: aC.isDark ? "rgba(9,38,90,0.6)" : "rgba(3,42,105,0.06)" }]}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={22}
                  color={ORANGE}
                />
              </View>

              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>
                  {item.title}
                </Text>

                <Text style={[styles.activitySubtitle, { color: aC.isDark ? "#8390AA" : "#475569" }]}>
                  {item.subtitle}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={25}
                color={ORANGE}
              />
            </View>
          ))}
        </View>

        <View style={{ height: 105 }} />
      </ScrollView>

      <AdminFooter active="home" />
    </View>
  );
}

const CHART_H = 130;
const FALLBACK_DATA = [0, 0, 0, 0, 0, 0, 0];

function RevenueChart({ data, labels }: { data?: number[]; labels?: string[] }) {
  const aC = useAppColors();
  const chartData = (data && data.length > 1) ? data : FALLBACK_DATA;
  const chartW    = width - 64;
  const min       = Math.min(...chartData);
  const max       = Math.max(...chartData);
  const range     = max - min || 1;
  const pad       = { top: 12, bottom: 8 };
  const innerH    = CHART_H - pad.top - pad.bottom;

  const getX = (i: number) => (i / (chartData.length - 1)) * chartW;
  const getY = (v: number) =>
    pad.top + innerH - ((v - min) / range) * innerH;

  const linePath = chartData.map((v, i) =>
    `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`
  ).join(" ");

  const fillPath =
    linePath +
    ` L ${getX(chartData.length - 1).toFixed(1)} ${CHART_H} L 0 ${CHART_H} Z`;

  // show max 6 labels evenly
  const step = Math.ceil((labels?.length ?? 0) / 6);
  const visibleLabels = labels?.filter((_, i) => i % step === 0 || i === (labels.length - 1)) ?? [];

  const gridYs = [0.2, 0.45, 0.7, 0.9];

  return (
    <View style={{ marginTop: 8 }}>
      <Svg width={chartW} height={CHART_H}>
        <Defs>
          <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FF6B00" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Grid lines */}
        {gridYs.map((p, i) => (
          <Line
            key={i}
            x1="0"
            y1={(p * CHART_H).toFixed(1)}
            x2={chartW}
            y2={(p * CHART_H).toFixed(1)}
            stroke={aC.isDark ? "rgba(100,130,180,0.15)" : "rgba(3,42,105,0.08)"}
            strokeWidth="1"
          />
        ))}

        {/* Fill area */}
        <Path d={fillPath} fill="url(#areaGrad)" />

        {/* Line */}
        <Path
          d={linePath}
          stroke="#FF6B00"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {chartData.map((v, i) => (
          <Circle
            key={i}
            cx={getX(i)}
            cy={getY(v)}
            r="3.5"
            fill={aC.isDark ? "#071A40" : "#ffffff"}
            stroke="#FF6B00"
            strokeWidth="2"
          />
        ))}
      </Svg>

      {/* X-axis labels */}
      {visibleLabels.length > 0 && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          {visibleLabels.map((l, i) => (
            <Text key={i} style={{ color: aC.isDark ? "#6B7A99" : "#475569", fontSize: 9, fontFamily: "Poppins_400Regular" }}>
              {l}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function BottomItem({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const aC = useAppColors();
  return (
    <TouchableOpacity style={styles.bottomItem} onPress={onPress}>
      <View
        style={[
          styles.bottomIcon,
          active && styles.activeBottomIcon,
          active && { backgroundColor: aC.isDark ? "#102E62" : "rgba(3,42,105,0.08)" },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={21}
          color={active ? ORANGE : (aC.isDark ? "#AEB9D0" : "#64748b")}
        />
      </View>

      <Text
        style={[
          styles.bottomLabel,
          { color: aC.isDark ? "#A7B1C5" : "#64748b" },
          active && [styles.activeBottomLabel, { color: aC.isDark ? WHITE : ORANGE }],
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bg,
  },

  scrollContent: {
    paddingTop: 52,
    paddingHorizontal: 16,
  },

  /* HEADER */

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileCircle: {
    width: 47,
    height: 47,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#AEBBD0",
    padding: 2,
    marginRight: 12,
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
  },

  welcomeTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: "700",
  },

  adminText: {
    color: "#A6B1C5",
    fontSize: 12,
    marginTop: 2,
  },

  headerIcons: {
    flexDirection: "row",
    gap: 17,
  },

  /* BANNER */

  banner: {
    minHeight: 124,
    borderRadius: 20,
    backgroundColor: "rgba(6, 27, 74, 1)",
    marginTop: 9,
    marginBottom: 13,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 27,
    paddingRight: 27,
    gap: 10,
  },

  bannerText: {
    flex: 1,
    zIndex: 2,
  },

  smallWelcome: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginBottom: 8,
  },

  bannerTitle: {
    color: WHITE,
    fontSize: 17,
    lineHeight: 27,
    fontFamily: "Poppins_700Bold",
  },

  carImage: {
    width: 150,
    height: 92,
    marginRight: -4,
  },

  /* SECTION */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 7,
    marginBottom: 10,
  },

  sectionTitle: {
    color: WHITE,
    fontSize: 17,
    fontWeight: "500",
  },

  analytics: {
    color: ORANGE,
    fontSize: 12,
  },

  /* STATS */

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 11,
  },

  statCard: {
    width: "31.9%",
    height: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#010A1F",
    overflow: 'hidden',
  },

  statTitle: {
    color: "#C6CFDF",
    fontSize: 11,
    marginBottom: 6,
  },

  statValue: {
    color: "#DCE5F5",
    fontSize: 17,
    fontWeight: "700",
  },

  /* REVENUE */

  revenueCard: {
    height: 261.2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.5)",
    marginTop: 13,
    paddingTop: 24,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    gap: 16,
    overflow: "hidden",
  },

  revenueTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  revenueLabel: {
    color: "#AEB7CA",
    fontSize: 14,
    marginBottom: 5,
  },

  revenueAmount: {
    color: WHITE,
    fontSize: 24,
    fontWeight: "800",
  },

  dropdown: {
    height: 27,
    borderWidth: 1,
    borderColor: "#C4CCDA",
    borderRadius: 18,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  dropdownText: {
    color: "#E4E8F0",
    fontSize: 11,
  },

  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 200,
    paddingRight: 24,
  },

  dropdownMenu: {
    backgroundColor: "#0D2657",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.25)",
    minWidth: 160,
    overflow: "hidden",
  },

  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  dropdownItemActive: {
    backgroundColor: "rgba(255,107,0,0.08)",
  },

  dropdownItemText: {
    color: "#C8D3E8",
    fontSize: 13,
  },

  increaseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  triangle: {
    color: ORANGE,
    fontSize: 8,
    marginRight: 4,
  },

  increaseText: {
    color: ORANGE,
    fontSize: 12,
  },


  /* SUMMARY */

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  summaryCard: {
    flex: 1,
    height: 88,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.4)",
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 10,
    overflow: "hidden",
  },

  summaryTitle: {
    color: "#AAB5CA",
    fontSize: 10,
    marginBottom: 6,
    flexWrap: "wrap",
  },

  summaryValue: {
    color: "#DDE5F3",
    fontSize: 14,
    fontWeight: "700",
    flexWrap: "wrap",
  },

  /* ACTIONS */

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },

  actionCard: {
    width: (width - 32 - 30) / 4,
    height: 86,
    backgroundColor: "#0B2358",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  actionText: {
    color: "#ADB8CD",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },

  /* ACTIVITY */

  activityHeading: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "500",
    marginTop: 18,
    marginBottom: 15,
    marginLeft: 4,
  },

  activities: {
    gap: 13,
  },

  activityCard: {
    height: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.4)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: "rgba(9,38,90,0.6)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  activityContent: {
    flex: 1,
  },

  activityTitle: {
    color: WHITE,
    fontSize: 12,
    marginBottom: 4,
  },

  activitySubtitle: {
    color: "#8390AA",
    fontSize: 10,
  },

  /* BOTTOM NAV */

  bottomNav: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 14,
    height: 58,
    borderRadius: 32,
    backgroundColor: "#082257",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 5,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  bottomItem: {
    width: 52,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomIcon: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },

  activeBottomIcon: {
    borderWidth: 1,
    borderColor: "#6D7E9D",
    backgroundColor: "#102E62",
  },

  bottomLabel: {
    color: "#A7B1C5",
    fontSize: 8,
    marginTop: -1,
  },

  activeBottomLabel: {
    color: WHITE,
  },
});
