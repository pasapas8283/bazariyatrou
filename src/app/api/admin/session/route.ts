import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ADMIN_COOKIE = 'bzy_admin_session';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BZR-admin-2026';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body?.password ?? '');
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Mot de passe invalide.' }, { status: 401 });
    }

    const jar = await cookies();
    jar.set(ADMIN_COOKIE, '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
