import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, useAppColors } from '@/constants/theme';

const BG    = '#010a1f';
const WHITE = '#f9fafc';
const SUB   = '#baacb6';
const NAVY  = '#032a69';
const ORANGE= '#e2671b';

function Row({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  const aC = useAppColors();
  return (
    <View style={[r.row, !isLast && { borderBottomWidth: 1, borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.08)' }]}>
      <Text style={[r.label, { color: aC.isDark ? SUB : '#475569' }]}>{label}</Text>
      <Text style={[r.value, { color: aC.isDark ? WHITE : '#010a1f' }]}>{value}</Text>
    </View>
  );
}
const r = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  border:{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  label: { color: SUB, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  value: { color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium' },
});

export default function FinancingSuccessScreen() {
  const router = useRouter();
  const { referenceNo, bankName } = useLocalSearchParams<{ referenceNo?: string; bankName?: string }>();
  const aC = useAppColors();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top', 'bottom']}>

      <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
        <Ionicons name="chevron-back" size={24} color={aC.isDark ? WHITE : '#010a1f'} />
      </TouchableOpacity>

      <View style={[s.center, { backgroundColor: aC.bg }]}>
        <Text style={s.emoji}>🎉</Text>
        <Text style={[s.title, { color: aC.isDark ? WHITE : '#010a1f' }]}>Application Submitted{'\n'}Successfully</Text>
        <Text style={[s.subtitle, { color: aC.isDark ? SUB : '#475569' }]}>
          Your financing application is being processed. You'll receive an update soon.
        </Text>

        <View style={[s.card, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.4)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
          {aC.isDark ? (
            <>
              <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
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
        <TouchableOpacity style={s.homeBtn} onPress={() => router.push('/(tabs)/' as any)} activeOpacity={0.88}>
          <LinearGradient colors={[NAVY, ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          <Text style={s.homeTxt}>Back to home</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: 12, marginTop: 6 },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  emoji:    { fontSize: 64, marginBottom: 24 },
  title:    { color: WHITE, fontSize: 22, fontFamily: 'Poppins_700Bold', textAlign: 'center', lineHeight: 32, marginBottom: 14 },
  subtitle: { color: SUB, fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  card: { width: '100%', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', backgroundColor: '#010A1F', paddingHorizontal: 20, overflow: 'hidden' },
  footer:  { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 10 },
  homeBtn: { height: 54, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  homeTxt: { color: WHITE, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
