import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Calendar, Share2 } from "lucide-react-native";
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop, Rect, Circle, Line, Text as SvgText } from "react-native-svg";
import * as SecureStore from "expo-secure-store";
import AdminFooter from "@/components/admin/AdminFooter";
import { API_BASE } from "@/constants/api";
import { AppColors, useAppColors } from '@/constants/theme';

const { width } = Dimensions.get("window");
const WHITE = "#F4F5F7";
const ORANGE = "#E2671B";
const CHART_W = width - 64;

const RANGES = ["Today", "7 Days", "30 Days", "1 Year"];
const RANGE_PERIOD: Record<string, string> = {
  "Today":   "today",
  "7 Days":  "7d",
  "30 Days": "30d",
  "1 Year":  "1y",
};

const UNIT_DATA = [
  { day:"M", used:12, new:8  },
  { day:"T", used:8,  new:18 },
  { day:"W", used:5,  new:8  },
  { day:"T", used:8,  new:22 },
  { day:"F", used:6,  new:15 },
  { day:"S", used:5,  new:12 },
];

const RESERVATIONS = [
  { label:"Confirmed", value:24, color:ORANGE    },
  { label:"Completed", value:12, color:"#22c55e" },
  { label:"Pending",   value:6,  color:"#e5e7eb" },
];

const LOCATIONS = ["Karachi (42%)", "Lahore (28%)", "Pindi (15%)"];

/* ── Simple Line/Area Chart ── */
function AreaChartSvg({ data, color, h = 120 }: { data: number[]; color: string; h?: number }) {
  const w = CHART_W;
  const min = Math.min(...data); const max = Math.max(...data);
  const range = max - min || 1;
  const pad = { t: 8, b: 8 };
  const getX = (i: number) => (data.length <= 1 ? 0 : (i / (data.length - 1)) * w);
  const getY = (v: number) => pad.t + (1 - (v - min) / range) * (h - pad.t - pad.b);
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(" ");
  const fill = `${line} L ${w} ${h} L 0 ${h} Z`;
  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgGrad id="ag" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </SvgGrad>
      </Defs>
      <Path d={fill} fill="url(#ag)" />
      <Path d={line} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ── Bar Chart ── */
function BarChartSvg({ data, labels }: { data: { a: number; b: number }[]; labels: string[] }) {
  const h = 140; const w = CHART_W;
  const max = Math.max(...data.flatMap(d => [d.a, d.b]));
  const barW = 14; const gap = (w - data.length * barW * 2 - (data.length - 1) * 12) / 2;
  return (
    <Svg width={w} height={h + 20}>
      {data.map((d, i) => {
        const x = gap + i * (barW * 2 + 12);
        const ha = (d.a / max) * h;
        const hb = (d.b / max) * h;
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={h - ha} width={barW} height={ha} fill={ORANGE} rx={3} />
            <Rect x={x + barW + 2} y={h - hb} width={barW} height={hb} fill="#3b82f6" rx={3} />
            <Line x1={x + barW} y1={h + 8} x2={x + barW} y2={h + 8} stroke="none" />
          </React.Fragment>
        );
      })}
      {labels.map((l, i) => {
        const x = gap + i * (barW * 2 + 12) + barW;
        return (
          <Svg key={i} x={x - 12} y={h + 4} width={24} height={16}>
            <Path d="" />
          </Svg>
        );
      })}
    </Svg>
  );
}

/* ── Donut Chart ── */
function DonutChart({ data }: { data: { value: number; color: string }[] }) {
  const aC = useAppColors();
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 110; const r = 42; const cx = size / 2; const cy = size / 2;
  let angle = -Math.PI / 2;
  const paths = data.map(d => {
    const sweep = (d.value / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: d.color };
  });
  return (
    <Svg width={size} height={size}>
      {paths.map((p, i) => <Path key={i} d={p.path} fill={p.color} />)}
      <Circle cx={cx} cy={cy} r={r - 14} fill={aC.isDark ? "#010A1F" : "#ffffff"} />
    </Svg>
  );
}

/* ── Progress Bar ── */
function ProgressBar({ value, max, color = ORANGE }: { value: number; max: number; color?: string }) {
  const aC = useAppColors();
  const pct = Math.min(100, (value / max) * 100);
  return (
    <View style={[styles.progressTrack, { backgroundColor: aC.isDark ? "#232B45" : "rgba(3,42,105,0.08)" }]}>
      <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

/* ── Card ── */
function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  const aC = useAppColors();
  return (
    <View style={[styles.card, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(100,160,255,0.2)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }, style, { overflow: "hidden" }]}>
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
      {children}
    </View>
  );
}

