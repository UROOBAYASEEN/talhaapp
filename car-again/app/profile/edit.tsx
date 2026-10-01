import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
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
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

// Figma assets
const IMG_LOGO   = require('@/assets/images/autowizor-logo-text.png');
const IMG_AVATAR = "https://www.figma.com/api/mcp/asset/eccd4a05-c689-4093-aff3-b20055e5d583.png";

// Figma tokens
const BG       = "#010a1f";
const WHITE    = "#f9fafc";
const SUBTITLE = "#baacb6";
const CARD_BG  = "rgba(6,17,60,0.85)";
const SHADOW_C = "#1D53AF";

export default function EditProfileScreen() {
  const router = useRouter();
  const { token, user, refreshUser } = useAuth();
  const aC = useAppColors();
  const [saving,        setSaving]       = useState(false);
  const [showPicker,    setShowPicker]   = useState(false);
  const [localAvatar,   setLocalAvatar]  = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    full_name:  (user as any)?.full_name  || '',
    phone:      (user as any)?.phone      || '',
    email:      (user as any)?.email      || '',
    cnic:       (user as any)?.cnic       || '',
    city:       (user as any)?.city       || '',
    avatar_url: (user as any)?.avatar_url || '',
  });

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/profile/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setForm({
          full_name:  d.full_name  || '',
          phone:      d.phone      || '',
          email:      d.email      || '',
          cnic:       d.cnic       || '',
          city:       d.city       || '',
          avatar_url: d.avatar_url || '',
        });
      })
      .catch(() => {});
  }, [token]);

  // ── Upload image to server ────────────────────────────────────────────
  async function uploadToServer(uri: string): Promise<string | null> {
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const d = await res.json();
        return d.url;
      }
      return null;
    } catch { return null; }
    finally { setUploadingPhoto(false); }
  }

  // ── Image picker ─────────────────────────────────────────────────────
  async function pickFromGallery() {
    setShowPicker(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      setLocalAvatar(localUri);
      const serverUrl = await uploadToServer(localUri);
      if (serverUrl) setForm(p => ({ ...p, avatar_url: serverUrl }));
      else Alert.alert('Error', 'Photo upload failed');
    }
  }

  async function pickFromCamera() {
    setShowPicker(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      setLocalAvatar(localUri);
      const serverUrl = await uploadToServer(localUri);
      if (serverUrl) setForm(p => ({ ...p, avatar_url: serverUrl }));
      else Alert.alert('Error', 'Photo upload failed');
    }
  }

  function removePhoto() {
    setShowPicker(false);
    setLocalAvatar(null);
    setForm(p => ({ ...p, avatar_url: '' }));
  }

  // ── Save ─────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.full_name.trim()) {
      Alert.alert('Required', 'Full name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/profile/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name:  form.full_name  || undefined,
          phone:      form.phone      || undefined,
          city:       form.city       || undefined,
          avatar_url: form.avatar_url || undefined,
        }),
      });
      if (res.ok) {
        await refreshUser();
        Alert.alert('Success', 'Profile updated!', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        const e = await res.json();
        Alert.alert('Error', e.detail || 'Update failed');
      }
    } catch { Alert.alert('Error', 'Network error'); }
    finally { setSaving(false); }
  }

  const BASE_URL     = API_BASE.replace('/api/v1', '');
  const resolvedAvatar = form.avatar_url
    ? (form.avatar_url.startsWith('http') ? form.avatar_url : `${BASE_URL}${form.avatar_url}`)
    : null;
  const avatarSource = localAvatar || resolvedAvatar || IMG_AVATAR;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: aC.bg }]} edges={["top"]}>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentInsetAdjustmentBehavior="never"
        >

          {/* ── Header — same as profile ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color={WHITE} />
        </TouchableOpacity>

        <View style={s.logoWrap} pointerEvents="none">
          <Image source={IMG_LOGO} style={s.logo} resizeMode="contain" />
        </View>

        <View style={s.headerRight}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/alert' as any)}>
            <Ionicons name="notifications-outline" size={20} color={WHITE} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/profile/settings' as any)}>
            <Ionicons name="settings-outline" size={20} color={WHITE} />
          </TouchableOpacity>
        </View>
      </View>

          {/* ── Avatar ── */}
          <View style={s.avatarSection}>
            <TouchableOpacity onPress={() => setShowPicker(true)} activeOpacity={0.85}>
              <View style={s.avatarWrap}>
                <Image source={{ uri: avatarSource }} style={s.avatar} resizeMode="cover" />
                {uploadingPhoto ? (
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

          {/* ── Fields ── */}
          <View style={s.fieldsWrap}>

            <EditField
              label="Full Name"
              value={form.full_name}
              onChangeText={v => setForm(p => ({ ...p, full_name: v }))}
              placeholder="Talha Shaikh"
            />

            <EditField
              label="Phone Number"
              value={form.phone}
              onChangeText={v => setForm(p => ({ ...p, phone: v }))}
              placeholder="+92 349 9571255"
              keyboardType="phone-pad"
            />

            <EditField
              label="Email"
              value={form.email}
              onChangeText={v => setForm(p => ({ ...p, email: v }))}
              placeholder="talhashaikh@gmail.com"
              keyboardType="email-address"
              editable={false}
            />

            <EditField
              label="CNIC"
              value={form.cnic}
              onChangeText={v => setForm(p => ({ ...p, cnic: v }))}
              placeholder="35302-123456-1"
              keyboardType="numeric"
              editable={false}
            />

            <EditField
              label="City"
              value={form.city}
              onChangeText={v => setForm(p => ({ ...p, city: v }))}
              placeholder="Karachi"
            />

          </View>

          {/* ── Save Changes button — Figma: gradient #032a69→#e2671b, radius 32, h:48 ── */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.87}
            style={s.saveBtnWrap}
          >
            <LinearGradient
              colors={['#032a69', '#e2671b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.saveBtn}
            >
              {saving
                ? <ActivityIndicator color={WHITE} size="small" />
                : <Text style={s.saveTxt} numberOfLines={1}>Save Changes</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Photo picker bottom sheet ── */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Change Profile Photo</Text>

            <TouchableOpacity style={s.sheetOption} onPress={pickFromGallery} activeOpacity={0.8}>
              <View style={s.sheetIcon}>
                <Ionicons name="images-outline" size={22} color="#e2671b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetOptionTitle}>Photo Gallery</Text>
                <Text style={s.sheetOptionSub}>Choose from your photos</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={SUBTITLE} />
            </TouchableOpacity>

            <TouchableOpacity style={s.sheetOption} onPress={pickFromCamera} activeOpacity={0.8}>
              <View style={s.sheetIcon}>
                <Ionicons name="camera-outline" size={22} color="#e2671b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetOptionTitle}>Camera</Text>
                <Text style={s.sheetOptionSub}>Take a new photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={SUBTITLE} />
            </TouchableOpacity>

            {(localAvatar || form.avatar_url) ? (
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

// ── EditField Component ────────────────────────────────────────────────────
function EditField({
  label, value, onChangeText, placeholder, keyboardType = 'default', editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  editable?: boolean;
}) {
  return (
    <View style={s.fieldGroup}>
      {/* Label — Figma: Poppins Medium 14px #baacb6 */}
      <Text style={s.fieldLabel}>{label}</Text>

      <View style={[s.inputWrap, !editable && s.inputDisabled]}>
        <LinearGradient
          colors={['#16408880', '#16408850', 'transparent', 'transparent', '#16408850', '#16408880']}
          locations={[0, 0.10, 0.22, 0.78, 0.90, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['#16408880', 'transparent', 'transparent', '#16408880']}
          locations={[0, 0.05, 0.95, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
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

// ── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    height: 94,
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  iconBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  logoWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: { width: 112, height: 21 },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 1,
  },

  // Scroll
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 180,
    gap: 20,
  },

  // Avatar — Figma: 76×76, border 1.462px white, radius 51.154
  avatarSection: {
    alignItems: "center",
    marginTop: -20,
  },
  avatarWrap: {
    position: "relative",
    width: 76,
    height: 76,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 51,
    borderWidth: 1.5,
    borderColor: WHITE,
  },
  // Camera button — Figma: 24×24, glass btn, bottom-right (left:55, top:52)
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 32,
    borderWidth: 0.75,
    borderColor: WHITE,
    backgroundColor: "rgba(6,17,60,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: SHADOW_C,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },

  avatarHint: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: SUBTITLE,
    marginTop: 8,
  },

  // Photo picker modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#061637',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: WHITE,
    marginBottom: 16,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sheetIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(226,103,27,0.12)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sheetOptionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: WHITE,
  },
  sheetOptionSub: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: SUBTITLE,
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: 16, height: 48, borderRadius: 32,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelTxt: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: WHITE,
  },

  // Fields wrapper
  fieldsWrap: { gap: 12 },

  // Field group — Figma: flex col, gap:8
  fieldGroup: { gap: 8 },

  // Label — Figma: Poppins Medium 14px #baacb6
  fieldLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: SUBTITLE,
  },

  // Input — Figma: h:48, border 1px white, radius 32, px:20, py:13
  inputWrap: {
    height: 48,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(130,165,213,0.82)',
    backgroundColor: '#010A1F',
    justifyContent: "center",
    paddingHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#638ed0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  inputDisabled: {
    borderColor: 'rgba(130,165,213,0.82)',
  },
  input: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: WHITE,
    padding: 0,
  },

  // Save button — Figma: gradient, radius 32, centered, width 350
  saveBtnWrap: {
    borderRadius: 32,
    overflow: "hidden",
  },
  saveBtn: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  saveTxt: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: WHITE,
  },
});
