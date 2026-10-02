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
import { AppColors, useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import AdminFooter from '@/components/admin/AdminFooter';

const { width: SW, height: SH } = Dimensions.get('window');

const ORANGE = AppColors.gradientEnd;
const NAVY   = AppColors.gradientStart;

function GlassInset({ isDark }: { isDark: boolean }) {
  if (isDark) {
    return (
      <>
        <LinearGradient colors={['rgba(22,64,136,0.2)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        <LinearGradient colors={['transparent','rgba(29,83,175,0.15)']} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      </>
    );
  }
  return (
    <>
      <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

/* ── Video Player Modal ── */
function VideoPlayerModal({
  visible, uri, title, onClose,
}: {
  visible: boolean; uri: string; title: string; onClose: () => void;
}) {
  const videoRef                 = useRef<Video>(null);
  const [status,   setStatus]   = useState<AVPlaybackStatus | null>(null);
  const [muted,    setMuted]    = useState(false);
  const [showCtrl, setShowCtrl] = useState(true);

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

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={vpm.bg}>
        <TouchableWithoutFeedback onPress={() => setShowCtrl(v => !v)}>
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

        {showCtrl && (
          <View style={vpm.overlay} pointerEvents="box-none">
            <View style={vpm.topBar}>
              <TouchableOpacity style={vpm.closeBtn} onPress={onClose}>
                <X size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={vpm.titleText} numberOfLines={1}>{title}</Text>
              <TouchableOpacity style={vpm.closeBtn} onPress={() => setMuted(m => !m)}>
                {muted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={vpm.centerBtn} onPress={togglePlay} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(3,42,105,0.85)', 'rgba(226,103,27,0.85)']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject} />
              {isPlaying
                ? <Pause size={30} color="#fff" fill="#fff" />
                : <Play  size={30} color="#fff" fill="#fff" style={{ marginLeft: 4 }} />
              }
            </TouchableOpacity>
            <View style={vpm.bottomBar}>
              <Text style={vpm.timeText}>{fmt(position)}</Text>
              <View style={vpm.progressBg}>
                <View style={[vpm.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={vpm.timeText}>{fmt(duration)}</Text>
            </View>
          </View>
        )}

        {status && !status.isLoaded && (
          <ActivityIndicator style={StyleSheet.absoluteFillObject} color={ORANGE} size="large" />
        )}
      </View>
    </Modal>
  );
}

const vpm = StyleSheet.create({
  bg:           { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  videoWrap:    { flex: 1 },
  video:        { flex: 1 },
  overlay:      { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: 'rgba(0,0,0,0.45)' },
  closeBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleText:    { flex: 1, color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  centerBtn:    { width: 68, height: 68, borderRadius: 34, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  bottomBar:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12, backgroundColor: 'rgba(0,0,0,0.45)' },
  timeText:     { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'Poppins_500Medium', width: 36 },
  progressBg:   { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: ORANGE, borderRadius: 2 },
});

/* ── Helpers ── */
const SERVER_BASE = API_BASE.replace('/api/v1', '');
function resolveMedia(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}

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

/* ── Banner Card ── */
function BannerCard({ banner, onDelete, onDetail }: { banner: any; onDelete: () => void; onDetail: () => void }) {
  const aC = useAppColors();
  const left   = daysLeft(banner.expires_at);
  const sColor = statusColor(banner.status);
  return (
    <View style={[bc.card, { backgroundColor: aC.isDark ? "rgba(1,6,20,1)" : "#ffffff", borderColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 2 }]}>
      <TouchableOpacity style={bc.thumb} onPress={onDetail} activeOpacity={0.85}>
        {banner.banner_image_url ? (
          <Image source={{ uri: banner.banner_image_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#374151','#1f2937','#000']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject}/>
        )}
        {banner.status === 'active' && (
          <View style={bc.activeBadge}><Text style={bc.activeTxt}>Approved</Text></View>
        )}
        {banner.status === 'pending' && (
          <View style={[bc.activeBadge, { backgroundColor: '#f59e0b' }]}><Text style={bc.activeTxt}>Pending</Text></View>
        )}
        <TouchableOpacity style={bc.deleteCircle} onPress={onDelete}>
          <Trash2 size={11} color="#ff4050"/>
        </TouchableOpacity>
        <View style={bc.caption}>
          <Text style={bc.captionTitle} numberOfLines={1}>{banner.title}</Text>
          <Text style={bc.captionSub}>{banner.display_location || banner.campaign_name || 'Banner Ad'}</Text>
        </View>
      </TouchableOpacity>
      <View style={[bc.footer, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderTopWidth: aC.isDark ? 0 : 1, borderTopColor: 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity onPress={onDetail}><Text style={bc.detailsLink}>Details ›</Text></TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={[bc.statusDot, { backgroundColor: sColor }]} />
          <Text style={[bc.durationText, { color: sColor }]}>
            {banner.status === 'active' ? `${left}d left` : banner.status}
          </Text>
        </View>
      </View>
    </View>
  );
}
const bc = StyleSheet.create({
  card:         { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  thumb:        { height: 190, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  activeBadge:  { position: 'absolute', top: 8, left: 8, backgroundColor: '#00d084', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  activeTxt:    { color: '#fff', fontSize: 8, fontFamily: 'Poppins_700Bold' },
  deleteCircle: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,68,68,0.4)', alignItems: 'center', justifyContent: 'center' },
  caption:      { position: 'absolute', bottom: 8, left: 8, right: 8 },
  captionTitle: { color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold', lineHeight: 13 },
  captionSub:   { color: 'rgba(255,255,255,0.5)', fontSize: 7, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  footer:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: AppColors.glassBg },
  detailsLink:  { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  statusDot:    { width: 6, height: 6, borderRadius: 3 },
  durationText: { fontSize: 9, fontFamily: 'Poppins_500Medium', textTransform: 'capitalize' },
});

/* ── Video Card ── */
function VideoCard({ video, onDelete, onPlay, onDetail }: { video: any; onDelete: () => void; onPlay: () => void; onDetail: () => void }) {
  const aC = useAppColors();
  const left   = daysLeft(video.expires_at);
  const sColor = statusColor(video.status);
  return (
    <View style={[vc.card, { backgroundColor: aC.isDark ? "rgba(1,6,20,1)" : "#ffffff", borderColor: aC.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 2 }]}>
      <TouchableOpacity style={vc.thumb} onPress={onPlay} activeOpacity={0.85}>
        {video.media_url ? (
          <Image source={{ uri: video.media_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#374151','#1f2937','#000']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject}/>
        )}
        {video.status === 'active' && (
          <View style={vc.promotedBadge}><Text style={vc.promotedText}>Approved</Text></View>
        )}
        {video.status === 'pending' && (
          <View style={[vc.promotedBadge, { backgroundColor: '#f59e0b' }]}><Text style={vc.promotedText}>Pending</Text></View>
        )}
        <TouchableOpacity style={vc.deleteCircle} onPress={onDelete}>
          <Trash2 size={11} color="#ff4050"/>
        </TouchableOpacity>
        <View style={vc.playBtn}>
          <LinearGradient colors={[NAVY, ORANGE]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject}/>
          <Play size={14} color="#fff" fill="#fff" style={{ marginLeft: 2 }}/>
        </View>
        <View style={vc.caption}>
          <Text style={vc.captionTitle} numberOfLines={1}>{video.title}</Text>
          <Text style={vc.captionSub}>{video.display_location}</Text>
        </View>
      </TouchableOpacity>
      <View style={[vc.footer, { backgroundColor: aC.isDark ? AppColors.glassBg : '#ffffff', borderTopWidth: aC.isDark ? 0 : 1, borderTopColor: 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity onPress={onDetail}><Text style={vc.detailsLink}>Details ›</Text></TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={[vc.dot, { backgroundColor: sColor }]} />
          <Text style={[vc.durationText, { color: sColor }]}>
            {video.status === 'active' ? `${left}d left` : video.status}
          </Text>
        </View>
      </View>
    </View>
  );
}
const vc = StyleSheet.create({
  card:          { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  thumb:         { height: 190, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  promotedBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#00d084', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  promotedText:  { color: '#fff', fontSize: 8, fontFamily: 'Poppins_700Bold' },
  deleteCircle:  { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,68,68,0.4)', alignItems: 'center', justifyContent: 'center' },
  playBtn:       { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  caption:       { position: 'absolute', bottom: 8, left: 8, right: 8 },
  captionTitle:  { color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold', lineHeight: 13 },
  captionSub:    { color: 'rgba(255,255,255,0.5)', fontSize: 7, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  footer:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: AppColors.glassBg },
  detailsLink:   { color: ORANGE, fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  dot:           { width: 6, height: 6, borderRadius: 3 },
  durationText:  { fontSize: 9, fontFamily: 'Poppins_500Medium', textTransform: 'capitalize' },
});

/* ── Empty State ── */
function EmptyState({ label, onAdd }: { label: string; onAdd: () => void }) {
  const aC = useAppColors();
  return (
    <View style={es.wrap}>
      <View style={es.iconWrap}>
        <LinearGradient colors={[NAVY, ORANGE]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject} />
        <Megaphone size={22} color="#fff" />
      </View>
      <Text style={[es.title, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>No {label} yet</Text>
      <Text style={[es.sub, { color: aC.isDark ? AppColors.textSecondary : '#475569' }]}>Tap + to create your first {label.toLowerCase()}</Text>
      <TouchableOpacity style={es.btn} onPress={onAdd}>
        <LinearGradient colors={[NAVY, ORANGE]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject}/>
        <Plus size={16} color="#fff" />
        <Text style={es.btnTxt}>Add {label}</Text>
      </TouchableOpacity>
    </View>
  );
}
const es = StyleSheet.create({
  wrap:     { alignItems: 'center', paddingVertical: 32, gap: 10 },
  iconWrap: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  title:    { color: AppColors.textPrimary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  sub:      { color: AppColors.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  btn:      { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingHorizontal: 20, borderRadius: 21, overflow: 'hidden', marginTop: 6 },
  btnTxt:   { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
});

/* ── Main Screen ── */
export default function AdminAdvertisementScreen() {
  const router    = useRouter();
  const { token } = useAuth();
  const aC = useAppColors();

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
      if (bRes.ok) { const d = await bRes.json(); setBanners(d.filter((b: any) => b.status !== 'expired' && b.status !== 'cancelled')); }
      if (vRes.ok) { const d = await vRes.json(); setVideos(d.filter((v: any) => v.status !== 'expired' && v.status !== 'cancelled')); }
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function deleteBanner(id: string) {
    Alert.alert('Delete Banner', 'Remove this banner ad?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await fetch(`${API_BASE}/banner-ads/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
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
          const res = await fetch(`${API_BASE}/video-ads/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) setVideos(prev => prev.filter(v => v.id !== id));
          else Alert.alert('Error', 'Could not delete.');
        } catch { Alert.alert('Error', 'Network error.'); }
      }},
    ]);
  }

  return (
    <View style={[s.container, { backgroundColor: aC.bg }]}>
      <SafeAreaView style={[s.safeArea, { backgroundColor: aC.bg }]} edges={['top']}>

        {/* HEADER */}
        <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={24} color={ORANGE} strokeWidth={2}/>
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Active Advertisements</Text>
          <TouchableOpacity
            style={s.analyticsBtn}
            onPress={() => router.push('/(admin)/analytics' as any)}
          >
            <BarChart2 size={20} color={ORANGE}/>
          </TouchableOpacity>
        </View>

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
            {/* ACTIVE BANNERS */}
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Active Banners</Text>
              <TouchableOpacity style={[s.addBtn, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderColor: ORANGE }]} onPress={() => router.push('/(admin)/add-banner' as any)}>
                <Plus size={16} color={ORANGE}/>
              </TouchableOpacity>
            </View>

            {banners.length === 0 ? (
              <EmptyState label="Banner" onAdd={() => router.push('/(admin)/add-banner' as any)} />
            ) : (
              <>
                <View style={s.videoGrid}>
                  {banners.slice(0, 2).map(b => (
                    <BannerCard key={b.id} banner={b} onDelete={() => deleteBanner(b.id)} onDetail={() => {}} />
                  ))}
                </View>
                {banners.length > 2 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 2, marginTop: 12 }}>
                    {banners.slice(2).map(b => (
                      <View key={b.id} style={{ width: 160 }}>
                        <BannerCard banner={b} onDelete={() => deleteBanner(b.id)} onDetail={() => {}} />
                      </View>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            {/* VIDEO ADS */}
            <View style={[s.sectionHeader, { marginTop: 8 }]}>
              <Text style={[s.sectionTitle, { color: aC.isDark ? AppColors.textPrimary : '#010a1f' }]}>Video Ads</Text>
              <TouchableOpacity style={[s.addBtn, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderColor: ORANGE }]} onPress={() => router.push('/(admin)/video-ads' as any)}>
                <Plus size={16} color={ORANGE}/>
              </TouchableOpacity>
            </View>

            {videos.length === 0 ? (
              <EmptyState label="Video Ad" onAdd={() => router.push('/(admin)/video-ads' as any)} />
            ) : (
              <>
                <View style={s.videoGrid}>
                  {videos.slice(0, 2).map(v => (
                    <VideoCard
                      key={v.id}
                      video={v}
                      onDelete={() => deleteVideo(v.id)}
                      onPlay={() => {
                        const uri = resolveMedia(v.media_url);
                        if (!uri) { Alert.alert('No video', 'This ad has no video file.'); return; }
                        setPlayVideo({ uri, title: v.title });
                      }}
                      onDetail={() => {}}
                    />
                  ))}
                </View>
                {videos.length > 2 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 2, marginTop: 12 }}>
                    {videos.slice(2).map(v => (
                      <View key={v.id} style={{ width: 160 }}>
                        <VideoCard
                          video={v}
                          onDelete={() => deleteVideo(v.id)}
                          onPlay={() => {
                            const uri = resolveMedia(v.media_url);
                            if (!uri) { Alert.alert('No video', 'This ad has no video file.'); return; }
                            setPlayVideo({ uri, title: v.title });
                          }}
                          onDetail={() => {}}
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

        {playVideo && (
          <VideoPlayerModal
            visible={!!playVideo}
            uri={playVideo.uri}
            title={playVideo.title}
            onClose={() => setPlayVideo(null)}
          />
        )}
      </SafeAreaView>

      <AdminFooter active="home" />
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: AppColors.bg },
  safeArea:      { flex: 1, backgroundColor: AppColors.bg },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, height: 60 },
  backBtn:       { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle:   { color: AppColors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  analyticsBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle:  { color: AppColors.textPrimary, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  addBtn:        { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  videoGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
});
