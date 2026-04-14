import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE = 'bzy_admin_session';

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
  const loopbackRedirect = redirect127ToLocalhost(request);
  if (loopbackRedirect) return loopbackRedirect;

  const { pathname, search } = request.nextUrl;
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
