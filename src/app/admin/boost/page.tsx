'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MobileShell from '@/components/MobileShell';
import { formatListingPrice } from '@/lib/marketplace-formatters';
import type { PriceCurrency } from '@/types/marketplace';

type AdminItem = {
  id: string;
  title: string;
  sellerName: string;
  price: number;
  priceCurrency?: PriceCurrency;
  isFeatured?: boolean;
  featuredUntil?: string;
  sellerType?: 'standard' | 'pro';
};

export default function AdminBoostPage() {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/listings', { cache: 'no-store' });
      const data = await res.json();
      const list = Array.isArray(data?.items) ? data.items : [];
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const logoutAdmin = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' });
    window.location.href = '/admin/login';
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.sellerName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
    );
  }, [items, query]);

  const patchItem = async (id: string, updates: Partial<AdminItem>) => {
    setBusyId(id);
    try {
      await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const activateBoost10d = async (id: string) => {
    await patchItem(id, {
      isFeatured: true,
      featuredUntil: new Date(
        Date.now() + 10 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });
  };

  const removeBoost = async (id: string) => {
    await patchItem(id, { isFeatured: false, featuredUntil: '' });
  };

  const setSellerPro = async (id: string, pro: boolean) => {
    await patchItem(id, { sellerType: pro ? 'pro' : 'standard' });
  };

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <MobileShell>
        <div className="min-h-full bg-white">
          <div className="border-b border-gray-100 px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-extrabold text-gray-900">Admin Boost</h1>
              <div className="flex items-center gap-3">
                <Link href="/" className="text-sm font-semibold text-green-700">
                  Retour
                </Link>
                <button
                  type="button"
                  onClick={logoutAdmin}
                  className="text-sm font-semibold text-red-600"
                >
                  Déconnexion
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Activation manuelle des boosts et vendeurs pro.
            </p>
          </div>

          <div className="px-4 py-4">
            <input
              type="text"
              placeholder="Recherche (titre, vendeur, id)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
            />

            {loading ? (
              <p className="mt-4 text-sm text-gray-500">Chargement...</p>
            ) : (
              <div className="mt-4 space-y-3">
                {visible.map((item) => {
                  const featuredActive =
                    item.isFeatured === true &&
                    typeof item.featuredUntil === 'string' &&
                    new Date(item.featuredUntil).getTime() > Date.now();
                  const busy = busyId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-200 bg-white p-3"
                    >
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">
                        {item.sellerName} - {item.id}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-gray-100 px-2 py-1">
                          {formatListingPrice(
                            item.price,
                            item.priceCurrency ?? 'KMF'
                          )}
                        </span>
                        {featuredActive && (
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-yellow-800">
                            Boostée
                          </span>
                        )}
                        {item.sellerType === 'pro' && (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-green-800">
                            Pro
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => activateBoost10d(item.id)}
                          className="rounded-xl bg-yellow-100 py-2 text-xs font-semibold text-yellow-800 disabled:opacity-50"
                        >
                          Boost 10j
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => removeBoost(item.id)}
                          className="rounded-xl bg-gray-100 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50"
                        >
                          Retirer boost
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setSellerPro(item.id, true)}
                          className="rounded-xl bg-green-100 py-2 text-xs font-semibold text-green-800 disabled:opacity-50"
                        >
                          Mettre Pro
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setSellerPro(item.id, false)}
                          className="rounded-xl bg-red-100 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                        >
                          Retirer Pro
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </MobileShell>
    </main>
  );
}
