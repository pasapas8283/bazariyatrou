'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { MarketplaceItem } from '../types/marketplace';
import { getCurrentUser } from '../lib/auth-storage';
import { writeMarketplaceItems } from '../lib/marketplace-storage';
import { loadMergedMarketplaceItems } from '../lib/listings-merge';
import { apiFetch } from '../lib/api-origin';

/** Rafraîchit depuis l’API + local pendant que l’onglet est visible (délai = intervalle). */
const LISTINGS_POLL_MS = 5000;

export function useMarketplaceItems() {
  const pathname = usePathname();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const next = await loadMergedMarketplaceItems();
      if (!cancelled) {
        setItems(next);
        writeMarketplaceItems(next);
        setHydrated(true);
      }
    };
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const pull = () => {
      void (async () => {
        try {
          const next = await loadMergedMarketplaceItems();
          setItems(next);
          writeMarketplaceItems(next);
        } catch {
          /* réseau indisponible */
        }
      })();
    };

    const onListingsUpdated = () => {
      pull();
    };

    window.addEventListener('bzy-listings-updated', onListingsUpdated);

    const startPolling = () => {
      if (intervalId !== undefined) return;
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') pull();
      }, LISTINGS_POLL_MS);
    };

    const stopPolling = () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        pull();
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    if (document.visibilityState === 'visible') {
      startPolling();
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('bzy-listings-updated', onListingsUpdated);
      stopPolling();
    };
  }, []);

  useEffect(() => {
    const onFocus = () => {
      void (async () => {
        try {
          const next = await loadMergedMarketplaceItems();
          setItems(next);
          writeMarketplaceItems(next);
        } catch {
          /* ignore */
        }
      })();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeMarketplaceItems(items);
  }, [items, hydrated]);

  const availableItems = useMemo(
    () => items.filter((item) => item.status !== 'sold'),
    [items]
  );

  const myItems = useMemo(
    () => {
      const currentUser = getCurrentUser();
      if (!currentUser) return [];
      return items.filter((item) => item.sellerId === currentUser.id);
    },
    [items]
  );

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    const actorId = getCurrentUser()?.id ?? '';
    apiFetch(`/api/listings/${id}`, {
      method: 'DELETE',
      headers: actorId ? { 'x-bzy-user-id': actorId } : undefined,
    }).catch(() => {});
  };

  const updateItemStatus = useCallback((
    id: string,
    status: MarketplaceItem['status']
  ) => {
    const actorId = getCurrentUser()?.id;
    const now = new Date().toISOString();
    const localReservedUntil =
      status === 'reserved'
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : undefined;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              reservedUntil: localReservedUntil,
              updatedAt: now,
            }
          : item
      )
    );
    apiFetch(`/api/listings/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(actorId ? { 'x-bzy-user-id': actorId } : {}),
      },
      body: JSON.stringify({
        status,
        reservedUntil: localReservedUntil,
        updatedAt: now,
      }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { item?: MarketplaceItem };
        if (data?.item?.id === id) {
          setItems((prev) =>
            prev.map((item) => (item.id === id ? data.item! : item))
          );
        }
      })
      .catch(() => {});
  }, []);

  const updateItem = (id: string, updates: Partial<MarketplaceItem>) => {
    const actorId = getCurrentUser()?.id;
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              updatedAt: now,
            }
          : item
      )
    );
    apiFetch(`/api/listings/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(actorId ? { 'x-bzy-user-id': actorId } : {}),
      },
      body: JSON.stringify({ ...updates, updatedAt: now }),
    }).catch(() => {});
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      const nowMs = Date.now();
      const expiredIds = items
        .filter((item) => {
          if (item.status !== 'reserved') return false;
          if (typeof item.reservedUntil !== 'string') return true;
          const untilMs = new Date(item.reservedUntil).getTime();
          if (!Number.isFinite(untilMs)) return true;
          return nowMs >= untilMs;
        })
        .map((item) => item.id);

      if (expiredIds.length === 0) return;
      for (const id of expiredIds) {
        updateItemStatus(id, 'available');
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [items, updateItemStatus]);

  return {
    items,
    availableItems,
    myItems,
    hydrated,
    setItems,
    deleteItem,
    updateItemStatus,
    updateItem,
  };
}