import { NextResponse } from 'next/server';
import { readDb, writeDb } from '../../../server/db';
import { normalizeItem } from '../../../lib/marketplace-normalizers';

export async function GET() {
  const db = await readDb();
  const normalized = db.listings.map(normalizeItem);
  const changed = normalized.some((item, idx) => {
    const prev = db.listings[idx] as Record<string, unknown>;
    const prevStatus = prev.status;
    const prevReserved =
      typeof prev.reservedUntil === 'string' ? prev.reservedUntil : undefined;
    return prevStatus !== item.status || prevReserved !== item.reservedUntil;
  });
  if (changed) {
    await writeDb({ ...db, listings: normalized });
  }
  return NextResponse.json({ items: normalized });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = normalizeItem(body);
    const db = await readDb();
    const withoutSameId = db.listings.filter((entry) => entry.id !== item.id);
    const next = {
      ...db,
      listings: [item, ...withoutSameId],
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
