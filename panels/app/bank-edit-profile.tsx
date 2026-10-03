import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

const BG       = '#010A1F';
const WHITE    = '#f9fafc';
const SUBTITLE = '#baacb6';
const ORANGE   = '#e2671b';

export default function BankEditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving]             = useState(false);
  const [showPicker, setShowPicker]     = useState(false);
  const [localAvatar, setLocalAvatar]   = useState<string | null>(null);
  const [uploading, setUploading]       = useState(false);

  const [form, setForm] = useState({
    full_name:   user?.full_name  || '',
    phone:       user?.phone      || '',
    email:       user?.email      || '',
    bank_name:   'Meezan Bank',
    website:     'www.meezanbank.com',
    head_office: 'Meezan House, C-25, Estate Avenue, SITE, Karachi.',
    city:        user?.city       || '',
  });

  async function pickFromGallery() {
    setShowPicker(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow access to your photo library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setLocalAvatar(result.assets[0].uri);
  }

  async function pickFromCamera() {
    setShowPicker(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow camera access.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setLocalAvatar(result.assets[0].uri);
  }

  function removePhoto() { setShowPicker(false); setLocalAvatar(null); }

  async function handleSave() {
    if (!form.full_name.trim()) { Alert.alert('Required', 'Full name is required'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    Alert.alert('Success', 'Profile updated!', [{ text: 'OK', onPress: () => router.back() }]);
  }

  const avatarSource = localAvatar || user?.avatar_url || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=200&auto=format&fit=crop';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── AVATAR ── */}
          <View style={s.avatarSection}>
            <TouchableOpacity onPress={() => setShowPicker(true)} activeOpacity={0.85}>
              <View style={s.avatarWrap}>
                <Image source={{ uri: avatarSource }} style={s.avatar} resizeMode="cover" />
                {uploading ? (
                  <View style={[s.cameraBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <ActivityIndicator size="small" color={WHITE} />
                  </View>
                ) : (
                  <View style={s.cameraBtn}>
                    <Ionicons name="camera-outline" size={12} color={WHITE} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <Text style={s.avatarHint}>Tap to change photo</Text>
          </View>

          {/* ── FIELDS ── */}
          <View style={s.fieldsWrap}>
            <EditField label="Full Name"        value={form.full_name}   onChangeText={v => setForm(p => ({ ...p, full_name: v }))}   placeholder="Representative Name" />
            <EditField label="Phone Number"     value={form.phone}       onChangeText={v => setForm(p => ({ ...p, phone: v }))}       placeholder="+92 300 1234567" keyboardType="phone-pad" />
            <EditField label="Email"            value={form.email}       onChangeText={v => setForm(p => ({ ...p, email: v }))}       placeholder="info@meezanbank.com" keyboardType="email-address" editable={false} />
            <EditField label="Bank Name"        value={form.bank_name}   onChangeText={v => setForm(p => ({ ...p, bank_name: v }))}   placeholder="Meezan Bank" editable={false} />
            <EditField label="Website"          value={form.website}     onChangeText={v => setForm(p => ({ ...p, website: v }))}     placeholder="www.meezanbank.com" />
            <EditField label="Head Office"      value={form.head_office} onChangeText={v => setForm(p => ({ ...p, head_office: v }))} placeholder="Head office address" />
            <EditField label="City"             value={form.city}        onChangeText={v => setForm(p => ({ ...p, city: v }))}        placeholder="Karachi" />
          </View>

          {/* ── SAVE BUTTON ── */}
          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.87} style={s.saveBtnWrap}>
            <LinearGradient colors={['#032a69', '#e2671b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtn}>
              {saving
                ? <ActivityIndicator color={WHITE} size="small" />
                : <Text style={s.saveTxt}>Save Changes</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── PHOTO PICKER MODAL ── */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Change Profile Photo</Text>

            <TouchableOpacity style={s.sheetOption} onPress={pickFromGallery} activeOpacity={0.8}>
              <View style={s.sheetIcon}><Ionicons name="images-outline" size={22} color={ORANGE} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetOptionTitle}>Photo Gallery</Text>
                <Text style={s.sheetOptionSub}>Choose from your photos</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={SUBTITLE} />
            </TouchableOpacity>

            <TouchableOpacity style={s.sheetOption} onPress={pickFromCamera} activeOpacity={0.8}>
              <View style={s.sheetIcon}><Ionicons name="camera-outline" size={22} color={ORANGE} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetOptionTitle}>Camera</Text>
                <Text style={s.sheetOptionSub}>Take a new photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={SUBTITLE} />
            </TouchableOpacity>

            {localAvatar ? (
              <TouchableOpacity style={[s.sheetOption, { borderBottomWidth: 0 }]} onPress={removePhoto} activeOpacity={0.8}>
                <View style={[s.sheetIcon, { backgroundColor: 'rgba(255,56,60,0.12)' }]}>
                  <Ionicons name="trash-outline" size={22} color="#ff383c" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.sheetOptionTitle, { color: '#ff383c' }]}>Remove Photo</Text>
                  <Text style={s.sheetOptionSub}>Reset to default avatar</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowPicker(false)}>
              <Text style={s.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

function EditField({ label, value, onChangeText, placeholder, keyboardType = 'default', editable = true }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; editable?: boolean;
}) {
  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.inputWrap, !editable && s.inputDisabled]}>
        <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(186,172,182,0.4)"
          keyboardType={keyboardType}
          editable={editable}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  iconBtn:{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: WHITE, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, gap: 20 },

  avatarSection: { alignItems: 'center' },
  avatarWrap:    { position: 'relative', width: 76, height: 76 },
  avatar:        { width: 76, height: 76, borderRadius: 51, borderWidth: 1.5, borderColor: WHITE },
  cameraBtn:     { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 32, borderWidth: 0.75, borderColor: WHITE, backgroundColor: 'rgba(6,17,60,0.9)', alignItems: 'center', justifyContent: 'center' },
  avatarHint:    { fontSize: 12, fontFamily: 'Poppins_400Regular', color: SUBTITLE, marginTop: 8 },

  fieldsWrap:  { gap: 12 },
  fieldGroup:  { gap: 8 },
  fieldLabel:  { fontSize: 14, fontFamily: 'Poppins_500Medium', color: SUBTITLE },
  inputWrap:   { height: 48, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(100,160,255,0.5)', backgroundColor: 'rgba(3,12,40,0.6)', justifyContent: 'center', paddingHorizontal: 20, overflow: 'hidden' },
  inputDisabled:{ borderColor: 'rgba(100,160,255,0.25)' },
  input:       { fontSize: 14, fontFamily: 'Poppins_400Regular', color: WHITE, padding: 0 },

  saveBtnWrap: { borderRadius: 32, overflow: 'hidden' },
  saveBtn:     { height: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  saveTxt:     { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: WHITE },

  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: '#061637', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 34, paddingTop: 12 },
  sheetHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 },
  sheetTitle:      { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: WHITE, marginBottom: 16 },
  sheetOption:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' },
  sheetIcon:       { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(226,103,27,0.12)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sheetOptionTitle:{ fontSize: 14, fontFamily: 'Poppins_500Medium', color: WHITE },
  sheetOptionSub:  { fontSize: 11, fontFamily: 'Poppins_400Regular', color: SUBTITLE, marginTop: 2 },
  cancelBtn:       { marginTop: 16, height: 48, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  cancelTxt:       { fontSize: 14, fontFamily: 'Poppins_500Medium', color: WHITE },
});
