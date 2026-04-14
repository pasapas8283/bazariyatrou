import { NextResponse } from 'next/server';
import { readDb, writeDb } from '../../../server/db';
import type { Conversation } from '../../../lib/messages-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ownerUserId = searchParams.get('ownerUserId');
  const db = await readDb();
  const conversations = ownerUserId
    ? db.conversations.filter((conv) => conv.ownerUserId === ownerUserId)
    : db.conversations;

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Conversation;
    if (!body?.id || !body?.ownerUserId || !body?.itemId) {
      return NextResponse.json(
        { error: 'Conversation invalide.' },
        { status: 400 }
      );
    }

    const db = await readDb();
    const existingIndex = db.conversations.findIndex(
      (conv) => conv.id === body.id && conv.ownerUserId === body.ownerUserId
    );

    const nextConversations =
      existingIndex >= 0
        ? db.conversations.map((conv, index) =>
            index === existingIndex ? body : conv
          )
        : [body, ...db.conversations];

    await writeDb({
      ...db,
      conversations: nextConversations,
    });

    return NextResponse.json({ conversation: body }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Impossible de sauvegarder la conversation.' },
      { status: 400 }
    );
  }
}
