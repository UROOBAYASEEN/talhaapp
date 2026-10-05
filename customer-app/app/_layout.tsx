import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppColors } from '@/constants/theme';
import { API_BASE } from '@/constants/api';

SplashScreen.preventAutoHideAsync();

// ── Font-scaling lock ───────────────────────────────────────────────────────
// Phone ki Settings mein font size chhota/bara ho, UI har phone pe same rahe.
// Is liye system font-scale ko 1x pe cap kiya (poori app pe lagoo hoga).
const _TextDefaults = Text as any;
_TextDefaults.defaultProps = { ...(_TextDefaults.defaultProps || {}), maxFontSizeMultiplier: 1 };
const _InputDefaults = TextInput as any;
_InputDefaults.defaultProps = { ...(_InputDefaults.defaultProps || {}), maxFontSizeMultiplier: 1 };

export const unstable_settings = {
  anchor: '(auth)',
};

// ── Auth Middleware ─────────────────────────────────────────────────────────
// Runs on every navigation. If not logged in → redirect to login.
// If logged in and on auth screen → redirect to tabs or dealer panel.
function AuthGuard() {
  const { token, user, isLoading, logout } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Admin / business accounts are not allowed in the customer app
  const BLOCKED_ROLES = ['admin', 'bank_representative', 'dealership_owner', 'insurance_provider', 'tracker_provider'];

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';

    if (!token && !inAuth) {
      router.replace('/(auth)/login');
    } else if (token && user && BLOCKED_ROLES.includes(user.role || '')) {
      // Stale business session (e.g. logged in before the restriction) — force logout
      logout().then(() => router.replace('/(auth)/login'));
    } else if (token && user && user.is_active === false) {
      if (segments.join('/') !== '(auth)/suspended') {
        router.replace('/(auth)/suspended' as any);
      }
    } else if (token && inAuth && user) {
      // Customer app — seller goes to the Become_a_Seller panel, everyone else to customer tabs
      if (user.role === 'individual_seller') {
        router.replace('/Become_a_Seller' as any);
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [token, isLoading, user?.role, user?.is_active, segments[0]]);

  return null;
}

// ── In-App Notification Banner ───────────────────────────────────────────────
function NotifBanner() {
  const { token } = useAuth();
  const router    = useRouter();
  const [banner,  setBanner]  = useState<any>(null);
  const slideY    = useRef(new Animated.Value(-100)).current;
  const lastIdRef = useRef<string | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout>>();

  function show(notif: any) {
    setBanner(notif);
    Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 80 }).start();
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(hide, 4000);
  }

  function hide() {
    Animated.timing(slideY, { toValue: -120, duration: 300, useNativeDriver: true }).start(() => setBanner(null));
  }

  function handleTap() {
    if (!banner) return;
    hide();
    const data = banner.data || {};
    if (banner.type === 'message' && data.conversation_id) {
      router.push({ pathname: '/chat-room/[id]', params: { id: data.conversation_id, name: data.sender_name || 'User' } });
    } else if (banner.type === 'call' && data.conversation_id) {
      router.push({ pathname: '/chat-room/[id]', params: { id: data.conversation_id, name: data.caller_name || 'User' } });
    } else {
      router.push('/notifications');
    }
  }

  useEffect(() => {
    if (!token) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/notifications/?limit=1`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const d = await res.json();
        const latest = d.items?.[0];
        if (latest && !latest.is_read && latest.id !== lastIdRef.current) {
          lastIdRef.current = latest.id;
          show(latest);
        }
      } catch { /* offline */ }
    };
    poll();
    const iv = setInterval(poll, 30000);
    return () => { clearInterval(iv); clearTimeout(timerRef.current); };
  }, [token]);

  if (!banner) return null;

  const iconMap: any = {
    message: { name: 'chatbubble-ellipses', color: '#34c759' },
    call:    { name: 'call',                color: '#0088ff' },
    follow:  { name: 'person-add',          color: '#0088ff' },
  };
  const icon = iconMap[banner.type] || { name: 'notifications', color: '#e2671b' };

  return (
    <Animated.View style={[nb.wrap, { transform: [{ translateY: slideY }] }]}>
      <TouchableOpacity style={nb.card} activeOpacity={0.9} onPress={handleTap}>
        <View style={nb.iconBox}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={nb.texts}>
          <Text style={nb.title} numberOfLines={1}>{banner.title}</Text>
          <Text style={nb.body}  numberOfLines={1}>{banner.body}</Text>
        </View>
        <TouchableOpacity onPress={hide} style={nb.close}>
          <Ionicons name="close" size={16} color="rgba(249,250,252,0.5)" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const nb = StyleSheet.create({
  wrap:   { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999, paddingHorizontal: 16, paddingTop: 52 },
  card:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#061B4A', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,136,255,0.3)', padding: 12, shadowColor: '#1D53AF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10 },
  iconBox:{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(0,136,255,0.12)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  texts:  { flex: 1 },
  title:  { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#f9fafc' },
  body:   { fontSize: 11, fontFamily: 'Poppins_400Regular',  color: '#baacb6' },
  close:  { padding: 4, flexShrink: 0 },
});

// ── Root Layout ─────────────────────────────────────────────────────────────
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGuard />
      <NotifBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: AppColors.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(seller)" />
        <Stack.Screen name="Become_a_Seller" />
        <Stack.Screen name="tracker-search"  options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="tracker-results" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="tracker-detail"   options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="tracker-booking"         options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="tracker-company-profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="tracker-reviews"         options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="seller-panel/analytics" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dealer-panel/add-vehicle"       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dealer-panel/edit-vehicle"      options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dealer-panel/advertisement"   options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dealer-panel/video-ads"       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dealer-panel/special-offer"   options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dealer-panel/promote-vehicle" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dealer-panel/subscription"    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="buy/new-car"              options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="buy/used-car"             options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="buy/brand-vehicles"      options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="buy/used-bike"           options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="buy/new-bike"            options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="buy/search-results"      options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="vehicle/[id]"           options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="vehicle/create"         options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="chat-room/[id]"         options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="seller/[id]"            options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dealer/[id]"            options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/my-listings"      options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/saved"           options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/edit"            options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/change-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/security"        options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/help"            options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/about"           options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/transactions"    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/documents"       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/settings"        options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/my-activity"       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/claim"             options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/terms"             options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="insurance/compare-plans"   options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="insurance/compare-detail" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="insurance/plan-details"       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="insurance/application-submit"  options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="insurance/upload-documents"    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="insurance/payment-summary"     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="insurance/company-profile"     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications/index"     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="modal"                  options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
