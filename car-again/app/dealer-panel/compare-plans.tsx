import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { D, DHeader } from '@/components/dealer/DealerUI';
import { AppColors } from '@/constants/theme';

const ORANGE = AppColors.gradientEnd;

interface Row {
  icon: any;
  label: string;
  basic: string | null;
  premium: string | null;
  enterprise: string | null;
}

const ROWS: Row[] = [
  { icon: 'car',          label: 'Active Vehicle Listings', basic: 'Up to 5',  premium: 'Up to 20',  enterprise: 'Unlimited'    },
  { icon: 'chatbubbles',  label: 'Enquiries / month',       basic: '50',       premium: '200',       enterprise: 'Unlimited'    },
  { icon: 'megaphone',    label: 'Ad Placement',            basic: 'Standard', premium: 'Featured',  enterprise: 'Top Featured' },
  { icon: 'headset',      label: 'Support',                 basic: 'Chat',     premium: 'Priority',  enterprise: '24/7 Priority'},
  { icon: 'stats-chart',  label: 'Analytics',               basic: 'Basic',    premium: 'Detailed',  enterprise: 'Advanced'     },
  { icon: 'document',     label: 'Brochure Upload',         basic: null,       premium: 'check',     enterprise: 'check'        },
  { icon: 'images',       label: 'Gallery Photos',          basic: '10',       premium: '20',        enterprise: '50'           },
  { icon: null,           label: 'Verified Dealer Badge',   basic: null,       premium: 'check',     enterprise: 'check'        },
  { icon: null,           label: 'Custom Dealership Page',  basic: null,       premium: null,        enterprise: 'check'        },
];

const COL = 68;

function Cell({ value, highlight }: { value: string | null; highlight: boolean }) {
  return (
    <View style={ct.cell}>
      {value === 'check'
        ? <Ionicons name="checkmark" size={22} color={highlight ? ORANGE : '#FFFFFF'} />
        : <Text style={[ct.cellTxt, highlight && { color: ORANGE }]}>{value === null ? '—' : value}</Text>}
    </View>
  );
}

export default function ComparePlansScreen() {
  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.container}>
        {/* HEADER (Figma) */}
        <DHeader title="Vehicle Details" center titleStyle={{ fontSize: 18 }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <Text style={s.title}>Compare Plans</Text>

          {/* COLUMN HEADERS */}
          <View style={[s.row, { paddingTop: 34, paddingBottom: 16 }]}>
            <View style={{ flex: 1 }}/>
            <Text style={ct.colLabel}>Basic</Text>
            <Text style={[ct.colLabel, { color: ORANGE }]}>Premium</Text>
            <Text style={ct.colLabel}>Professional</Text>
          </View>
          <View style={s.rowDivider}/>

          {/* ROWS */}
          {ROWS.map((row, i) => (
            <View key={i}>
              <View style={s.row}>
                <View style={s.featureCol}>
                  {row.icon ? <Ionicons name={row.icon} size={18} color="#FFFFFF" /> : <View style={{ width: 18 }} />}
                  <Text style={s.featureLabel}>{row.label}</Text>
                </View>
                <Cell value={row.basic}      highlight={false}/>
                <Cell value={row.premium}    highlight={true}/>
                <Cell value={row.enterprise} highlight={false}/>
              </View>
              <View style={s.rowDivider}/>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: D.bg },
  container: { flex: 1, backgroundColor: D.bg },
  scroll:    { paddingHorizontal: 16, paddingBottom: 40 },
  title:     { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },
  row:       { flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingVertical: 10 },
  rowDivider:{ height: 1, backgroundColor: 'rgba(255,255,255,0.14)' },
  featureCol:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, paddingRight: 6, paddingLeft: 4 },
  featureLabel:{ flex: 1, color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_600SemiBold', lineHeight: 21 },
});

const ct = StyleSheet.create({
  colLabel: { width: COL + 8, color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  cell:     { width: COL + 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  cellTxt:  { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 21 },
});
