import { AppColors, useAppColors } from '@/constants/theme';
import React from 'react';
import { Modal, ModalProps, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Bottom-sheet modals ke liye RN Modal ka drop-in replacement.
// Android (edge-to-edge) pe Modal ki window kabhi status bar jitni chhoti ban jati thi aur
// kabhi nav bar ka inset do dafa lag jata tha — sheet ke neeche ek "cover" sa ban jata tha
// aur button device ke back/home buttons ke peeche chhup jata tha.
// Yahan window hamesha full-screen (edge-to-edge) hoti hai aur content nav bar ke bilkul upar khatam hota hai.
export default function SheetModal({ children, ...props }: ModalProps) {
  const insets = useSafeAreaInsets();
  const C = useAppColors();
  const bottom = Platform.OS === 'android' ? insets.bottom : 0;
  return (
    <Modal {...props} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.fill, { paddingBottom: bottom }]}>{children}</View>
      {bottom > 0 && (
        <View
          pointerEvents="none"
          style={[styles.navStrip, { height: bottom, backgroundColor: C.isDark ? AppColors.bg : '#ffffff' }]}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  navStrip: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
