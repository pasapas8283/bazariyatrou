import type { ReactNode } from 'react';
import { readDb } from '@/server/db';
import { ensureIdParams } from '@/lib/static-export-params';

export async function generateStaticParams() {
  const db = await readDb();
  return ensureIdParams(db.conversations.map((c) => ({ id: c.id })));
}

export default function MessageIdLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
