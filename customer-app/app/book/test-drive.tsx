// Figma: Book Test Drive
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { G, Glass, GlassField, GlassSelect, GlowBackground, GradientButton, ScreenHeader } from '@/components/shared/GlowUI';
import { authHeaders, VehicleStrip } from '@/components/book/common';

const SLOTS = ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '12:00 PM - 01:00 PM', '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM', '05:00 PM - 06:00 PM'];

const fmtDay = (d: Date) => `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function BookTestDrive() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth() as any;

  const [v, setV] = useState<any>(null);
  const [date, setDate] = useState(new Date());
  const [iosPicker, setIosPicker] = useState(false);
  const [slot, setSlot] = useState(SLOTS[2]);
  const [slotOpen, setSlotOpen] = useState(false);
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/vehicles/${id}`, { headers: authHeaders(token) });
        if (res.ok) setV(await res.json());
      } catch { }
    })();
  }, [id]);

  function openDate() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: date, mode: 'date', minimumDate: new Date(), onChange: (e, d) => { if (e.type === 'set' && d) setDate(d); } });
    } else setIosPicker(true);
  }

  async function book() {
    if (!name.trim())  { Alert.alert('Required', 'Please enter your name.'); return; }
    if (!phone.trim()) { Alert.alert('Required', 'Please enter your phone number.'); return; }
    if (!token) { Alert.alert('Login Required', 'Please login to book a test drive.'); return; }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}/test-drive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ preferred_date: isoDay(date), preferred_time: slot, full_name: name.trim(), phone: phone.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { Alert.alert('Error', d.detail || 'Could not book test drive.'); return; }
      router.replace({ pathname: '/book/test-drive-success', params: { id: String(id) } } as any);
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setBusy(false); }
  }

  return (
    <GlowBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Book Test Drive" onClose={() => router.back()} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
            <VehicleStrip v={v} chevron onPress={() => router.back()} />

            <Text style={s.label}>Select Date</Text>
            <GlassSelect value={fmtDay(date)} onPress={openDate} right={<Ionicons name="calendar-outline" size={24} color="#E6E1E8" />} />

            <Text style={s.label}>Select Time</Text>
            <GlassSelect value={slot} onPress={() => setSlotOpen(o => !o)} right={<Ionicons name={slotOpen ? 'chevron-up' : 'chevron-down'} size={22} color="#E6E1E8" />} />
            {slotOpen && (
              <View style={s.list}>
                <Glass radius={18} blur={12} />
                {SLOTS.map(t => (
                  <TouchableOpacity key={t} style={s.opt} onPress={() => { setSlot(t); setSlotOpen(false); }}>
                    <Text style={[s.optTxt, t === slot && { color: G.orange }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={s.label}>Your Name</Text>
            <GlassField value={name} onChangeText={setName} placeholder="Your name" />

            <Text style={s.label}>Phone Number</Text>
            <GlassField value={phone} onChangeText={setPhone} placeholder="+92 3XX XXXXXXX" keyboardType="phone-pad" />

            <View style={s.note}>
              <LinearGradient colors={['#5A6272', '#3A4152']} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="clipboard-outline" size={20} color={G.orange} />
              <Text style={s.noteTxt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Dealer will confirm your test drive appointment.</Text>
            </View>
          </ScrollView>
          <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 12) + 8 }}>
            <GradientButton title="Book Test Drive" height={50} fontSize={18} loading={busy} onPress={book} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {Platform.OS === 'ios' && (
        <Modal visible={iosPicker} transparent animationType="fade" onRequestClose={() => setIosPicker(false)}>
          <Pressable style={s.overlay} onPress={() => setIosPicker(false)}>
            <Pressable style={s.pickerCard}>
              <DateTimePicker value={date} mode="date" display="inline" minimumDate={new Date()} themeVariant="dark" accentColor={G.orange}
                onChange={(_, d) => { if (d) setDate(d); }} />
              <GradientButton title="Done" height={44} onPress={() => setIosPicker(false)} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </GlowBackground>
  );
}

const s = StyleSheet.create({
  label:      { color: G.muted, fontSize: 15, fontFamily: 'Poppins_400Regular', marginTop: 16, marginBottom: 8 },
  list:       { marginTop: 8, borderRadius: 18, overflow: 'hidden', paddingVertical: 6 },
  opt:        { paddingHorizontal: 22, paddingVertical: 9 },
  optTxt:     { color: G.white, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  note:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)', overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 22 },
  noteTxt:    { flex: 1, color: '#E6E1E8', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  pickerCard: { backgroundColor: '#0A1430', borderRadius: 20, padding: 12, gap: 10, borderWidth: 1, borderColor: 'rgba(163,184,226,0.5)' },
});
