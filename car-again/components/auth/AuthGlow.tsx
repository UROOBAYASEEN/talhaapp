// Shared bits of the Figma auth screens (register / login / create password)
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { GlassButton } from '@/components/shared/GlowUI';

export function PassRule({ met, label }: { met: boolean; label: string }) {
  const color = met ? '#2ECC71' : '#FF6B6D';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
      <Ionicons name="checkmark-circle-outline" size={17} color={color} />
      <Text style={{ fontSize: 13, color, fontFamily: 'Poppins_400Regular' }}>{label}</Text>
    </View>
  );
}

export function SocialButtons() {
  const soon = () => Alert.alert('Coming soon', 'Social login is available in the production app. Please use your phone number and password.');
  return (
    <>
      <GlassButton
        title="Continue with Google"
        height={50}
        fontSize={17}
        color="#E6E1E8"
        onPress={soon}
        icon={<Image source={require('@/assets/Icons/google.png')} style={{ width: 26, height: 26 }} resizeMode="contain" />}
      />
      <GlassButton
        title="Continue with Apple"
        height={50}
        fontSize={17}
        color="#E6E1E8"
        onPress={soon}
        icon={<Ionicons name="logo-apple" size={26} color="#E6E1E8" />}
      />
    </>
  );
}
