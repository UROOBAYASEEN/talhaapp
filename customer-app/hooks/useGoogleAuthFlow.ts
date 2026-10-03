import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { API_BASE } from '@/constants/api';
import { GOOGLE_CLIENT_ID, GOOGLE_PROXY_REDIRECT } from '@/constants/google';

WebBrowser.maybeCompleteAuthSession();

function extractCode(url: string): string | null {
  const m = url.match(/[?&]code=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function buildStartUrl(): { startUrl: string; returnUrl: string } {
  const redirectUri = GOOGLE_PROXY_REDIRECT;
  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth' +
    `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    '&response_type=code' +
    `&scope=${encodeURIComponent('openid profile email')}` +
    '&access_type=offline' +
    '&prompt=select_account';
  const returnUrl = Linking.createURL('expo-auth-session');
  const startUrl =
    `${GOOGLE_PROXY_REDIRECT}/start?authUrl=${encodeURIComponent(authUrl)}` +
    `&returnUrl=${encodeURIComponent(returnUrl)}`;
  return { startUrl, returnUrl };
}

/**
 * Runs the Google OAuth code flow and returns the authorization code,
 * or null if the user cancelled.
 *
 * Some devices open the proxy redirect (exp://…:8081/…) in an external
 * browser tab instead of returning to the in-app session. A deep-link
 * listener catches that case so login still completes.
 */
export async function getGoogleCode(): Promise<string | null> {
  const { startUrl, returnUrl } = buildStartUrl();
  let done = false;
  let code: string | null = null;

  const sub = Linking.addEventListener('url', ({ url }) => {
    if (done || !url.includes('expo-auth-session')) return;
    const c = extractCode(url);
    if (/[?&]error=/.test(url)) {
      done = true;
      return;
    }
    if (c) {
      done = true;
      code = c;
      try {
        const r: any = WebBrowser.dismissBrowser();
        if (r && typeof r.catch === 'function') r.catch(() => {});
      } catch {}
    }
  });

  try {
    const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
    if (!done && result.type === 'success') {
      const c = extractCode((result as any).url || '');
      if (c) {
        done = true;
        code = c;
      } else if (!/[?&]error=/.test((result as any).url || '')) {
        // resolved without a code and without an error — wait briefly
        // in case the OS delivers the redirect as a deep link instead
        const start = Date.now();
        while (!done && Date.now() - start < 2500) {
          await new Promise(r => setTimeout(r, 200));
        }
      }
    }
    return code;
  } finally {
    sub.remove();
  }
}

/** Exchanges the authorization code with the backend. Throws on failure. */
export async function exchangeGoogleCode(
  code: string,
  extra?: Record<string, string>,
): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch(`${API_BASE}/auth/google/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: GOOGLE_PROXY_REDIRECT, ...extra }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : data.detail?.message || 'Google login failed');
  return data;
}
