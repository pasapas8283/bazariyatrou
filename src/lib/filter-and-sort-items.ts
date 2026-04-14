import type { MarketplaceItem, PriceCurrency } from '../types/marketplace';
import { convertPriceAmount } from './currency-conversion';
import { listingMatchesSearchQuery } from './listing-text-search';

export type ItemFilters = {
  query: string;
  category: string;
  subCategory: string;
  subSubCategory: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
  location: string;
  sortBy: 'recent' | 'price-asc' | 'price-desc';
};

function priceInDisplayCurrency(
  item: MarketplaceItem,
  displayCurrency: PriceCurrency
): number {
  const stored = item.priceCurrency ?? 'KMF';
  return convertPriceAmount(item.price, stored, displayCurrency);
}

export function filterAndSortItems(
  items: MarketplaceItem[],
  filters: ItemFilters,
  displayCurrency: PriceCurrency = 'KMF'
) {
  const now = Date.now();
  const isBoostActive = (item: MarketplaceItem) =>
    item.isFeatured === true &&
    typeof item.featuredUntil === 'string' &&
    new Date(item.featuredUntil).getTime() > now;

  const filtered = items.filter((item) => {
    const matchesQuery = listingMatchesSearchQuery(item, filters.query);

    const matchesCategory =
      !filters.category || filters.category === 'all'
        ? true
        : item.category === filters.category;

    const matchesSubCategory =
      !filters.subCategory || item.subCategory === filters.subCategory;

    const matchesSubSubCategory =
      !filters.subSubCategory || item.subSubCategory === filters.subSubCategory;

    const matchesCondition =
      !filters.condition || item.condition === filters.condition;

    const matchesLocation =
      !filters.location ||
      item.location.toLowerCase().includes(filters.location.toLowerCase());

    const minPrice = filters.minPrice
      ? Number(String(filters.minPrice).replace(/\s/g, ''))
      : undefined;
    const maxPrice = filters.maxPrice
      ? Number(String(filters.maxPrice).replace(/\s/g, ''))
      : undefined;

    const displayAmount = priceInDisplayCurrency(item, displayCurrency);

    const matchesMinPrice =
      typeof minPrice !== 'number' || Number.isNaN(minPrice)
        ? true
        : displayAmount >= minPrice;

    const matchesMaxPrice =
      typeof maxPrice !== 'number' || Number.isNaN(maxPrice)
        ? true
        : displayAmount <= maxPrice;

    return (
      matchesQuery &&
      matchesCategory &&
      matchesSubCategory &&
      matchesSubSubCategory &&
      matchesCondition &&
      matchesLocation &&
      matchesMinPrice &&
      matchesMaxPrice
    );
  });

  return [...filtered].sort((a, b) => {
    const aBoost = isBoostActive(a);
    const bBoost = isBoostActive(b);
    if (aBoost !== bBoost) return aBoost ? -1 : 1;

    if (filters.sortBy === 'price-asc') {
      return (
        priceInDisplayCurrency(a, displayCurrency) -
        priceInDisplayCurrency(b, displayCurrency)
      );
    }
    if (filters.sortBy === 'price-desc') {
      return (
        priceInDisplayCurrency(b, displayCurrency) -
        priceInDisplayCurrency(a, displayCurrency)
      );
    }

    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });
}