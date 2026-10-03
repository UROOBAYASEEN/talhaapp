import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileUser, ShieldCheck } from 'lucide-react-native';
import AuthGlowBackground from '@/components/auth/AuthGlowBackground';
import { SavedCardEffect, savedCardOuter } from '@/components/shared/FigmaEffects';
import PaymentSection from '@/components/shared/PaymentSection';

const ORANGE = '#e2671b';
const REGISTRATION_FEE = 5000;
const BENEFITS = ['Activate your account', 'Submit your documents', 'List your vehicles', 'Access all features'];

const PAD_X = 18;

export default function RegistrationPaymentScreen() {
  const router = useRouter();
  const { role, access_token, refresh_token } = useLocalSearchParams<{ role: string; access_token: string; refresh_token: string }>();

  function handlePay() {
    // Same destinations upload-documents used before this screen was added
    if (role === 'individual_seller') { router.replace('/(auth)/account-created' as any); return; }
    router.push({ pathname: '/(auth)/verification-status', params: { role: role || '', access_token: access_token || '', refresh_token: refresh_token || '' } });
  }

  return (
    <AuthGlowBackground>
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.headerLeft} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={26} color="#f9fafc" />
            </TouchableOpacity>
            <Image source={require('@/assets/images/autowizor-logo-text.png')} style={s.logo} resizeMode="contain" />
            <View style={s.headerRight}>
              <Ionicons name="lock-closed" size={10} color="#c7cbd5" />
              <Text style={s.secureTag}>Secure Payment</Text>
            </View>
          </View>

          {/* Heading */}
          <View style={s.hero}>
            <View style={s.heading}>
              <Text style={s.title}>
                {'Complete Your\n'}
                <Text style={{ color: ORANGE }}>Registration</Text>
              </Text>
              <Text style={s.subtitle}>
                Pay a one-time registration fee to activate your AutoWizor account and submit your documents.
              </Text>
            </View>
          </View>

          {/* Fee card */}
          <View style={[savedCardOuter, s.feeCard]}>
            <SavedCardEffect band={22} />
            <View style={s.feeLeft}>
              <View style={s.feeIcon}>
                <FileUser size={26} color="#3b82f6" />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={s.feeLabel}>Registration Fee</Text>
                <Text style={s.feeAmount} numberOfLines={1} adjustsFontSizeToFit>PKR {REGISTRATION_FEE.toLocaleString()}</Text>
                <Text style={s.feeNote}>One-time payment</Text>
              </View>
            </View>
            <View style={s.feeDivider} />
            <View style={s.benefits}>
              {BENEFITS.map(b => (
                <View key={b} style={s.benefitRow}>
                  <Ionicons name="checkmark" size={14} color={ORANGE} />
                  <Text style={s.benefitTxt} numberOfLines={1}>{b}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 22 }} />

          <PaymentSection
            price={REGISTRATION_FEE}
            description="Registration Fee"
            payLabel={`Pay Now  PKR ${REGISTRATION_FEE.toLocaleString()}`}
            onPay={handlePay}
          />

          <View style={s.secureRow}>
            <ShieldCheck size={16} color="#baacb6" />
            <Text style={s.secureTxt}>Your payment information is secure and encrypted.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuthGlowBackground>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: PAD_X, paddingBottom: 40 },


  header: { height: 44, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  headerLeft: { position: 'absolute', left: 0, padding: 4, zIndex: 1 },
  headerRight: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'center', gap: 3 },
  logo: { width: 118, height: 24 },
  secureTag: { color: '#c7cbd5', fontSize: 9, fontFamily: 'Poppins_400Regular' },

  hero: { marginTop: 28, marginBottom: 26 },
  heading: { width: '100%' },
  title: { color: '#ffffff', fontSize: 32, lineHeight: 42, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.2 },
  subtitle: { color: '#d4cfe0', fontSize: 14, lineHeight: 22, fontFamily: 'Poppins_400Regular', marginTop: 12, maxWidth: 330 },

  feeCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 14, borderColor: '#3b6fd1' },
  feeLeft: { flex: 1.15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  feeIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#0a1a3d', borderWidth: 1, borderColor: 'rgba(100,160,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  feeLabel: { color: '#f9fafc', fontSize: 12, fontFamily: 'Poppins_500Medium' },
  feeAmount: { color: '#f9fafc', fontSize: 22, fontFamily: 'Poppins_700Bold', marginVertical: 2 },
  feeNote: { color: '#baacb6', fontSize: 11, fontFamily: 'Poppins_400Regular' },
  feeDivider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(100,160,255,0.3)', marginHorizontal: 10 },
  benefits: { flex: 1, gap: 7 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  benefitTxt: { flexShrink: 1, color: '#f9fafc', fontSize: 9.5, fontFamily: 'Poppins_400Regular' },

  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18 },
  secureTxt: { color: '#baacb6', fontSize: 11, fontFamily: 'Poppins_400Regular' },
});
