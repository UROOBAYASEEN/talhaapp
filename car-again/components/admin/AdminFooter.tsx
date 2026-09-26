import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type TabName = 'home' | 'partners' | 'ads' | 'payments' | 'actions';

const TABS = [
  { name: 'home'     as TabName, icon: 'home',                   label: 'Home',     route: '/(admin)'          },
  { name: 'partners' as TabName, icon: 'account-group-outline',  label: 'Partners', route: '/(admin)/partners'  },
  { name: 'ads'      as TabName, icon: 'clipboard-text-outline', label: 'Ads list', route: '/(admin)/approve-listings' },
  { name: 'payments' as TabName, icon: 'cash-register',          label: 'Payments', route: '/(admin)/payments'  },
  { name: 'actions'  as TabName, icon: 'lightning-bolt-outline', label: 'Actions',  route: '/(admin)/settings'  },
];

export default function AdminFooter({ active }: { active: TabName }) {
  const router = useRouter();

  return (
    <View style={styles.bottomNav}>
      {TABS.map((tab) => {
        const isActive = active === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.item}
            onPress={() => tab.route && router.replace(tab.route as any)}
          >
            <View style={[styles.iconBox, isActive && styles.activeIconBox]}>
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={21}
                color={isActive ? '#FF6B00' : '#AEB9D0'}
              />
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 14,
    height: 58,
    borderRadius: 32,
    backgroundColor: '#082257',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
  },
  item: {
    width: 52,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  activeIconBox: {
    borderWidth: 1,
    borderColor: '#6D7E9D',
    backgroundColor: '#102E62',
  },
  label: {
    color: '#A7B1C5',
    fontSize: 8,
    marginTop: -1,
  },
  activeLabel: {
    color: '#fff',
  },
});
