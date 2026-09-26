import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
const FIELD_W = (W - 64 - 16) / 3;

const FIELDS = [
  { icon: 'location-outline',      label: 'City',     value: 'Karachi' },
  { icon: null, image: require('@/screenshot/brand.png'), label: 'Brand', value: 'All Brands' },
  { icon: null, image: require('@/screenshot/year.png'),  label: 'Year',  value: '2026' },
  { icon: 'car-outline',           label: 'Car',      value: 'Honda City' },
  { icon: null, image: require('@/screenshot/varient.png'), label: 'Variant',  value: '1.2 CVT' },
  { icon: 'color-palette-outline', label: 'Color',    value: 'All Colors' },
];

export default function VehicleSearch() {
  const router = useRouter();
  const C = useAppColors();
  const [option,  setOption]  = useState<'Cash' | 'Finance'>('Cash');
  const [vehicle, setVehicle] = useState('New Cars');

  return (
    <View style={styles.wrapper}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: C.textPrimary }]}>
            Search smart,{' '}
            <Text style={styles.orange}>Drive Better</Text>
          </Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>Find the best deals from verified dealers</Text>
        </View>
        <Image
          source={require('@/screenshot/smarticon.png')}
          style={styles.headerImage}
          resizeMode="contain"
        />
      </View>

      {/* Select Option */}
      <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Select The Option</Text>
      <View style={styles.optionRow}>
        {(['Cash', 'Finance'] as const).map(opt => (
          <TouchableOpacity
            key={opt}
            activeOpacity={0.8}
            onPress={() => setOption(opt)}
            style={[styles.optionBtn, { backgroundColor: C.glassBg, borderColor: C.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,12,40,0.12)' }, option === opt && { backgroundColor: C.isDark ? 'rgba(50,100,200,0.35)' : 'rgba(3,42,105,0.08)', borderColor: C.isDark ? 'rgba(100,160,255,0.9)' : 'rgba(3,42,105,0.25)' }, { overflow: 'hidden' }]}
          >
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <Text style={[styles.optionTxt, { color: C.textPrimary }, option === opt && { color: '#e2671b' }]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Vehicle Type */}
      <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Vehicle Type</Text>
      <View style={styles.vehicleRow}>
        {[
          { label: 'New Cars',   icon: 'car-outline',      image: null },
          { label: 'Used Cars',  icon: null,               image: require('@/screenshot/usedcar.png') },
          { label: 'New Bikes',  icon: null,               image: require('@/screenshot/bikelogo.png') },
          { label: 'Used Bikes', icon: null,               image: require('@/screenshot/bikelogo.png') },
        ].map(v => (
          <TouchableOpacity
            key={v.label}
            activeOpacity={0.8}
            onPress={() => setVehicle(v.label)}
            style={[styles.vehicleCard, { backgroundColor: C.isDark ? 'rgba(20,40,80,0.5)' : 'rgba(255,255,255,0.7)', borderColor: C.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,12,40,0.12)' }, vehicle === v.label && { backgroundColor: C.isDark ? 'rgba(50,100,200,0.35)' : 'rgba(3,42,105,0.08)', borderColor: C.isDark ? 'rgba(100,160,255,0.9)' : 'rgba(3,42,105,0.25)' }, { overflow: 'hidden' }]}
          >
            {vehicle === v.label && (
              <>
                <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              </>
            )}
            {v.image ? (
                <Image source={v.image} style={{ width: 24, height: 24, tintColor: vehicle === v.label ? '#e2671b' : C.textPrimary }} resizeMode="contain" />
              ) : (
                <Ionicons name={v.icon as any} size={26} color={vehicle === v.label ? '#e2671b' : C.textPrimary} />
              )}
            <Text style={[styles.vehicleTxt, { color: C.textPrimary }, vehicle === v.label && { color: '#a8caff' }]}>{v.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fields Grid */}
      <View style={styles.fieldsGrid}>
        {FIELDS.map((f, i) => (
          <View key={i} style={styles.fieldWrap}>
            <View style={styles.fieldLabelRow}>
              {(f as any).image ? (
                <Image source={(f as any).image} style={{ width: 16, height: 16, tintColor: '#e2671b' }} resizeMode="contain" />
              ) : (
                <Ionicons name={f.icon as any} size={16} color="#e2671b" />
              )}
              <Text style={[styles.fieldLabel, { color: C.textPrimary }]}>{f.label}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.8} style={[styles.dropdown, { backgroundColor: C.glassBg, borderColor: C.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,12,40,0.12)', overflow: 'hidden' }]}>
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <Text style={[styles.dropdownTxt, { color: C.textPrimary }]} numberOfLines={1}>{f.value}</Text>
              <Ionicons name="chevron-down" size={14} color={C.textPrimary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Dealership */}
      <View style={styles.fullField}>
        <View style={styles.fieldLabelRow}>
          <Image source={require('@/screenshot/dealershiplogo.png')} style={{ width: 16, height: 16, tintColor: '#e2671b' }} resizeMode="contain" />
          <Text style={[styles.fieldLabel, { color: C.textPrimary }]}>Dealership</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} style={[styles.fullDropdown, { backgroundColor: C.glassBg, borderColor: C.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,12,40,0.12)', overflow: 'hidden' }]}>
          <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <Text style={[styles.dropdownTxt, { color: C.textPrimary }]}>All Dealership</Text>
          <Ionicons name="chevron-down" size={14} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/explore')}
      >
        <LinearGradient
          colors={['#032a69', '#e2671b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.searchBtn}
        >
          <Text style={styles.searchTxt}>Search</Text>
        </LinearGradient>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: 'rgba(6,27,74,0)',
    paddingVertical: 16,
    borderRadius: 16,
  },


  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
   
  },


  headerText: { flex: 1 },
  title:    { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#f9fafc', lineHeight: 26 },
  orange:   { color: '#e2671b' },
  subtitle: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#baacb6', marginTop: 4 },
  headerImage: { width: 130, height: 80 },

  sectionTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#f9fafc' },

  optionRow: { flexDirection: 'row', gap: 12 },
  optionBtn: {
    flex: 1, height: 48, borderRadius: 32,
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  optionBtnActive: { backgroundColor: 'rgba(50,100,200,0.35)', borderColor: 'rgba(100,160,255,0.9)' },
  optionTxt:       { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#f9fafc' },
  optionTxtActive: { color: '#e2671b', fontFamily: 'Poppins_600SemiBold' },

  vehicleRow: { flexDirection: 'row', gap: 4 },
  vehicleCard: {
    flex: 1, height: 80, borderRadius: 16,
    backgroundColor: 'rgba(20,40,80,0.5)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  vehicleCardActive: { backgroundColor: 'rgba(50,100,200,0.35)', borderColor: 'rgba(100,160,255,0.9)' },
  vehicleTxt:        { fontSize: 8, fontFamily: 'Poppins_500Medium', color: '#f9fafc', textAlign: 'center' },
  vehicleTxtActive:  { color: '#a8caff' },

  fieldsGrid:    { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 12 },
  fieldWrap:     { width: '31.5%', gap: 4 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldLabel:    { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#f9fafc' },
  dropdown: {
    height: 44, borderRadius: 12,
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    paddingHorizontal: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dropdownTxt: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: '#f9fafc', flex: 1 },

  fullField:    { gap: 4 },
  fullDropdown: {
    height: 48, borderRadius: 0,
    backgroundColor: 'rgba(3,12,40,0.6)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },

  searchBtn: { height: 50, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  searchTxt: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
});
