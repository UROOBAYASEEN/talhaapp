// Bottom-sheet dropdown with search — same look as the Buy Used Car search sheets.
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppColors, useAppColors } from '@/constants/theme';

import SheetModal from '@/components/shared/SheetModal';
const ORANGE = AppColors.gradientEnd;
const BORDER = 'rgba(100,160,255,0.4)';

function GlassInset() {
  const aC = useAppColors();
  if (!aC.isDark) {
    return (
      <>
        <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      </>
    );
  }
  return (
    <>
      <LinearGradient colors={['rgba(22,64,136,0.2)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['rgba(13,37,84,0.18)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(29,83,175,0.2)']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

export default function SelectSheet({ visible, title, options, selected, onSelect, onClose, loading, getIcon }: {
  visible: boolean; title: string; options: string[];
  selected: string; onSelect: (v: string) => void; onClose: () => void; loading?: boolean;
  getIcon?: (option: string) => any;
}) {
  const aC = useAppColors();
  const [q, setQ] = useState('');
  const filtered = q ? options.filter(o => o.toLowerCase().includes(q.toLowerCase())) : options;
  const dark = aC.isDark;
  const txt = dark ? AppColors.textPrimary : '#010a1f';
  const muted = dark ? AppColors.textSecondary : '#475569';
  return (
    <SheetModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[s.sheet, { backgroundColor: dark ? AppColors.bg : '#ffffff', borderColor: dark ? BORDER : 'rgba(3,42,105,0.12)' }]}>
          <GlassInset />
          <View style={[s.handle, { backgroundColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(3,42,105,0.15)' }]} />
          <View style={[s.header, { borderBottomColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(3,42,105,0.08)' }]}>
            <Text style={[s.title, { color: txt }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }]}>
              <Ionicons name="close" size={16} color={muted} />
            </TouchableOpacity>
          </View>
          <View style={[s.searchRow, { backgroundColor: dark ? AppColors.glassBg : '#f8fafc', borderColor: dark ? BORDER : 'rgba(3,42,105,0.12)' }]}>
            <GlassInset />
            <Ionicons name="search-outline" size={14} color={muted} style={{ marginLeft: 12 }} />
            <TextInput style={[s.searchInput, { color: txt }]} value={q} onChangeText={setQ} placeholder={`Search ${title}...`} placeholderTextColor={muted} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
            {loading ? <Text style={[s.optTxt, { color: muted, padding: 18 }]}>Loading…</Text> : null}
            {!loading && filtered.length === 0 ? <Text style={[s.optTxt, { color: muted, padding: 18 }]}>No options</Text> : null}
            {filtered.map(opt => {
              const icon = getIcon?.(opt);
              return (
              <TouchableOpacity key={opt} style={[s.option, { borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(3,42,105,0.06)' }]} onPress={() => { onSelect(opt); setQ(''); onClose(); }}>
                {icon ? (
                  <Image source={icon} style={s.optIcon} resizeMode="contain" />
                ) : title === 'Brand' && opt !== 'All Brands' ? (
                  <View style={s.optInitialWrap}>
                    <Text style={s.optInitial}>{opt.charAt(0).toUpperCase()}</Text>
                  </View>
                ) : null}
                <Text style={[s.optTxt, { color: muted }, opt === selected && { color: ORANGE, fontFamily: 'Poppins_600SemiBold' }]}>{opt}</Text>
                {opt === selected && <Ionicons name="checkmark" size={15} color={ORANGE} />}
              </TouchableOpacity>
              );
            })}
            <View style={{ height: 20 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </SheetModal>
  );
}

const s = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, paddingBottom: 36, overflow: 'hidden' },
  handle:      { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1 },
  title:       { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  closeBtn:    { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  searchRow:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginVertical: 10, height: 40, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  searchInput: { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', paddingHorizontal: 10 },
  option:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1 },
  optTxt:      { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  optIcon:     { width: 28, height: 28, borderRadius: 6 },
  optInitialWrap: { width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  optInitial:  { color: '#D8DCE6', fontSize: 14, fontFamily: 'Poppins_700Bold' },
});
