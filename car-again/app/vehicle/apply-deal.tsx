import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/constants/api";
import PaymentSection from "@/components/shared/PaymentSection";
import { useAppColors } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BG       = "#010a1f";
const WHITE    = "#f9fafc";
const SUBTITLE = "#baacb6";
const ORANGE   = "#e2671b";
const GLASS    = "rgba(3,12,40,0.6)";
const BORDER   = "rgba(255,255,255,0.12)";
const BLUE_B   = "rgba(91,152,213,0.5)";

const AD_POSTING_FEE = 1_650;
const FEATURED_FEE   = 5_000;
const TOTAL          = AD_POSTING_FEE + FEATURED_FEE;   // 6,650
const DEMO_SUCCESS_AFTER_SAFE_PAY_RETURN = true;


export default function ApplyDealScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();
  const insets = useSafeAreaInsets();

  const {
    vehicleId = "",
    photo     = "",
    title     = "Your Vehicle",
    price     = "0",
  } = useLocalSearchParams<{
    vehicleId: string;
    photo:     string;
    title:     string;
    price:     string;
  }>();

  const [loading, setLoading] = useState(false);

  async function handlePay() {
    if (!token) {
      Alert.alert("Error", "Please login first");
      return;
    }
    if (!vehicleId || vehicleId === "") {
      Alert.alert("Error", "Vehicle ID missing. Please try again from your ad.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/payments/safepay/checkout`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_id:     vehicleId,
          promotion_type: "featured",
          duration_days:  7,
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        const msg = typeof responseData.detail === 'string'
          ? responseData.detail
          : Array.isArray(responseData.detail)
          ? responseData.detail.map((e: any) => e.msg).join(', ')
          : "Failed to create payment session";
        throw new Error(msg);
      }

      const checkout_url  = responseData.checkout_url  || responseData.url || responseData.redirect_url;
      const promotion_id  = responseData.promotion_id  || responseData.id;

      if (!checkout_url) {
        throw new Error("No checkout URL received from server");
      }

      // Open SafePay URL — try WebBrowser first, fallback to Linking
      let returnedFromSafePay = false;
      try {
        await WebBrowser.openBrowserAsync(checkout_url, {
          toolbarColor: BG,
          showTitle:    true,
        });
        returnedFromSafePay = true;
      } catch {
        await Linking.openURL(checkout_url);
      }

      if (DEMO_SUCCESS_AFTER_SAFE_PAY_RETURN && returnedFromSafePay) {
        router.replace({
          pathname: "/vehicle/payment-success",
          params: { kind: 'promote', vid: vehicleId, photo, title, price, home: '/(tabs)', demo: '1' },
        });
        return;
      }

      // 3 — Browser closed: poll backend status (max 30s)
      const maxAttempts = 15;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 2000));

        const statusRes = await fetch(
          `${API_BASE}/payments/safepay/status/${promotion_id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await statusRes.json();

        if (data.success) {
          router.replace({
            pathname: "/vehicle/payment-success",
            params:   { kind: 'promote', vid: vehicleId, photo, title, price, home: '/(tabs)' },
          });
          return;
        }
        if (data.status === "failed") {
          Alert.alert("Payment Failed", "Payment was not successful. Please try again.");
          return;
        }
        // status === "pending" — keep polling
      }

      Alert.alert(
        "Payment Pending",
        "We could not confirm your payment yet. If you completed payment, your ad will be promoted shortly.",
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const vehiclePrice = Number(price.replace?.(/,/g, "") || price || 0);
  const formattedPrice = vehiclePrice >= 10_000_000
    ? `${Number((vehiclePrice / 10_000_000).toFixed(2))} Crore`
    : vehiclePrice >= 100_000
      ? `${Number((vehiclePrice / 100_000).toFixed(2))} Lac`
      : vehiclePrice.toLocaleString();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg, paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()} disabled={loading}>
          <Ionicons name="chevron-back" size={27} color={aC.isDark ? SUBTITLE : '#010a1f'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Payment</Text>
        <View style={styles.headerIcon} />
      </View>

      <KeyboardAvoidingView style={styles.keyboardArea} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >

        {/* Heading */}
        <View style={styles.headingBox}>
          <Text style={[styles.heading, { color: aC.isDark ? WHITE : '#010a1f' }]}>Complete Your Ad Payment</Text>
          <Text style={[styles.subHeading, { color: aC.isDark ? SUBTITLE : '#475569' }]}>Your ad will be published after successful payment.</Text>
        </View>

        {/* Payment Details */}
        <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Payment Details</Text>
        <View style={[styles.detailCard, { backgroundColor: aC.isDark ? GLASS : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', overflow: 'hidden', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 12, elevation: aC.isDark ? 0 : 3 }]}>
          {!aC.isDark && <><LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /><LinearGradient colors={['transparent', 'rgba(226,103,27,0.09)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /></>}
          {/* Vehicle preview */}
          <View style={styles.carRow}>
            <View style={[styles.carImgBox, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.06)' }]}>
              {photo
                ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                : <Ionicons name="car-outline" size={28} color={aC.isDark ? SUBTITLE : '#94a3b8'} />
              }
            </View>
            <View style={styles.carInfo}>
              <Text style={[styles.carName, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={2}>{title}</Text>
              <Text style={styles.carPrice}>PKR {formattedPrice}</Text>
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
              <Text style={styles.activeTxt}>Active</Text>
              </View>
            </View>
          </View>

          {[
            { label: "Ad Posting Fee", value: `Rs ${AD_POSTING_FEE.toLocaleString()}` },
            { label: "Featured",       value: `Rs ${FEATURED_FEE.toLocaleString()}` },
          ].map((r, i) => (
            <View key={i} style={[styles.feeRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.feeLabel, { color: aC.isDark ? WHITE : '#64748b' }]}>{r.label}</Text>
              <Text style={[styles.feeValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>{r.value}</Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(3,42,105,0.08)', height: 1 }]} />

          <View style={styles.feeRow}>
            <Text style={[styles.totalLabel, { color: aC.isDark ? WHITE : '#010a1f' }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: aC.isDark ? WHITE : '#032a69' }]}>Rs {TOTAL.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment Section */}
        <PaymentSection
          price={TOTAL}
          description="Ad Posting + Featured Promotion"
          loading={loading}
          onPay={(_method) => handlePay()}
        />

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  keyboardArea: { flex: 1 },

  header: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerIcon: { width: 35, height: 35, justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 21, fontFamily: "Poppins_600SemiBold" },

  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },

  headingBox: { marginBottom: 24 },
  heading: { color: WHITE, fontSize: 19, fontFamily: "Poppins_600SemiBold", marginBottom: 3 },
  subHeading: { color: SUBTITLE, fontSize: 15, fontFamily: "Poppins_400Regular", lineHeight: 21 },

  sectionTitle: {
    color: WHITE, fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 12,
  },

  detailCard: {
    backgroundColor: GLASS,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 16, overflow: "hidden",
    marginBottom: 24,
  },
  carRow: {
    flexDirection: "row", gap: 20,
    paddingHorizontal: 12, paddingTop: 18, paddingBottom: 5, alignItems: "center",
  },
  carImgBox: {
    width: '48%', aspectRatio: 1.51, borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  carInfo: { flex: 1, gap: 7, justifyContent: "center" },
  carName: { color: WHITE, fontSize: 12, fontFamily: "Poppins_600SemiBold", lineHeight: 18 },
  carPrice: { color: ORANGE, fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  activeBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,105,81,0.22)",
    alignSelf: "flex-start",
    paddingHorizontal: 12, paddingVertical: 3,
    borderRadius: 20,
  },
  activeDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#19d273" },
  activeTxt: { color: "#19d273", fontSize: 11, fontFamily: "Poppins_500Medium" },

  divider: { height: 0 },

  feeRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 11,
  },
  feeLabel: { color: WHITE, fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  feeValue: { color: WHITE, fontSize: 14, fontFamily: "Poppins_400Regular" },
  totalLabel: { color: WHITE, fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  totalValue: { color: WHITE, fontSize: 14, fontFamily: "Poppins_400Regular" },

  methodCard: {
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    borderRadius: 14, padding: 16, marginBottom: 10,
    overflow: 'hidden',
  },
  methodCardActive: {
    borderColor: BLUE_B,
    backgroundColor: "rgba(3,12,40,0.6)",
  },
  methodTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  radioActive: { borderColor: BLUE_B },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE_B },
  methodLabel: { color: WHITE, fontSize: 14, fontFamily: "Poppins_500Medium" },

  cardLogos: { flexDirection: "row", alignItems: "center", gap: 6 },
  visaTxt: { color: "#1A1F71", backgroundColor: WHITE, fontSize: 10, fontFamily: "Poppins_700Bold", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  mcLogo: { flexDirection: "row", alignItems: "center" },
  mcCircle: { width: 18, height: 18, borderRadius: 9, opacity: 0.9 },

  cardFields: { marginTop: 14, gap: 10 },
  fieldLabel: { color: SUBTITLE, fontSize: 12, fontFamily: "Poppins_400Regular", marginBottom: 6 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: BG,
    borderWidth: 1.5, borderColor: BLUE_B,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
    gap: 8,
  },
  cardInput: { flex: 1, color: WHITE, fontSize: 14, fontFamily: "Poppins_400Regular" },
  twoCol: { flexDirection: "row", gap: 10 },
  halfInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BLUE_B,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  halfInput: {
    flex: 1,
    color: WHITE,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    padding: 0,
  },

  payLogo: { width: 36, height: 36 },
  epLogo: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: "#00A550",
    alignItems: "center", justifyContent: "center",
  },
  epLogoTxt: {
    color: WHITE, fontSize: 13,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.5,
  },

  payBtn: { borderRadius: 32, overflow: "hidden", marginTop: 24 },
  gradBtn: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  payTxt: { color: WHITE, fontSize: 16, fontFamily: "Poppins_600SemiBold" },
});
