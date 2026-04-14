import type { MarketplaceItem } from '../types/marketplace';
import { normalizeItem } from './marketplace-normalizers';

export const MARKETPLACE_STORAGE_KEY = 'bazariyatrou-items';
/** Dernière copie du JSON avant remplacement (récupération si une fusion a trop écrasé). */
export const MARKETPLACE_ARCHIVE_KEY = 'bazariyatrou-items-archive';
export const MARKETPLACE_ARCHIVE2_KEY = 'bazariyatrou-items-archive-2';

function itemRecencyMs(item: MarketplaceItem): number {
  const u = item.updatedAt ? Date.parse(item.updatedAt) : NaN;
  if (!Number.isNaN(u)) return u;
  const c = Date.parse(item.createdAt);
  return Number.isNaN(c) ? 0 : c;
}

export function readMarketplaceItems(): MarketplaceItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(MARKETPLACE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeItem);
  } catch {
    return [];
  }
}

export function readArchivedMarketplaceItems(): MarketplaceItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(MARKETPLACE_ARCHIVE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeItem);
  } catch {
    return [];
  }
}

export function readArchived2MarketplaceItems(): MarketplaceItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(MARKETPLACE_ARCHIVE2_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeItem);
  } catch {
    return [];
  }
}

/**
 * Union du stockage actuel et des archives (même id → version la plus récente).
 * À utiliser avant fusion API pour ne pas perdre d’annonces uniquement locales.
 */
export function combineLocalListingSnapshots(): MarketplaceItem[] {
  const map = new Map<string, MarketplaceItem>();
  for (const item of readArchived2MarketplaceItems()) {
    map.set(item.id, item);
  }
  for (const item of readArchivedMarketplaceItems()) {
    const prev = map.get(item.id);
    if (!prev) {
      map.set(item.id, item);
      continue;
    }
    if (itemRecencyMs(item) >= itemRecencyMs(prev)) {
      map.set(item.id, item);
    }
  }
  for (const item of readMarketplaceItems()) {
    const prev = map.get(item.id);
    if (!prev) {
      map.set(item.id, item);
      continue;
    }
    if (itemRecencyMs(item) >= itemRecencyMs(prev)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

export function writeMarketplaceItems(items: MarketplaceItem[]) {
  if (typeof window === 'undefined') return;

  try {
    const current = localStorage.getItem(MARKETPLACE_STORAGE_KEY);
    const prevArchive = localStorage.getItem(MARKETPLACE_ARCHIVE_KEY);
    if (prevArchive != null && prevArchive.length > 2) {
      localStorage.setItem(MARKETPLACE_ARCHIVE2_KEY, prevArchive);
    }
    if (current != null && current.length > 2) {
      localStorage.setItem(MARKETPLACE_ARCHIVE_KEY, current);
    }
    localStorage.setItem(MARKETPLACE_STORAGE_KEY, JSON.stringify(items));
  } catch {
    try {
      localStorage.setItem(MARKETPLACE_STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota */
    }
  }
}

export function prependMarketplaceItem(item: MarketplaceItem) {
  const items = readMarketplaceItems();
  writeMarketplaceItems([item, ...items]);
}

export function createMarketplaceItem(item: MarketplaceItem) {
  prependMarketplaceItem(item);
}

export function getMarketplaceItemById(id: string): MarketplaceItem | null {
  const items = readMarketplaceItems();
  return items.find((item) => item.id === id) ?? null;
}

export function updateMarketplaceItem(
  id: string,
  updates: Partial<MarketplaceItem>
): MarketplaceItem | null {
  const items = readMarketplaceItems();
  const target = items.find((item) => item.id === id);

  if (!target) return null;

  const updatedItem = normalizeItem({
    ...target,
    ...updates,
    id: target.id,
    updatedAt: new Date().toISOString(),
  });

  const updatedItems = items.map((item) => (item.id === id ? updatedItem : item));
  writeMarketplaceItems(updatedItems);

  return updatedItem;
}

export function deleteMarketplaceItem(id: string): boolean {
  const items = readMarketplaceItems();
  const updatedItems = items.filter((item) => item.id !== id);

  if (updatedItems.length === items.length) return false;

  writeMarketplaceItems(updatedItems);
  return true;
}