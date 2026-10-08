import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView,
  Modal, Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import GradientNote from '@/components/shared/GradientNote';
import { PRIMARY_BTN_COLORS, RingGlow, SearchInputEffect } from '@/components/shared/FigmaEffects';

import SheetModal from '@/components/shared/SheetModal';
const BG     = '#010A1F';
const CARD   = 'rgba(3,12,40,0.6)';
const ORANGE = '#e2671b';
const NAVY   = '#032a69';
const WHITE  = '#f9fafc';
const MUTED  = '#baacb6';
const BORDER = 'rgba(255,255,255,0.1)';
const BLUE_B = 'rgba(100,160,255,0.4)';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const AM_SLOTS = [
  '8:00 AM',  '8:30 AM',
  '9:00 AM',  '9:30 AM',
  '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
];
const PM_SLOTS = [
  '12:00 PM', '12:30 PM',
  '1:00 PM',  '1:30 PM',
  '2:00 PM',  '2:30 PM',
  '3:00 PM',  '3:30 PM',
  '4:00 PM',  '4:30 PM',
  '5:00 PM',  '5:30 PM',
  '6:00 PM',  '6:30 PM',
  '7:00 PM',  '7:30 PM',
];

const SERVER_BASE = API_BASE.replace('/api/v1', '');
function imgUrl(url?: string) {
  if (!url || url.startsWith('file://')) return null;
  if (url.startsWith('http')) return url.replace(/http:\/\/[\d.]+:\d+/, SERVER_BASE);
  return `${SERVER_BASE}${url}`;
}
function formatPrice(p: number) {
  if (p >= 10_000_000) return `PKR ${(p / 10_000_000).toFixed(2)} Crore`;
  if (p >= 100_000)    return `PKR ${(p / 100_000).toFixed(2)} Lacs`;
  return `PKR ${p.toLocaleString()}`;
}
// "11:00 AM" → "11:00 AM - 12:00 PM"
function timeRange(t: string) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim());
  if (!m) return t;
  let h = Number(m[1]) % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0);
  h = (h + 1) % 24;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${t} - ${h12}:${m[2]} ${ap}`;
}
function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ── Time Modal ─────────────────────────────────────────────────────────────────
function TimeModal({ visible, selected, onSelect, onClose }: {
  visible: boolean; selected: string;
  onSelect: (t: string) => void; onClose: () => void;
}) {
  function Slot({ time }: { time: string }) {
    const isSel = selected === time;
    return (
      <TouchableOpacity
        style={[tm.slot, isSel && tm.slotSel]}
        onPress={() => { onSelect(time); onClose(); }}
        activeOpacity={0.75}
      >
        {isSel && (
          <LinearGradient colors={[NAVY, ORANGE]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject} />
        )}
        <Text style={[tm.slotTxt, isSel && tm.slotTxtSel]}>{time}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SheetModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={tm.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={tm.container}>
          <LinearGradient colors={['rgba(22,64,136,0.25)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          <LinearGradient colors={['transparent','rgba(29,83,175,0.2)']} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>

          {/* Handle */}
          <View style={tm.handle} />

          <Text style={tm.title}>Select Time</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* AM */}
            <View style={tm.sectionRow}>
              <View style={tm.badge}><Text style={tm.badgeTxt}>AM</Text></View>
              <View style={tm.divider} />
            </View>
            <View style={tm.grid}>
              {AM_SLOTS.map(t => <Slot key={t} time={t} />)}
            </View>

            {/* PM */}
            <View style={[tm.sectionRow, { marginTop: 18 }]}>
              <View style={[tm.badge, { backgroundColor: 'rgba(226,103,27,0.15)', borderColor: ORANGE }]}>
                <Text style={[tm.badgeTxt, { color: ORANGE }]}>PM</Text>
              </View>
              <View style={tm.divider} />
            </View>
            <View style={tm.grid}>
              {PM_SLOTS.map(t => <Slot key={t} time={t} />)}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </SheetModal>
  );
}

const tm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  container:  { backgroundColor: '#010A1F', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, maxHeight: '75%', borderWidth: 1, borderColor: BLUE_B, overflow: 'hidden' },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 },
  title:      { color: WHITE, fontSize: 16, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 16 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  badge:      { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(100,160,255,0.12)', borderWidth: 1, borderColor: BLUE_B },
  badgeTxt:   { color: WHITE, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  divider:    { flex: 1, height: 1, backgroundColor: BORDER },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot:       { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 30, borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' },
  slotSel:    { borderColor: ORANGE },
  slotTxt:    { color: MUTED, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  slotTxtSel: { color: WHITE, fontFamily: 'Poppins_600SemiBold' },
});

// ── Calendar Modal ─────────────────────────────────────────────────────────────
function CalendarModal({ visible, selected, onSelect, onClose }: {
  visible: boolean; selected: string;
  onSelect: (d: string) => void; onClose: () => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initDate  = selected ? new Date(selected) : today;
  const [viewYear,  setViewYear]  = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={cal.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={cal.container}>
          <LinearGradient colors={['rgba(22,64,136,0.25)','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:0.6}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
          <LinearGradient colors={['transparent','rgba(29,83,175,0.2)']} start={{x:0.5,y:0.4}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>

          {/* Month Nav */}
          <View style={cal.navRow}>
            <TouchableOpacity style={cal.navBtn} onPress={prevMonth}>
              <Ionicons name="chevron-back" size={18} color={WHITE} />
            </TouchableOpacity>
            <Text style={cal.monthTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity style={cal.navBtn} onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={18} color={WHITE} />
            </TouchableOpacity>
          </View>

          {/* Day labels */}
          <View style={cal.dayLabels}>
            {DAYS.map(d => (
              <Text key={d} style={cal.dayLabel}>{d}</Text>
            ))}
          </View>

          {/* Date grid */}
          <View style={cal.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`e-${i}`} style={cal.cell} />;

              const cellDate = new Date(viewYear, viewMonth, day);
              cellDate.setHours(0, 0, 0, 0);
              const isPast     = cellDate < today;
              const dateStr    = toDateStr(viewYear, viewMonth, day);
              const isSelected = dateStr === selected;
              const isToday    = cellDate.getTime() === today.getTime();

              return (
                <TouchableOpacity
                  key={`d-${i}`}
                  style={cal.cell}
                  onPress={() => { if (!isPast) { onSelect(dateStr); onClose(); } }}
                  disabled={isPast}
                  activeOpacity={0.75}
                >
                  {isSelected ? (
                    <LinearGradient colors={[NAVY, ORANGE]} start={{x:0,y:0}} end={{x:1,y:1}} style={cal.selectedCircle}>
                      <Text style={cal.selectedDayTxt}>{day}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[cal.circle, isToday && cal.todayCircle]}>
                      <Text style={[cal.dayTxt, isPast && cal.pastTxt, isToday && cal.todayTxt]}>{day}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Close */}
          <TouchableOpacity style={cal.closeBtn} onPress={onClose}>
            <Text style={cal.closeTxt}>Done</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const cal = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  container:     { width: '100%', backgroundColor: '#061629', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: BLUE_B, overflow: 'hidden' },
  navRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn:        { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  monthTitle:    { color: WHITE, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  dayLabels:     { flexDirection: 'row', marginBottom: 6 },
  dayLabel:      { flex: 1, textAlign: 'center', color: MUTED, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  grid:          { flexDirection: 'row', flexWrap: 'wrap' },
  cell:          { width: '14.28%', alignItems: 'center', paddingVertical: 4 },
  circle:        { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  todayCircle:   { backgroundColor: 'rgba(226,103,27,0.15)', borderWidth: 1, borderColor: ORANGE },
  selectedCircle:{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayTxt:        { color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  pastTxt:       { color: 'rgba(255,255,255,0.2)' },
  todayTxt:      { color: ORANGE },
  selectedDayTxt:{ color: WHITE, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  closeBtn:      { marginTop: 16, alignSelf: 'center', paddingHorizontal: 32, paddingVertical: 10, borderRadius: 30, backgroundColor: 'rgba(226,103,27,0.15)', borderWidth: 1, borderColor: ORANGE },
  closeTxt:      { color: ORANGE, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function TestDriveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [vehicle,    setVehicle]    = useState<any>(null);
  const [submitting,     setSubmitting]     = useState(false);
  const [calOpen,        setCalOpen]        = useState(false);
  const [timeModalOpen,  setTimeModalOpen]  = useState(false);

  const [form, setForm] = useState({
    date:  todayStr,
    time:  '11:00 AM',
    name:  (user as any)?.full_name || '',
    phone: (user as any)?.phone     || '',
  });

  useEffect(() => { if (id) loadVehicle(); }, [id]);

  async function loadVehicle() {
    try {
      const h: any = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/vehicles/${id}`, { headers: h });
      if (res.ok) setVehicle(await res.json());
    } catch { }
  }

  function set(field: string) {
    return (val: string) => setForm(f => ({ ...f, [field]: val }));
  }

  async function handleBook() {
    if (!form.name.trim())  { Alert.alert('Required', 'Please enter your name.'); return; }
    if (!form.phone.trim()) { Alert.alert('Required', 'Please enter your phone number.'); return; }
    if (!token) { Alert.alert('Login Required', 'Please login to book a test drive.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}/test-drive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          preferred_date: form.date,
          preferred_time: form.time,
          full_name:      form.name,
          phone:          form.phone,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        router.replace({
          pathname: '/buy/test-drive-success' as any,
          params: {
            title: vehicle?.title || '',
            price: vehicle?.price ? String(vehicle.price) : '',
            photo: vehicle?.images?.[0] || '',
            city:  vehicle?.city || '',
            year:  vehicle?.year ? String(vehicle.year) : '',
            trans: vehicle?.transmission || '',
            id:    String(id || ''),
          },
        });
      } else {
        Alert.alert('Error', d.detail || 'Could not book test drive.');
      }
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setSubmitting(false); }
  }

  const carImg   = vehicle ? imgUrl(vehicle.images?.[0]) : null;
  const carName  = vehicle?.title || '—';
  const carCity  = vehicle?.city  || '—';
  const carYear  = vehicle?.year  || '';
  const carTrans = vehicle?.transmission || '';
  const carPrice = vehicle ? formatPrice(vehicle.price) : '—';

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#C9C6D0" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Book Test Drive</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: 30 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Car Summary Card ── */}
          <TouchableOpacity style={s.carCard} activeOpacity={0.85} onPress={() => router.back()}>
            <RingGlow radius={16} />
            {carImg
              ? <Image source={{ uri: carImg }} style={s.carImg} resizeMode="cover" />
              : <View style={[s.carImg, s.carImgPh]}>
                  <Ionicons name="car-outline" size={24} color={MUTED} />
                </View>
            }
            <View style={{ flex: 1 }}>
              <Text style={s.carName} numberOfLines={1}>{carName}</Text>
              <View style={s.carMeta}>
                <Ionicons name="location-outline" size={15} color="#BAB6C4" />
                <Text style={s.carMetaTxt} numberOfLines={1}>{carCity} • {carYear} • {carTrans}</Text>
              </View>
              <Text style={s.carPrice}>{carPrice}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={ORANGE} />
          </TouchableOpacity>

          {/* ── Select Date ── */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Select Date</Text>
            <TouchableOpacity
              style={s.inputRow}
              onPress={() => { setCalOpen(true); setTimeModalOpen(false); }}
              activeOpacity={0.85}
            >
              <SearchInputEffect />
              <Text style={s.inputTxt}>{formatDisplayDate(form.date)}</Text>
              <Ionicons name="calendar-outline" size={22} color="#E6E4EA" style={{ marginRight: 20 }} />
            </TouchableOpacity>
          </View>

          {/* ── Select Time ── */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Select Time</Text>
            <TouchableOpacity
              style={s.inputRow}
              onPress={() => { setTimeModalOpen(true); setCalOpen(false); }}
              activeOpacity={0.85}
            >
              <SearchInputEffect />
              <Text style={s.inputTxt}>{timeRange(form.time)}</Text>
              <Ionicons name="chevron-down" size={20} color="#E6E4EA" style={{ marginRight: 20 }} />
            </TouchableOpacity>
          </View>

          {/* ── Your Name ── */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Your Name</Text>
            <View style={s.inputRow}>
              <SearchInputEffect />
              <TextInput
                style={s.input}
                value={form.name}
                onChangeText={set('name')}
                placeholder="Enter your name"
                placeholderTextColor={MUTED}
              />
            </View>
          </View>

          {/* ── Phone Number ── */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Phone Number</Text>
            <View style={s.inputRow}>
              <SearchInputEffect />
              <TextInput
                style={s.input}
                value={form.phone}
                onChangeText={set('phone')}
                placeholder="+92 3XX XXXXXXX"
                placeholderTextColor={MUTED}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* ── Info Note ── */}
          <GradientNote
            style={{ marginTop: 30 }}
            icon={<MaterialCommunityIcons name="clipboard-list-outline" size={24} color={ORANGE} />}
            text="Dealer will confirm your test drive appointment."
          />

          <View style={{ flex: 1, minHeight: 60 }} />

          {/* ── Book Button ── */}
          <TouchableOpacity style={s.bookBtn} onPress={handleBook} disabled={submitting} activeOpacity={0.88}>
            <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            {submitting
              ? <ActivityIndicator color={WHITE} />
              : <Text style={s.bookTxt}>Book Test Drive</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Calendar Modal ── */}
      <CalendarModal
        visible={calOpen}
        selected={form.date}
        onSelect={set('date')}
        onClose={() => setCalOpen(false)}
      />

      {/* ── Time Modal ── */}
      <TimeModal
        visible={timeModalOpen}
        selected={form.time}
        onSelect={set('time')}
        onClose={() => setTimeModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 30, backgroundColor: BG },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: '#F2F1F5', fontSize: 20, fontFamily: 'Poppins_500Medium' },

  carCard:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0A1838', borderWidth: 1, borderColor: '#7E9FD6', borderRadius: 16, padding: 8, paddingRight: 12, overflow: 'hidden', shadowColor: '#4F7FD0', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  carImg:     { width: 84, height: 56, borderRadius: 8 },
  carImgPh:   { backgroundColor: '#0d1e3d', alignItems: 'center', justifyContent: 'center' },
  carName:    { color: '#F2F1F5', fontSize: 12.5, fontFamily: 'Poppins_500Medium' },
  carMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  carMetaTxt: { color: '#BAB6C4', fontSize: 12, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  carPrice:   { color: ORANGE, fontSize: 14.5, fontFamily: 'Poppins_500Medium', marginTop: 1 },

  field:      { marginTop: 16 },
  fieldLabel: { color: '#D2CFD8', fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 8 },

  inputRow: {
    height: 50, borderRadius: 32,
    borderWidth: 1, borderColor: '#829fd0',
    backgroundColor: 'rgba(3,12,40,0.6)',
    overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
  },
  inputTxt: { flex: 1, color: '#F2F1F5', fontSize: 14, fontFamily: 'Poppins_400Regular', paddingHorizontal: 20 },
  input:    { flex: 1, color: '#F2F1F5', fontSize: 14, fontFamily: 'Poppins_400Regular', paddingHorizontal: 20 },

  dropdown:      { marginTop: 6, backgroundColor: '#061629', borderRadius: 16, borderWidth: 1, borderColor: BLUE_B, overflow: 'hidden' },
  dropOption:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: BORDER },
  dropOptionTxt: { color: WHITE, fontSize: 14, fontFamily: 'Poppins_400Regular' },

  infoRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 30 },
  infoIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(226,103,27,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoTxt:  { color: '#BAB6C4', fontSize: 12, fontFamily: 'Poppins_400Regular' },

  bookBtn: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bookTxt: { color: '#EDEBF0', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
