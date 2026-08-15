export const API_ORIGIN: string =
  (import.meta as any).env?.VITE_API_ORIGIN || 'http://localhost:5000';

// 🔑 ጊዜያዊ ጥበቃ (ሙሉ login እስክንገነባ ድረስ) — sensitive routes ላይ ብቻ ይፈተሻል
export const APP_SHARED_KEY: string = (import.meta as any).env?.VITE_APP_KEY || '';

export const FREIGHT_API_BASE = `${API_ORIGIN}/api/freight`;
export const LOADING_API_BASE = `${API_ORIGIN}/api/loading`;
export const QUICKEXPENSE_API_BASE = `${API_ORIGIN}/api/quickexpense`;
export const QUICKINCOME_API_BASE = `${API_ORIGIN}/api/quickincome`;
export const WAREHOUSE_API_BASE = `${API_ORIGIN}/api/warehouse`;
export const SMS_SEND_URL = `${API_ORIGIN}/api/sms/send`;
export const CONTACTS_API_URL = `${API_ORIGIN}/api/contacts`;
export const OWNER_VERIFY_URL = `${API_ORIGIN}/api/owner/verify-pin`;

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    ...(APP_SHARED_KEY ? { 'x-app-key': APP_SHARED_KEY } : {}),
    ...(options.headers || {}),
  };
  return fetch(url, { ...options, headers });
}