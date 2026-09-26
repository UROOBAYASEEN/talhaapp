import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AppColors, useAppColors } from "@/constants/theme";
import { API_BASE } from "@/constants/api";

const SERVER = API_BASE.replace("/api/v1", "");
function resolveUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${SERVER}${url}`;
}

const features = [
  "Live GPS Tracking",
  "Route History",
  "Engine Lock / Unlock",
  "Geo-fencing Alerts",
  "Speed Alerts",
  "Battery Alerts",
  "Theft Recovery",
  "24/7 Monitoring",
  "Mobile App Access",
  "Driver Notifications",
];

const keyFeatures = [
  { icon: "headset-outline" as const, title: "Stolen Vehicle", subtitle: "Recovery Assistance" },
  { icon: "locate-outline" as const, title: "Geo-Fencing", subtitle: "Alerts" },
  { icon: "notifications-outline" as const, title: "Ignition & Battery", subtitle: "Tampering Alerts" },
];

export default function TrackerDetails() {
  const router = useRouter();
  const aC = useAppColors();
  const params = useLocalSearchParams<{
    providerId?: string; deviceId?: string; deviceName?: string; providerName?: string;
    selectedAddons?: string; addonsTotal?: string; total?: string;
    price?: string; installationFee?: string; monthlyFee?: string;
    deviceImage?: string;
  }>();
  const [fetchedImg, setFetchedImg] = useState<string | null>(null);

  useEffect(() => {
    if (params.deviceImage) return;
    if (!params.deviceId) return;
    fetch(`${API_BASE}/tracker-devices/${params.deviceId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.images?.[0]) setFetchedImg(d.images[0]); })
      .catch(() => {});
  }, [params.deviceId, params.deviceImage]);

  const deviceImgUrl = resolveUrl(params.deviceImage || fetchedImg);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]} edges={["top"]}>
      <View style={[styles.container, { backgroundColor: aC.bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={aC.isDark ? AppColors.textSecondary : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Tracker Details</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { backgroundColor: aC.bg }]}>
          {/* Tracker Card — white light + orange shade */}
          <View style={[styles.trackerCard, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderColor: aC.isDark ? AppColors.gradientEnd : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
            {aC.isDark ? null : <><LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /><LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /></>}
            <View style={styles.trackerTop}>
              {/* Real Image */}
              {deviceImgUrl ? (
                <Image source={{ uri: deviceImgUrl }} style={styles.efuCircleImg} resizeMode="cover" />
              ) : (
                <View style={[styles.efuCircle, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.8)' : '#eef2ff', borderColor: aC.isDark ? AppColors.glassBorder : 'rgba(3,42,105,0.12)' }]}>
                  <Text style={[styles.efuText, { color: aC.isDark ? AppColors.textPrimary : '#032a69' }]}>EFU</Text>
                </View>
              )}
              {/* Tracker Info */}
              <View style={styles.trackerInfo}>
                <Text style={[styles.trackerName, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>{params.deviceName || "TPL Tracker"}</Text>
                <Text style={[styles.trackerDescription, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>{params.providerName || "Pakistan's largest tracking network"}</Text>
              </View>
              {/* Rating */}
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={19} color="#F36B17" />
                <Text style={[styles.ratingText, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>4.9</Text>
              </View>
            </View>

            {/* Pricing */}
            <View style={[styles.priceContainer, { backgroundColor: aC.isDark ? 'rgba(76,48,64,0.35)' : '#f8fafc', borderTopWidth: aC.isDark ? 0 : 1, borderTopColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
              <View style={styles.priceItem}>
                <Text style={[styles.priceLabel, { color: aC.isDark ? AppColors.textSecondary : '#64748b' }]}>Installation</Text>
                <Text style={[styles.priceValue, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Rs {Number(params.installationFee || 4999).toLocaleString()}</Text>
              </View>
              <View style={[styles.verticalLine, { backgroundColor: aC.isDark ? AppColors.divider : 'rgba(3,42,105,0.12)' }]} />
              <View style={styles.priceItem}>
                <Text style={[styles.priceLabel, { color: aC.isDark ? AppColors.textSecondary : '#64748b' }]}>Monthly</Text>
                <Text style={[styles.priceValue, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Rs {Number(params.monthlyFee || 899).toLocaleString()}</Text>
              </View>
              <View style={[styles.verticalLine, { backgroundColor: aC.isDark ? AppColors.divider : 'rgba(3,42,105,0.12)' }]} />
              <View style={styles.priceItem}>
                <Text style={[styles.priceLabel, { color: aC.isDark ? AppColors.textSecondary : '#64748b' }]}>Warranty</Text>
                <Text style={[styles.priceValue, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>2 Years</Text>
              </View>
              <View style={[styles.verticalLine, { backgroundColor: aC.isDark ? AppColors.divider : 'rgba(3,42,105,0.12)' }]} />
              <View style={[styles.priceItem, { paddingTop: 3 }]}>
                <Text style={[styles.priceLabel, { color: aC.isDark ? AppColors.textSecondary : '#64748b', marginTop: 2 }]}>Coverage</Text>
                <Text style={[styles.priceValue, { color: aC.isDark ? AppColors.textPrimary : '#010a1f', fontSize: 11 }]}>Nationwide</Text>
              </View>
            </View>
          </View>

          {/* Features */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Features</Text>
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={14} color={aC.isDark ? AppColors.bg : '#ffffff'} />
                </View>
                <Text style={[styles.featureText, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Key Features */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Key Features Of Tracker</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.keyFeaturesContainer}>
            {keyFeatures.map((item, index) => (
              <View style={[styles.keyFeature, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', borderRadius: aC.isDark ? 0 : 14, padding: aC.isDark ? 0 : 10, shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.05, elevation: aC.isDark ? 0 : 1 }]} key={index}>
                <View style={[styles.keyIconCircle, { backgroundColor: aC.isDark ? AppColors.glassBg : '#eef2ff', borderColor: aC.isDark ? AppColors.glassBorder : 'rgba(3,42,105,0.12)' }]}>
                  <Ionicons name={item.icon} size={24} color={aC.isDark ? AppColors.textSecondary : '#032a69'} />
                </View>
                <Text style={[styles.keyFeatureTitle, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>{item.title}</Text>
                <Text style={[styles.keyFeatureSubtitle, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>{item.subtitle}</Text>
              </View>
            ))}
          </ScrollView>

          {/* What's Included */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>What's Included</Text>
          <Text style={[styles.description, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>Complete hardware kit, professional installation, mobile app access, and a dedicated monitoring SIM with lifetime device support.</Text>

          {/* Installation Process */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Installation Process</Text>
          <Text style={[styles.description, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>Book a slot, our certified technician visits your location, installs and configures the tracker directly, then activates it live — usually within 60 minutes.</Text>

          {/* Warranty */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Warranty Details</Text>
          <Text style={[styles.description, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>2 Years manufacturer warranty covering device faults, free replacement, and re-installation if the unit malfunctions.</Text>

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Bottom Button */}
        <View style={[styles.bottomButtonContainer, { backgroundColor: aC.bg, borderTopWidth: aC.isDark ? 0 : 1, borderTopColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.buttonWrapper}
            onPress={() => {
              router.push({
                pathname: "/tracker-booking" as any,
                params: {
                  providerId: params.providerId || "",
                  providerName: params.providerName || "",
                  deviceId: params.deviceId || "",
                  deviceName: params.deviceName || "",
                  price: params.price || "0",
                  installationFee: params.installationFee || "0",
                  monthlyFee: params.monthlyFee || "0",
                  selectedAddons: params.selectedAddons || "",
                  addonsTotal: params.addonsTotal || "0",
                  total: params.total || "0",
                  deviceImage: params.deviceImage || fetchedImg || "",
                },
              });
            }}
          >
            <LinearGradient
              colors={[AppColors.gradientStart, "#454469", AppColors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.bookButton}
            >
              <Text style={styles.bookButtonText}>Book Installation</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.bg },
  container: { flex: 1, backgroundColor: AppColors.bg },
  header: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  backButton: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { color: AppColors.textPrimary, fontSize: 21, fontFamily: "Poppins_500Medium" },
  headerRight: { width: 40 },
  scrollContent: { paddingHorizontal: 15, paddingTop: 12 },
  trackerCard: {
    height: 148,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: AppColors.gradientEnd,
    overflow: "hidden",
    backgroundColor: AppColors.glassBg,
  },
  trackerTop: { height: 90, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  efuCircle: {
    width: 43,
    height: 43,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
    backgroundColor: "rgba(3,12,40,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  efuCircleImg: {
    width: 43,
    height: 43,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
  },
  efuText: { color: AppColors.textPrimary, fontSize: 11, fontFamily: "Poppins_500Medium" },
  trackerInfo: { flex: 1, marginLeft: 12 },
  trackerName: { color: AppColors.textPrimary, fontSize: 16, fontFamily: "Poppins_700Bold", marginBottom: 3 },
  trackerDescription: { color: AppColors.textSecondary, fontSize: 12, fontFamily: "Poppins_400Regular" },
  ratingContainer: { flexDirection: "row", alignItems: "center", gap: 6, paddingRight: 3 },
  ratingText: { color: AppColors.textSecondary, fontSize: 12, fontFamily: "Poppins_400Regular" },
  priceContainer: {
    height: 58,
    backgroundColor: "rgba(76,48,64,0.35)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  priceItem: { flex: 1, alignItems: "center" },
  priceLabel: { color: AppColors.textSecondary, fontSize: 10, fontFamily: "Poppins_400Regular", marginBottom: 3 },
  priceValue: { color: AppColors.textPrimary, fontSize: 13, fontFamily: "Poppins_500Medium" },
  verticalLine: { width: 1, height: 30, backgroundColor: AppColors.divider },
  sectionTitle: { color: AppColors.textPrimary, fontSize: 16, fontFamily: "Poppins_500Medium", marginTop: 22, marginBottom: 12 },
  featuresContainer: { paddingTop: 1 },
  featureRow: { height: 34, flexDirection: "row", alignItems: "center" },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.gradientEnd,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  featureText: { color: AppColors.textSecondary, fontSize: 13, fontFamily: "Poppins_400Regular" },
  keyFeaturesContainer: { paddingLeft: 8, paddingRight: 5 },
  keyFeature: { width: 130, alignItems: "center", marginRight: 5 },
  keyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
    backgroundColor: AppColors.glassBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  keyFeatureTitle: { color: AppColors.textPrimary, fontSize: 10, fontFamily: "Poppins_500Medium", textAlign: "center", lineHeight: 14 },
  keyFeatureSubtitle: { color: AppColors.textSecondary, fontSize: 9, fontFamily: "Poppins_400Regular", textAlign: "center", lineHeight: 12 },
  description: { color: AppColors.textSecondary, fontSize: 13, fontFamily: "Poppins_400Regular", lineHeight: 18, paddingRight: 3 },
  bottomButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 8,
    backgroundColor: AppColors.bg,
  },
  buttonWrapper: { borderRadius: 25, overflow: "hidden" },
  bookButton: { height: 48, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  bookButtonText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Poppins_700Bold" },
});
