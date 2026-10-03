import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppColors } from "@/constants/theme";

const { width } = Dimensions.get("window");

const BG = "#010A1F";
const WHITE = "#f9fafc";
const SUBTITLE = "#baacb6";
const ORANGE = "#e2671b";
const GLASS = "rgba(3,12,40,0.6)";
const BORDER = "rgba(255,255,255,0.12)";

const PLANS = [
  { weeks: 6, desc: "Balanced exposure for more buyers", price: "Rs 5,500" },
  { weeks: 4, desc: "Recommended for luxury and sports cars", price: "Rs 6,650" },
  { weeks: 2, desc: "Recommended for popular cars", price: "Rs 4,450" },
];

const FEATURES = [
  "Appear at the top of listings",
  "Get 10x more responses",
  "Get 5x more visibility",
];

function formatVehiclePrice(value: string) {
  const numeric = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return value;
  if (numeric >= 10_000_000) {
    return `${Number((numeric / 10_000_000).toFixed(2))} Crore`;
  }
  if (numeric >= 100_000 && numeric < 10_000_000) {
    return `${Number((numeric / 100_000).toFixed(2))} Lac`;
  }
  return numeric.toLocaleString();
}

export default function SuccessScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const {
    photo = "",
    vehicleId = "",
    title = "Your Vehicle",
    price = "0",
  } = useLocalSearchParams<{ photo: string; vehicleId: string; title: string; price: string }>();
  const [selectedPlan, setSelectedPlan] = useState(0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Celebration */}
        <Image source={require('../../assets/images/successful.png')} style={styles.celebrationImage} resizeMode="contain" />
        <Text style={[styles.title, { color: aC.isDark ? WHITE : '#010a1f' }]}>Ad Published Successfully!</Text>
        <Text style={[styles.subtitle, { color: aC.isDark ? SUBTITLE : '#475569' }]}>
          Your ad is now live & visible to{"\n"}thousand of buyers
        </Text>

        {/* Ad preview card */}
        <LinearGradient colors={aC.isDark ? ['#E2671B', '#032A69'] : ['rgba(3,42,105,0.14)', 'rgba(3,42,105,0.14)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.previewBorder}>
          <View style={[styles.previewCard, { backgroundColor: aC.isDark ? GLASS : '#ffffff', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 12, elevation: aC.isDark ? 0 : 3 }]}>
            {aC.isDark ? (
              <LinearGradient colors={['#010A1F', '#071837', '#663A2B']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            ) : (
              <>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.13)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              </>
            )}
            {/* Car image */}
            <View style={[styles.previewImgBox, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.06)' }]}>
              {photo
                ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                : <Ionicons name="car-outline" size={30} color={aC.isDark ? SUBTITLE : '#94a3b8'} />
              }
            </View>

            {/* Info */}
            <View style={styles.previewInfo}>
              <Text style={[styles.previewName, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={2}>{title}</Text>
              <Text style={styles.previewPrice}>PKR {formatVehiclePrice(price)}</Text>

              <View style={styles.metaRow}><Ionicons name="location-outline" size={18} color={SUBTITLE} /><Text style={[styles.previewMeta, { color: aC.isDark ? SUBTITLE : '#64748b' }]}>Karachi • 2024 • CVT</Text><Ionicons name="share-social-outline" size={18} color={ORANGE} /></View>

              <View style={styles.activeDateRow}>
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeTxt}>Active</Text>
                </View>
                <Text style={[styles.previewDate, { color: aC.isDark ? SUBTITLE : '#64748b' }]}>Posted on 27th july 2026</Text>
                <Ionicons name="chevron-forward" size={23} color={ORANGE} />
              </View>
            </View>

            {/* Share */}
          </View>
        </LinearGradient>

        {/* Featured Ad */}
        <View style={[styles.featuredSection, { backgroundColor: aC.isDark ? '#010716' : '#ffffff', borderColor: aC.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(3,42,105,0.12)' }]}>
          <View style={styles.featuredBox}>
            <View style={styles.featuredHeader}>
              <Ionicons name="star" size={23} color={ORANGE} />
              <Text style={[styles.featuredTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Featured Ad</Text>
            </View>
            {FEATURES.map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={[styles.bulletTxt, { color: aC.isDark ? SUBTITLE : '#475569' }]}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Plan cards */}
          <View style={styles.plansWrap}>
            {PLANS.map((plan, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                onPress={() => setSelectedPlan(i)}
                style={[styles.planCard, { backgroundColor: aC.isDark ? (selectedPlan === i ? '#061B4A' : '#010817') : '#ffffff', borderColor: aC.isDark ? (selectedPlan === i ? 'transparent' : '#FFFFFF') : 'rgba(3,42,105,0.12)', borderWidth: aC.isDark && selectedPlan !== i ? 0.8 : 1, shadowColor: aC.isDark ? '#164088' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark && selectedPlan !== i ? 0.12 : aC.isDark ? 0 : 0.06, shadowRadius: 4, elevation: aC.isDark ? 0 : 2, overflow: 'hidden' }, selectedPlan === i && !aC.isDark && { borderColor: ORANGE, backgroundColor: 'rgba(226,103,27,0.08)' }]}
              >
                {aC.isDark ? null : selectedPlan === i ? <LinearGradient colors={['rgba(226,103,27,0.08)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /> : <LinearGradient colors={['rgba(3,42,105,0.03)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
                {aC.isDark && selectedPlan !== i && <><LinearGradient colors={['#16408880', '#0D255480', '#00000001', '#00000001', '#0D255480', '#16408880']} locations={[0, 0.08, 0.22, 0.78, 0.92, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /><LinearGradient colors={['#16408880', '#0D255480', '#00000001', '#00000001', '#0D255480', '#16408880']} locations={[0, 0.04, 0.12, 0.88, 0.96, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /></>}
                <View style={styles.planLeft}>
                  <View style={styles.planTop}><Text style={[styles.planWeeks, { color: aC.isDark ? WHITE : '#010a1f' }]}>{plan.weeks} weeks</Text><View style={[styles.radio, selectedPlan === i && styles.radioActive]}>{selectedPlan === i && <View style={styles.radioDot} />}</View></View>
                  <View style={styles.planBottom}>
                    <Text style={[styles.planDesc, { color: aC.isDark ? SUBTITLE : '#475569' }]}>{plan.desc}</Text>
                    <Text style={styles.planPrice}>{plan.price}</Text><Ionicons name="chevron-forward" size={19} color={ORANGE} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* View My Ads */}
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.87}
          onPress={() => router.replace("/my-ads")}
        >
          <LinearGradient
            colors={["#032a69", ORANGE]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradBtn}
          >
            <Text style={styles.primaryTxt}>View My Ads</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Apply Deal */}
        <TouchableOpacity
          style={[styles.secondaryBtn, { backgroundColor: aC.isDark ? '#030D23' : '#ffffff', borderColor: aC.isDark ? '#9CB7DE' : 'rgba(3,42,105,0.14)', shadowColor: aC.isDark ? '#759DE0' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0.18 : 0.06, shadowRadius: 5, elevation: aC.isDark ? 0 : 2 }]}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: "/vehicle/apply-deal", params: { vehicleId, photo, title, price } })}
        >
          {aC.isDark ? (
            <>
              <LinearGradient colors={['rgba(48,104,193,0.4)', 'transparent', 'transparent', 'rgba(48,104,193,0.4)']} locations={[0, 0.17, 0.83, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(48,104,193,0.27)', 'transparent', 'transparent', 'rgba(48,104,193,0.27)']} locations={[0, 0.08, 0.92, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            </>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.05)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            </>
          )}
          <Text style={[styles.secondaryTxt, { color: aC.isDark ? '#D0D0D8' : '#032a69' }]}>Apply Deal</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: {
    paddingHorizontal: 14,
    paddingTop: 56,
    paddingBottom: 40,
    alignItems: "center",
  },

  /* Hero */
  celebrationImage: { width: 80, height: 80, marginBottom: 12, alignSelf: "center" },
  title: {
    color: WHITE,
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: SUBTITLE,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 25,
    marginBottom: 16,
  },

  /* Preview card */
  previewBorder: { width: "100%", borderRadius: 19, padding: 1, marginBottom: 14 },
  previewCard: {
    width: "100%",
    backgroundColor: GLASS,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
    minHeight: 141,
    overflow: "hidden",
  },
  previewImgBox: {
    width: "39%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    alignSelf: "stretch",
  },
  previewInfo: { flex: 1, gap: 6, justifyContent: "center", minWidth: 0 },
  previewName: {
    color: WHITE,
    fontSize: 13.5,
    fontFamily: "Poppins_600SemiBold",
    lineHeight: 19,
  },
  previewPrice: {
    color: ORANGE,
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e" },
  activeTxt: { color: "#22c55e", fontSize: 11, fontFamily: "Poppins_500Medium" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  previewMeta: { color: SUBTITLE, fontSize: 11, fontFamily: "Poppins_400Regular", flex: 1 },
  activeDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  previewDate: { color: SUBTITLE, fontSize: 8, fontFamily: "Poppins_400Regular", flexShrink: 1 },
  shareBtn: { padding: 2 },

  /* Featured Ad */
  featuredSection: { width: "100%", borderWidth: 1, borderRadius: 17, paddingHorizontal: 5, paddingBottom: 22, marginBottom: 24 },
  featuredBox: { width: "100%", paddingHorizontal: 14, paddingTop: 18 },
  featuredHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  featuredTitle: {
    color: WHITE,
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 7,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: WHITE,
    flexShrink: 0,
  },
  bulletTxt: {
    color: WHITE,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },

  /* Plans */
  plansWrap: { width: "100%", gap: 12, paddingHorizontal: 0 },
  planCard: {
    backgroundColor: "#061B4A",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 15,
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planCardActive: {
    borderColor: 'rgba(100,160,255,0.9)',
    backgroundColor: "#061B4A",
  },
  planLeft: {
    flexDirection: "column",
    gap: 5,
    flex: 1,
  },
  planTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planBottom: { flexDirection: "row", alignItems: "center", gap: 4 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioActive: { borderColor: 'rgba(100,160,255,0.9)' },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(100,160,255,0.9)',
  },
  planWeeks: {
    color: WHITE,
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 2,
  },
  planDesc: {
    color: SUBTITLE,
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    lineHeight: 16,
  },
  planPrice: {
    color: ORANGE,
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    flexShrink: 0,
    marginLeft: "auto",
  },

  /* Buttons */
  primaryBtn: {
    width: "100%",
    borderRadius: 32,
    overflow: "hidden",
    marginBottom: 12,
  },
  gradBtn: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryTxt: {
    color: WHITE,
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  secondaryBtn: {
    width: "100%",
    height: 49,
    borderRadius: 32,
    borderWidth: 1.2,
    borderColor: "rgba(100,160,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  secondaryTxt: {
    color: WHITE,
    fontSize: 17,
    fontFamily: "Poppins_500Medium",
  },
});
