import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppColors } from '@/constants/theme';

const { width: W } = Dimensions.get('window');
const CARD_W = W * 0.72;

interface Props {
  item: any;
  onPress: () => void;
}

export default function FeaturedVehicleCard({ item, onPress }: Props) {
  const [liked, setLiked] = useState(false);
  const C = useAppColors();

  return (
    <View style={[styles.card, { backgroundColor: C.glassBg, borderColor: C.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,12,40,0.12)' }]}>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      {/* Vehicle Image */}
      {item.images?.[0] ? (
        <Image source={{ uri: item.images[0] }} style={styles.carImage} resizeMode="cover" />
      ) : (
        <View style={[styles.carImage, styles.carImageEmpty, { backgroundColor: C.isDark ? '#061b4a' : '#e8eeff' }]}>
          <Ionicons name="car-outline" size={60} color={C.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(3,12,40,0.2)'} />
        </View>
      )}

      {/* Bottom Content */}
      <View style={styles.content}>
        {/* Name + Price */}
        <View style={styles.topRow}>
          <Text style={[styles.carName, { color: C.textPrimary }]} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.price}>PKR {Number(item.price).toLocaleString()}</Text>
        </View>

        {/* Variant */}
        <Text style={[styles.variant, { color: C.textSecondary }]} numberOfLines={1}>
          {item.variant || item.color || item.fuel_type || '—'}
        </Text>

        {/* Location / Year / Transmission */}
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={C.textSecondary} />
          <Text style={[styles.infoText, { color: C.textSecondary }]}>
            {item.city || 'Pakistan'} • {item.year} • {item.transmission || 'CVT'}
          </Text>
        </View>

        {/* View + Heart */}
        <View style={styles.bottomRow}>
          <TouchableOpacity activeOpacity={0.85} style={styles.viewButton} onPress={onPress}>
            <LinearGradient
              colors={['#032a69', '#e2671b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.viewGrad}
            >
              <Text style={styles.viewText}>View</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.heartButton, { backgroundColor: C.isDark ? 'rgba(3,12,40,0.8)' : 'rgba(255,255,255,0.9)', borderColor: C.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,12,40,0.12)' }]}
            onPress={() => setLiked(!liked)}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={22}
              color="#e2671b"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)',
    alignSelf: 'center',
  },

  carImage: {
    width: '100%',
    height: 140,
  },
  carImageEmpty: {
    backgroundColor: '#061b4a',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  carName: {
    color: '#f9fafc',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  price: {
    color: '#e2671b',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },

  variant: {
    color: '#baacb6',
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  infoText: {
    color: '#baacb6',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  viewButton: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
  },
  viewGrad: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  heartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(3,12,40,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.4)',
  },
  // light overrides are applied inline via C
});
