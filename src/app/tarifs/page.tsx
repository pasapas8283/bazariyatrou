'use client';

import Link from 'next/link';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import DisplayCurrencyToggle from '@/components/DisplayCurrencyToggle';
import { useDisplayCurrency } from '@/contexts/display-currency-context';
import {
  BOOST_10_DAYS_PRICE_KMF,
  PRO_30_DAYS_PRICE_KMF,
  formatBoostPrice,
} from '@/lib/boost-pricing';

export default function TarifsPage() {
  const { displayCurrency } = useDisplayCurrency();

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <MobileShell>
        <div className="min-h-full bg-white">
          <div className="border-b border-gray-100 px-4 py-4">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              ‹
            </Link>
            <h1 className="mt-1 text-xl font-extrabold text-gray-900">Tarifs & Conditions</h1>
            <p className="mt-1 text-sm text-gray-500">
              Offres de visibilité BazariYatrou.
            </p>
            <div className="mt-2">
              <DisplayCurrencyToggle />
            </div>
          </div>

          <div className="space-y-4 px-4 py-4">
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm font-bold text-gray-900">Boost 10 jours</p>
              <p className="mt-1 text-xs text-gray-600">
                Votre annonce remonte en priorité pendant 10 jours.
              </p>
              <p className="mt-2 text-sm font-semibold text-yellow-800">
                {formatBoostPrice(BOOST_10_DAYS_PRICE_KMF, displayCurrency)}
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-bold text-gray-900">Pack Pro 30 jours</p>
              <p className="mt-1 text-xs text-gray-600">
                Badge vendeur pro + mise en avant pendant 30 jours.
              </p>
              <p className="mt-2 text-sm font-semibold text-green-800">
                {formatBoostPrice(PRO_30_DAYS_PRICE_KMF, displayCurrency)}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
              <p>
                Paiement hors application: Mobile Money ou cash.
              </p>
              <p className="mt-1">
                Envoyez la preuve de paiement sur WhatsApp: <strong>+269 XX XX XX XX</strong>
              </p>
              <p className="mt-2">
                BazariYatrou n’est pas partie à la transaction. Le boost améliore la visibilité
                mais ne garantit pas la vente.
              </p>
            </div>

            <Link
              href="/mes-annonces"
              className="block w-full rounded-2xl bg-green-700 py-4 text-center text-sm font-bold text-white"
            >
              Choisir une annonce à booster
            </Link>
          </div>

          <BottomNav />
        </div>
      </MobileShell>
    </main>
  );
}
