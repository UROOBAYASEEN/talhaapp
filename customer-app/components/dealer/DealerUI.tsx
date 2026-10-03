// Figma dealer-panel UI kit — shared by every dealer screen.
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { InsetGlow, SavedCardEffect, savedCardOuter, ActionPanelGlass, SearchInputEffect } from '@/components/shared/FigmaEffects';
import { ActionPanelBg } from '@/components/shared/ActionFooterGlow';
import { API_BASE } from '@/constants/api';

export const D = {
  bg:      '#010A1F',
  navy:    '#0B2358',
  navy2:   '#071C49',
  white:   '#F2F1F5',
  text:    '#E6E1E8',
  muted:   '#BAACB6',
  orange:  '#E2671B',
  green:   '#2ECC71',
  red:     '#FF3B3B',
  line:    'rgba(255,255,255,0.12)',
  border:  '#82a5d5',
};

export const DICON = {
  activeReservations: require('@/assets/DealerPanelIcons/activeReservations.png'),
  add:                require('@/assets/DealerPanelIcons/add.png'),
  addVideoAdd:        require('@/assets/DealerPanelIcons/addVideoAdd.png'),
  advertisement:      require('@/assets/DealerPanelIcons/advertisement.png'),
  avgCTR:             require('@/assets/DealerPanelIcons/avgCTR.png'),
  basicPlan:          require('@/assets/DealerPanelIcons/basicPlan.png'),
  chat:               require('@/assets/DealerPanelIcons/chat.png'),
  comparePlans:       require('@/assets/DealerPanelIcons/comparePlans.png'),
  conversions:        require('@/assets/DealerPanelIcons/conversions.png'),
  customers:          require('@/assets/DealerPanelIcons/customers.png'),
  dealershipCar:      require('@/assets/DealerPanelIcons/dealershipCar.png'),
  generateMoreLeads:  require('@/assets/DealerPanelIcons/generateMoreLeads.png'),
  impressions:        require('@/assets/DealerPanelIcons/impressions.png'),
  increaseVisiblity:  require('@/assets/DealerPanelIcons/increaseVisiblity.png'),
  promoteVehicle:     require('@/assets/DealerPanelIcons/promoteVehicle.png'),
  reservations:       require('@/assets/DealerPanelIcons/reservations.png'),
  subscription:       require('@/assets/DealerPanelIcons/subscription.png'),
  totalSpend:         require('@/assets/DealerPanelIcons/totalSpend.png'),
  totalVehicles:      require('@/assets/DealerPanelIcons/totalVehicles.png'),
};

export function DIcon({ src, size = 22, style }: { src: any; size?: number; style?: any }) {
  return <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}

// ── Screen shell: flat #010A1F ──
export function DScreen({ children, edges = ['top'] }: { children: React.ReactNode; edges?: any }) {
  return <SafeAreaView style={{ flex: 1, backgroundColor: D.bg }} edges={edges}>{children}</SafeAreaView>;
}

