'use client';

import { useDisplayCurrency } from '@/contexts/display-currency-context';

export default function DisplayCurrencyToggle({
  className = '',
}: {
  className?: string;
}) {
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();

  const btn = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-bold transition sm:px-4 sm:text-sm ${
      active
        ? 'bg-green-700 text-white shadow-sm'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-white p-0.5 shadow-sm ${className}`}
      role="group"
      aria-label="Devise d’affichage des prix"
    >
      <button
        type="button"
        className={btn(displayCurrency === 'KMF')}
        onClick={() => setDisplayCurrency('KMF')}
      >
        KMF
      </button>
      <button
        type="button"
        className={btn(displayCurrency === 'EUR')}
        onClick={() => setDisplayCurrency('EUR')}
      >
        EUR €
      </button>
    </div>
  );
}
