import { NextResponse } from 'next/server';
import { hashPasswordServer } from '../../../../server/security';
import { readDb, writeDb } from '../../../../server/db';
import { applySessionCookie } from '../../../../server/auth-session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName = String(body?.firstName ?? '').trim();
    const lastName = String(body?.lastName ?? '').trim();
    const birthDate = String(body?.birthDate ?? '').trim();
    const phone = String(body?.phone ?? '').trim();
    const password = String(body?.password ?? '');
    const avatar =
      typeof body?.avatar === 'string' && body.avatar.trim() !== ''
        ? body.avatar
        : undefined;

    if (!firstName || !lastName || !birthDate || !phone || !password) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants.' },
        { status: 400 }
      );
    }

    const db = await readDb();
    const exists = db.users.some((user) => user.phone === phone);
    if (exists) {
      return NextResponse.json(
        { error: 'Un compte avec ce numéro existe déjà.' },
        { status: 409 }
      );
    }

    const user = {
      id: crypto.randomUUID(),
      firstName,
      lastName,
      birthDate,
      phone,
      passwordHash: hashPasswordServer(password),
      avatar,
      createdAt: new Date().toISOString(),
    };

    await writeDb({
      ...db,
      users: [user, ...db.users],
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          birthDate: user.birthDate,
          phone: user.phone,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
    applySessionCookie(response, user.id);
    return response;
  } catch {
    return NextResponse.json({ error: 'Erreur inscription.' }, { status: 400 });
  }
}
