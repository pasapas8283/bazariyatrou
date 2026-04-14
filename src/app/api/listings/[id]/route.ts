import { NextResponse } from 'next/server';
import { readDb, writeDb } from '../../../../server/db';
import { normalizeItem } from '../../../../lib/marketplace-normalizers';
import {
  isAdminRequest,
  readActorUserIdFromRequest,
} from '../../../../server/auth-session';
import { listingPathParams } from '../../../../server/listing-static-params';

type Params = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

/** Requis pour `output: 'export'` (Capacitor) : au moins un `id` (voir `listingPathParams`). */
export async function generateStaticParams() {
  return listingPathParams();
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const actorUserId = readActorUserIdFromRequest(request);
    const admin = isAdminRequest(request);
    if (!actorUserId && !admin) {
      return NextResponse.json(
        { error: 'Connexion requise.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const updates = await request.json();
    if (updates && typeof updates === 'object' && 'favoriteCount' in updates) {
      delete (updates as Record<string, unknown>).favoriteCount;
    }
    const db = await readDb();
    const current = db.listings.find((item) => item.id === id);

    if (!current) {
      return NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
    }
    const wantsBuyerClaim =
      updates &&
      typeof updates === 'object' &&
      Object.prototype.hasOwnProperty.call(updates, 'buyerId');
    const isSeller = current.sellerId === actorUserId;
    if (!admin && !isSeller && !wantsBuyerClaim) {
      return NextResponse.json(
        { error: 'Action non autorisée.' },
        { status: 403 }
      );
    }

    const merged: Record<string, unknown> = {
      ...(current as Record<string, unknown>),
      ...(updates as Record<string, unknown>),
      id: current.id,
    };

    if (updates?.status === 'available') {
      merged.buyerId = undefined;
      merged.buyerName = undefined;
    } else if (
      updates &&
      typeof updates === 'object' &&
      Object.prototype.hasOwnProperty.call(updates, 'buyerId')
    ) {
      const prevBuyer =
        typeof (current as { buyerId?: string }).buyerId === 'string'
          ? (current as { buyerId?: string }).buyerId
          : '';
      const nextStatus = merged.status === 'sold' ? 'sold' : 'available';
      const incoming =
        typeof (updates as { buyerId?: string }).buyerId === 'string'
          ? (updates as { buyerId?: string }).buyerId!.trim()
          : '';
      const claimOk =
        incoming !== '' &&
        !prevBuyer &&
        nextStatus === 'sold' &&
        incoming !== current.sellerId &&
        incoming === actorUserId;

      if (claimOk) {
        merged.buyerId = incoming;
        const bn = (updates as { buyerName?: string }).buyerName;
        merged.buyerName =
          typeof bn === 'string' && bn.trim() !== ''
            ? bn.trim().slice(0, 120)
            : 'Acheteur';
      } else {
        merged.buyerId = (current as { buyerId?: string }).buyerId;
        merged.buyerName = (current as { buyerName?: string }).buyerName;
      }
    }

    merged.updatedAt = new Date().toISOString();

    const updated = normalizeItem(merged);

    const next = {
      ...db,
      listings: db.listings.map((item) => (item.id === id ? updated : item)),
    };

    await writeDb(next);
    return NextResponse.json({ item: updated });
  } catch {
    return NextResponse.json(
      { error: 'Impossible de modifier l’annonce.' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const actorUserId = readActorUserIdFromRequest(request);
  const admin = isAdminRequest(request);
  if (!actorUserId && !admin) {
    return NextResponse.json(
      { error: 'Connexion requise.' },
      { status: 401 }
    );
  }
  const { id } = await params;
  const db = await readDb();
  const current = db.listings.find((item) => item.id === id);
  if (!current) {
    return NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
  }
  if (!admin && current.sellerId !== actorUserId) {
    return NextResponse.json(
      { error: 'Action non autorisée.' },
      { status: 403 }
    );
  }
  const before = db.listings.length;
  const nextListings = db.listings.filter((item) => item.id !== id);

  if (nextListings.length === before) {
    return NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
  }

  const nextFeedback = (db.transactionFeedback ?? []).filter(
    (f) => f.listingId !== id
  );

  await writeDb({
    ...db,
    listings: nextListings,
    transactionFeedback: nextFeedback,
  });

  return NextResponse.json({ ok: true });
}
