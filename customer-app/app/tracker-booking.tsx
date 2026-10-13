import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';
import { PRIMARY_BTN_COLORS, SearchInputEffect } from '@/components/shared/FigmaEffects';

const CITIES   = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];
const CENTERS  = ['DHA Phase 5 Center', 'Gulberg Center', 'Model Town Center', 'Saddar Center'];

function Dropdown({ value, options, onSelect, loading }: {
  value: string; options: string[]; onSelect: (v: string) => void; loading?: boolean;
}) {
  const aC = useAppColors();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ zIndex: open ? 99 : 1 }}>
      <TouchableOpacity style={[s.dropdown, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowOpacity: 0, elevation: aC.isDark ? 0 : 2 }, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]} onPress={() => setOpen(!open)} disabled={loading}>
        {aC.isDark && <SearchInputEffect />}
        {loading
          ? <ActivityIndicator size="small" color="#e2671b" />
          : <Text style={[s.inputText, { color: !value ? '#B7BDCC' : (aC.isDark ? '#F0F2F7' : '#010a1f') }]} numberOfLines={1}>
              {value || 'Select...'}
            </Text>
        }
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={aC.isDark ? "#E9EDF7" : "#64748b"} />
      </TouchableOpacity>
      {open && (
        <View style={[s.dropList, { backgroundColor: aC.isDark ? '#071834' : '#ffffff', borderColor: aC.isDark ? '#5688D4' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 4 }, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
          {options.length === 0
            ? <Text style={[s.dropItemTxt, { padding: 14, color: '#64748b' }]}>No options available</Text>
            : options.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[s.dropItem, { borderBottomColor: aC.isDark ? 'rgba(86,136,212,0.2)' : 'rgba(3,42,105,0.06)' }, value === opt && s.dropItemActive]}
                onPress={() => { onSelect(opt); setOpen(false); }}
              >
                <Text style={[s.dropItemTxt, { color: value === opt ? '#e2671b' : (aC.isDark ? '#F0F2F7' : '#010a1f') }]}>{opt}</Text>
              </TouchableOpacity>
            ))
          }
        </View>
      )}
    </View>
  );
}

