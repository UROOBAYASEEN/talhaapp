import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { AppColors, useAppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';
import { logApi, logApiError } from '@/constants/apiLog';
import { useAuth } from '@/contexts/AuthContext';

import SheetModal from '@/components/shared/SheetModal';
import { useTabBarSpace } from '@/components/shared/PillTabBar';
type Msg = { id: string; from: 'user' | 'bot'; text: string; time?: string };

const BOT_GREETING = 'Welcome to Autowizor — Pakistan\'s Connected Auto Ecosystem. I\'m your assistant. How may I help you today?';

const QUICK_CHIPS = ['Insurance plans', 'Tracker price', 'Auto financing', 'Compare cars'];

function nowTime() {
  return new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
}

// `aboveTabBar` = lift the FAB clear of the floating bottom tab bar (panel dashboards); customer Home keeps bottom: 90
export default function Chatbot({ aboveTabBar }: { aboveTabBar?: boolean } = {}) {
  const tabSpace = useTabBarSpace(90, 12);
  const { token } = useAuth();
  const C = useAppColors();
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([{ id: '0', from: 'bot', text: BOT_GREETING, time: nowTime() }]);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  async function send(text?: string) {
    const txt = (text ?? input).trim();
    if (!txt || sending) return;
    const u: Msg = { id: Date.now().toString(), from: 'user', text: txt, time: nowTime() };
    setMessages((prev) => [...prev, u]);
    setInput('');
    setSending(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const history = messages.slice(-8).map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
      const url = `${API_BASE}/chatbot`;
      const t0 = Date.now();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: txt, history }),
      }).catch(e => { logApiError('Chatbot', 'POST', url, e, t0); throw e; });
      const data = await res.json().catch(() => ({}));
      logApi('Chatbot', 'POST', url, res, data, t0);
      const reply = data.reply || 'Apologies — I couldn’t respond. Please try again.';
      const b: Msg = { id: (Date.now() + 1).toString(), from: 'bot', text: reply, time: nowTime() };
      setMessages((prev) => [...prev, b]);
    } catch {
      const b: Msg = { id: (Date.now() + 1).toString(), from: 'bot', text: 'Network issue — please check connection and try again.', time: nowTime() };
      setMessages((prev) => [...prev, b]);
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <>
      {/* FAB — just icon, no border/shade (user request) */}
      <TouchableOpacity style={[cb.fabSimple, aboveTabBar && { bottom: tabSpace }]} activeOpacity={0.88} onPress={() => setVisible(true)}>
        <Image source={require('@/assets/images/autowizor-logo-icon.png')} style={cb.fabLogoSimple} resizeMode="contain" />
      </TouchableOpacity>

      <SheetModal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={[cb.overlay, { backgroundColor: C.isDark ? 'rgba(1,10,31,0.62)' : 'rgba(0,0,0,0.35)' }]}>
          <View style={[cb.sheet, { backgroundColor: C.bg, borderColor: C.isDark ? 'rgba(100,160,255,0.22)' : 'rgba(3,12,40,0.12)' }]}>
            {/* Subtle top glow */}
            <LinearGradient colors={C.isDark ? ['rgba(22,64,136,0.14)', 'transparent'] : ['rgba(3,42,105,0.06)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.7 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            {/* Handle bar */}
            <View style={[cb.handle, { backgroundColor: C.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(3,12,40,0.15)' }]} />
            {/* Header — classic decent */}
            <View style={[cb.header, { borderBottomColor: C.divider, backgroundColor: C.isDark ? 'rgba(6,27,74,0.55)' : 'rgba(240,244,255,1)' }]}>
              <View style={cb.headerLeft}>
                <View style={[cb.headerAvatar, { backgroundColor: C.isDark ? 'rgba(3,12,40,1)' : '#e8eeff', borderColor: C.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,12,40,0.1)' }]}>
                  <Image source={require('@/assets/images/autowizor-logo-icon.png')} style={cb.headerAvatarImg} resizeMode="contain" />
                  <View style={[cb.onlineDot, { borderColor: C.isDark ? '#061B4A' : '#eef1ff' }]} />
                </View>
                <View>
                  <Text style={[cb.headerTitle, { color: C.textPrimary }]}>Autowizor Assistant</Text>
                  <View style={cb.headerSubRow}>
                    <View style={cb.liveDot} />
                    <Text style={[cb.headerSub, { color: C.textSecondary }]}>Online • Replies instantly</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => setVisible(false)} style={[cb.closeBtn, { backgroundColor: C.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(3,12,40,0.07)', borderColor: C.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(3,12,40,0.08)' }]} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Quick chips — decent classic */}
            <View style={[cb.chipsRow, { borderBottomColor: C.divider, backgroundColor: C.isDark ? 'rgba(3,12,40,0.35)' : 'rgba(240,244,255,0.9)' }]}>
              {QUICK_CHIPS.map((c) => (
                <TouchableOpacity key={c} style={[cb.chip, { backgroundColor: C.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.95)', borderColor: C.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(3,12,40,0.1)' }]} onPress={() => send(c)} activeOpacity={0.85}>
                  <Text style={[cb.chipTxt, { color: C.textPrimary }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={cb.list}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => (
                <View style={[cb.row, item.from === 'user' ? cb.rowUser : cb.rowBot]}>
                  {item.from === 'bot' && (
                    <View style={cb.botAvatar}>
                      <Image source={require('@/assets/images/autowizor-logo-icon.png')} style={cb.botAvatarImg} resizeMode="contain" />
                    </View>
                  )}
                  <View style={[cb.bubble, item.from === 'bot' ? [cb.bubbleBot, { backgroundColor: C.isDark ? 'rgba(6,27,74,0.72)' : 'rgba(255,255,255,0.95)', borderColor: C.isDark ? 'rgba(100,160,255,0.22)' : 'rgba(3,12,40,0.12)' }] : cb.bubbleUser]}>
                    <Text style={[cb.bubbleTxt, { color: item.from === 'bot' ? C.textPrimary : '#fff' }]}>{item.text}</Text>
                    <Text style={[cb.timeTxt, { color: item.from === 'bot' ? C.textSecondary : 'rgba(255,255,255,0.65)', textAlign: item.from === 'user' ? 'right' : 'left' }]}>{item.time}</Text>
                  </View>
                </View>
              )}
            />

            {sending && (
              <View style={cb.typingRow}>
                <View style={cb.typingDots}>
                  <View style={[cb.dot, cb.dot1]} />
                  <View style={[cb.dot, cb.dot2]} />
                  <View style={[cb.dot, cb.dot3]} />
                </View>
                <Text style={cb.typingTxt}>Assistant is typing…</Text>
              </View>
            )}

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={[cb.inputBar, { backgroundColor: C.isDark ? 'rgba(1,10,31,1)' : '#ffffff', borderTopColor: C.divider }]}>
                <View style={[cb.inputWrap, { borderColor: C.isDark ? 'rgba(100,160,255,0.22)' : 'rgba(3,12,40,0.12)', backgroundColor: C.isDark ? 'rgba(3,12,40,0.7)' : 'rgba(240,244,255,1)' }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={C.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[cb.input, { color: C.textPrimary }]}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Ask about cars, insurance, tracker..."
                    placeholderTextColor={C.textPlaceholder}
                    returnKeyType="send"
                    onSubmitEditing={() => send()}
                    editable={!sending}
                  />
                </View>
                <TouchableOpacity style={[cb.sendBtn, (!input.trim() || sending) && { opacity: 0.6 }]} onPress={() => send()} disabled={!input.trim() || sending} activeOpacity={0.88}>
                  <LinearGradient colors={[AppColors.gradientStart, AppColors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                  <Ionicons name="send" size={15} color="#fff" style={{ marginLeft: 1 }} />
                </TouchableOpacity>
              </View>
              <Text style={[cb.powered, { color: C.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(3,12,40,0.5)' }]}>Powered by Autowizor • Gemini • Runtime only</Text>
            </KeyboardAvoidingView>
          </View>
        </View>
      </SheetModal>
    </>
  );
}

const cb = StyleSheet.create({
  fabShadow: {
    position: 'absolute',
    bottom: 88,
    right: 14,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(226,103,27,0.18)',
    zIndex: 49,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: AppColors.bg,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    zIndex: 50,
  },
  fabSimple: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    backgroundColor: 'transparent',
  },
  fabLogoSimple: { width: 58, height: 58 },
  fabLogo: { width: 30, height: 30 },
  fabDot: { position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#010A1F' },
  overlay: { flex: 1, backgroundColor: 'rgba(1,10,31,0.62)', justifyContent: 'flex-end' },
  sheet: {
    height: '74%',
    backgroundColor: AppColors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(100,160,255,0.22)',
    overflow: 'hidden',
    paddingBottom: 10,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(6,27,74,0.55)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(3,12,40,1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  headerAvatarImg: { width: 22, height: 22 },
  onlineDot: { position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#061B4A' },
  headerTitle: { color: AppColors.textPrimary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.2 },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  headerSub: { color: AppColors.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(3,12,40,0.35)' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipTxt: { color: AppColors.textPrimary, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowBot: { justifyContent: 'flex-start' },
  botAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(3,12,40,1)', borderWidth: 1, borderColor: 'rgba(100,160,255,0.25)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 2 },
  botAvatarImg: { width: 16, height: 16 },
  bubble: { maxWidth: '76%', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 },
  bubbleBot: { backgroundColor: 'rgba(6,27,74,0.72)', borderColor: 'rgba(100,160,255,0.22)', borderBottomLeftRadius: 6 },
  bubbleUser: { backgroundColor: AppColors.gradientEnd, borderColor: 'rgba(226,103,27,0.35)', borderBottomRightRadius: 6 },
  bubbleTxt: { color: AppColors.textPrimary, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19 },
  timeTxt: { color: AppColors.textSecondary, fontSize: 9, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 6 },
  typingDots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dot1: { opacity: 0.9 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.35 },
  typingTxt: { color: AppColors.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', fontStyle: 'italic' },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, backgroundColor: 'rgba(1,10,31,1)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  inputWrap: { flex: 1, height: 46, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(100,160,255,0.22)', backgroundColor: 'rgba(3,12,40,0.7)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  input: { flex: 1, color: AppColors.textPrimary, fontSize: 13, fontFamily: 'Poppins_400Regular', padding: 0 },
  sendBtn: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  powered: { textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: 'Poppins_400Regular', marginTop: 6, letterSpacing: 0.4 },
});
