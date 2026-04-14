import { NextResponse } from 'next/server';
import { verifyPasswordServer } from '../../../../server/security';
import { readDb } from '../../../../server/db';
import { applySessionCookie } from '../../../../server/auth-session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = String(body?.phone ?? '').trim();
    const password = String(body?.password ?? '');

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Numéro et mot de passe requis.' },
        { status: 400 }
      );
    }

    const db = await readDb();
    const user = db.users.find((entry) => entry.phone === phone);

    if (!user) {
      return NextResponse.json(
        { error: 'Aucun compte trouvé avec ce numéro.' },
        { status: 404 }
      );
    }

    if (!verifyPasswordServer(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        phone: user.phone,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
    applySessionCookie(response, user.id);
    return response;
  } catch {
    return NextResponse.json({ error: 'Erreur connexion.' }, { status: 400 });
  }
}
