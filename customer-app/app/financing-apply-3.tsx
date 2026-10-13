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
import { PRIMARY_BTN_COLORS, RingGlow, SavedCardEffect } from '@/components/shared/FigmaEffects';

const EMPLOYMENT_TYPES = ['Salaried', 'Business', 'Agriculture', 'Rental', 'Other'];
const STEPS = [1, 2, 3, 4];

function StepIndicator({ activeStep }: { activeStep: number }) {
  const aC = useAppColors();
  return (
    <View style={si.row}>
      {STEPS.map((step, idx) => (
        <View key={step} style={si.item}>
          <View style={[
            si.circle,
            { backgroundColor: aC.isDark ? '#0B2A63' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)' },
            step === activeStep && { backgroundColor: aC.isDark ? '#010A1F' : 'rgba(226,103,27,0.10)', borderColor: aC.isDark ? '#82a5d5' : '#e2671b' },
          ]}>
            {step === activeStep && aC.isDark && <SavedCardEffect band={9} />}
            <Text style={[
              si.num,
              { color: aC.isDark ? '#F2F1F5' : '#475569' },
              step === activeStep && { color: aC.isDark ? '#fff' : '#e2671b' },
            ]}>{step}</Text>
          </View>
          {idx < STEPS.length - 1 && <View style={[si.line, { backgroundColor: aC.isDark ? '#1E3F7C' : 'rgba(3,42,105,0.12)' }]} />}
        </View>
      ))}
    </View>
  );
}
const si = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 0 },
  item:        { flexDirection: 'row', alignItems: 'center' },
  circle:      { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#1e3a8a', backgroundColor: '#0e1a3d', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  circleActive:{ borderColor: '#3b6fe0', backgroundColor: '#173066' },
  num:         { color: '#cbd5e1', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  numActive:   { color: '#fff' },
  line:        { width: 44, height: 1, backgroundColor: '#1e3a8a' },
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
            <ChevronLeft size={26} color={aC.isDark ? '#C9C6D0' : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Apply</Text>
          <View style={{ width: 36 }} />
        </View>

        <StepIndicator activeStep={3} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { backgroundColor: aC.bg }]} keyboardShouldPersistTaps="handled">
          <View style={[s.card, aC.isDark ? { backgroundColor: '#010A1F', borderColor: '#82a5d5', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 } : { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)', shadowColor: 'rgba(3,42,105,0.12)', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }]}>
            {aC.isDark ? (
              <SavedCardEffect />
            ) : (
              <>

              </>
            )}
            <Text style={[s.cardTitle, { color: aC.isDark ? '#fff' : '#010a1f' }]}>Applicant</Text>

            <Text style={[s.label, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Employment type</Text>
            <View style={s.chipWrap}>
              {EMPLOYMENT_TYPES.map(type => {
                const selected = employmentType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setEmploymentType(type)}
                    activeOpacity={0.75}
                    style={[s.chip, { backgroundColor: aC.isDark ? '#0B2254' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', borderWidth: aC.isDark ? 0 : 1, shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.06)', shadowOpacity: aC.isDark ? 0 : 0.05, elevation: aC.isDark ? 0 : 1 }, selected && { backgroundColor: aC.isDark ? '#0A1838' : '#f1f5f9', borderColor: aC.isDark ? '#8FAEE3' : '#032a69', borderWidth: 1 }, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}
                  >
                    {selected && aC.isDark && <RingGlow radius={8} peak={0.5} rings={6} />}
                    <Text style={[s.chipTxt, { color: aC.isDark ? '#F2F1F5' : '#475569' }, selected && { color: aC.isDark ? '#fff' : '#010a1f' }]}>{type}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[s.label, { marginTop: 14, color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Monthly income</Text>
            <View style={[s.inputWrap, { backgroundColor: aC.isDark ? '#0B2254' : '#E8EAEF', borderColor: aC.isDark ? 'transparent' : 'rgba(0,0,0,0.18)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 1, overflow: 'hidden' }, !aC.isDark && { borderColor: 'rgba(0,0,0,0.18)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
              {aC.isDark ? null : (
                <>

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
            <LinearGradient colors={(aC.isDark ? PRIMARY_BTN_COLORS : ['#27467F', '#8C6A78', '#FF9654']) as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Text style={s.continueTxt}>Continue</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#010A1F' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 6, paddingBottom: 0 },
  backBtn: { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontFamily: 'Poppins_500Medium' },
  scroll: { paddingHorizontal: 14, paddingBottom: 16 },
  card:      { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12, overflow: 'hidden' },
  cardTitle: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_500Medium', marginBottom: 4 },
  label:  { color: '#C9D4EC', fontSize: 13.5, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
  chipWrap:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip:           { height: 40, paddingHorizontal: 12, borderRadius: 8, minWidth: 96, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  chipSelected:   { borderWidth: 1, borderColor: '#5B8EE0', backgroundColor: '#12295C' },
  chipTxt:        { color: '#C9D4EC', fontSize: 11.5, fontFamily: 'Poppins_500Medium' },
  chipTxtSelected:{ color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  inputWrap: { height: 50, borderRadius: 8, borderWidth: 1, justifyContent: 'center', overflow: 'hidden' },
  input:     { paddingHorizontal: 14, color: '#fff', fontSize: 12.5, fontFamily: 'Poppins_500Medium' },
  footer:      { paddingHorizontal: 14, paddingBottom: 36, paddingTop: 10 },
  continueBtn: { height: 50, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  continueTxt: { color: '#EDEBF0', fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
});