export default function TrackerBookingScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const aC = useAppColors();
  const params = useLocalSearchParams<{
    providerId?: string; providerName?: string;
    deviceId?: string; deviceName?: string;
    price?: string; installationFee?: string; monthlyFee?: string;
    deviceImage?: string; selectedAddons?: string; addonsTotal?: string; total?: string;
  }>();

  const [vehicles,      setVehicles]      = useState<string[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [city,    setCity]    = useState('Lahore');
  const [center,  setCenter]  = useState('');
  const [date,    setDate]    = useState('');
  const [time,    setTime]    = useState('11:00 AM');
  const [phone,   setPhone]   = useState('');
  const [address, setAddress] = useState('');
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullName.trim())             e.fullName = 'Please enter your full name';
    if (!vehicle.trim())              e.vehicle = 'Please enter vehicle';
    if (!city.trim())                 e.city    = 'Please select a city';
    if (!center.trim())               e.center  = 'Please select an installation center';
    if (!date.trim())                 e.date    = 'Please enter preferred date';
    if (!time.trim())                 e.time    = 'Please enter preferred time';
    if (!phone.trim())                e.phone   = 'Please enter your phone number';
    else if (phone.replace(/\s/g, '').length < 10) e.phone = 'Please enter a valid phone number';
    if (!address.trim())              e.address = 'Please enter installation address';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name);
    if (user?.phone) setPhone(user.phone);
    if ((user as any)?.city) setCity((user as any).city);
    if ((user as any)?.location) setAddress((user as any).location);
    fetchVehicles();
  }, [user]);

  async function fetchVehicles() {
    setVehicleLoading(true);
    try {
      const res = await fetch(`${API_BASE}/vehicles?limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const items: any[] = data.items || data || [];
        const labels = items.map((v: any) => {
          const title = v.title || `${v.make || ''} ${v.model || ''}`.trim();
          const reg   = v.registration_number || v.reg_number || '';
          return reg ? `${title} · ${reg}` : title;
        }).filter(Boolean);
        setVehicles(labels);
      }
    } catch { /* offline */ }
    finally { setVehicleLoading(false); }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.isDark ? '#020B20' : '#ffffff' }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { backgroundColor: aC.isDark ? '#020B20' : '#ffffff' }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={aC.isDark ? "#C9C6D0" : "#010a1f"} />
          </TouchableOpacity>
          <Text style={[s.title, { color: aC.isDark ? '#F5F6FA' : '#010a1f' }]}>Book Installation</Text>
          <View style={{ width: 35 }} />
        </View>

        {/* Vehicle — free type */}
        <Text style={[s.label, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Select Vehicle</Text>
        <View style={[s.normalInput, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowOpacity: 0, elevation: aC.isDark ? 0 : 2 }, errors.vehicle && s.inputError, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
            {aC.isDark && <SearchInputEffect />}
          <TextInput
            value={vehicle}
            onChangeText={v => { setVehicle(v); setErrors(p => ({ ...p, vehicle: '' })); }}
            style={[s.textInput, { color: aC.isDark ? '#F0F2F7' : '#010a1f' }]}
            placeholder="Toyota Corolla · LEA-1234"
            placeholderTextColor={aC.isDark ? '#E6E4EA' : '#94a3b8'}
          />
        </View>
        {errors.vehicle && <Text style={s.errText}>{errors.vehicle}</Text>}

        {/* City */}
        <Text style={[s.label, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Installation City</Text>
        <Dropdown value={city} options={CITIES} onSelect={v => { setCity(v); setErrors(p => ({ ...p, city: '' })); }} />
        {errors.city && <Text style={s.errText}>{errors.city}</Text>}

        {/* Center — free type */}
        <Text style={[s.label, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Preferred Installation Center</Text>
        <View style={[s.normalInput, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowOpacity: 0, elevation: aC.isDark ? 0 : 2 }, errors.center && s.inputError, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
            {aC.isDark && <SearchInputEffect />}
          <TextInput
            value={center}
            onChangeText={v => { setCenter(v); setErrors(p => ({ ...p, center: '' })); }}
            style={[s.textInput, { color: aC.isDark ? '#F0F2F7' : '#010a1f' }]}
            placeholder="DHA Phase 5 Center"
            placeholderTextColor={aC.isDark ? '#E6E4EA' : '#94a3b8'}
          />
        </View>
        {errors.center && <Text style={s.errText}>{errors.center}</Text>}

        {/* Date + Time */}
        <View style={s.row}>
          <View style={s.half}>
            <Text style={[s.smallLabel, { color: aC.isDark ? '#F0F1F5' : '#010a1f' }]}>Preferred Date:</Text>
            <View style={[s.inputWithIcon, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowOpacity: 0, elevation: aC.isDark ? 0 : 2 }, errors.date && s.inputError, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
            {aC.isDark && <SearchInputEffect />}
              <TextInput
                value={date}
                onChangeText={v => { setDate(v); setErrors(p => ({ ...p, date: '' })); }}
                placeholder="DD/MM/YY"
                placeholderTextColor="#B7BDCC"
                style={[s.textInput, { color: aC.isDark ? '#F0F2F7' : '#010a1f' }]}
              />
              <Ionicons name="calendar-outline" size={17} color={aC.isDark ? "#D5DAE5" : "#64748b"} />
            </View>
            {errors.date && <Text style={s.errText}>{errors.date}</Text>}
          </View>

          <View style={s.half}>
            <Text style={[s.smallLabel, { color: aC.isDark ? '#F0F1F5' : '#010a1f' }]}>Preferred Time:</Text>
            <View style={[s.inputWithIcon, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowOpacity: 0, elevation: aC.isDark ? 0 : 2 }, errors.time && s.inputError, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
            {aC.isDark && <SearchInputEffect />}
              <TextInput
                value={time}
                onChangeText={v => { setTime(v); setErrors(p => ({ ...p, time: '' })); }}
                style={[s.textInput, { color: aC.isDark ? '#F0F2F7' : '#010a1f' }]}
                placeholderTextColor="#B7BDCC"
              />
              <Ionicons name="time-outline" size={17} color={aC.isDark ? "#D5DAE5" : "#64748b"} />
            </View>
            {errors.time && <Text style={s.errText}>{errors.time}</Text>}
          </View>
        </View>

        {/* Full Name — prefilled from profile, editable */}
        <Text style={[s.label, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Full Name</Text>
        <View style={[s.normalInput, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowOpacity: 0, elevation: aC.isDark ? 0 : 2 }, errors.fullName && s.inputError, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
            {aC.isDark && <SearchInputEffect />}
          <TextInput
            value={fullName}
            onChangeText={v => { setFullName(v); setErrors(p => ({ ...p, fullName: '' })); }}
            style={[s.textInput, { color: aC.isDark ? '#F0F2F7' : '#010a1f' }]}
            placeholder="Your full name"
            placeholderTextColor="#B7BDCC"
          />
        </View>
        {errors.fullName && <Text style={s.errText}>{errors.fullName}</Text>}

        {/* Phone — prefilled from profile, editable */}
        <Text style={[s.label, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Phone Number</Text>
        <View style={[s.normalInput, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowOpacity: 0, elevation: aC.isDark ? 0 : 2 }, errors.phone && s.inputError, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
            {aC.isDark && <SearchInputEffect />}
          <TextInput
            value={phone}
            onChangeText={v => { setPhone(v); setErrors(p => ({ ...p, phone: '' })); }}
            style={[s.textInput, { color: aC.isDark ? '#F0F2F7' : '#010a1f' }]}
            placeholder="+92 3XX XXXXXXX"
            placeholderTextColor="#B7BDCC"
            keyboardType="phone-pad"
          />
        </View>
        {errors.phone && <Text style={s.errText}>{errors.phone}</Text>}

        {/* Address */}
        <Text style={[s.label, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>Installation Address</Text>
        <View style={[s.normalInput, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowOpacity: 0, elevation: aC.isDark ? 0 : 2 }, errors.address && s.inputError, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
            {aC.isDark && <SearchInputEffect />}
          <TextInput
            value={address}
            onChangeText={v => { setAddress(v); setErrors(p => ({ ...p, address: '' })); }}
            style={[s.textInput, { color: aC.isDark ? '#F0F2F7' : '#010a1f' }]}
            placeholder="House #, Street, Area, City"
            placeholderTextColor="#B7BDCC"
          />
        </View>
        {errors.address && <Text style={s.errText}>{errors.address}</Text>}

        <View style={{ flex: 1, minHeight: 50 }} />

        {/* Continue Button */}
        <TouchableOpacity style={s.continueBtn} activeOpacity={0.85} onPress={() => {
          if (!validate()) return;
          router.push({
            pathname: '/insurance/payment-summary' as any,
            params: {
              type: 'tracker', fullName, vehicle, city, center, date, time, phone, address,
              providerId:      params.providerId      || '',
              providerName:    params.providerName    || '',
              deviceId:        params.deviceId        || '',
              deviceName:      params.deviceName      || '',
              price:           params.price           || '0',
              installationFee: params.installationFee || '0',
              monthlyFee:      params.monthlyFee      || '0',
              deviceImage:     params.deviceImage     || '',
              addonsTotal:     params.addonsTotal     || '0',
              selectedAddons:  params.selectedAddons  || '',
            },
          });
        }}>
          <LinearGradient
            colors={(aC.isDark ? PRIMARY_BTN_COLORS : ['#27467F', '#8C6A78', '#FF9654']) as any}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={s.continueTxt}>Continue</Text>
        </TouchableOpacity>

        <View style={{ height: 10 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#020B20' },
  scroll: { flexGrow: 1, paddingHorizontal: 14, paddingBottom: 30 },

  header:  { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 35, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  title:   { fontSize: 20, fontFamily: 'Poppins_500Medium' },

  label:      { fontSize: 13.5, fontFamily: 'Poppins_400Regular', marginTop: 8, marginBottom: 8 },
  smallLabel: { fontSize: 11.5, fontFamily: 'Poppins_500Medium', marginTop: 8, marginBottom: 8 },

  dropdown: {
    height: 46, borderRadius: 32, borderWidth: 1, borderColor: '#829fd0',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 18, marginBottom: 4, overflow: 'hidden',
  },
  inputText:     { fontSize: 13.5, fontFamily: 'Poppins_400Regular', flex: 1 },
  dropList:      { backgroundColor: '#071834', borderRadius: 14, borderWidth: 1, borderColor: '#5688D4', overflow: 'hidden', marginBottom: 10 },
  dropItem:      { paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(86,136,212,0.2)' },
  dropItemActive:{ backgroundColor: 'rgba(226,103,27,0.1)' },
  dropItemTxt:   { color: '#F0F2F7', fontSize: 13, fontFamily: 'Poppins_400Regular' },

  row:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  half: { width: '48%' },

  inputWithIcon: {
    height: 46, borderRadius: 32, borderWidth: 1, borderColor: '#829fd0',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, overflow: 'hidden',
  },
  normalInput: {
    height: 46, borderRadius: 32, borderWidth: 1, borderColor: '#829fd0',
    paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 4, overflow: 'hidden',
  },
  textInput: { flex: 1, color: '#F0F2F7', fontSize: 13.5, fontFamily: 'Poppins_400Regular', paddingVertical: 0 },

  errText:    { color: '#f87171', fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 3, marginLeft: 4, marginBottom: 4 },
  inputError: { borderColor: 'rgba(248,113,113,0.6)' },

  continueBtn: { height: 48, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  continueTxt: { color: '#EDEBF0', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
