'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-storage';
import { getMarketplaceItemById } from '@/lib/marketplace-storage';

export default function EditAnnoncePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    const item = getMarketplaceItemById(id);
    const currentUser = getCurrentUser();

    if (!item) {
      router.replace('/mes-annonces');
      return;
    }

    if (!currentUser || item.sellerId !== currentUser.id) {
      router.replace(`/annonces/detail?id=${encodeURIComponent(id)}`);
      return;
    }

    router.replace(`/mes-annonces/${id}/modifier`);
  }, [id, router]);

  return <div className="p-4">Redirection...</div>;
}