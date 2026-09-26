import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList,
  Image, ScrollView, StyleSheet, Text, Linking,
  TouchableOpacity, View, SafeAreaView, StatusBar,
} from 'react-native';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

const { width: W } = Dimensions.get('window');
const ORANGE  = '#e2671b';
const NAVY    = 'rgba(1,10,31,1)';
const NAVY2   = '#032a69';
const WHITE   = '#f9fafc';
const MUTED   = '#baacb6';
const UNSEL   = '#9fa8ba';
const BORDER  = '#17243d';
const DARK_BG = '#071329';

function formatPrice(p: number) {
  if (p >= 10000000) return `PKR ${(p / 10000000).toFixed(1)} Crore`;
  if (p >= 100000)   return `PKR ${(p / 100000).toFixed(1)} Lacs`;
  return `PKR ${p.toLocaleString()}`;
}

export default function VehicleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const aC = useAppColors();

  const [vehicle,      setVehicle]      = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [imgIdx,       setImgIdx]       = useState(0);
  const [saved,        setSaved]        = useState(false);
  const [contacting,   setContacting]   = useState(false);
  const [expanded,     setExpanded]     = useState<Record<string, boolean>>({});
  const [avatarError,  setAvatarError]  = useState(false);
  const [sellerAvatar, setSellerAvatar] = useState<string | null>(null);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    try {
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/vehicles/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setVehicle(data);
        setSaved(data.is_saved ?? false);
        if (data.seller_id && token) {
          fetchSellerAvatar(data.seller_id);
        }
      }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }

  async function handlePublish() {
    if (!token) return;
    Alert.alert('Publish Vehicle', 'Are you sure you want to publish this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Publish', onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/vehicles/${id}/status`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'active' }),
            });
            if (res.ok) {
              const updated = await res.json();
              setVehicle((prev: any) => ({ ...prev, status: updated.status }));
              Alert.alert('Published!', 'Your vehicle is now live and visible to buyers.');
            } else {
              Alert.alert('Error', 'Could not publish vehicle.');
            }
          } catch {
            Alert.alert('Error', 'Network error. Please try again.');
          }
        },
      },
    ]);
  }

  async function fetchSellerAvatar(sellerId: string) {
    try {
      const res = await fetch(`${API_BASE}/sellers/${sellerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        if (d.avatar_url) {
          const BASE = API_BASE.replace('/api/v1', '');
          setSellerAvatar(d.avatar_url.startsWith('http') ? d.avatar_url : `${BASE}${d.avatar_url}`);
        }
      }
    } catch { /* offline */ }
  }

  async function toggleSave() {
    if (!token) { Alert.alert('Login Required', 'Please login to save vehicles.'); return; }
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}/save`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setSaved(d.saved); }
    } catch { /* offline */ }
  }

  async function handleSaveAndFavorite() {
    if (!token) { Alert.alert('Login Required', 'Please login to save vehicles.'); return; }
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}/save`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setSaved(d.saved);
        if (d.saved) {
          router.push('/profile/saved' as any);
        }
      }
    } catch { /* offline */ }
  }

  async function handleContact() {
    if (!token) { Alert.alert('Login Required', 'Please login to contact seller.'); return; }
    if (!vehicle?.seller_id) { Alert.alert('Error', 'Seller info not available.'); return; }
    if (user?.id === vehicle.seller_id) { Alert.alert('Info', 'This is your own listing.'); return; }
    setContacting(true);
    try {
      const res = await fetch(`${API_BASE}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to_user_id: vehicle.seller_id,
          content: `Hi! I'm interested in your ${vehicle.title}`,
          vehicle_id: id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.conversation_id) {
        router.push({
          pathname: '/chat-room/[id]',
          params: {
            id: data.conversation_id,
            name: vehicle.seller?.full_name || 'Seller',
            vehicleTitle: vehicle.title,
            vehiclePrice: `PKR ${Number(vehicle.price).toLocaleString()}`,
            vehicleCity: vehicle.city,
            vehicleYear: String(vehicle.year),
            vehicleId: String(id),
          },
        });
      } else {
        Alert.alert('Error', data.detail || 'Could not open chat. Try again.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Check your connection.');
    }
    finally { setContacting(false); }
  }

  function toggleSection(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleCall() {
    const phone = vehicle.contact_phone || vehicle.seller?.phone;
    if (!phone) { Alert.alert('Not Available', 'No phone number listed.'); return; }
    Linking.openURL(`tel:${phone}`);
  }

  function handleSMS() {
    const phone = vehicle.contact_phone || vehicle.seller?.phone;
    if (!phone) { Alert.alert('Not Available', 'No phone number listed.'); return; }
    Linking.openURL(`sms:${phone}`);
  }

  function handleWhatsApp() {
    const wa = vehicle.contact_whatsapp || vehicle.contact_phone || vehicle.seller?.phone;
    if (!wa) { Alert.alert('Not Available', 'No WhatsApp number listed.'); return; }
    const num = wa.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${num}?text=Hi! I'm interested in your ${vehicle.title}`);
  }

  async function handleReport() {
    if (!token) { Alert.alert('Login Required', 'Please login to report this ad.'); return; }
    Alert.alert('Report Ad', 'Select reason:', [
      { text: 'Spam', onPress: () => submitReport('Spam') },
      { text: 'Fraud', onPress: () => submitReport('Fraud') },
      { text: 'Wrong Info', onPress: () => submitReport('Wrong Information') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function submitReport(reason: string) {
    try {
      await fetch(`${API_BASE}/vehicles/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      Alert.alert('Reported', 'Thank you for your report.');
    } catch { /* offline */ }
  }

  if (loading) {
    return (
      <View style={[styles.safe, { backgroundColor: aC.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={ORANGE} size="large" />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Ionicons name="alert-circle-outline" size={48} color={aC.isDark ? MUTED : '#94a3b8'} />
          <Text style={{ color: aC.isDark ? WHITE : '#010a1f', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }}>Vehicle not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: ORANGE, fontFamily: 'Poppins_500Medium' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const images   = vehicle.images?.length > 0 ? vehicle.images : null;
  const initials = vehicle.seller?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'S';

  const safetyKw   = ['abs','airbag','brake','belt','stability','traction','parking sensor'];
  const interiorKw = ['sunroof','leather','screen','display','ambient','speakers','audio'];
  const safetyF    = (vehicle.features || []).filter((f: string) => safetyKw.some(k => f.toLowerCase().includes(k)));
  const interiorF  = (vehicle.features || []).filter((f: string) => interiorKw.some(k => f.toLowerCase().includes(k)));
  const comfortF   = (vehicle.features || []).filter((f: string) => !safetyKw.some(k => f.toLowerCase().includes(k)) && !interiorKw.some(k => f.toLowerCase().includes(k)));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, backgroundColor: aC.bg }}>

        {/* ── Car Image ── */}
        <View style={styles.imgWrap}>
          {images ? (
            <FlatList
              ref={flatRef} horizontal pagingEnabled
              data={images} keyExtractor={(_, i) => String(i)}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
              renderItem={({ item }) => <Image source={{ uri: item }} style={styles.carImg} resizeMode="cover" />}
            />
          ) : (
            <View style={[styles.carImg, { backgroundColor: '#dfe2e5', alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="car" size={72} color={MUTED} />
            </View>
          )}

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoW}>Auto</Text>
            <Text style={styles.logoO}>wizor</Text>
          </View>

          {/* Back */}
          <TouchableOpacity style={[styles.arrowLeft, { backgroundColor: aC.isDark ? '#19396d' : '#ffffff', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.12, elevation: aC.isDark ? 0 : 3, borderWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)' }]} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={aC.isDark ? WHITE : '#010a1f'} />
          </TouchableOpacity>

          {/* Right arrow */}
          {images && images.length > 1 && (
            <TouchableOpacity style={[styles.arrowRight, { backgroundColor: aC.isDark ? '#19396d' : '#ffffff', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.12, elevation: aC.isDark ? 0 : 3, borderWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)' }]} onPress={() => {
              const next = Math.min(imgIdx + 1, images.length - 1);
              flatRef.current?.scrollToIndex({ index: next });
              setImgIdx(next);
            }}>
              <Ionicons name="chevron-forward" size={20} color={aC.isDark ? WHITE : '#010a1f'} />
            </TouchableOpacity>
          )}

          {/* Dots */}
          {images && images.length > 1 && (
            <View style={styles.dotRow}>
              {images.map((_: any, i: number) => (
                <View key={i} style={[styles.dot, { backgroundColor: aC.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(3,42,105,0.18)' }, i === imgIdx && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* ── Main Info ── */}
        <View style={[styles.mainInfo, { backgroundColor: aC.bg }]}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.vehicleName, { color: aC.textPrimary }]}>{vehicle.title}</Text>
              <Text style={styles.price}>{formatPrice(vehicle.price)}</Text>
            </View>
            <View style={styles.actionIcons}>
              <TouchableOpacity>
                <Ionicons name="share-social-outline" size={20} color={ORANGE} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveAndFavorite}>
                <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? '#ff4d6d' : ORANGE} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={ORANGE} />
            <Text style={[styles.ratingTxt, { color: aC.isDark ? MUTED : '#475569' }]}>
              {vehicle.average_rating > 0
                ? `${vehicle.average_rating} (${vehicle.review_count} Reviews)`
                : '4.9 (250+ Reviews)'}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={15} color={aC.isDark ? UNSEL : '#94a3b8'} />
            <Text style={[styles.locationTxt, { color: aC.isDark ? UNSEL : '#64748b' }]}>{vehicle.city || 'Pakistan'}</Text>
          </View>

          {/* Quick Specs */}
          <View style={[styles.specsRow, { borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]}>
            {[
              { icon: 'calendar-outline',    val: String(vehicle.year) },
              { icon: 'speedometer-outline', val: vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()}km` : '—' },
              { icon: 'water-outline',       val: vehicle.fuel_type || 'Petrol' },
              { icon: 'git-branch-outline',  val: vehicle.transmission || 'Manual' },
            ].map((s, i) => (
              <View key={i} style={styles.specItem}>
                <Ionicons name={s.icon as any} size={20} color={ORANGE} />
                <Text style={[styles.specTxt, { color: aC.isDark ? WHITE : '#010a1f' }]}>{s.val}</Text>
              </View>
            ))}
          </View>

          {/* Detail rows */}
          {[
            { label: 'Registered in',  value: vehicle.registered_city || vehicle.city || '—' },
            { label: 'Color',          value: vehicle.color || '—' },
            { label: 'Assembly',       value: vehicle.assembly || 'Local' },
            { label: 'Engine Capacity',value: vehicle.engine_cc ? `${vehicle.engine_cc} CC` : '—' },
            { label: 'Body Type',      value: vehicle.body_type || '—' },
          ].map((r, i) => (
            <View key={i} style={[styles.detailRow, { borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]}>
              <Text style={[styles.detailLabel, { color: aC.isDark ? MUTED : '#475569' }]}>{r.label}</Text>
              <Text style={[styles.detailValue, { color: aC.isDark ? WHITE : '#010a1f' }]}>{r.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Features ── */}
        <View style={[styles.section, { backgroundColor: aC.isDark ? DARK_BG : '#ffffff', borderTopWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.05, elevation: aC.isDark ? 0 : 1 }]}>
          {comfortF.length > 0 && comfortF.map((f: string, i: number) => (
            <View key={i} style={styles.featureSimpleRow}>
              <View style={[styles.featureIconBox, { backgroundColor: aC.isDark ? NAVY2 : '#eef2ff' }]}>
                <Ionicons name="business-outline" size={14} color={aC.isDark ? WHITE : '#032a69'} />
              </View>
              <Text style={[styles.featureTxt, { color: aC.isDark ? WHITE : '#010a1f' }]}>{f}</Text>
            </View>
          ))}
          {comfortF.length === 0 && (
            <View style={styles.featureSimpleRow}>
              <View style={[styles.featureIconBox, { backgroundColor: aC.isDark ? NAVY2 : '#eef2ff' }]}>
                <Ionicons name="business-outline" size={14} color={aC.isDark ? WHITE : '#032a69'} />
              </View>
              <Text style={[styles.featureTxt, { color: aC.isDark ? WHITE : '#010a1f' }]}>Alloy Wheels</Text>
            </View>
          )}

          {[
            { key: 'interior',  label: 'Interior',              features: interiorF },
            { key: 'comfort',   label: 'Comfort & Convenience', features: comfortF },
            { key: 'safety',    label: 'Safety Features',       features: safetyF },
          ].map(sec => (
            <View key={sec.key}>
              <TouchableOpacity style={[styles.expandRow, { borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.08)' }]} onPress={() => toggleSection(sec.key)}>
                <Text style={[styles.expandTxt, { color: aC.isDark ? WHITE : '#010a1f' }]}>{sec.label}</Text>
                <Ionicons name={expanded[sec.key] ? 'chevron-up' : 'chevron-down'} size={18} color={ORANGE} />
              </TouchableOpacity>
              {expanded[sec.key] && sec.features.map((f: string, i: number) => (
                <View key={i} style={styles.featureChip}>
                  <Ionicons name="checkmark-circle" size={14} color="#34c759" />
                  <Text style={[styles.featureChipTxt, { color: aC.isDark ? MUTED : '#475569' }]}>{f}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* ── Seller Detail ── */}
        <View style={[styles.sellerSection, { backgroundColor: aC.isDark ? DARK_BG : '#ffffff', borderTopWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.05, elevation: aC.isDark ? 0 : 1 }]}>
          <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Seller Detail</Text>
          <View style={styles.sellerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sellerName, { color: aC.isDark ? WHITE : '#010a1f' }]}>{vehicle.seller?.full_name || 'Seller'}</Text>
              <Text style={[styles.memberTxt, { color: aC.isDark ? MUTED : '#475569' }]}>
                {vehicle.seller?.created_at
                  ? `Member Since ${new Date(vehicle.seller.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : 'Member Since 2020'}
              </Text>
              <View style={styles.socialRow}>
                <TouchableOpacity onPress={handleCall}>
                  <Ionicons name="phone-portrait-outline" size={22} color={ORANGE} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  const email = vehicle.seller?.email;
                  if (!email) { Alert.alert('Not Available', 'No email address listed.'); return; }
                  Linking.openURL(`mailto:${email}`);
                }}>
                  <Ionicons name="mail-outline" size={22} color={ORANGE} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.profileWrap}>
              <View style={[styles.profileAvatar, { backgroundColor: aC.isDark ? NAVY2 : '#eef2ff' }]}>
                {sellerAvatar && !avatarError
                  ? <Image
                      source={{ uri: sellerAvatar }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                      onError={() => setAvatarError(true)}
                    />
                  : <Ionicons name="person" size={38} color={aC.isDark ? WHITE : '#032a69'} />
                }
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color={WHITE} />
              </View>
            </View>
          </View>

          {vehicle.seller?.role === 'dealership_owner' && vehicle.seller_id && (
            <TouchableOpacity
              style={[styles.viewDealerBtn, { borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff', overflow: 'hidden' }]}
              onPress={() => router.push({ pathname: '/dealer/[id]', params: { id: vehicle.seller_id } })}
              activeOpacity={0.85}
            >
              {aC.isDark ? (
                <>
                  <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              ) : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              )}
              <Ionicons name="storefront-outline" size={16} color={ORANGE} />
              <Text style={styles.viewDealerTxt}>View Dealer Profile</Text>
              <Ionicons name="chevron-forward" size={16} color={ORANGE} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Recommendation ── */}
        <View style={[styles.recSection, { backgroundColor: aC.isDark ? DARK_BG : '#ffffff', borderTopWidth: aC.isDark ? 0 : 1, borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
          <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Recommendation</Text>
          {[
            { icon: 'business-outline',         text: 'Apply for Vehicle Financing' },
            { icon: 'shield-checkmark-outline',  text: 'Find the Right Insurance Plan' },
            { icon: 'location-outline',          text: 'Get an Installation Tracker for\nYour Vehicle' },
          ].map((r, i) => (
            <TouchableOpacity key={i} activeOpacity={0.85} style={aC.isDark ? {} : { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(3,42,105,0.12)', backgroundColor: '#ffffff', shadowColor: 'rgba(3,42,105,0.06)', shadowOpacity: 0.05, elevation: 1, marginBottom: 10 }}>
              {aC.isDark ? (
                <LinearGradient
                  colors={['#09275c', '#071c43', '#08295d']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.recBtn}
                >
                  <View style={styles.recIconWrap}>
                    <Ionicons name={r.icon as any} size={20} color={ORANGE} />
                  </View>
                  <Text style={styles.recTxt}>{r.text}</Text>
                  <Ionicons name="chevron-forward" size={20} color={ORANGE} />
                </LinearGradient>
              ) : (
                <View style={[styles.recBtn, { backgroundColor: '#ffffff' }]}>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <View style={[styles.recIconWrap, { backgroundColor: '#eef2ff' }]}>
                    <Ionicons name={r.icon as any} size={20} color={ORANGE} />
                  </View>
                  <Text style={[styles.recTxt, { color: '#010a1f' }]}>{r.text}</Text>
                  <Ionicons name="chevron-forward" size={20} color={ORANGE} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Report ── */}
        <TouchableOpacity style={styles.reportBtn} onPress={handleReport}>
          <Ionicons name="flag-outline" size={14} color={aC.isDark ? MUTED : '#64748b'} />
          <Text style={[styles.reportTxt, { color: aC.isDark ? MUTED : '#475569' }]}>Report to this ad</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Publish Button ── */}
      {vehicle?.seller_id === user?.id && vehicle?.status === 'pending' && (
        <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} activeOpacity={0.85}>
          <LinearGradient colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
          <Text style={styles.publishTxt}>Publish Vehicle</Text>
        </TouchableOpacity>
      )}

      {/* ── Fixed Bottom Call Seller ── */}
      <View style={[styles.callBox, { backgroundColor: aC.isDark ? DARK_BG : '#ffffff', borderColor: aC.isDark ? BORDER : 'rgba(3,42,105,0.12)' }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={handleCall}>
          <LinearGradient
            colors={['#0d2f7a', '#7a3f5a', '#e25500']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.callBtn}
          >
            <Text style={styles.callTxt}>Call Seller</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactItem} onPress={handleSMS}>
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={ORANGE} />
            <Text style={[styles.contactTxt, { color: aC.isDark ? MUTED : '#475569' }]}>SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactItem} onPress={handleContact} disabled={contacting}>
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={ORANGE} />
            <Text style={[styles.contactTxt, { color: aC.isDark ? MUTED : '#475569' }]}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactItem} onPress={handleWhatsApp}>
            <View style={styles.waCircle}>
              <Ionicons name="logo-whatsapp" size={16} color={WHITE} />
            </View>
            <Text style={[styles.contactTxt, { color: aC.isDark ? MUTED : '#475569' }]}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },

  imgWrap:  { position: 'relative' },
  carImg:   { width: W, height: 280 },
  logoWrap: { position: 'absolute', top: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  logoW:    { color: WHITE,  fontSize: 18, fontFamily: 'Poppins_700Bold' },
  logoO:    { color: ORANGE, fontSize: 18, fontFamily: 'Poppins_700Bold' },
  arrowLeft: {
    position: 'absolute', left: 10, top: '42%',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#19396d', alignItems: 'center', justifyContent: 'center',
  },
  arrowRight: {
    position: 'absolute', right: 10, top: '42%',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#19396d', alignItems: 'center', justifyContent: 'center',
  },
  dotRow:    { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: ORANGE, width: 14 },

  mainInfo: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  vehicleName: { color: WHITE, fontSize: 18, fontFamily: 'Poppins_700Bold', flex: 1, marginRight: 8 },
  price:       { color: ORANGE, fontSize: 16, fontFamily: 'Poppins_700Bold', marginTop: 4 },
  actionIcons: { flexDirection: 'row', gap: 14, paddingTop: 4 },

  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  ratingTxt:   { color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  locationTxt: { color: UNSEL, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  specsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER },
  specItem: { alignItems: 'center', gap: 4, flex: 1 },
  specTxt:  { color: WHITE, fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center' },

  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: BORDER },
  detailLabel: { color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  detailValue: { color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium' },

  section: { backgroundColor: DARK_BG, paddingHorizontal: 20, paddingVertical: 16, marginTop: 8 },

  featureSimpleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  featureIconBox:   { width: 28, height: 28, borderRadius: 14, backgroundColor: NAVY2, alignItems: 'center', justifyContent: 'center' },
  featureTxt:       { color: WHITE, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  expandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderColor: BORDER },
  expandTxt: { color: WHITE, fontSize: 14, fontFamily: 'Poppins_500Medium' },

  featureChip:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingLeft: 8 },
  featureChipTxt: { color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  sellerSection: { backgroundColor: DARK_BG, paddingHorizontal: 20, paddingVertical: 16, marginTop: 8 },
  sectionTitle:  { color: WHITE, fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 14 },
  sellerRow:     { flexDirection: 'row', alignItems: 'center' },
  sellerName:    { color: WHITE, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  memberTxt:     { color: MUTED, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  socialRow:     { flexDirection: 'row', gap: 14, marginTop: 10 },

  profileWrap:   { position: 'relative', width: 64, height: 64 },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: NAVY2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: '#2f7dff', alignItems: 'center', justifyContent: 'center' },

  viewDealerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, overflow: 'hidden' },
  viewDealerTxt: { flex: 1, color: ORANGE, fontSize: 14, fontFamily: 'Poppins_500Medium' },

  recSection: { backgroundColor: DARK_BG, paddingHorizontal: 20, paddingVertical: 16, marginTop: 8 },
  recBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10 },
  recIconWrap:{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  recTxt:     { flex: 1, color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium' },

  reportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 16 },
  reportTxt: { color: MUTED, fontSize: 13, fontFamily: 'Poppins_400Regular' },

  publishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, marginHorizontal: 20, marginBottom: 8, borderRadius: 26, overflow: 'hidden' },
  publishTxt: { color: WHITE, fontSize: 15, fontFamily: 'Poppins_700Bold' },

  callBox:    { backgroundColor: DARK_BG, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1, borderColor: BORDER },
  callBtn:    { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  callTxt:    { color: WHITE, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  contactRow: { flexDirection: 'row', justifyContent: 'space-around' },
  contactItem:{ alignItems: 'center', gap: 4 },
  contactTxt: { color: MUTED, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  waCircle:   { width: 28, height: 28, borderRadius: 14, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
});
