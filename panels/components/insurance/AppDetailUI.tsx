// Figma "Applications Details" pieces — shared by the insurance policy + claim detail screens.
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { D, OutlineCard, WarmCard } from '@/components/dealer/DealerUI';

const ORANGE = '#E2671B';

// Full-width navy band: "PENDING REVIEW" + applied date
// `compact` = Figma insurance Application Details size (a bit smaller)
export function StatusBand({ label, date, small, compact }: { label: string; date: string; small?: boolean; compact?: boolean }) {
  return (
    <View style={[a.band, compact && a.bandCompact]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 8 : 10 }}>
        <MaterialCommunityIcons name="clipboard-clock-outline" size={compact ? 19 : 24} color={ORANGE} />
        <Text style={[a.bandTxt, (small || compact) && { fontSize: 12 }]}>{label}</Text>
      </View>
      <Text style={[a.bandDate, (small || compact) && { fontSize: 12 }]}>Applied: {date}</Text>
    </View>
  );
}

// Warm applicant card with avatar, contact and chassis #
export function ApplicantCard({
  name, phone, email, avatar, chassis, onCopy, idLabel = 'Chassis #', colors, locations, compact,
}: { name: string; phone: string; email?: string; avatar?: string | null; chassis: string; onCopy?: () => void; idLabel?: string; colors?: string[]; locations?: number[]; compact?: boolean }) {
  // `compact` = Figma insurance Application Details (smaller phone / email / chassis text)
  const ic = compact ? 15 : 18;
  return (
    <WarmCard style={a.applicant} colors={colors} locations={locations}>
      <View style={{ flexDirection: 'row', gap: 18 }}>
        <View>
          {avatar
            ? <Image source={{ uri: avatar }} style={a.avatar} />
            : <View style={[a.avatar, { backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 26 }}>{(name || 'U')[0].toUpperCase()}</Text>
              </View>}
          <View style={a.avatarBadge}><MaterialCommunityIcons name="check-decagram" size={16} color="#fff" /></View>
        </View>
        <View style={{ flex: 1, paddingTop: 2 }}>
          <Text style={a.name} numberOfLines={1}>{name}</Text>
          <View style={a.row}><Ionicons name="call-outline" size={ic} color="#fff" /><Text style={[a.sub, compact && a.subC]}>{phone}</Text></View>
          {email ? <View style={a.row}><Ionicons name="mail-outline" size={ic} color="#fff" /><Text style={[a.sub, compact && a.subC]} numberOfLines={1}>{email}</Text></View> : null}
        </View>
      </View>
      <Text style={[a.chassisLabel, compact && a.chassisLabelC]}>{idLabel}</Text>
      <TouchableOpacity style={a.row} onPress={onCopy} activeOpacity={0.7}>
        <Text style={[a.chassis, compact && a.chassisC]}>{chassis}</Text>
        <Ionicons name="copy-outline" size={ic} color="#E6E1E8" />
      </TouchableOpacity>
    </WarmCard>
  );
}

// Outlined card with a title and label/value rows
export function InfoTable({ title, rows, children }: { title?: string; rows: { label: string; value: React.ReactNode }[]; children?: React.ReactNode }) {
  return (
    <OutlineCard style={a.table}>
      {title ? <Text style={a.tableTitle}>{title}</Text> : null}
      {rows.map((r, i) => (
        <View key={r.label} style={[a.tableRow, i < rows.length - 1 && a.tableLine]}>
          <Text style={a.tableLabel}>{r.label}</Text>
          {typeof r.value === 'string' || typeof r.value === 'number'
            ? <Text style={a.tableValue} numberOfLines={1}>{r.value}</Text>
            : r.value}
        </View>
      ))}
      {children}
    </OutlineCard>
  );
}

// Horizontal document thumbnails
export function DocGallery({ docs, onViewAll, onOpen }: { docs: { uri: string; label: string }[]; onViewAll?: () => void; onOpen?: (uri: string) => void }) {
  return (
    <View style={{ marginTop: 26 }}>
      <View style={a.docHead}>
        <Text style={a.docTitle}>Document Gallery</Text>
        <TouchableOpacity onPress={onViewAll}><Text style={a.viewAll}>View All</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
        {docs.map((d, i) => (
          <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => onOpen?.(d.uri)} style={{ alignItems: 'center', width: 104 }}>
            <Image source={{ uri: d.uri }} style={a.docImg} resizeMode="cover" />
            <Text style={a.docLabel} numberOfLines={1}>{d.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Timeline: done = filled orange check; last/current = outlined orange (title orange)
// `compact` = Figma insurance Application Details (smaller, softer)
export function Timeline({ steps, compact }: { steps: { title: string; sub: string; current?: boolean }[]; compact?: boolean }) {
  return (
    <View style={{ marginTop: compact ? 28 : 34 }}>
      <Text style={[a.tlTitle, compact && a.tlTitleC]}>Application Timeline</Text>
      {steps.map((st, i) => {
        const last = i === steps.length - 1;
        return (
          <View key={st.title} style={[a.tlItem, compact && a.tlItemC]}>
            {!last && <View style={[a.tlLine, compact && a.tlLineC, { backgroundColor: i === 0 ? ORANGE : compact ? 'rgba(201,189,196,0.45)' : '#C9BDC4' }]} />}
            <View style={[a.tlDot, compact && a.tlDotC, st.current && a.tlDotCurrent]}>
              <Ionicons name="checkmark" size={compact ? 13 : 16} color={st.current ? ORANGE : '#fff'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[a.tlH, compact && a.tlHC, st.current && { color: ORANGE }]}>{st.title}</Text>
              <Text style={[a.tlP, compact && a.tlPC]}>{st.sub}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const a = StyleSheet.create({
  band:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0B2358', paddingHorizontal: 20, paddingVertical: 12, marginBottom: 20 },
  bandTxt:  { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.4 },
  bandDate: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  bandCompact: { backgroundColor: '#071C49', paddingHorizontal: 26, paddingVertical: 12 },

  applicant:   { marginHorizontal: 16, padding: 22, borderRadius: 20 },
  avatar:      { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: '#E6E1E8' },
  avatarBadge: { position: 'absolute', bottom: 0, right: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  name:        { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_600SemiBold' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  sub:         { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  chassisLabel:{ marginTop: 18, color: '#D9C6F0', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  chassis:     { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_700Bold' },
  subC:          { fontSize: 13 },
  chassisLabelC: { marginTop: 16, fontSize: 12 },
  chassisC:      { fontSize: 17 },

  table:      { marginHorizontal: 16, marginTop: 20, paddingTop: 22, paddingHorizontal: 22 },
  tableTitle: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_500Medium', marginBottom: 10 },
  tableRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, gap: 10 },
  tableLine:  { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.14)' },
  tableLabel: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  tableValue: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_400Regular', flexShrink: 1, textAlign: 'right' },

  docHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 14 },
  docTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  viewAll:  { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  docImg:   { width: 104, height: 104, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(230,225,232,0.5)' },
  docLabel: { color: D.muted, fontSize: 11, fontFamily: 'Poppins_500Medium', marginTop: 6, textAlign: 'center', alignSelf: 'stretch' },

  tlTitle:      { color: '#FFFFFF', fontSize: 22, fontFamily: 'Poppins_600SemiBold', marginBottom: 18 },
  tlItem:       { flexDirection: 'row', gap: 14, paddingBottom: 26, position: 'relative' },
  tlLine:       { position: 'absolute', left: 14, top: 30, bottom: 0, width: 2 },
  tlDot:        { width: 30, height: 30, borderRadius: 15, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  tlDotCurrent: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: ORANGE },
  tlH:          { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  tlP:          { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_500Medium', marginTop: 2 },
  tlTitleC:     { fontSize: 18, marginBottom: 16 },
  tlItemC:      { gap: 12, paddingBottom: 20 },
  tlLineC:      { left: 11, top: 26, bottom: 2, width: 1.5 },
  tlDotC:       { width: 24, height: 24, borderRadius: 12 },
  tlHC:         { fontSize: 14, fontFamily: 'Poppins_500Medium', lineHeight: 22 },
  tlPC:         { fontSize: 11.5, fontFamily: 'Poppins_400Regular', color: D.muted, marginTop: 1, lineHeight: 17 },
});
