import type { PriceCurrency } from '../types/marketplace';

/**
 * Parité officielle franc comorien / euro (arrêté de la BEAC).
 * 1 EUR = 491,96775 KMF
 */
export const KMF_PER_ONE_EUR = 491.96775;

export function convertPriceAmount(
  amount: number,
  from: PriceCurrency,
  to: PriceCurrency
): number {
  if (!amount || Number.isNaN(amount)) return 0;
  if (from === to) return amount;
  if (from === 'KMF' && to === 'EUR') return amount / KMF_PER_ONE_EUR;
  if (from === 'EUR' && to === 'KMF') return amount * KMF_PER_ONE_EUR;
  return amount;
}

export function formatPriceForVisitor(
  price: number,
  itemCurrency: PriceCurrency,
  displayCurrency: PriceCurrency
): string {
  if (!price || Number.isNaN(price)) return 'Prix non renseigné';
  const converted = convertPriceAmount(price, itemCurrency, displayCurrency);

  if (displayCurrency === 'EUR') {
    const rounded = Math.round(converted * 100) / 100;
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(rounded);
    return `${formatted} €`;
  }

  const rounded = Math.round(converted);
  const formatted = new Intl.NumberFormat('fr-FR').format(rounded);
  return `${formatted} KMF`;
}
