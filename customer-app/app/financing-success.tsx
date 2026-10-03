import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, useAppColors } from '@/constants/theme';
import { RingGlow, SavedCardEffect } from '@/components/shared/FigmaEffects';

const BG    = '#010a1f';
const WHITE = '#f9fafc';
const SUB   = '#baacb6';
const NAVY  = '#032a69';
const ORANGE= '#e2671b';

function Row({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  const aC = useAppColors();
  return (
    <View style={r.row}>
      <Text style={[r.label, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>{label}</Text>
      <Text style={[r.value, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>{value}</Text>
    </View>
  );
}
const r = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  border:{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  label: { color: SUB, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  value: { color: WHITE, fontSize: 13, fontFamily: 'Poppins_400Regular' },
});

export default function FinancingSuccessScreen() {
  const router = useRouter();
  const { referenceNo, bankName } = useLocalSearchParams<{ referenceNo?: string; bankName?: string }>();
  const aC = useAppColors();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top', 'bottom']}>

      <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
        <Ionicons name="chevron-back" size={26} color={aC.isDark ? '#C9C6D0' : '#010a1f'} />
      </TouchableOpacity>

      <View style={[s.center, { backgroundColor: aC.bg }]}>
        <Text style={s.emoji}>🎉</Text>
        <Text style={[s.title, { color: aC.isDark ? WHITE : '#010a1f' }]}>Application Submitted{'\n'}Successfully</Text>
        <Text style={[s.subtitle, { color: aC.isDark ? SUB : '#475569' }]}>
          Your financing application is being processed. You'll receive an update soon.
        </Text>

        <View style={[s.card, aC.isDark
          ? { backgroundColor: '#010A1F', borderColor: '#82a5d5', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 }
          : { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)', shadowColor: 'rgba(3,42,105,0.12)', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }]}>
          {aC.isDark ? (
            <SavedCardEffect />
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          )}
          <Row label="Reference No."  value={referenceNo || '—'} />
          <Row label="Selected Bank"  value={bankName    || '—'} />
          <Row label="Review Time"    value="5-7 business days" isLast />
        </View>
      </View>

      <View style={[s.footer, { backgroundColor: aC.bg, borderTopWidth: aC.isDark ? 0 : 1, borderTopColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
        <TouchableOpacity style={[s.homeBtn, aC.isDark ? { backgroundColor: '#07142F', borderWidth: 1, borderColor: '#7E9FD6' } : null]} onPress={() => router.push('/(tabs)/' as any)} activeOpacity={0.88}>
          {aC.isDark
            ? <RingGlow radius={26} peak={0.5} rings={12} />
            : <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />}
          <Text style={[s.homeTxt, aC.isDark && { color: '#EDEBF0' }]}>Back to home</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center', marginLeft: 16, marginTop: 6 },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingBottom: 60 },
  emoji:    { fontSize: 58, marginBottom: 14 },
  title:    { color: WHITE, fontSize: 19, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', lineHeight: 27, marginBottom: 6 },
  subtitle: { color: SUB, fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 20 },
  card: { width: '100%', borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, overflow: 'hidden' },
  footer:  { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 10 },
  homeBtn: { height: 50, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  homeTxt: { color: WHITE, fontSize: 16, fontFamily: 'Poppins_400Regular' },
});
