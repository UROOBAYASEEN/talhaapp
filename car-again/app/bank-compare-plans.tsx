import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/theme';

const ORANGE  = '#FF6B35';
const BG      = '#010A1F';
const BORDER  = '#1E2338';
const DASH    = '#4B5060';

const ROWS = [
  { icon: 'car-outline',               label: 'Active Vehicle\nListings',   values: ['Up to 5', 'Up to 20', 'Unlimited']          },
  { icon: 'chatbubble-ellipses-outline',label: 'Enquiries / month',          values: ['50', '200', 'Unlimited']                    },
  { icon: 'megaphone-outline',          label: 'Ad Placement',               values: ['Standard', 'Featured', 'Top\nFeatured']     },
  { icon: 'headset-outline',            label: 'Support',                    values: ['Chat', 'Priority', '24/7\nPriority']        },
  { icon: 'bar-chart-outline',          label: 'Analytics',                  values: ['Basic', 'Detailed', 'Advanced']             },
  { icon: 'document-outline',           label: 'Brochure Upload',            values: ['dash', 'check', 'check']                    },
  { icon: 'images-outline',             label: 'Gallery Photos',             values: ['10', '20', '50']                            },
  { icon: null,                         label: 'Verified Dealer\nBadge',     values: ['dash', 'check', 'check']                    },
  { icon: null,                         label: 'Custom\nDealership Page',    values: ['dash', 'dash', 'check']                     },
];

const COLUMNS             = ['Basic', 'Premium', 'Professional'];
const HIGHLIGHT_COL_INDEX = 1;

function CellValue({ value, highlighted }: { value: string; highlighted: boolean }) {
  if (value === 'check') {
    return <Ionicons name="checkmark" size={18} color={highlighted ? ORANGE : AppColors.textPrimary} />;
  }
  if (value === 'dash') {
    return <Text style={s.dashText}>—</Text>;
  }
  return <Text style={[s.valueText, highlighted && s.highlightText]}>{value}</Text>;
}

export default function BankComparePlans() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* HEADER */}
      <View style={s.topHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={AppColors.textSecondary} />
        </TouchableOpacity>
        <Text style={s.topHeaderTitle}>Vehicle Detail</Text>
      </View>

      <Text style={s.pageTitle}>Compare Plans</Text>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
      >
        {/* COLUMN HEADERS */}
        <View style={s.headerRow}>
          <View style={s.labelCol} />
          {COLUMNS.map((col, i) => (
            <Text key={col} style={[s.columnHeaderText, i === HIGHLIGHT_COL_INDEX && s.highlightText]}>
              {col}
            </Text>
          ))}
        </View>
        <View style={s.divider} />

        {/* ROWS */}
        {ROWS.map((row, rowIndex) => (
          <View key={rowIndex}>
            <View style={s.row}>
              <View style={s.labelCol}>
                {row.icon && (
                  <View style={s.iconWrap}>
                    <Ionicons name={row.icon as any} size={18} color={AppColors.textPrimary} />
                  </View>
                )}
                <Text style={[s.labelText, !row.icon && s.labelTextNoIcon]}>{row.label}</Text>
              </View>
              {row.values.map((val, colIndex) => (
                <View key={colIndex} style={s.valueCol}>
                  <CellValue value={val} highlighted={colIndex === HIGHLIGHT_COL_INDEX} />
                </View>
              ))}
            </View>
            <View style={s.divider} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: BG },
  scroll:      { flex: 1 },

  topHeader:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  topHeaderTitle: { color: AppColors.textSecondary, fontSize: 16, fontFamily: 'Poppins_600SemiBold', position: 'absolute', left: 0, right: 0, textAlign: 'center', zIndex: -1, top: 20 },

  pageTitle:   { color: AppColors.textPrimary, fontSize: 16, fontFamily: 'Poppins_700Bold', paddingHorizontal: 20, marginTop: 16, marginBottom: 18 },

  headerRow:        { flexDirection: 'row', alignItems: 'center' },
  labelCol:         { flex: 1.4, flexDirection: 'row', alignItems: 'center' },
  columnHeaderText: { flex: 1, color: AppColors.textPrimary, fontSize: 12, fontFamily: 'Poppins_500Medium', textAlign: 'center' },

  divider:     { height: 1, backgroundColor: BORDER, marginVertical: 16 },

  row:         { flexDirection: 'row', alignItems: 'center' },
  iconWrap:    { width: 22, alignItems: 'center', marginRight: 10 },
  labelText:   { flex: 1, color: AppColors.textPrimary, fontSize: 11, fontFamily: 'Poppins_700Bold', lineHeight: 16 },
  labelTextNoIcon: { marginLeft: 32 },

  valueCol:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  valueText:   { color: AppColors.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 16 },
  dashText:    { color: DASH, fontSize: 16 },
  highlightText:{ color: ORANGE, fontFamily: 'Poppins_600SemiBold' },
});
