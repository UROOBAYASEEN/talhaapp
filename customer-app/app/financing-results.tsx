import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Check, ChevronDown, ChevronLeft, X } from 'lucide-react-native';
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

function Dropdown({ value, onChange, options, loading, title }: {
  value: string; onChange: (v: string, index: number) => void; options: string[]; loading?: boolean; title?: string;
}) {
  const aC = useAppColors();
  const [open, setOpen] = useState(false);
  return (
    <View style={[s.ddWrap, { zIndex: open ? 99 : 1 }]}>
      <TouchableOpacity
        style={[s.ddBtn, { backgroundColor: aC.isDark ? '#0B2254' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2, overflow: 'hidden' }, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}
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
      {/* Options sheet — Modal mein, taake card ke overflow / zIndex se kat na jaye */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={s.ddOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={[s.ddSheet, { backgroundColor: aC.isDark ? 'rgba(1,6,20,1)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)' }]}>
            {aC.isDark ? (
              <>
                <LinearGradient colors={['rgba(22,64,136,0.35)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(29,83,175,0.35)']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['rgba(13,37,84,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
                <LinearGradient colors={['transparent', 'rgba(13,37,84,0.35)']} start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
              </>
            ) : <GlassInset />}
            <View style={s.ddHead}>
              <Text style={[s.ddTitle, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>{title || 'Select'}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={aC.isDark ? '#BAACB6' : '#475569'} />
              </TouchableOpacity>
            </View>
            {options.length === 0 ? (
              <Text style={[s.ddEmpty, { color: aC.isDark ? '#BAACB6' : '#475569' }]}>{loading ? 'Loading...' : 'No options available'}</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {options.map((opt, i) => {
                  const active = value === opt;
                  return (
                    <TouchableOpacity
                      key={`${opt}-${i}`}
                      style={[s.ddOption, { borderColor: active ? ORANGE : (aC.isDark ? 'rgba(100,160,255,0.25)' : 'rgba(3,42,105,0.1)'), backgroundColor: active ? (aC.isDark ? 'rgba(226,103,27,0.12)' : 'rgba(226,103,27,0.08)') : (aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff') }]}
                      onPress={() => { onChange(opt, i); setOpen(false); }}
                      activeOpacity={0.85}
                    >
                      <Text style={[s.ddOptTxt, { color: active ? ORANGE : (aC.isDark ? '#f9fafc' : '#010a1f') }]} numberOfLines={2}>{opt}</Text>
                      {active && <Check size={16} color={ORANGE} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
      style={[s.rateBtn, { backgroundColor: aC.isDark ? '#0B2254' : '#ffffff', borderColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }, selected && !aC.isDark && { borderColor: 'rgba(226,103,27,0.5)', backgroundColor: 'rgba(226,103,27,0.08)' }, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}
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

              </>
            )}

            {/* Bank — from API */}
            <Field label="Bank">
              <Dropdown
                value={selectedLbl}
                loading={banksLoading}
                onChange={(_label, i) => {
                  const b = banks[i];
                  if (b) setSelectedBank(b);
                }}
                options={bankLabels}
                title="Select Bank"
              />
            </Field>

            {/* Vehicle Price */}
            <Field label="Vehicle price">
              <View style={[s.inputWrap, { backgroundColor: aC.isDark ? '#0B2254' : '#E8EAEF', borderColor: aC.isDark ? 'transparent' : 'rgba(0,0,0,0.18)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, shadowRadius: 8, elevation: aC.isDark ? 0 : 2 }, !aC.isDark && { borderColor: 'rgba(0,0,0,0.18)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
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
              <Dropdown value={downPayment} onChange={setDownPayment} options={DOWN_PAYMENTS} title="Down Payment" />
            </Field>

            {/* Rate Type */}
            <View style={s.rateRow}>
              <RateOption label="Variable" selected={rateType === 'variable'} onSelect={() => setRateType('variable')} />
              <RateOption label="Fixed"    selected={rateType === 'fixed'}    onSelect={() => setRateType('fixed')} />
            </View>

            {/* Tenure */}
            <Field label="Tenure">
              <Dropdown value={tenure} onChange={setTenure} options={TENURES} title="Tenure" />
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
            <LinearGradient colors={(aC.isDark ? PRIMARY_BTN_COLORS : ['#27467F', '#8C6A78', '#FF9654']) as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
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
  ddOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 20 },
  ddSheet:       { maxHeight: '65%', borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6, overflow: 'hidden' },
  ddHead:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  ddTitle:       { fontSize: 16, fontFamily: 'Poppins_500Medium' },
  ddEmpty:       { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingVertical: 20 },
  ddOption:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 46, borderRadius: 23, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 10, marginBottom: 8 },
  ddOptionActive:{ backgroundColor: 'rgba(226,103,27,0.1)' },
  ddOptTxt:      { flex: 1, color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular' },
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
