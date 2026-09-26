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

const BG       = "#010a1f";
const WHITE    = "#f9fafc";
const SUBTITLE = "#baacb6";
const ORANGE   = "#e2671b";
const GLASS    = "rgba(3,12,40,0.6)";
const BORDER   = "rgba(255,255,255,0.12)";

const PLANS = [
  { weeks: 6, desc: "Balanced exposure for more buyers",      price: "Rs 5,500" },
  { weeks: 4, desc: "Recommended for luxury and sports cars", price: "Rs 6,650" },
  { weeks: 2, desc: "Recommended for popular cars",           price: "Rs 4,450" },
];

const FEATURES = [
  "Appear at the top of listings",
  "Get 10x more responses",
  "Get 5x more visibility",
];

export default function SuccessScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const {
    photo     = "",
    vehicleId = "",
    title     = "Your Vehicle",
    price     = "0",
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
        <Text style={styles.emoji}>🎉</Text>
        <Text style={[styles.title, { color: aC.isDark ? WHITE : '#010a1f' }]}>Ad Published Successfully!</Text>
        <Text style={[styles.subtitle, { color: aC.isDark ? SUBTITLE : '#475569' }]}>
          Your ad is now live & visible to{"\n"}thousand of buyers
        </Text>

        {/* Ad preview card */}
        <View style={[styles.previewCard, { backgroundColor: aC.isDark ? GLASS : '#ffffff', borderColor: aC.isDark ? ORANGE : 'rgba(3,42,105,0.14)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 12, elevation: aC.isDark ? 0 : 3 }]}>
          {aC.isDark ? (
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.25)']} start={{ x: 0.5, y: 0.5 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
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
            <Text style={[styles.previewName, { color: aC.isDark ? WHITE : '#010a1f' }]}>Honda City 1.2 Aspire CVT</Text>
            <Text style={styles.previewPrice}>PKR 53 Lac</Text>

            <Text style={[styles.previewMeta, { color: aC.isDark ? SUBTITLE : '#64748b' }]}>Karachi  •  2024  •  CVT</Text>

            <View style={styles.activeDateRow}>
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeTxt}>Active</Text>
              </View>
              <Text style={[styles.previewDate, { color: aC.isDark ? SUBTITLE : '#64748b' }]}>Posted on 17th July 2025</Text>
            </View>
          </View>

          {/* Share */}
          <TouchableOpacity style={styles.shareBtn}>
            <Ionicons name="share-social-outline" size={18} color={aC.isDark ? SUBTITLE : '#64748b'} />
          </TouchableOpacity>
        </View>

        {/* Featured Ad */}
        <View style={styles.featuredBox}>
          <View style={styles.featuredHeader}>
            <Ionicons name="star" size={15} color={ORANGE} />
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
              style={[styles.planCard, { backgroundColor: aC.isDark ? GLASS : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2, overflow: 'hidden' }, selectedPlan === i && (aC.isDark ? styles.planCardActive : { borderColor: ORANGE, backgroundColor: 'rgba(226,103,27,0.08)' })]}
            >
              {aC.isDark ? null : selectedPlan === i ? <LinearGradient colors={['rgba(226,103,27,0.08)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /> : <LinearGradient colors={['rgba(3,42,105,0.03)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
              {aC.isDark && selectedPlan === i && <LinearGradient colors={['rgba(22,64,136,0.15)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
              <View style={styles.planLeft}>
                <View style={[styles.radio, { borderColor: aC.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(3,42,105,0.18)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }, selectedPlan === i && (aC.isDark ? styles.radioActive : { borderColor: ORANGE })]}>
                  {selectedPlan === i && <View style={[styles.radioDot, { backgroundColor: aC.isDark ? 'rgba(100,160,255,0.9)' : ORANGE }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planWeeks, { color: aC.isDark ? WHITE : '#010a1f' }]}>{plan.weeks} weeks</Text>
                  <Text style={[styles.planDesc, { color: aC.isDark ? SUBTITLE : '#475569' }]}>{plan.desc}</Text>
                </View>
              </View>
              <Text style={[styles.planPrice, { color: selectedPlan === i ? (aC.isDark ? 'rgba(100,160,255,0.9)' : ORANGE) : (aC.isDark ? WHITE : '#010a1f') }]}>
                {plan.price}
              </Text>
            </TouchableOpacity>
          ))}
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
          style={[styles.secondaryBtn, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.14)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: "/vehicle/apply-deal", params: { vehicleId, photo, title, price } })}
        >
          {aC.isDark ? (
            <>
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            </>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.05)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.08)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            </>
          )}
          <Text style={[styles.secondaryTxt, { color: aC.isDark ? WHITE : '#032a69' }]}>Apply Deal</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: "center",
  },

  /* Hero */
  emoji: { fontSize: 54, marginBottom: 18, textAlign: "center" },
  title: {
    color: WHITE,
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: SUBTITLE,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },

  /* Preview card */
  previewCard: {
    width: "100%",
    backgroundColor: GLASS,
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    marginBottom: 24,
    overflow: "hidden",
  },
  previewImgBox: {
    width: 100,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    alignSelf: "stretch",
  },
  previewInfo: { flex: 1, gap: 3 },
  previewName: {
    color: WHITE,
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    lineHeight: 19,
  },
  previewPrice: {
    color: ORANGE,
    fontSize: 15,
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
  previewMeta: { color: SUBTITLE, fontSize: 11, fontFamily: "Poppins_400Regular" },
  activeDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewDate: { color: SUBTITLE, fontSize: 11, fontFamily: "Poppins_400Regular" },
  shareBtn: { padding: 2 },

  /* Featured Ad */
  featuredBox: { width: "100%", marginBottom: 20 },
  featuredHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  featuredTitle: {
    color: WHITE,
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 7,
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ORANGE,
    flexShrink: 0,
  },
  bulletTxt: {
    color: SUBTITLE,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },

  /* Plans */
  plansWrap: { width: "100%", gap: 10, marginBottom: 28 },
  planCard: {
    backgroundColor: GLASS,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planCardActive: {
    borderColor: 'rgba(100,160,255,0.9)',
    backgroundColor: "rgba(50,100,200,0.15)",
  },
  planLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
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
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 2,
  },
  planDesc: {
    color: SUBTITLE,
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    lineHeight: 16,
  },
  planPrice: {
    color: WHITE,
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    flexShrink: 0,
  },

  /* Buttons */
  primaryBtn: {
    width: "100%",
    borderRadius: 32,
    overflow: "hidden",
    marginBottom: 12,
  },
  gradBtn: {
    height: 54,
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
    height: 54,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(100,160,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  secondaryTxt: {
    color: WHITE,
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
  },
});
