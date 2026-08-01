import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE = 'bzy_admin_session';

const API_CORS_ORIGINS = new Set([
  'https://localhost',
  'http://localhost',
  'https://127.0.0.1',
  'http://127.0.0.1',
  'capacitor://localhost',
  'ionic://localhost',
  'https://bazariyatrou-2.onrender.com',
]);

function isAllowedApiOrigin(origin: string): boolean {
  if (API_CORS_ORIGINS.has(origin)) return true;
  if (origin.startsWith('http://localhost:')) return true;
  if (origin.startsWith('https://localhost:')) return true;
  if (origin.startsWith('http://127.0.0.1:')) return true;
  if (origin.startsWith('https://127.0.0.1:')) return true;
  return false;
}

function applyApiCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin');
  if (origin && isAllowedApiOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    // WebView Capacitor / clients sans en-tête Origin
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Cookie, x-bzy-user-id, X-Requested-With'
  );
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

function redirect127ToLocalhost(request: NextRequest): NextResponse | null {
  const hostname = request.nextUrl.hostname;
  const hostHeader = request.headers.get('host') ?? '';
  const isLoopbackIp =
    hostname === '127.0.0.1' || hostHeader.startsWith('127.0.0.1');
  if (!isLoopbackIp) return null;

  const url = request.nextUrl.clone();
  url.hostname = 'localhost';
  return NextResponse.redirect(url, 307);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    return applyApiCors(request, new NextResponse(null, { status: 204 }));
  }

  const loopbackRedirect = redirect127ToLocalhost(request);
  if (loopbackRedirect) return loopbackRedirect;

  if (pathname.startsWith('/api/')) {
    const res = NextResponse.next();
    return applyApiCors(request, res);
  }

  if (!pathname.startsWith('/admin')) return NextResponse.next();
  if (pathname === '/admin/login') return NextResponse.next();

  const hasSession = request.cookies.get(ADMIN_COOKIE)?.value === '1';
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

/** Toutes les routes sauf internals Next + favicon (sinon le dev server casse). */
export const config = {
  matcher: [
    '/',
    '/((?!_next/|favicon.ico|manifest.webmanifest).*)',
  ],
};
