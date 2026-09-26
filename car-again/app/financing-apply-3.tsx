import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { AppColors, useAppColors } from '@/constants/theme';

const EMPLOYMENT_TYPES = ['Salaried', 'Business', 'Agriculture', 'Rental', 'Other'];
const STEPS = [1, 2, 3, 4];

function StepIndicator({ activeStep }: { activeStep: number }) {
  const aC = useAppColors();
  return (
    <View style={si.row}>
      {STEPS.map((step, idx) => (
        <View key={step} style={si.item}>
          <View style={[si.circle, { backgroundColor: aC.isDark ? '#0e1a3d' : '#ffffff', borderColor: aC.isDark ? '#1e3a8a' : 'rgba(3,42,105,0.12)' }, step === activeStep && { backgroundColor: aC.isDark ? '#173066' : '#f1f5f9', borderColor: aC.isDark ? '#3b6fe0' : '#032a69' }]}>
            <Text style={[si.num, { color: aC.isDark ? '#cbd5e1' : '#64748b' }, step === activeStep && { color: aC.isDark ? '#fff' : '#010a1f' }]}>{step}</Text>
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

export default function FinancingApply3Screen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const aC = useAppColors();

  const [employmentType, setEmploymentType] = useState('Salaried');
  const [income,         setIncome]         = useState('');

  const canContinue = employmentType && income.trim().length > 0;

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

        <StepIndicator activeStep={3} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { backgroundColor: aC.bg }]} keyboardShouldPersistTaps="handled">
          <View style={[s.card, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 3 }]}>
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
            <Text style={[s.cardTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Applicant</Text>

            <Text style={[s.label, { color: aC.isDark ? '#C9D4EC' : '#475569' }]}>Employment type</Text>
            <View style={s.chipWrap}>
              {EMPLOYMENT_TYPES.map(type => {
                const selected = employmentType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setEmploymentType(type)}
                    activeOpacity={0.75}
                    style={[s.chip, { backgroundColor: aC.isDark ? '#061B4A' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', borderWidth: aC.isDark ? 0 : 1, shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.05, elevation: aC.isDark ? 0 : 1 }, selected && { backgroundColor: aC.isDark ? '#12295C' : '#f1f5f9', borderColor: aC.isDark ? '#5B8EE0' : '#032a69', borderWidth: 1 }]}
                  >
                    <Text style={[s.chipTxt, { color: aC.isDark ? '#C9D4EC' : '#475569' }, selected && { color: aC.isDark ? '#fff' : '#010a1f', fontFamily: 'Poppins_600SemiBold' }]}>{type}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[s.label, { marginTop: 18, color: aC.isDark ? '#C9D4EC' : '#475569' }]}>Monthly income (PKR)</Text>
            <View style={[s.inputWrap, { backgroundColor: aC.isDark ? '#061B4A' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1, overflow: 'hidden' }]}>
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
              <TextInput
                style={[s.input, { color: aC.isDark ? '#fff' : '#010a1f' }]}
                value={income}
                onChangeText={t => setIncome(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={aC.isDark ? '#7488AE' : '#94a3b8'}
              />
            </View>
          </View>
          <View style={{ height: 16 }} />
        </ScrollView>

        <View style={[s.footer, { backgroundColor: aC.bg, borderTopWidth: aC.isDark ? 0 : 1, borderTopColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity
            style={[s.continueBtn, !canContinue && { opacity: 0.5 }]}
            activeOpacity={0.88}
            disabled={!canContinue}
            onPress={() => router.push({
              pathname: '/financing-apply-4' as any,
              params: { ...params, employmentType, monthlyIncome: income },
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
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  card:      { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: '#010A1F', padding: 18, overflow: 'hidden' },
  cardTitle: { color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold', marginBottom: 14 },
  label:  { color: '#C9D4EC', fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 10 },
  chipWrap:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip:           { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#061B4A', minWidth: 96, alignItems: 'center' },
  chipSelected:   { borderWidth: 1, borderColor: '#5B8EE0', backgroundColor: '#12295C' },
  chipTxt:        { color: '#C9D4EC', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  chipTxtSelected:{ color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  inputWrap: { height: 52, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', backgroundColor: '#061B4A', justifyContent: 'center' },
  input:     { paddingHorizontal: 14, color: '#fff', fontSize: 15, fontFamily: 'Poppins_400Regular' },
  footer:      { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 10 },
  continueBtn: { height: 54, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  continueTxt: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },
});
