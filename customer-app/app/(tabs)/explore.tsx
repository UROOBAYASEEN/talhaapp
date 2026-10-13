import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, useAppColors, LIGHT_POP_SHADOW } from '@/constants/theme';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 40 - 16) / 2;

// ── Local card images ──────────────────────────────────────────────────────
const IMG_NEW_CAR   = require('@/screenshot/necar.png');
const IMG_USED_CAR  = require('@/screenshot/usedcarh.png');
const IMG_NEW_BIKE  = require('@/screenshot/newbike.png');
const IMG_USED_BIKE = require('@/assets/images/usedBikeInspected.png');
const IMG_FINANCING = require('@/screenshot/smartcalculator.png');
const IMG_INSURANCE = require('@/screenshot/insurance.png');
const IMG_TRACKER   = require('@/assets/images/trackerCarImage.png');
const IMG_BOOK      = require('@/assets/images/bookVehicleImage.png');

// ── Data ───────────────────────────────────────────────────────────────────
const VEHICLES = [
  {
    img: IMG_NEW_CAR,
    title: 'Buy New Car in Cash',
    desc: 'Explore brand-new cars from authorized dealerships.',
    route: '/buy/new-car',
    params: {},
  },
  {
    img: IMG_USED_CAR,
    title: 'Buy Used Car in Cash',
    desc: 'Explore verified pre-owned cars at the best prices.',
    route: '/buy/used-car',
    params: {},
  },
  {
    img: IMG_NEW_BIKE,
    title: 'Buy New Bike in Cash',
    desc: 'Explore brand-new bikes from authorized dealerships.',
    route: '/buy/new-bike',
    params: {},
  },
  {
    img: IMG_USED_BIKE,
    title: 'Buy Used Bike in Cash',
    desc: 'Explore verified pre-owned bikes at the best prices.',
    route: '/buy/used-bike',
    params: {},
  },
];

const SERVICES = [
  {
    img: IMG_FINANCING,
    title: 'Auto Financing',
    desc: 'Compare banks and apply for vehicle financing.',
    route: '/auto-financing',
    params: {},
  },
  {
    img: IMG_INSURANCE,
    title: 'Buy Insurance',
    desc: 'Compare Insurance Plans. Choose the Right Protection.',
    route: '/insurance-search',
    params: {},
  },
  {
    img: IMG_TRACKER,
    title: 'Buy Tracker',
    desc: 'Choose Your Tracker & Compare Prices.',
    route: '/tracker-search',
    params: {},
  },
  {
    img: IMG_BOOK,
    title: 'Book Your Vehicle',
    desc: 'Reserve your preferred vehicle before delivery.',
    route: '/book',
    params: {},
  },
];

// ── Service Card ───────────────────────────────────────────────────────────
function ServiceCard({
  img, title, desc, onPress,
}: {
  img: any; title: string; desc: string; onPress: () => void;
}) {
  const aC = useAppColors();
  if (aC.isDark) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.cardWrap}>
        <LinearGradient
          colors={['#051334', '#071A44', '#0A1D47', '#202543', '#4C343B', '#633B37']}
          locations={[0, 0.33, 0.51, 0.62, 0.86, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardImgWrap}>
            <Image source={typeof img === 'string' ? { uri: img } : img} style={styles.cardImg} resizeMode="contain" />
          </View>
          <View style={styles.cardBottom}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, { color: aC.textPrimary }]} numberOfLines={2}>{title}</Text>
              <Ionicons name="chevron-forward" size={20} color={AppColors.gradientEnd} />
            </View>
            <Text style={[styles.cardDesc, { color: aC.textSecondary }]} numberOfLines={2}>{desc}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  // Light mode — white card, subtle border + shadow + orange bottom glow (professional)
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.cardWrap, { borderRadius: 16, backgroundColor: '#F1F4F8', boxShadow: LIGHT_POP_SHADOW }]}>
      <View style={[styles.card, { backgroundColor: '#F1F4F8', borderWidth: 0, borderRadius: 16, overflow: 'hidden' }]}>
        {/* Figma light: grey-blue top fading to peach, no border */}
        <LinearGradient colors={['#F1F4F8', '#F1F4F8', '#FCDCC8']} locations={[0, 0.4, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View style={styles.cardImgWrap}>
          <Image source={typeof img === 'string' ? { uri: img } : img} style={styles.cardImg} resizeMode="contain" />
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: '#000000' }]} numberOfLines={2}>{title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#e2671b" />
          </View>
          <Text style={[styles.cardDesc, { color: '#000000' }]} numberOfLines={2}>{desc}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const router = useRouter();
  const aC = useAppColors();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={28} color={aC.isDark ? '#BAACB6' : aC.textPrimary} />
        </TouchableOpacity>

        {aC.isDark ? (
          <Image
            source={require('@/assets/images/autowizor-logo-text.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.logoTextLight}>
            <Text style={{ color: '#032a69' }}>Auto</Text>
            <Text style={{ color: '#e2671b' }}>wizor</Text>
          </Text>
        )}

        <View style={styles.iconBtn} />
      </View>

      {/* ── Page title ── */}
      <Text style={[styles.pageTitle, { color: aC.isDark ? '#F2F1F5' : aC.textPrimary }]}>Find Your Perfect Option</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* VEHICLES */}
        <Text style={[styles.sectionHeading, { color: aC.isDark ? '#E6E1E8' : '#000000' }]}>VEHICLES</Text>
        <View style={styles.grid}>
          {VEHICLES.map((item) => (
            <ServiceCard
              key={item.title}
              img={item.img}
              title={item.title}
              desc={item.desc}
              onPress={() => router.push({ pathname: item.route as any, params: item.params })}
            />
          ))}
        </View>

        {/* VEHICLE SERVICES */}
        <Text style={[styles.sectionHeading, { color: aC.isDark ? '#E6E1E8' : '#000000' }]}>VEHICLE SERVICES</Text>
        <View style={styles.grid}>
          {SERVICES.map((item) => (
            <ServiceCard
              key={item.title}
              img={item.img}
              title={item.title}
              desc={item.desc}
              onPress={() => router.push({ pathname: item.route as any, params: item.params })}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppColors.bg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
    height: 58,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    flex: 1,
    height: 19,
  },
  logoTextLight: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },

  pageTitle: {
    color: AppColors.textPrimary,
    fontSize: 22,
    fontFamily: 'Poppins_500Medium',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 22,
  },

  scroll: {
    paddingHorizontal: 20,
  },

  sectionHeading: {
    color: AppColors.textPrimary,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 20,
    marginTop: 2,
    paddingHorizontal: 8,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 17,
    marginBottom: 24,
  },

  cardWrap: {
    width: CARD_W,
    height: 153,
    borderRadius: 14,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 12,
    flexDirection: 'column',
  },
  cardImgWrap: {
    height: 62,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImg: {
    width: '62%',
    height: 60,
  },
  cardBottom: {
    flex: 1,
    gap: 3,
    paddingTop: 2,
    justifyContent: 'flex-end',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  cardTitle: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  cardDesc: {
    color: AppColors.textRole,
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 15,
  },
});
