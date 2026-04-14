import type { MarketplaceItem } from '../types/marketplace';
import { defaultMarketplaceItems } from './marketplace-default-items';
import { normalizeItem } from './marketplace-normalizers';
import { combineLocalListingSnapshots } from './marketplace-storage';

/**
 * Fusionne les annonces serveur avec celles présentes uniquement en local
 * (ex. publication avant synchro API). Archive + stockage pour limiter les pertes.
 */
export function mergeApiListingsWithLocal(
  apiRaw: unknown[]
): MarketplaceItem[] {
  const fromApi = apiRaw
    .filter(
      (raw): raw is Record<string, unknown> =>
        raw != null && typeof raw === 'object' && !Array.isArray(raw)
    )
    .map((raw) => normalizeItem(raw))
    .filter((item) => typeof item.id === 'string' && item.id.length > 0);
  const apiIds = new Set(fromApi.map((i) => i.id));
  const localPool = combineLocalListingSnapshots();
  const localOnly = localPool.filter((i) => !apiIds.has(i.id));
  const merged = [...fromApi, ...localOnly];
  merged.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return merged;
}

/**
 * Charge la liste complète comme sur l’accueil : API + local, avec repli défauts / local seul.
 */
export async function loadMergedMarketplaceItems(): Promise<MarketplaceItem[]> {
  try {
    const response = await fetch('/api/listings', { cache: 'no-store' });
    if (!response.ok) throw new Error('API unavailable');
    const ct = response.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) throw new Error('API not JSON');
    const data = await response.json();
    const apiItems = Array.isArray(data?.items) ? data.items : [];
    const merged = mergeApiListingsWithLocal(apiItems);
    return merged.length === 0 ? defaultMarketplaceItems : merged;
  } catch {
    const pooled = combineLocalListingSnapshots();
    return pooled.length === 0 ? defaultMarketplaceItems : pooled;
  }
}
