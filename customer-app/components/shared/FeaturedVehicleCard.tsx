import { useAppColors } from '@/constants/theme';
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

const { width: W } = Dimensions.get('window');
const CARD_W = W * 0.63;
const FALLBACK_CARS = [require('@/screenshot/featureCar1.png'), require('@/screenshot/featureCar2.png')];
const BIKE_IMAGES = [require('@/assets/images/bike1.png'), require('@/assets/images/bike2.png')];

function displayPrice(value: unknown) {
  const price = Number(String(value ?? '').replace(/,/g, ''));
  if (!Number.isFinite(price) || price <= 0) return '—';
  if (price >= 10_000_000) return `${Number((price / 10_000_000).toFixed(2))} Crore`;
  if (price >= 100_000) return `${Number((price / 100_000).toFixed(2))} Lac`;
  return price.toLocaleString();
}

interface Props {
  item: any;
  onPress: () => void;
  fallbackIndex?: number;
  category?: 'car' | 'bike';
}

export default function FeaturedVehicleCard({ item, onPress, fallbackIndex = 0, category = 'car' }: Props) {
  const [liked, setLiked] = useState(false);
  const C = useAppColors();
  const cardImage = (category === 'bike' ? BIKE_IMAGES : FALLBACK_CARS)[fallbackIndex % 2];

  return (
    <View style={[styles.card, { backgroundColor: C.isDark ? '#010b1e' : C.glassBg, borderColor: C.isDark ? '#8aa6d6' : 'rgba(3,12,40,0.12)' }]}>
      {/* Vehicle Image */}
      <Image source={cardImage} style={styles.carImage} resizeMode="cover" />

      {/* Bottom Content */}
      <View style={styles.content}>
        {C.isDark && <LinearGradient colors={['#07142d', '#010b1e', '#071a3a']} locations={[0, 0.53, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
        {C.isDark && <LinearGradient colors={['rgba(35,81,157,0.18)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(35,81,157,0.18)']} locations={[0, 0.08, 0.92, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
        {/* Name + Price */}
        <View style={styles.topRow}>
          <Text style={[styles.carName, { color: C.textPrimary }]} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.price}>PKR {displayPrice(item.price)}</Text>
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
            style={[styles.heartButton, { backgroundColor: C.isDark ? '#061b40' : 'rgba(255,255,255,0.9)' }]}
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
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)',
    alignSelf: 'center',
  },

  carImage: {
    width: '100%',
    height: CARD_W * 0.665,
  },
  carImageEmpty: {
    backgroundColor: '#061b4a',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 14,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  carName: {
    color: '#f9fafc',
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  price: {
    color: '#e2671b',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },

  variant: {
    color: '#baacb6',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 7,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 7,
  },
  infoText: {
    color: '#baacb6',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
  },
  viewButton: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
  },
  viewGrad: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },

  heartButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(3,12,40,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // light overrides are applied inline via C
});
