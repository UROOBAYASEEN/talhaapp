import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";

const BG     = "#010a1f";
const WHITE  = "#f9fafc";
const ORANGE = "#e2671b";
const MUTED  = "#baacb6";

export default function PaymentFailedScreen() {
  const router = useRouter();
  const { title = "Payment", price = "0" } =
    useLocalSearchParams<{ title: string; price: string }>();

  const formattedPrice = Number(price.replace?.(/,/g, "") || price || 0).toLocaleString();

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={WHITE} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Payment Failed</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.content}>

        {/* Icon */}
        <View style={s.iconWrap}>
          <LinearGradient
            colors={['rgba(237,0,6,0.15)', 'rgba(237,0,6,0.05)']}
            style={s.iconGrad}
          >
            <Ionicons name="close-circle" size={72} color="#f87171" />
          </LinearGradient>
        </View>

        {/* Message */}
        <Text style={s.title}>Payment Unsuccessful</Text>
        <Text style={s.subtitle}>
          Your payment of{" "}
          <Text style={{ color: ORANGE, fontFamily: "Poppins_600SemiBold" }}>
            PKR {formattedPrice}
          </Text>{" "}
          for{" "}
          <Text style={{ color: WHITE, fontFamily: "Poppins_600SemiBold" }}>
            {title}
          </Text>{" "}
          could not be processed.
        </Text>

        {/* Reasons */}
        <View style={s.reasonCard}>
          <Text style={s.reasonTitle}>Possible Reasons</Text>
          {[
            "Insufficient funds in account",
            "Payment was cancelled",
            "Card details incorrect",
            "Session timed out",
          ].map((r, i) => (
            <View key={i} style={s.reasonRow}>
              <Ionicons name="alert-circle-outline" size={14} color="#f87171" />
              <Text style={s.reasonTxt}>{r}</Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={s.retryWrap}
          activeOpacity={0.85}
          onPress={() => router.back()}
        >
          <LinearGradient
            colors={["#032a69", ORANGE]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.retryBtn}
          >
            <Ionicons name="refresh" size={18} color={WHITE} />
            <Text style={s.retryTxt}>Try Again</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.homeBtn}
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)" as any)}
        >
          <Text style={s.homeTxt}>Back to Home</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  header:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 40, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 18, fontFamily: "Poppins_600SemiBold" },

  content: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 120 },

  iconWrap: { marginBottom: 24 },
  iconGrad: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },

  title:    { color: WHITE, fontSize: 22, fontFamily: "Poppins_700Bold", marginBottom: 12, textAlign: "center" },
  subtitle: { color: MUTED, fontSize: 13, fontFamily: "Poppins_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 28 },

  reasonCard:  { width: "100%", backgroundColor: "rgba(237,0,6,0.06)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(237,0,6,0.2)", padding: 16, marginBottom: 28, gap: 10 },
  reasonTitle: { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold", marginBottom: 4 },
  reasonRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  reasonTxt:   { color: MUTED, fontSize: 12, fontFamily: "Poppins_400Regular" },

  retryWrap: { width: "100%", borderRadius: 30, overflow: "hidden", marginBottom: 12 },
  retryBtn:  { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  retryTxt:  { color: WHITE, fontSize: 15, fontFamily: "Poppins_600SemiBold" },

  homeBtn: { width: "100%", height: 50, borderRadius: 30, borderWidth: 1.5, borderColor: "rgba(100,160,255,0.3)", alignItems: "center", justifyContent: "center" },
  homeTxt: { color: WHITE, fontSize: 15, fontFamily: "Poppins_500Medium" },
});
