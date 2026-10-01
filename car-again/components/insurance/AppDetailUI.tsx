// Figma "Applications Details" pieces — shared by the insurance policy + claim detail screens.
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { D, OutlineCard, WarmCard } from '@/components/dealer/DealerUI';

const ORANGE = '#E2671B';

// Full-width navy band: "PENDING REVIEW" + applied date
export function StatusBand({ label, date }: { label: string; date: string }) {
  return (
    <View style={a.band}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <MaterialCommunityIcons name="clipboard-clock-outline" size={24} color={ORANGE} />
        <Text style={a.bandTxt}>{label}</Text>
      </View>
      <Text style={a.bandDate}>Applied: {date}</Text>
    </View>
  );
}

// Warm applicant card with avatar, contact and chassis #
export function ApplicantCard({
  name, phone, email, avatar, chassis, onCopy,
}: { name: string; phone: string; email: string; avatar?: string | null; chassis: string; onCopy?: () => void }) {
  return (
    <WarmCard style={a.applicant}>
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
          <View style={a.row}><Ionicons name="call-outline" size={18} color="#fff" /><Text style={a.sub}>{phone}</Text></View>
          <View style={a.row}><Ionicons name="mail-outline" size={18} color="#fff" /><Text style={a.sub} numberOfLines={1}>{email}</Text></View>
        </View>
      </View>
      <Text style={a.chassisLabel}>Chassis #</Text>
      <TouchableOpacity style={a.row} onPress={onCopy} activeOpacity={0.7}>
        <Text style={a.chassis}>{chassis}</Text>
        <Ionicons name="copy-outline" size={18} color="#E6E1E8" />
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
          <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => onOpen?.(d.uri)} style={{ alignItems: 'center' }}>
            <Image source={{ uri: d.uri }} style={a.docImg} resizeMode="cover" />
            <Text style={a.docLabel}>{d.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Timeline: done = filled orange check; last/current = outlined orange (title orange)
export function Timeline({ steps }: { steps: { title: string; sub: string; current?: boolean }[] }) {
  return (
    <View style={{ marginTop: 34 }}>
      <Text style={a.tlTitle}>Application Timeline</Text>
      {steps.map((st, i) => {
        const last = i === steps.length - 1;
        return (
          <View key={st.title} style={a.tlItem}>
            {!last && <View style={[a.tlLine, { backgroundColor: i === 0 ? ORANGE : '#C9BDC4' }]} />}
            <View style={[a.tlDot, st.current && a.tlDotCurrent]}>
              <Ionicons name="checkmark" size={16} color={st.current ? ORANGE : '#fff'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[a.tlH, st.current && { color: ORANGE }]}>{st.title}</Text>
              <Text style={a.tlP}>{st.sub}</Text>
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

  applicant:   { marginHorizontal: 16, padding: 22, borderRadius: 20 },
  avatar:      { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: '#E6E1E8' },
  avatarBadge: { position: 'absolute', bottom: 0, right: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  name:        { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_600SemiBold' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  sub:         { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
  chassisLabel:{ marginTop: 18, color: '#D9C6F0', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  chassis:     { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_700Bold' },

  table:      { marginHorizontal: 16, marginTop: 20, paddingTop: 22, paddingHorizontal: 22 },
  tableTitle: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_500Medium', marginBottom: 10 },
  tableRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, gap: 10 },
  tableLine:  { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.14)' },
  tableLabel: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  tableValue: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_400Regular', flexShrink: 1, textAlign: 'right' },

  docHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 14 },
  docTitle: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Poppins_600SemiBold' },
  viewAll:  { color: ORANGE, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  docImg:   { width: 130, height: 130, borderRadius: 12, borderWidth: 1, borderColor: '#E6E1E8' },
  docLabel: { color: D.muted, fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginTop: 8 },

  tlTitle:      { color: '#FFFFFF', fontSize: 22, fontFamily: 'Poppins_600SemiBold', marginBottom: 18 },
  tlItem:       { flexDirection: 'row', gap: 14, paddingBottom: 26, position: 'relative' },
  tlLine:       { position: 'absolute', left: 14, top: 30, bottom: 0, width: 2 },
  tlDot:        { width: 30, height: 30, borderRadius: 15, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  tlDotCurrent: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: ORANGE },
  tlH:          { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  tlP:          { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_500Medium', marginTop: 2 },
});
