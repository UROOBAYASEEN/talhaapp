import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';

import { ChevronLeft, X, Plus, FileText, CheckCircle2 } from 'lucide-react-native';
import { API_BASE } from '@/constants/api';
import { useAppColors } from '@/constants/theme';
import { SavedCardEffect } from "@/components/shared/FigmaEffects";

const WHITE = '#F5F5F7';
const ORANGE = '#FF6B00';

const ALL_CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad',
  'Multan','Peshawar','Quetta','Sialkot','Gujranwala',
  'Hyderabad','Abbottabad','Sukkur','Bahawalpur','Sargodha',
];

const ALL_SERVICES = [
  'New Cars','Used Cars','Bikes','Trucks',
  'Commercial Vehicles','Financing','Insurance',
  'Test Drive','Home Delivery','After-Sale Service',
];

const PARTNER_LABELS: Record<string, string> = {
  dealer:    'Dealer',
  bank:      'Bank',
  insurance: 'Insurance Company',
  tracker:   'Tracker Company',
  seller:    'Seller',
};

export default function CompanyInformationScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const { partnerType } = useLocalSearchParams<{ partnerType: string }>();
  const typeLabel = PARTNER_LABELS[partnerType ?? 'dealer'] ?? 'Partner';

  const [companyName,    setCompanyName]    = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [email,          setEmail]          = useState('');
  const [mobile,         setMobile]         = useState('');
  const [password,       setPassword]       = useState('');
  const [address,        setAddress]        = useState('');
  const [submitting,     setSubmitting]     = useState(false);

  const [selectedCities,  setSelectedCities]  = useState<string[]>([]);
  const [services,        setServices]        = useState(['New Cars','Used Cars']);
  const [uploadedDoc,     setUploadedDoc]     = useState<string | null>(null);

  const [cityModal,    setCityModal]    = useState(false);
  const [serviceModal, setServiceModal] = useState(false);

  const removeCity    = (c: string) => setSelectedCities(p => p.filter(i => i !== c));
  const removeService = (s: string) => setServices(p => p.filter(i => i !== s));

  const toggleCity = (c: string) => {
    setSelectedCities(p => p.includes(c) ? p.filter(i => i !== c) : [...p, c]);
  };
  const toggleService = (s: string) => {
    setServices(p => p.includes(s) ? p.filter(i => i !== s) : [...p, s]);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
      if (!result.canceled && result.assets?.[0]) {
        setUploadedDoc(result.assets[0].name);
      }
    } catch {}
  };

  const handleSubmit = async () => {
    if (!companyName.trim()) { Alert.alert('Required', 'Company name is required.'); return; }
    if (!password.trim())    { Alert.alert('Required', 'Password is required.'); return; }
    if (!email.trim() && !mobile.trim()) { Alert.alert('Required', 'Email or mobile number is required.'); return; }

    try {
      setSubmitting(true);
      const token = await SecureStore.getItemAsync('access_token');
      const res = await fetch(`${API_BASE}/admin/partners`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_type:    partnerType ?? 'dealer',
          full_name:       companyName.trim(),
          email:           email.trim()  || null,
          phone:           mobile.trim() || null,
          password:        password.trim(),
          city:            selectedCities[0] ?? null,
          location:        address.trim() || null,
          dealership_name: companyName.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? 'Registration failed');
      }

      Alert.alert('Success', `${typeLabel} registered successfully!`, [
        { text: 'OK', onPress: () => router.replace('/(admin)/partners' as any) },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>

        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={27} color={aC.isDark ? "#B8BBC7" : "#475569"} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Add {typeLabel}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.description, { color: aC.isDark ? '#AAAFC0' : '#475569' }]}>Please provide basic details about the dealership.</Text>

          <InputField label="Company Name"              placeholder="Enter company name"        value={companyName}    onChangeText={setCompanyName} />
          <InputField label="Business Registration No." placeholder="Enter registration number" value={registrationNo} onChangeText={setRegistrationNo} />
          <InputField label="Email Address"             placeholder="Enter email address"       value={email}          onChangeText={setEmail}         keyboardType="email-address" />
          <InputField label="Mobile Number"             placeholder="Enter mobile number"       value={mobile}         onChangeText={setMobile}        keyboardType="phone-pad" />
          <InputField label="Set Password"              placeholder="Enter password"            value={password}       onChangeText={setPassword}      secureTextEntry />
          <InputField label="Head Office Address"       placeholder="Enter full address"        value={address}        onChangeText={setAddress} />

          {/* OPERATING CITIES */}
          <Text style={[styles.sectionTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Operating Cities</Text>
          <View style={styles.chipsContainer}>
            {selectedCities.map(city => (
              <View key={city} style={[styles.chip, { backgroundColor: aC.isDark ? '#0A1D43' : '#ffffff', borderColor: aC.isDark ? '#5574A4' : 'rgba(3,42,105,0.12)' }]}>
                <Text style={[styles.chipText, { color: aC.isDark ? '#F0F2F7' : '#010a1f' }]}>{city}</Text>
                <TouchableOpacity onPress={() => removeCity(city)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={12} color={aC.isDark ? "#D6DBE7" : "#475569"} strokeWidth={1.8} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={[styles.addChip, { backgroundColor: aC.isDark ? '#071734' : '#ffffff', borderColor: aC.isDark ? '#5C6F92' : 'rgba(3,42,105,0.12)' }]} onPress={() => setCityModal(true)}>
              <Plus size={14} color={aC.isDark ? "#D7DCE8" : "#475569"} strokeWidth={1.7} />
              <Text style={[styles.addChipText, { color: aC.isDark ? '#E0E3EB' : '#475569' }]}>Add City</Text>
            </TouchableOpacity>
          </View>

          {/* SERVICES */}
          <Text style={[styles.sectionTitle, { marginTop: 26, color: aC.isDark ? WHITE : '#010a1f' }]}>Services Offered</Text>
          <View style={styles.chipsContainer}>
            {services.map(s => (
              <View key={s} style={[styles.chip, { backgroundColor: aC.isDark ? '#0A1D43' : '#ffffff', borderColor: aC.isDark ? '#5574A4' : 'rgba(3,42,105,0.12)' }]}>
                <Text style={[styles.chipText, { color: aC.isDark ? '#F0F2F7' : '#010a1f' }]}>{s}</Text>
                <TouchableOpacity onPress={() => removeService(s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={12} color={aC.isDark ? "#D6DBE7" : "#475569"} strokeWidth={1.8} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={[styles.addChip, { backgroundColor: aC.isDark ? '#071734' : '#ffffff', borderColor: aC.isDark ? '#5C6F92' : 'rgba(3,42,105,0.12)' }]} onPress={() => setServiceModal(true)}>
              <Plus size={14} color={aC.isDark ? "#D7DCE8" : "#475569"} strokeWidth={1.7} />
              <Text style={[styles.addChipText, { color: aC.isDark ? '#E0E3EB' : '#475569' }]}>Add service</Text>
            </TouchableOpacity>
          </View>

          {/* UPLOAD DOCUMENTS */}
          <Text style={[styles.sectionTitle, { marginTop: 37, color: aC.isDark ? WHITE : '#010a1f' }]}>Upload Documents</Text>
          <TouchableOpacity activeOpacity={0.8} style={[styles.documentCard, { backgroundColor: aC.isDark ? '#061B4A' : '#ffffff', borderWidth: aC.isDark ? 0 : 1, borderColor: 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 2 }]} onPress={pickDocument}>
            <View style={styles.documentIcon}>
              <FileText size={20} color={aC.isDark ? "#F2F3F7" : "#475569"} strokeWidth={1.5} />
            </View>
            <View style={styles.documentText}>
              <Text style={[styles.documentTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Business License</Text>
              <Text style={[styles.documentSubtitle, { color: aC.isDark ? '#C0C5D4' : '#475569' }]}>
                {uploadedDoc ? uploadedDoc : 'Tap to upload file'}
              </Text>
            </View>
            {uploadedDoc ? (
              <TouchableOpacity onPress={() => setUploadedDoc(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={17} color={aC.isDark ? "#F2F3F7" : "#475569"} strokeWidth={1.5} />
              </TouchableOpacity>
            ) : (
              <Plus size={17} color={aC.isDark ? "#F2F3F7" : "#475569"} strokeWidth={1.5} />
            )}
          </TouchableOpacity>

          <View style={{ height: 105 }} />
        </ScrollView>

        {/* SUBMIT BUTTON */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity activeOpacity={0.85} onPress={handleSubmit} disabled={submitting}>
            <LinearGradient
              colors={['#032A69', '#E2671B']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.addDealerButton, { overflow: 'hidden', opacity: submitting ? 0.7 : 1 }]}
            >
              <LinearGradient colors={['rgba(22,64,136,0.4)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['rgba(13,37,84,0.3)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(29,83,175,0.3)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.addDealerText}>Add {typeLabel}</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* CITY MODAL */}
        <SelectModal
          visible={cityModal}
          title="Select Cities"
          items={ALL_CITIES}
          selected={selectedCities}
          onToggle={toggleCity}
          onClose={() => setCityModal(false)}
        />

        {/* SERVICE MODAL */}
        <SelectModal
          visible={serviceModal}
          title="Select Services"
          items={ALL_SERVICES}
          selected={services}
          onToggle={toggleService}
          onClose={() => setServiceModal(false)}
        />

      </SafeAreaView>
    </View>
  );
}

/* ── Select Modal ── */
function SelectModal({ visible, title, items, selected, onToggle, onClose }: {
  visible: boolean; title: string; items: string[];
  selected: string[]; onToggle: (i: string) => void; onClose: () => void;
}) {
  const aC = useAppColors();
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: aC.isDark ? '#0D1E3F' : '#ffffff', borderColor: aC.isDark ? 'rgba(100,160,255,0.15)' : 'rgba(3,42,105,0.12)' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={aC.isDark ? "#A5ACBD" : "#475569"} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map(item => {
              const isSelected = selected.includes(item);
              return (
                <TouchableOpacity key={item} style={[styles.modalItem, { borderBottomColor: aC.isDark ? "rgba(255,255,255,0.06)" : "rgba(3,42,105,0.06)" }]} onPress={() => onToggle(item)}>
                  <Text style={[styles.modalItemText, { color: isSelected ? ORANGE : (aC.isDark ? "#C8D3E8" : "#475569") }]}>{item}</Text>
                  {isSelected && <CheckCircle2 size={16} color={ORANGE} strokeWidth={2} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.modalDone} onPress={onClose}>
            <Text style={styles.modalDoneText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Input Field ── */
type InputFieldProps = {
  label: string; placeholder: string; value: string;
  onChangeText: (t: string) => void; keyboardType?: any; secureTextEntry?: boolean;
};

function InputField({ label, placeholder, value, onChangeText, keyboardType, secureTextEntry }: InputFieldProps) {
  const aC = useAppColors();
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: aC.isDark ? WHITE : '#010a1f' }]}>{label}</Text>
      <View style={[styles.inputWrapper, { overflow: 'hidden', backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: aC.isDark ? 'rgba(80,123,182,0.5)' : 'rgba(3,42,105,0.12)', shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.08)', shadowOpacity: aC.isDark ? 0 : 0.06, elevation: aC.isDark ? 0 : 2 }]}>
        {aC.isDark ? (
          <SavedCardEffect band={12} />
        ) : (
          <>
            <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </>
        )}
        <TextInput
          value={value} onChangeText={onChangeText} placeholder={placeholder}
          placeholderTextColor={aC.isDark ? "#A5ACBD" : "#94a3b8"} keyboardType={keyboardType}
          secureTextEntry={secureTextEntry} style={[styles.input, { color: aC.isDark ? WHITE : '#010a1f' }]} selectionColor={ORANGE}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#010A1F" },
  safeArea:  { flex: 1, backgroundColor: "#010A1F" },

  header: { height: 65, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 15, paddingBottom: 10, marginTop: 4 },
  backButton: { width: 35, height: 45, justifyContent: 'flex-end', alignItems: 'flex-start', paddingBottom: 2 },
  headerTitle: { color: WHITE, fontSize: 19, fontFamily: 'Poppins_600SemiBold', marginLeft: 28 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 25 },
  description:   { color: '#AAAFC0', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 5, marginBottom: 19 },

  inputGroup:   { marginBottom: 20 },
  inputLabel:   { color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium', marginBottom: 10 },
  inputWrapper: {
    height: 47, borderRadius: 25, borderWidth: 1,
    borderColor: 'rgba(80,123,182,0.5)', backgroundColor: "#010A1F", justifyContent: 'center',
  },
  input: { flex: 1, color: WHITE, fontSize: 13, fontFamily: 'Poppins_400Regular', paddingHorizontal: 16, paddingVertical: 0 },

  sectionTitle: { color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium', marginBottom: 10 },

  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  chip: {
    height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#5574A4',
    backgroundColor: '#0A1D43', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 6,
  },
  chipText:    { color: '#F0F2F7', fontSize: 11, fontFamily: 'Poppins_400Regular' },
  addChip: {
    height: 28, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed',
    borderColor: '#5C6F92', backgroundColor: '#071734',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 5,
  },
  addChipText: { color: '#E0E3EB', fontSize: 11, fontFamily: 'Poppins_400Regular' },

  documentCard: {
    height: 62, borderRadius: 12, backgroundColor: '#061B4A',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 21,
  },
  documentIcon:     { width: 38, alignItems: 'flex-start', justifyContent: 'center' },
  documentText:     { flex: 1, justifyContent: 'center' },
  documentTitle:    { color: WHITE, fontSize: 13, fontFamily: 'Poppins_500Medium', marginBottom: 2 },
  documentSubtitle: { color: '#C0C5D4', fontSize: 11, fontFamily: 'Poppins_400Regular' },

  bottomButtonContainer: { position: 'absolute', left: 34, right: 34, bottom: 40 },
  addDealerButton: { height: 48, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  addDealerText:   { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },

  /* MODAL */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0D1E3F', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.15)',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, maxHeight: '70%',
  },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:     { color: WHITE, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  modalItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalItemText: { color: '#C8D3E8', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  modalDone: {
    marginTop: 16, height: 44, borderRadius: 22,
    backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center',
  },
  modalDoneText: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});
