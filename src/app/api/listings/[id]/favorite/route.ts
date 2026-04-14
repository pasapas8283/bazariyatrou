import { NextResponse } from 'next/server';
import { readDb } from '../../../../../server/db';
import { listingPathParams } from '../../../../../server/listing-static-params';

type Params = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return listingPathParams();
}

/** Vérifie l’existence de l’annonce ; les favoris sont gérés côté client (stockage local). */
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const action = body?.action;
    if (action !== 'add' && action !== 'remove') {
      return NextResponse.json({ error: 'Action invalide.' }, { status: 400 });
    }

    const db = await readDb();
    const exists = db.listings.some((item) => item.id === id);
    if (!exists) {
      return NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Impossible de mettre à jour les favoris.' },
      { status: 400 }
    );
  }
}
