// Figma: Book vehicle — reservation details
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { G, GlassField, GlowBackground, GradientButton, ScreenHeader } from '@/components/shared/GlowUI';
import { authHeaders, sellerName, VehicleStrip } from '@/components/book/common';

function fmtCnic(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export default function BookReserve() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, variantName } = useLocalSearchParams<{ id: string; variantName?: string }>();
  const { token, user } = useAuth() as any;
  const [v, setV] = useState<any>(null);
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [cnic, setCnic] = useState(user?.cnic || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/vehicles/${id}`, { headers: authHeaders(token) });
        if (res.ok) setV(await res.json());
      } catch { }
    })();
  }, [id]);

  async function submit() {
    if (!name.trim())  { Alert.alert('Required', 'Please enter customer name.'); return; }
    if (!phone.trim()) { Alert.alert('Required', 'Please enter phone number.'); return; }
    if (cnic.replace(/\D/g, '').length !== 13) { Alert.alert('Required', 'Please enter a valid CNIC (13 digits).'); return; }
    if (!token) { Alert.alert('Login Required', 'Please login to book a vehicle.'); return; }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ variant_name: variantName || v?.variant, full_name: name.trim(), phone: phone.trim(), cnic, city: v?.city }),
      });
      const d = await res.json();
      if (!res.ok) { Alert.alert('Error', d.detail || 'Could not book vehicle.'); return; }
      router.replace({
        pathname: '/book/booked',
        params: { bookingId: d.reservation_id || '', vehicle: v?.title || '', dealer: sellerName(v), date: new Date().toISOString() },
      } as any);
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setBusy(false); }
  }

  return (
    <GlowBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Book vehicle" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
            <VehicleStrip v={v} warm />
            <Text style={s.h}>Reservation Details</Text>
            <Text style={s.label}>Customer Name</Text>
            <GlassField value={name} onChangeText={setName} placeholder="Customer name" />
            <Text style={s.label}>Phone Number</Text>
            <GlassField value={phone} onChangeText={setPhone} placeholder="+92 3XX XXXXXXX" keyboardType="phone-pad" />
            <Text style={s.label}>CNIC</Text>
            <GlassField value={cnic} onChangeText={t => setCnic(fmtCnic(t))} placeholder="12345-1234567-1" keyboardType="number-pad" />
          </ScrollView>
          <View style={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 12) + 8 }}>
            <GradientButton title="Continue" height={50} loading={busy} onPress={submit} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GlowBackground>
  );
}

const s = StyleSheet.create({
  h:     { color: G.white, fontSize: 16, fontFamily: 'Poppins_500Medium', marginTop: 26, marginBottom: 4 },
  label: { color: G.muted, fontSize: 15, fontFamily: 'Poppins_400Regular', marginTop: 14, marginBottom: 8 },
});
