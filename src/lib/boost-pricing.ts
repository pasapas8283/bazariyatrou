import type { PriceCurrency } from '../types/marketplace';
import { formatPriceForVisitor } from './currency-conversion';

export const BOOST_10_DAYS_PRICE_KMF = 2000;
export const PRO_30_DAYS_PRICE_KMF = 5000;

export function formatBoostPrice(
  amountKmf: number,
  displayCurrency: PriceCurrency
): string {
  return formatPriceForVisitor(amountKmf, 'KMF', displayCurrency);
}

