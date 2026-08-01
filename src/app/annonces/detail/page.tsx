'use client';

import { Suspense } from 'react';
import { AnnonceDetailPageContent } from '../[id]/page';

/**
 * Route statique pour Capacitor / partage :
 * /annonces/detail?id=<uuid>
 * (évite de dépendre d’un fichier HTML par UUID en export).
 */
export default function AnnonceDetailByQueryPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#efefef]" />}>
      <AnnonceDetailPageContent />
    </Suspense>
  );
}
