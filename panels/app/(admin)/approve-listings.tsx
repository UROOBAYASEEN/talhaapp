import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, RefreshControl, Image, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SlidersHorizontal } from "lucide-react-native";
import { Video, ResizeMode } from "expo-av";
import AdminFooter from "@/components/admin/AdminFooter";
import { API_BASE } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAppColors } from "@/constants/theme";
import { SavedCardEffect } from "@/components/shared/FigmaEffects";
import { PillGlow } from "@/components/dealer/DealerUI";

// ── Design tokens ────────────────────────────────────────────────────────────
const SERVER = API_BASE.replace('/api/v1', '');

function resolveImg(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) {
    try {
      const path = new URL(url).pathname;
      if (path.startsWith('/uploads/')) return `${SERVER}${path}`;
    } catch {}
    return url;
  }
  return `${SERVER}${url}`;
}

const BG          = "#010A1F";
const GLASS_BG    = "rgba(3,12,40,0.6)";
const GLASS_BORDER= "#82a5d5";
const CARD_BG     = "#010A1F";
const ORANGE      = "#e2671b";
const WHITE       = "#f9fafc";
const MUTED       = "#baacb6";
const RED         = "#e74c3c";
const GREEN       = "#27ae60";
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_FILTERS   = ["All","Vehicles","Banners","Videos","Trackers","Accounts"];
const STATUS_FILTERS = ["Pending","Approved","Rejected","Promoted"];
const STATUS_MAP: Record<string,string> = {
  Pending:"under_review", Approved:"published", Rejected:"rejected", Promoted:"promoted",
};
const ROLE_MAP: Record<string,string> = {
  dealership_owner:"Dealer", bank_representative:"Bank",
  insurance_provider:"Insurance", tracker_provider:"Tracker", individual_seller:"Seller",
};

