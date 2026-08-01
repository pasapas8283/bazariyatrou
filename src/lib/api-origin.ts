import { Capacitor, CapacitorHttp } from '@capacitor/core';

const DEFAULT_REMOTE = 'https://bazariyatrou-2.onrender.com';

function remoteOrigin(): string {
  return (process.env.NEXT_PUBLIC_CAP_API_ORIGIN || DEFAULT_REMOTE).replace(
    /\/+$/,
    ''
  );
}

/** WebView Capacitor (https://localhost) ou app native. */
function isCapacitorShell(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    /* ignore */
  }
  const { protocol, hostname } = window.location;
  return (
    protocol === 'https:' &&
    (hostname === 'localhost' || hostname === '127.0.0.1')
  );
}

/** URL d’API : relative sur le web ; absolue vers Render dans l’APK. */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (typeof window === 'undefined') return p;
  if (!isCapacitorShell()) return p;
  return `${remoteOrigin()}${p}`;
}

function headersRecord(init?: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (!init?.headers) return headers;
  new Headers(init.headers).forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}

/** Contourne les limites CORS du WebView Android (requête native). */
async function capacitorHttpFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers = headersRecord(init);
  const options: Parameters<typeof CapacitorHttp.request>[0] = {
    url,
    method,
    headers,
    responseType: 'text',
  };

  if (init?.body != null && method !== 'GET' && method !== 'HEAD') {
    if (typeof init.body === 'string') {
      try {
        options.data = JSON.parse(init.body);
      } catch {
        options.data = init.body;
      }
    } else {
      options.data = init.body;
    }
  }

  const result = await CapacitorHttp.request(options);
  const bodyText =
    typeof result.data === 'string'
      ? result.data
      : JSON.stringify(result.data ?? {});

  return new Response(bodyText, {
    status: result.status,
    headers: result.headers as Record<string, string>,
  });
}

/** fetch API — CapacitorHttp sur mobile, fetch classique sur le web. */
export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = apiUrl(path);
  const native = isCapacitorShell();

  if (native) {
    try {
      return await capacitorHttpFetch(url, init);
    } catch {
      /* repli fetch ci-dessous */
    }
  }

  return fetch(url, {
    ...init,
    credentials: native ? 'omit' : (init?.credentials ?? 'same-origin'),
  });
}
