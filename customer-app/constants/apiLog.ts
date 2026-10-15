// API response logger — sirf development (__DEV__) mein chalta hai, production build mein kuch print nahi hota.
// Metro terminal (jahan `npx expo start` chal raha hai) ya `adb logcat -s ReactNativeJS` mein dikhta hai.
//
// Output example:
//   [API] Home › Featured cars  GET /vehicles/?category=car...  200 (412ms)  items: 6
//   [API]   ↳ first item: {"id":"...","title":"Toyota Corolla","images":["https://..."]}

const MAX_CHARS = 1500;

function shorten(value: unknown): string {
  let txt: string;
  try { txt = JSON.stringify(value); } catch { txt = String(value); }
  if (txt === undefined) txt = String(value);
  return txt.length > MAX_CHARS ? `${txt.slice(0, MAX_CHARS)}… (+${txt.length - MAX_CHARS} chars)` : txt;
}

function pathOf(url: string): string {
  return url.replace(/^https?:\/\/[^/]+\/api\/v1/, '');
}

/** Response aane ke baad call karein. `startedAt` = Date.now() fetch se pehle. */
export function logApi(label: string, method: string, url: string, res: Response | null, body?: unknown, startedAt?: number) {
  if (!__DEV__) return;
  const ms = startedAt ? ` (${Date.now() - startedAt}ms)` : '';
  const status = res ? `${res.status}${res.ok ? '' : ' ✗'}` : 'NO RESPONSE';
  const list = Array.isArray(body) ? body : Array.isArray((body as any)?.items) ? (body as any).items : null;
  const extra = list
    ? `items: ${list.length}${(body as any)?.total !== undefined ? ` / total: ${(body as any).total}` : ''}`
    : '';
  console.log(`[API] ${label}  ${method} ${pathOf(url)}  ${status}${ms}  ${extra}`);
  if (list) {
    if (list.length) console.log(`[API]   ↳ first item: ${shorten(list[0])}`);
    const rest = { ...(body as any) };
    if (!Array.isArray(body)) { delete rest.items; if (Object.keys(rest).length) console.log(`[API]   ↳ meta: ${shorten(rest)}`); }
  } else if (body !== undefined) {
    console.log(`[API]   ↳ body: ${shorten(body)}`);
  }
}

/** Network error (server tak request hi nahi pahunchi / JSON parse fail). */
export function logApiError(label: string, method: string, url: string, err: unknown, startedAt?: number) {
  if (!__DEV__) return;
  const ms = startedAt ? ` (${Date.now() - startedAt}ms)` : '';
  console.warn(`[API] ${label}  ${method} ${pathOf(url)}  FAILED${ms}: ${err instanceof Error ? err.message : String(err)}`);
}
