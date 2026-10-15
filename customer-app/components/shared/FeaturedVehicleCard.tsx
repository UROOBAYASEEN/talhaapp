import VerifiedIcon from '@/components/shared/VerifiedIcon';
import { API_BASE } from '@/constants/api';
import { logApi, logApiError } from '@/constants/apiLog';
import { useAppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: W } = Dimensions.get('window');
const CARD_W = W * 0.63;
const SERVER = API_BASE.replace('/api/v1', '');

// Listing ki pehli photo (relative path → full URL). Photo na ho to null — koi stock image nahi.
function vehiclePhoto(item: any): string | null {
  const first = Array.isArray(item?.images) ? item.images.find((u: any) => typeof u === 'string' && u) : null;
  if (!first) return null;
  return first.startsWith('http') ? first : `${SERVER}${first.startsWith('/') ? '' : '/'}${first}`;
}

const cap = (v?: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : '');

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

export default function FeaturedVehicleCard({ item, onPress, category = 'car' }: Props) {
  const { token } = useAuth() as any;
  const [liked, setLiked] = useState<boolean>(!!item?.is_saved);
  const [saving, setSaving] = useState(false);
  const C = useAppColors();
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = photoFailed ? null : vehiclePhoto(item);
  const meta = [item.city, item.year ? String(item.year) : '', cap(item.transmission)].filter(Boolean).join(' • ');

  // Favourite — server pe save/unsave (/vehicles/{id}/save toggle)
  async function toggleSave() {
    if (!token) { Alert.alert('Login Required', 'Please log in to save vehicles.'); return; }
    if (saving) return;
    setSaving(true);
    const prev = liked;
    setLiked(!prev);
    const url = `${API_BASE}/vehicles/${item.id}/save`;
    const t0 = Date.now();
    try {
      const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json().catch(() => null);
      logApi('Featured card › Save', 'POST', url, res, d, t0);
      if (!res.ok) throw new Error(String(res.status));
      if (typeof d?.saved === 'boolean') setLiked(d.saved);
    } catch (e) {
      logApiError('Featured card › Save', 'POST', url, e, t0);
      setLiked(prev);
      Alert.alert('Error', 'Could not update favourites. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: C.isDark ? '#010b1e' : '#ffffff', borderColor: C.isDark ? '#8aa6d6' : 'rgba(3,12,40,0.08)' }, !C.isDark && styles.cardLight]}>
      {/* Vehicle Image */}
      {photo ? (
        <Image source={{ uri: photo }} style={styles.carImage} resizeMode="cover" onError={(e) => { if (__DEV__) console.warn(`[API] Featured card › Image failed: ${photo} — ${e?.nativeEvent?.error ?? 'load error'}`); setPhotoFailed(true); }} />
      ) : (
        <View style={[styles.carImage, styles.carImageEmpty, !C.isDark && { backgroundColor: '#EEF1F6' }]}>
          <Ionicons name={category === 'bike' ? 'bicycle-outline' : 'car-outline'} size={44} color={C.isDark ? '#5d7bb0' : '#94a3b8'} />
        </View>
      )}

      {/* Bottom Content */}
      <View style={styles.content}>
        {C.isDark && <LinearGradient colors={['#07142d', '#010b1e', '#071a3a']} locations={[0, 0.53, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
        {C.isDark && <LinearGradient colors={['rgba(35,81,157,0.18)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(35,81,157,0.18)']} locations={[0, 0.08, 0.92, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />}
        {/* Name + Price */}
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text style={[styles.carName, { color: C.textPrimary }]} numberOfLines={2}>{item.title}</Text>
            <VerifiedIcon size={15} style={styles.verified} />
          </View>
          <Text style={styles.price}>PKR {displayPrice(item.price)}</Text>
        </View>

        {/* Variant */}
        <Text style={[styles.variant, { color: C.textSecondary }]} numberOfLines={1}>
          {item.variant || item.color || cap(item.fuel_type) || '—'}
        </Text>

        {/* Location / Year / Transmission */}
        {!!meta && (
          <View style={styles.infoRow}>
            <Ionicons name={item.city ? 'location-outline' : 'calendar-outline'} size={16} color={C.textSecondary} />
            <Text style={[styles.infoText, { color: C.textSecondary }]} numberOfLines={1}>{meta}</Text>
          </View>
        )}

        {/* View + Heart */}
        <View style={styles.bottomRow}>
          <TouchableOpacity activeOpacity={0.85} style={styles.viewButton} onPress={onPress}>
            <LinearGradient
              colors={C.isDark ? ['#032a69', '#e2671b'] : ['#27467F', '#FF9654']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.viewGrad}
            >
              <Text style={styles.viewText}>View</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.heartButton, { backgroundColor: C.isDark ? '#061b40' : 'transparent' }]}
            onPress={toggleSave}
            disabled={saving}
            accessibilityLabel={liked ? 'Remove from favourites' : 'Save to favourites'}
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

  // Light mode (Figma): white card with soft drop shadow
  cardLight: {
    marginBottom: 10,
    boxShadow: '2px 4px 5px rgba(0,0,0,0.24)',
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
    alignItems: 'flex-start',
    gap: 8,
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  carName: {
    color: '#f9fafc',
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    flexShrink: 1,
  },
  verified: {
    marginTop: 3,
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
