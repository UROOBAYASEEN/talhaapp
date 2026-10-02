import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import {
  ChevronLeft,
  ArrowLeftRight,
  Building2,
  ShieldCheck,
  MapPin,
} from 'lucide-react-native';
import { useAppColors } from '@/constants/theme';
import { SavedCardEffect } from "@/components/shared/FigmaEffects";

const { width } = Dimensions.get('window');

const WHITE = '#F4F4F7';
const MUTED = '#8E98AF';
const ORANGE = '#FF6B00';

type Partner = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
};

const partners: Partner[] = [
  {
    id: 'dealer',
    title: 'Official Dealer',
    subtitle: 'Add Car Dealership',
    icon: ArrowLeftRight,
  },
  {
    id: 'bank',
    title: 'Bank',
    subtitle: 'Add Banking Partner',
    icon: Building2,
  },
  {
    id: 'insurance',
    title: 'Insurance Company',
    subtitle: 'Add Insurance Partner',
    icon: ShieldCheck,
  },
  {
    id: 'tracker',
    title: 'Tracker Company',
    subtitle: 'Add Tracker Partner',
    icon: MapPin,
  },
];

export default function AddPartnerScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const [selected, setSelected] = useState('dealer');

  return (
    <View style={[styles.container, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>

        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: aC.isDark ? 'transparent' : '#ffffff', borderBottomWidth: aC.isDark ? 0 : 1, borderBottomColor: 'rgba(3,42,105,0.08)' }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={27} color={aC.isDark ? "#B7B9C5" : "#475569"} strokeWidth={1.8} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Add Partner</Text>
        </View>

        {/* TITLE */}
        <Text style={[styles.selectTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>Select Partner Type</Text>

        {/* PARTNER OPTIONS */}
        <View style={styles.optionsContainer}>
          {partners.map((partner) => {
            const Icon = partner.icon;
            const isSelected = selected === partner.id;

            return (
              <TouchableOpacity
                key={partner.id}
                activeOpacity={0.85}
                onPress={() => setSelected(partner.id)}
              >
                <View
                  style={[styles.partnerCard, isSelected && styles.selectedCard, { backgroundColor: aC.isDark ? '#010A1F' : '#ffffff', borderColor: isSelected ? (aC.isDark ? '#5685C4' : ORANGE) : (aC.isDark ? '#4973AE' : 'rgba(3,42,105,0.12)'), shadowColor: aC.isDark ? 'transparent' : 'rgba(3,42,105,0.12)', shadowOpacity: aC.isDark ? 0 : 0.08, elevation: aC.isDark ? 0 : 2 }]}
                >
                  {aC.isDark ? (
                    <SavedCardEffect band={12} />
                  ) : (
                    <>
                      <LinearGradient colors={['rgba(3,42,105,0.04)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                      <LinearGradient colors={['transparent', 'rgba(226,103,27,0.07)']} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                    </>
                  )}
                  <View style={styles.partnerIcon}>
                    <Icon size={22} color={ORANGE} strokeWidth={2} />
                  </View>

                  <View style={styles.textContainer}>
                    <Text style={[styles.partnerTitle, { color: aC.isDark ? WHITE : '#010a1f' }]}>{partner.title}</Text>
                    <Text style={[styles.partnerSubtitle, { color: aC.isDark ? MUTED : '#475569' }]}>{partner.subtitle}</Text>
                  </View>

                  <View style={[styles.radioOuter, { backgroundColor: aC.isDark ? '#0C2A59' : '#ffffff', borderColor: isSelected ? (aC.isDark ? '#6686B4' : ORANGE) : (aC.isDark ? '#31558C' : 'rgba(3,42,105,0.15)') }, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={[styles.radioInner, { backgroundColor: aC.isDark ? '#547AB2' : ORANGE }]} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CONTINUE BUTTON */}
        <View style={styles.continueContainer}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push({ pathname: '/(admin)/company-info', params: { partnerType: selected } } as any)}>
            <LinearGradient
              colors={['#032A69', '#E2671B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.continueButton, { overflow: 'hidden' }]}
            >
              <LinearGradient
                colors={['rgba(22,64,136,0.4)', 'transparent']}
                start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
                style={StyleSheet.absoluteFillObject} pointerEvents="none"
              />
              <LinearGradient
                colors={['rgba(13,37,84,0.3)', 'transparent']}
                start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }}
                style={StyleSheet.absoluteFillObject} pointerEvents="none"
              />
              <LinearGradient
                colors={['transparent', 'rgba(29,83,175,0.3)']}
                start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject} pointerEvents="none"
              />
              <Text style={styles.continueText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#010A1F" },
  safeArea:  { flex: 1, backgroundColor: "#010A1F" },

  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingBottom: 10,
    marginTop: 4,
  },
  backButton: {
    width: 35,
    height: 45,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingBottom: 2,
  },
  headerTitle: {
    color: WHITE,
    fontSize: 19,
    fontWeight: '600',
    marginLeft: 28,
    letterSpacing: 0.1,
  },

  selectTitle: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '400',
    marginTop: 13,
    marginLeft: 20,
    marginBottom: 23,
  },

  optionsContainer: {
    paddingHorizontal: 18,
  },

  partnerCard: {
    height: 82,
    width: '100%',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#4973AE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    marginBottom: 16,
    overflow: 'hidden',
  },
  selectedCard: {
    borderColor: '#5685C4',
  },

  partnerIcon: {
    width: 39,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 14,
  },
  partnerTitle: {
    color: WHITE,
    fontSize: 14.5,
    fontWeight: '500',
    marginBottom: 5,
  },
  partnerSubtitle: {
    color: MUTED,
    fontSize: 12.5,
    fontWeight: '400',
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#31558C',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C2A59',
  },
  radioOuterSelected: {
    borderColor: '#6686B4',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#547AB2',
  },

  continueContainer: {
    position: 'absolute',
    left: 34,
    right: 34,
    bottom: 40,
  },
  continueButton: {
    height: 48,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
