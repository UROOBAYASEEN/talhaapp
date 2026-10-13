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
import { Ionicons } from "@expo/vector-icons";
import { PRIMARY_BTN_COLORS } from "@/components/shared/FigmaEffects";

function GlassInset() {
  const aC = useAppColors();
  if (!aC.isDark) {
    return (
      <>

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
      <View style={[styles.container, { backgroundColor: aC.bg, borderColor: aC.isDark ? 'rgba(126,159,214,0.35)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? '#0B2656' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)' }]}>
          {!aC.isDark && <GlassInset />}
          <Text style={[styles.headerTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Addons</Text>
          <TouchableOpacity style={styles.closeButton} activeOpacity={0.7} onPress={() => router.back()}>
            <Ionicons name="close" size={26} color={aC.isDark ? '#C9C6D0' : '#64748b'} />
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
                style={[styles.addonItem, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderColor: aC.isDark ? (isSelected ? '#7E9FD6' : 'rgba(255,255,255,0.22)') : (isSelected ? AppColors.gradientEnd : 'rgba(3,42,105,0.12)') }]}
                onPress={() => toggleAddon(addon.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.radioOuter, isSelected && styles.radioSelected]}>
                  <View style={[styles.radioInner, isSelected && styles.radioInnerOn]} />
                </View>
                <Text style={[styles.addonText, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>
                  {addon.title} [+Rs{addon.price.toLocaleString()}]
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Product Price */}
        <View style={styles.productRow}>
          <Text style={[styles.productText, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Product Price Rs{productPrice.toLocaleString()} x 1</Text>
          <Text style={[styles.priceText, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Rs{productPrice.toLocaleString()}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.12)' : aC.divider }]} />

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: aC.isDark ? '#C9C6D0' : '#010a1f' }]}>Total</Text>
          <Text style={[styles.totalPrice, { color: aC.isDark ? '#C9C6D0' : '#010a1f' }]}>Rs{total.toLocaleString()}</Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.12)' : aC.divider }]} />

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
            colors={(aC.isDark ? PRIMARY_BTN_COLORS : ['#27467F', '#8C6A78', '#FF9654']) as any}
            locations={[0, 0.5, 1]}
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
    fontFamily: "Poppins_400Regular",
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
    height: 38,
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
    backgroundColor: AppColors.glassBg,
    borderRadius: 19,
    marginBottom: 12,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(143,174,227,0.6)",
    backgroundColor: "#1D3B73",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },
  radioSelected: {
    borderColor: "#8FAEE3",
    shadowColor: "#8FAEE3", shadowOpacity: 0.7, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 3,
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(220,230,247,0.5)",
  },
  radioInnerOn: {
    borderWidth: 2,
    borderColor: "#DCE6F7",
    backgroundColor: "#0E2552",
  },
  addonText: {
    color: AppColors.textSecondary,
    fontSize: 12,
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
    fontFamily: "Poppins_600SemiBold",
  },
  totalPrice: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.divider,
    marginBottom: 13,
  },
  addButton: {
    height: 52,
    borderRadius: 25,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  addButtonText: {
    color: "#EDEBF0",
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },
});
