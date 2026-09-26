import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import AdminFooter from "@/components/admin/AdminFooter";
import { API_BASE } from "@/constants/api";
import { useAppColors } from "@/constants/theme";

type Partner = {
  id: string;
  name: string;
  location: string;
  type: string;
  status: "Active" | "Under Review";
  avatar_url?: string;
};

const FILTERS = ["All", "Dealers", "Sellers", "Banks", "Insurance", "Tracker"];
const SORT_OPTIONS = ["Name A-Z", "Name Z-A", "Active First", "Under Review First"];

const FILTER_TYPE_MAP: Record<string, string> = {
  Dealers:  "Dealer",
  Sellers:  "Seller",
  Banks:    "Bank",
  Insurance:"Insurance",
  Tracker:  "Tracker",
};

const NON_DEALER_TYPES = ['Seller'];

export default function PartnerManagement() {
  const router = useRouter();
  const aC = useAppColors();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [activeSort, setActiveSort] = useState("Name A-Z");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("access_token");
      const [partnersRes, countsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/partners`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/admin/partners/counts`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (partnersRes.ok) setPartners(await partnersRes.json());
      if (countsRes.ok)   setCounts(await countsRes.json());
    } catch {
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  function sortList(list: Partner[]) {
    return [...list].sort((a, b) => {
      if (activeSort === "Name A-Z") return a.name.localeCompare(b.name);
      if (activeSort === "Name Z-A") return b.name.localeCompare(a.name);
      if (activeSort === "Active First") return a.status === "Active" ? -1 : 1;
      if (activeSort === "Under Review First") return a.status === "Under Review" ? -1 : 1;
      return 0;
    });
  }

  function matchesSearch(p: Partner) {
    return (
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.location.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  const filteredPartners = sortList(
    partners.filter((p) => {
      if (!matchesSearch(p)) return false;
      if (activeFilter === "All") return true;
      if (activeFilter === "Sellers") return NON_DEALER_TYPES.includes(p.type);
      return p.type === FILTER_TYPE_MAP[activeFilter];
    })
  );

  const dealerPartners    = sortList(partners.filter(p => matchesSearch(p) && p.type === "Dealer"));
  const nonDealerPartners = sortList(partners.filter(p => matchesSearch(p) && NON_DEALER_TYPES.includes(p.type)));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.isDark ? "#020B20" : "#ffffff"} />

      <View style={[styles.container, { backgroundColor: aC.bg }]}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: aC.bg, borderBottomWidth: 1, borderBottomColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={30} color={aC.isDark ? "#A9ADBD" : "#475569"} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: aC.isDark ? "#F5F6FA" : '#010a1f' }]}>Partner Management</Text>

          <View style={{ width: 35 }} />
        </View>

        {/* Search + Sort */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : '#ffffff', borderColor: aC.isDark ? "#5789D5" : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? "#2466D8" : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0.35 : 0.08, elevation: aC.isDark ? 5 : 2 }]}>
            {aC.isDark ? (
              <>
                <LinearGradient
                  colors={['rgba(22,64,136,0.5)', 'transparent']}
                  start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
                  style={StyleSheet.absoluteFillObject} pointerEvents="none"
                />
                <LinearGradient
                  colors={['rgba(13,37,84,0.5)', 'transparent']}
                  start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }}
                  style={StyleSheet.absoluteFillObject} pointerEvents="none"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(29,83,175,0.5)']}
                  start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFillObject} pointerEvents="none"
                />
              </>
            ) : (
              <>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              </>
            )}
            <Ionicons
              name="search-outline"
              size={21}
              color={aC.isDark ? "#B8C0D2" : "#94a3b8"}
            />

            <TextInput
              placeholder="Search"
              placeholderTextColor={aC.isDark ? "#9298AA" : "#94a3b8"}
              style={[styles.searchInput, { color: aC.isDark ? "#FFFFFF" : '#010a1f' }]}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.sortButton} onPress={() => setSortOpen(true)}>
            <Ionicons name="filter" size={21} color="#FF6500" />
            <Text style={[styles.sortText, { color: aC.isDark ? "#E8EAF1" : '#010a1f' }]}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterButton, { backgroundColor: aC.isDark ? "#061B4A" : (isActive ? 'rgba(226,103,27,0.08)' : '#ffffff'), borderWidth: 1, borderColor: aC.isDark ? (isActive ? "#6395E4" : 'transparent') : (isActive ? "#e2671b" : 'rgba(3,42,105,0.12)'), shadowColor: aC.isDark ? "#2765D1" : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark && isActive ? 0.35 : (aC.isDark ? 0 : 0.06), elevation: aC.isDark && isActive ? 4 : (aC.isDark ? 0 : 1) }, isActive && styles.activeFilter, isActive && { overflow: "hidden" }]}
                onPress={() => setActiveFilter(filter)}
              >
                {isActive && aC.isDark && (
                  <>
                    <LinearGradient
                      colors={['rgba(22,64,136,0.5)', 'transparent']}
                      start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
                      style={StyleSheet.absoluteFillObject} pointerEvents="none"
                    />
                    <LinearGradient
                      colors={['rgba(13,37,84,0.5)', 'transparent']}
                      start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }}
                      style={StyleSheet.absoluteFillObject} pointerEvents="none"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(29,83,175,0.5)']}
                      start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }}
                      style={StyleSheet.absoluteFillObject} pointerEvents="none"
                    />
                  </>
                )}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, zIndex: 2 }}>
                  <Text style={[styles.filterText, { color: isActive ? "#FF6500" : (aC.isDark ? "#F1F3F9" : '#475569') }, isActive && styles.activeFilterText]}>
                    {filter}
                  </Text>
                  {counts[filter] !== undefined && (
                    <View style={[styles.countBadge, { backgroundColor: aC.isDark ? (isActive ? "rgba(255,101,0,0.2)" : "rgba(255,255,255,0.1)") : (isActive ? 'rgba(226,103,27,0.12)' : 'rgba(3,42,105,0.06)') }, isActive && styles.countBadgeActive]}>
                      <Text style={[styles.countText, { color: isActive ? "#FF6500" : (aC.isDark ? "#8090B0" : '#475569') }, isActive && styles.countTextActive]}>
                        {counts[filter]}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Partners */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          style={[styles.partnersList, { backgroundColor: aC.bg }]}
        >
          {loading ? (
            <ActivityIndicator color="#FF6500" size="large" style={{ marginTop: 40 }} />
          ) : filteredPartners.length === 0 ? (
            <Text style={{ color: aC.isDark ? "#8390AA" : '#475569', textAlign: "center", marginTop: 40 }}>No partners found</Text>
          ) : activeFilter === "Individual Sellers" ? (
            <>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account-group-outline" size={18} color="#FF6500" />
                <Text style={[styles.sectionTitle, { color: aC.isDark ? "#F5F6FA" : '#010a1f' }]}>Individual Sellers</Text>
                <View style={[styles.sectionBadge, { backgroundColor: aC.isDark ? "rgba(255,101,0,0.18)" : 'rgba(226,103,27,0.1)', borderColor: aC.isDark ? "rgba(255,101,0,0.4)" : 'rgba(226,103,27,0.25)' }]}>
                  <Text style={styles.sectionBadgeTxt}>{filteredPartners.length}</Text>
                </View>
              </View>
              {filteredPartners.map(partner => (
                <PartnerCard key={partner.id} partner={partner} onPress={() => router.push(`/(admin)/partner-profile?id=${partner.id}`)} />
              ))}
            </>
          ) : activeFilter === "Dealers" ? (
            <>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="store-outline" size={18} color="#FF6500" />
                <Text style={[styles.sectionTitle, { color: aC.isDark ? "#F5F6FA" : '#010a1f' }]}>Dealership</Text>
                <View style={[styles.sectionBadge, { backgroundColor: aC.isDark ? "rgba(255,101,0,0.18)" : 'rgba(226,103,27,0.1)', borderColor: aC.isDark ? "rgba(255,101,0,0.4)" : 'rgba(226,103,27,0.25)' }]}>
                  <Text style={styles.sectionBadgeTxt}>{filteredPartners.length}</Text>
                </View>
              </View>
              {filteredPartners.map(partner => (
                <PartnerCard key={partner.id} partner={partner} onPress={() => router.push(`/(admin)/partner-profile?id=${partner.id}`)} />
              ))}
            </>
          ) : (
            filteredPartners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} onPress={() => router.push(`/(admin)/partner-profile?id=${partner.id}`)} />
            ))
          )}
        </ScrollView>

        {/* Sort Modal */}
        <Modal transparent visible={sortOpen} animationType="fade" onRequestClose={() => setSortOpen(false)}>
          <Pressable style={styles.sortOverlay} onPress={() => setSortOpen(false)}>
            <View style={[styles.sortMenu, { backgroundColor: aC.isDark ? "#0D2657" : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.2)" : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.12, elevation: aC.isDark ? 0 : 8 }]}>
              <Text style={[styles.sortMenuTitle, { color: aC.isDark ? "#fff" : '#010a1f' }]}>Sort By</Text>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.sortMenuItem, { borderBottomColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }, activeSort === opt && styles.sortMenuItemActive, activeSort === opt && { backgroundColor: aC.isDark ? "rgba(255,107,0,0.06)" : 'rgba(226,103,27,0.08)' }]}
                  onPress={() => { setActiveSort(opt); setSortOpen(false); }}
                >
                  <Text style={[styles.sortMenuText, { color: aC.isDark ? "#C8D3E8" : '#475569' }, activeSort === opt && { color: "#FF6500" }]}>{opt}</Text>
                  {activeSort === opt && <Ionicons name="checkmark" size={14} color="#FF6500" />}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Floating Add Button */}
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/(admin)/add-partner' as any)}>
          <Ionicons
            name="add"
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <AdminFooter active="partners" />
      </View>
    </SafeAreaView>
  );
}