type AnalyticsData = {
  stats:             { label: string; value: string; delta: string }[];
  revenue_total:     number;
  revenue_points:    number[];
  revenue_labels:    string[];
  revenue_breakdown: { label: string; value: string; pct: string; color: string }[];
  partners_contrib:  { label: string; value: number; max: number }[];
  advertising:       { label: string; value: number; max: number; color: string }[];
  sub_points:        number[];
  sub_labels:        string[];
  listing_perf:      { name: string; a: number; b: number }[];
};

export default function AnalyticsScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const [range,   setRange]   = useState("30 Days");
  const [unitTab, setUnitTab] = useState("Weekly");
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (r: string) => {
    try {
      setLoading(true);
      const token  = await SecureStore.getItemAsync("access_token");
      const period = RANGE_PERIOD[r] ?? "30d";
      const res    = await fetch(`${API_BASE}/admin/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnalytics(range); }, [range, fetchAnalytics]);

  return (
    <View style={[styles.container, { backgroundColor: aC.bg }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>

        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={aC.isDark ? "rgba(255,255,255,0.9)" : "#010a1f"} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>App Analytics</Text>
          <TouchableOpacity style={styles.headerBtn}>
            <Bell size={20} color={ORANGE} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerSub, { color: aC.isDark ? "#8090B0" : "#475569" }]}>Complete AutoWizor performance overview</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* DATE RANGES */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeRow}>
            {RANGES.map(r => (
              <TouchableOpacity key={r} onPress={() => { setRange(r); }} style={[styles.rangeChip, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#232B45" : "rgba(3,42,105,0.12)" }, range === r && [styles.rangeChipActive, { backgroundColor: aC.isDark ? "#010A1F" : "rgba(3,42,105,0.06)", borderColor: aC.isDark ? "rgba(56,189,248,0.5)" : "rgba(3,42,105,0.2)" }]]}>
                <Text style={[styles.rangeTxt, { color: aC.isDark ? "#8090B0" : "#475569" }, range === r && [styles.rangeTxtActive, { color: aC.isDark ? "#7dd3fc" : "#032a69" }]]}>{r}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.calBtn, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#232B45" : "rgba(3,42,105,0.12)" }]}>
              <Calendar size={14} color={aC.isDark ? "#C0C8DC" : "#475569"} strokeWidth={1.8} />
            </TouchableOpacity>
          </ScrollView>

          {/* STAT CARDS */}
          {loading ? (
            <ActivityIndicator color={ORANGE} size="large" style={{ marginVertical: 20 }} />
          ) : (
          <View style={styles.statsGrid}>
            {(data?.stats ?? []).map(s => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "rgba(100,160,255,0.2)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
                {aC.isDark ? (
                  <>
                    <LinearGradient colors={['rgba(22,64,136,0.5)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['rgba(13,37,84,0.5)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(29,83,175,0.5)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                ) : (
                  <>
                    <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  </>
                )}
                <Text style={[styles.statLabel, { color: aC.isDark ? "#8090B0" : "#475569" }]}>{s.label}</Text>
                <Text style={[styles.statValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>{s.value}</Text>
                <Text style={[styles.statDelta, s.delta.startsWith('-') && { color: "#ff4050" }]}>{s.delta}</Text>
              </View>
            ))}
          </View>
          )}

          {/* REVENUE OVERVIEW */}
          <View style={[styles.card, styles.mb, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.2)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
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
            <Text style={[styles.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Revenue Overview</Text>
            <View style={styles.revTopRow}>
              <Text style={[styles.revAmount, { color: aC.isDark ? WHITE : '#010a1f' }]}>
                PKR {data ? data.revenue_total.toLocaleString("en-PK", { maximumFractionDigits: 0 }) : "0"}
              </Text>
            </View>
            <AreaChartSvg data={data?.revenue_points?.length ? data.revenue_points : [0,0,0,0,0,0]} color={ORANGE} h={120} />
            <View style={styles.revMonths}>
              {(data?.revenue_labels ?? []).map(m => <Text key={m} style={[styles.revMonth, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>{m}</Text>)}
            </View>
            <View style={styles.breakdownGrid}>
              {(data?.revenue_breakdown ?? []).map(r => (
                <View key={r.label} style={[styles.breakdownItem, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#1E2748" : "rgba(3,42,105,0.12)", overflow: 'hidden' }]}>
                  {aC.isDark ? (
                    <>
                      <LinearGradient colors={['rgba(22,64,136,0.5)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                      <LinearGradient colors={['rgba(13,37,84,0.5)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.5)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    </>
                  ) : (
                    <>
                      <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                      <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    </>
                  )}
                  <View style={styles.breakdownLabelRow}>
                    <View style={[styles.dot, { backgroundColor: r.color }]} />
                    <Text style={[styles.breakdownLabel, { color: aC.isDark ? "#C0C8DC" : "#475569" }]}>{r.label}</Text>
                  </View>
                  <Text style={[styles.breakdownVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>{r.value} <Text style={{ color: aC.isDark ? "#6B7A99" : "#475569" }}>({r.pct})</Text></Text>
                </View>
              ))}
            </View>
          </View>

          {/* LISTING PERFORMANCE */}
          <View style={[styles.card, styles.mb, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.2)" : "rgba(3,42,105,0.12)", shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
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
            <Text style={[styles.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Listing Performance</Text>
            <View style={styles.barLegend}>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: ORANGE }]} /><Text style={[styles.legendTxt, { color: aC.isDark ? "#C0C8DC" : "#475569" }]}>Count</Text></View>
            </View>
            <View style={styles.barChartWrap}>
              {(data?.listing_perf ?? []).map((d, i) => {
                const maxV = Math.max(...(data?.listing_perf ?? []).map(x => x.a), 1);
                const ha   = (d.a / maxV) * 120;
                return (
                  <View key={i} style={styles.barGroup}>
                    <View style={styles.barPair}>
                      <View style={[styles.barItem, { height: Math.max(ha, 4), backgroundColor: ORANGE }]} />
                    </View>
                    <Text style={[styles.barLabel, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>{d.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* PARTNERS CONTRIBUTIONS */}
          <Card style={styles.mb}>
            <Text style={[styles.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Partners Contributions</Text>
            {(data?.partners_contrib ?? []).map(p => (
              <View key={p.label} style={styles.progressRow}>
                <View style={styles.progressLabelRow}>
                  <Text style={[styles.progressLabel, { color: aC.isDark ? WHITE : '#010a1f' }]}>{p.label}</Text>
                  <Text style={[styles.progressVal, { color: aC.isDark ? "#C0C8DC" : "#475569" }]}>{p.value}</Text>
                </View>
                <ProgressBar value={p.value} max={p.max} />
              </View>
            ))}
          </Card>

          {/* ADVERTISING */}
          <Card style={styles.mb}>
            <Text style={[styles.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Advertising</Text>
            {(data?.advertising ?? []).map(a => (
              <View key={a.label} style={styles.progressRow}>
                <View style={styles.progressLabelRow}>
                  <Text style={[styles.progressLabel, { color: aC.isDark ? WHITE : '#010a1f' }]}>{a.label}</Text>
                  <Text style={[styles.progressVal, { color: aC.isDark ? "#C0C8DC" : "#475569" }]}>{a.value}</Text>
                </View>
                <ProgressBar value={a.value} max={a.max} color={a.color} />
              </View>
            ))}
          </Card>

          {/* SUBSCRIPTION OVERVIEW */}
          <Card style={styles.mb}>
            <Text style={[styles.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Subscription Overview</Text>
            <AreaChartSvg data={data?.sub_points?.length ? data.sub_points : [0,0,0,0,0,0]} color="#3b82f6" h={100} />
            <View style={styles.revMonths}>
              {(data?.sub_labels ?? []).map(m => <Text key={m} style={[styles.revMonth, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>{m}</Text>)}
            </View>
          </Card>

          {/* UNIT SELLING */}
          <Card style={styles.mb}>
            <View style={styles.unitHeader}>
              <Text style={[styles.cardTitle, { color: aC.isDark ? WHITE : '#010a1f', marginBottom: 0 }]}>Unit Selling</Text>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: ORANGE }]} />
                <Text style={[styles.legendTxt, { color: aC.isDark ? "#C0C8DC" : "#475569" }]}>Views</Text>
              </View>
            </View>
            <View style={[styles.tabRow, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#232B45" : "rgba(3,42,105,0.12)" }]}>
              {["Weekly","Monthly","Yearly"].map(t => (
                <TouchableOpacity key={t} onPress={() => setUnitTab(t)} style={[styles.tab, unitTab === t && [styles.tabActive, { backgroundColor: aC.isDark ? "#0d2040" : "rgba(3,42,105,0.06)" }]]}>
                  <Text style={[styles.tabTxt, { color: aC.isDark ? "#8090B0" : "#475569" }, unitTab === t && [styles.tabTxtActive, { color: aC.isDark ? WHITE : '#010a1f' }]]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.barChartWrap}>
              {UNIT_DATA.map((d, i) => {
                const maxV = 30;
                return (
                  <View key={i} style={styles.barGroup}>
                    <View style={[styles.stackBar]}>
                      <View style={{ height: (d.new / maxV) * 110, backgroundColor: ORANGE, borderRadius: 3 }} />
                      <View style={{ height: (d.used / maxV) * 110, backgroundColor: aC.isDark ? "#7c2d12" : "#e67e22", borderRadius: 3 }} />
                    </View>
                    <Text style={[styles.barLabel, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>{d.day}</Text>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* RESERVATIONS OVERVIEW */}
          <Card style={styles.mb}>
            <Text style={[styles.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Reservations Overview</Text>
            <View style={styles.reservRow}>
              <View style={styles.donutWrap}>
                <DonutChart data={RESERVATIONS} />
                <View style={styles.donutCenter}>
                  <Text style={[styles.donutTotal, { color: aC.isDark ? WHITE : '#010a1f' }]}>42</Text>
                  <Text style={[styles.donutLabel, { color: aC.isDark ? "#6B7A99" : "#475569" }]}>Total</Text>
                </View>
              </View>
              <View style={styles.reservLegend}>
                {RESERVATIONS.map(r => (
                  <View key={r.label} style={styles.reservItem}>
                    <View style={styles.reservLeft}>
                      <View style={[styles.dot, { backgroundColor: r.color }]} />
                      <Text style={[styles.reservLabel, { color: aC.isDark ? "#C0C8DC" : "#475569" }]}>{r.label}</Text>
                    </View>
                    <Text style={[styles.reservVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>{r.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          {/* AUDIENCE DEMOGRAPHICS */}
          <Card style={styles.mb}>
            <Text style={[styles.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Audience Demographics</Text>
            <Text style={[styles.subLabel, { color: aC.isDark ? "#8090B0" : "#475569" }]}>Top Locations</Text>
            <View style={styles.locRow}>
              {LOCATIONS.map(l => (
                <View key={l} style={[styles.locChip, { backgroundColor: aC.isDark ? "rgba(226,103,27,0.1)" : "rgba(226,103,27,0.08)", borderColor: aC.isDark ? "rgba(226,103,27,0.3)" : "rgba(226,103,27,0.3)" }]}>
                  <Text style={styles.locTxt}>{l}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* SHARE BUTTON */}
          <TouchableOpacity activeOpacity={0.85}>
            <LinearGradient colors={["#032A69", "#E2671B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.shareBtn, { overflow: "hidden" }]}>
              <LinearGradient colors={['rgba(22,64,136,0.4)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <Share2 size={18} color={WHITE} strokeWidth={1.8} />
              <Text style={styles.shareTxt}>Share</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>

        <AdminFooter active="home" />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.bg },
  safeArea:  { flex: 1, backgroundColor: AppColors.bg },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, marginTop: 4 },
  headerBtn:   { width: 36, height: 44, justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 17, fontFamily: "Poppins_600SemiBold" },
  headerSub:   { color: "#8090B0", fontSize: 12, fontFamily: "Poppins_400Regular", paddingHorizontal: 20, marginBottom: 12 },

  scroll: { paddingHorizontal: 20 },
  mb: { marginBottom: 14 },

  rangeRow: { gap: 8, paddingBottom: 14 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#232B45", backgroundColor: "#010A1F" },
  rangeChipActive: { backgroundColor: "#010A1F", borderColor: "rgba(56,189,248,0.5)" },
  rangeTxt:        { color: "#8090B0", fontSize: 12, fontFamily: "Poppins_500Medium" },
  rangeTxtActive:  { color: "#7dd3fc" },
  calBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: "#232B45", backgroundColor: "#010A1F", alignItems: "center", justifyContent: "center" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  statCard:  { width: "47%", alignItems: "center", paddingVertical: 14, backgroundColor: "#010A1F", borderRadius: 20, borderWidth: 1, borderColor: "rgba(100,160,255,0.2)", overflow: 'hidden' },
  statLabel: { color: "#8090B0", fontSize: 12, fontFamily: "Poppins_400Regular", marginBottom: 4 },
  statValue: { color: WHITE, fontSize: 18, fontFamily: "Poppins_700Bold" },
  statDelta: { color: "#34D399", fontSize: 11, fontFamily: "Poppins_600SemiBold", marginTop: 2 },

  card: { backgroundColor: "#010A1F", borderRadius: 20, borderWidth: 1, borderColor: "rgba(100,160,255,0.2)", padding: 14 },
  cardTitle: { color: WHITE, fontSize: 14, fontFamily: "Poppins_600SemiBold", marginBottom: 10 },

  revTopRow: { flexDirection: "row", alignItems: "baseline", gap: 10, marginBottom: 10 },
  revAmount: { color: WHITE, fontSize: 22, fontFamily: "Poppins_700Bold" },
  revDelta:  { color: "#34D399", fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  revMonths: { flexDirection: "row", justifyContent: "space-between", marginTop: 4, marginBottom: 10 },
  revMonth:  { color: "#6B7A99", fontSize: 10, fontFamily: "Poppins_400Regular" },

  breakdownGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  breakdownItem: { width: "47%", backgroundColor: "#010A1F", borderRadius: 12, borderWidth: 1, borderColor: "#1E2748", padding: 10 },
  breakdownLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  breakdownLabel: { color: "#C0C8DC", fontSize: 10, fontFamily: "Poppins_400Regular", flex: 1 },
  breakdownVal:   { color: WHITE, fontSize: 12, fontFamily: "Poppins_600SemiBold" },

  barLegend: { flexDirection: "row", gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendTxt:  { color: "#C0C8DC", fontSize: 11, fontFamily: "Poppins_400Regular" },
  dot: { width: 8, height: 8, borderRadius: 4 },

  barChartWrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", height: 130, marginTop: 4 },
  barGroup: { alignItems: "center", gap: 6 },
  barPair:  { flexDirection: "row", alignItems: "flex-end", gap: 3 },
  barItem:  { width: 14, borderRadius: 3 },
  barLabel: { color: "#6B7A99", fontSize: 10, fontFamily: "Poppins_400Regular" },
  stackBar: { flexDirection: "column-reverse", gap: 2, alignItems: "center", width: 16 },

  progressRow:     { marginBottom: 14 },
  progressLabelRow:{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel:   { color: WHITE, fontSize: 12, fontFamily: "Poppins_500Medium" },
  progressVal:     { color: "#C0C8DC", fontSize: 12, fontFamily: "Poppins_400Regular" },
  progressTrack:   { height: 8, backgroundColor: "#232B45", borderRadius: 4, overflow: "hidden" },
  progressFill:    { height: "100%", borderRadius: 4 },

  unitHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  tabRow: { flexDirection: "row", backgroundColor: "#010A1F", borderRadius: 20, borderWidth: 1, borderColor: "#232B45", padding: 4, marginBottom: 14 },
  tab:       { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: "center" },
  tabActive: { backgroundColor: "#010A1F" },
  tabTxt:    { color: "#8090B0", fontSize: 11, fontFamily: "Poppins_500Medium" },
  tabTxtActive: { color: WHITE },

  reservRow:   { flexDirection: "row", alignItems: "center", gap: 20 },
  donutWrap:   { position: "relative", width: 110, height: 110 },
  donutCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  donutTotal:  { color: WHITE, fontSize: 20, fontFamily: "Poppins_700Bold" },
  donutLabel:  { color: "#6B7A99", fontSize: 10, fontFamily: "Poppins_400Regular" },
  reservLegend:{ flex: 1, gap: 12 },
  reservItem:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reservLeft:  { flexDirection: "row", alignItems: "center", gap: 8 },
  reservLabel: { color: "#C0C8DC", fontSize: 12, fontFamily: "Poppins_400Regular" },
  reservVal:   { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold" },

  subLabel: { color: "#8090B0", fontSize: 12, fontFamily: "Poppins_400Regular", marginBottom: 10 },
  locRow:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  locChip: { backgroundColor: "rgba(226,103,27,0.1)", borderWidth: 1, borderColor: "rgba(226,103,27,0.3)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  locTxt:  { color: ORANGE, fontSize: 13, fontFamily: "Poppins_500Medium" },

  shareBtn: { height: 50, borderRadius: 25, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  shareTxt: { color: WHITE, fontSize: 15, fontFamily: "Poppins_600SemiBold" },
});
