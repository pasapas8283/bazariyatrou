import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'bzy_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 jours
const SESSION_SECRET =
  process.env.BZY_SESSION_SECRET || 'bazariyatrou-session-dev-secret';

function toBase64Url(input: string) {
  return Buffer.from(input, 'utf-8').toString('base64url');
}

function fromBase64Url(input: string) {
  return Buffer.from(input, 'base64url').toString('utf-8');
}

function sign(payload: string) {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
}

export function createSessionToken(userId: string) {
  const expiresAt = String(Date.now() + SESSION_TTL_SECONDS * 1000);
  const payload = `${userId}.${expiresAt}`;
  const signature = sign(payload);
  return `${toBase64Url(payload)}.${signature}`;
}

export function readSessionUserIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  if (!cookieHeader) return null;
  const raw = cookieHeader
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!raw) return null;
  const token = raw.slice(`${SESSION_COOKIE_NAME}=`.length);
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;
  let payload = '';
  try {
    payload = fromBase64Url(payloadB64);
  } catch {
    return null;
  }
  if (sign(payload) !== signature) return null;
  const [userId, expiresAtRaw] = payload.split('.');
  const expiresAt = Number(expiresAtRaw);
  if (!userId || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return null;
  }
  return userId;
}

export function readActorUserIdFromRequest(request: Request): string | null {
  const fromSession = readSessionUserIdFromRequest(request);
  if (fromSession) return fromSession;
  const raw = request.headers.get('x-bzy-user-id');
  const userId = typeof raw === 'string' ? raw.trim() : '';
  return userId || null;
}

export function isAdminRequest(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') ?? '';
  return cookieHeader
    .split(';')
    .map((p) => p.trim())
    .some((p) => p === 'bzy_admin_session=1');
}

export function applySessionCookie(response: {
  cookies: {
    set: (name: string, value: string, options: Record<string, unknown>) => void;
  };
}, userId: string) {
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: {
  cookies: {
    set: (name: string, value: string, options: Record<string, unknown>) => void;
  };
}) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

