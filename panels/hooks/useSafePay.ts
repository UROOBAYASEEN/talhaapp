import * as WebBrowser from 'expo-web-browser';
import { API_BASE } from '@/constants/api';

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Credit/debit card payment via SafePay (uses .env sandbox/live credentials).
 * Opens the SafePay checkout page, then verifies the payment.
 * Returns true only when the backend confirms success.
 */
export async function payWithSafePayCard(
  amount: number,
  title: string,
  token: string | null,
): Promise<boolean> {
  if (!token) throw new Error('Please login first.');
  if (!amount || amount <= 0) throw new Error('Invalid amount.');

  const res = await fetch(`${API_BASE}/payments/safepay/generic-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount, title }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.checkout_url) {
    const detail = (data as any).detail;
    throw new Error(typeof detail === 'string' ? detail : 'Could not start card payment.');
  }

  // User pays on the SafePay page, then closes and returns
  await WebBrowser.openBrowserAsync(data.checkout_url);

  const paymentId = data.payment_id as string;
  for (let i = 0; i < 10; i++) {
    await wait(2000);
    try {
      const s = await fetch(`${API_BASE}/payments/safepay/generic-status/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sd = await s.json().catch(() => ({}));
      if (s.ok && sd.success) return true;
      if (s.ok && sd.status === 'failed') return false;
    } catch { /* retry */ }
  }
  return false;
}
