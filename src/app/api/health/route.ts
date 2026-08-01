import { NextResponse } from 'next/server';
import { probeStorage } from '../../../server/db';

/** Health check Render (+ état stockage si ?deep=1). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const deep = url.searchParams.get('deep') === '1';

  if (!deep) {
    return NextResponse.json({ ok: true, service: 'bazariyatrou' });
  }

  const storage = await probeStorage();
  return NextResponse.json({
    ok: true,
    service: 'bazariyatrou',
    ...storage,
  });
}
