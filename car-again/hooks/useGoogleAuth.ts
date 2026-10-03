import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { ResponseType } from 'expo-auth-session';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { API_BASE } from '@/constants/api';
import { GOOGLE_CLIENT_ID } from '@/constants/google';
import { useAuth } from '@/contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

/** Same post-login routing everywhere (login / register / onboarding). */
export function routeUserByRole(router: any, user: any) {
  if (user?.role === 'admin') {
    router.replace('/(admin)' as any);
  } else if (user?.role === 'dealership_owner') {
    router.replace('/(dealer)' as any);
  } else if (user?.role === 'bank_representative') {
    router.replace('/(bank)' as any);
  } else if (user?.role === 'insurance_provider') {
    router.replace('/(insurance_provider)' as any);
  } else if (user?.role === 'tracker_provider') {
    router.replace('/(tracker)' as any);
  } else if (user?.role === 'individual_seller') {
    router.replace('/Become_a_Seller' as any);
  } else {
    router.replace('/(tabs)' as any);
  }
}

/**
 * Continue with Google — Expo Go (proxy) + native builds.
 * - Expo Go: authorization-code flow → backend exchanges via /auth/google/code
 * - Native builds: auto token exchange → backend verifies via /auth/google
 * New Google users are created with `role` (backend default: customer).
 */
export function useGoogleAuth(role: string = 'customer') {
  const { setAuth } = useAuth();
  const [busy, setBusy] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    // `clientId` fallback stops the
    // "Client Id property `androidClientId` must be defined" error on Android/iOS.
    // Expo Go proxy flow uses the Web client ID (proxy redirect is registered on it).
    // Production standalone builds will need real androidClientId / iosClientId here.
    clientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    responseType: ResponseType.Code,
    // No client-side exchange: backend POST /auth/google/code exchanges
    // the code with the server secret (no PKCE verifier involved).
    shouldAutoExchangeCode: false,
    usePKCE: false,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'cancel' || response.type === 'dismiss') return;
    if (response.type === 'error') {
      Alert.alert('Google Sign-In', 'Google sign-in failed. Please try again.');
      return;
    }
    if (response.type !== 'success') return;

    (async () => {
      setBusy(true);
      try {
        const accessToken = response.authentication?.accessToken;
        const code = (response.params as any)?.code;
        let res: Response;
        if (accessToken) {
          res = await fetch(`${API_BASE}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken, role }),
          });
        } else if (code) {
          res = await fetch(`${API_BASE}/auth/google/code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              redirect_uri: request?.redirectUri,
              role,
            }),
          });
        } else {
          throw new Error('No token received from Google');
        }
        const data = await res.json();
        if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Google login failed');
        const user = await setAuth(data.access_token, data.refresh_token);
        setGoogleUser(user);
      } catch (err: any) {
        Alert.alert('Google Sign-In', err?.message || 'Google login failed');
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return {
    promptGoogle: () => {
      setGoogleUser(null);
      if (request) promptAsync();
      else Alert.alert('Google Sign-In', 'Google sign-in is loading. Please try again.');
    },
    googleLoading: busy || !request,
    googleUser,
  };
}
