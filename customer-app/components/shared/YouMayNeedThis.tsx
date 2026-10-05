import { useAppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const IMG_COMPARE = require('@/screenshot/comparevehcile.png');
const IMG_INSURANCE = require('@/screenshot/insurance.png');
const IMG_FINANCE = require('@/screenshot/smartcalculator.png');
const IMG_BOOK = require('@/screenshot/book.png');

const ITEMS = [
  { img: IMG_FINANCE, title: 'Smart Finance\nCalculator', sub: 'Calculate your monthly payments instantly.', route: '/auto-financing' },
  { img: IMG_COMPARE, title: 'Compare\nVehicle', sub: 'Compare and choose the vehicle that best fits your needs.', route: '/compare-vehicle' },
  { img: IMG_INSURANCE, title: 'Compare\nInsurance Plan', sub: 'Compare plans, coverage, and benefits to find the right insurance.', route: '/insurance-search' },
  { img: IMG_BOOK, title: 'Book Your\nVehicle', sub: 'Reserve your preferred vehicle online by selecting your date.', route: '/book' },
];

export default function YouMayNeedThis() {
  const router = useRouter();
  const C = useAppColors();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.heading, { color: C.textPrimary }]}>You May Need This</Text>
      <View style={styles.grid}>
        {ITEMS.map((item, i) => (
          <TouchableOpacity key={i} style={[styles.card, { borderWidth: 1, borderColor: C.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,12,40,0.12)' }]} activeOpacity={0.85} onPress={() => router.push(item.route as any)}>
            <LinearGradient
              colors={C.isDark ? ['#061B4A', '#061B4A', 'rgba(226,103,27,0.5)'] : ['#ffffff', '#f0f4ff', 'rgba(226,103,27,0.35)']}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={styles.grad}
            >
              <View style={styles.imgWrap}>
                <Image source={typeof item.img === 'string' ? { uri: item.img } : item.img} style={styles.img} resizeMode="contain" />
              </View>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: C.isDark ? '#f9fafc' : '#032a69' }]} numberOfLines={2}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={14} color="#e2671b" />
              </View>
              <Text style={[styles.sub, { color: C.isDark ? '#baacb6' : '#555566' }]} numberOfLines={3}>{item.sub}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 14 },
  heading: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#f9fafc' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47.5%', borderRadius: 16, overflow: 'hidden', height: 200 },
  grad: { flex: 1, padding: 12, justifyContent: 'flex-start' },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', height: 34,
    justifyContent: 'space-between', marginBottom: 4,
  },
  title: { color: '#f9fafc', fontSize: 12, lineHeight: 15, fontFamily: 'Poppins_500Medium', textTransform: 'capitalize', flex: 1 },
  imgWrap: { height: 76, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  img: { width: 84, height: 68 },
  sub: { color: '#baacb6', fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 14, height: 42 },
});
