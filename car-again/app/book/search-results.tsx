// Figma: Cars In Karachi — search results
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { G, Glass, GlassButton, GlowBackground, GradientButton, ScreenHeader } from '@/components/shared/GlowUI';
import { authHeaders, fmtLac, imgUrl, sellerName } from '@/components/book/common';
import { SavedCardEffect, savedCardOuter } from '@/components/shared/FigmaEffects';

type P = { category?: string; make?: string; car?: string; transmission?: string; color?: string; year?: string; sellerType?: string; city?: string; sellerId?: string };

function ResultCard({ item, saved, onSave, onView, onContact }: { item: any; saved: boolean; onSave: () => void; onView: () => void; onContact: () => void }) {
  const img = imgUrl(item.images?.[0]);
  const isDealer = item.seller?.role === 'dealership_owner';
  const meta = [item.city, item.year, item.transmission].filter(Boolean);
  return (
    <View style={[savedCardOuter, c.card]}>
      <SavedCardEffect />
      <View style={c.top}>
        {img
          ? <Image source={{ uri: img }} style={c.img} resizeMode="cover" />
          : <View style={[c.img, c.imgPh]}><Ionicons name="car-outline" size={36} color={G.muted} /></View>}
        <View style={{ flex: 1 }}>
          <Text style={c.title} numberOfLines={1}>{item.title}</Text>
          <Text style={c.color} numberOfLines={1}>{item.color || '—'}</Text>
          <View style={c.dealerRow}>
            <Text style={c.dealer} numberOfLines={1}>{sellerName(item)}</Text>
            {isDealer && <MaterialIcons name="verified" size={17} color="#3B8BF6" />}
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={onSave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={G.orange} />
            </TouchableOpacity>
          </View>
          <Text style={c.meta} numberOfLines={1}>{meta.length ? meta.join(' • ') : '—'}</Text>
          <View style={c.priceRow}>
            <View style={c.avail}><Text style={c.availTxt}>{item.status === 'sold' ? 'Sold' : 'Available'}</Text></View>
            <Text style={c.price} numberOfLines={1}>{fmtLac(item.price)}</Text>
          </View>
        </View>
      </View>
      <View style={c.btnRow}>
        <GradientButton title="View Details" height={34} fontSize={14} style={{ flex: 1 }} onPress={onView} />
        <GlassButton title="Contact Dealer" height={34} fontSize={14} color={G.white} style={{ flex: 1 }} onPress={onContact} />
      </View>
    </View>
  );
}

export default function BookSearchResults() {
  const router = useRouter();
  const { token, user } = useAuth() as any;
  const p = useLocalSearchParams<P>();
  const isBike = p.category === 'bike';

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const category = p.category === 'bike' ? 'bike' : 'car';
      const text = [p.car, search].filter(Boolean).join(' ').trim();
      const base = { limit: '50', category, ...(p.sellerId ? { seller_id: p.sellerId } : {}) };
      // Strict first, then relax the filters step by step so the user always sees
      // vehicles of the searched type (cars → cars, bikes → bikes).
      const attempts: Record<string, string>[] = [
        { ...base, ...(p.make ? { make: p.make } : {}), ...(text ? { search: text } : {}),
          ...(p.transmission ? { transmission: p.transmission } : {}), ...(p.color ? { color: p.color } : {}),
          ...(p.year ? { year: p.year } : {}), ...(p.sellerType ? { seller_type: p.sellerType } : {}) },
        { ...base, ...(p.make ? { make: p.make } : {}), ...(text ? { search: text } : {}) },
        { ...base, ...(p.make ? { make: p.make } : {}) },
        { ...base, limit: '3' },
      ];
      const h = authHeaders(token);
      let found: any[] = [];
      let count = 0;
      const seen = new Set<string>();
      for (const params of attempts) {
        const key = new URLSearchParams(params).toString();
        if (seen.has(key)) continue;
        seen.add(key);
        const res = await fetch(`${API_BASE}/vehicles?${key}`, { headers: h });
        if (!res.ok) continue;
        const d = await res.json();
        const list = (d.items || []).filter((v: any) => !v.category || v.category === category);
        if (list.length) { found = list; count = params.limit === '3' ? list.length : (d.total ?? list.length); break; }
      }
      setItems(found);
      setTotal(count);
    } catch { }
    finally { setLoading(false); }
  }, [p.category, p.make, p.car, p.transmission, p.color, p.year, p.sellerType, p.sellerId, search, token]);

  useEffect(() => { const t = setTimeout(load, search ? 350 : 0); return () => clearTimeout(t); }, [load]);

  async function toggleSave(id: string) {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}/save`, { method: 'POST', headers: authHeaders(token) });
      if (res.ok) {
        const d = await res.json();
        setSavedIds(prev => { const n = new Set(prev); if (d.saved) n.add(id); else n.delete(id); return n; });
      }
    } catch { }
  }

  const city = p.city || user?.city || items[0]?.city || 'Pakistan';

  return (
    <GlowBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader logo />
        <FlatList
          data={loading ? [] : items}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 18 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ marginBottom: 2 }}>
              <Text style={s.heading}>{isBike ? 'Bikes' : 'Cars'} In {city}</Text>
              <Text style={s.count}>{loading ? 'Searching…' : `${total} Results Found`}</Text>
              <View style={s.search}>
                <Glass radius={26} blur={16} />
                <Ionicons name="search-outline" size={22} color="#C9C6D0" style={{ marginLeft: 20 }} />
                <TextInput
                  style={s.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder={`Search ${isBike ? 'bikes' : 'cars'}, banks & dealers...`}
                  placeholderTextColor="#9C96A2"
                  returnKeyType="search"
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            loading
              ? <ActivityIndicator color={G.orange} style={{ marginTop: 40 }} />
              : <View style={s.empty}>
                  <Ionicons name={isBike ? 'bicycle-outline' : 'car-outline'} size={44} color={G.muted} />
                  <Text style={s.emptyTxt}>No {isBike ? 'bikes' : 'cars'} found</Text>
                </View>
          }
          renderItem={({ item }) => (
            <ResultCard
              item={item}
              saved={savedIds.has(item.id) || !!item.is_saved}
              onSave={() => toggleSave(item.id)}
              // Same vehicle detail screen as Buy New Car, with the Book flow's Contact Dealer + Test Drive buttons
              onView={() => router.push({ pathname: '/buy/car-detail', params: { id: item.id, from: 'book' } } as any)}
              onContact={() => router.push({ pathname: '/book/dealer-profile', params: { id: item.seller_id, category: item.category || p.category || 'car' } } as any)}
            />
          )}
        />
      </SafeAreaView>
    </GlowBackground>
  );
}

const s = StyleSheet.create({
  heading:     { color: G.white, fontSize: 20, fontFamily: 'Poppins_500Medium', marginTop: 16 },
  count:       { color: G.muted, fontSize: 15, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  search:      { height: 50, borderRadius: 25, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 4 },
  searchInput: { flex: 1, height: '100%', paddingHorizontal: 12, color: G.white, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  empty:       { alignItems: 'center', gap: 10, paddingTop: 50 },
  emptyTxt:    { color: G.muted, fontSize: 14, fontFamily: 'Poppins_400Regular' },
});

const c = StyleSheet.create({
  card:      { borderRadius: 20, overflow: 'hidden', padding: 12, paddingTop: 14, gap: 12 },
  top:       { flexDirection: 'row', gap: 6 },
  img:       { width: 130, height: 106, borderRadius: 12, marginRight: 4 },
  imgPh:     { backgroundColor: '#0B1D4A', alignItems: 'center', justifyContent: 'center' },
  title:     { color: G.white, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  color:     { color: G.white, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  dealerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  dealer:    { color: G.white, fontSize: 13, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
  meta:      { color: G.muted, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  priceRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, gap: 6 },
  avail:     { backgroundColor: '#0E2A2A', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 2 },
  availTxt:  { color: '#2ECC71', fontSize: 10, fontFamily: 'Poppins_400Regular' },
  price:     { color: G.orange, fontSize: 15, fontFamily: 'Poppins_700Bold', flexShrink: 1 },
  btnRow:    { flexDirection: 'row', gap: 12 },
});
