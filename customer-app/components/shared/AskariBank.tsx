import { API_BASE } from '@/constants/api';
import { logApi, logApiError } from '@/constants/apiLog';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const IMG_BANK_CAR = require('@/screenshot/bankpanelcar.png');

export default function AskariBank() {
  const router = useRouter();
  const SERVER = API_BASE.replace('/api/v1', '');
  const [ad, setAd] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Sirf bank_representative ki user-ids
        const sres  = await fetch(`${API_BASE}/sellers/?role=bank_representative&limit=100`);
        const sdata = await sres.json().catch(() => undefined);
        const bankIds = new Set<string>(
          Array.isArray(sdata) ? sdata.map((b: any) => String(b.id)) : [],
        );

        // Bank panels ki banner ads
        const url = `${API_BASE}/banner-ads/`;
        const t0  = Date.now();
        const res  = await fetch(url);
        const data = await res.json().catch(() => undefined);
        logApi('Home › Bank Banner', 'GET', url, res, data, t0);
        if (res.ok) {
          const items = Array.isArray(data) ? data : data?.items || [];
          // Sirf bank ki banner ads (dealer_id bank rep ka ho)
          const bankBanners = items.filter(
            (a: any) => a?.dealer_id && bankIds.has(String(a.dealer_id)),
          );
          // Koi bhi ek random bank banner
          if (bankBanners.length) setAd(bankBanners[Math.floor(Math.random() * bankBanners.length)]);
        }
      } catch (e) {
        logApiError('Home › Bank Banner', 'GET', `${API_BASE}/banner-ads/`, e, Date.now());
      }
    })();
  }, []);

  // Values — bank banner se, warna static Askari fallback (design same rehta hai)
  const title = ad?.title || 'Askari Bank Car Ijarah';
  const sub   = ad?.description || 'Drive your dream car today with flexible monthly plans';
  const carImg = ad?.banner_image_url
    ? (ad.banner_image_url.startsWith('http')
        ? ad.banner_image_url
        : `${SERVER}${ad.banner_image_url.startsWith('/') ? ad.banner_image_url : `/${ad.banner_image_url}`}`)
    : null;

  return (
    <LinearGradient
      colors={['#153970', '#c8d1df']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.43 }}
      style={styles.finBanner}
    >
      <View style={styles.finLeft}>
        <Text style={styles.finTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.finSub} numberOfLines={2}>
          {sub}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: '/(tabs)/sellers', params: { role: 'bank_representative' } } as any)}
        >
          <LinearGradient
            colors={['#032a69', '#e2671b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.finBtn}
          >
            <Text style={styles.finBtnTxt}>Apply Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Image
        source={carImg ? { uri: carImg } : IMG_BANK_CAR}
        style={carImg ? styles.bankBannerImg : styles.bankCar}
        resizeMode={carImg ? 'cover' : 'contain'}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  finBanner: {
    borderRadius: 16,
    height: 112,
    marginBottom: 10,
    flexDirection: 'row',
    paddingLeft: 18,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  finLeft: { flex: 1, gap: 4, justifyContent: 'center' },
  finTitle: { color: '#f9fafc', fontSize: 16, fontFamily: 'Poppins_600SemiBold', lineHeight: 23 },
  finSub: { color: '#f9fafc', fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 14, maxWidth: 174 },
  finBtn: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 22, paddingVertical: 6, marginTop: 5, marginLeft: -5 },
  finBtnTxt: { color: '#f9fafc', fontSize: 9, fontFamily: 'Poppins_600SemiBold' },
  bankCar: { position: 'absolute', bottom: -10, right: 5, width: 170, height: 134 },
  bankBannerImg: { position: 'absolute', bottom: 28, right: 22, width: 78, height: 62, borderRadius: 8, overflow: 'hidden' },
});