// ── 4-side card glass gradient ───────────────────────────────────────────────
function CardShade() {
  const aC = useAppColors();
  if (aC.isDark) return <SavedCardEffect band={12} />;
  return (
    <>
      <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

export default function ApproveListingsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();
  const { defaultStatus } = useLocalSearchParams<{ defaultStatus?: string }>();

  const [typeFilter,    setTypeFilter]    = useState("All");
  const [statusFilter,  setStatusFilter]  = useState(defaultStatus || "Pending");
  const [search,        setSearch]        = useState("");
  const [trackers,      setTrackers]      = useState<any[]>([]);
  const [listings,      setListings]      = useState<any[]>([]);
  const [videoAds,      setVideoAds]      = useState<any[]>([]);
  const [accounts,      setAccounts]      = useState<any[]>([]);
  const [acctCounts,    setAcctCounts]    = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading,       setLoading]       = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [mediaPreview,  setMediaPreview]  = useState<{ kind: 'video' | 'image'; uri: string; title: string } | null>(null);

  function openMedia(item: any, kind: 'video' | 'image') {
    const uri = resolveImg(item.image || item.media_url);
    if (!uri) return;
    setMediaPreview({ kind, uri, title: item.title || 'Preview' });
  }

  const showTrackers = typeFilter === "All" || typeFilter === "Trackers";
  const showVehicles = typeFilter === "All" || typeFilter === "Vehicles";
  const showBanners  = typeFilter === "All" || typeFilter === "Banners";
  const showVideos   = typeFilter === "All" || typeFilter === "Videos";
  const showAccounts = typeFilter === "Accounts";

  const fetchTrackers = useCallback(async () => {
    if (!token) return;
    try {
      const p = new URLSearchParams({ limit:"50" });
      const st = STATUS_MAP[statusFilter]; if (st) p.append("status",st);
      if (search.trim()) p.append("search",search.trim());
      const r = await fetch(`${API_BASE}/tracker-devices/admin/all?${p}`,{ headers:{ Authorization:`Bearer ${token}` }});
      if (r.ok) setTrackers(await r.json());
    } catch {}
  }, [token, statusFilter, search]);

  const fetchListings = useCallback(async () => {
    if (!token) return;
    try {
      const results: any[] = [];
      const p = new URLSearchParams({ status: statusFilter });
      if (search.trim()) p.append("search", search.trim());
      if (showVehicles) { const r = await fetch(`${API_BASE}/admin/listings?list_type=vehicles&${p}`, { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) results.push(...(await r.json())); }
      if (showBanners)  { const r = await fetch(`${API_BASE}/admin/listings?list_type=banners&${p}`,  { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) results.push(...(await r.json())); }
      setListings(results);
    } catch {}
  }, [token, statusFilter, search, showVehicles, showBanners]);

  const fetchVideoAds = useCallback(async () => {
    if (!token) return;
    try {
      const p = new URLSearchParams({ status: statusFilter });
      if (search.trim()) p.append("search", search.trim());
      const r = await fetch(`${API_BASE}/admin/listings?list_type=video_ads&${p}`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setVideoAds(await r.json());
    } catch {}
  }, [token, statusFilter, search]);

  const fetchAccounts = useCallback(async () => {
    if (!token) return;
    let pendingList: any[] = [];
    try {
      const r = await fetch(`${API_BASE}/admin/users/pending-verification`,{ headers:{ Authorization:`Bearer ${token}` }});
      if (r.ok) { pendingList = await r.json(); setAccounts(pendingList); }
    } catch {}
    try {
      const c = await fetch(`${API_BASE}/admin/users/verification-counts`,{ headers:{ Authorization:`Bearer ${token}` }});
      if (c.ok) {
        const d = await c.json();
        setAcctCounts({ pending: d.pending ?? pendingList.length, approved: d.approved ?? 0, rejected: d.rejected ?? 0 });
      } else {
        setAcctCounts(prev => ({ ...prev, pending: pendingList.length }));
      }
    } catch {
      setAcctCounts(prev => ({ ...prev, pending: pendingList.length }));
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    const tasks = [];
    if (showTrackers) tasks.push(fetchTrackers());
    if (showVideos)   tasks.push(fetchVideoAds());
    if (showAccounts) tasks.push(fetchAccounts());
    else              tasks.push(fetchListings());
    Promise.all(tasks).finally(() => setLoading(false));
  }, [showTrackers, showVideos, showAccounts, fetchTrackers, fetchVideoAds, fetchListings, fetchAccounts]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([fetchTrackers(), fetchListings(), fetchVideoAds(), fetchAccounts()]);
    setRefreshing(false);
  }

  async function approveTracker(id: string) {
    setActionLoading(id+"_approve");
    try { await fetch(`${API_BASE}/tracker-devices/${id}/approve`,{ method:"POST", headers:{ Authorization:`Bearer ${token}` }}); Alert.alert("Approved","Tracker is now live."); fetchTrackers(); }
    finally { setActionLoading(null); }
  }
  function rejectTracker(id: string) {
    Alert.alert("Reject Tracker?","Provider will be notified.",[
      { text:"Cancel", style:"cancel" },
      { text:"Reject", style:"destructive", onPress: async () => {
        setActionLoading(id+"_reject");
        try { await fetch(`${API_BASE}/tracker-devices/${id}/reject`,{ method:"POST", headers:{ Authorization:`Bearer ${token}`,"Content-Type":"application/json" }, body:JSON.stringify({reason:""}) }); fetchTrackers(); }
        finally { setActionLoading(null); }
      }},
    ]);
  }

  async function approveVehicle(id: string) {
    setActionLoading(id+"_approve");
    try {
      const res = await fetch(`${API_BASE}/admin/vehicles/${id}/approve`,{ method:"POST", headers:{ Authorization:`Bearer ${token}` }});
      if (!res.ok) throw new Error('Failed');
      Alert.alert("Approved","Vehicle is now live.");
      fetchListings();
    } catch { Alert.alert("Error","Could not approve vehicle."); }
    finally { setActionLoading(null); }
  }
  function rejectVehicle(id: string) {
    Alert.alert("Reject Vehicle?","This vehicle will be rejected.",[
      { text:"Cancel", style:"cancel" },
      { text:"Reject", style:"destructive", onPress: async () => {
        setActionLoading(id+"_reject");
        try {
          const res = await fetch(`${API_BASE}/admin/vehicles/${id}/reject`,{ method:"POST", headers:{ Authorization:`Bearer ${token}` }});
          if (!res.ok) throw new Error('Failed');
          fetchListings();
        } catch { Alert.alert("Error","Could not reject."); }
        finally { setActionLoading(null); }
      }},
    ]);
  }

  async function approveBanner(id: string) {
    setActionLoading(id+"_approve");
    try { await fetch(`${API_BASE}/admin/banner-ads/${id}/approve`,{ method:"POST", headers:{ Authorization:`Bearer ${token}` }}); Alert.alert("Approved","Banner ad is now live."); fetchListings(); }
    finally { setActionLoading(null); }
  }
  function rejectBanner(id: string) {
    Alert.alert("Reject Banner?","This ad will be cancelled.",[
      { text:"Cancel", style:"cancel" },
      { text:"Reject", style:"destructive", onPress: async () => {
        setActionLoading(id+"_reject");
        try { await fetch(`${API_BASE}/admin/banner-ads/${id}/reject`,{ method:"POST", headers:{ Authorization:`Bearer ${token}` }}); fetchListings(); }
        finally { setActionLoading(null); }
      }},
    ]);
  }

  async function approveVideo(id: string) {    setActionLoading(id+"_approve");
    try { await fetch(`${API_BASE}/admin/video-ads/${id}/approve`,{ method:"POST", headers:{ Authorization:`Bearer ${token}` }}); Alert.alert("Approved","Video ad is now live."); fetchVideoAds(); }
    finally { setActionLoading(null); }
  }
  function rejectVideo(id: string) {
    Alert.alert("Reject Video Ad?","This ad will be cancelled.",[
      { text:"Cancel", style:"cancel" },
      { text:"Reject", style:"destructive", onPress: async () => {
        setActionLoading(id+"_reject");
        try { await fetch(`${API_BASE}/admin/video-ads/${id}/reject`,{ method:"POST", headers:{ Authorization:`Bearer ${token}` }}); fetchVideoAds(); }
        finally { setActionLoading(null); }
      }},
    ]);
  }

  async function approveAccount(id: string) {
    setActionLoading(id+"_approve");
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}/review-documents`,{
        method:"POST",
        headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify({ action:"approve" }),
      });
      if (!res.ok) throw new Error('Failed');
      Alert.alert("Approved","Account is now verified.");
      fetchAccounts();
    } catch { Alert.alert("Error","Could not approve account."); }
    finally { setActionLoading(null); }
  }
  function rejectAccount(id: string) {
    Alert.alert("Reject Account?","User will be notified.",[
      { text:"Cancel", style:"cancel" },
      { text:"Reject", style:"destructive", onPress: async () => {
        setActionLoading(id+"_reject");
        try {
          const res = await fetch(`${API_BASE}/admin/users/${id}/review-documents`,{
            method:"POST",
            headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
            body: JSON.stringify({ action:"reject" }),
          });
          if (!res.ok) throw new Error('Failed');
          fetchAccounts();
        } catch { Alert.alert("Error","Could not reject."); }
        finally { setActionLoading(null); }
      }},
    ]);
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: aC.bg, borderBottomWidth: 1, borderBottomColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.iconBtn, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.06)' : '#ffffff', borderWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
          <Ionicons name="arrow-back" size={22} color={aC.isDark ? WHITE : '#010a1f'} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Listing Details</Text>
        <View style={s.iconBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        style={{ backgroundColor: aC.bg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
      >
        {/* Search box — glass pill style */}
        <View style={s.searchRow}>
          <View style={[s.searchBox, { overflow:"hidden", backgroundColor: aC.isDark ? GLASS_BG : '#ffffff', borderColor: aC.isDark ? GLASS_BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 2 }]}>
            {aC.isDark ? (
              <SavedCardEffect band={12} />
            ) : (
              <>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              </>
            )}
            <Ionicons name="search-outline" size={18} color={aC.isDark ? "#8f8f8f" : "#94a3b8"} />
            <TextInput value={search} onChangeText={setSearch} placeholder="Search" placeholderTextColor={aC.isDark ? "#8f8f8f" : "#94a3b8"} style={[s.searchInput, { color: aC.isDark ? WHITE : '#010a1f' }]} />
          </View>
          <TouchableOpacity style={s.sortBtn}>
            <SlidersHorizontal size={16} color={ORANGE} strokeWidth={1.8} />
            <Text style={[s.sortTxt, { color: aC.isDark ? WHITE : '#010a1f' }]}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Type tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow}>
          {TYPE_FILTERS.map(f=>{
            const active = typeFilter===f;
            return (
            <TouchableOpacity key={f} onPress={()=>setTypeFilter(f)} style={[s.tab, { overflow:"hidden", backgroundColor: aC.isDark ? (active ? "#05122A" : "#0B2358") : (active ? 'rgba(226,103,27,0.08)' : '#ffffff'), borderColor: aC.isDark ? (active ? "#7F98C4" : "transparent") : (active ? ORANGE : 'rgba(3,42,105,0.12)'), shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1 }, active&&s.tabActive]}>
              {active && aC.isDark && <PillGlow />}
              <Text style={[s.tabTxt, { color: active ? ORANGE : (aC.isDark ? MUTED : '#475569') }, active&&s.tabTxtActive]}>{f}</Text>
            </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Status tabs */}
        {!showAccounts && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.tabRow,{marginBottom:4}]}>
            {STATUS_FILTERS.map(f=>{
              const active = statusFilter===f;
              return (
              <TouchableOpacity key={f} onPress={()=>setStatusFilter(f)} style={[s.tab, { overflow:"hidden", backgroundColor: aC.isDark ? (active ? "#05122A" : "#0B2358") : (active ? 'rgba(226,103,27,0.08)' : '#ffffff'), borderColor: aC.isDark ? (active ? "#7F98C4" : "transparent") : (active ? ORANGE : 'rgba(3,42,105,0.12)'), shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1 }, active&&s.tabActive]}>
                {active && aC.isDark && <PillGlow />}
                <Text style={[s.tabTxt, { color: active ? ORANGE : (aC.isDark ? MUTED : '#475569') }, active&&s.tabTxtActive]}>{f}</Text>
              </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {showAccounts && (
          <View style={s.countRow}>
            <View style={[s.countCard, { backgroundColor: aC.isDark ? CARD_BG : '#ffffff', borderColor: aC.isDark ? GLASS_BORDER : 'rgba(3,42,105,0.12)' }]}>
              <CardShade />
              <Ionicons name="time-outline" size={22} color={ORANGE} />
              <Text style={[s.countNum, { color: aC.isDark ? WHITE : '#010a1f' }]}>{acctCounts.pending}</Text>
              <Text style={[s.countLbl, { color: aC.isDark ? MUTED : '#475569' }]}>Pending Accounts</Text>
            </View>
            <View style={[s.countCard, { backgroundColor: aC.isDark ? CARD_BG : '#ffffff', borderColor: aC.isDark ? GLASS_BORDER : 'rgba(3,42,105,0.12)' }]}>
              <CardShade />
              <Ionicons name="checkmark-circle-outline" size={22} color={GREEN} />
              <Text style={[s.countNum, { color: aC.isDark ? WHITE : '#010a1f' }]}>{acctCounts.approved}</Text>
              <Text style={[s.countLbl, { color: aC.isDark ? MUTED : '#475569' }]}>Approved Accounts</Text>
            </View>
          </View>
        )}

        {loading ? <ActivityIndicator color={ORANGE} style={{marginTop:40}}/> : <>

          {showTrackers && trackers.map(t=>(
            <ItemCard key={t.id}
              image={t.images?.[0]} title={t.name} subtitle={`${t.provider_name} • Tracker`}
              price={`PKR ${Number(t.price).toLocaleString()}`}
              status={t.status==="under_review"?"Pending":t.status==="published"?"Approved":"Rejected"}
              date={t.created_at?new Date(t.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):""}
              showActions={t.status==="under_review"} actionLoading={actionLoading} itemId={t.id}
              onApprove={()=>approveTracker(t.id)} onReject={()=>rejectTracker(t.id)}
              onView={()=>router.push({pathname:"/(admin)/listing-detail",params:{deviceId:t.id,type:"tracker"}} as any)}
            />
          ))}

          {!showAccounts && listings.map(item=>(
            <ItemCard key={item.id}
              image={item.image} title={item.title} subtitle={item.sub||item.type} price={item.price}
              status={item.status==="active"?"Approved":item.status==="pending"?"Pending":item.status==="cancelled"?"Rejected":"Rejected"}
              date={item.date||""} showActions={item.status==="pending"}
              actionLoading={actionLoading} itemId={item.id}
              mediaKind="image" onPlayMedia={()=>openMedia(item, 'image')}
              onApprove={item.type==="Banners"?()=>approveBanner(item.id):item.type==="Vehicles"?()=>approveVehicle(item.id):undefined}
              onReject={item.type==="Banners"?()=>rejectBanner(item.id):item.type==="Vehicles"?()=>rejectVehicle(item.id):undefined}
              onView={()=>router.push({pathname:"/(admin)/listing-detail",params:{id:item.id,type:item.type==="Banners"?"banner":"vehicle",itemData:JSON.stringify(item)}} as any)}
            />
          ))}

          {showVideos && videoAds.map(item=>(
            <ItemCard key={item.id}
              image={item.image} title={item.title} subtitle={item.sub||"Video Ad"} price={item.price}
              status={item.status==="active"?"Approved":item.status==="pending"?"Pending":"Rejected"}
              date={item.date||""} showActions={item.status==="pending"}
              actionLoading={actionLoading} itemId={item.id}
              mediaKind="video" onPlayMedia={()=>openMedia(item, 'video')}
              onApprove={()=>approveVideo(item.id)} onReject={()=>rejectVideo(item.id)}
              onView={()=>router.push({pathname:"/(admin)/listing-detail",params:{id:item.id,type:"video_ad",itemData:JSON.stringify(item)}} as any)}
            />
          ))}

          {showAccounts && (accounts.length===0 ? (
            <View style={s.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color={aC.isDark ? "rgba(39,174,96,0.4)" : "rgba(39,174,96,0.5)"}/>
              <Text style={[s.emptyTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>All Clear!</Text>
              <Text style={[s.emptySubtitle, { color: aC.isDark ? MUTED : '#475569' }]}>No pending account verifications</Text>
            </View>
          ) : accounts.map(u=>(
            <AccountCard key={u.id} user={u}
              actionLoading={actionLoading} itemId={u.id}
              onApprove={()=>approveAccount(u.id)} onReject={()=>rejectAccount(u.id)}
              onView={()=>router.push({pathname:"/(admin)/listing-detail",params:{type:"user_request",userId:u.id,userData:JSON.stringify(u)}} as any)}
            />
          )))}

        </>}
        <View style={{height:100}}/>
      </ScrollView>

      {/* Media preview — video play / image view */}
      <Modal visible={!!mediaPreview} transparent animationType="fade" onRequestClose={() => setMediaPreview(null)}>
        <View style={s.mediaOverlay}>
          <View style={s.mediaHeader}>
            <Text style={s.mediaTitle} numberOfLines={1}>{mediaPreview?.title}</Text>
            <TouchableOpacity style={s.mediaClose} onPress={() => setMediaPreview(null)}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {mediaPreview?.kind === 'video' ? (
            <Video
              source={{ uri: mediaPreview.uri }}
              style={s.mediaVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls
            />
          ) : (
            <Image source={{ uri: mediaPreview?.uri || '' }} style={s.mediaImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      <AdminFooter active="ads"/>
    </SafeAreaView>
  );
}

/* ── Item Card ── */
function ItemCard({image,title,subtitle,price,status,date,showActions,actionLoading,itemId,onApprove,onReject,onView,mediaKind,onPlayMedia}:any){
  const aC = useAppColors();
  const isApproved = status==="Approved";
  const isVideo = mediaKind === "video";
  return (
    <View style={[s.card, { backgroundColor: aC.isDark ? CARD_BG : '#ffffff', borderColor: aC.isDark ? GLASS_BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
      <CardShade/>
      <View style={s.cardTop}>
        <TouchableOpacity
          style={[s.imgBox, { backgroundColor: aC.isDark ? "rgba(1,6,20,0.8)" : '#eef2ff' }]}
          onPress={image ? onPlayMedia : undefined}
          activeOpacity={image ? 0.8 : 1}
        >
          {image && !isVideo
            ? <Image source={{uri: resolveImg(image)!}} style={s.cardImg} resizeMode="cover"/>
            : <Ionicons name={isVideo ? "videocam-outline" : "car-outline"} size={28} color={aC.isDark ? "#4B5A7A" : "#94a3b8"}/>
          }
          {isVideo && image && (
            <View style={s.playOverlay}>
              <View style={s.playCircle}>
                <Ionicons name="play" size={16} color="#fff" style={{ marginLeft: 2 }} />
              </View>
            </View>
          )}
          <View style={[s.badge, {backgroundColor: isApproved?"rgba(39,174,96,0.2)":"rgba(226,103,27,0.2)", borderColor: isApproved?GREEN:ORANGE}]}>
            <Text style={[s.badgeTxt,{color: isApproved?GREEN:ORANGE}]}>{status}</Text>
          </View>
        </TouchableOpacity>
        <View style={s.cardInfo}>
          <Text style={[s.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={2}>{title}</Text>
          <Text style={[s.cardSub, { color: aC.isDark ? MUTED : '#475569' }]}>{subtitle}</Text>
          {price && <Text style={[s.cardPrice, { color: aC.isDark ? WHITE : '#010a1f' }]}>{price}</Text>}
        </View>
      </View>

      <View style={[s.divider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]}/>

      <View style={s.dateRow}>
        <Text style={[s.dateTxt, { color: aC.isDark ? MUTED : '#475569' }]}>{date?`Date: ${date}`:""}</Text>
        <TouchableOpacity onPress={onView} style={{flexDirection:"row",alignItems:"center",gap:2}}>
          <Text style={s.viewTxt}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color={ORANGE}/>
        </TouchableOpacity>
      </View>

      {showActions && (<>
        <View style={[s.divider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]}/>
        <View style={s.btnRow}>
          <TouchableOpacity style={[s.outBtn,{borderColor:RED, backgroundColor: aC.isDark ? 'transparent' : '#ffffff'}]} onPress={onReject} disabled={actionLoading===itemId+"_reject"}>
            {actionLoading===itemId+"_reject"?<ActivityIndicator size="small" color={RED}/>:<Text style={{color:RED,fontWeight:"700",fontSize:13}}>Reject</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[s.outBtn, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderColor: aC.isDark ? "rgba(255,255,255,0.15)" : 'rgba(3,42,105,0.12)' }]}>
            <Text style={{color:ORANGE,fontWeight:"700",fontSize:13}}>Promote</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{flex:1,borderRadius:20,overflow:"hidden"}} onPress={onApprove} disabled={actionLoading===itemId+"_approve"}>
            <LinearGradient colors={["#032a69",ORANGE]} start={{x:0,y:0}} end={{x:1,y:0}} style={s.fillBtn}>
              {actionLoading===itemId+"_approve"?<ActivityIndicator size="small" color={WHITE}/>:<Text style={{color:WHITE,fontWeight:"700",fontSize:13}}>Approve</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </>)}
    </View>
  );
}

/* ── Account Card ── */
function AccountCard({user,onView,onApprove,onReject,actionLoading,itemId}:any){
  const aC = useAppColors();
  const uAvatar = resolveImg(user.avatar_url);
  return(
    <View style={[s.card, { backgroundColor: aC.isDark ? CARD_BG : '#ffffff', borderColor: aC.isDark ? GLASS_BORDER : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 3 }]}>
      <CardShade/>
      <View style={s.cardTop}>
        <View style={[s.imgBox,{backgroundColor: aC.isDark ? "rgba(226,103,27,0.08)" : '#eef2ff', borderWidth:1,borderColor:aC.isDark ? "rgba(226,103,27,0.2)" : 'rgba(3,42,105,0.08)', overflow:'hidden'}]}>
          {uAvatar ? (
            <Image source={{ uri: uAvatar }} style={s.cardImg} resizeMode="cover" />
          ) : (
            <Ionicons name="person-outline" size={32} color={ORANGE}/>
          )}
          <View style={[s.badge,{backgroundColor:"rgba(226,103,27,0.2)",borderColor:ORANGE}]}>
            <Text style={[s.badgeTxt,{color:ORANGE}]}>Pending</Text>
          </View>
        </View>
        <View style={s.cardInfo}>
          <Text style={[s.cardTitle, { color: aC.isDark ? WHITE : '#010a1f' }]} numberOfLines={1}>{user.full_name}</Text>
          <Text style={[s.cardSub, { color: aC.isDark ? MUTED : '#475569' }]}>{user.email||user.phone||"—"}</Text>
          <Text style={[s.cardPrice,{color:ORANGE,fontSize:12}]}>{ROLE_MAP[user.role]||user.role}</Text>
        </View>
      </View>

      <View style={[s.divider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]}/>

      <View style={s.dateRow}>
        <Text style={[s.dateTxt, { color: aC.isDark ? MUTED : '#475569' }]}>{user.created_at?`Date: ${new Date(user.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}`:""}</Text>
        <TouchableOpacity onPress={onView} style={{flexDirection:"row",alignItems:"center",gap:2}}>
          <Text style={s.viewTxt}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color={ORANGE}/>
        </TouchableOpacity>
      </View>

      <View style={[s.divider, { backgroundColor: aC.isDark ? "rgba(255,255,255,0.06)" : 'rgba(3,42,105,0.08)' }]}/>
      <View style={s.btnRow}>
        <TouchableOpacity style={[s.outBtn,{borderColor:RED, backgroundColor: aC.isDark ? 'transparent' : '#ffffff'}]} onPress={onReject} disabled={actionLoading===itemId+"_reject"}>
          {actionLoading===itemId+"_reject"?<ActivityIndicator size="small" color={RED}/>:<Text style={{color:RED,fontWeight:"700",fontSize:13}}>Reject</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={{flex:1,borderRadius:20,overflow:"hidden"}} onPress={onApprove} disabled={actionLoading===itemId+"_approve"}>
          <LinearGradient colors={["#032a69",ORANGE]} start={{x:0,y:0}} end={{x:1,y:0}} style={s.fillBtn}>
            {actionLoading===itemId+"_approve"?<ActivityIndicator size="small" color={WHITE}/>:<Text style={{color:WHITE,fontWeight:"700",fontSize:13}}>Approve</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View style={{height:10}}/>
      <TouchableOpacity style={{borderRadius:20,overflow:"hidden"}} onPress={onView}>
        <LinearGradient colors={["#032a69",ORANGE]} start={{x:0,y:0}} end={{x:1,y:0}} style={[s.fillBtn,{flex:0,paddingHorizontal:24}]}>
          <Text style={{color:WHITE,fontWeight:"700",fontSize:13}}>Review Account</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  safe:  {flex:1, backgroundColor:BG},
  scroll:{paddingHorizontal:16, paddingBottom:30},

  header:     {flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12},
  headerTitle:{color:WHITE, fontSize:18, fontFamily:"Poppins_600SemiBold"},
  iconBtn:    {width:36, height:36, borderRadius:18, backgroundColor:"rgba(255,255,255,0.06)", alignItems:"center", justifyContent:"center"},

  searchRow:  {flexDirection:"row", alignItems:"center", marginBottom:14, gap:12},
  searchBox:  {flex:1, height:46, borderRadius:30, borderWidth:1, borderColor:GLASS_BORDER, backgroundColor:GLASS_BG, flexDirection:"row", alignItems:"center", paddingHorizontal:16, gap:10},
  searchInput:{flex:1, color:WHITE, fontSize:14, fontFamily:"Poppins_400Regular"},
  sortBtn:    {flexDirection:"row", alignItems:"center", gap:6, paddingHorizontal:4},
  sortTxt:    {color:WHITE, fontSize:13, fontFamily:"Poppins_500Medium"},

  tabRow:     {gap:8, paddingBottom:10},
  tab:        {height:40, minWidth:80, paddingHorizontal:18, borderRadius:20, backgroundColor:"rgba(3,12,40,0.6)", borderWidth:1, borderColor:"rgba(100,160,255,0.2)", justifyContent:"center", alignItems:"center"},
  tabActive:  {borderColor:GLASS_BORDER},
  tabTxt:     {color:MUTED, fontSize:13, fontFamily:"Poppins_500Medium"},
  tabTxtActive:{color:ORANGE, fontFamily:"Poppins_600SemiBold"},

  // Account count cards
  countRow:  {flexDirection:"row", gap:10, marginBottom:4},
  countCard: {flex:1, borderRadius:14, borderWidth:1, padding:14, alignItems:"center", gap:4, overflow:"hidden"},
  countNum:  {fontSize:22, fontFamily:"Poppins_700Bold"},
  countLbl:  {fontSize:11, fontFamily:"Poppins_500Medium"},

  // Card — card base style
  card:     {borderRadius:20, overflow:"hidden", backgroundColor:CARD_BG, borderWidth:1, borderColor:GLASS_BORDER, marginTop:12, padding:14},
  cardTop:  {flexDirection:"row", gap:12},
  imgBox:   {width:100, height:86, borderRadius:12, backgroundColor:"rgba(1,6,20,0.8)", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative", flexShrink:0},
  cardImg:  {width:"100%", height:"100%"},

  badge:    {position:"absolute", top:5, left:5, borderRadius:6, paddingHorizontal:6, paddingVertical:2, borderWidth:1},
  badgeTxt: {fontSize:9, fontFamily:"Poppins_700Bold"},

  cardInfo: {flex:1, justifyContent:"center", gap:4},
  cardTitle:{color:WHITE, fontSize:17, fontFamily:"Poppins_500Medium", lineHeight:23},
  cardSub:  {color:MUTED, fontSize:13, fontFamily:"Poppins_400Regular"},
  cardPrice:{color:WHITE, fontSize:13, fontFamily:"Poppins_600SemiBold"},

  divider:  {height:1, backgroundColor:"rgba(255,255,255,0.06)", marginVertical:10},

  dateRow:  {flexDirection:"row", justifyContent:"space-between", alignItems:"center"},
  dateTxt:  {color:MUTED, fontSize:11, fontFamily:"Poppins_400Regular"},
  viewTxt:  {color:ORANGE, fontSize:12, fontFamily:"Poppins_600SemiBold"},

  btnRow:   {flexDirection:"row", gap:8},
  outBtn:   {flex:1, height:38, borderRadius:19, borderWidth:1, borderColor:"rgba(255,255,255,0.15)", alignItems:"center", justifyContent:"center"},
  fillBtn:  {height:38, alignItems:"center", justifyContent:"center"},

  empty:        {alignItems:"center", paddingTop:60, gap:10},
  emptyTitle:   {color:WHITE, fontSize:17, fontFamily:"Poppins_600SemiBold"},
  emptySubtitle:{color:MUTED, fontSize:12, fontFamily:"Poppins_400Regular"},

  // Media preview
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)" },
  playCircle:  { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(226,103,27,0.9)", alignItems: "center", justifyContent: "center" },
  mediaOverlay:{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", paddingHorizontal: 16 },
  mediaHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  mediaTitle:  { flex: 1, color: "#fff", fontSize: 15, fontFamily: "Poppins_600SemiBold", marginRight: 12 },
  mediaClose:  { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  mediaVideo:  { width: "100%", height: 320, borderRadius: 12, backgroundColor: "#000" },
  mediaImage:  { width: "100%", height: 420, borderRadius: 12 },
});