function PartnerCard({ partner, onPress }: { partner: Partner; onPress: () => void }) {
  const aC = useAppColors();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.partnerCard, { overflow: "hidden", backgroundColor: aC.isDark ? "rgba(1,6,20,1)" : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.5)" : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? "#2365D4" : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0.32 : 0.08, elevation: aC.isDark ? 5 : 3 }]}
      onPress={onPress}
    >
      {aC.isDark ? (
        <>
          <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      ) : (
        <>
          <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        </>
      )}

      <View style={[styles.logo, { backgroundColor: aC.isDark ? "#032A69" : '#eef2ff' }]}>
        {partner.avatar_url ? (
          <Image source={{ uri: partner.avatar_url }} style={{ width: 56, height: 56, borderRadius: 28 }} />
        ) : (
          <Text style={[styles.avatarInitial, { color: aC.isDark ? "#FFFFFF" : '#032a69' }]}>{partner.name.charAt(0).toUpperCase()}</Text>
        )}
      </View>

      <View style={styles.partnerInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.partnerName, { color: aC.isDark ? "#F6F7FB" : '#010a1f' }]}>{partner.name}</Text>
          <View style={[styles.typePill, { backgroundColor: aC.isDark ? "rgba(100,160,255,0.15)" : '#eef2ff', borderColor: aC.isDark ? "rgba(100,160,255,0.3)" : 'rgba(3,42,105,0.12)' }]}>
            <Text style={[styles.typePillTxt, { color: aC.isDark ? "#7aaeff" : '#475569' }]}>{partner.type}</Text>
          </View>
        </View>
        <Text style={[styles.location, { color: aC.isDark ? "#A7ADBD" : '#475569' }]}>{partner.location}</Text>
        <Text style={[styles.activity, { color: partner.status !== "Active" ? "#FF6500" : (aC.isDark ? "#00C98B" : "#16a34a") }, partner.status !== "Active" && styles.pendingText]}>
          {partner.status === "Active" ? "Active" : "Pending"}
        </Text>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: partner.status !== "Active" ? "rgba(226,103,27,0.25)" : (aC.isDark ? "#064B3E" : '#eef2ff'), borderWidth: aC.isDark ? 0 : 1, borderColor: partner.status !== "Active" ? 'rgba(226,103,27,0.3)' : 'rgba(3,42,105,0.08)' }, partner.status !== "Active" && styles.reviewBadge]}>
        <Text style={[styles.statusText, { color: partner.status !== "Active" ? "#FF6500" : (aC.isDark ? "#00D998" : "#16a34a") }, partner.status !== "Active" && styles.reviewText]}>
          {partner.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function BottomItemMC({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.bottomItem} onPress={onPress}>
      <View style={[styles.bottomIconContainer, active && styles.activeBottomIcon]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={21}
          color={active ? "#FF6B00" : "#AEB9D0"}
        />
      </View>
      <Text style={[styles.bottomLabel, active && styles.activeBottomLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#010A1F",
  },

  container: {
    flex: 1,
    backgroundColor: "#010A1F",
    paddingHorizontal: 20,
  },

  /* Header */

  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: 10,
    marginTop: 16,
  },

  backButton: {
    width: 35,
    alignItems: "flex-start",
  },

  headerTitle: {
    color: "#F5F6FA",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  /* Search */

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  searchBox: {
    flex: 1,
    height: 40,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#5789D5",
    backgroundColor: "#010A1F",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,

    shadowColor: "#2466D8",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 0,
    },

    elevation: 5,
  },

  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    marginLeft: 8,
    height: 40,
  },

  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 11,
  },

  sortText: {
    color: "#E8EAF1",
    fontSize: 15,
    marginLeft: 5,
  },

  /* Filters */

  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 72,
    marginTop: 10,
  },

  filterContainer: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 4,
    gap: 12,
  },

  filterButton: {
    height: 49,
    paddingHorizontal: 22,
    borderRadius: 17,
    backgroundColor: "#061B4A",
    alignItems: "center",
    justifyContent: "center",
  },

  activeFilter: {
    backgroundColor: "#061B4A",
    borderWidth: 1,
    borderColor: "#6395E4",

    shadowColor: "#2765D1",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },

  filterText: {
    color: "#F1F3F9",
    fontSize: 14,
    fontWeight: "500",
  },

  activeFilterText: {
    color: "#FF6500",
    fontWeight: "700",
  },

  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  countBadgeActive: {
    backgroundColor: "rgba(255,101,0,0.2)",
  },
  countText: {
    color: "#8090B0",
    fontSize: 10,
    fontWeight: "700",
  },
  countTextActive: {
    color: "#FF6500",
  },

  /* Section Headers */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: "#F5F6FA",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: "rgba(255,101,0,0.18)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255,101,0,0.4)",
  },
  sectionBadgeTxt: {
    color: "#FF6500",
    fontSize: 11,
    fontWeight: "700",
  },
  emptySection: {
    color: "#8390AA",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 13,
  },

  typePill: {
    backgroundColor: "rgba(100,160,255,0.15)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.3)",
  },
  typePillTxt: {
    color: "#7aaeff",
    fontSize: 9,
    fontWeight: "600",
  },

  /* Partner List */

  partnersList: {
    flex: 1,
    marginTop: 8,
  },

  listContainer: {
    paddingBottom: 130,
    paddingTop: 8,
  },

  partnerCard: {
    minHeight: 83,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.5)",
    backgroundColor: "rgba(1,6,20,1)",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 9,
    paddingVertical: 9,

    marginBottom: 11,

    shadowColor: "#2365D4",
    shadowOpacity: 0.32,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 0,
    },

    elevation: 5,
  },

  logo: {
    width: 56,
    height: 56,
    borderRadius: 30,
    backgroundColor: "#032A69",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },

  darkLogo: {
    backgroundColor: "#10171C",
  },

  logoSmall: {
    color: "#1474D4",
    fontSize: 5,
    fontWeight: "800",
  },

  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },

  partnerInfo: {
    flex: 1,
    marginLeft: 13,
    justifyContent: "center",
  },

  partnerName: {
    color: "#F6F7FB",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 21,
  },

  location: {
    color: "#A7ADBD",
    fontSize: 14,
    marginTop: 1,
  },

  activity: {
    color: "#00C98B",
    fontSize: 12,
    marginTop: 2,
  },

  pendingText: {
    color: "#FF6500",
  },

  /* Status */

  statusBadge: {
    minWidth: 62,
    height: 25,
    paddingHorizontal: 10,
    borderRadius: 7,
    backgroundColor: "#064B3E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 0,
  },

  statusText: {
    color: "#00D998",
    fontSize: 12,
    fontWeight: "600",
  },

  reviewBadge: {
    backgroundColor: "rgba(226,103,27,0.25)",
    minWidth: 106,
  },

  reviewText: {
    color: "#FF6500",
  },

  /* Floating Button */

  fab: {
    position: "absolute",
    right: 24,
    bottom: 95,

    width: 61,
    height: 61,
    borderRadius: 32,

    backgroundColor: "#F66A0A",

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#FF6500",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  /* Bottom Nav */

  bottomNav: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 10,

    height: 59,
    borderRadius: 32,

    backgroundColor: "#082257",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",

    paddingHorizontal: 4,
  },

  bottomItem: {
    width: 52,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomIconContainer: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },

  activeBottomIcon: {
    borderWidth: 1,
    borderColor: "#6D7E9D",
    backgroundColor: "#102E62",
  },

  bottomLabel: {
    color: "#A7B1C5",
    fontSize: 8,
    marginTop: -1,
  },

  activeBottomLabel: {
    color: "#FFFFFF",
  },

  sortOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sortMenu: {
    backgroundColor: "#0D2657",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(100,160,255,0.2)",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sortMenuTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  sortMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  sortMenuItemActive: {
    backgroundColor: "rgba(255,107,0,0.06)",
  },
  sortMenuText: {
    color: "#C8D3E8",
    fontSize: 14,
  },
});
