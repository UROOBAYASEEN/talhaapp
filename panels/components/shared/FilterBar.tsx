import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import FilterModal from "./FilterModal";
import { useAppColors } from "@/constants/theme";

interface Props {
  onApply?: (filters: any) => void;
  activeFilters?: any;
  /** Figma design (Buy Used Car flow) */
  figma?: boolean;
}

export default function FilterBar({ onApply, activeFilters = {}, figma = false }: Props) {
  const aC = useAppColors();
  const [showFilter, setShowFilter] = useState(false);

  const activeCount = [
    activeFilters.cities?.length > 0,
    activeFilters.models?.length > 0,
    activeFilters.minBudget > 0,
    activeFilters.maxBudget < 50_000_000,
    activeFilters.minYear > 1990,
  ].filter(Boolean).length;

  if (figma) {
    return (
      <>
        <View style={styles.fContainer}>
          <TouchableOpacity style={styles.fIconButton} activeOpacity={0.75}>
            <MaterialCommunityIcons name="sort-variant" size={22} color="#e2671b" />
            <Text style={[styles.fIconText, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Sort</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fIconButton} activeOpacity={0.75} onPress={() => setShowFilter(true)}>
            <MaterialCommunityIcons name="tune-variant" size={22} color="#e2671b" />
            <Text style={[styles.fIconText, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Filter</Text>
            {activeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeTxt}>{activeCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll} contentContainerStyle={styles.pillsRow}>
            {["Model", "Price", "Location"].map((label) => (
              <TouchableOpacity key={label} activeOpacity={0.8} style={[styles.fPill, { backgroundColor: aC.isDark ? '#0B2A63' : '#e8eefb' }]} onPress={() => setShowFilter(true)}>
                <Text style={[styles.fPillText, { color: aC.isDark ? '#F2F1F5' : '#032a69' }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FilterModal
          visible={showFilter}
          figma
          onClose={() => setShowFilter(false)}
          onApply={(filters) => {
            onApply?.(filters);
            setShowFilter(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: aC.isDark ? '#010a1f' : '#ffffff', borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.08)' }]}>

        {/* Sort */}
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.75}>
          <MaterialCommunityIcons name="sort" size={16} color="#e2671b" />
          <Text style={[styles.iconText, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Sort</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)' }]} />

        {/* Filter */}
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.75}
          onPress={() => setShowFilter(true)}
        >
          <MaterialCommunityIcons name="tune" size={16} color="#e2671b" />
          <Text style={[styles.iconText, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Filter</Text>
          {activeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,42,105,0.12)' }]} />

        {/* Pills — horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillsScroll}
          contentContainerStyle={styles.pillsRow}
        >
          {["Model", "Price", "Location"].map((label) => (
            <TouchableOpacity
              key={label}
              activeOpacity={0.8}
              style={[styles.pill, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2, overflow: 'hidden' }]}
              onPress={() => setShowFilter(true)}
            >
              {aC.isDark ? (
                <>
                  <LinearGradient colors={["rgba(22,64,136,0.2)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={["rgba(13,37,84,0.18)", "transparent"]} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={["transparent", "rgba(29,83,175,0.2)"]} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              ) : (
                <>
                  <LinearGradient colors={["rgba(3,42,105,0.04)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={["transparent", "rgba(226,103,27,0.07)"]} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              <Text style={[styles.pillText, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>{label}</Text>
              <MaterialCommunityIcons name="chevron-down" size={11} color={aC.isDark ? '#baacb6' : '#64748b'} />
            </TouchableOpacity>
          ))}
        </ScrollView>

      </View>

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={(filters) => {
          onApply?.(filters);
          setShowFilter(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  /* Figma (Buy Used Car) */
  fContainer:  { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 6 },
  fIconButton: { flexDirection: "row", alignItems: "center", gap: 8 },
  fIconText:   { fontSize: 14, fontFamily: "Poppins_400Regular" },
  fPill:       { height: 32, paddingHorizontal: 20, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  fPillText:   { fontSize: 13, fontFamily: "Poppins_400Regular" },

  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#010a1f",
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  iconText: {
    color: "#f9fafc",
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },

  divider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  pillsScroll: {
    flex: 1,
  },

  pillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 4,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 30,
    backgroundColor: "rgba(3,12,40,0.6)",
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.4)",
    overflow: "hidden",
  },

  pillText: {
    color: "#f9fafc",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },

  badge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#e2671b",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  badgeTxt: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
  },
});
