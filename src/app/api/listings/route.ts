import { NextResponse } from 'next/server';
import { readDb, writeDb } from '../../../server/db';
import { normalizeItem } from '../../../lib/marketplace-normalizers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await readDb();
  return NextResponse.json({ items: db.listings.map(normalizeItem) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = normalizeItem(body);
    const db = await readDb();
    const next = {
      ...db,
      listings: [item, ...db.listings],
    };
    await writeDb(next);
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Impossible de créer l’annonce.' },
      { status: 400 }
    );
  }
}
