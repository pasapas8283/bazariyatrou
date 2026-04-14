import type { ReactNode } from 'react';
import { listingPathParams } from '@/server/listing-static-params';

export async function generateStaticParams() {
  return listingPathParams();
}

export default function AnnonceIdLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
