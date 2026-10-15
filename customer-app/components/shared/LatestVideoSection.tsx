import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE } from '@/constants/api';
import { logApi, logApiError } from '@/constants/apiLog';
import { useAppColors } from '@/constants/theme';

const VIDEO_IMG =
  'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=700&q=80';

const WHITE    = '#f9fafc';
const SUBTITLE = '#baacb6';
const ORANGE   = '#e2671b';
const NAVY     = '#032a69';
const GLASS    = 'rgba(6,27,74,0.6)';
const BORDER   = 'rgba(255,255,255,0.15)';

interface Props {
  count?: number;   // how many video cards to show (default 2)
  savedCardStyle?: boolean;   // app/profile/saved.tsx vehicle card effect
  hideHeading?: boolean;      // screen apna heading khud dikhati ho
  noTopMargin?: boolean;
}

function VideoCard({ item, onPlay, savedStyle }: { item: any; onPlay: () => void; savedStyle?: boolean }) {
  const SERVER = API_BASE.replace('/api/v1', '');
  const C = useAppColors();
  const thumb = item.media_url?.startsWith('http') ? item.media_url : item.media_url ? `${SERVER}${item.media_url}` : VIDEO_IMG;
  const title = item.title || '';
  const isVideo = (item.media_url || '').match(/\.(mp4|mov|webm)$/i);
  return (
    <TouchableOpacity style={[s.card, { backgroundColor: C.isDark ? C.glassBg : '#ffffff', borderColor: C.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(226,103,27,0.28)', shadowColor: 'transparent', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0, shadowRadius: 10, elevation: 0 }, C.isDark && savedStyle && s.savedCard, !C.isDark && { borderRadius: 20, marginBottom: 16, boxShadow: '2px 5px 6px rgba(0,0,0,0.19)' }]} activeOpacity={0.86} onPress={onPlay}>
      {C.isDark && savedStyle ? (
        <>
          {/* app/profile/saved.tsx — vehicle card effect */}
          <LinearGradient
            colors={['#16408880', 'transparent', 'transparent', '#16408880']}
            locations={[0, 0.08, 0.92, 1]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['#16408880', 'transparent', 'transparent', '#16408880']}
            locations={[0, 0.05, 0.95, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
        </>
      ) : C.isDark ? (
        <>
          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      ) : null}
      <View style={s.thumb}>
        {isVideo ? (
          // Discover More jaisa — asli video ka pehla frame (play se pehle), muted + paused
          <Video
            source={{ uri: thumb }}
            style={s.thumbImg}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isMuted
            positionMillis={1}
          />
        ) : (
          <Image source={{ uri: thumb }} style={s.thumbImg} resizeMode="cover" />
        )}
        <View style={s.playBtn}>
          <Ionicons name={isVideo ? "videocam" : "play"} size={14} color={WHITE} />
        </View>
        {/* "Video Ad" badge nahi dikhana — sirf non-video pe "Ad" */}
        {!isVideo && (
          <View style={s.durBadge}>
            <Text style={s.durTxt}>Ad</Text>
          </View>
        )}
      </View>
      <View style={[s.info, savedStyle && { gap: 5 }]}>
        <Text style={[s.title, { color: C.textPrimary }]} numberOfLines={1}>{title}</Text>
        <Text style={[s.subtitle, { color: C.textSecondary }]} numberOfLines={1}>{item.user_type || 'All Users'} • {item.cities?.[0] || 'All Cities'}</Text>
        <View style={[s.divider, { backgroundColor: C.divider }]} />
        <View style={s.meta}>
          <View style={s.metaItem}>
            <Ionicons name="eye-outline" size={10} color={ORANGE} />
            <Text style={[s.metaTxt, { color: C.textSecondary }]}>{item.views || '—'} Views</Text>
          </View>
          <View style={s.metaItem}>
            <Ionicons name="calendar-outline" size={10} color={ORANGE} />
            <Text style={[s.metaTxt, { color: C.textSecondary }]}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently'}</Text>
          </View>
        </View>
        <View style={[s.watchBtn, savedStyle && { alignSelf: 'flex-end' }]}>
          <Ionicons name="play" size={12} color="#ff383c" />
          <Text style={s.watchTxt}>Watch Video</Text>
          <Ionicons name="chevron-forward" size={12} color="#ff383c" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function LatestVideoSection({ count = 2, savedCardStyle = false, hideHeading = false, noTopMargin = false }: Props) {
  const C = useAppColors();
  const SERVER = API_BASE.replace('/api/v1', '');
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<{ uri: string; title: string } | null>(null);

  // Saare partners (dealer/bank/insurance/tracker/seller) ki user-ids — /sellers
  // in paanch roles ko deta hai, admin nahi. Is se admin vs partner pehchan hoti hai.
  async function fetchPartnerIds(): Promise<Set<string> | null> {
    const ids = new Set<string>();
    try {
      for (let page = 1; page <= 5; page++) {
        const url = `${API_BASE}/sellers/?page=${page}&limit=100`;
        const t0 = Date.now();
        const res = await fetch(url);
        const data = await res.json().catch(() => undefined);
        logApi('Latest Video › partners', 'GET', url, res, data, t0);
        if (!res.ok || !Array.isArray(data)) break;
        data.forEach((p: any) => p?.id && ids.add(String(p.id)));
        if (data.length < 100) break;   // aakhri page
      }
    } catch (e) {
      logApiError('Latest Video › partners', 'GET', `${API_BASE}/sellers/`, e, Date.now());
    }
    return ids.size ? ids : null;
  }

  useEffect(() => {
    (async () => {
      const url = `${API_BASE}/video-ads`;
      const t0 = Date.now();
      try {
        const [res, partnerIds] = await Promise.all([fetch(url), fetchPartnerIds()]);
        const data = await res.json().catch(() => undefined);
        logApi('Latest Video', 'GET', url, res, data, t0);
        if (res.ok) {
          const items = Array.isArray(data) ? data : data.items || [];
          // SIRF admin ki ads — yani jo kisi partner (dealer/bank/insurance/tracker/seller)
          // ki na ho. Partner list me jo nahi, wahi admin ki hai.
          const adminOnly = partnerIds
            ? items.filter((v: any) => !v?.dealer_id || !partnerIds.has(String(v.dealer_id)))
            : items;
          // Latest first — start ki videos (koi random/shuffle nahi)
          const sorted = [...adminOnly].sort((a, b) => {
            const da = new Date(a.created_at || a.createdAt || 0).getTime();
            const db = new Date(b.created_at || b.createdAt || 0).getTime();
            return db - da;
          });
          setVideos(sorted.slice(0, count));
        }
      } catch (e) { logApiError('Latest Video', 'GET', url, e, t0); }
      finally { setLoading(false); }
    })();
  }, [count]);
  if (loading) return <View style={s.wrap}><ActivityIndicator color={ORANGE} style={{ marginTop: 12 }} /></View>;
  const list = videos.length > 0 ? videos : Array.from({ length: count }).map((_, i) => ({ id: `fallback-${i}`, title: '2026 Honda Civic', media_url: VIDEO_IMG, user_type: 'All Users' }));

  function playUrl(item: any): string | null {
    const u = item.media_url;
    if (!u) return null;
    if (u.startsWith('http')) return u;
    return `${SERVER}${u.startsWith('/') ? u : `/${u}`}`;
  }

  return (
    <View style={[s.wrap, noTopMargin && { marginTop: 0 }]}>
      {!hideHeading && (
        <View style={s.header}>
          <Text style={[s.heading, { color: C.textPrimary }]}>Latest Video</Text>
        </View>
      )}
      {list.map((v: any) => (
        <VideoCard
          key={v.id || v._id || v.title}
          item={v}
          savedStyle={savedCardStyle}
          onPlay={() => {
            const uri = playUrl(v);
            if (!uri) return;
            setPlaying({ uri, title: v.title || '' });
          }}
        />
      ))}

      {/* Video player */}
      <Modal visible={!!playing} transparent animationType="fade" onRequestClose={() => setPlaying(null)}>
        <View style={s.playerOverlay}>
          <View style={s.playerHeader}>
            <Text style={s.playerTitle} numberOfLines={1}>{playing?.title}</Text>
            <TouchableOpacity style={s.playerClose} onPress={() => setPlaying(null)}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {playing && (/\.(mp4|mov|webm)$/i.test(playing.uri) ? (
            <Video
              source={{ uri: playing.uri }}
              style={s.playerVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls
            />
          ) : (
            <Image source={{ uri: playing.uri }} style={s.playerVideo} resizeMode="contain" />
          ))}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { marginTop: 20 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heading: { color: WHITE, fontSize: 16, fontFamily: 'Poppins_500Medium', textTransform: 'capitalize' },

  card: {
    flexDirection: 'row', gap: 14,
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    borderRadius: 16, padding: 10, marginBottom: 10,
    backgroundColor: 'rgba(3,12,40,0.6)',
    overflow: 'hidden',
  },
  savedCard: {
    borderRadius: 20, backgroundColor: '#010A1F', borderColor: '#82a5d5',
    shadowColor: '#638ed0', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 2,
    paddingVertical: 16, gap: 16,
  },
  thumb:    { width: 144, height: 117, borderRadius: 16, overflow: 'hidden', flexShrink: 0 },
  thumbImg: { width: 144, height: 117 },
  playBtn:  {
    position: 'absolute', top: 43, left: 56,
    width: 32, height: 32, borderRadius: 17,
    backgroundColor: 'rgba(3,42,105,0.83)',
    alignItems: 'center', justifyContent: 'center',
  },
  durBadge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 17,
  },
  durTxt:   { color: WHITE, fontSize: 8, fontFamily: 'Poppins_400Regular' },

  info:     { flex: 1, justifyContent: 'center', gap: 4 },
  title:    { color: WHITE,    fontSize: 14, fontFamily: 'Poppins_500Medium' },
  subtitle: { color: SUBTITLE, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  divider:  { height: 0.5, backgroundColor: BORDER },
  meta:     { flexDirection: 'row', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt:  { color: SUBTITLE, fontSize: 8, fontFamily: 'Poppins_400Regular' },

  watchBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  watchTxt: { color: '#ff383c', fontSize: 9, fontFamily: 'Poppins_600SemiBold' },

  playerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', paddingHorizontal: 16 },
  playerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  playerTitle: { flex: 1, color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginRight: 12 },
  playerClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  playerVideo: { width: '100%', height: 320, borderRadius: 12, backgroundColor: '#000' },
});
