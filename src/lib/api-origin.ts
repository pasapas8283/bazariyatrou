import { Capacitor } from '@capacitor/core';

const DEFAULT_REMOTE = 'https://bazariyatrou-2.onrender.com';

function remoteOrigin(): string {
  return (process.env.NEXT_PUBLIC_CAP_API_ORIGIN || DEFAULT_REMOTE).replace(
    /\/+$/,
    ''
  );
}

/** URL d’API : relative sur le web ; absolue vers Render dans l’APK Capacitor. */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (typeof window === 'undefined') return p;
  if (!Capacitor.isNativePlatform()) return p;
  return `${remoteOrigin()}${p}`;
}

/** fetch API (cookies de session si besoin quand l’APK appelle Render en cross-origin). */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = apiUrl(path);
  const native =
    typeof window !== 'undefined' && Capacitor.isNativePlatform();
  return fetch(url, {
    ...init,
    credentials: native ? 'include' : (init?.credentials ?? 'same-origin'),
  });
}
