import { AUTH_EDGES } from '@/constants/authEdges';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Upload } from 'lucide-react-native';
import AuthHeader from '@/components/auth/AuthHeader';
import LinearButton from '@/components/auth/LinearButton';
import { useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

function GlassInset() {
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none"/>
    </>
  );
}

export default function StoreDesignScreen() {
  const router  = useRouter();
  const C       = useAppColors();
  const { token } = useAuth();
  const { role, access_token, refresh_token } = useLocalSearchParams<{ role: string; access_token: string; refresh_token: string }>();

  const [logo,    setLogo]    = useState<string | null>(null);
  const [banner,  setBanner]  = useState<string | null>(null);
  const [about,   setAbout]   = useState('');
  const [loading, setLoading] = useState(false);

  async function pickImage(onSelect: (uri: string) => void) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any, allowsEditing: true, quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) onSelect(result.assets[0].uri);
  }

  async function handleContinue() {
    setLoading(true);
    try {
      const authToken = access_token || token;
      if (authToken) {
        const res = await fetch(`${API_BASE}/users/me/store-design`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ logo_url: logo, banner_url: banner, about: about.trim() || undefined }),
        });
        if (!res.ok) {
          const err = await res.json();
          Alert.alert('Error', err.detail || 'Failed to save store design');
          return;
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Network error');
      return;
    } finally { setLoading(false); }
    router.push({ pathname: '/(auth)/upload-documents', params: { role: role || '', access_token: access_token || '', refresh_token: refresh_token || '' } });
  }

  return (
    <SafeAreaView edges={AUTH_EDGES} style={[s.safe, { backgroundColor: C.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <AuthHeader/>
          <Text style={[s.title, { color: C.textPrimary }]}>Store Design</Text>
          <Text style={[s.subtitle, { color: C.textSecondary }]}>Please provide your business details</Text>

          {/* Store Logo */}
          <Text style={[s.fieldLabel, { color: C.textSecondary }]}>Store Logo</Text>
          <TouchableOpacity style={[s.uploadBox, { backgroundColor: C.glassBg, borderColor: 'rgba(100,160,255,0.5)' }]} onPress={() => pickImage(setLogo)}>
            <GlassInset/>
            {logo ? (
              <Image source={{ uri: logo }} style={s.logoPreview} resizeMode="contain"/>
            ) : (
              <>
                <Upload size={28} color="rgba(100,160,255,0.6)"/>
                <Text style={[s.uploadText, { color: C.textSecondary }]}>Upload Logo</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Store Banner */}
          <Text style={[s.fieldLabel, { color: C.textSecondary }]}>Store Banner</Text>
          <TouchableOpacity style={[s.bannerBox, { backgroundColor: C.glassBg, borderColor: 'rgba(100,160,255,0.5)' }]} onPress={() => pickImage(setBanner)}>
            <GlassInset/>
            {banner ? (
              <Image source={{ uri: banner }} style={s.bannerPreview} resizeMode="cover"/>
            ) : (
              <>
                <Upload size={28} color="rgba(100,160,255,0.6)"/>
                <Text style={[s.uploadText, { color: C.textSecondary }]}>Upload Banner</Text>
              </>
            )}
          </TouchableOpacity>

          {/* About */}
          <Text style={[s.fieldLabel, { color: C.textSecondary }]}>About Your Store</Text>
          <View style={[s.textareaWrap, { backgroundColor: C.glassBg, borderColor: 'rgba(100,160,255,0.5)' }]}>
            <GlassInset/>
            <TextInput
              style={[s.textarea, { color: C.textPrimary }]}
              placeholder="Write a short description about your store..."
              placeholderTextColor={C.textPlaceholder}
              value={about}
              onChangeText={setAbout}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <Text style={[s.charCount, { color: C.textSecondary }]}>{about.length}/300</Text>
          </View>

          <View style={{ height: 16 }}/>
          <LinearButton title="Continue" onPress={handleContinue} loading={loading}/>
          <View style={{ height: 32 }}/>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1 },
  scroll:       { paddingHorizontal: 20, paddingBottom: 48 },
  title:        { fontSize: 20, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  subtitle:     { fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 20 },
  fieldLabel:   { fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 8, marginTop: 4 },
  uploadBox:    { height: 108, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden', gap: 8 },
  logoPreview:  { width: 80, height: 80 },
  bannerBox:    { height: 128, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden', gap: 8 },
  bannerPreview:{ width: '100%', height: '100%', borderRadius: 16 },
  uploadText:   { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  textareaWrap: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, minHeight: 140 },
  textarea:     { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22, flex: 1 },
  charCount:    { fontSize: 10, fontFamily: 'Poppins_400Regular', textAlign: 'right', marginTop: 4 },
});
