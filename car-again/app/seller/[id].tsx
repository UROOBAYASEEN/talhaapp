import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  dealership_owner: 'Dealership Owner',
  individual_seller: 'Individual Seller',
  insurance_provider: 'Insurance Provider',
  bank_representative: 'Bank Representative',
  tracker_provider: 'Tracker Provider',
  customer: 'Customer',
};

export default function SellerProfileScreen() {
  const C = useAppColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [seller, setSeller] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (id) { fetchSeller(); fetchListings(); }
  }, [id]);

  async function fetchSeller() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/sellers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSeller(data);
        setFollowing(data.is_following);
      }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }

  async function fetchListings() {
    try {
      const res = await fetch(`${API_BASE}/vehicles?seller_id=${id}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.items || []);
      }
    } catch { /* offline */ }
  }

  async function toggleFollow() {
    if (!token) return;
    setFollowLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sellers/${id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.is_following);
        setSeller((prev: any) => prev ? {
          ...prev,
          follower_count: data.is_following ? prev.follower_count + 1 : prev.follower_count - 1,
        } : prev);
      }
    } catch { /* offline */ }
    finally { setFollowLoading(false); }
  }

  const border = C.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(3,12,40,0.1)';

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
        <ActivityIndicator color="#e2671b" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  function getInitials(name: string) {
    return (name || 'S').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#032a69', '#1a4a8a', C.bg]} style={styles.gradHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.profileSection}>
            <View style={[styles.avatar, { backgroundColor: '#1a4a8a', borderColor: '#e2671b' }]}>
              <Text style={styles.avatarTxt}>{getInitials(seller?.full_name || 'S')}</Text>
            </View>
            <Text style={[styles.name, { color: '#fff' }]}>{seller?.full_name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: 'rgba(226,103,27,0.2)', borderColor: '#e2671b' }]}>
              <Text style={[styles.roleText, { color: '#e2671b' }]}>{ROLE_LABELS[seller?.role] || seller?.role}</Text>
            </View>
            {seller?.is_verified && (
              <View style={styles.verifiedRow}>
                <Ionicons name="shield-checkmark" size={14} color="#4CAF50" />
                <Text style={[styles.verifiedTxt]}>Verified Seller</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#fff' }]}>{seller?.listing_count || 0}</Text>
              <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>Listings</Text>
            </View>
            <View style={[styles.statDiv, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#fff' }]}>{seller?.follower_count || 0}</Text>
              <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>Followers</Text>
            </View>
            <View style={[styles.statDiv, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#fff' }]}>
                {seller?.member_since ? new Date(seller.member_since).getFullYear() : '—'}
              </Text>
              <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>Joined</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Follow & Message buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.followBtn, following ? { backgroundColor: '#032a69', borderColor: '#032a69' } : { backgroundColor: '#e2671b', borderColor: '#e2671b' }]}
            onPress={toggleFollow}
            disabled={followLoading}
          >
            {followLoading ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Ionicons name={following ? 'checkmark' : 'person-add-outline'} size={16} color="#fff" />
                <Text style={styles.followBtnTxt}>{following ? 'Following' : 'Follow'}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.msgBtn, { borderColor: border, backgroundColor: C.glassBg }]}
            onPress={() => router.push({ pathname: '/(tabs)/chat' })}
          >
            <Ionicons name="chatbubble-outline" size={16} color={C.textPrimary} />
            <Text style={[styles.msgBtnTxt, { color: C.textPrimary }]}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Listings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>
            Active Listings ({seller?.listing_count || 0})
          </Text>
          {listings.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="car-outline" size={40} color={C.textSecondary} />
              <Text style={[styles.emptyTxt, { color: C.textSecondary }]}>No active listings</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={listings}
              keyExtractor={i => i.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.listCard, { backgroundColor: C.glassBg, borderColor: border }]}
                  onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: item.id } })}
                  activeOpacity={0.85}
                >
                  {item.images?.[0] ? (
                    <Image source={{ uri: item.images[0] }} style={styles.listImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.listImgPlaceholder, { backgroundColor: C.roleIconBg }]}>
                      <Ionicons name="car" size={28} color={C.textSecondary} />
                    </View>
                  )}
                  <View style={styles.listInfo}>
                    <Text style={[styles.listTitle, { color: C.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.listPrice, { color: '#e2671b' }]}>PKR {Number(item.price).toLocaleString()}</Text>
                    <Text style={[styles.listYear, { color: C.textSecondary }]}>{item.year} • {item.condition}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradHeader: { paddingBottom: 28, paddingHorizontal: 16, paddingTop: 12 },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start', padding: 4 },
  profileSection: { alignItems: 'center', gap: 8 },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  avatarTxt: { fontSize: 32, fontFamily: 'Poppins_700Bold', color: '#fff' },
  name: { fontSize: 22, fontFamily: 'Poppins_700Bold' },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 32, borderWidth: 1 },
  roleText: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedTxt: { fontSize: 12, color: '#4CAF50', fontFamily: 'Poppins_500Medium' },
  statsRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 20 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  statDiv: { width: 1, marginVertical: 4 },
  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16 },
  followBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 32, borderWidth: 1, gap: 6 },
  followBtnTxt: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  msgBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 32, borderWidth: 1, gap: 6 },
  msgBtnTxt: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', paddingHorizontal: 16, marginBottom: 12 },
  listCard: { width: 180, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  listImg: { width: 180, height: 120 },
  listImgPlaceholder: { width: 180, height: 120, alignItems: 'center', justifyContent: 'center' },
  listInfo: { padding: 10, gap: 2 },
  listTitle: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  listPrice: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  listYear: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTxt: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
});
