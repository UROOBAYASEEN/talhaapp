import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Zap, X } from 'lucide-react-native';
import { AppColors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const ORANGE = '#ff6900';
const C = AppColors;

function GlassInset() {
  return (
    <>
      <LinearGradient
        colors={['rgba(22,64,136,0.1)', 'transparent']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
        style={StyleSheet.absoluteFillObject} pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(13,37,84,0.08)', 'transparent']}
        start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }}
        style={StyleSheet.absoluteFillObject} pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(29,83,175,0.1)']}
        start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject} pointerEvents="none"
      />
    </>
  );
}

interface PromoteModalProps {
  visible: boolean;
  onClose: () => void;
  onPromote: () => void;
}

export default function PromoteModal({ visible, onClose, onPromote }: PromoteModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.modal}>

          {/* top blue shade */}
          <LinearGradient
            colors={['rgba(22,64,136,0.55)', 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }}
            style={StyleSheet.absoluteFillObject} pointerEvents="none"
          />
          {/* left blue shade */}
          <LinearGradient
            colors={['rgba(13,37,84,0.5)', 'transparent']}
            start={{ x: 0, y: 0.5 }} end={{ x: 0.5, y: 0.5 }}
            style={StyleSheet.absoluteFillObject} pointerEvents="none"
          />
          {/* bottom orange shade */}
          <LinearGradient
            colors={['transparent', 'rgba(255,105,0,0.28)']}
            start={{ x: 0.5, y: 0.5 }} end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject} pointerEvents="none"
          />

          {/* CLOSE */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={24} color={ORANGE} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* HEADER */}
          <View style={s.header}>
            <View style={s.iconBox}>
              <LinearGradient
                colors={[C.gradientStart, ORANGE]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Flame size={32} color="#fff" strokeWidth={2} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={s.title}>Promote to Get Your</Text>
              <Text style={s.title}>Vehicle Seen Faster</Text>
            </View>
          </View>

          {/* DESCRIPTION */}
          <Text style={s.desc}>
            Boost your vehicle to the top of{'\n'}
            search results and reach more{'\n'}
            potential buyers.
          </Text>

          {/* PROMOTE BUTTON */}
          <TouchableOpacity style={s.promoteBtn} onPress={onPromote} activeOpacity={0.85}>
            <LinearGradient
              colors={['rgba(3,42,105,0.95)', 'rgba(3,42,105,0.65)', 'rgba(3,42,105,0.15)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['#c44e00', '#ff6900', '#ff9a00']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFillObject, { zIndex: -1 }]}
            />
            <LinearGradient
              colors={['rgba(255,255,255,0.12)', 'transparent']}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <Zap size={22} color="#fff" strokeWidth={2.5} />
            <Text style={s.promoteTxt}>Promote Now</Text>
          </TouchableOpacity>

          {/* CANCEL BUTTON */}
          <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <GlassInset />
            <Text style={s.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,5,18,0.82)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },

  modal: { width: width - 32, borderRadius: 32, backgroundColor: C.glassBg, borderWidth: 1.5, borderColor: 'rgba(100,160,255,0.5)', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 28, overflow: 'hidden', shadowColor: '#164D9D', shadowOpacity: 0.7, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 20 },

  closeBtn: { position: 'absolute', right: 18, top: 18, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,105,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,105,0,0.3)', alignItems: 'center', justifyContent: 'center' },

  header:  { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  iconBox: { width: 62, height: 62, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },

  title: { color: C.textPrimary, fontSize: 18, fontFamily: 'Poppins_700Bold', lineHeight: 26, textShadowColor: 'rgba(255,105,0,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },

  desc: { color: C.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 22, marginBottom: 24 },

  promoteBtn:  { height: 52, borderRadius: 26, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12, shadowColor: ORANGE, shadowOpacity: 0.45, shadowRadius: 12, elevation: 8 },
  promoteTxt:  { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },

  cancelBtn:  { height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(100,160,255,0.5)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: C.glassBg },
  cancelTxt:  { color: C.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
});