// ── Header: grey chevron + title (left-aligned by default, or centred) + optional right slot ──
export function DHeader({
  title, onBack, right, center, titleStyle,
}: { title: string; onBack?: () => void; right?: React.ReactNode; center?: boolean; titleStyle?: any }) {
  const router = useRouter();
  return (
    <View style={k.header}>
      <TouchableOpacity onPress={onBack ?? (() => router.back())} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={k.headerBack}>
        <Ionicons name="chevron-back" size={26} color={D.muted} />
      </TouchableOpacity>
      <Text style={[k.headerTitle, center && { flex: 1, textAlign: 'center', marginRight: right ? 0 : 34 }, titleStyle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{title}</Text>
      {!center && <View style={{ flex: 1 }} />}
      {right}
    </View>
  );
}

// "Save Draft" header action (orange floppy + two-line label)
export function SaveDraftAction({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={k.saveDraft} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Ionicons name="save-outline" size={24} color={D.orange} />
      <Text style={k.saveDraftTxt}>{'Save\nDraft'}</Text>
    </TouchableOpacity>
  );
}

// ── Glass card — the saved-file vehicle-card effect ──
export function GlowCard({
  children, style, onPress, radius = 18,
}: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; radius?: number }) {
  const Box: any = onPress ? TouchableOpacity : View;
  return (
    <Box style={[savedCardOuter, { borderRadius: radius }, style]} onPress={onPress} activeOpacity={0.88}>
      <SavedCardEffect />
      {children}
    </Box>
  );
}

// Plain outlined card (thin grey border, no glow)
export function OutlineCard({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[k.outline, style]}>{children}</View>;
}

// ── Warm card: navy → brown gradient with an orange border (tip banners, reservation ID, promo) ──
// Border is a gradient: orange on top → blue at the bottom (Figma), unless `borderColor` is given.
export const WARM_BORDER = ['#E2671B', '#8A4E4A', '#2A3F82', '#1D3A80'];
export function WarmCard({
  children, style, colors = ['#0A1A45', '#0E1E45', '#2C2A45', '#5A3A36'], locations = [0, 0.45, 0.75, 1], borderColor, borderColors = WARM_BORDER,
}: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; colors?: string[]; locations?: number[]; borderColor?: string; borderColors?: string[] }) {
  const flat = StyleSheet.flatten(style) || {};
  const radius = (flat.borderRadius as number) ?? 18;
  const { padding, paddingHorizontal, paddingVertical, paddingTop, paddingBottom, paddingLeft, paddingRight,
    flexDirection, alignItems, justifyContent, gap, ...outer } = flat as any;
  const inner = { padding, paddingHorizontal, paddingVertical, paddingTop, paddingBottom, paddingLeft, paddingRight, flexDirection, alignItems, justifyContent, gap };
  return (
    <LinearGradient
      colors={(borderColor ? [borderColor, borderColor] : borderColors) as any}
      start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
      style={[outer, { borderRadius: radius, padding: 1.2 }]}
    >
      <View style={[{ borderRadius: radius - 1, overflow: 'hidden', flexGrow: 1 }, inner]}>
        <LinearGradient colors={colors as any} locations={locations as any} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} />
        {children}
      </View>
    </LinearGradient>
  );
}

// ── Lightbulb tip banner ──
export function TipBanner({ text, title, onPress, style }: { text: string; title?: string; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const Box: any = onPress ? TouchableOpacity : View;
  return (
    <Box onPress={onPress} activeOpacity={0.88}>
      <WarmCard style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 14 }, style]}>
        <Ionicons name="bulb" size={30} color="#FBC02D" />
        <View style={{ flex: 1 }}>
          {title ? <Text style={k.tipTitle}>{title}</Text> : null}
          <Text style={k.tipTxt}>{text}</Text>
        </View>
      </WarmCard>
    </Box>
  );
}

