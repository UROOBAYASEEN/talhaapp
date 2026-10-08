import { useAppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const IMG_COMPARE = require('@/screenshot/comparevehcile.png');
const IMG_INSURANCE = require('@/screenshot/insurance.png');
const IMG_FINANCE = require('@/screenshot/smartcalculator.png');
const IMG_BOOK = require('@/screenshot/book.png');

const ITEMS = [
  { img: IMG_COMPARE, title: 'Compare\nVehicle', sub: 'Compare vehicle features, prices, and specifications.', route: '/compare-vehicle', imgW: 93, imgH: 67 },
  { img: IMG_FINANCE, title: 'Smart Finance\nCalculator', sub: 'Compare financing plans and calculate your monthly payments.', route: '/auto-financing', imgW: 109, imgH: 72 },
  { img: IMG_INSURANCE, title: 'Compare\nInsurance Plans', sub: 'Compare coverage, benefits, and prices to find the right plan.', route: '/insurance-search', imgW: 85, imgH: 67 },
  { img: IMG_BOOK, title: 'Book Your\nVehicle', sub: 'Book your preferred vehicle online by selecting your date.', route: '/book', imgW: 89, imgH: 70 },
];

export default function YouMayNeedThis() {
  const router = useRouter();
  const C = useAppColors();
  // Layout sirf flex pe — pehle width onLayout/useWindowDimensions se calculate hoti thi,
  // Home pe first mount pe width 0 aane se cards render hi nahi hote thay (navigate kar ke wapas aao to dikhte thay)
  const rows = [ITEMS.slice(0, 2), ITEMS.slice(2, 4)];
  // Android pe kabhi kabhi cards layout ho jate thay magar paint nahi hote (doosri screen se wapas aao to dikhte).
  // Home focus hone ke baad grid ko ek dafa fresh mount kar dete hain taake har dafa draw ho.
  const [paintKey, setPaintKey] = useState(0);
  useFocusEffect(useCallback(() => {
    const t = setTimeout(() => setPaintKey(k => k + 1), 120);
    return () => clearTimeout(t);
  }, []));
  return (
    <View style={styles.wrapper} collapsable={false}>
      <Text style={[styles.heading, { color: C.textPrimary }]}>You May Need This</Text>
      <View key={paintKey} style={styles.grid} collapsable={false}>
        {rows.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((item, i) => (
              <TouchableOpacity key={i} style={[styles.card, { backgroundColor: C.isDark ? '#010A1F' : '#ffffff' }, !C.isDark && { borderWidth: 1, borderColor: 'rgba(3,12,40,0.12)' }]} activeOpacity={0.85} onPress={() => router.push(item.route as any)}>
                <LinearGradient
                  colors={C.isDark ? ['#051539', '#061A44', '#0D1E47', '#2A2941', '#4E343A', '#653D37'] : ['#ffffff', '#f0f4ff', 'rgba(226,103,27,0.35)']}
                  locations={C.isDark ? [0, 0.36, 0.52, 0.68, 0.86, 1] : undefined}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  style={[StyleSheet.absoluteFillObject, styles.gradBg]}
                  pointerEvents="none"
                />
                <View style={styles.grad}>
                  <View style={styles.imgWrap}>
                    <Image source={typeof item.img === 'string' ? { uri: item.img } : item.img} style={[styles.img, { width: item.imgW, height: item.imgH }]} resizeMode="contain" />
                  </View>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: C.isDark ? '#f9fafc' : '#032a69' }]} numberOfLines={2}>{item.title}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#e2671b" />
                  </View>
                  <Text style={[styles.sub, { color: C.isDark ? '#c9c1cb' : '#555566' }]} numberOfLines={3}>{item.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 14 },
  heading: { fontSize: 17, fontFamily: 'Poppins_500Medium', color: '#f9fafc' },
  grid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  // Fixed height (aspectRatio + overflow clip hata diye — Android pe yehi draw miss karwate thay)
  card: { flex: 1, height: 190, borderRadius: 12 },
  gradBg: { borderRadius: 12 },
  grad: { flex: 1, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8, justifyContent: 'flex-start' },
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 2,
  },
  title: { color: '#f9fafc', fontSize: 13, lineHeight: 19, fontFamily: 'Poppins_500Medium', flex: 1 },
  imgWrap: { height: 74, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  img: { width: 96, height: 70 },
  sub: { color: '#c9c1cb', fontSize: 9.5, fontFamily: 'Poppins_400Regular', lineHeight: 14 },
});
