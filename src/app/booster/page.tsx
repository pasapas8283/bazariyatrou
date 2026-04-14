'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import DisplayCurrencyToggle from '@/components/DisplayCurrencyToggle';
import { useAuth } from '../../hooks/use-auth';
import { useMarketplaceItems } from '../../hooks/use-marketplace-items';
import { formatPriceKMF } from '../../lib/marketplace-formatters';
import { useDisplayCurrency } from '../../contexts/display-currency-context';
import {
  BOOST_10_DAYS_PRICE_KMF,
  PRO_30_DAYS_PRICE_KMF,
  formatBoostPrice,
} from '../../lib/boost-pricing';

type Offer = 'boost-10' | 'pro-30';

function BoosterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, hydrated: authHydrated } = useAuth();
  const { myItems, hydrated, updateItem } = useMarketplaceItems();
  const { displayCurrency } = useDisplayCurrency();
  const [offer, setOffer] = useState<Offer>('boost-10');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const itemId = searchParams.get('itemId') ?? '';
  const item = useMemo(
    () => myItems.find((entry) => entry.id === itemId) ?? null,
    [myItems, itemId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!item) return;
    if (!phone.trim()) return;

    const now = Date.now();
    if (offer === 'boost-10') {
      updateItem(item.id, {
        isFeatured: true,
        featuredUntil: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString(),
        boostRequestedAt: new Date(now).toISOString(),
      });
      alert('Boost 10 jours activé.');
      router.push('/mes-annonces');
      return;
    }

    updateItem(item.id, {
      sellerType: 'pro',
      isFeatured: true,
      featuredUntil: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
      boostRequestedAt: new Date(now).toISOString(),
    });
    alert('Pack Pro 30 jours activé.');
    router.push('/mes-annonces');
  };

  if (authHydrated && !currentUser) {
    router.replace('/connexion');
    return null;
  }

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <MobileShell>
        <div className="min-h-full bg-white">
          <div className="border-b border-gray-100 px-4 py-4">
            <Link href="/mes-annonces" className="text-2xl font-bold text-gray-900">
              ‹
            </Link>
            <h1 className="mt-1 text-xl font-extrabold text-gray-900">Booster mon annonce</h1>
            <p className="mt-1 text-sm text-gray-500">
              Choisissez une offre de visibilité et confirmez votre demande.
            </p>
            <Link href="/tarifs" className="mt-2 inline-block text-xs font-semibold text-green-700">
              Voir Tarifs & Conditions
            </Link>
            <div className="mt-2">
              <DisplayCurrencyToggle />
            </div>
          </div>

          <div className="px-4 py-4">
            {!hydrated ? (
              <p className="text-sm text-gray-500">Chargement...</p>
            ) : !item ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Annonce introuvable. Revenez à <Link href="/mes-annonces" className="font-semibold text-green-700">Mes annonces</Link>.
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Annonce</p>
                  <p className="mt-1 font-bold text-gray-900">{item.title}</p>
                  <p className="text-sm font-semibold text-green-900">
                    {formatPriceKMF(item.price, item.priceCurrency ?? 'KMF')}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setOffer('boost-10')}
                      className={`w-full rounded-2xl border px-4 py-3 text-left ${
                        offer === 'boost-10'
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <p className="text-sm font-bold text-gray-900">Boost 10 jours</p>
                      <p className="text-xs text-gray-600">
                        Mise en avant de l’annonce pendant 10 jours.
                      </p>
                      <p className="mt-2 text-sm font-semibold text-yellow-800">
                        {formatBoostPrice(BOOST_10_DAYS_PRICE_KMF, displayCurrency)}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOffer('pro-30')}
                      className={`w-full rounded-2xl border px-4 py-3 text-left ${
                        offer === 'pro-30'
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <p className="text-sm font-bold text-gray-900">Pack Pro 30 jours</p>
                      <p className="text-xs text-gray-600">
                        Badge pro + mise en avant pendant 30 jours.
                      </p>
                      <p className="mt-2 text-sm font-semibold text-green-800">
                        {formatBoostPrice(PRO_30_DAYS_PRICE_KMF, displayCurrency)}
                      </p>
                    </button>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
                    Paiement hors app (Mobile Money / cash). Après paiement, vous pouvez
                    envoyer la preuve sur WhatsApp au <strong>+269 XX XX XX XX</strong>.
                  </div>

                  <div>
                    <input
                      type="tel"
                      placeholder="Votre numéro WhatsApp"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                        submitted && !phone.trim()
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-green-700 py-4 text-sm font-bold text-white"
                  >
                    Confirmer la demande
                  </button>
                </form>
              </>
            )}
          </div>

          <BottomNav />
        </div>
      </MobileShell>
    </main>
  );
}

export default function BoosterPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#efefef]" />}>
      <BoosterPageContent />
    </Suspense>
  );
}
