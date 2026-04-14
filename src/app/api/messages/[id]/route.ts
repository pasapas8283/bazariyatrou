import { NextResponse } from 'next/server';
import { readDb, writeDb } from '../../../../server/db';
import { ensureIdParams } from '../../../../lib/static-export-params';

type Params = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const db = await readDb();
  return ensureIdParams(db.conversations.map((c) => ({ id: c.id })));
}

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const ownerUserId = searchParams.get('ownerUserId');
  const db = await readDb();
  const found = db.conversations.find(
    (conv) =>
      conv.id === id &&
      (!ownerUserId || conv.ownerUserId === ownerUserId)
  );

  if (!found) {
    return NextResponse.json(
      { error: 'Conversation introuvable.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ conversation: found });
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const ownerUserId = String(body?.ownerUserId ?? '');
    const message = body?.message;

    if (!ownerUserId || !message?.id || !message?.text) {
      return NextResponse.json(
        { error: 'Message invalide.' },
        { status: 400 }
      );
    }

    const db = await readDb();
    const exists = db.conversations.some(
      (conv) => conv.id === id && conv.ownerUserId === ownerUserId
    );

    if (!exists) {
      return NextResponse.json(
        { error: 'Conversation introuvable.' },
        { status: 404 }
      );
    }

    const nextConversations = db.conversations.map((conv) =>
      conv.id === id && conv.ownerUserId === ownerUserId
        ? { ...conv, messages: [...conv.messages, message] }
        : conv
    );

    await writeDb({
      ...db,
      conversations: nextConversations,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erreur envoi message.' }, { status: 400 });
  }
}
