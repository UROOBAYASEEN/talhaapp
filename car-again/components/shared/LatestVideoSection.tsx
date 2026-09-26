import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE } from '@/constants/api';
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
}

function VideoCard({ item }: { item: any }) {
  const SERVER = API_BASE.replace('/api/v1', '');
  const C = useAppColors();
  const thumb = item.media_url?.startsWith('http') ? item.media_url : item.media_url ? `${SERVER}${item.media_url}` : VIDEO_IMG;
  const title = item.title || 'Video Ad';
  const isVideo = (item.media_url || '').match(/\.(mp4|mov|webm)$/i);
  return (
    <TouchableOpacity style={[s.card, { backgroundColor: C.isDark ? C.glassBg : '#ffffff', borderColor: C.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: C.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: C.isDark ? 0 : 0.08, shadowRadius: 10, elevation: C.isDark ? 0 : 3 }]} activeOpacity={0.86}>
      {C.isDark ? (
        <>
          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      ) : (
        <>
          <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </>
      )}
      <View style={s.thumb}>
        <Image source={{ uri: thumb }} style={s.thumbImg} resizeMode="cover" />
        <View style={s.playBtn}>
          <Ionicons name={isVideo ? "videocam" : "play"} size={14} color={WHITE} />
        </View>
        <View style={s.durBadge}>
          <Text style={s.durTxt}>{isVideo ? 'Video Ad' : 'Ad'}</Text>
        </View>
      </View>
      <View style={s.info}>
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
        <View style={s.watchBtn}>
          <Ionicons name="play" size={12} color="#ff383c" />
          <Text style={s.watchTxt}>Watch Video</Text>
          <Ionicons name="chevron-forward" size={12} color="#ff383c" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function LatestVideoSection({ count = 2 }: Props) {
  const C = useAppColors();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/video-ads`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.items || [];
          const sorted = [...items].sort((a, b) => {
            const priceA = a.amount ?? a.price ?? a.boost_price ?? 0;
            const priceB = b.amount ?? b.price ?? b.boost_price ?? 0;
            if (priceB !== priceA) return priceB - priceA;
            const da = new Date(a.created_at || a.createdAt || 0).getTime();
            const db = new Date(b.created_at || b.createdAt || 0).getTime();
            return db - da;
          });
          // priority sort (price high → recent) then random pick 2 each time
          const shuffled = [...sorted].sort(() => Math.random() - 0.5);
          setVideos(shuffled.slice(0, count));
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [count]);
  if (loading) return <View style={s.wrap}><ActivityIndicator color={ORANGE} style={{ marginTop: 12 }} /></View>;
  const list = videos.length > 0 ? videos : Array.from({ length: count }).map((_, i) => ({ id: `fallback-${i}`, title: '2026 Honda Civic', media_url: VIDEO_IMG, user_type: 'All Users' }));
  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <Text style={[s.heading, { color: C.textPrimary }]}>Latest Video</Text>
      </View>
      {list.map((v: any) => (
        <VideoCard key={v.id || v._id || v.title} item={v} />
      ))}
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
});
