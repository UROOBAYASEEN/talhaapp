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
  const planParams = useLocalSearchParams<{ planId?: string; claimId?: string; company?: string; premium?: string; rate?: string; features?: string; avatarUrl?: string; has_tracker?: string; selected_addons?: string }>();

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
        <View style={[s.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomColor: aC.isDark ? "rgba(255,255,255,0.08)" : "rgba(3,42,105,0.08)" }]}>
          <TouchableOpacity style={s.backButton} activeOpacity={0.7} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={23} color={aC.isDark ? WHITE : '#010a1f'} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Applicant Information</Text>
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
              <Text style={[s.label, { color: aC.isDark ? SUB : '#475569' }]}>Preferred Date</Text>
              <View style={[s.inputContainer, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 2 }]}>
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
                <TextInput style={[s.input, { color: aC.isDark ? WHITE : '#010a1f' }]} value={date} onChangeText={v => { setDate(v); setErrors(p => ({ ...p, date: '' })); }} placeholder="DD/MM/YY" placeholderTextColor={aC.isDark ? "rgba(186,172,182,0.4)" : "#94a3b8"} />
                <Ionicons name="calendar-outline" size={16} color={aC.isDark ? SUB : '#64748b'} style={s.inputIcon} />
              </View>
            </View>

            <View style={s.halfField}>
              <Text style={[s.label, { color: aC.isDark ? SUB : '#475569' }]}>Preferred Time</Text>
              <View style={[s.inputContainer, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 2 }]}>
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
                <TextInput style={[s.input, { color: aC.isDark ? WHITE : '#010a1f' }]} value={time} onChangeText={setTime} placeholder="11:00 AM" placeholderTextColor={aC.isDark ? "rgba(186,172,182,0.4)" : "#94a3b8"} />
                <Ionicons name="time-outline" size={16} color={aC.isDark ? SUB : '#64748b'} style={s.inputIcon} />
              </View>
            </View>
          </View>

          {errors.date && <Text style={s.errTxt}>{errors.date}</Text>}

          <InputField label="Address" value={address} onChangeText={v => { setAddress(v); setErrors(p => ({ ...p, address: '' })); }} />
          {errors.address && <Text style={s.errTxt}>{errors.address}</Text>}

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
                },
              });
            }}
          >
            <LinearGradient
              colors={["#032a69", "#e2671b"]}
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
      <Text style={[s.label, { color: aC.isDark ? SUB : '#475569' }]}>{label}</Text>
      <View style={[s.inputContainer, { backgroundColor: aC.isDark ? 'rgba(3,12,40,0.6)' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, shadowRadius: 10, elevation: aC.isDark ? 0 : 2 }]}>
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
        <TextInput style={[s.input, { color: aC.isDark ? WHITE : '#010a1f' }]} value={value} onChangeText={onChangeText} keyboardType={keyboardType} autoCapitalize={autoCapitalize} placeholderTextColor={aC.isDark ? "rgba(186,172,182,0.4)" : "#94a3b8"} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    height: 72, paddingHorizontal: 18, paddingTop: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backButton:   { width: 35, height: 35, justifyContent: "center", alignItems: "flex-start" },
  headerTitle:  { fontSize: 17, fontFamily: "Poppins_600SemiBold", color: WHITE },
  headerSpacer: { width: 35 },

  // Content
  content: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 30 },

  // Field
  field: { marginBottom: 16 },
  label: {
    color: SUB, fontSize: 13,
    fontFamily: "Poppins_500Medium", marginBottom: 8,
  },
  inputContainer: {
    height: 48, borderRadius: 32,
    backgroundColor: 'rgba(3,12,40,0.6)', borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)',
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, overflow: 'hidden',
  },
  input: {
    flex: 1, height: "100%",
    color: WHITE, fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  inputIcon: { marginLeft: 6 },

  // Row
  row:       { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  halfField: { flex: 1 },

  // Continue Button
  continueButton:   { borderRadius: 32, overflow: "hidden", marginTop: 24 },
  continueGradient: { height: 52, justifyContent: "center", alignItems: "center" },
  continueText:     { color: WHITE, fontSize: 16, fontFamily: "Poppins_600SemiBold" },

  bottomSpace: { height: 40 },
  errTxt: { color: '#f87171', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: -10, marginBottom: 8, marginLeft: 4 },
});
