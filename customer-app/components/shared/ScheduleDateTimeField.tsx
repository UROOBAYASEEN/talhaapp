import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { DField } from '@/components/dealer/DealerUI';

const ORANGE = '#E2671B';

// "2026-10-16T14:30:00" (local time, seconds 00) — backend `fromisoformat` / datetime isey parse kar leta hai
function toLocalIso(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

function parse(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// Field mein dikhne wala text — placeholder (mm/dd/yyyy) jaisa format + time
export function formatScheduleDateTime(value?: string | null) {
  const d = parse(value);
  if (!d) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  const h = d.getHours() % 12 || 12;
  return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()} ${h}:${p(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
}

/**
 * Schedule Banner — Start / End Date & Time field.
 * Same DField look; tap pe @react-native-community/datetimepicker se pehle date phir time select hota hai.
 * `value` / `onChange` local ISO string ("YYYY-MM-DDTHH:mm:00") ya '' hota hai.
 */
export default function ScheduleDateTimeField({
  value, onChange, placeholder = 'mm/dd/yyyy', minimumDate,
}: {
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  minimumDate?: Date | null;
}) {
  const [iosOpen, setIosOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(new Date());

  const min = minimumDate ?? new Date();
  const initial = () => {
    const cur = parse(value);
    if (cur && cur >= min) return cur;
    return min > new Date() ? new Date(min) : new Date();
  };

  function open() {
    const start = initial();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: start,
        mode: 'date',
        minimumDate: min,
        onChange: (e, date) => {
          if (e.type !== 'set' || !date) return;
          DateTimePickerAndroid.open({
            value: start,
            mode: 'time',
            is24Hour: false,
            onChange: (e2, time) => {
              if (e2.type !== 'set' || !time) return;
              const picked = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes());
              onChange(toLocalIso(picked));
            },
          });
        },
      });
    } else {
      setIosDraft(start);
      setIosOpen(true);
    }
  }

  return (
    <>
      <TouchableOpacity activeOpacity={0.8} onPress={open}>
        <View pointerEvents="none">
          <DField placeholder={placeholder} value={formatScheduleDateTime(value)} editable={false} style={st.fieldTxt} />
        </View>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <Modal transparent visible={iosOpen} animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={st.overlay} onPress={() => setIosOpen(false)}>
            <Pressable style={st.sheet}>
              <DateTimePicker
                value={iosDraft}
                mode="datetime"
                display="inline"
                minimumDate={min}
                themeVariant="dark"
                accentColor={ORANGE}
                onChange={(_, d) => { if (d) setIosDraft(d); }}
              />
              <TouchableOpacity style={st.doneBtn} activeOpacity={0.85} onPress={() => { onChange(toLocalIso(iosDraft)); setIosOpen(false); }}>
                <Text style={st.doneTxt}>Done</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const st = StyleSheet.create({
  // Half-width field mein poori date + time fit ho (month kat na jaye)
  fieldTxt: { paddingHorizontal: 12, fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: '#061234', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(130,165,213,0.5)', padding: 16, paddingBottom: 32 },
  doneBtn: { height: 46, borderRadius: 23, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  doneTxt: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});
