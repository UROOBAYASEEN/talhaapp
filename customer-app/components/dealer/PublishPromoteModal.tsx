// Shown when "Publish" is tapped on Vehicle Details (dealer-panel/add-vehicle).
// Holds the promotion plans that used to sit at the bottom of the form.
//   Promote & Publish  → publish, then the existing promote flow (promote-new)
//   Publish without Promotion → plain publish, then back to the panel home
import React from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavedCardEffect, savedCardOuter } from '@/components/shared/FigmaEffects';
import { GlassButton, GradientButton } from '@/components/shared/GlowUI';
import { D, PlanOption } from '@/components/dealer/DealerUI';

const { width, height } = Dimensions.get('window');
const ORANGE = '#E2671B';

export type PromotePlan = { title: string; desc: string; price: string; fire?: boolean };

type Props = {
  visible: boolean;
  plans: PromotePlan[];
  selectedPlan: string;
  onSelectPlan: (title: string) => void;
  onPromote: () => void;
  onSkip: () => void;
  onClose: () => void;
};

export default function PublishPromoteModal({ visible, plans, selectedPlan, onSelectPlan, onPromote, onSkip, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[savedCardOuter, s.modal]}>
          <SavedCardEffect band={28} />

          {/* CLOSE — back to the form, nothing is published */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={D.muted} />
          </TouchableOpacity>

          <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 2 }}>
            {/* HEADER */}
            <View style={s.header}>
              <View style={s.iconBox}>
                <Ionicons name="flame-outline" size={30} color={ORANGE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{'Promote to Get Your\nVehicle Seen Faster'}</Text>
              </View>
            </View>
            <Text style={s.desc}>Get 5x more visibility by featuring your listing. Select a placement plan:</Text>

            {/* PLANS */}
            <View style={{ gap: 12 }}>
              {plans.map(p => (
                <PlanOption
                  key={p.title}
                  title={p.title}
                  sub={p.desc}
                  price={p.price}
                  fire={p.fire}
                  selected={selectedPlan === p.title}
                  onPress={() => onSelectPlan(p.title)}
                />
              ))}
            </View>

            {/* Reassurance */}
            <View style={s.note}>
              <Ionicons name="checkmark-circle" size={16} color={D.green} />
              <Text style={s.noteTxt}>Your vehicle will be listed either way. Promotion is optional.</Text>
            </View>

            {/* BUTTONS */}
            <GradientButton
              title="Promote & Publish"
              height={52}
              fontSize={17}
              icon={<Ionicons name="flash-outline" size={22} color="#fff" />}
              onPress={onPromote}
              style={{ marginTop: 18 }}
            />
            <GlassButton
              title="Publish without Promotion"
              height={52}
              fontSize={15}
              color="#E6E1E8"
              style={{ marginTop: 12 }}
              onPress={onSkip}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,5,18,0.82)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  modal:    { width: width - 32, maxHeight: height * 0.86, borderRadius: 28, paddingHorizontal: 20, paddingTop: 26, paddingBottom: 22, borderColor: 'rgba(60,100,180,0.8)', overflow: 'hidden' },
  closeBtn: { position: 'absolute', right: 14, top: 14, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(11,35,88,0.7)', borderWidth: 1, borderColor: 'rgba(130,165,213,0.3)', alignItems: 'center', justifyContent: 'center' },
  header:   { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12, paddingRight: 34 },
  iconBox:  { width: 54, height: 54, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  title:    { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold', lineHeight: 26 },
  desc:     { color: '#BAACB6', fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20, marginBottom: 16 },
  note:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(46,204,113,0.07)', borderWidth: 1, borderColor: 'rgba(46,204,113,0.25)' },
  noteTxt:  { flex: 1, color: '#CFE9DA', fontSize: 11.5, fontFamily: 'Poppins_500Medium' },
});
