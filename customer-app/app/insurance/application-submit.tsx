import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, StyleSheet, SafeAreaView,
  StatusBar, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { AppColors, useAppColors } from '@/constants/theme';
import { PRIMARY_BTN_COLORS, SearchInputEffect } from '@/components/shared/FigmaEffects';

// ── App Design Tokens ──────────────────────────────────────────────────────
const BG     = "#010a1f";
const CARD   = "#020d24";
const WHITE  = "#f9fafc";
const SUB    = "#baacb6";
const ORANGE = "#e2671b";
const BORDER = "#1a3a6a";

export default function ApplicantInformation() {
  const router   = useRouter();
  const { user } = useAuth();
  const aC = useAppColors();
  const planParams = useLocalSearchParams<{ planId?: string; claimId?: string; company?: string; premium?: string; rate?: string; features?: string; avatarUrl?: string; has_tracker?: string; selected_addons?: string; car_model?: string; badge?: string }>();

  const [fullName, setFullName] = useState('');
  const [cnic,     setCnic]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [email,    setEmail]    = useState('');
  const [date,     setDate]     = useState('');
  const [time,     setTime]     = useState('11:00 AM');
  const [address,  setAddress]  = useState('');
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setCnic    ((user as any).cnic      || '');
      setPhone   (user.phone     || '');
      setEmail   (user.email     || '');
      setAddress ((user as any).city      || (user as any).location || '');
    }
  }, [user]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullName.trim())  e.fullName = 'Full name is required';
    if (!cnic.trim())      e.cnic     = 'CNIC is required';
    else if (cnic.replace(/-/g, '').length !== 13) e.cnic = 'Enter valid 13-digit CNIC';
    if (!phone.trim())     e.phone    = 'Phone number is required';
    else if (phone.replace(/\s/g, '').length < 10) e.phone = 'Enter valid phone number';
    if (!email.trim())     e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter valid email address';
    if (!date.trim())      e.date     = 'Preferred date is required';
    if (!address.trim())   e.address  = 'Address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      <KeyboardAvoidingView
        style={[s.container, { backgroundColor: aC.bg }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Header ── */}
        <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff' }]}>
          <TouchableOpacity style={s.backButton} activeOpacity={0.7} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={aC.isDark ? '#C9C6D0' : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: aC.isDark ? '#F2F1F5' : '#010a1f' }]}>Applicant Information</Text>
          <View style={s.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.content, { backgroundColor: aC.bg }]}
          style={{ backgroundColor: aC.bg }}
        >

          <InputField label="Full Name"    value={fullName} onChangeText={v => { setFullName(v); setErrors(p => ({ ...p, fullName: '' })); }} />
          {errors.fullName && <Text style={s.errTxt}>{errors.fullName}</Text>}
          <InputField label="CNIC"         value={cnic}     onChangeText={v => { setCnic(v);     setErrors(p => ({ ...p, cnic:     '' })); }} keyboardType="numeric" />
          {errors.cnic && <Text style={s.errTxt}>{errors.cnic}</Text>}
          <InputField label="Phone Number" value={phone}    onChangeText={v => { setPhone(v);    setErrors(p => ({ ...p, phone:    '' })); }} keyboardType="phone-pad" />
          {errors.phone && <Text style={s.errTxt}>{errors.phone}</Text>}
          <InputField label="Email"        value={email}    onChangeText={v => { setEmail(v);    setErrors(p => ({ ...p, email:    '' })); }} keyboardType="email-address" autoCapitalize="none" />
          {errors.email && <Text style={s.errTxt}>{errors.email}</Text>}

          {/* Date + Time */}
          <View style={s.row}>
            <View style={s.halfField}>
              <Text style={[s.label, s.smallLabel, { color: aC.isDark ? '#F2F1F5' : '#475569' }]}>Preferred Date:</Text>
              <View style={[s.inputContainer, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 2 }, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
                {aC.isDark ? (
                  <SearchInputEffect />
                ) : (
                  <>

                  </>
                )}
                <TextInput style={[s.input, { color: aC.isDark ? WHITE : '#010a1f' }]} value={date} onChangeText={v => { setDate(v); setErrors(p => ({ ...p, date: '' })); }} placeholder="DD/MM/YY" placeholderTextColor={aC.isDark ? "#E6E4EA" : "#94a3b8"} />
                <Ionicons name="calendar-outline" size={18} color={aC.isDark ? '#E6E4EA' : '#64748b'} style={s.inputIcon} />
              </View>
            </View>

            <View style={s.halfField}>
              <Text style={[s.label, s.smallLabel, { color: aC.isDark ? '#F2F1F5' : '#475569' }]}>Preferred Time:</Text>
              <View style={[s.inputContainer, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 2 }, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
                {aC.isDark ? (
                  <SearchInputEffect />
                ) : (
                  <>

                  </>
                )}
                <TextInput style={[s.input, { color: aC.isDark ? WHITE : '#010a1f' }]} value={time} onChangeText={setTime} placeholder="11:00 AM" placeholderTextColor={aC.isDark ? "#E6E4EA" : "#94a3b8"} />
                <Ionicons name="time-outline" size={18} color={aC.isDark ? '#E6E4EA' : '#64748b'} style={s.inputIcon} />
              </View>
            </View>
          </View>

          {errors.date && <Text style={s.errTxt}>{errors.date}</Text>}

          <InputField label="Address" value={address} onChangeText={v => { setAddress(v); setErrors(p => ({ ...p, address: '' })); }} />
          {errors.address && <Text style={s.errTxt}>{errors.address}</Text>}

          <View style={{ flex: 1, minHeight: 60 }} />

          {/* ── Continue Button ── */}
          <TouchableOpacity
            activeOpacity={0.87}
            style={s.continueButton}
            onPress={() => {
              if (!validate()) return;
              router.push({
                pathname: '/insurance/upload-documents' as any,
                params: {
                  type:            'insurance',
                  providerName:    planParams.company   || 'Insurance',
                  avatarUrl:       planParams.avatarUrl || '',
                  deviceName:      planParams.company   || 'Insurance Plan',
                  price:           planParams.premium   || '0',
                  installationFee: '0',
                  monthlyFee:      '0',
                  vehicle:         `${fullName} • ${cnic}`,
                  phone,
                  address,
                  date,
                  time,
                  planId:          planParams.planId    || '',
                  claimId:         planParams.claimId   || '',
                  fullName,
                  cnic,
                  email,
                  has_tracker:     planParams.has_tracker || 'false',
                  selected_addons: planParams.selected_addons || '[]',
                  car_model:       planParams.car_model || '',
                  badge:           planParams.badge || '',
                },
              });
            }}
          >
            <LinearGradient
              colors={(aC.isDark ? PRIMARY_BTN_COLORS : ['#27467F', '#8C6A78', '#FF9654']) as any}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.continueGradient}
            >
              <Text style={s.continueText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: any;
  autoCapitalize?: any;
};

function InputField({ label, value, onChangeText, keyboardType, autoCapitalize = "sentences" }: InputFieldProps) {
  const aC = useAppColors();
  return (
    <View style={s.field}>
      <Text style={[s.label, { color: aC.isDark ? '#C9C6D0' : '#475569' }]}>{label}</Text>
      <View style={[s.inputContainer, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? '#829fd0' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 2 }, !aC.isDark && { borderColor: 'rgba(226,103,27,0.28)', shadowOpacity: 0, elevation: 0, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}>
        {aC.isDark ? (
          <SearchInputEffect />
        ) : (
          <>

          </>
        )}
        <TextInput style={[s.input, { color: aC.isDark ? WHITE : '#010a1f' }]} value={value} onChangeText={onChangeText} keyboardType={keyboardType} autoCapitalize={autoCapitalize} placeholderTextColor={aC.isDark ? "#E6E4EA" : "#94a3b8"} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },

  header:       { height: 60, paddingHorizontal: 12, marginTop: 16, flexDirection: "row", alignItems: "center", gap: 18 },
  backButton:   { width: 32, height: 36, justifyContent: "center", alignItems: "flex-start" },
  headerTitle:  { fontSize: 19, fontFamily: "Poppins_500Medium" },
  headerSpacer: { width: 0 },

  content: { flexGrow: 1, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 20 },

  field: { marginBottom: 12 },
  label: { fontSize: 13.5, fontFamily: "Poppins_400Regular", marginBottom: 6 },
  smallLabel: { fontSize: 11.5, fontFamily: "Poppins_500Medium" },
  inputContainer: {
    height: 42, borderRadius: 32,
    backgroundColor: 'rgba(3,12,40,0.6)', borderWidth: 1, borderColor: '#829fd0',
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, overflow: 'hidden',
  },
  input:     { flex: 1, height: "100%", fontSize: 13, fontFamily: "Poppins_400Regular" },
  inputIcon: { marginLeft: 6 },

  row:       { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  halfField: { flex: 1 },

  continueButton:   { borderRadius: 28, overflow: "hidden", marginTop: 20 },
  continueGradient: { height: 46, justifyContent: "center", alignItems: "center" },
  continueText:     { color: "#EDEBF0", fontSize: 16, fontFamily: "Poppins_600SemiBold" },

  bottomSpace: { height: 20 },
  errTxt: { color: '#f87171', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: -8, marginBottom: 8, marginLeft: 4 },
});
