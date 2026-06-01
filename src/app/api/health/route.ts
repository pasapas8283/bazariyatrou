import { NextResponse } from 'next/server';

/** Health check Render (léger, sans Supabase). */
export async function GET() {
  return NextResponse.json({ ok: true, service: 'bazariyatrou' });
}
