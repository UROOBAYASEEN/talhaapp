import { API_BASE } from './api';

// Become-a-Seller: vehicle add karne se pehle check — user ne verification documents diye ya nahi.
// true = documents mojood hain (aage barh sakte hain). false = koi document nahi.
export async function hasSellerDocuments(token?: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE}/documents/`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const docs = await res.json();
      return Array.isArray(docs) && docs.length > 0;
    }
  } catch { /* offline */ }
  return false;
}
