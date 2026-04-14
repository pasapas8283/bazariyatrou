import type { MarketplaceItem } from '../types/marketplace';

/**
 * Recherche texte sur titre, description, lieu et nom affiché du vendeur.
 */
export function listingMatchesSearchQuery(
  item: MarketplaceItem,
  queryRaw: string
): boolean {
  const q = queryRaw.trim().toLowerCase();
  if (!q) return true;

  const fields = [
    item.title,
    item.description,
    item.location,
    item.sellerName,
    item.publishCategoryLabel,
  ];

  return fields.some((s) =>
    String(s ?? '')
      .toLowerCase()
      .includes(q)
  );
}
