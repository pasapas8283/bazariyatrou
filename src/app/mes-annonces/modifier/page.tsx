'use client';

import { Suspense } from 'react';
import { ModifierAnnoncePageContent } from '../[id]/modifier/page';

/**
 * Route statique pour Capacitor / export :
 * /mes-annonces/modifier?id=<uuid>
 * (évite de dépendre d’un fichier HTML par UUID).
 */
export default function ModifierAnnonceByQueryPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#efefef]" />}>
      <ModifierAnnoncePageContent />
    </Suspense>
  );
}
