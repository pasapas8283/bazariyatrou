'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import DesktopTopNav from '@/components/DesktopTopNav';
import { useMarketplaceItems } from '../../hooks/use-marketplace-items';
import {
  conditionDisplayLabel,
  formatPriceKMF,
  listingCategoryDisplayLabel,
  listingPriceDisplaySuffix,
} from '../../lib/marketplace-formatters';
import { useAuth } from '../../hooks/use-auth';

function formatReservedUntil(value: string | undefined): string | null {
  if (!value) return null;
  const dt = new Date(value);
  if (!Number.isFinite(dt.getTime())) return null;
  return dt.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRemaining(value: string | undefined, nowMs: number): string | null {
  if (!value) return null;
  const untilMs = new Date(value).getTime();
  if (!Number.isFinite(untilMs)) return null;
  const diffMs = untilMs - nowMs;
  if (diffMs <= 0) return '00:00:00';
  const totalSec = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  const s = String(seconds).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function MesAnnoncesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, hydrated: authHydrated } = useAuth();
  const { myItems, hydrated, deleteItem, updateItemStatus } =
    useMarketplaceItems();
  const [nowTs] = useState(() => Date.now());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const wasDeleted = searchParams.get('deleted') === '1';

  useEffect(() => {
    const intervalId = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleDelete = (id: string, title: string) => {
    const confirmed = window.confirm(
      `Supprimer définitivement l’annonce "${title}" ?`
    );

    if (!confirmed) return;

    deleteItem(id);
  };

  const handleToggleStatus = (
    id: string,
    currentStatus: 'available' | 'reserved' | 'sold'
  ) => {
    updateItemStatus(id, currentStatus === 'sold' ? 'available' : 'sold');
  };

  const handleReserveStatus = (
    id: string,
    currentStatus: 'available' | 'reserved' | 'sold'
  ) => {
    updateItemStatus(id, currentStatus === 'reserved' ? 'available' : 'reserved');
  };

  if (authHydrated && !currentUser) {
    router.replace('/connexion');
    return null;
  }

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <div className="mx-auto mb-0 w-full max-w-5xl md:mb-4">
        <DesktopTopNav />
      </div>
      <MobileShell>
        <div className="min-h-full bg-white">
          <div className="px-4 py-6">
            <h1 className="text-2xl font-extrabold text-gray-900">
              Mes annonces
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Gérez les annonces que vous avez publiées.
            </p>
          </div>

          <div className="px-4 pb-5">
            {wasDeleted && (
              <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                Annonce supprimée avec succès.
              </div>
            )}

            {!hydrated ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                    <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-gray-200" />
                    <div className="mt-4 h-10 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : myItems.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
                <p className="text-sm font-medium text-gray-600">
                  Vous n’avez encore publié aucune annonce.
                </p>

                <Link
                  href="/publier"
                  className="mt-4 inline-block rounded-2xl bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800"
                >
                  Publier ma première annonce
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myItems.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="relative">
                      <Image
                        src={
                          item.images?.[0] ||
                          'https://placehold.co/600x400?text=Annonce'
                        }
                        alt={item.title}
                        width={600}
                        height={400}
                        className="h-40 w-full object-cover"
                      />

                      <div className="absolute left-3 top-3 flex gap-2">
                        <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-gray-800 shadow-sm">
                          {listingCategoryDisplayLabel(item)}
                        </span>

                        {item.category !== 'location' && (
                          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-gray-800 shadow-sm">
                            {conditionDisplayLabel(item.condition)}
                          </span>
                        )}
                        {item.isFeatured === true &&
                          typeof item.featuredUntil === 'string' &&
                          new Date(item.featuredUntil).getTime() > nowTs && (
                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800 shadow-sm">
                              Boostée
                            </span>
                          )}
                      </div>

                      {item.status === 'sold' && (
                        <span className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                          Vendu
                        </span>
                      )}
                      {item.status === 'reserved' && (
                        <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                          Réservée
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-base font-extrabold text-gray-900">
                            {item.title}
                          </h2>
                          <p className="mt-1 text-lg font-black text-green-900">
                            {formatPriceKMF(item.price, item.priceCurrency ?? 'KMF')}
                            {listingPriceDisplaySuffix(item)}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {item.location}
                          </p>
                          {item.status === 'reserved' && (
                            <p className="mt-1 text-xs font-semibold text-orange-700">
                              Compte à rebours :{' '}
                              {formatRemaining(item.reservedUntil, nowMs) ??
                                '24:00:00'}
                              {' · '}jusqu&apos;au{' '}
                              {formatReservedUntil(item.reservedUntil) ?? '--'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
  <button
    type="button"
    onClick={() =>
      void router.push(`/annonces/detail?id=${encodeURIComponent(item.id)}`)
    }
    className="rounded-2xl border border-gray-200 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
  >
    Voir
  </button>

  <button
    type="button"
    onClick={() =>
      void router.push(
        `/mes-annonces/${encodeURIComponent(item.id)}/modifier`
      )
    }
    className="rounded-2xl bg-blue-100 py-3 text-center text-sm font-semibold text-blue-700"
  >
    Modifier
  </button>

  <button
    type="button"
    onClick={() =>
      void router.push(
        `/booster?itemId=${encodeURIComponent(item.id)}`
      )
    }
    className="rounded-2xl bg-yellow-100 py-3 text-center text-sm font-semibold text-yellow-800"
  >
    Booster
  </button>

  <button
    type="button"
    onClick={() => handleReserveStatus(item.id, item.status)}
    className={`rounded-2xl py-3 text-sm font-semibold ${
      item.status === 'reserved'
        ? 'bg-orange-100 text-orange-700'
        : 'bg-orange-50 text-orange-700'
    }`}
  >
    {item.status === 'reserved' ? 'Réservation ON' : 'Réserver'}
  </button>

  <button
    type="button"
    onClick={() => handleToggleStatus(item.id, item.status)}
    className={`rounded-2xl py-3 text-sm font-semibold ${
      item.status === 'sold'
        ? 'bg-green-100 text-green-700'
        : 'bg-yellow-100 text-yellow-700'
    }`}
  >
    {item.status === 'sold' ? 'Réactiver' : 'Vendu'}
  </button>

  <button
    type="button"
    onClick={() => handleDelete(item.id, item.title)}
    className="rounded-2xl bg-red-100 py-3 text-sm font-semibold text-red-700"
  >
    Supprimer
  </button>
</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <BottomNav />
        </div>
      </MobileShell>
    </main>
  );
}

export default function MesAnnoncesPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#efefef]" />}>
      <MesAnnoncesPageContent />
    </Suspense>
  );
}