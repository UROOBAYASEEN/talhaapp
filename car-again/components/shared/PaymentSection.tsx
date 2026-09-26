import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppColors } from '@/constants/theme';

export type PayMethod = 'card' | 'jazzcash' | 'easypaisa';

interface Props {
  price: number;
  description?: string;
  loading?: boolean;
  onPay: (method: PayMethod) => void;
}

export default function PaymentSection({
  price,
  description = 'Payment',
  loading = false,
  onPay,
}: Props) {
  const aC = useAppColors();
  const [method, setMethod] = useState<PayMethod>('card');
  const formattedPrice = `PKR ${price.toLocaleString()}`;

  return (
    <View style={s.wrapper}>

      <Text style={[s.sectionTitle, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Select Payment Method</Text>

      {/* Credit / Debit Card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setMethod('card')}
        style={[s.methodCard, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }, method === 'card' && (aC.isDark ? s.methodCardActive : { borderColor: '#e2671b', backgroundColor: 'rgba(226,103,27,0.06)' })]}
        disabled={loading}
      >
        {aC.isDark ? (
          <>
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        ) : (
          <>
            <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        )}
        <View style={s.methodTop}>
          <View style={[s.radio, { borderColor: aC.isDark ? '#baacb6' : 'rgba(3,42,105,0.18)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }, method === 'card' && s.radioActive]}>
            {method === 'card' && <View style={s.radioDot} />}
          </View>
          <View style={s.cardLogos}>
            <View style={s.visaCircle}><Text style={s.visaText}>VISA</Text></View>
            <View style={[s.mcCircle, { backgroundColor: '#EB001B', marginRight: -8 }]} />
            <View style={[s.mcCircle, { backgroundColor: '#F79E1B' }]} />
          </View>
          <Text style={[s.methodLabel, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Credit / Debit Card</Text>
        </View>
      </TouchableOpacity>

      {/* JazzCash */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setMethod('jazzcash')}
        style={[s.methodCard, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }, method === 'jazzcash' && (aC.isDark ? s.methodCardActive : { borderColor: '#e2671b', backgroundColor: 'rgba(226,103,27,0.06)' })]}
        disabled={loading}
      >
        {aC.isDark ? (
          <>
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        ) : (
          <>
            <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        )}
        <View style={s.methodTop}>
          <View style={[s.radio, { borderColor: aC.isDark ? '#baacb6' : 'rgba(3,42,105,0.18)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }, method === 'jazzcash' && s.radioActive]}>
            {method === 'jazzcash' && <View style={s.radioDot} />}
          </View>
          <View style={[s.logoBox, { backgroundColor: '#EF3124' }]}>
            <Text style={s.logoTxt}>JC</Text>
          </View>
          <Text style={[s.methodLabel, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>JazzCash</Text>
        </View>
      </TouchableOpacity>

      {/* Easypaisa */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setMethod('easypaisa')}
        style={[s.methodCard, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }, method === 'easypaisa' && (aC.isDark ? s.methodCardActive : { borderColor: '#e2671b', backgroundColor: 'rgba(226,103,27,0.06)' })]}
        disabled={loading}
      >
        {aC.isDark ? (
          <>
            <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        ) : (
          <>
            <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        )}
        <View style={s.methodTop}>
          <View style={[s.radio, { borderColor: aC.isDark ? '#baacb6' : 'rgba(3,42,105,0.18)', backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }, method === 'easypaisa' && s.radioActive]}>
            {method === 'easypaisa' && <View style={s.radioDot} />}
          </View>
          <View style={[s.logoBox, { backgroundColor: '#00A651' }]}>
            <Text style={s.logoTxt}>ep</Text>
          </View>
          <Text style={[s.methodLabel, { color: aC.isDark ? '#f9fafc' : '#010a1f' }]}>Easypaisa</Text>
        </View>
      </TouchableOpacity>

      {/* Pay Button */}
      <TouchableOpacity
        activeOpacity={0.87}
        style={[s.payBtnWrap, loading && { opacity: 0.7 }]}
        onPress={() => onPay(method)}
        disabled={loading}
      >
        <LinearGradient colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.payBtn}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Ionicons name="lock-closed" size={16} color="#fff" />
                <Text style={s.payTxt}>Pay {formattedPrice}</Text>
              </>
          }
        </LinearGradient>
      </TouchableOpacity>

      <Text style={[s.secureTxt, { color: aC.isDark ? '#baacb6' : '#64748b' }]}>🔒 Secured by SafePay</Text>
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

  sectionTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#f9fafc', marginTop: 4 },

  methodCard: {
    height: 54, borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.5)',
    backgroundColor: 'rgba(3,12,40,0.6)',
    paddingHorizontal: 16, overflow: 'hidden',
    justifyContent: 'center',
  },
  methodCardActive: { borderColor: 'rgba(100,160,255,0.9)', backgroundColor: 'rgba(50,100,200,0.15)' },
  methodTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: '#baacb6',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  radioActive: { borderColor: '#e2671b' },
  radioDot:    { width: 9, height: 9, borderRadius: 5, backgroundColor: '#e2671b' },

  cardLogos: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  visaCircle: { width: 28, height: 18, borderRadius: 3, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  visaText:   { color: '#123A8C', fontSize: 7, fontFamily: 'Poppins_700Bold' },
  mcCircle:   { width: 14, height: 14, borderRadius: 7 },

  logoBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoTxt: { color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold' },

  methodLabel: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#f9fafc', flex: 1 },

  payBtnWrap: { borderRadius: 32, overflow: 'hidden', marginTop: 6 },
  payBtn:     { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payTxt:     { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  secureTxt: { textAlign: 'center', fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#baacb6' },
});
