import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

const STEPS = [1, 2, 3, 4];

function StepIndicator({ activeStep }: { activeStep: number }) {
  const aC = useAppColors();
  return (
    <View style={si.row}>
      {STEPS.map((step, idx) => (
        <View key={step} style={si.item}>
          <View style={[
            si.circle,
            { backgroundColor: aC.isDark ? '#0e1a3d' : '#ffffff', borderColor: aC.isDark ? '#1e3a8a' : 'rgba(3,42,105,0.12)' },
            step === activeStep && { backgroundColor: aC.isDark ? '#173066' : 'rgba(226,103,27,0.10)', borderColor: aC.isDark ? '#3b6fe0' : '#e2671b' },
          ]}>
            <Text style={[
              si.num,
              { color: aC.isDark ? '#cbd5e1' : '#475569' },
              step === activeStep && { color: aC.isDark ? '#fff' : '#e2671b' },
            ]}>{step}</Text>
          </View>
          {idx < STEPS.length - 1 && <View style={[si.line, { backgroundColor: aC.isDark ? '#1e3a8a' : 'rgba(3,42,105,0.12)' }]} />}
        </View>
      ))}
    </View>
  );
}
const si = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  item:        { flexDirection: 'row', alignItems: 'center' },
  circle:      { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#1e3a8a', backgroundColor: '#0e1a3d', alignItems: 'center', justifyContent: 'center' },
  circleActive:{ borderColor: '#3b6fe0', backgroundColor: '#173066' },
  num:         { color: '#cbd5e1', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  numActive:   { color: '#fff' },
  line:        { width: 32, height: 1, backgroundColor: '#1e3a8a', marginHorizontal: 6 },
});

function formatCnic(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  const p1 = digits.slice(0, 5);
  const p2 = digits.slice(5, 12);
  const p3 = digits.slice(12, 13);
  let result = p1;
  if (p2) result += `-${p2}`;
  if (p3) result += `-${p3}`;
  return result;
}

export default function FinancingApply2Screen() {
  const router    = useRouter();
  const aC = useAppColors();
  const { user }  = useAuth();
  const params    = useLocalSearchParams();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [cnic,     setCnic]     = useState('');

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: aC.bg }}>

        <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <ChevronLeft size={26} color={aC.isDark ? '#e2e8f0' : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Apply</Text>
          <View style={{ width: 36 }} />
        </View>

        <StepIndicator activeStep={2} />

        <View style={[s.content, { backgroundColor: aC.bg }]}>
          <View style={[s.card, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3, overflow: 'hidden' }]}>
            {aC.isDark ? (
              <>
                <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              </>
            ) : (
              <>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              </>
            )}
            <Text style={[s.cardTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Applicant</Text>

            <Text style={[s.label, { color: aC.isDark ? '#cbd5e1' : '#475569' }]}>Full name</Text>
            <View style={[s.inputWrap, { backgroundColor: aC.isDark ? '#061B4A' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2, overflow: 'hidden' }]}>
              {aC.isDark ? null : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                </>
              )}
              {aC.isDark && (
                <>
                  <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                  <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                </>
              )}
              <TextInput
                style={[s.input, { color: aC.isDark ? '#fff' : '#010a1f' }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor={aC.isDark ? '#64748b' : '#94a3b8'}
              />
            </View>

            <Text style={[s.label, { color: aC.isDark ? '#cbd5e1' : '#475569' }]}>CNIC</Text>
            <View style={[s.inputWrap, { backgroundColor: aC.isDark ? '#061B4A' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2, overflow: 'hidden' }]}>
              {aC.isDark ? (
                <>
                  <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                  <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                </>
              ) : (
                <>
                  <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                  <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                </>
              )}
              <TextInput
                style={[s.input, { color: aC.isDark ? '#fff' : '#010a1f' }]}
                value={cnic}
                onChangeText={v => setCnic(formatCnic(v))}
                placeholder="00000-0000000-0"
                placeholderTextColor={aC.isDark ? '#64748b' : '#94a3b8'}
                inputMode="numeric"
              />
            </View>
          </View>
        </View>

        <View style={[s.footer, { backgroundColor: aC.bg, borderTopColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', borderTopWidth: aC.isDark ? 0 : 1 }]}>
          <TouchableOpacity
            style={[s.continueBtn, (!fullName.trim() || cnic.length < 15) && { opacity: 0.5 }]}
            activeOpacity={0.88}
            disabled={!fullName.trim() || cnic.length < 15}
            onPress={() => router.push({
              pathname: '/financing-apply-3' as any,
              params: { ...params, fullName: fullName.trim(), cnic },
            })}
          >
            <LinearGradient colors={['#1b3a8f', '#5a4a7b', '#d2621f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Text style={s.continueTxt}>Continue</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#010A1F' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 19, fontFamily: 'Poppins_600SemiBold' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  card:      { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: '#010A1F', padding: 20, overflow: 'hidden' },
  cardTitle: { color: '#fff', fontSize: 19, fontFamily: 'Poppins_700Bold', marginBottom: 20 },
  label:     { color: '#cbd5e1', fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
  inputWrap: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: '#061B4A', justifyContent: 'center', marginBottom: 16, overflow: 'hidden' },
  input:     { paddingHorizontal: 16, color: '#fff', fontSize: 15, fontFamily: 'Poppins_400Regular' },
  footer:      { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 10 },
  continueBtn: { height: 54, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  continueTxt: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },
});
