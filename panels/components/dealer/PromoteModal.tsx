import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavedCardEffect, savedCardOuter } from '@/components/shared/FigmaEffects';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';

const { width } = Dimensions.get('window');
const ORANGE = '#E2671B';

interface PromoteModalProps {
  visible: boolean;
  onClose: () => void;
  onPromote: () => void;
}

// Figma: dark navy glass card with a blue edge glow, white flame tile, gradient "Promote Now", glass "Cancel"
export default function PromoteModal({ visible, onClose, onPromote }: PromoteModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[savedCardOuter, s.modal]}>
          <SavedCardEffect band={28} />

          {/* CLOSE */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={30} color={ORANGE} />
          </TouchableOpacity>

          {/* HEADER */}
          <View style={s.header}>
            <View style={s.iconBox}>
              <Ionicons name="flame-outline" size={34} color={ORANGE} />
            </View>
            <Text style={s.title}>{'Promote to Get Your\nVehicle Seen Faster'}</Text>
          </View>

          {/* DESCRIPTION */}
          <Text style={s.desc}>
            Boost your vehicle to the top of search results and reach more potential buyers.
          </Text>

          {/* PROMOTE BUTTON */}
          <GradientButton
            title="Promote Now"
            height={52}
            fontSize={18}
            icon={<Ionicons name="flash-outline" size={24} color="#fff" />}
            onPress={onPromote}
          />

          {/* CANCEL BUTTON */}
          <GlassButton title="Cancel" height={52} fontSize={16} color="#E6E1E8" style={{ marginTop: 14 }} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,5,18,0.82)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  modal:   { width: width - 32, borderRadius: 28, paddingHorizontal: 24, paddingTop: 30, paddingBottom: 26, borderColor: 'rgba(60,100,180,0.8)' },
  closeBtn:{ position: 'absolute', right: 14, top: 10, zIndex: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 16, paddingRight: 20 },
  iconBox: { width: 58, height: 58, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  title:   { flex: 1, color: '#FFFFFF', fontSize: 19, fontFamily: 'Poppins_600SemiBold', lineHeight: 28 },
  desc:    { color: '#BAACB6', fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 26, marginBottom: 22 },
});
