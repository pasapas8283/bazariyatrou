import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { readDb, writeDb } from '../../../../../server/db';
import { normalizeItem } from '../../../../../lib/marketplace-normalizers';
import type { TransactionFeedbackRole } from '../../../../../types/transaction-feedback';
import { readActorUserIdFromRequest } from '../../../../../server/auth-session';
import { listingPathParams } from '../../../../../server/listing-static-params';

type Params = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return listingPathParams();
}

const MAX_BODY = 2000;
const MAX_NAME = 120;

export async function GET(_: Request, { params }: Params) {
  const { id: listingId } = await params;
  const db = await readDb();
  const listing = db.listings.find((l) => l.id === listingId);
  if (!listing) {
    return NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
  }
  const items = (db.transactionFeedback ?? []).filter(
    (f) => f.listingId === listingId
  );
  return NextResponse.json({ items });
}

export async function POST(request: Request, { params }: Params) {
  try {
    const actorUserId = readActorUserIdFromRequest(request);
    if (!actorUserId) {
      return NextResponse.json(
        { error: 'Connexion requise.' },
        { status: 401 }
      );
    }
    const { id: listingId } = await params;
    const body = await request.json();
    const role = body?.role as TransactionFeedbackRole;
    const text = typeof body?.body === 'string' ? body.body.trim() : '';
    if (role !== 'seller' && role !== 'buyer') {
      return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 });
    }
    if (text.length < 1 || text.length > MAX_BODY) {
      return NextResponse.json(
        { error: `Le message doit faire entre 1 et ${MAX_BODY} caractères.` },
        { status: 400 }
      );
    }

    const db = await readDb();
    const author = db.users.find((u) => u.id === actorUserId);
    const authorId = actorUserId;
    const fallbackName =
      typeof body?.authorName === 'string' ? body.authorName.trim() : '';
    const authorName = (
      author
        ? `${author.firstName} ${author.lastName}`.trim()
        : fallbackName || 'Membre'
    ).slice(0, MAX_NAME);
    const rawListing = db.listings.find((l) => l.id === listingId);
    if (!rawListing) {
      return NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
    }
    const listing = normalizeItem(rawListing);

    if (listing.status !== 'sold') {
      return NextResponse.json(
        { error: 'Les avis ne sont possibles que pour une annonce marquée comme vendue.' },
        { status: 400 }
      );
    }

    if (role === 'seller' && actorUserId !== listing.sellerId) {
      return NextResponse.json(
        { error: 'Seul le vendeur peut publier l’avis « vendeur ».' },
        { status: 403 }
      );
    }

    if (role === 'buyer') {
      if (!listing.buyerId || actorUserId !== listing.buyerId) {
        return NextResponse.json(
          {
            error:
              'Seul l’acheteur identifié sur cette annonce peut publier l’avis « acheteur ». Confirmez d’abord l’achat sur la fiche.',
          },
          { status: 403 }
        );
      }
    }

    const entry = {
      id: randomUUID(),
      listingId,
      authorId,
      authorName,
      role,
      body: text,
      createdAt: new Date().toISOString(),
    };

    const nextFeedback = [
      ...(db.transactionFeedback ?? []).filter(
        (f) => !(f.listingId === listingId && f.role === role)
      ),
      entry,
    ];

    await writeDb({ ...db, transactionFeedback: nextFeedback });
    return NextResponse.json({ item: entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Impossible d’enregistrer l’avis.' },
      { status: 400 }
    );
  }
}
