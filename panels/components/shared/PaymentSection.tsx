import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { payWithSafePayCard } from '@/hooks/useSafePay';
import { useRouter } from 'expo-router';

export type PayMethod = 'card' | 'jazzcash' | 'easypaisa';

interface Props {
  price: number;
  description?: string;
  loading?: boolean;
  onPay: (method: PayMethod) => void;
  /** Optional: custom pay button label (no lock icon / amount) */
  payLabel?: string;
  /** Optional: content rendered between the methods and the pay button */
  beforePayButton?: React.ReactNode;
}

export default function PaymentSection({
  price,
  description = 'Payment',
  loading = false,
  onPay,
  payLabel,
  beforePayButton,
}: Props) {
  const aC = useAppColors();
  const { token } = useAuth();
  const router = useRouter();
  const [method, setMethod] = useState<PayMethod>('card');
  const [cardBusy, setCardBusy] = useState(false);
  const [walletNumbers, setWalletNumbers] = useState({ jazzcash: '', easypaisa: '' });
  const displayAmount = price >= 10_000_000
    ? `${Number((price / 10_000_000).toFixed(2))} Crore`
    : price >= 100_000
      ? `${Number((price / 100_000).toFixed(2))} Lac`
      : price.toLocaleString();
  const formattedPrice = `PKR ${displayAmount}`;

  return (
    <View style={s.wrapper}>

      <Text style={[s.sectionTitle, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Select Payment Method</Text>

      {/* Credit / Debit Card */}
      <View
        style={[s.methodCard, { backgroundColor: aC.isDark ? '#010817' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }, method === 'card' && (aC.isDark ? s.methodCardActive : { borderColor: '#e2671b', backgroundColor: 'rgba(226,103,27,0.06)' })]}
      >
        {aC.isDark ? (
          <>
            <LinearGradient colors={['#16408880', '#0D255480', '#00000001', '#00000001', '#0D255480', '#16408880']} locations={[0, 0.08, 0.22, 0.78, 0.92, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['#16408880', '#0D255480', '#00000001', '#00000001', '#0D255480', '#16408880']} locations={[0, 0.04, 0.12, 0.88, 0.96, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            {method === 'card' && <>
              <LinearGradient colors={['rgba(22,64,136,0.3)', 'rgba(0,0,0,0.36)', 'rgba(0,0,0,0.36)', 'rgba(22,64,136,0.3)']} locations={[0, 0.15, 0.85, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(22,64,136,0.26)', 'rgba(0,0,0,0.34)', 'rgba(0,0,0,0.34)', 'rgba(22,64,136,0.26)']} locations={[0, 0.1, 0.9, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            </>}
          </>
        ) : (
          <>
            <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        )}
        <TouchableOpacity activeOpacity={0.85} onPress={() => setMethod('card')} disabled={loading} style={s.methodTop}>
          <View style={[s.radio, { borderColor: aC.isDark ? '#baacb6' : 'rgba(3,42,105,0.18)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }, method === 'card' && s.radioActive]}>
            {method === 'card' && <View style={s.radioRing}><View style={s.radioDot} /></View>}
          </View>
          <View style={s.cardLogos}>
            <Image source={require('../../assets/images/visaCard.png')} style={s.visaLogo} resizeMode="contain" />
            <View style={[s.mcCircle, { backgroundColor: '#EB001B', marginRight: -8 }]} />
            <View style={[s.mcCircle, { backgroundColor: '#F79E1B' }]} />
          </View>
          <Text style={[s.methodLabel, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Credit / Debit Card</Text>
        </TouchableOpacity>
      </View>

      {/* JazzCash */}
      <View
        style={[s.methodCard, s.walletCard, { backgroundColor: aC.isDark ? '#010817' : '#ffffff', borderColor: aC.isDark ? 'rgba(155,191,248,0.72)' : 'rgba(3,42,105,0.12)' }, method === 'jazzcash' && (aC.isDark ? s.methodCardActive : { borderColor: '#e2671b', backgroundColor: 'rgba(226,103,27,0.06)' })]}
      >
        {aC.isDark ? (
          <>
            <LinearGradient colors={['#16408880', '#0D255480', '#00000001', '#00000001', '#0D255480', '#16408880']} locations={[0, 0.08, 0.22, 0.78, 0.92, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['#16408880', '#0D255480', '#00000001', '#00000001', '#0D255480', '#16408880']} locations={[0, 0.04, 0.12, 0.88, 0.96, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        ) : (
          <>
            <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        )}
        <TouchableOpacity activeOpacity={0.85} onPress={() => setMethod('jazzcash')} disabled={loading} style={s.methodTop}>
          <View style={[s.radio, s.walletRadio, { borderColor: aC.isDark ? '#c2bdc7' : 'rgba(3,42,105,0.18)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }, method === 'jazzcash' && s.radioActive]}>
            {method === 'jazzcash' && <View style={s.radioRing}><View style={s.radioDot} /></View>}
          </View>
          <Image source={require('../../assets/images/jazzCashIcon.png')} style={s.jazzLogo} resizeMode="contain" />
          <Text style={[s.walletLabel, { color: aC.isDark ? '#baacb6' : '#010a1f' }]}>JazzCash</Text>
        </TouchableOpacity>
        {method === 'jazzcash' && (
          <View style={s.walletFields}>
            <Text style={s.fieldLabel}>JazzCash Mobile Number:</Text>
            <TextInput
              style={s.walletInput}
              placeholder="03XX XXXXXXX"
              placeholderTextColor="#c7cbd5"
              keyboardType="phone-pad"
              maxLength={11}
              value={walletNumbers.jazzcash}
              onChangeText={value => setWalletNumbers(current => ({ ...current, jazzcash: value.replace(/\D/g, '') }))}
              editable={!loading}
            />
          </View>
        )}
      </View>

      {/* Easypaisa */}
      <View
        style={[s.methodCard, s.walletCard, { backgroundColor: aC.isDark ? '#010817' : '#ffffff', borderColor: aC.isDark ? 'rgba(155,191,248,0.72)' : 'rgba(3,42,105,0.12)' }, method === 'easypaisa' && (aC.isDark ? s.methodCardActive : { borderColor: '#e2671b', backgroundColor: 'rgba(226,103,27,0.06)' })]}
      >
        {aC.isDark ? (
          <>
            <LinearGradient colors={['#16408880', '#0D255480', '#00000001', '#00000001', '#0D255480', '#16408880']} locations={[0, 0.08, 0.22, 0.78, 0.92, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['#16408880', '#0D255480', '#00000001', '#00000001', '#0D255480', '#16408880']} locations={[0, 0.04, 0.12, 0.88, 0.96, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        ) : (
          <>
            <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        )}
        <TouchableOpacity activeOpacity={0.85} onPress={() => setMethod('easypaisa')} disabled={loading} style={s.methodTop}>
          <View style={[s.radio, s.walletRadio, { borderColor: aC.isDark ? '#c2bdc7' : 'rgba(3,42,105,0.18)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }, method === 'easypaisa' && s.radioActive]}>
            {method === 'easypaisa' && <View style={s.radioRing}><View style={s.radioDot} /></View>}
          </View>
          <Image source={require('../../assets/images/easyPaisaIcon.png')} style={s.walletLogo} resizeMode="contain" />
          <Text style={[s.walletLabel, { color: aC.isDark ? '#baacb6' : '#010a1f' }]}>Easypaisa</Text>
        </TouchableOpacity>
        {method === 'easypaisa' && (
          <View style={s.walletFields}>
            <Text style={s.fieldLabel}>Easypaisa Mobile Number:</Text>
            <TextInput
              style={s.walletInput}
              placeholder="03XX XXXXXXX"
              placeholderTextColor="#c7cbd5"
              keyboardType="phone-pad"
              maxLength={11}
              value={walletNumbers.easypaisa}
              onChangeText={value => setWalletNumbers(current => ({ ...current, easypaisa: value.replace(/\D/g, '') }))}
              editable={!loading}
            />
          </View>
        )}
      </View>

      {beforePayButton}

      {/* Pay Button */}
      <TouchableOpacity
        activeOpacity={0.87}
        style={[s.payBtnWrap, (loading || cardBusy) && { opacity: 0.7 }]}
        onPress={async () => {
          if (method !== 'card') { onPay(method); return; }
          // Credit/debit card → real SafePay checkout (.env credentials)
          if (cardBusy || loading) return;
          setCardBusy(true);
          try {
            const paid = await payWithSafePayCard(price, description, token);
            if (paid) onPay('card');
            else router.push({ pathname: '/vehicle/payment-failed', params: { title: description, price: String(price) } } as any);
          } catch (err: any) {
            router.push({ pathname: '/vehicle/payment-failed', params: { title: description, price: String(price) } } as any);
          } finally {
            setCardBusy(false);
          }
        }}
        disabled={loading || cardBusy}
      >
        <LinearGradient colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.payBtn}>
          {(loading || cardBusy)
            ? <ActivityIndicator color="#fff" size="small" />
            : payLabel
              ? <Text style={s.payTxt}>{payLabel}</Text>
              : <>
                  <Ionicons name="lock-closed" size={16} color="#fff" />
                  <Text style={s.payTxt}>Pay {formattedPrice}</Text>
                </>
          }
        </LinearGradient>
      </TouchableOpacity>

      {/* <Text style={[s.secureTxt, { color: aC.isDark ? '#baacb6' : '#64748b' }]}>🔒 Secured by SafePay</Text> */}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { gap: 10 },

  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(3,12,40,0.6)', borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  summaryLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: '#baacb6' },
  summaryPrice: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#e2671b' },

  sectionTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: '#f9fafc', marginTop: 4, marginBottom: 4 },

  methodCard: {
    minHeight: 54, borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)',
    backgroundColor: 'rgba(3,12,40,0.6)',
    paddingHorizontal: 19, paddingVertical: 18, overflow: 'hidden',
    justifyContent: 'center',
  },
  methodCardActive: { borderColor: 'rgba(155,191,248,0.72)', backgroundColor: '#010817' },
  walletCard: { borderRadius: 25, paddingVertical: 12, paddingHorizontal: 19 },
  methodTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  walletRadio: { width: 21, height: 21, borderRadius: 11 },

  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: '#baacb6',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  radioActive: { width: 30, height: 30, borderRadius: 15, borderColor: '#7898c8', backgroundColor: '#102e62' },
  radioRing: { width: 17, height: 17, borderRadius: 9, backgroundColor: '#6982ad', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#ffffff' },

  cardLogos: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  visaLogo: { width: 36, height: 26, marginRight: 3 },
  walletLogo: { width: 28, height: 28 },
  jazzLogo: { width: 70, height: 28 },
  walletLabel: { color: '#baacb6', fontSize: 14, fontFamily: 'Poppins_500Medium', flex: 1 },
  walletFields: { marginTop: 18, gap: 7, paddingBottom: 4 },
  walletInput: { height: 44, borderRadius: 9, backgroundColor: '#0a2052', color: '#f9fafc', paddingHorizontal: 12, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  visaCircle: { width: 28, height: 18, borderRadius: 3, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  visaText:   { color: '#123A8C', fontSize: 7, fontFamily: 'Poppins_700Bold' },
  mcCircle:   { width: 14, height: 14, borderRadius: 7 },

  logoBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoTxt: { color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold' },

  methodLabel: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#f9fafc', flex: 1 },
  cardFields: { marginTop: 20, gap: 6, paddingBottom: 1 },
  fieldLabel: { color: '#f9fafc', fontSize: 12, fontFamily: 'Poppins_500Medium' },
  fieldBox: { height: 44, borderRadius: 9, backgroundColor: '#0a2052', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldHint: { color: '#c7cbd5', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  cardInput: { flex: 1, minWidth: 0, padding: 0, color: '#f9fafc', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  fieldColumns: { flexDirection: 'row', gap: 10, marginTop: 9 },
  fieldColumn: { flex: 1, gap: 6 },

  payBtnWrap: { borderRadius: 32, overflow: 'hidden', marginTop: 6 },
  payBtn:     { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payTxt:     { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  secureTxt: { textAlign: 'center', fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#baacb6' },
});
