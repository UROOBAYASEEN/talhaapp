import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronLeft } from 'lucide-react-native';
import { API_BASE } from '@/constants/api';
import { useAppColors } from '@/constants/theme';
import { PRIMARY_BTN_COLORS, SavedCardEffect } from '@/components/shared/FigmaEffects';

const ORANGE = '#e2671b';

const DOWN_PAYMENTS = ['15%', '20%', '25%', '30%', '50%'];
const TENURES       = ['1 Year', '2 Years', '3 Years', '4 Years', '5 Years', '7 Years'];

type Bank = {
  id: string; name: string; product_name: string;
  bank_type: string; markup_type: string; avg_markup: string;
};

function GlassInset() {
  const aC = useAppColors();
  if (!aC.isDark) {
    return (
      <>
        <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
        <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      </>
    );
  }
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

function Dropdown({ value, onChange, options, loading }: {
  value: string; onChange: (v: string) => void; options: string[]; loading?: boolean;
}) {
  const aC = useAppColors();
  const [open, setOpen] = useState(false);
  return (
    <View style={[s.ddWrap, { zIndex: open ? 99 : 1 }]}>
      <TouchableOpacity
        style={[s.ddBtn, { backgroundColor: aC.isDark ? '#0B2254' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2, overflow: 'hidden' }]}
        onPress={() => setOpen(!open)} activeOpacity={0.85}
      >
        {!aC.isDark && <GlassInset />}
        {loading
          ? <ActivityIndicator size="small" color={ORANGE} style={{ marginRight: 8 }} />
          : null
        }
        <Text style={[s.ddVal, { color: aC.isDark ? '#fff' : '#010a1f' }]} numberOfLines={1}>{value}</Text>
        <ChevronDown size={18} color={ORANGE} />
      </TouchableOpacity>
      {open && (
        <View style={[s.ddList, { backgroundColor: aC.isDark ? 'rgba(9,24,66,0.99)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.12, shadowRadius: 12, elevation: aC.isDark ? 0 : 8 }]}>
          {aC.isDark ? (
            <>
              <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          ) : (
            <>
              <LinearGradient colors={['rgba(3,42,105,0.03)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.7 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
            </>
          )}
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[s.ddOption, { borderBottomColor: aC.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.06)' }, value === opt && { backgroundColor: aC.isDark ? 'rgba(226,103,27,0.1)' : 'rgba(226,103,27,0.08)' }]}
              onPress={() => { onChange(opt); setOpen(false); }}
            >
              <Text style={[s.ddOptTxt, { color: value === opt ? ORANGE : (aC.isDark ? '#fff' : '#010a1f') }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const aC = useAppColors();
  return (
    <View style={s.field}>
      <Text style={[s.fieldLabel, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>{label}</Text>
      {children}
    </View>
  );
}

function RateOption({ label, selected, onSelect }: {
  label: string; selected: boolean; onSelect: () => void;
}) {
  const aC = useAppColors();
  return (
    <TouchableOpacity
      style={[s.rateBtn, { backgroundColor: aC.isDark ? '#0B2254' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }, selected && !aC.isDark && { borderColor: 'rgba(226,103,27,0.5)', backgroundColor: 'rgba(226,103,27,0.08)' }]}
      onPress={onSelect} activeOpacity={0.85}
    >
      {selected && !aC.isDark && <GlassInset />}
      <View style={[s.radioCircle, { borderColor: aC.isDark ? '#E6E4EA' : 'rgba(3,42,105,0.18)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }, selected && s.radioCircleActive]}>
        {selected && <View style={s.radioDot} />}
      </View>
      <Text style={[s.rateTxt, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function FinancingResultsScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const params = useLocalSearchParams<{
    vehicleType?: string; condition?: string; city?: string; brand?: string;
    carModel?: string; variant?: string; color?: string; year?: string;
    price?: string; dealership?: string;
  }>();

  const [banks,       setBanks]       = useState<Bank[]>([]);
  const [banksLoading,setBanksLoading]= useState(true);
  const [selectedBank,setSelectedBank]= useState<Bank | null>(null);
  const [price,       setPrice]       = useState(params.price || '5350000');
  const [downPayment, setDownPayment] = useState('20%');
  const [rateType,    setRateType]    = useState('variable');
  const [tenure,      setTenure]      = useState('5 Years');

  useEffect(() => {
    fetch(`${API_BASE}/financing/banks`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Bank[]) => {
        setBanks(data);
        if (data.length > 0) setSelectedBank(data[0]);
      })
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, []);

  function formatPrice(raw: string) {
    const digits = raw.replace(/\D/g, '');
    return digits ? `Rs ${Number(digits).toLocaleString('en-PK')}` : '';
  }

  function handleCalculate() {
    const tenureYears = parseInt(tenure.replace(/\D/g, '')) || 5;
    const downPct     = parseInt(downPayment.replace('%', '')) || 20;
    router.push({
      pathname: '/financing-compare' as any,
      params: {
        ...params,
        price,
        downPct:     String(downPct),
        rateType,
        tenureYears: String(tenureYears),
        bankId:      selectedBank?.id || '',
      },
    });
  }

  const bankLabels  = banks.map(b => `${b.name} - ${b.product_name}`);
  const selectedLbl = selectedBank ? `${selectedBank.name} - ${selectedBank.product_name}` : 'Loading banks...';

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: aC.bg }}>

        <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <ChevronLeft size={26} color={aC.isDark ? '#C9C6D0' : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Finance Calculator</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { backgroundColor: aC.bg }]} keyboardShouldPersistTaps="handled" style={{ backgroundColor: aC.bg }}>
          <View style={[s.card, aC.isDark
            ? { backgroundColor: '#010A1F', borderColor: '#82a5d5', shadowColor: '#638ed0', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 }
            : { backgroundColor: '#ffffff', borderColor: 'rgba(3,42,105,0.12)', shadowColor: 'rgba(3,42,105,0.12)', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }]}>
            {aC.isDark ? (
              <SavedCardEffect />
            ) : (
              <>
                <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(226,103,27,0.06)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              </>
            )}

            {/* Bank — from API */}
            <Field label="Bank">
              <Dropdown
                value={selectedLbl}
                loading={banksLoading}
                onChange={label => {
                  const b = banks.find(b => `${b.name} - ${b.product_name}` === label);
                  if (b) setSelectedBank(b);
                }}
                options={bankLabels}
              />
            </Field>

            {/* Vehicle Price */}
            <Field label="Vehicle price">
              <View style={[s.inputWrap, { backgroundColor: aC.isDark ? '#0B2254' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2 }]}>
                {!aC.isDark && <GlassInset />}
                <TextInput
                  style={[s.input, { color: aC.isDark ? '#fff' : '#010a1f' }]}
                  inputMode="numeric"
                  placeholder="Rs 0"
                  placeholderTextColor={aC.isDark ? '#64748b' : '#94a3b8'}
                  value={formatPrice(price)}
                  onChangeText={v => setPrice(v.replace(/\D/g, ''))}
                />
              </View>
            </Field>

            {/* Down Payment */}
            <Field label="Down payment">
              <Dropdown value={downPayment} onChange={setDownPayment} options={DOWN_PAYMENTS} />
            </Field>

            {/* Rate Type */}
            <View style={s.rateRow}>
              <RateOption label="Variable" selected={rateType === 'variable'} onSelect={() => setRateType('variable')} />
              <RateOption label="Fixed"    selected={rateType === 'fixed'}    onSelect={() => setRateType('fixed')} />
            </View>

            {/* Tenure */}
            <Field label="Tenure">
              <Dropdown value={tenure} onChange={setTenure} options={TENURES} />
            </Field>

            {/* Markup info from real bank (Figma: under Tenure) */}
            {selectedBank && (
              <View style={s.infoRow}>
                {/* <Text style={[s.infoTxt, { color: aC.isDark ? '#94a3b8' : '#475569' }]}>Type: <Text style={[s.infoVal, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{selectedBank.bank_type}</Text></Text> */}
                <Text style={[s.infoTxt, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Markup type: <Text style={[s.infoVal, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{selectedBank.markup_type}</Text></Text>
                <Text style={[s.infoTxt, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Avg markup: <Text style={[s.infoVal, { color: aC.isDark ? '#fff' : '#010a1f' }]}>{selectedBank.avg_markup}</Text></Text>
              </View>
            )}
          </View>
          <View style={{ height: 16 }} />
        </ScrollView>

        <View style={[s.footer, { backgroundColor: aC.bg, borderTopColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', borderTopWidth: aC.isDark ? 0 : 1 }]}>
          <TouchableOpacity style={s.calcBtn} onPress={handleCalculate} activeOpacity={0.88}>
            <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Text style={s.calcTxt}>Calculate & Compare Banks</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#010A1F' },
  scroll: { paddingHorizontal: 14, paddingBottom: 16 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 6, paddingBottom: 12 },
  backBtn:     { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontFamily: 'Poppins_500Medium' },
  card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12, overflow: 'hidden' },
  field:      { marginBottom: 12, zIndex: 1 },
  fieldLabel: { color: '#cbd5e1', fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 6 },
  ddWrap:        { zIndex: 1 },
  ddBtn:         { height: 44, borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, overflow: 'hidden' },
  ddVal:         { color: '#fff', fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1 },
  ddList:        { position: 'absolute', top: 48, left: 0, right: 0, backgroundColor: 'rgba(9,24,66,0.99)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)', overflow: 'hidden', zIndex: 100 },
  ddOption:      { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  ddOptionActive:{ backgroundColor: 'rgba(226,103,27,0.1)' },
  ddOptTxt:      { color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  inputWrap: { height: 44, borderRadius: 8, borderWidth: 1, overflow: 'hidden', justifyContent: 'center' },
  input:     { paddingHorizontal: 12, color: '#fff', fontSize: 12, fontFamily: 'Poppins_500Medium' },
  rateRow:           { flexDirection: 'row', gap: 12, marginBottom: 12 },
  rateBtn:           { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, height: 44, overflow: 'hidden' },
  rateBtnActive:     { borderColor: 'rgba(226,103,27,0.5)', backgroundColor: '#16234a' },
  rateTxt:           { color: '#fff', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  radioCircle:       { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioCircleActive: { borderColor: '#fff' },
  radioDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 2 },
  infoTxt: { color: '#94a3b8', fontSize: 11, fontFamily: 'Poppins_400Regular' },
  infoVal: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  footer:  { paddingHorizontal: 14, paddingBottom: 36, paddingTop: 10 },
  calcBtn: { height: 50, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  calcTxt: { color: '#EDEBF0', fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
});
