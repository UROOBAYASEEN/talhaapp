// Generic drafts API — har panel (dealer/bank/insurance/tracker/seller) ke
// video-ad / special-offer jaise forms "Save as Draft" ke liye isi ko use karte hain.
// Backend: POST /drafts • GET /drafts/my • GET/PUT/DELETE /drafts/{id}
import { API_BASE } from './api';

export type DraftPayload = {
  id?:        string;   // ho to update, warna create
  kind:       string;   // 'video_ad' | 'special_offer' | ...
  title?:     string;
  subtitle?:  string;
  media_url?: string;
  data?:      Record<string, any>;
};

export async function saveDraft(token: string, payload: DraftPayload) {
  const { id, ...body } = payload;
  const url    = id ? `${API_BASE}/drafts/${id}` : `${API_BASE}/drafts`;
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(typeof e.detail === 'string' ? e.detail : 'Could not save draft');
  }
  return res.json();
}

export async function fetchMyDrafts(token: string, kind?: string): Promise<any[]> {
  const url = kind ? `${API_BASE}/drafts/my?kind=${encodeURIComponent(kind)}` : `${API_BASE}/drafts/my`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) return await res.json();
  } catch { /* offline */ }
  return [];
}

export async function getDraft(token: string, id: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/drafts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) return await res.json();
  } catch { /* offline */ }
  return null;
}

export async function deleteDraft(token: string, id: string) {
  try { await fetch(`${API_BASE}/drafts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); } catch { /* offline */ }
}
