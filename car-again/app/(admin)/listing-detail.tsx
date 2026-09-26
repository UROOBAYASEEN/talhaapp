import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Image, ActivityIndicator, Alert, TextInput, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft, MapPin, Cpu, CheckCircle2, XCircle,
  Calendar, DollarSign, Wrench, Shield, User, Play,
  Eye, MousePointer, Phone, Heart, MessageSquare, Share2, Clock, TrendingUp,
} from "lucide-react-native";
import { Video, ResizeMode } from "expo-av";
import { API_BASE } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAppColors } from "@/constants/theme";

const { width } = Dimensions.get("window");
const BG     = "#010A1F";
const WHITE  = "#F4F5F7";
const ORANGE = "#E2671B";
const SERVER = API_BASE.replace('/api/v1', '');

function resolveUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${SERVER}${url}`;
}

function adStatusColor(status: string) {
  if (status === 'active')  return '#00d084';
  if (status === 'expired') return '#ff4050';
  if (status === 'paused')  return '#f59e0b';
  if (status === 'pending') return ORANGE;
  return '#9ca3af';
}

function fmtDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function GlassCard({ children, style }: any) {
  const aC = useAppColors();
  return (
    <View style={[styles.glassCard, style, { overflow: "hidden", backgroundColor: aC.isDark ? "#010A1F" : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.3)" : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
      {aC.isDark ? (
        <>
          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.2)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      ) : (
        <>
          <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        </>
      )}
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const aC = useAppColors();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: aC.isDark ? "#8090B0" : '#475569' }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>{value}</Text>
    </View>
  );
}

export default function ListingDetailScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();
  const { deviceId, type, userId, userData, id, itemData } = useLocalSearchParams<{ deviceId?: string; type?: string; userId?: string; userData?: string; id?: string; itemData?: string }>();

  const [device,        setDevice]        = useState<any>(null);
  const [loading,       setLoading]       = useState(false);
  const [imgIndex,      setImgIndex]      = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejReason,     setRejReason]     = useState('');
  const [userDocs,      setUserDocs]      = useState<any[]>([]);
  const [docsLoading,   setDocsLoading]   = useState(false);
  const [previewDoc,    setPreviewDoc]    = useState<{url:string;desc:string} | null>(null);

  const isTracker     = type === "tracker"      && deviceId;
  const isUserRequest = type === "user_request" && userId;
  const isBanner      = type === "banner"       && id;
  const isVideoAd     = type === "video_ad"     && id;
  const adItem        = itemData ? (() => { try { return JSON.parse(itemData as string); } catch { return null; } })() : null;

  useEffect(() => {
    if (!isUserRequest || !userId || !token) return;
    setDocsLoading(true);
    fetch(`${API_BASE}/admin/users/${userId}/documents`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setUserDocs(d))
      .finally(() => setDocsLoading(false));
  }, [isUserRequest, userId, token]);
  const reqUser       = userData ? (() => { try { return JSON.parse(userData as string); } catch { return null; } })() : null;

  const ROLE_LABEL: Record<string, string> = {
    dealership_owner:    "Dealer",
    bank_representative: "Bank Representative",
    insurance_provider:  "Insurance Provider",
    tracker_provider:    "Tracker Provider",
    individual_seller:   "Individual Seller",
  };

  async function handleUserAction(action: "approve" | "reject") {
    if (action === "reject" && !rejReason.trim()) {
      Alert.alert("Required", "Please enter a rejection reason."); return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/review-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reason: rejReason.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      Alert.alert(
        action === "approve" ? "Approved!" : "Rejected",
        `${reqUser?.full_name}'s account has been ${action === "approve" ? "approved" : "rejected"}.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch {
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally { setActionLoading(false); }
  }

  useEffect(() => {
    if (!isTracker) return;
    setLoading(true);
    fetch(`${API_BASE}/tracker-devices/${deviceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setDevice(d); })
      .finally(() => setLoading(false));
  }, [deviceId, isTracker]);

  async function handleApprove() {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tracker-devices/${deviceId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDevice((p: any) => ({ ...p, status: "published" }));
        Alert.alert("Approved", "Tracker is now live.");
      } else Alert.alert("Error", "Could not approve tracker.");
    } finally { setActionLoading(false); }
  }

  function handleReject() {
    Alert.alert(
      "Are you sure?",
      "This tracker will be rejected and the provider will be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await fetch(`${API_BASE}/tracker-devices/${deviceId}/reject`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "" }),
              });
              if (res.ok) {
                setDevice((p: any) => ({ ...p, status: "rejected" }));
                Alert.alert("Rejected", "Tracker has been rejected.");
              } else Alert.alert("Error", "Could not reject tracker.");
            } finally { setActionLoading(false); }
          },
        },
      ],
    );
  }

  async function handleAdApprove(adType: "banner" | "video_ad") {
    setActionLoading(true);
    try {
      const endpoint = adType === "banner"
        ? `${API_BASE}/admin/banner-ads/${id}/approve`
        : `${API_BASE}/admin/video-ads/${id}/approve`;
      const res = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        Alert.alert("Approved!", "Ad is now live.", [{
          text: "OK",
          onPress: () => router.replace({ pathname: "/(admin)/approve-listings" as any, params: { defaultStatus: "Approved" } }),
        }]);
      } else Alert.alert("Error", "Could not approve.");
    } finally { setActionLoading(false); }
  }

  function handleAdReject(adType: "banner" | "video_ad") {
    Alert.alert("Reject Ad?", "This ad will be cancelled.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: async () => {
        setActionLoading(true);
        try {
          const endpoint = adType === "banner"
            ? `${API_BASE}/admin/banner-ads/${id}/reject`
            : `${API_BASE}/admin/video-ads/${id}/reject`;
          await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
          router.back();
        } finally { setActionLoading(false); }
      }},
    ]);
  }

  /* ─── Banner / Video Ad Detail View ─── */
  if ((isBanner || isVideoAd) && adItem) {
    const isPending = adItem.status === "pending";
    const adType    = isBanner ? "banner" : "video_ad";
    const sColor    = adStatusColor(adItem.status);
    const imageUrl  = resolveUrl(adItem.image);

    const perfStats = [
      { Icon: Eye,           label: 'Impressions', value: 0 },
      { Icon: MousePointer,  label: 'Clicks',      value: 0 },
      { Icon: Phone,         label: 'Calls',       value: 0 },
      { Icon: Heart,         label: 'Favorited',   value: 0 },
      { Icon: MessageSquare, label: 'Enquiries',   value: 0 },
      { Icon: Share2,        label: 'Shares',      value: 0 },
    ];

    const campaignParts = (adItem.campaign ?? '').split('–');
    const startDate = campaignParts[0]?.trim() ?? adItem.date ?? '—';
    const endDate   = campaignParts[1]?.trim() ?? '—';

    return (
      <View style={[styles.container, { backgroundColor: aC.bg }]}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: aC.bg }}>
          <View style={[styles.header, { backgroundColor: aC.bg, borderBottomWidth: 1, borderBottomColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <ArrowLeft size={22} color={aC.isDark ? WHITE : '#010a1f'} strokeWidth={1.8} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>{isBanner ? "Banner Detail" : "Video Ad Detail"}</Text>
            <View style={styles.headerBtn} />
          </View>
        </SafeAreaView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adS.scroll} style={{ backgroundColor: aC.bg }}>

          {/* HERO CARD */}
          <View style={[adS.heroCard, { borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            ) : (
              <LinearGradient colors={aC.isDark ? ['#1e3a5f', '#0d2040', '#000'] : ['#eef2ff', '#cbd5e1', '#94a3b8']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject} />
            )}
            <LinearGradient colors={aC.isDark ? ['rgba(0,0,0,0.05)', 'rgba(1,10,31,0.88)'] : ['rgba(0,0,0,0.0)', 'rgba(1,10,31,0.55)']} start={{x:0.5,y:0}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} />
            <View style={adS.heroTopRow}>
              <View style={[adS.statusBadge, { backgroundColor: sColor + '33', borderColor: sColor + '66' }]}>
                <View style={[adS.statusDot, { backgroundColor: sColor }]} />
                <Text style={[adS.statusText, { color: sColor }]}>{adItem.status}</Text>
              </View>
              <View style={[adS.typeBadge, { backgroundColor: aC.isDark ? 'rgba(3,42,105,0.7)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)' }]}>
                <Text style={[adS.typeText, { color: aC.isDark ? 'rgba(255,255,255,0.8)' : '#475569' }]}>{isBanner ? 'Banner Ad' : 'Video Ad'}</Text>
              </View>
            </View>
            <View>
              <Text style={adS.heroTitle} numberOfLines={2}>{adItem.title}</Text>
              {adItem.sub ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
                  <MapPin size={12} color="rgba(255,255,255,0.55)" />
                  <Text style={adS.heroSub}>{adItem.sub}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* INFO ROW */}
          <View style={adS.infoRow}>
            {[
              { Icon: TrendingUp, label: 'PKR Spend', value: adItem.price ?? '—'     },
              { Icon: Clock,      label: 'Start Date', value: startDate               },
              { Icon: Calendar,   label: 'End Date',   value: endDate                 },
            ].map(({ Icon, label, value }) => (
              <View key={label} style={[adS.infoCard, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
                {aC.isDark ? null : (<>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                </>)}
                <Icon size={18} color={ORANGE} />
                <Text style={[adS.infoValue, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
                <Text style={[adS.infoLabel, { color: aC.isDark ? '#baacb6' : '#475569' }]}>{label}</Text>
              </View>
            ))}
          </View>

          {/* DURATION CARD */}
          <View style={[adS.durationCard, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
            {!aC.isDark && (<>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>)}
            <View style={adS.durationRow}>
              <View style={adS.durationItem}>
                <Text style={[adS.durationLabel, { color: aC.isDark ? '#baacb6' : '#475569' }]}>Display Location</Text>
                <Text style={[adS.durationValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>{adItem.sub ?? '—'}</Text>
              </View>
              <View style={[adS.durationDivider, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)' }]} />
              <View style={[adS.durationItem, { alignItems: 'flex-end' }]}>
                <Text style={[adS.durationLabel, { color: aC.isDark ? '#baacb6' : '#475569' }]}>Campaign</Text>
                <Text style={[adS.durationValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>{adItem.campaign ?? '—'}</Text>
              </View>
            </View>
          </View>

          {/* PERFORMANCE */}
          <Text style={[adS.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Performance</Text>
          <View style={adS.statsGrid}>
            {perfStats.map(({ Icon, label, value }) => (
              <View key={label} style={[adS.statCell, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
                {!aC.isDark && (<>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                </>)}
                <Icon size={16} color={ORANGE} />
                <Text style={[adS.statValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>{value}</Text>
                <Text style={[adS.statLabel, { color: aC.isDark ? '#baacb6' : '#475569' }]}>{label}</Text>
              </View>
            ))}
          </View>

          {/* ACTION BUTTONS — pending only */}
          {isPending && (
            <View style={styles.actionBar}>
              <TouchableOpacity style={[styles.rejectBtn, { backgroundColor: aC.isDark ? "rgba(237,0,6,0.07)" : '#ffffff', borderColor: aC.isDark ? "rgba(237,0,6,0.5)" : 'rgba(3,42,105,0.12)' }]} activeOpacity={0.85} disabled={actionLoading} onPress={() => handleAdReject(adType)}>
                <XCircle size={16} color="#ED0006" strokeWidth={2} />
                <Text style={styles.rejectTxt}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.approveBtn, actionLoading && { opacity: 0.6 }]} activeOpacity={0.85} disabled={actionLoading} onPress={() => handleAdApprove(adType)}>
                <LinearGradient colors={["#032A69", ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 30 }]} />
                {actionLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><CheckCircle2 size={16} color="#fff" strokeWidth={2} /><Text style={styles.approveTxt}>Approve</Text></>
                }
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  /* ─── Tracker Detail View ─── */
  if (isTracker) {
    return (
      <View style={[styles.container, { backgroundColor: aC.bg }]}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: aC.bg }}>
          <View style={[styles.header, { backgroundColor: aC.bg, borderBottomWidth: 1, borderBottomColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <ArrowLeft size={22} color={aC.isDark ? WHITE : '#010a1f'} strokeWidth={1.8} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Tracker Detail</Text>
            <View style={styles.headerBtn} />
          </View>
        </SafeAreaView>

        {loading ? (
          <ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} />
        ) : !device ? (
          <Text style={[styles.emptyTxt, { color: aC.isDark ? "#6B7A99" : '#475569' }]}>Device not found</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ backgroundColor: aC.bg }}>

            {/* Image gallery */}
            {device.images?.length > 0 ? (
              <View>
                <Image source={{ uri: resolveUrl(device.images[imgIndex]) }} style={styles.heroImg} resizeMode="cover" />
                {device.images.length > 1 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
                    {device.images.map((uri: string, i: number) => (
                      <TouchableOpacity key={i} onPress={() => setImgIndex(i)}>
                        <Image source={{ uri: resolveUrl(uri) }} style={[styles.thumb, { borderColor: aC.isDark ? "rgba(100,160,255,0.2)" : 'rgba(3,42,105,0.12)' }, imgIndex === i && styles.thumbActive]} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : (
              <View style={[styles.heroFallback, { backgroundColor: aC.isDark ? "#061B4A" : '#eef2ff' }]}>
                <Cpu size={64} color={aC.isDark ? "#4B5A7A" : "#94a3b8"} strokeWidth={1.2} />
              </View>
            )}

            <View style={[styles.content, { backgroundColor: aC.bg }]}>

              {/* Title + status */}
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.trackerName, { color: aC.isDark ? WHITE : '#010a1f' }]}>{device.name}</Text>
                  <Text style={[styles.providerName, { color: aC.isDark ? "#8090B0" : '#475569' }]}>{device.provider_name} • Tracker Provider</Text>
                </View>
                <StatusPill status={device.status} />
              </View>

              {/* Price row */}
              <GlassCard style={{ marginBottom: 16 }}>
                <View style={styles.priceRow}>
                  <View style={styles.priceItem}>
                    <DollarSign size={16} color={ORANGE} />
                    <View>
                      <Text style={[styles.priceLabel, { color: aC.isDark ? "#8090B0" : '#475569' }]}>Yearly Price</Text>
                      <Text style={[styles.priceVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>PKR {Number(device.price).toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={[styles.priceDivider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.08)" : 'rgba(3,42,105,0.12)' }]} />
                  <View style={styles.priceItem}>
                    <Wrench size={16} color={ORANGE} />
                    <View>
                      <Text style={[styles.priceLabel, { color: aC.isDark ? "#8090B0" : '#475569' }]}>Install Fee</Text>
                      <Text style={[styles.priceVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>PKR {Number(device.installation_fee).toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={[styles.priceDivider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.08)" : 'rgba(3,42,105,0.12)' }]} />
                  <View style={styles.priceItem}>
                    <Calendar size={16} color={ORANGE} />
                    <View>
                      <Text style={[styles.priceLabel, { color: aC.isDark ? "#8090B0" : '#475569' }]}>Monthly</Text>
                      <Text style={[styles.priceVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>PKR {Number(device.monthly_fee).toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
              </GlassCard>

              {/* Details */}
              <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Details</Text>
              <GlassCard style={{ marginBottom: 16 }}>
                <InfoRow label="Serial No."    value={device.serial_no || "—"} />
                <View style={[styles.dividerLine, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]} />
                <InfoRow label="Coverage"      value={device.coverage || "—"} />
                <View style={[styles.dividerLine, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]} />
                <InfoRow label="Installation"  value={device.installation_available ? "Available" : "Not Available"} />
                <View style={[styles.dividerLine, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]} />
                <InfoRow label="Submitted"     value={device.created_at ? new Date(device.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
              </GlassCard>

              {/* Features */}
              {device.features?.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Features</Text>
                  <View style={styles.featuresWrap}>
                    {device.features.map((f: string, i: number) => (
                      <View key={i} style={[styles.featureChip, { overflow: "hidden", backgroundColor: aC.isDark ? "#061B4A" : '#ffffff', borderColor: aC.isDark ? "rgba(100,160,255,0.25)" : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1 }]}>
                        {aC.isDark ? <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" /> : <><LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/><LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/></>}
                        <Text style={styles.checkMark}>✓</Text>
                        <Text style={[styles.featureTxt, { color: aC.isDark ? "#C0C8DC" : '#475569' }]}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Cities */}
              {device.installation_available && device.available_cities?.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Available Cities</Text>
                  <View style={styles.featuresWrap}>
                    {device.available_cities.map((c: string, i: number) => (
                      <View key={i} style={[styles.cityChip, { overflow: "hidden", backgroundColor: aC.isDark ? "rgba(226,103,27,0.08)" : '#ffffff', borderColor: aC.isDark ? "rgba(226,103,27,0.3)" : 'rgba(3,42,105,0.12)' }]}>
                        <MapPin size={12} color={ORANGE} />
                        <Text style={styles.cityTxt}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Description */}
              {device.description ? (
                <>
                  <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Description</Text>
                  <GlassCard style={{ marginBottom: 16 }}>
                    <Text style={[styles.descTxt, { color: aC.isDark ? "#C0C8DC" : '#475569' }]}>{device.description}</Text>
                  </GlassCard>
                </>
              ) : null}

            </View>

            {/* Action buttons — only for pending */}
            {device.status === "under_review" && (
              <View style={styles.actionBar}>
                <TouchableOpacity
                  style={[styles.rejectBtn, { backgroundColor: aC.isDark ? "rgba(237,0,6,0.07)" : '#ffffff', borderColor: aC.isDark ? "rgba(237,0,6,0.5)" : 'rgba(3,42,105,0.12)' }]}
                  activeOpacity={0.85}
                  disabled={actionLoading}
                  onPress={handleReject}
                >
                  <XCircle size={16} color="#ED0006" strokeWidth={2} />
                  <Text style={styles.rejectTxt}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.approveBtn, actionLoading && { opacity: 0.6 }]}
                  activeOpacity={0.85}
                  disabled={actionLoading}
                  onPress={handleApprove}
                >
                  <LinearGradient colors={["#032A69", ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 30 }]} />
                  {actionLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><CheckCircle2 size={16} color="#fff" strokeWidth={2} /><Text style={styles.approveTxt}>Approve</Text></>
                  }
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        )}
      </View>
    );
  }

  /* ─── User Verification Request View ─── */
  if (isUserRequest && reqUser) {
    return (
      <View style={[styles.container, { backgroundColor: aC.bg }]}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: aC.bg }}>
          <View style={[styles.header, { backgroundColor: aC.bg, borderBottomWidth: 1, borderBottomColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <ArrowLeft size={22} color={aC.isDark ? WHITE : '#010a1f'} strokeWidth={1.8} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Verification Request</Text>
            <View style={styles.headerBtn} />
          </View>
        </SafeAreaView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ backgroundColor: aC.bg }}>

          {/* Avatar circle */}
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <View style={[styles.avatarCircle, { overflow: 'hidden', backgroundColor: aC.isDark ? "rgba(226,103,27,0.1)" : '#eef2ff', borderColor: aC.isDark ? "rgba(226,103,27,0.3)" : 'rgba(3,42,105,0.12)' }]}>
              {(() => {
                const aUrl = resolveUrl((reqUser as any).avatar_url);
                return aUrl ? (
                  <Image source={{ uri: aUrl }} style={{ width: 88, height: 88, borderRadius: 44 }} resizeMode="cover" />
                ) : (
                  <User size={44} color={ORANGE} strokeWidth={1.5} />
                );
              })()}
            </View>
            <Text style={[styles.trackerName, { textAlign: "center", marginTop: 12, color: aC.isDark ? WHITE : '#010a1f' }]}>{reqUser.full_name}</Text>
            <View style={[styles.pill, { borderColor: ORANGE + "55", backgroundColor: ORANGE + "18", marginTop: 6 }]}>
              <Text style={[styles.pillTxt, { color: ORANGE }]}>{ROLE_LABEL[reqUser.role] || reqUser.role}</Text>
            </View>
          </View>

          <View style={[styles.content, { backgroundColor: aC.bg }]}>

            {/* Info card */}
            <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Account Details</Text>
            <GlassCard style={{ marginBottom: 16 }}>
              <InfoRow label="Full Name" value={reqUser.full_name || "—"} />
              <View style={[styles.dividerLine, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]} />
              <InfoRow label="Email"     value={reqUser.email    || "—"} />
              <View style={[styles.dividerLine, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]} />
              <InfoRow label="Phone"     value={reqUser.phone    || "—"} />
              <View style={[styles.dividerLine, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]} />
              <InfoRow label="Role"      value={ROLE_LABEL[reqUser.role] || reqUser.role} />
              <View style={[styles.dividerLine, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]} />
              <InfoRow label="Submitted" value={reqUser.created_at ? new Date(reqUser.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
              <View style={[styles.dividerLine, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]} />
              <InfoRow label="Status"    value="Pending Review" />
            </GlassCard>

            {/* Documents */}
            <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Submitted Documents</Text>
            {docsLoading ? (
              <ActivityIndicator color={ORANGE} style={{ marginBottom: 16 }} />
            ) : userDocs.length === 0 ? (
              <GlassCard style={{ marginBottom: 16 }}>
                <Text style={{ color: aC.isDark ? "#8090B0" : '#475569', fontSize: 13, fontFamily: "Poppins_400Regular", textAlign: "center", paddingVertical: 8 }}>No documents submitted yet</Text>
              </GlassCard>
            ) : (
              <GlassCard style={{ marginBottom: 16 }}>
                {userDocs.map((doc, i) => (
                  <View key={doc.id}>
                    {i > 0 && <View style={[styles.dividerLine, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]} />}
                    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 }}>
                      <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: aC.isDark ? "rgba(226,103,27,0.1)" : '#eef2ff', borderWidth: 1, borderColor: aC.isDark ? "rgba(226,103,27,0.25)" : 'rgba(3,42,105,0.12)', alignItems: "center", justifyContent: "center" }}>
                        <User size={20} color={ORANGE} strokeWidth={1.5} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: aC.isDark ? WHITE : '#010a1f', fontSize: 13, fontFamily: "Poppins_600SemiBold" }}>{doc.desc}</Text>
                        <Text style={{ color: aC.isDark ? "#8090B0" : '#475569', fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 2 }}>{doc.uploaded_at}</Text>
                      </View>
                      {doc.file_url ? (
                        <TouchableOpacity
                          style={{ backgroundColor: aC.isDark ? "rgba(226,103,27,0.15)" : '#ffffff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: aC.isDark ? "rgba(226,103,27,0.3)" : 'rgba(3,42,105,0.12)' }}
                          onPress={() => setPreviewDoc({ url: doc.file_url, desc: doc.desc })}
                        >
                          <Text style={{ color: ORANGE, fontSize: 11, fontFamily: "Poppins_600SemiBold" }}>View</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={{ color: "#6B7A99", fontSize: 11, fontFamily: "Poppins_400Regular" }}>No file</Text>
                      )}
                    </View>
                  </View>
                ))}
              </GlassCard>
            )}

            {/* Rejection reason */}
            <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Rejection Reason</Text>
            <TextInput
              style={[styles.reasonInput, { backgroundColor: aC.isDark ? "rgba(3,12,40,0.8)" : '#ffffff', borderColor: aC.isDark ? "rgba(255,255,255,0.12)" : 'rgba(3,42,105,0.12)', color: aC.isDark ? WHITE : '#010a1f', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1 }]}
              placeholder="Enter reason (required if rejecting)..."
              placeholderTextColor={aC.isDark ? "rgba(255,255,255,0.25)" : "#94a3b8"}
              value={rejReason}
              onChangeText={setRejReason}
              multiline
              numberOfLines={3}
            />

          </View>

          {/* Action buttons */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[styles.rejectBtn, { backgroundColor: aC.isDark ? "rgba(237,0,6,0.07)" : '#ffffff', borderColor: aC.isDark ? "rgba(237,0,6,0.5)" : 'rgba(3,42,105,0.12)' }]}
              activeOpacity={0.85}
              disabled={actionLoading}
              onPress={() => handleUserAction("reject")}
            >
              {actionLoading
                ? <ActivityIndicator size="small" color="#ED0006" />
                : <><XCircle size={16} color="#ED0006" strokeWidth={2} /><Text style={styles.rejectTxt}>Reject</Text></>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.approveBtn, actionLoading && { opacity: 0.6 }]}
              activeOpacity={0.85}
              disabled={actionLoading}
              onPress={() => handleUserAction("approve")}
            >
              <LinearGradient colors={["#032A69", ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 30 }]} />
              {actionLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <><CheckCircle2 size={16} color="#fff" strokeWidth={2} /><Text style={styles.approveTxt}>Approve</Text></>
              }
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── Document Preview Modal ── */}
        <Modal visible={!!previewDoc} transparent animationType="fade" onRequestClose={() => setPreviewDoc(null)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", alignItems: "center" }}>
            <View style={{ width: "100%", paddingHorizontal: 20, paddingTop: 20 }}>

              {/* Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ color: WHITE, fontSize: 15, fontFamily: "Poppins_600SemiBold" }}>{previewDoc?.desc}</Text>
                <TouchableOpacity
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}
                  onPress={() => setPreviewDoc(null)}
                >
                  <XCircle size={20} color={WHITE} />
                </TouchableOpacity>
              </View>

              {/* Image or Fallback */}
              {(() => {
                const url = previewDoc?.url || '';
                const isServerUrl = url.startsWith('http');
                const resolvedUrl = isServerUrl ? url : url ? `${SERVER}${url}` : '';

                if (!url) {
                  return (
                    <View style={{ height: 300, borderRadius: 16, backgroundColor: aC.isDark ? "#061B4A" : '#eef2ff', alignItems: "center", justifyContent: "center", gap: 12 }}>
                      <XCircle size={40} color={aC.isDark ? "#8090B0" : "#94a3b8"} />
                      <Text style={{ color: aC.isDark ? "#8090B0" : '#475569', fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center" }}>No file URL available</Text>
                    </View>
                  );
                }

                if (!isServerUrl) {
                  return (
                    <View style={{ height: 300, borderRadius: 16, backgroundColor: aC.isDark ? "#061B4A" : '#ffffff', borderWidth: 1, borderColor: "rgba(226,103,27,0.3)", alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24 }}>
                      <XCircle size={40} color={ORANGE} />
                      <Text style={{ color: aC.isDark ? WHITE : '#010a1f', fontFamily: "Poppins_600SemiBold", fontSize: 14, textAlign: "center" }}>Old Document</Text>
                      <Text style={{ color: aC.isDark ? "#8090B0" : '#475569', fontFamily: "Poppins_400Regular", fontSize: 12, textAlign: "center", lineHeight: 18 }}>
                        This document was uploaded before server storage was enabled. User needs to re-upload their documents.
                      </Text>
                    </View>
                  );
                }

                return (
                  <DocImagePreview url={resolvedUrl} />
                );
              })()}

              <TouchableOpacity
                style={{ marginTop: 16, height: 46, borderRadius: 23, backgroundColor: aC.isDark ? "rgba(226,103,27,0.2)" : '#ffffff', borderWidth: 1, borderColor: ORANGE, alignItems: "center", justifyContent: "center" }}
                onPress={() => setPreviewDoc(null)}
              >
                <Text style={{ color: ORANGE, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>Close</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>
      </View>
    );
  }

  /* ─── Vehicle Detail View ─── */
  const vehicleItem = adItem;
  const isPendingVehicle  = vehicleItem?.status === "pending";
  const isApprovedVehicle = vehicleItem?.status === "active";
  const vehicleStatusLabel = isApprovedVehicle ? "Approved" : isPendingVehicle ? "Pending" : "Rejected";
  const vehicleStatusColor = isApprovedVehicle ? "#34D399" : isPendingVehicle ? ORANGE : "#f87171";

  async function handleVehicleApprove() {
    if (!vehicleItem) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/vehicles/${vehicleItem.id}/approve`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        Alert.alert("Approved!", "Vehicle listing is now live.", [{
          text: "OK",
          onPress: () => router.replace({ pathname: "/(admin)/approve-listings" as any, params: { defaultStatus: "Approved" } }),
        }]);
      } else Alert.alert("Error", "Could not approve.");
    } finally { setActionLoading(false); }
  }

  function handleVehicleReject() {
    if (!vehicleItem) return;
    Alert.alert("Reject Listing?", "This listing will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: async () => {
        setActionLoading(true);
        try {
          await fetch(`${API_BASE}/admin/vehicles/${vehicleItem.id}/reject`, {
            method: "POST", headers: { Authorization: `Bearer ${token}` },
          });
          router.back();
        } finally { setActionLoading(false); }
      }},
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: aC.bg }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: aC.bg }}>
        <View style={[styles.header, { backgroundColor: aC.bg, borderBottomWidth: 1, borderBottomColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft size={22} color={aC.isDark ? WHITE : '#010a1f'} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Vehicle Detail</Text>
          <View style={styles.headerBtn} />
        </View>
      </SafeAreaView>

      {!vehicleItem ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", backgroundColor: aC.bg }}>
          <Text style={[styles.emptyTxt, { color: aC.isDark ? "#6B7A99" : '#475569' }]}>No vehicle data found</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={{ backgroundColor: aC.bg }}>

          {/* Image */}
          {vehicleItem.image ? (
            <Image source={{ uri: resolveUrl(vehicleItem.image) }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={[styles.heroFallback, { backgroundColor: aC.isDark ? "#061B4A" : '#eef2ff' }]}>
              <Cpu size={48} color={aC.isDark ? "#4B5A7A" : "#94a3b8"} strokeWidth={1.2} />
            </View>
          )}

          <View style={[styles.content, { backgroundColor: aC.bg }]}>

            {/* Title + status */}
            <View style={styles.titleRow}>
              <Text style={[styles.trackerName, { flex: 1, color: aC.isDark ? WHITE : '#010a1f' }]}>{vehicleItem.title}</Text>
              <View style={[styles.pill, { borderColor: vehicleStatusColor+"55", backgroundColor: vehicleStatusColor+"18" }]}>
                <Text style={[styles.pillTxt, { color: vehicleStatusColor }]}>{vehicleStatusLabel}</Text>
              </View>
            </View>

            {/* Price */}
            <GlassCard style={{ marginBottom: 16 }}>
              <View style={styles.priceRow}>
                <View style={styles.priceItem}>
                  <DollarSign size={16} color={ORANGE} />
                  <View>
                    <Text style={[styles.priceLabel, { color: aC.isDark ? "#8090B0" : '#475569' }]}>Price</Text>
                    <Text style={[styles.priceVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>{vehicleItem.price}</Text>
                  </View>
                </View>
                <View style={[styles.priceDivider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.08)" : 'rgba(3,42,105,0.12)' }]} />
                <View style={styles.priceItem}>
                  <MapPin size={16} color={ORANGE} />
                  <View>
                    <Text style={[styles.priceLabel, { color: aC.isDark ? "#8090B0" : '#475569' }]}>Location</Text>
                    <Text style={[styles.priceVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>{vehicleItem.sub?.split("•")[0]?.trim() || "—"}</Text>
                  </View>
                </View>
                <View style={[styles.priceDivider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.08)" : 'rgba(3,42,105,0.12)' }]} />
                <View style={styles.priceItem}>
                  <Calendar size={16} color={ORANGE} />
                  <View>
                    <Text style={[styles.priceLabel, { color: aC.isDark ? "#8090B0" : '#475569' }]}>Listed</Text>
                    <Text style={[styles.priceVal, { color: aC.isDark ? WHITE : '#010a1f' }]}>{vehicleItem.date}</Text>
                  </View>
                </View>
              </View>
            </GlassCard>

            {/* Vehicle details */}
            <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Vehicle Info</Text>
            <GlassCard style={{ marginBottom: 16 }}>
              <InfoRow label="Condition" value={vehicleItem.sub?.split("•")[1]?.trim() || "—"} />
              <View style={[styles.dividerLine, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]} />
              <InfoRow label="Status"    value={vehicleStatusLabel} />
              <View style={[styles.dividerLine, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]} />
              <InfoRow label="Date"      value={vehicleItem.date || "—"} />
            </GlassCard>

            {/* Dealer / Seller section */}
            <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Dealer / Seller</Text>
            <GlassCard style={{ marginBottom: 16 }}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:12, paddingVertical:6 }}>
                <View style={{ width:48, height:48, borderRadius:24, backgroundColor: aC.isDark ? "rgba(226,103,27,0.15)" : '#eef2ff', borderWidth:1, borderColor: aC.isDark ? "rgba(226,103,27,0.3)" : 'rgba(3,42,105,0.12)', alignItems:"center", justifyContent:"center", overflow:'hidden' }}>
                  {(() => {
                    const sUrl = resolveUrl((vehicleItem as any).seller_avatar_url);
                    return sUrl ? (
                      <Image source={{ uri: sUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} resizeMode="cover" />
                    ) : (
                      <User size={24} color={ORANGE} strokeWidth={1.5} />
                    );
                  })()}
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ color: aC.isDark ? WHITE : '#010a1f', fontSize:14, fontFamily:"Poppins_600SemiBold" }}>
                    {vehicleItem.seller_name || "—"}
                  </Text>
                  <Text style={{ color: aC.isDark ? "#8090B0" : '#475569', fontSize:11, fontFamily:"Poppins_400Regular", marginTop:2 }}>
                    {vehicleItem.seller_role || "Dealer"}
                  </Text>
                </View>
              </View>
              {vehicleItem.seller_phone && (<>
                <View style={[styles.dividerLine, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]} />
                <InfoRow label="Phone" value={vehicleItem.seller_phone} />
              </>)}
              {vehicleItem.seller_email && (<>
                <View style={[styles.dividerLine, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]} />
                <InfoRow label="Email" value={vehicleItem.seller_email} />
              </>)}
            </GlassCard>

          </View>

          {/* Action buttons */}
          {isPendingVehicle && (
            <View style={styles.actionBar}>
              <TouchableOpacity style={[styles.rejectBtn, { backgroundColor: aC.isDark ? "rgba(237,0,6,0.07)" : '#ffffff', borderColor: aC.isDark ? "rgba(237,0,6,0.5)" : 'rgba(3,42,105,0.12)' }]} activeOpacity={0.85} disabled={actionLoading} onPress={handleVehicleReject}>
                <XCircle size={16} color="#ED0006" strokeWidth={2} />
                <Text style={styles.rejectTxt}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.approveBtn, actionLoading && { opacity:0.6 }]} activeOpacity={0.85} disabled={actionLoading} onPress={handleVehicleApprove}>
                <LinearGradient colors={["#032A69", ORANGE]} start={{x:0,y:0}} end={{x:1,y:0}} style={[StyleSheet.absoluteFillObject,{borderRadius:30}]} />
                {actionLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><CheckCircle2 size={16} color="#fff" strokeWidth={2} /><Text style={styles.approveTxt}>Approve</Text></>
                }
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height:40 }} />
        </ScrollView>
      )}
    </View>
  );
}

/* ── Doc Image Preview with loading + error state ── */
function DocImagePreview({ url }: { url: string }) {
  const aC = useAppColors();
  const [imgLoading, setImgLoading] = React.useState(true);
  const [imgError,   setImgError]   = React.useState(false);

  if (imgError) {
    return (
      <View style={{ height: 300, borderRadius: 16, backgroundColor: aC.isDark ? "#061B4A" : '#eef2ff', borderWidth: 1, borderColor: "rgba(226,103,27,0.3)", alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24 }}>
        <XCircle size={40} color={ORANGE} />
        <Text style={{ color: aC.isDark ? WHITE : '#010a1f', fontFamily: "Poppins_600SemiBold", fontSize: 14, textAlign: "center" }}>Failed to Load Image</Text>
        <Text style={{ color: aC.isDark ? "#8090B0" : '#475569', fontFamily: "Poppins_400Regular", fontSize: 11, textAlign: "center", lineHeight: 16 }}>{url}</Text>
      </View>
    );
  }

  return (
    <View style={{ height: 400, borderRadius: 16, backgroundColor: aC.isDark ? "#061B4A" : '#eef2ff', overflow: "hidden" }}>
      {imgLoading && (
        <View style={{ ...StyleSheet.absoluteFillObject as any, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={ORANGE} size="large" />
          <Text style={{ color: aC.isDark ? "#8090B0" : '#475569', fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: 10 }}>Loading document...</Text>
        </View>
      )}
      <Image
        source={{ uri: url }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="contain"
        onLoad={() => setImgLoading(false)}
        onError={() => { setImgLoading(false); setImgError(true); }}
      />
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const isApproved = status === "published";
  const isRejected = status === "rejected";
  const color = isApproved ? "#34D399" : isRejected ? "#f87171" : ORANGE;
  const label = isApproved ? "Approved" : isRejected ? "Rejected" : "Pending Review";
  const Icon = isApproved ? CheckCircle2 : isRejected ? XCircle : Shield;
  return (
    <View style={[styles.pill, { borderColor: color + "55", backgroundColor: color + "18" }]}>
      <Icon size={13} color={color} strokeWidth={2} />
      <Text style={[styles.pillTxt, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerBtn:   { width: 36, height: 44, justifyContent: "center" },
  headerTitle: { color: WHITE, fontSize: 20, fontFamily: "Poppins_700Bold" },
  emptyTxt:    { color: "#6B7A99", textAlign: "center", marginTop: 60, fontFamily: "Poppins_400Regular" },

  scroll:  { paddingBottom: 40 },
  content: { paddingHorizontal: 16, paddingTop: 14 },

  heroImg:     { width, height: width * 0.6 },
  heroFallback:{ width, height: width * 0.5, backgroundColor: "#061B4A", alignItems: "center", justifyContent: "center" },
  thumbRow:    { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  thumb:       { width: 64, height: 64, borderRadius: 10, borderWidth: 1, borderColor: "rgba(100,160,255,0.2)" },
  thumbActive: { borderColor: ORANGE, borderWidth: 2 },

  titleRow:     { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 10 },
  trackerName:  { color: WHITE, fontSize: 17, fontFamily: "Poppins_600SemiBold", lineHeight: 24 },
  providerName: { color: "#8090B0", fontSize: 12, fontFamily: "Poppins_400Regular", marginTop: 2 },

  pill:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, flexShrink: 0 },
  pillTxt:  { fontSize: 11, fontFamily: "Poppins_600SemiBold" },

  glassCard: { borderRadius: 16, borderWidth: 1, borderColor: "rgba(100,160,255,0.3)", backgroundColor: "#010A1F", padding: 14, marginBottom: 4 },

  priceRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceItem:   { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  priceLabel:  { color: "#8090B0", fontSize: 10, fontFamily: "Poppins_400Regular" },
  priceVal:    { color: WHITE, fontSize: 12, fontFamily: "Poppins_600SemiBold", marginTop: 2 },
  priceDivider:{ width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.08)" },

  sectionTitle: { color: WHITE, fontSize: 14, fontFamily: "Poppins_600SemiBold", marginBottom: 10, marginTop: 4 },

  infoRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  infoLabel: { color: "#8090B0", fontSize: 13, fontFamily: "Poppins_400Regular" },
  infoValue: { color: WHITE, fontSize: 13, fontFamily: "Poppins_500Medium" },
  dividerLine: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },

  featuresWrap:{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  featureChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#061B4A", borderRadius: 20, borderWidth: 1, borderColor: "rgba(100,160,255,0.25)", paddingHorizontal: 12, paddingVertical: 8 },
  checkMark:   { color: "#34D399", fontSize: 13 },
  featureTxt:  { color: "#C0C8DC", fontSize: 12, fontFamily: "Poppins_400Regular" },

  cityChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(226,103,27,0.08)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(226,103,27,0.3)", paddingHorizontal: 12, paddingVertical: 7 },
  cityTxt:  { color: ORANGE, fontSize: 12, fontFamily: "Poppins_500Medium" },

  descTxt: { color: "#C0C8DC", fontSize: 13, fontFamily: "Poppins_400Regular", lineHeight: 20 },

  avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(226,103,27,0.1)", borderWidth: 2, borderColor: "rgba(226,103,27,0.3)", alignItems: "center", justifyContent: "center" },
  reasonInput:  { backgroundColor: "rgba(3,12,40,0.8)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: WHITE, fontSize: 13, fontFamily: "Poppins_400Regular", marginBottom: 20, minHeight: 80, textAlignVertical: "top" },

  /* ACTION BAR */
  actionBar:   { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  rejectBtn:   { flex: 1, height: 48, borderRadius: 30, borderWidth: 1.5, borderColor: "rgba(237,0,6,0.5)", backgroundColor: "rgba(237,0,6,0.07)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  rejectTxt:   { color: "#ED0006", fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  approveBtn:  { flex: 1, height: 48, borderRadius: 30, overflow: "hidden", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, position: "relative" },
  approveTxt:  { color: "#fff", fontSize: 14, fontFamily: "Poppins_600SemiBold" },

  /* legacy vehicle view */
  hero:    { width, height: width * 0.75, backgroundColor: "#E9EDF3", alignItems: "center", justifyContent: "center", position: "relative" },
  heroLogo:{ position: "absolute", top: 20, alignSelf: "center", fontSize: 18, fontFamily: "Poppins_600SemiBold" },
  backBtn: { position: "absolute", top: 16, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center" },
});

const adS = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 4, gap: 14, paddingBottom: 20 },

  heroCard:   { height: 220, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', justifyContent: 'space-between', padding: 14 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'capitalize' },
  typeBadge:  { backgroundColor: 'rgba(3,42,105,0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)' },
  typeText:   { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontFamily: 'Poppins_500Medium' },
  heroTitle:  { color: '#fff', fontSize: 18, fontFamily: 'Poppins_700Bold', lineHeight: 24 },
  heroSub:    { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'Poppins_400Regular' },

  infoRow:   { flexDirection: 'row', gap: 10 },
  infoCard:  { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: 'rgba(3,12,40,0.6)', alignItems: 'center', paddingVertical: 14, gap: 4, paddingHorizontal: 4 },
  infoValue: { color: WHITE, fontSize: 13, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  infoLabel: { color: '#baacb6', fontSize: 9, fontFamily: 'Poppins_400Regular' },

  durationCard:    { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: 'rgba(3,12,40,0.6)', padding: 16 },
  durationRow:     { flexDirection: 'row', alignItems: 'center' },
  durationItem:    { flex: 1, gap: 4 },
  durationDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 12 },
  durationLabel:   { color: '#baacb6', fontSize: 11, fontFamily: 'Poppins_400Regular' },
  durationValue:   { color: WHITE, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  sectionTitle: { color: WHITE, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell:     { width: '30.5%', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: 'rgba(3,12,40,0.6)', alignItems: 'center', paddingVertical: 14, gap: 4 },
  statValue:    { color: WHITE, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  statLabel:    { color: '#baacb6', fontSize: 10, fontFamily: 'Poppins_400Regular' },
});
