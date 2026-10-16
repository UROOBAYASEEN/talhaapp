import { API_BASE } from '@/constants/api';
import { logApi, logApiError } from '@/constants/apiLog';
import { useAppColors } from '@/constants/theme';
import { ResizeMode, Video } from 'expo-av';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Poster — jab media aik video file ho (video se thumbnail nahi banti)
const POSTER = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800';

// Fallback — jab tak/agar koi advertisement video load na ho to UI blank na lage
const FALLBACK = [
  { id: '1', media_url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800' },
  { id: '2', media_url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800' },
  { id: '3', media_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800' },
  { id: '4', media_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800' },
];

const isVideoFile = (u?: string) => !!(u || '').match(/\.(mp4|mov|webm)$/i);

export default function DiscoverMore() {
  const C = useAppColors();
  const SERVER = API_BASE.replace('/api/v1', '');
  const [videos, setVideos] = useState<any[]>([]);
  const [playing, setPlaying] = useState<{ uri: string; title: string } | null>(null);

  // Saare partners (dealer/bank/insurance/tracker/seller) ki user-ids laao.
  // /sellers in paanch roles ko deta hai — admin is list me nahi hota, is liye
  // ye set admin ki ads ko filter karne ke liye allowlist ban jata hai.
  async function fetchPartnerIds(): Promise<Set<string> | null> {
    const ids = new Set<string>();
    try {
      for (let page = 1; page <= 5; page++) {
        const url = `${API_BASE}/sellers/?page=${page}&limit=100`;
        const t0 = Date.now();
        const res = await fetch(url);
        const data = await res.json().catch(() => undefined);
        logApi('Discover More › partners', 'GET', url, res, data, t0);
        if (!res.ok || !Array.isArray(data)) break;
        data.forEach((p: any) => p?.id && ids.add(String(p.id)));
        if (data.length < 100) break;   // aakhri page
      }
    } catch (e) {
      logApiError('Discover More › partners', 'GET', `${API_BASE}/sellers/`, e, Date.now());
    }
    // Agar koi partner id na mile to null — phir filter skip (section blank na ho)
    return ids.size ? ids : null;
  }

  useEffect(() => {
    (async () => {
      const url = `${API_BASE}/video-ads`;
      const t0 = Date.now();
      try {
        const [res, partnerIds] = await Promise.all([fetch(url), fetchPartnerIds()]);
        const data = await res.json().catch(() => undefined);
        logApi('Discover More', 'GET', url, res, data, t0);
        if (res.ok) {
          const items = Array.isArray(data) ? data : data?.items || [];
          // Sirf partner ki ads rakho — admin (jo partner list me nahi) nikal jata hai
          const partnerOnly = partnerIds
            ? items.filter((v: any) => v?.dealer_id && partnerIds.has(String(v.dealer_id)))
            : items;
          const sorted = [...partnerOnly].sort((a, b) => {
            const da = new Date(a.created_at || 0).getTime();
            const db = new Date(b.created_at || 0).getTime();
            return db - da;
          });
          setVideos(sorted);
        }
      } catch (e) {
        logApiError('Discover More', 'GET', url, e, t0);
      }
    })();
  }, []);

  // media_url ko full URL me resolve karo
  const resolve = (u?: string): string | null => {
    if (!u) return null;
    if (u.startsWith('http')) return u;
    return `${SERVER}${u.startsWith('/') ? u : `/${u}`}`;
  };

  const list = videos.length > 0 ? videos : FALLBACK;

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: C.textPrimary }]}>Discover More</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {list.map((video) => {
          const full = resolve(video.media_url);
          const isVid = isVideoFile(video.media_url);
          return (
            <TouchableOpacity
              key={video.id || video._id}
              activeOpacity={0.85}
              onPress={() => {
                const uri = resolve(video.media_url);
                if (uri) setPlaying({ uri, title: video.title || '' });
              }}
              style={[styles.card, { backgroundColor: C.isDark ? '#061b4a' : '#ffffff', borderWidth: C.isDark ? 0 : 1, borderColor: C.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowColor: C.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: C.isDark ? 0 : 0.08, shadowRadius: 10, elevation: C.isDark ? 0 : 3 }]}
            >
              {isVid && full ? (
                // Asli video ka pehla frame preview ke taur pe (play se pehle) — muted, paused
                <Video
                  source={{ uri: full }}
                  style={styles.image}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isMuted
                  positionMillis={1}
                />
              ) : (
                <Image source={{ uri: full || POSTER }} style={styles.image} resizeMode="cover" />
              )}
              {!C.isDark && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 50, backgroundColor: 'rgba(255,255,255,0.02)' }} pointerEvents="none" />}
              <View style={styles.bottomOverlay} />
              <View style={styles.durationContainer}>
                <Text style={styles.playIcon}>▶</Text>
                {!!video.duration && <Text style={styles.duration}>{video.duration}</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Video player */}
      <Modal visible={!!playing} transparent animationType="fade" onRequestClose={() => setPlaying(null)}>
        <View style={styles.playerOverlay}>
          <View style={styles.playerHeader}>
            <Text style={styles.playerTitle} numberOfLines={1}>{playing?.title}</Text>
            <TouchableOpacity style={styles.playerClose} onPress={() => setPlaying(null)}>
              <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
          {playing && (/\.(mp4|mov|webm)$/i.test(playing.uri) ? (
            <Video
              source={{ uri: playing.uri }}
              style={styles.playerVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls
            />
          ) : (
            <Image source={{ uri: playing.uri }} style={styles.playerVideo} resizeMode="contain" />
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 14,
    paddingBottom: 20,
  },
  heading: {
    color: '#f9fafc',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 16,
    marginBottom: 14,
  },
  // color overridden via C.textPrimary inline
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  card: {
    width: 150,
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#061b4a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 70,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  durationContainer: {
    position: 'absolute',
    bottom: 10, left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playIcon: { color: '#fff', fontSize: 9 },
  duration: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_500Medium' },

  playerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', paddingHorizontal: 16 },
  playerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  playerTitle: { flex: 1, color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginRight: 12 },
  playerClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  playerVideo: { width: '100%', height: 320, borderRadius: 12, backgroundColor: '#000' },
});
