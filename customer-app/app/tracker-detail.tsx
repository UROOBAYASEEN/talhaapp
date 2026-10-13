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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AppColors, useAppColors } from "@/constants/theme";
import { API_BASE } from "@/constants/api";
import { PRIMARY_BTN_COLORS, WARM_CARD_COLORS, WARM_CARD_LOCATIONS } from "@/components/shared/FigmaEffects";

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
  { icon: "headset-outline" as const, mci: "headset",            title: "Stolen Vehicle", subtitle: "Recovery Assistance" },
  { icon: "locate-outline" as const, mci: "map-marker-radius",   title: "Geo-Fencing", subtitle: "Alerts" },
  { icon: "notifications-outline" as const, mci: "bell-alert-outline", title: "Ignition & Battery", subtitle: "Tampering Alerts" },
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
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={aC.isDark ? '#C9C6D0' : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Tracker Details</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { backgroundColor: aC.bg }]}>
          {/* Tracker Card — border: orange (top) → blue (bottom) */}
          <LinearGradient
            colors={aC.isDark ? ['#E2671B', '#8A5A55', '#2E4F8E'] : ['rgba(3,42,105,0.12)', 'rgba(3,42,105,0.12)']}
            locations={aC.isDark ? [0, 0.5, 1] : undefined}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={styles.cardBorder}
          >
          <View style={[styles.trackerCard, { backgroundColor: aC.isDark ? '#0B1D4A' : '#ffffff' }]}>
            {aC.isDark
              ? <LinearGradient colors={WARM_CARD_COLORS as any} locations={WARM_CARD_LOCATIONS as any} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              : <></>}
            <View style={styles.trackerTop}>
              {deviceImgUrl ? (
                <Image source={{ uri: deviceImgUrl }} style={styles.efuCircleImg} resizeMode="cover" />
              ) : (
                <View style={styles.efuCircle}>
                  <Text style={styles.efuText}>EFU</Text>
                </View>
              )}
              <View style={styles.trackerInfo}>
                <Text style={[styles.trackerName, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={1}>{params.deviceName || "TPL Tracker"}</Text>
                <Text style={[styles.trackerDescription, { color: aC.isDark ? '#BAB6C4' : '#475569' }]} numberOfLines={1}>{params.providerName || "Pakistan's largest tracking network"}</Text>
              </View>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color="#F36B17" />
                <Text style={[styles.ratingText, { color: aC.isDark ? '#BAB6C4' : '#475569' }]}>4.9</Text>
              </View>
            </View>

            {/* Pricing */}
            <View style={styles.priceContainer}>
              {[
                { label: 'Installation', value: `Rs ${Number(params.installationFee || 4999).toLocaleString()}` },
                { label: 'Monthly',      value: `Rs ${Number(params.monthlyFee || 899).toLocaleString()}` },
                { label: 'Warranty',     value: '2 Years' },
                { label: 'Coverage',     value: 'Nationwide' },
              ].map((item, i) => (
                <React.Fragment key={item.label}>
                  {i > 0 && <View style={[styles.verticalLine, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(3,42,105,0.12)' }]} />}
                  <View style={styles.priceItem}>
                    <Text style={[styles.priceLabel, { color: aC.isDark ? '#C9C6D0' : '#64748b' }]}>{item.label}</Text>
                    <Text style={[styles.priceValue, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]} numberOfLines={1}>{item.value}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
          </LinearGradient>

          {/* Features */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Features</Text>
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                </View>
                <Text style={[styles.featureText, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Key Features */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Key Features Of Tracker</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.keyFeaturesContainer}>
            {keyFeatures.map((item, index) => (
              <View style={styles.keyFeature} key={index}>
                <View style={[styles.keyIconCircle, { borderColor: aC.isDark ? '#E6E4EA' : 'rgba(3,42,105,0.3)' }]}>
                  <MaterialCommunityIcons name={item.mci as any} size={24} color={aC.isDark ? '#E6E4EA' : '#032a69'} />
                </View>
                <Text style={[styles.keyFeatureTitle, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>{item.title}{"\n"}{item.subtitle}</Text>
              </View>
            ))}
          </ScrollView>

          {/* What's Included */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>What's Included</Text>
          <Text style={[styles.description, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Complete hardware kit, professional installation, mobile app access, and a dedicated monitoring SIM with lifetime device support.</Text>

          {/* Installation Process */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Installation Process</Text>
          <Text style={[styles.description, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Book a slot, our certified technician visits your location, installs and configures the tracker directly, then activates it live — usually within 60 minutes.</Text>

          {/* Warranty */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Warranty Details</Text>
          <Text style={[styles.description, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>2 Years manufacturer warranty covering device faults, free replacement, and re-installation if the unit malfunctions.</Text>

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
              colors={(aC.isDark ? PRIMARY_BTN_COLORS : ['#27467F', '#8C6A78', '#FF9654']) as any}
              locations={[0, 0.5, 1]}
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
  header: { height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, marginTop: 6 },
  backButton: { width: 36, height: 36, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Poppins_500Medium" },
  headerRight: { width: 36 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 6 },

  cardBorder:  { borderRadius: 16, padding: 1 },
  trackerCard: { borderRadius: 15, overflow: "hidden", paddingBottom: 12 },
  trackerTop:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 14, paddingBottom: 14 },
  efuCircle:    { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: "#8FAEE3", backgroundColor: "#12306A", alignItems: "center", justifyContent: "center" },
  efuCircleImg: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: "#8FAEE3" },
  efuText:      { color: "#F2F1F5", fontSize: 11, fontFamily: "Poppins_500Medium" },
  trackerInfo:  { flex: 1, marginLeft: 12 },
  trackerName:  { fontSize: 16, fontFamily: "Poppins_500Medium" },
  trackerDescription: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  ratingContainer: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  ratingText: { fontSize: 12, fontFamily: "Poppins_400Regular" },

  priceContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  priceItem:  { flex: 1, paddingHorizontal: 4 },
  priceLabel: { fontSize: 10.5, fontFamily: "Poppins_400Regular", marginBottom: 2 },
  priceValue: { fontSize: 12.5, fontFamily: "Poppins_500Medium" },
  verticalLine: { width: 1, height: 30 },

  sectionTitle: { fontSize: 16, fontFamily: "Poppins_400Regular", marginTop: 22, marginBottom: 10 },
  featuresContainer: { paddingTop: 1 },
  featureRow: { height: 34, flexDirection: "row", alignItems: "center" },
  checkCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: AppColors.gradientEnd, alignItems: "center", justifyContent: "center", marginRight: 16 },
  featureText: { fontSize: 12.5, fontFamily: "Poppins_400Regular" },

  keyFeaturesContainer: { paddingLeft: 4, paddingRight: 10, gap: 14 },
  keyFeature:    { width: 124, alignItems: "center" },
  keyIconCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  keyFeatureTitle:    { fontSize: 11.5, fontFamily: "Poppins_400Regular", textAlign: "center", lineHeight: 16 },
  keyFeatureSubtitle: { fontSize: 11.5, fontFamily: "Poppins_400Regular", textAlign: "center", lineHeight: 16 },
  description: { fontSize: 12.5, fontFamily: "Poppins_400Regular", lineHeight: 19, paddingRight: 3 },

  bottomButtonContainer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingBottom: 20, paddingTop: 8, backgroundColor: AppColors.bg },
  buttonWrapper:  { borderRadius: 25, overflow: "hidden" },
  bookButton:     { height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  bookButtonText: { color: "#EDEBF0", fontSize: 17, fontFamily: "Poppins_600SemiBold" },
});
