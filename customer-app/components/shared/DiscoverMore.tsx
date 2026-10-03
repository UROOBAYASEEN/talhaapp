import { useAppColors } from '@/constants/theme';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const VIDEOS = [
  { id: '1', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800', duration: '0:11' },
  { id: '2', image: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800', duration: '1:30' },
  { id: '3', image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800', duration: '0:08' },
  { id: '4', image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800', duration: '0:17' },
];

export default function DiscoverMore() {
  const C = useAppColors();
  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: C.textPrimary }]}>Discover More</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {VIDEOS.map((video) => (
          <TouchableOpacity key={video.id} activeOpacity={0.85} style={[styles.card, { backgroundColor: C.isDark ? '#061b4a' : '#ffffff', borderWidth: C.isDark ? 0 : 1, borderColor: C.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowColor: C.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: C.isDark ? 0 : 0.08, shadowRadius: 10, elevation: C.isDark ? 0 : 3 }]}>
            <Image source={{ uri: video.image }} style={styles.image} resizeMode="cover" />
            {!C.isDark && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 50, backgroundColor: 'rgba(255,255,255,0.02)' }} pointerEvents="none" />}
            <View style={styles.bottomOverlay} />
            <View style={styles.durationContainer}>
              <Text style={styles.playIcon}>▶</Text>
              <Text style={styles.duration}>{video.duration}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
});
