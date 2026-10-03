import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
  RefreshControl, Image, Modal, Dimensions,
  TouchableWithoutFeedback, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import {
  ChevronLeft, Plus, Trash2,
  Play, Pause, BarChart2, Megaphone, X, Volume2, VolumeX,
} from 'lucide-react-native';
import { AppColors } from '@/constants/theme';
import { DHeader } from '@/components/dealer/DealerUI';
import { BannerCard, VideoCard } from '@/components/dealer/AdCards';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const { width: SW, height: SH } = Dimensions.get('window');

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;
const C      = AppColors;

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent','rgba(29,83,175,0.15)']} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

/* ── Video Player Modal ── */
function VideoPlayerModal({
  visible,
  uri,
  title,
  onClose,
}: {
  visible: boolean;
  uri:     string;
  title:   string;
  onClose: () => void;
}) {
  const videoRef                    = useRef<Video>(null);
  const [status,    setStatus]      = useState<AVPlaybackStatus | null>(null);
  const [muted,     setMuted]       = useState(false);
  const [showCtrl,  setShowCtrl]    = useState(true);

  const isPlaying = status?.isLoaded && status.isPlaying;
  const duration  = status?.isLoaded ? (status.durationMillis ?? 0) : 0;
  const position  = status?.isLoaded ? (status.positionMillis ?? 0) : 0;
  const progress  = duration > 0 ? position / duration : 0;

  function fmt(ms: number) {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  async function togglePlay() {
    if (!videoRef.current) return;
    isPlaying ? await videoRef.current.pauseAsync() : await videoRef.current.playAsync();
  }

  function handleTap() {
    setShowCtrl(v => !v);
  }

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={vpm.bg}>

        {/* VIDEO */}
        <TouchableWithoutFeedback onPress={handleTap}>
          <View style={vpm.videoWrap}>
            <Video
              ref={videoRef}
              source={{ uri }}
              style={vpm.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isMuted={muted}
              isLooping
              onPlaybackStatusUpdate={s => setStatus(s)}
            />
          </View>
        </TouchableWithoutFeedback>

        {/* CONTROLS OVERLAY */}
        {showCtrl && (
          <View style={vpm.overlay} pointerEvents="box-none">

            {/* Top bar */}
            <View style={vpm.topBar}>
              <TouchableOpacity style={vpm.closeBtn} onPress={onClose}>
                <X size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={vpm.titleText} numberOfLines={1}>{title}</Text>
              <TouchableOpacity style={vpm.closeBtn} onPress={() => setMuted(m => !m)}>
                {muted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
              </TouchableOpacity>
            </View>

            {/* Center play/pause */}
            <TouchableOpacity style={vpm.centerBtn} onPress={togglePlay} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(3,42,105,0.85)', 'rgba(226,103,27,0.85)']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject} />
              {isPlaying
                ? <Pause size={30} color="#fff" fill="#fff" />
                : <Play  size={30} color="#fff" fill="#fff" style={{ marginLeft: 4 }} />
              }
            </TouchableOpacity>

            {/* Bottom progress */}
            <View style={vpm.bottomBar}>
              <Text style={vpm.timeText}>{fmt(position)}</Text>
              <View style={vpm.progressBg}>
                <View style={[vpm.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={vpm.timeText}>{fmt(duration)}</Text>
            </View>
          </View>
        )}

        {/* Loading spinner */}
        {status && !status.isLoaded && (
          <ActivityIndicator style={StyleSheet.absoluteFillObject} color={ORANGE} size="large" />
        )}
      </View>
    </Modal>
  );
}

const vpm = StyleSheet.create({
  bg:          { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  videoWrap:   { flex: 1 },
  video:       { flex: 1 },
  overlay:     { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: 'rgba(0,0,0,0.45)' },
  closeBtn:    { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleText:   { flex: 1, color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  centerBtn:   { width: 68, height: 68, borderRadius: 34, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  bottomBar:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12, backgroundColor: 'rgba(0,0,0,0.45)' },
  timeText:    { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'Poppins_500Medium', width: 36 },
  progressBg:  { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2, overflow: 'hidden' },
  progressFill:{ height: '100%', backgroundColor: ORANGE, borderRadius: 2 },
});

/* ─────────────────────────────── */

function daysLeft(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

function statusColor(status: string) {
  if (status === 'active')  return '#00d084';
  if (status === 'expired') return '#ff4050';
  if (status === 'paused')  return '#f59e0b';
  if (status === 'pending') return '#f59e0b';
  return '#9ca3af';
}

/* ── Empty State ── */
function EmptyState({ label, onAdd, route }: { label: string; onAdd: () => void; route: string }) {
  return (
    <View style={es.wrap}>
      <View style={es.iconWrap}>
        <LinearGradient colors={[NAVY, ORANGE]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject} />
        <Megaphone size={22} color="#fff" />
      </View>
      <Text style={es.title}>No {label} yet</Text>
      <Text style={es.sub}>Tap + to create your first {label.toLowerCase()}</Text>
      <TouchableOpacity style={es.btn} onPress={onAdd}>
        <LinearGradient colors={[NAVY, ORANGE]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject}/>
        <Plus size={16} color="#fff" />
        <Text style={es.btnTxt}>Add {label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const es = StyleSheet.create({
  wrap:    { alignItems: 'center', paddingVertical: 32, gap: 10 },
  iconWrap:{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  title:   { color: C.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  sub:     { color: C.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  btn:     { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingHorizontal: 20, borderRadius: 21, overflow: 'hidden', marginTop: 6 },
  btnTxt:  { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
});

/* ── Main Screen ── */

export default function AdvertisementScreen() {
  const router      = useRouter();
  const { token }   = useAuth();

  const [banners,    setBanners]    = useState<any[]>([]);
  const [videos,     setVideos]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playVideo,  setPlayVideo]  = useState<{ uri: string; title: string } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [bRes, vRes] = await Promise.all([
        fetch(`${API_BASE}/banner-ads/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/video-ads/my`,  { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (bRes.ok) { const d = await bRes.json(); setBanners(d.filter((b: any) => b.status !== 'expired')); }
      if (vRes.ok) { const d = await vRes.json(); setVideos(d.filter((v: any) => v.status !== 'pending')); }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function deleteBanner(id: string) {
    Alert.alert('Delete Banner', 'Remove this banner ad?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await fetch(`${API_BASE}/banner-ads/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) setBanners(prev => prev.filter(b => b.id !== id));
          else Alert.alert('Error', 'Could not delete.');
        } catch { Alert.alert('Error', 'Network error.'); }
      }},
    ]);
  }

  async function deleteVideo(id: string) {
    Alert.alert('Delete Video', 'Remove this video ad?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await fetch(`${API_BASE}/video-ads/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) setVideos(prev => prev.filter(v => v.id !== id));
          else Alert.alert('Error', 'Could not delete.');
        } catch { Alert.alert('Error', 'Network error.'); }
      }},
    ]);
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>

        {/* HEADER */}
        <DHeader
          title="Active Advertisements"
          right={
            <TouchableOpacity
              style={s.analyticsBtn}
              onPress={() => router.push('/dealer-panel/advertisement-analytics' as any)}
            >
              <BarChart2 size={22} color={ORANGE}/>
            </TouchableOpacity>
          }
        />

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={ORANGE} size="large" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(); }}
                tintColor={ORANGE}
              />
            }
          >

            {/* ── ACTIVE BANNERS ── */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Active Banners</Text>
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => router.push('/dealer-panel/special-offer' as any)}
              >
                <Plus size={20} color={ORANGE}/>
              </TouchableOpacity>
            </View>

            {banners.length === 0 ? (
              <EmptyState
                label="Banner"
                onAdd={() => router.push('/dealer-panel/special-offer' as any)}
                route="/dealer-panel/special-offer"
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingRight: 16 }} style={{ marginHorizontal: -16, paddingLeft: 16, marginBottom: 26 }}>
                {banners.map(b => (
                  <BannerCard
                    key={b.id}
                    banner={b}
                    onDelete={() => deleteBanner(b.id)}
                    onDetail={() => router.push(`/dealer-panel/ad-detail?id=${b.id}&type=banner` as any)}
                  />
                ))}
              </ScrollView>
            )}

            {/* ── VIDEO ADS ── */}
            <View style={[s.sectionHeader, { marginTop: 8 }]}>
              <Text style={s.sectionTitle}>Discover More</Text>
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => router.push('/dealer-panel/video-ads' as any)}
              >
                <Plus size={20} color={ORANGE}/>
              </TouchableOpacity>
            </View>

            {videos.length === 0 ? (
              <EmptyState
                label="Video Ad"
                onAdd={() => router.push('/dealer-panel/video-ads' as any)}
                route="/dealer-panel/video-ads"
              />
            ) : (
              <>
                {/* First 2 in a row */}
                <View style={s.videoGrid}>
                  {videos.slice(0, 2).map(v => (
                    <VideoCard
                      key={v.id}
                      video={v}
                      onDelete={() => deleteVideo(v.id)}
                      onPlay={() => {
                        if (!v.media_url) { Alert.alert('No video', 'This ad has no video file.'); return; }
                        setPlayVideo({ uri: v.media_url, title: v.title });
                      }}
                      onDetail={() => router.push(`/dealer-panel/ad-detail?id=${v.id}&type=video` as any)}
                    />
                  ))}
                </View>
                {/* Rest scroll horizontally */}
                {videos.length > 2 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 2, marginTop: 12 }}>
                    {videos.slice(2).map(v => (
                      <View key={v.id}>
                        <VideoCard
                          video={v}
                          onDelete={() => deleteVideo(v.id)}
                          onPlay={() => {
                            if (!v.media_url) { Alert.alert('No video', 'This ad has no video file.'); return; }
                            setPlayVideo({ uri: v.media_url, title: v.title });
                          }}
                          onDetail={() => router.push(`/dealer-panel/ad-detail?id=${v.id}&type=video` as any)}
                        />
                      </View>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            <View style={{ height: 30 }}/>
          </ScrollView>
        )}
      </View>

      {/* VIDEO PLAYER */}
      {playVideo && (
        <VideoPlayerModal
          visible={!!playVideo}
          uri={playVideo.uri}
          title={playVideo.title}
          onClose={() => setPlayVideo(null)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  analyticsBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle:  { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_500Medium' },
  addBtn:        { width: 28, height: 28, borderRadius: 4, borderWidth: 2, borderColor: ORANGE, alignItems: 'center', justifyContent: 'center' },

  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
});
