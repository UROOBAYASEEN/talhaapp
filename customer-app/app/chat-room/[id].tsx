/**
 * Individual Chat Screen — Figma exact (node 401:411)
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Alert,
  Dimensions,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/constants/theme';

const EMOJI_CATEGORIES = [
  { label: '😊 Smileys', emojis: ['😀','😂','😊','😍','🥰','😎','😭','😅','🤣','😇','🥺','😏','😒','😔','😌','🤔','😴','🤗','😤','🤩','😆','😋','😜','🤪','😝','🥳','😱','😳','🤭','🫠'] },
  { label: '👋 Hands',   emojis: ['👍','👎','👏','🙌','🤝','🤜','✌️','🤞','👌','🤙','💪','🙏','👋','🫶','❤️‍🔥','🫂','💅','🤌','👀','🫡'] },
  { label: '❤️ Hearts',  emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️'] },
  { label: '🐶 Animals', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐸','🐵','🐔','🦄','🦋','🐬','🦈','🦅','🐙'] },
  { label: '🍕 Food',    emojis: ['🍕','🍔','🍟','🌮','🍣','🍜','🍩','🍦','🎂','☕','🧋','🍺','🥂','🍷','🍓','🍎','🥑','🌽','🎉','🔥'] },
  { label: '🚗 Objects', emojis: ['🚗','🚀','✈️','🎸','⚽','🏆','💎','💰','📱','💻','🎮','📸','🎯','🎭','🎪','🎬','🎵','🎹','🎤','🎧'] },
];

const GLASS_SHADOW = {
  shadowColor: '#1D53AF',
  shadowOffset: { width: 0, height: 7 },
  shadowOpacity: 0.5,
  shadowRadius: 14,
  elevation: 8,
};

function formatVehiclePrice(value: unknown): string {
  if (typeof value === 'string' && /\b(lac|lakh|crore)\b/i.test(value)) return value;
  const amount = Number(String(value ?? '').replace(/[^\d.]/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return '';
  if (amount >= 10_000_000) return `PKR ${Number((amount / 10_000_000).toFixed(2))} Crore`;
  if (amount >= 100_000) return `PKR ${Number((amount / 100_000).toFixed(2))} Lac`;
  return `PKR ${amount.toLocaleString()}`;
}


function makeStyles(aC: ReturnType<typeof useAppColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: aC.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 76, paddingHorizontal: 20, backgroundColor: aC.isDark ? '#010a1f' : aC.bg },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    backBtn: { padding: 2, marginRight: 2 },
    headerAvtWrap: { position: 'relative', width: 50, height: 50 },
    headerAvt: { width: 50, height: 50, borderRadius: 25, backgroundColor: aC.gradientStart, alignItems: 'center', justifyContent: 'center' },
    headerAvtTxt: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#f9fafc' },
    headerOnlineDot: { position: 'absolute', bottom: 2, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#26c77a', borderWidth: aC.isDark ? 1 : 1.5, borderColor: aC.isDark ? '#010a1f' : '#ffffff' },
    headerName: { fontSize: 16, fontFamily: 'Poppins_500Medium', color: aC.textPrimary },
    headerOnline: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#26c77a', marginTop: 2 },
    callBtn: { padding: 4 },
    headerOffline: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: aC.isDark ? aC.textSecondary : '#6b7280' },
    callOverlay: { flex: 1, backgroundColor: 'rgba(1,10,31,0.92)', alignItems: 'center', justifyContent: 'center' },
    callCard: { width: 300, backgroundColor: aC.glassBg, borderRadius: 24, borderWidth: 1, borderColor: aC.glassBorder, alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 12 },
    callAvtRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#0088ff', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    callAvt: { width: 86, height: 86, borderRadius: 43, backgroundColor: aC.gradientStart, alignItems: 'center', justifyContent: 'center' },
    callAvtTxt: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: '#f9fafc' },
    callName: { fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: aC.textPrimary },
    callStatus: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: aC.textSecondary },
    endCallBtn: { marginTop: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: '#e53935', alignItems: 'center', justifyContent: 'center' },
    callActions: { flexDirection: 'row', gap: 40, marginTop: 20 },
    declineBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e53935', alignItems: 'center', justifyContent: 'center' },
    acceptBtn:  { width: 64, height: 64, borderRadius: 32, backgroundColor: '#34c759', alignItems: 'center', justifyContent: 'center' },
    divider: { height: 1, backgroundColor: aC.isDark ? '#173569' : 'rgba(0,0,0,0.08)', marginBottom: 0 },
    vehicleCard: {
      flexDirection: 'row', alignItems: 'center', gap: 9, height: 70,
      borderRadius: 16, borderWidth: 1, borderColor: 'rgba(220,232,255,0.68)',
      backgroundColor: '#010a1f', paddingHorizontal: 7, paddingVertical: 6,
      marginHorizontal: 16, marginTop: 16, overflow: 'hidden',
    },
    vehicleImgPlaceholder: { width: 80, height: 56, borderRadius: 9, backgroundColor: aC.glassBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
    vehicleImg: { width: 80, height: 56, borderRadius: 9 },
    vehicleInfo: { flex: 1, gap: 1 },
    vehicleTitle: { fontSize: aC.isDark ? 12 : 13, fontFamily: 'Poppins_500Medium', color: aC.textPrimary },
    vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    vehicleMeta: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: aC.textSecondary },
    vehiclePrice: { fontSize: aC.isDark ? 12 : 13, fontFamily: 'Poppins_600SemiBold', color: '#e2671b' },
    messageList: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 16, gap: 22, flexGrow: 1 },
    todayWrap:  { alignItems: 'center', marginBottom: 2 },
    todayBadge: { backgroundColor: aC.isDark ? '#081f51' : '#0B1F4D', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5 },
    todayTxt: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: aC.isDark ? aC.textPrimary : '#ffffff' },
    msgRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
    msgRowMe: { flexDirection: 'row-reverse' },
    msgAvt: { width: aC.isDark ? 28 : 32, height: aC.isDark ? 28 : 32, borderRadius: aC.isDark ? 14 : 16, backgroundColor: aC.gradientStart, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
    msgAvtTxt: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#f9fafc' },
    msgAvtImg: { width: aC.isDark ? 28 : 32, height: aC.isDark ? 28 : 32, borderRadius: aC.isDark ? 14 : 16 },
    bubble: { maxWidth: '76%', minWidth: 150, borderRadius: aC.isDark ? 10 : 12, paddingHorizontal: aC.isDark ? 12 : 14, paddingTop: aC.isDark ? 9 : 10, paddingBottom: aC.isDark ? 7 : 8, gap: 2, borderWidth: 0, overflow: 'hidden' },
    bubbleThem: { backgroundColor: aC.isDark ? '#081e50' : '#17508A' },
    bubbleMe:   { backgroundColor: aC.isDark ? '#078cff' : '#E2671B' },
    bubbleTxt: { fontSize: aC.isDark ? 12 : 13, fontFamily: 'Poppins_400Regular', color: aC.isDark ? '#f9fafc' : '#ffffff', lineHeight: aC.isDark ? 19 : 20 },
    bubbleTime: { fontSize: 8, fontFamily: 'Poppins_400Regular', color: aC.isDark ? '#aba9bc' : 'rgba(255,255,255,0.85)', alignSelf: 'flex-end' },
    bubbleTimeMe: { color: '#f9fafc' },
    msgImg: { width: 180, height: 140, borderRadius: 10 },
    imgBubble: { position: 'relative', borderRadius: 10, overflow: 'hidden', maxWidth: '55%' },
    imgTime: { position: 'absolute', bottom: 4, right: 6, fontSize: 10, fontFamily: 'Poppins_400Regular', color: '#fff', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
    previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
    previewImg:     { width: SW, height: SH * 0.75 },
    previewClose:   { position: 'absolute', top: 50, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    inputBar: { flexDirection: 'row', alignItems: 'center', gap: aC.isDark ? 8 : 10, paddingHorizontal: aC.isDark ? 18 : 16, paddingVertical: 10 },
    inputIconBtn: { width: aC.isDark ? 34 : 42, height: aC.isDark ? 34 : 42, borderRadius: aC.isDark ? 17 : 21, backgroundColor: aC.isDark ? '#081f51' : '#17508A', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    inputFieldWrap: { flex: 1, minHeight: aC.isDark ? 34 : 42, maxHeight: 100, backgroundColor: aC.isDark ? '#081e50' : '#17508A', borderRadius: aC.isDark ? 18 : 21, flexDirection: 'row', alignItems: 'center', paddingRight: aC.isDark ? 5 : 8 },
    inputField: { flex: 1, minHeight: aC.isDark ? 34 : 42, maxHeight: 100, paddingHorizontal: aC.isDark ? 12 : 16, paddingVertical: 6, fontSize: aC.isDark ? 12 : 13, fontFamily: 'Poppins_400Regular', color: aC.isDark ? aC.textPrimary : '#ffffff' },
    emojiBtn: { padding: 4, flexShrink: 0 },
    recordingBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 6, backgroundColor: 'rgba(229,57,53,0.12)' },
    recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e53935' },
    recordingTxt: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#e53935' },
    voiceBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 140, paddingVertical: 2 },
    voiceTrackWrap: { flex: 1 },
    voiceTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2, marginBottom: 4 },
    voiceLabel: { fontSize: 9, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.65)' },
    emojiPickerWrap: { backgroundColor: aC.glassBg, borderTopWidth: 1, borderTopColor: aC.glassBorder, maxHeight: 260 },
    emojiCatScroll: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, gap: 6 },
    emojiCatLabel: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: aC.textSecondary, marginBottom: 4 },
    emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
    emojiBtn2: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
    emojiTxt: { fontSize: 22 },

    richCard:     { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '75%', borderRadius: 14, borderWidth: 1, borderColor: aC.isDark ? 'rgba(100,160,255,0.45)' : 'rgba(3,42,105,0.14)', backgroundColor: aC.isDark ? 'rgba(3,12,40,0.85)' : '#F2F4F8', paddingHorizontal: 12, paddingVertical: 10, overflow: 'hidden' },
    richCardIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(226,103,27,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    richCardType: { fontSize: 9, fontFamily: 'Poppins_500Medium', color: '#e2671b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    richCardTitle:{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: aC.isDark ? '#f9fafc' : '#000000' },
    richCardSub:  { fontSize: 11, fontFamily: 'Poppins_400Regular', color: aC.isDark ? '#baacb6' : '#4b5563', marginTop: 2 },
  });
}

export default function ChatRoomScreen() {
  const router = useRouter();
  const { id, name, vehicleTitle, vehiclePrice, vehicleCity, vehicleYear, vehicleId, otherId } =
    useLocalSearchParams<{ id: string; name: string; vehicleTitle?: string; vehiclePrice?: string; vehicleCity?: string; vehicleYear?: string; vehicleId?: string; otherId?: string }>();
  const { token, user } = useAuth();
  const aC     = useAppColors();
  const styles = useMemo(() => makeStyles(aC), [aC.isDark]);

  const [messages,        setMessages]        = useState<any[]>([]);
  const [input,           setInput]           = useState('');
  const [sending,         setSending]         = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [previewImg,      setPreviewImg]       = useState<string | null>(null);
  const [recording,       setRecording]        = useState<Audio.Recording | null>(null);
  const [isRecording,     setIsRecording]      = useState(false);
  const [playingId,       setPlayingId]        = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker]  = useState(false);
  const [resolvedOtherId, setResolvedOtherId]  = useState<string>(otherId || '');
  const [isOnline,        setIsOnline]         = useState(false);
  const [lastSeenText,    setLastSeenText]      = useState<string>('');
  const [convVehicle,     setConvVehicle]       = useState<{ id: string; title: string; price: string; city: string; year: string; transmission?: string; image?: string } | null>(null);
  const [otherPicture,    setOtherPicture]      = useState<string | null>(null);
  const [otherNameFetched, setOtherNameFetched] = useState<string>('');
  const [myPicture,       setMyPicture]         = useState<string | null>(null);
  // call state
  const [callState,    setCallState]    = useState<'idle' | 'calling' | 'incoming' | 'connected'>('idle');
  const [callId,       setCallId]       = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [incomingCall, setIncomingCall] = useState<{ id: string; callerName: string } | null>(null);

  const soundRef       = useRef<Audio.Sound | null>(null);
  const pulseAnim      = useRef(new Animated.Value(1)).current;
  const ringAnim       = useRef(new Animated.Value(1)).current;
  const flatRef        = useRef<FlatList>(null);
  const pollRef        = useRef<ReturnType<typeof setInterval>>();
  const statusPollRef  = useRef<ReturnType<typeof setInterval>>();
  const callPollRef    = useRef<ReturnType<typeof setInterval>>();
  const callTimerRef   = useRef<ReturnType<typeof setInterval>>();
  const heartbeatRef   = useRef<ReturnType<typeof setInterval>>();

  const loadMessages = useCallback(async () => {
    if (!token || !id) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setMessages(d.items || []); }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, [token, id]);

  // Load conversation meta: resolve otherId + name + avatar + vehicle info
  useEffect(() => {
    if (!token || !id) return;
    fetch(`${API_BASE}/chat/conversations/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(async d => {
        if (!d) return;
        if (!otherId && d.participant_info?.[0]?.id) setResolvedOtherId(d.participant_info[0].id);
        const p = d.participant_info?.[0];
        if (p?.full_name) setOtherNameFetched(p.full_name);
        const pic = p?.avatar_url || p?.profile_picture || p?.avatar || null;
        if (pic) {
          const base = API_BASE.replace('/api/v1', '');
          setOtherPicture(pic.startsWith('http') ? pic : `${base}${pic}`);
        }
        const vid = d.vehicle_id;
        if (vid) {
          try {
            const vr = await fetch(`${API_BASE}/vehicles/${vid}`, { headers: { Authorization: `Bearer ${token}` } });
            if (vr.ok) {
              const v = await vr.json();
              const base = API_BASE.replace('/api/v1', '');
              const rawImg = v.images?.[0];
              const imgUrl = rawImg
                ? (rawImg.startsWith('http') ? rawImg : `${base}${rawImg}`)
                : undefined;
              setConvVehicle({
                id:    vid,
                title: v.title || `${v.make} ${v.model}`,
                price: formatVehiclePrice(v.price),
                city:  v.city  || '',
                year:  v.year  ? String(v.year) : '',
                transmission: v.transmission || v.variant || '',
                image: imgUrl,
              });
            }
          } catch { /* ignore */ }
        }
      })
      .catch(() => {});
  }, [token, id]);

  // Resolve my own profile picture
  useEffect(() => {
    if (!token) return;
    const SERVER = API_BASE.replace('/api/v1', '');
    const rawPic = user?.avatar_url || null;
    if (rawPic) {
      setMyPicture(rawPic.startsWith('http') ? rawPic : `${SERVER}${rawPic}`);
      return;
    }
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const pic = d?.avatar_url || null;
        if (pic) setMyPicture(pic.startsWith('http') ? pic : `${SERVER}${pic}`);
      })
      .catch(() => {});
  }, [token, user?.avatar_url]);

  // Heartbeat — mark self as online
  useEffect(() => {
    if (!token) return;
    const beat = () => fetch(`${API_BASE}/users/heartbeat`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    beat();
    heartbeatRef.current = setInterval(beat, 30000);
    return () => clearInterval(heartbeatRef.current);
  }, [token]);

  // Poll other user status
  const fetchStatus = useCallback(async () => {
    const uid = resolvedOtherId;
    if (!uid || !token) return;
    try {
      const res = await fetch(`${API_BASE}/users/${uid}/status`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const d = await res.json();
      setIsOnline(d.is_online);
      if (!d.is_online && d.last_seen) {
        const seen  = new Date(d.last_seen);
        const now   = new Date();
        const timeStr = seen.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
        const isToday     = seen.toDateString() === now.toDateString();
        const yesterday   = new Date(now); yesterday.setDate(now.getDate() - 1);
        const isYesterday = seen.toDateString() === yesterday.toDateString();
        const isThisWeek  = (now.getTime() - seen.getTime()) < 7 * 24 * 60 * 60 * 1000;
        if (isToday)          setLastSeenText(`today at ${timeStr}`);
        else if (isYesterday) setLastSeenText(`yesterday at ${timeStr}`);
        else if (isThisWeek)  setLastSeenText(`${seen.toLocaleDateString('en-PK', { weekday: 'short' })} at ${timeStr}`);
        else                  setLastSeenText(`${seen.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })} at ${timeStr}`);
      } else if (!d.last_seen) {
        setLastSeenText('');
      }
    } catch { /* offline */ }
  }, [resolvedOtherId, token]);

  useEffect(() => {
    fetchStatus();
    statusPollRef.current = setInterval(fetchStatus, 10000);
    return () => clearInterval(statusPollRef.current);
  }, [fetchStatus]);

  // Poll incoming calls
  useEffect(() => {
    if (!token) return;
    const check = async () => {
      if (callState !== 'idle') return;
      try {
        const res = await fetch(`${API_BASE}/calls/incoming`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const d = await res.json();
        if (d.call) {
          setIncomingCall({ id: d.call.id, callerName: d.call.caller_name });
          setCallId(d.call.id);
          setCallState('incoming');
        }
      } catch { /* offline */ }
    };
    check();
    callPollRef.current = setInterval(check, 4000);
    return () => clearInterval(callPollRef.current);
  }, [token, callState]);

  // Poll call status when caller is waiting
  useEffect(() => {
    if (callState !== 'calling' || !callId || !token) return;
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/calls/${callId}/status`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const d = await res.json();
        if (d.status === 'accepted') {
          setCallState('connected');
          setCallDuration(0);
          callTimerRef.current = setInterval(() => setCallDuration(s => s + 1), 1000);
        } else if (d.status === 'declined' || d.status === 'ended' || d.status === 'missed') {
          clearInterval(callPollRef.current);
          setCallState('idle');
          setCallId(null);
          if (d.status === 'declined') Alert.alert('Call Declined', `${name} declined your call.`);
        }
      } catch { /* offline */ }
    };
    const p = setInterval(check, 2000);
    return () => clearInterval(p);
  }, [callState, callId, token]);

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => {
      clearInterval(pollRef.current);
      clearInterval(callTimerRef.current);
      soundRef.current?.unloadAsync();
    };
  }, [loadMessages]);

  // Ring animation for incoming/calling states
  useEffect(() => {
    if (callState === 'calling' || callState === 'incoming') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      ringAnim.stopAnimation();
      ringAnim.setValue(1);
    }
  }, [callState]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Call actions
  async function initiateCall() {
    if (!resolvedOtherId || !token) return;
    if (!isOnline) { Alert.alert('User Offline', `${name} is currently offline.`); return; }
    try {
      const res = await fetch(`${API_BASE}/calls/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ callee_id: resolvedOtherId, conversation_id: id }),
      });
      if (!res.ok) return;
      const d = await res.json();
      setCallId(d.call_id);
      setCallState('calling');
    } catch { Alert.alert('Error', 'Could not initiate call.'); }
  }

  async function acceptCall() {
    if (!callId || !token) return;
    try {
      await fetch(`${API_BASE}/calls/${callId}/accept`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setCallState('connected');
      setCallDuration(0);
      callTimerRef.current = setInterval(() => setCallDuration(s => s + 1), 1000);
    } catch { /* offline */ }
  }

  async function declineCall() {
    if (!callId || !token) return;
    try { await fetch(`${API_BASE}/calls/${callId}/decline`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }); } catch { /* offline */ }
    setCallState('idle');
    setCallId(null);
    setIncomingCall(null);
  }

  async function endCall() {
    clearInterval(callTimerRef.current);
    if (callId && token) {
      try { await fetch(`${API_BASE}/calls/${callId}/end`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }); } catch { /* offline */ }
    }
    setCallState('idle');
    setCallId(null);
    setIncomingCall(null);
    setCallDuration(0);
  }

  function fmtDuration(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  async function sendMessage() {
    if (!input.trim() || !token || sending) return;
    const text = input.trim();
    setInput('');
    setShowEmojiPicker(false);
    setSending(true);
    const tempMsg = { id: Date.now().toString(), sender_id: user?.id, content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    try {
      await fetch(`${API_BASE}/chat/conversations/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text }),
      });
      await loadMessages();
    } catch { /* keep optimistic msg */ }
    finally { setSending(false); }
  }

  async function pickAndSendImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission Required', 'Allow photo access to send images.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const tempMsg = { id: Date.now().toString(), sender_id: user?.id, content: '📷 Sending image...', created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    try {
      const form = new FormData();
      form.append('file', { uri: asset.uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
      const upRes = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (upRes.ok) {
        const upData = await upRes.json();
        const base = API_BASE.replace('/api/v1', '');
        const imageUrl = upData.url.startsWith('http') ? upData.url : `${base}${upData.url}`;
        await fetch(`${API_BASE}/chat/conversations/${id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: `[image]${imageUrl}` }),
        });
        await loadMessages();
      }
    } catch { /* offline */ }
  }

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { Alert.alert('Permission Required', 'Allow microphone access to send voice messages.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
    } catch { Alert.alert('Error', 'Could not start recording.'); }
  }

  async function stopAndSendVoice() {
    if (!recording) return;
    setIsRecording(false);
    const rec = recording;
    setRecording(null);
    try {
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: false });
      const uri = rec.getURI();
      if (!uri) return;
      const tempId = Date.now().toString();
      setMessages(prev => [...prev, { id: tempId, sender_id: user?.id, content: '[voice]sending...', created_at: new Date().toISOString() }]);
      const form = new FormData();
      form.append('file', { uri, name: 'voice.m4a', type: 'audio/mp4' } as any);
      const upRes = await fetch(`${API_BASE}/upload/audio`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      if (!upRes.ok) { setMessages(prev => prev.filter(m => m.id !== tempId)); return; }
      const upData = await upRes.json();
      const base = API_BASE.replace('/api/v1', '');
      const audioUrl = upData.url.startsWith('http') ? upData.url : `${base}${upData.url}`;
      await fetch(`${API_BASE}/chat/conversations/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: `[voice]${audioUrl}`, message_type: 'voice' }),
      });
      await loadMessages();
    } catch { /* offline */ }
  }

  async function playVoice(msgId: string, url: string) {
    if (playingId === msgId) {
      await soundRef.current?.pauseAsync();
      setPlayingId(null);
      return;
    }
    try {
      await soundRef.current?.unloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      setPlayingId(msgId);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) setPlayingId(null);
      });
    } catch { setPlayingId(null); }
  }

  function formatTime(iso: string) {
    if (!iso) return '';
    // Ensure UTC parse if no TZ
    let normalized = iso;
    if (!/[Z+-]/.test(iso.slice(-6)) && !iso.endsWith('Z')) {
      // No timezone info — assume UTC from server
      normalized = iso.replace(' ', 'T') + 'Z';
    }
    let d = new Date(normalized);
    if (isNaN(d.getTime())) d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    // Bilkul correct local time — exact device timezone
    return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  function isMe(msg: any) { return msg.sender_id === user?.id || msg.sender_id === 'me'; }
  function getInitials(n: string) { return (n || 'U').split(' ').map(c => c[0]).join('').toUpperCase().slice(0, 2); }

  const displayName = name || otherNameFetched || 'User';

  return (
    <SafeAreaView style={styles.safe} edges={!aC.isDark && Platform.OS === 'android' ? ['top', 'left', 'right'] : undefined}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={aC.isDark ? '#c7bfcc' : aC.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerAvtWrap}>
            {otherPicture ? (
              <Image source={{ uri: otherPicture }} style={[styles.headerAvt, { overflow: 'hidden' }]} />
            ) : (
              <View style={styles.headerAvt}>
                <Text style={styles.headerAvtTxt}>{getInitials(displayName)}</Text>
              </View>
            )}
            {isOnline && <View style={styles.headerOnlineDot} />}
          </View>
          <View>
            <Text style={styles.headerName}>{displayName}</Text>
            {isOnline
              ? <Text style={styles.headerOnline}>Online</Text>
              : lastSeenText
                ? <Text style={styles.headerOffline}>Last seen {lastSeenText}</Text>
                : <Text style={styles.headerOffline}>Offline</Text>
            }
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn} onPress={initiateCall}>
          <Ionicons name="call-outline" size={26} color={aC.isDark ? '#f9fafc' : aC.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Calling modal (outgoing) */}
      <Modal visible={callState === 'calling' || callState === 'connected'} transparent animationType="fade">
        <View style={styles.callOverlay}>
          <View style={styles.callCard}>
            <Animated.View style={[styles.callAvtRing, { transform: [{ scale: ringAnim }] }]}>
              <View style={styles.callAvt}>
                <Text style={styles.callAvtTxt}>{getInitials(displayName)}</Text>
              </View>
            </Animated.View>
            <Text style={styles.callName}>{displayName}</Text>
            <Text style={styles.callStatus}>
              {callState === 'calling' ? 'Calling...' : `Connected  ${fmtDuration(callDuration)}`}
            </Text>
            <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
              <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Incoming call modal */}
      <Modal visible={callState === 'incoming'} transparent animationType="slide">
        <View style={styles.callOverlay}>
          <View style={styles.callCard}>
            <Animated.View style={[styles.callAvtRing, { transform: [{ scale: ringAnim }], borderColor: '#34c759' }]}>
              <View style={styles.callAvt}>
                <Text style={styles.callAvtTxt}>{getInitials(incomingCall?.callerName || 'U')}</Text>
              </View>
            </Animated.View>
            <Text style={styles.callName}>{incomingCall?.callerName}</Text>
            <Text style={styles.callStatus}>Incoming call...</Text>
            <View style={styles.callActions}>
              <TouchableOpacity style={styles.declineBtn} onPress={declineCall}>
                <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={acceptCall}>
                <Ionicons name="call" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.divider} />

      {/* Image fullscreen preview */}
      <Modal visible={!!previewImg} transparent animationType="fade" onRequestClose={() => setPreviewImg(null)}>
        <TouchableOpacity style={styles.previewOverlay} activeOpacity={1} onPress={() => setPreviewImg(null)}>
          <Image source={{ uri: previewImg! }} style={styles.previewImg} resizeMode="contain" />
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewImg(null)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {(() => {
          const vTitle = vehicleTitle || convVehicle?.title;
          const vPrice = formatVehiclePrice(vehiclePrice) || convVehicle?.price;
          const vCity  = vehicleCity  || convVehicle?.city;
          const vYear  = vehicleYear  || convVehicle?.year;
          const vId    = vehicleId    || convVehicle?.id;
          if (!vTitle) return null;
          return (
            <TouchableOpacity
              style={[styles.vehicleCard, { backgroundColor: aC.isDark ? '#010a1f' : '#F2F4F8', borderColor: aC.isDark ? 'rgba(220,232,255,0.68)' : 'rgba(0,0,0,0.05)', shadowColor: aC.isDark ? '#164088' : 'transparent', shadowOpacity: aC.isDark ? 0.14 : 0, shadowRadius: 5, elevation: aC.isDark ? 2 : 0 }, !aC.isDark && { height: 76, boxShadow: '2px 4px 5px rgba(0,0,0,0.24)' }]}
              activeOpacity={0.85}
              onPress={() => vId && router.push({ pathname: '/vehicle/[id]', params: { id: vId } })}
            >
              {aC.isDark ? (
                <>
                  <LinearGradient colors={['#16408880', '#0D255480', '#010a1f', '#010a1f', '#0D255480', '#16408880']} locations={[0, 0.06, 0.21, 0.79, 0.94, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                  <LinearGradient colors={['rgba(22,64,136,0.45)', 'rgba(13,37,84,0.16)', 'transparent', 'transparent', 'rgba(13,37,84,0.16)', 'rgba(22,64,136,0.45)']} locations={[0, 0.06, 0.2, 0.8, 0.94, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                </>
              ) : null}
              {convVehicle?.image
                ? <Image source={{ uri: convVehicle.image }} style={styles.vehicleImg} resizeMode="cover" />
                : (
                  <Image source={require('@/screenshot/featureCar1.png')} style={styles.vehicleImg} resizeMode="cover" />
                )
              }
              <View style={styles.vehicleInfo}>
                <Text style={[styles.vehicleTitle, { color: aC.isDark ? aC.textPrimary : '#010a1f' }]} numberOfLines={1}>{vTitle}</Text>
                <View style={styles.vehicleRow}>
                  <Ionicons name="location-outline" size={12} color={aC.isDark ? aC.textSecondary : '#000000'} />
                  <Text style={[styles.vehicleMeta, { color: aC.isDark ? aC.textSecondary : '#111827' }]} numberOfLines={1}>{[vCity, vYear, convVehicle?.transmission].filter(Boolean).join(' • ')}</Text>
                </View>
                <Text style={styles.vehiclePrice}>{vPrice}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#e2671b" />
            </TouchableOpacity>
          );
        })()}

        {loading ? (
          <ActivityIndicator color="#e2671b" style={{ flex: 1 }} />
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
            ListHeaderComponent={
              <View style={styles.todayWrap}>
                <View style={styles.todayBadge}>
                  <Text style={styles.todayTxt}>Today</Text>
                </View>
              </View>
            }
            renderItem={({ item }) => {
              const mine     = isMe(item);
              const myPic    = myPicture;
              const otherPic = otherPicture;
              const content  = item.content || '';
              const time     = formatTime(item.created_at);

              // ── rich card: [tracker_card]id|name|tagline
              if (content.startsWith('[tracker_card]')) {
                const [id, cname, tagline] = content.replace('[tracker_card]', '').split('|');
                return (
                  <View style={[styles.msgRow, mine && styles.msgRowMe]}>
                    <View style={styles.msgAvt}>
                      {(mine ? myPic : otherPic)
                        ? <Image source={{ uri: mine ? myPic : otherPic }} style={styles.msgAvtImg} resizeMode="cover" />
                        : <Text style={styles.msgAvtTxt}>{getInitials(mine ? (user?.full_name || 'Me') : displayName)}</Text>}
                    </View>
                    <TouchableOpacity
                      style={styles.richCard}
                      activeOpacity={0.85}
                      onPress={() => router.push({ pathname: '/tracker-company-profile' as any, params: { providerId: id } })}
                    >
                      <LinearGradient colors={['rgba(22,64,136,0.3)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                      <View style={styles.richCardIcon}><Ionicons name="locate-outline" size={22} color="#e2671b" /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.richCardType}>Tracker Provider</Text>
                        <Text style={styles.richCardTitle} numberOfLines={1}>{cname || 'View Profile'}</Text>
                        {tagline ? <Text style={styles.richCardSub} numberOfLines={1}>{tagline}</Text> : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#e2671b" />
                    </TouchableOpacity>
                  </View>
                );
              }

              // ── rich card: [vehicle_card]id|title|price|city
              if (content.startsWith('[vehicle_card]')) {
                const [id, vtitle, vprice, vcity] = content.replace('[vehicle_card]', '').split('|');
                return (
                  <View style={[styles.msgRow, mine && styles.msgRowMe]}>
                    <View style={styles.msgAvt}>
                      {(mine ? myPic : otherPic)
                        ? <Image source={{ uri: mine ? myPic : otherPic }} style={styles.msgAvtImg} resizeMode="cover" />
                        : <Text style={styles.msgAvtTxt}>{getInitials(mine ? (user?.full_name || 'Me') : displayName)}</Text>}
                    </View>
                    <TouchableOpacity
                      style={styles.richCard}
                      activeOpacity={0.85}
                      onPress={() => router.push({ pathname: '/vehicle/[id]' as any, params: { id } })}
                    >
                      <LinearGradient colors={['rgba(22,64,136,0.3)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                      <View style={styles.richCardIcon}><Ionicons name="car-sport-outline" size={22} color="#e2671b" /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.richCardType}>Vehicle For Sale</Text>
                        <Text style={styles.richCardTitle} numberOfLines={1}>{vtitle || 'View Vehicle'}</Text>
                        {(vprice || vcity) ? <Text style={styles.richCardSub} numberOfLines={1}>{[vprice, vcity].filter(Boolean).join(' • ')}</Text> : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#e2671b" />
                    </TouchableOpacity>
                  </View>
                );
              }

              // ── rich card: [call_card]name|phone
              if (content.startsWith('[call_card]')) {
                const [cname2, phone2] = content.replace('[call_card]', '').split('|');
                return (
                  <View style={[styles.msgRow, mine && styles.msgRowMe]}>
                    <View style={styles.msgAvt}>
                      {(mine ? myPic : otherPic)
                        ? <Image source={{ uri: mine ? myPic : otherPic }} style={styles.msgAvtImg} resizeMode="cover" />
                        : <Text style={styles.msgAvtTxt}>{getInitials(mine ? (user?.full_name || 'Me') : displayName)}</Text>}
                    </View>
                    <TouchableOpacity
                      style={styles.richCard}
                      activeOpacity={0.85}
                      onPress={() => phone2 && Linking.openURL(`tel:${phone2}`)}
                    >
                      <LinearGradient colors={['rgba(22,64,136,0.3)', 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                      <View style={[styles.richCardIcon, { backgroundColor: 'rgba(34,197,94,0.15)' }]}><Ionicons name="call-outline" size={22} color="#22c55e" /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.richCardType}>Call</Text>
                        <Text style={styles.richCardTitle} numberOfLines={1}>{cname2 || 'Tap to Call'}</Text>
                        {phone2 ? <Text style={styles.richCardSub}>{phone2}</Text> : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#22c55e" />
                    </TouchableOpacity>
                  </View>
                );
              }

              // ── default message (image / voice / text)
              return (
                <View style={[styles.msgRow, mine && styles.msgRowMe]}>
                  <View style={styles.msgAvt}>
                    {(mine ? myPic : otherPic)
                      ? <Image source={{ uri: mine ? myPic : otherPic }} style={styles.msgAvtImg} resizeMode="cover" />
                      : <Text style={styles.msgAvtTxt}>{getInitials(mine ? (user?.full_name || 'Me') : displayName)}</Text>}
                  </View>
                  {content.startsWith('[image]') ? (
                    <TouchableOpacity onPress={() => setPreviewImg(content.replace('[image]', ''))} style={styles.imgBubble}>
                      <Image source={{ uri: content.replace('[image]', '') }} style={styles.msgImg} resizeMode="cover" />
                      <Text style={styles.imgTime}>{time}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleThem]}>
                      {content.startsWith('[voice]')
                        ? (() => {
                            const url = content.replace('[voice]', '');
                            const isSending = url === 'sending...';
                            return (
                              <TouchableOpacity style={styles.voiceBubble} onPress={() => !isSending && playVoice(item.id, url)} activeOpacity={isSending ? 1 : 0.7}>
                                <Ionicons name={playingId === item.id ? 'pause-circle' : 'play-circle'} size={30} color={isSending ? 'rgba(255,255,255,0.4)' : '#fff'} />
                                <View style={styles.voiceTrackWrap}>
                                  <View style={styles.voiceTrack} />
                                  <Text style={styles.voiceLabel}>{isSending ? 'Sending...' : 'Voice message'}</Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })()
                        : <Text style={styles.bubbleTxt}>{content}</Text>
                      }
                      <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMe]}>{time}</Text>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}

        {showEmojiPicker && !isRecording && (
          <ScrollView style={styles.emojiPickerWrap} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
            <View style={styles.emojiCatScroll}>
              {EMOJI_CATEGORIES.map(cat => (
                <View key={cat.label}>
                  <Text style={styles.emojiCatLabel}>{cat.label}</Text>
                  <View style={styles.emojiGrid}>
                    {cat.emojis.map(emoji => (
                      <TouchableOpacity
                        key={emoji}
                        style={styles.emojiBtn2}
                        onPress={() => setInput(prev => prev + emoji)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.emojiTxt}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
        {isRecording && (
          <View style={styles.recordingBar}>
            <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.recordingTxt}>Recording... tap stop to send</Text>
          </View>
        )}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.inputIconBtn} onPress={pickAndSendImage} disabled={isRecording}>
            <Ionicons name="add" size={26} color={isRecording ? 'rgba(249,250,252,0.3)' : aC.isDark ? aC.textPrimary : '#ffffff'} />
          </TouchableOpacity>
          <View style={styles.inputFieldWrap}>
          <TextInput
            style={styles.inputField}
            placeholder={isRecording ? 'Recording...' : 'Type a message...'}
            placeholderTextColor={isRecording ? '#e53935' : aC.isDark ? aC.textSecondary : 'rgba(255,255,255,0.75)'}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            editable={!isRecording}
          />
          <TouchableOpacity
            style={styles.emojiBtn}
            disabled={isRecording}
            onPress={() => setShowEmojiPicker(p => !p)}
          >
            <Ionicons
              name={showEmojiPicker ? 'happy' : 'happy-outline'}
              size={20}
              color={isRecording ? 'rgba(249,250,252,0.3)' : showEmojiPicker ? '#e2671b' : aC.isDark ? aC.textSecondary : '#ffffff'}
            />
          </TouchableOpacity>
          </View>
          {input.trim() && !isRecording ? (
            <TouchableOpacity style={[styles.inputIconBtn, { backgroundColor: '#e2671b' }]} onPress={sendMessage} disabled={sending}>
              {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={16} color="#fff" />}
            </TouchableOpacity>
          ) : isRecording ? (
            <TouchableOpacity style={[styles.inputIconBtn, { backgroundColor: '#e53935' }]} onPress={stopAndSendVoice}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="stop" size={16} color="#fff" />
              </Animated.View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.inputIconBtn} onPress={startRecording}>
              <Ionicons name="mic-outline" size={20} color={aC.isDark ? aC.textPrimary : '#ffffff'} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
