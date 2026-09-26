import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import AuthHeader from '@/components/auth/AuthHeader';
import GlassInput from '@/components/auth/GlassInput';
import LinearButton from '@/components/auth/LinearButton';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES = ['Individual', 'Dealership', 'Non-Dealership', 'Bank', 'Insurance', 'Tracker'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad'];

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

function Dropdown({ label, value, options, onSelect }: { label: string; value: string; options: string[]; onSelect: (v: string) => void }) {
  const C = useAppColors();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 20, zIndex: open ? 99 : 1 }}>
      <Text style={[d.label, { color: C.textSecondary }]}>{label}</Text>
      <TouchableOpacity style={[d.box, { backgroundColor: C.glassBg, borderColor: 'rgba(100,160,255,0.5)' }]} onPress={() => setOpen(!open)}>
        <GlassInset/>
        <Text style={[d.val, { color: value ? C.textPrimary : C.textPlaceholder }]}>{value || `Select ${label}`}</Text>
        <ChevronDown size={16} color={C.textSecondary} style={open ? { transform: [{ rotate: '180deg' }] } : {}}/>
      </TouchableOpacity>
      {open && (
        <View style={[d.dropdown, { backgroundColor: C.isDark ? 'rgba(6,18,52,0.98)' : '#ffffff', borderColor: C.isDark ? 'rgba(100,160,255,0.3)' : 'rgba(3,12,40,0.12)' }]}>
          {options.map(opt => (
            <TouchableOpacity key={opt} style={[d.option, value === opt && d.optionActive]} onPress={() => { onSelect(opt); setOpen(false); }}>
              <Text style={[d.optTxt, { color: value === opt ? '#e2671b' : C.textPrimary }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const d = StyleSheet.create({
  label:       { fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 8 },
  box:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 54, borderRadius: 30, borderWidth: 1, paddingHorizontal: 20, overflow: 'hidden' },
  val:         { fontSize: 14, fontFamily: 'Poppins_400Regular', flex: 1 },
  dropdown:    { position: 'absolute', top: 88, left: 0, right: 0, borderRadius: 14, borderWidth: 1, overflow: 'hidden', zIndex: 100 },
  option:      { paddingHorizontal: 20, paddingVertical: 14 },
  optionActive:{ backgroundColor: 'rgba(226,103,27,0.1)' },
  optTxt:      { fontSize: 13, fontFamily: 'Poppins_400Regular' },
});

export default function BusinessInfoScreen() {
  const router = useRouter();
  const C = useAppColors();
  const { token } = useAuth();
  const { role, access_token, refresh_token } = useLocalSearchParams<{ role: string; access_token: string; refresh_token: string }>();

  const [category, setCategory] = useState('');
  const [city,     setCity]     = useState('');
  const [name,     setName]     = useState('');
  const [address,  setAddress]  = useState('');
  const [ntn,      setNtn]      = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleContinue() {
    if (!category || !city || !name.trim() || !address.trim()) {
      Alert.alert('Required', 'Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      const authToken = access_token || token;
      if (!authToken) throw new Error('Not authenticated');
      const res = await fetch(`${API_BASE}/users/me/business-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ business_category: category, city, store_name: name.trim(), business_address: address.trim(), ntn: ntn.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        Alert.alert('Error', err.detail || 'Failed to save business info');
        return;
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Network error');
      return;
    } finally { setLoading(false); }
    router.push({ pathname: '/(auth)/store-design', params: { role: role || '', access_token: access_token || '', refresh_token: refresh_token || '' } });
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <AuthHeader/>
          <Text style={[s.title, { color: C.textPrimary }]}>Business Information</Text>
          <Text style={[s.subtitle, { color: C.textSecondary }]}>Please provide your business details</Text>

          <Dropdown label="Business Category" value={category} options={CATEGORIES} onSelect={setCategory}/>
          <Dropdown label="City"              value={city}     options={CITIES}      onSelect={setCity}/>

          <View style={{ gap: 20 }}>
            <GlassInput accentBorderColor="rgba(100,160,255,0.5)" label="Business / Store Name" placeholder="Enter business name"    value={name}    onChangeText={setName}/>
            <GlassInput accentBorderColor="rgba(100,160,255,0.5)" label="Business Address"      placeholder="Enter complete address" value={address} onChangeText={setAddress}/>
            <GlassInput accentBorderColor="rgba(100,160,255,0.5)" label="NTN (optional)"        placeholder="Enter NTN number"       value={ntn}     onChangeText={setNtn} keyboardType="numeric"/>
          </View>

          <View style={{ height: 32 }}/>
          <LinearButton title="Continue" onPress={handleContinue} loading={loading}/>
          <View style={{ height: 40 }}/>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { paddingHorizontal: 20, paddingBottom: 48 },
  title:   { fontSize: 20, fontFamily: 'Poppins_600SemiBold', marginBottom: 6 },
  subtitle:{ fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 28 },
});
