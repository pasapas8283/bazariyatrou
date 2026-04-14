'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { MarketplaceItem } from '../types/marketplace';
import { getCurrentUser } from '../lib/auth-storage';
import {
  readMarketplaceItems,
  writeMarketplaceItems,
} from '../lib/marketplace-storage';
import { loadMergedMarketplaceItems } from '../lib/listings-merge';

/** Rafraîchit depuis l’API + local pendant que l’onglet est visible (délai = intervalle). */
const LISTINGS_POLL_MS = 5000;

export function useMarketplaceItems() {
  const pathname = usePathname();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await loadMergedMarketplaceItems();
      if (!cancelled) {
        setItems(next);
        writeMarketplaceItems(next);
        setHydrated(true);
      }
    })();
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
    () => items.filter((item) => item.status === 'available'),
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
    fetch(`/api/listings/${id}`, {
      method: 'DELETE',
      headers: actorId ? { 'x-bzy-user-id': actorId } : undefined,
    }).catch(() => {});
  };

  const updateItemStatus = (
    id: string,
    status: MarketplaceItem['status']
  ) => {
    const actorId = getCurrentUser()?.id;
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              updatedAt: now,
            }
          : item
      )
    );
    fetch(`/api/listings/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(actorId ? { 'x-bzy-user-id': actorId } : {}),
      },
      body: JSON.stringify({ status, updatedAt: now }),
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
  };

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
    fetch(`/api/listings/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(actorId ? { 'x-bzy-user-id': actorId } : {}),
      },
      body: JSON.stringify({ ...updates, updatedAt: now }),
    }).catch(() => {});
  };

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