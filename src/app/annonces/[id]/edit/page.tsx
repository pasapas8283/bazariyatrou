'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-storage';
import { combineLocalListingSnapshots } from '@/lib/marketplace-storage';
import { loadMergedMarketplaceItems } from '@/lib/listings-merge';

export default function EditAnnoncePage() {
  const params = useParams();
  const router = useRouter();
  const id = decodeURIComponent(String(params.id ?? ''));
  const [status, setStatus] = useState('Redirection…');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!id) {
        router.replace('/mes-annonces');
        return;
      }

      let item =
        combineLocalListingSnapshots().find((entry) => entry.id === id) ?? null;
      if (!item) {
        try {
          const merged = await loadMergedMarketplaceItems();
          item = merged.find((entry) => entry.id === id) ?? null;
        } catch {
          item = null;
        }
      }
      if (cancelled) return;

      if (!item) {
        setStatus('Annonce introuvable.');
        router.replace('/mes-annonces');
        return;
      }

      const currentUser = getCurrentUser();
      if (!currentUser || item.sellerId !== currentUser.id) {
        router.replace(`/annonces/${encodeURIComponent(id)}`);
        return;
      }

      router.replace(
        `/mes-annonces/modifier?id=${encodeURIComponent(id)}`
      );
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  return <div className="p-4 text-sm text-gray-600">{status}</div>;
}
