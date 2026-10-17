import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '@/constants/api';
import { AGORA_APP_ID } from '@/constants/agora';

// react-native-agora ek native module hai — Expo Go me nahi chalta, is liye
// hamesha lazy require karte hain taake import se poora screen crash na ho.
// Sirf dev build / EAS build me hi actual join/leave hota hai.
function loadAgora(): any | null {
  try {
    return require('react-native-agora');
  } catch {
    return null;
  }
}

type Config = { app_id?: string; channel: string; token: string | null; uid?: number };

/**
 * Agora voice-call engine wrapper.
 * join(callId, token) => dono users channel = callId join karte hain aur audio chalti hai.
 */
export function useAgoraCall() {
  const engineRef = useRef<any>(null);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [available, setAvailable] = useState(true);

  // Backend se channel + token le aao (certificate na ho to token null = App-ID-only)
  const fetchConfig = useCallback(async (callId: string, token?: string): Promise<Config | null> => {
    try {
      const res = await fetch(`${API_BASE}/calls/${callId}/token`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) return (await res.json()) as Config;
    } catch { /* offline — niche fallback */ }
    return { channel: callId, token: null };
  }, []);

  const join = useCallback(async (callId: string, authToken?: string) => {
    const Agora = loadAgora();
    if (!Agora) {
      // Expo Go — native module nahi. Dev build me hi awaaz chalegi.
      setAvailable(false);
      console.warn('[Agora] native module unavailable (Expo Go?). Dev build banayein.');
      return;
    }
    const cfg = await fetchConfig(callId, authToken);
    const appId = (cfg?.app_id || AGORA_APP_ID || '').trim();
    if (!appId) {
      setAvailable(false);
      console.warn('[Agora] AGORA_APP_ID set nahi. Backend .env ya constants/agora.ts me daalein.');
      return;
    }

    try {
      const {
        createAgoraRtcEngine,
        ChannelProfileType,
        ClientRoleType,
      } = Agora;

      const engine = createAgoraRtcEngine();
      engine.initialize({ appId });
      engine.registerEventHandler({
        onUserJoined: () => setRemoteJoined(true),
        onUserOffline: () => setRemoteJoined(false),
      });
      engine.enableAudio();
      engine.setDefaultAudioRouteToSpeakerphone(true);
      engine.joinChannel(cfg?.token ?? '', cfg?.channel || callId, cfg?.uid ?? 0, {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        autoSubscribeAudio: true,
      });
      engineRef.current = engine;
    } catch (e) {
      setAvailable(false);
      console.warn('[Agora] join failed:', e);
    }
  }, [fetchConfig]);

  const leave = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    try {
      engine.leaveChannel();
      engine.unregisterEventHandler?.({});
      engine.release();
    } catch { /* already gone */ }
    engineRef.current = null;
    setRemoteJoined(false);
    setMuted(false);
    setSpeakerOn(true);
  }, []);

  const toggleMute = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const next = !muted;
    try { engine.muteLocalAudioStream(next); } catch { /* ignore */ }
    setMuted(next);
  }, [muted]);

  const toggleSpeaker = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const next = !speakerOn;
    try { engine.setEnableSpeakerphone(next); } catch { /* ignore */ }
    setSpeakerOn(next);
  }, [speakerOn]);

  // Screen unmount pe engine zaroor cleanup ho
  useEffect(() => () => leave(), [leave]);

  return { join, leave, toggleMute, toggleSpeaker, muted, speakerOn, remoteJoined, available };
}
