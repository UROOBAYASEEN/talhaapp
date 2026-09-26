import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Linking, Alert, Modal, TextInput, Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  ArrowLeft, Phone, Mail, MapPin, Globe, Clock,
  Building2, CheckCircle, AlertCircle, Calendar,
} from "lucide-react-native";
import { API_BASE } from "@/constants/api";
import AdminFooter from "@/components/admin/AdminFooter";
import { useAppColors } from "@/constants/theme";

const BG     = "#010A1F";
const WHITE  = "#F4F5F7";
const ORANGE = "#E2671B";

const SERVER = API_BASE.replace('/api/v1', '');

function resolveUrl(url?: string) {
  if (!url) return undefined;
  return url.startsWith('http') ? url : `${SERVER}${url}`;
}

type PartnerDetail = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  city?: string;
  type: string;
  status: "Active" | "Under Review";
  avatar_url?: string;
  cover_photo_url?: string;
  bio?: string;
  dealership_name?: string;
  working_hours?: string;
  established_year?: number;
  website?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at?: string;
  active_ads: number;
  buyers: number;
  avg_rating: number;
  review_count: number;
  reviews: { id: string; reviewer_name: string; rating: number; comment?: string; created_at?: string }[];
};


function InfoRow({ icon, label, value, onPress }: { icon: React.ReactNode; label: string; value?: string; onPress?: () => void }) {
  const aC = useAppColors();
  if (!value) return null;
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress} style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: aC.isDark ? "rgba(100,160,255,0.1)" : '#eef2ff' }]}>{icon}</View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: aC.isDark ? "#6B7A99" : '#475569' }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: aC.isDark ? WHITE : '#010a1f' }, onPress && { color: "#64A0FF" }]}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PartnerProfileScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [partner,      setPartner]      = useState<PartnerDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [reviews,      setReviews]      = useState<any[]>([]);
  const [resetModal,    setResetModal]    = useState(false);
  const [newPassword,   setNewPassword]   = useState("");
  const [resetting,     setResetting]     = useState(false);
  const [suspending,    setSuspending]    = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("access_token");
        const res = await fetch(`${API_BASE}/admin/partners/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setPartner(data);
        setReviews(data.reviews || []);
      } catch {
        setPartner(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function submitResetPassword() {
    if (!newPassword || newPassword.trim().length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    try {
      setResetting(true);
      const token = await SecureStore.getItemAsync("access_token");
      const res = await fetch(
        `${API_BASE}/admin/partners/${id}/reset-password?new_password=${encodeURIComponent(newPassword.trim())}`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed");
      setResetModal(false);
      setNewPassword("");
      Alert.alert("Success", "Password reset successfully!");
    } catch {
      Alert.alert("Error", "Could not reset password.");
    } finally {
      setResetting(false);
    }
  }

  const joinedDate = partner?.created_at
    ? new Date(partner.created_at).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })
    : undefined;

  return (
    <View style={[styles.container, { backgroundColor: aC.bg }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>

        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: aC.bg, borderBottomWidth: 1, borderBottomColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={aC.isDark ? "rgba(255,255,255,0.9)" : '#010a1f'} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Partner Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <ActivityIndicator color={ORANGE} size="large" style={{ marginTop: 60 }} />
        ) : !partner ? (
          <Text style={[styles.errorText, { color: aC.isDark ? "#8090B0" : '#475569' }]}>Partner not found</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ backgroundColor: aC.bg }}>

            {/* COVER + AVATAR */}
            <View style={styles.coverWrap}>
              {resolveUrl(partner.cover_photo_url) ? (
                <Image source={{ uri: resolveUrl(partner.cover_photo_url) }} style={styles.cover} />
              ) : (
                <LinearGradient colors={aC.isDark ? ["#032A69", "#1a1a2e"] : ["#eef2ff", "#cbd5e1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cover} />
              )}
              <View style={[styles.avatarWrap, { borderColor: aC.bg, backgroundColor: aC.isDark ? BG : '#ffffff' }]}>
                {resolveUrl(partner.avatar_url) ? (
                  <Image source={{ uri: resolveUrl(partner.avatar_url) }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: aC.isDark ? "#032A69" : '#eef2ff' }]}>
                    <Text style={[styles.avatarInitial, { color: aC.isDark ? WHITE : '#032a69' }]}>{partner.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* NAME + STATUS */}
            <View style={styles.nameSection}>
              <Text style={[styles.partnerName, { color: aC.isDark ? WHITE : '#010a1f' }]}>{partner.dealership_name || partner.name}</Text>
              {partner.dealership_name && (
                <Text style={[styles.ownerName, { color: aC.isDark ? "#8090B0" : '#475569' }]}>{partner.name}</Text>
              )}
              <View style={styles.badgeRow}>
                <View style={[styles.typeBadge, { backgroundColor: aC.isDark ? "rgba(100,160,255,0.15)" : '#eef2ff', borderColor: aC.isDark ? "rgba(100,160,255,0.3)" : 'rgba(3,42,105,0.12)' }]}>
                  <Text style={[styles.typeBadgeText, { color: aC.isDark ? "#64A0FF" : '#475569' }]}>{partner.type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: partner.status === "Active" ? (aC.isDark ? "rgba(0,217,152,0.1)" : 'rgba(22,163,74,0.08)') : "rgba(255,101,0,0.1)", borderColor: partner.status === "Active" ? (aC.isDark ? "rgba(0,217,152,0.3)" : 'rgba(22,163,74,0.2)') : "rgba(255,101,0,0.3)" }, partner.status !== "Active" && styles.reviewBadge]}>
                  {partner.status === "Active"
                    ? <CheckCircle size={12} color={aC.isDark ? "#00D998" : "#16a34a"} strokeWidth={2} />
                    : <AlertCircle size={12} color="#FF6500" strokeWidth={2} />
                  }
                  <Text style={[styles.statusText, { color: partner.status === "Active" ? (aC.isDark ? "#00D998" : "#16a34a") : "#FF6500" }, partner.status !== "Active" && styles.reviewText]}>
                    {partner.status}
                  </Text>
                </View>
              </View>
              {partner.bio ? (
                <Text style={[styles.bio, { color: aC.isDark ? "#8090B0" : '#475569' }]}>{partner.bio}</Text>
              ) : null}
            </View>

            {/* STATS ROW */}
            <View style={[styles.statsRow, { backgroundColor: aC.isDark ? "rgba(1,6,20,1)" : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.4)" : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
              {aC.isDark ? null : (<>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              </>)}
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>{partner.active_ads ?? 0}</Text>
                <Text style={[styles.statLbl, { color: aC.isDark ? "#8090B0" : '#475569' }]}>Active Ads</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: aC.isDark ? "rgba(100,160,255,0.2)" : 'rgba(3,42,105,0.12)' }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>{partner.buyers ?? 0}</Text>
                <Text style={[styles.statLbl, { color: aC.isDark ? "#8090B0" : '#475569' }]}>Buyers</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: aC.isDark ? "rgba(100,160,255,0.2)" : 'rgba(3,42,105,0.12)' }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>
                  {partner.avg_rating ? partner.avg_rating.toFixed(1) : "—"}
                  {partner.avg_rating ? " ⭐" : ""}
                </Text>
                <Text style={[styles.statLbl, { color: aC.isDark ? "#8090B0" : '#475569' }]}>{partner.review_count} Reviews</Text>
              </View>
            </View>

            {/* CONTACT INFO CARD */}
            <View style={[styles.card, { backgroundColor: aC.isDark ? "rgba(1,6,20,1)" : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.5)" : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
              {!aC.isDark && (<>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              </>)}
              {aC.isDark && (<>
                <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['rgba(13,37,84,0.2)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              </>)}
              <Text style={[styles.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Contact Information</Text>
              <InfoRow
                icon={<Phone size={15} color="#64A0FF" strokeWidth={1.8} />}
                label="Phone"
                value={partner.phone}
                onPress={partner.phone ? () => Linking.openURL(`tel:${partner.phone}`) : undefined}
              />
              <InfoRow
                icon={<Mail size={15} color="#64A0FF" strokeWidth={1.8} />}
                label="Email"
                value={partner.email}
                onPress={partner.email ? () => Linking.openURL(`mailto:${partner.email}`) : undefined}
              />
              <InfoRow
                icon={<MapPin size={15} color="#64A0FF" strokeWidth={1.8} />}
                label="Location"
                value={partner.location}
              />
              {partner.website ? (
                <InfoRow
                  icon={<Globe size={15} color="#64A0FF" strokeWidth={1.8} />}
                  label="Website"
                  value={partner.website}
                  onPress={() => Linking.openURL(partner.website!)}
                />
              ) : null}
            </View>

            {/* BUSINESS INFO CARD */}
            <View style={[styles.card, { backgroundColor: aC.isDark ? "rgba(1,6,20,1)" : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.5)" : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
              {!aC.isDark && (<>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              </>)}
              {aC.isDark && (<>
                <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              </>)}
              <Text style={[styles.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>
                {partner.type === "Seller" ? "Seller Details" : "Business Details"}
              </Text>
              <InfoRow
                icon={<Building2 size={15} color="#64A0FF" strokeWidth={1.8} />}
                label="Business Type"
                value={partner.type}
              />
              {partner.established_year ? (
                <InfoRow
                  icon={<Calendar size={15} color="#64A0FF" strokeWidth={1.8} />}
                  label="Established"
                  value={String(partner.established_year)}
                />
              ) : null}
              {partner.working_hours ? (
                <InfoRow
                  icon={<Clock size={15} color="#64A0FF" strokeWidth={1.8} />}
                  label="Working Hours"
                  value={partner.working_hours}
                />
              ) : null}
              <InfoRow
                icon={<Calendar size={15} color="#64A0FF" strokeWidth={1.8} />}
                label="Joined"
                value={joinedDate}
              />
            </View>

            {/* REVIEWS */}
            {reviews.length > 0 && (
              <View style={[styles.card, { backgroundColor: aC.isDark ? "rgba(1,6,20,1)" : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.5)" : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
                {!aC.isDark && (<>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                </>)}
                <Text style={[styles.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Reviews ({reviews.length})</Text>
                {reviews.map((r: any, i: number) => (
                  <View key={i} style={[styles.reviewItem, i < reviews.length - 1 && styles.reviewBorder, !aC.isDark && { borderBottomColor: 'rgba(3,42,105,0.08)' } as any]}>
                    <View style={styles.reviewTop}>
                      <Text style={[styles.reviewerName, { color: aC.isDark ? WHITE : '#010a1f' }]}>{r.reviewer_name || "User"}</Text>
                      <Text style={styles.reviewRating}>{"⭐".repeat(Math.round(r.rating))} {r.rating}</Text>
                    </View>
                    {r.comment ? <Text style={[styles.reviewComment, { color: aC.isDark ? "#8090B0" : '#475569' }]}>{r.comment}</Text> : null}
                  </View>
                ))}
              </View>
            )}

            {/* ACTION BUTTONS */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: aC.isDark ? "rgba(1,6,20,1)" : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.5)" : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]} onPress={() => setResetModal(true)}>
                <Text style={[styles.actionBtnText, { color: aC.isDark ? WHITE : '#010a1f' }]}>Reset Password</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.dangerBtn, { backgroundColor: aC.isDark ? "rgba(1,6,20,1)" : '#ffffff', borderColor: aC.isDark ? "rgba(255,68,68,0.4)" : 'rgba(3,42,105,0.12)' }, suspending && { opacity: 0.6 }]}
                disabled={suspending}
                onPress={() => {
                  const action = partner.is_active ? "suspend" : "activate";
                  Alert.alert(
                    partner.is_active ? "Suspend Account" : "Activate Account",
                    partner.is_active
                      ? `Are you sure you want to suspend ${partner.name}? They will not be able to access the app.`
                      : `Are you sure you want to activate ${partner.name}'s account?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: partner.is_active ? "Suspend" : "Activate",
                        style: partner.is_active ? "destructive" : "default",
                        onPress: async () => {
                          setSuspending(true);
                          try {
                            const token = await SecureStore.getItemAsync("access_token");
                            const res = await fetch(
                              `${API_BASE}/admin/partners/${id}/status?is_active=${!partner.is_active}`,
                              { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
                            );
                            if (!res.ok) throw new Error();
                            setPartner(p => p ? { ...p, is_active: !p.is_active } : p);
                            Alert.alert("Done", partner.is_active ? "Account suspended." : "Account activated.");
                          } catch {
                            Alert.alert("Error", "Could not update account status.");
                          } finally {
                            setSuspending(false);
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={[styles.actionBtnText, { color: partner.is_active ? "#FF4444" : "#34c759" }]}>
                  {suspending ? "..." : partner.is_active ? "Suspend" : "Activate"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        <AdminFooter active="partners" />
      </SafeAreaView>

      {/* RESET PASSWORD MODAL */}
      <Modal transparent visible={resetModal} animationType="slide" onRequestClose={() => setResetModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setResetModal(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: aC.isDark ? "#0D1E3F" : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.2)" : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.12, elevation: aC.isDark ? 0 : 8 }]}>
            {!aC.isDark && (<>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>)}
            <Text style={[styles.modalTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Reset Password</Text>
            <Text style={[styles.modalSub, { color: aC.isDark ? "#8090B0" : '#475569' }]}>Enter new password for {partner?.name}</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: aC.isDark ? "rgba(1,6,20,1)" : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.4)" : 'rgba(3,42,105,0.12)', color: aC.isDark ? WHITE : '#010a1f' }]}
              placeholder="New password (min 6 chars)"
              placeholderTextColor={aC.isDark ? "#6B7A99" : "#94a3b8"}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoFocus
            />
            <TouchableOpacity
              style={[styles.modalBtn, resetting && { opacity: 0.6 }]}
              onPress={submitResetPassword}
              disabled={resetting}
            >
              {resetting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.modalBtnTxt}>Reset Password</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => { setResetModal(false); setNewPassword(""); }}>
              <Text style={[styles.modalCancelTxt, { color: aC.isDark ? "#8090B0" : '#475569' }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  safeArea:  { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  headerBtn:   { width: 36, height: 44, justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 17, fontFamily: "Poppins_600SemiBold" },

  scroll: { paddingBottom: 20 },
  errorText: { color: "#8090B0", textAlign: "center", marginTop: 60, fontSize: 14 },

  coverWrap: { width: "100%", height: 160, position: "relative", marginBottom: 48 },
  cover:     { width: "100%", height: 160 },
  avatarWrap: {
    position: "absolute", bottom: -40, left: 20,
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, borderColor: BG, overflow: "hidden",
  },
  avatar:         { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#032A69", alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { color: WHITE, fontSize: 28, fontFamily: "Poppins_700Bold" },

  nameSection: { paddingHorizontal: 20, marginBottom: 16 },
  partnerName: { color: WHITE, fontSize: 20, fontFamily: "Poppins_700Bold", marginBottom: 2 },
  ownerName:   { color: "#8090B0", fontSize: 13, fontFamily: "Poppins_400Regular", marginBottom: 8 },
  badgeRow:    { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 10 },

  typeBadge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
    backgroundColor: "rgba(100,160,255,0.15)", borderWidth: 1, borderColor: "rgba(100,160,255,0.3)",
  },
  typeBadgeText: { color: "#64A0FF", fontSize: 11, fontFamily: "Poppins_600SemiBold" },

  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: "rgba(0,217,152,0.1)", borderWidth: 1, borderColor: "rgba(0,217,152,0.3)",
  },
  statusText: { color: "#00D998", fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  reviewBadge: { backgroundColor: "rgba(255,101,0,0.1)", borderColor: "rgba(255,101,0,0.3)" },
  reviewText:  { color: "#FF6500" },

  bio: { color: "#8090B0", fontSize: 13, fontFamily: "Poppins_400Regular", lineHeight: 20 },

  statsRow: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 20, marginBottom: 16,
    borderRadius: 16, borderWidth: 1,
    borderColor: "rgba(100,160,255,0.4)",
    backgroundColor: "rgba(1,6,20,1)",
    paddingVertical: 16,
  },
  statBox: { flex: 1, alignItems: "center" },
  statVal: { color: WHITE, fontSize: 18, fontFamily: "Poppins_700Bold" },
  statLbl: { color: "#8090B0", fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: "rgba(100,160,255,0.2)" },

  card: {
    marginHorizontal: 20, marginBottom: 12, borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(100,160,255,0.5)",
    backgroundColor: "rgba(1,6,20,1)", padding: 16,
  },
  cardTitle: { color: WHITE, fontSize: 14, fontFamily: "Poppins_600SemiBold", marginBottom: 12 },

  infoRow:   { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  infoIcon:  { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(100,160,255,0.1)", alignItems: "center", justifyContent: "center" },
  infoText:  { flex: 1 },
  infoLabel: { color: "#6B7A99", fontSize: 11, fontFamily: "Poppins_400Regular", marginBottom: 2 },
  infoValue: { color: WHITE, fontSize: 13, fontFamily: "Poppins_500Medium" },

  actionRow: { flexDirection: "row", gap: 12, marginHorizontal: 20, marginTop: 8 },
  actionBtn: {
    flex: 1, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(100,160,255,0.5)", backgroundColor: "rgba(1,6,20,1)",
  },
  dangerBtn:      { borderColor: "rgba(255,68,68,0.4)" },
  actionBtnText:  { color: WHITE, fontSize: 14, fontFamily: "Poppins_600SemiBold" },

  reviewItem:    { paddingVertical: 12 },
  reviewBorder:  { borderBottomWidth: 1, borderBottomColor: "rgba(100,160,255,0.15)" },
  reviewTop:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  reviewerName:  { color: WHITE, fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  reviewRating:  { color: ORANGE, fontSize: 11, fontFamily: "Poppins_500Medium" },
  reviewComment: { color: "#8090B0", fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#0D1E3F", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: "rgba(100,160,255,0.2)",
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, overflow: 'hidden',
  },
  modalTitle:  { color: WHITE, fontSize: 17, fontFamily: "Poppins_700Bold", marginBottom: 6 },
  modalSub:    { color: "#8090B0", fontSize: 13, fontFamily: "Poppins_400Regular", marginBottom: 20 },
  modalInput:  {
    height: 50, borderRadius: 25, borderWidth: 1,
    borderColor: "rgba(100,160,255,0.4)", backgroundColor: "rgba(1,6,20,1)",
    paddingHorizontal: 18, color: WHITE, fontSize: 14,
    fontFamily: "Poppins_400Regular", marginBottom: 16,
  },
  modalBtn: {
    height: 50, borderRadius: 25, backgroundColor: "#E2671B",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  modalBtnTxt:    { color: WHITE, fontSize: 15, fontFamily: "Poppins_600SemiBold" },
  modalCancel:    { alignItems: "center", paddingVertical: 8 },
  modalCancelTxt: { color: "#8090B0", fontSize: 13, fontFamily: "Poppins_400Regular" },
});