// Selected-pill glow (Figma): soft blue fading in from all four sides, leaving a
// squarish (rounded-rect) dark navy area around the text. Kept light and soft.
export function PillGlow() {
  // Figma: blue #133368 right at the border, fading into the dark #05122A centre
  const blue = 'rgba(19,51,104,1)';
  return (
    <>
      <LinearGradient colors={[blue, 'transparent', 'transparent', blue]} locations={[0, 0.29, 0.71, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <LinearGradient colors={[blue, 'transparent', 'transparent', blue]} locations={[0, 0.21, 0.79, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    </>
  );
}

// ── Filter pills: selected = glass w/ orange text, others = flat navy ──
export function FilterPills<T extends string>({
  items, value, onChange, style, badges, small, labels,
}: { items: readonly T[]; value: T; onChange: (v: T) => void; style?: StyleProp<ViewStyle>; badges?: Partial<Record<T, number>>; small?: boolean; labels?: Partial<Record<T, string>> }) {
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, style]}>
      {items.map(it => {
        const sel = it === value;
        const badge = badges?.[it];
        return (
          <TouchableOpacity key={it} activeOpacity={0.85} onPress={() => onChange(it)} style={{ overflow: 'visible' }}>
            <View style={[k.pill, small && k.pillSm, sel ? k.pillOn : k.pillOff]}>
              <View style={[StyleSheet.absoluteFillObject, { opacity: sel ? 1 : 0 }]} pointerEvents="none"><PillGlow /></View>
              <Text style={[k.pillTxt, sel && { color: D.orange, fontFamily: 'Poppins_600SemiBold' }]}>{labels?.[it] ?? it}</Text>
            </View>
            {badge ? <View style={k.badge}><Text style={k.badgeTxt}>{badge}</Text></View> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Segmented two-way tabs (Monthly | Yearly, Banner | Video ads) ──
export function SegTabs<T extends string>({ items, value, onChange }: { items: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={k.seg}>
      {items.map((it, i) => {
        const sel = it === value;
        return (
          <React.Fragment key={it}>
            {i > 0 && <View style={k.segSep} />}
            <TouchableOpacity style={{ flex: 1, paddingVertical: 4 }} activeOpacity={0.85} onPress={() => onChange(it)}>
              <View style={[k.segItem, sel ? k.segOn : k.segOff]}>
                {/* same rounded effect as the "inventory menu" pill */}
                <View style={[StyleSheet.absoluteFillObject, { opacity: sel ? 1 : 0, borderRadius: 16, overflow: 'hidden' }]} pointerEvents="none"><PillGlow /></View>
                <Text style={[k.segTxt, sel && { color: D.orange }]}>{it}</Text>
              </View>
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ── Glass search field (+ optional orange "Sort") ──
// `savedSearch` = the exact search-input effect from the Saved screen
export function SearchBar({ onSort, sortLabel = 'Sort', savedSearch, ...props }: TextInputProps & { onSort?: () => void; sortLabel?: string; savedSearch?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={savedSearch ? [k.search, k.savedSearch] : [savedCardOuter, k.search]}>
        {savedSearch ? <SearchInputEffect radius={32} /> : <SavedCardEffect band={10} />}
        <Ionicons name="search-outline" size={22} color="#C9C6D0" style={{ marginLeft: 16 }} />
        <TextInput placeholderTextColor="#9C96A2" {...props} style={[k.searchInput, props.style]} />
      </View>
      {onSort ? (
        <TouchableOpacity style={k.sort} onPress={onSort}>
          <MaterialIcons name="sort" size={26} color={D.orange} />
          <Text style={k.sortTxt}>{sortLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── Glass text input / select pill ──
export function DField({
  label, right, left, multiline, containerStyle, ...props
}: TextInputProps & { label?: string; right?: React.ReactNode; left?: React.ReactNode; containerStyle?: StyleProp<ViewStyle> }) {
  return (
    <View style={containerStyle}>
      {label ? <Text style={k.label}>{label}</Text> : null}
      <View style={[savedCardOuter, k.field, multiline && k.fieldMulti]}>
        <SavedCardEffect band={10} />
        {left ? <View style={{ paddingLeft: 18 }}>{left}</View> : null}
        <TextInput placeholderTextColor="#9C96A2" multiline={multiline} {...props}
          style={[k.fieldInput, multiline && { textAlignVertical: 'top', paddingTop: 14, height: '100%' }, props.style]} />
        {right ? <View style={{ paddingRight: 16 }}>{right}</View> : null}
      </View>
    </View>
  );
}

export function DSelect({
  label, value, placeholder, onPress, icon = 'chevron-down', containerStyle,
}: { label?: string; value?: string; placeholder?: string; onPress?: () => void; icon?: any; containerStyle?: StyleProp<ViewStyle> }) {
  return (
    <View style={containerStyle}>
      {label ? <Text style={k.label}>{label}</Text> : null}
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[savedCardOuter, k.field]}>
        <SavedCardEffect band={10} />
        <Text style={[k.fieldInput, { paddingTop: 0, textAlignVertical: 'center' }, !value && { color: '#9C96A2' }]} numberOfLines={1}>{value || placeholder}</Text>
        {icon ? <Ionicons name={icon} size={18} color={D.muted} style={{ marginRight: 16 }} /> : null}
      </TouchableOpacity>
    </View>
  );
}

// ── Chips (multi / single select): selected = orange border + brown fill + orange text ──
export function Chip({ label, selected, onPress, small }: { label: string; selected?: boolean; onPress?: () => void; small?: boolean }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}
      style={[k.chip, small && k.chipSm, selected ? k.chipOn : k.chipOff]}>
      <Text style={[k.chipTxt, small && { fontSize: 11 }, selected && { color: D.orange }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function AddChip({ onPress, small }: { onPress?: () => void; small?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={[k.chip, k.chipOff, small && k.chipSm, { paddingHorizontal: small ? 8 : 10 }]}>
      <Ionicons name="add" size={small ? 16 : 20} color={D.white} />
    </TouchableOpacity>
  );
}

// ── Status pills ──
export function StatusPill({ label, tone = 'green', style }: { label: string; tone?: 'green' | 'red' | 'orange' | 'blue'; style?: any }) {
  const c = {
    green:  { bg: '#0B2A22', fg: '#2ECC71', bd: 'rgba(46,204,113,0.35)' },
    red:    { bg: '#3A1520', fg: '#E0363A', bd: 'rgba(224,54,58,0.3)' },
    orange: { bg: '#3A2420', fg: '#C9713F', bd: 'rgba(226,103,27,0.3)' },
    blue:   { bg: '#0E2A55', fg: '#7FB0FF', bd: 'rgba(127,176,255,0.3)' },
  }[tone];
  return (
    <View style={[k.status, { backgroundColor: c.bg, borderColor: c.bd }, style]}>
      <Text style={[k.statusTxt, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

// Small gradient "Edit"/"Delete" button used on inventory rows
export function MiniGradBtn({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ borderRadius: 14, overflow: 'hidden' }}>
      <LinearGradient colors={['#1D3A7A', '#6E4A52', '#C8622E']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={k.miniBtn}>
        <Text style={k.miniBtnTxt}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function Verified({ size = 18 }: { size?: number }) {
  return <MaterialIcons name="verified" size={size} color="#3B8BF6" />;
}

// ── Radio (white ring, filled dot when selected) ──
export function Radio({ on, size = 22 }: { on: boolean; size?: number }) {
  return (
    <View style={[k.radio, { width: size, height: size, borderRadius: size / 2 }, on && k.radioOn]}>
      {on && <View style={{ width: size * 0.42, height: size * 0.42, borderRadius: size, backgroundColor: '#FFFFFF' }} />}
    </View>
  );
}

// ── Fixed bottom glass panel (Publish / Save as Draft) ──
// `glass` = reusable ActionPanelGlass background (navy centre, blue glowing edges)
// `fx` = "Publish Banner / Save as Draft" panel effect (components/shared/ActionFooterGlow)
export function BottomActions({ children, glass, fx }: { children: React.ReactNode; glass?: boolean; fx?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[k.bottom, { paddingBottom: Math.max(insets.bottom, 10) + 6 }, fx && { paddingHorizontal: 32, paddingTop: 12, gap: 11, paddingBottom: Math.max(insets.bottom + 12, 22), borderTopWidth: 0, backgroundColor: '#0A1838' }]}>
      {fx
        ? <ActionPanelBg />
        : glass
        ? <ActionPanelGlass />
        : <LinearGradient colors={['rgba(23,52,110,0.92)', 'rgba(12,30,70,0.96)']} style={StyleSheet.absoluteFillObject} />}
      {children}
    </View>
  );
}

// ── Promotion plan option (Hot selling / Home page / New listing, 6 / 4 / 2 weeks) ──
export function PlanOption({
  title, sub, price, selected, onPress, fire,
}: { title: string; sub: string; price: string; selected: boolean; onPress: () => void; fire?: boolean }) {
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress}
      style={[k.planOpt, selected ? k.planOptOn : k.planOptOff]}>
      {!selected && <SavedCardEffect band={12} color="#2A55A066" />}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {fire && <Ionicons name="flame-outline" size={20} color={D.orange} />}
          <Text style={k.planTitle}>{title}</Text>
        </View>
        <Text style={k.planSub}>{sub}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <Radio on={selected} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={k.planPrice}>{price}</Text>
          <Ionicons name="chevron-forward" size={16} color={D.orange} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Big promo card with the orange corner flame (Add vehicle / Special offer / Video ads)
export function PromoCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <WarmCard borderColor="rgba(220,210,220,0.7)" colors={['#0A1A45', '#0E1E48', '#2A2640', '#5A3526']} locations={[0, 0.4, 0.72, 1]}
      style={{ borderRadius: 24, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 18 }}>
      <View style={k.corner} />
      <Ionicons name="flame-outline" size={26} color="#FFFFFF" style={{ position: 'absolute', top: 8, left: 10 }} />
      <Text style={k.promoTitle}>{title}</Text>
      <Text style={k.promoSub}>{sub}</Text>
      <View style={{ gap: 12, marginTop: 14 }}>{children}</View>
    </WarmCard>
  );
}

// Terms checkbox row
export function TermsRow({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
      <View style={[k.checkCircle, checked && { backgroundColor: D.orange, borderColor: D.orange }]}>
        {checked && <Ionicons name="checkmark" size={13} color="#fff" />}
      </View>
      <Text style={k.termsTxt}>I confirm that I have read and accept the terms and conditions and privacy policy.</Text>
    </TouchableOpacity>
  );
}

// Dashed upload box
export function UploadBox({ title, sub, onPress, children }: { title: string; sub: string; onPress?: () => void; children?: React.ReactNode }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={k.upload}>
      {children || (
        <>
          <Ionicons name="share-outline" size={40} color={D.orange} />
          <Text style={k.uploadTitle}>{title}</Text>
          <Text style={k.uploadSub}>{sub}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export const dk = StyleSheet.create({
  sec:   { color: D.white, fontSize: 18, fontFamily: 'Poppins_500Medium' },
  label: { color: D.white, fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginTop: 18, marginBottom: 10 },
  muted: { color: D.muted, fontSize: 12, fontFamily: 'Poppins_400Regular' },
});

const k = StyleSheet.create({
  header:      { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  headerBack:  { width: 30, height: 40, justifyContent: 'center' },
  headerTitle: { color: D.white, fontSize: 20, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
  saveDraft:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveDraftTxt:{ color: D.white, fontSize: 11, fontFamily: 'Poppins_500Medium', lineHeight: 13 },

  outline:  { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', padding: 16 },
  tipTitle: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginBottom: 2 },
  tipTxt:   { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },

  pill:     { height: 48, minWidth: 64, paddingHorizontal: 22, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pillSm:   { height: 34, minWidth: 56, paddingHorizontal: 18, borderRadius: 17 },
  pillOff:  { backgroundColor: D.navy, borderColor: D.navy },
  // Figma: dark navy centre (#05122A) with a blue (#15356B) glow fading in from every edge
  pillOn:   { backgroundColor: '#05122A', borderColor: '#7F98C4', overflow: 'hidden' },
  pillTxt:  { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_500Medium' },
  badge:    { position: 'absolute', top: -8, left: -4, minWidth: 22, height: 22, borderRadius: 11, backgroundColor: D.orange, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeTxt: { color: '#fff', fontSize: 10, fontFamily: 'Poppins_600SemiBold' },

  seg:     { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.14)', paddingBottom: 8 },
  segSep:  { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.14)' },
  segItem: { height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 },
  segTxt:  { color: '#E6E1E8', fontSize: 16, fontFamily: 'Poppins_500Medium' },
  segOn:   { backgroundColor: '#05122A', borderWidth: 1, borderColor: '#7F98C4', overflow: 'hidden' },
  segOff:  { borderWidth: 1, borderColor: 'transparent' },

  search:      { flex: 1, height: 46, borderRadius: 23, flexDirection: 'row', alignItems: 'center' },
  savedSearch: { height: 48, borderRadius: 32, borderWidth: 1, borderColor: '#829fd0', overflow: 'hidden', backgroundColor: '#061124' },
  searchInput: { flex: 1, height: '100%', paddingHorizontal: 12, color: D.white, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  sort:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortTxt:     { color: D.white, fontSize: 18, fontFamily: 'Poppins_400Regular' },

  label:      { color: D.muted, fontSize: 14, fontFamily: 'Poppins_500Medium', marginTop: 16, marginBottom: 8 },
  field:      { height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center' },
  fieldMulti: { height: 120, borderRadius: 18, alignItems: 'stretch' },
  fieldInput: { flex: 1, height: '100%', paddingHorizontal: 20, color: D.white, fontSize: 13, fontFamily: 'Poppins_500Medium' },

  chip:    { height: 36, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipSm:  { height: 28, paddingHorizontal: 12, borderRadius: 14 },
  chipOn:  { backgroundColor: '#2A1A1C', borderColor: D.orange },
  chipOff: { backgroundColor: D.navy, borderColor: 'rgba(130,165,213,0.45)' },
  chipTxt: { color: D.muted, fontSize: 13, fontFamily: 'Poppins_500Medium' },

  status:    { borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 3 },
  statusTxt: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  miniBtn:   { height: 28, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  miniBtnTxt:{ color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins_500Medium' },

  radio:   { borderWidth: 1.5, borderColor: 'rgba(200,210,230,0.8)', backgroundColor: 'rgba(30,58,110,0.6)', alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: '#FFFFFF', backgroundColor: '#1D3B78' },

  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 16, gap: 12, overflow: 'hidden', borderTopWidth: 1, borderColor: 'rgba(130,165,213,0.35)' },

  planOpt:   { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden' },
  planOptOn: { backgroundColor: '#0A1F55', borderWidth: 1, borderColor: 'rgba(130,165,213,0.35)' },
  // translucent: lets the card's navy → brown gradient show through (2-weeks row turns warm)
  planOptOff:{ backgroundColor: 'rgba(12,24,60,0.28)', borderWidth: 1, borderColor: 'rgba(130,165,213,0.75)' },
  planTitle: { color: D.white, fontSize: 17, fontFamily: 'Poppins_500Medium' },
  planSub:   { color: D.muted, fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  planPrice: { color: D.orange, fontSize: 16, fontFamily: 'Poppins_500Medium' },

  corner:    { position: 'absolute', top: 0, left: 0, width: 0, height: 0, borderTopWidth: 78, borderRightWidth: 78, borderTopColor: D.orange, borderRightColor: 'transparent' },
  promoTitle:{ color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_600SemiBold', lineHeight: 28, marginLeft: 26 },
  promoSub:  { color: D.muted, fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 24, marginTop: 4, marginLeft: 26 },

  checkCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#C9C6D0', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  termsTxt:    { flex: 1, color: D.muted, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20 },

  upload:      { borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.3)', borderRadius: 16, minHeight: 150, alignItems: 'center', justifyContent: 'center', padding: 18, gap: 6 },
  uploadTitle: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  uploadSub:   { color: D.muted, fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
});

// ── Vehicle image URL (relative → absolute) ──
const SERVER = API_BASE.replace('/api/v1', '');
export function dImg(url?: string | null) {
  if (!url || url.startsWith('file://')) return null;
  return url.startsWith('http') ? url : `${SERVER}${url}`;
}

// ── Vehicle row card (Inventory / Select to promote / Promotion analytics / Payment summary) ──
export function VehicleRowCard({
  v, dealer, promoted, children, style, right, footer,
}: { v: any; dealer?: string; promoted?: boolean; children?: React.ReactNode; style?: StyleProp<ViewStyle>; right?: React.ReactNode; footer?: React.ReactNode }) {
  const img = dImg(v?.images?.[0]);
  const title = v?.title || `${v?.make || ''} ${v?.model || ''} ${v?.variant || ''}`.trim() || 'Vehicle';
  return (
    <GlowCard style={[{ padding: 14 }, style]}>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <View style={vr.imgWrap}>
          {img
            ? <Image source={{ uri: img }} style={vr.img} resizeMode="cover" />
            : <View style={[vr.img, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1D4A' }]}><Ionicons name="car-outline" size={30} color={D.muted} /></View>}
          {promoted && <View style={vr.promo}><Text style={vr.promoTxt}>Promoted</Text></View>}
        </View>
        <View style={{ flex: 1 }}>
          {right ? <View style={{ alignItems: 'flex-end', marginBottom: 2 }}>{right}</View> : null}
          <Text style={vr.title} numberOfLines={1}>{title}</Text>
          <Text style={vr.color} numberOfLines={1}>{v?.color || '—'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Text style={vr.dealer} numberOfLines={1}>{dealer || v?.location || v?.city || 'Dealership'}</Text>
            <Verified size={18} />
          </View>
          {footer ? <View style={vr.footer}>{footer}</View> : null}
        </View>
      </View>
      {children}
    </GlowCard>
  );
}

const vr = StyleSheet.create({
  imgWrap: { width: 118, height: 108, borderRadius: 12, overflow: 'hidden', alignSelf: 'center' },
  footer:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 'auto', paddingTop: 12 },
  img:     { width: '100%', height: '100%' },
  promo:   { position: 'absolute', top: 6, left: 0, backgroundColor: D.orange, borderTopRightRadius: 10, borderBottomRightRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  promoTxt:{ color: '#fff', fontSize: 11, fontFamily: 'Poppins_500Medium' },
  title:   { color: D.white, fontSize: 15, fontFamily: 'Poppins_500Medium' },
  color:   { color: D.white, fontSize: 13, fontFamily: 'Poppins_500Medium', marginTop: 6 },
  dealer:  { color: D.white, fontSize: 13, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
});
