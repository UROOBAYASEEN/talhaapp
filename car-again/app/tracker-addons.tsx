import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AppColors, useAppColors } from "@/constants/theme";

function GlassInset() {
  const aC = useAppColors();
  if (!aC.isDark) {
    return (
      <>
        <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      </>
    );
  }
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

const addons = [
  { id: 1, title: "SMS Ignition On", price: 5500 },
  { id: 2, title: "SMS Ignition Off", price: 5500 },
  { id: 3, title: "Vehicle Analytics", price: 5500 },
  { id: 4, title: "Over Speeding Alerts on SMS", price: 3000 },
  { id: 5, title: "Battery Alerts on SMS", price: 1000 },
  { id: 6, title: "Geo-fencing – No Go Areas on SMS", price: 2000 },
];

export default function AddonsScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const params = useLocalSearchParams<{
    providerId?: string; providerName?: string;
    deviceId?: string; deviceName?: string;
    price?: string; installationFee?: string; monthlyFee?: string;
    deviceImage?: string;
  }>();

  const [selected, setSelected] = useState<number[]>([]);

  const productPrice = Number(params.price || 25500);

  const toggleAddon = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const addonTotal = selected.reduce((total, id) => {
    const addon = addons.find((item) => item.id === id);
    return total + (addon?.price || 0);
  }, 0);

  const total = productPrice + addonTotal;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]} edges={["top"]}>
      <View style={[styles.container, { backgroundColor: aC.bg, borderColor: aC.isDark ? AppColors.glassBorder : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderColor: aC.isDark ? AppColors.glassBorder : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
          <GlassInset />
          <Text style={[styles.headerTitle, { color: aC.textPrimary }]}>Addons</Text>
          <TouchableOpacity style={styles.closeButton} activeOpacity={0.7} onPress={() => router.back()}>
            <Text style={[styles.closeText, { color: aC.textSecondary }]}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Addons List */}
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {addons.map((addon) => {
            const isSelected = selected.includes(addon.id);
            return (
              <TouchableOpacity
                key={addon.id}
                style={[styles.addonItem, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderColor: aC.isDark ? AppColors.glassBorder : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1 }, isSelected && styles.addonSelected, isSelected && { borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : AppColors.gradientEnd, backgroundColor: aC.isDark ? 'rgba(3,12,40,0.8)' : 'rgba(226,103,27,0.08)' }]}
                onPress={() => toggleAddon(addon.id)}
                activeOpacity={0.8}
              >
                {!isSelected && <GlassInset />}
                <View style={[styles.radioOuter, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderColor: aC.isDark ? AppColors.glassBorder : 'rgba(3,42,105,0.12)' }, isSelected && styles.radioSelected]}>
                  {isSelected ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={[styles.addonText, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>
                  {addon.title} [+Rs{addon.price.toLocaleString()}]
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Product Price */}
        <View style={styles.productRow}>
          <Text style={[styles.productText, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>Product Price Rs{productPrice.toLocaleString()} x 1</Text>
          <Text style={[styles.priceText, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>Rs{productPrice.toLocaleString()}</Text>
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: aC.textPrimary }]}>Total</Text>
          <Text style={[styles.totalPrice, { color: aC.textPrimary }]}>Rs{total.toLocaleString()}</Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: aC.divider }]} />

        {/* Add Button -> Tracker Detail */}
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() => {
            router.push({
              pathname: "/tracker-detail" as any,
              params: {
                providerId: params.providerId || "",
                deviceId: params.deviceId || "",
                deviceName: params.deviceName || "",
                providerName: params.providerName || "",
                selectedAddons: selected.join(","),
                addonsTotal: String(addonTotal),
                total: String(total),
                price: String(productPrice),
                installationFee: params.installationFee || "0",
                monthlyFee: params.monthlyFee || "0",
                deviceImage: params.deviceImage || "",
              },
            });
          }}
        >
          <LinearGradient
            colors={[AppColors.gradientStart, AppColors.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.bg,
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 25,
    overflow: "hidden",
    margin: 16,
  },
  header: {
    height: 56,
    backgroundColor: AppColors.glassBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 15,
    overflow: "hidden",
  },
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: AppColors.textSecondary,
    fontSize: 32,
    fontWeight: "200",
    lineHeight: 30,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 10 },
  addonItem: {
    height: 34,
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
    backgroundColor: AppColors.glassBg,
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    overflow: "hidden",
  },
  addonSelected: {
    borderColor: "rgba(100,160,255,0.5)",
    backgroundColor: "rgba(3,12,40,0.8)",
  },
  radioOuter: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
    backgroundColor: AppColors.glassBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },
  radioSelected: {
    borderColor: AppColors.gradientEnd,
    backgroundColor: "rgba(226,103,27,0.2)",
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: AppColors.gradientEnd,
  },
  addonText: {
    color: AppColors.textSecondary,
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    flex: 1,
  },
  productRow: {
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  productText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  priceText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  totalRow: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  totalLabel: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
  totalPrice: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.divider,
    marginBottom: 13,
  },
  addButton: {
    height: 48,
    borderRadius: 25,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
});
