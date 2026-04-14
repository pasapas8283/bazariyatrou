'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMarketplaceItems } from '../../hooks/use-marketplace-items';
import {
  filterAndSortItems,
  type ItemFilters,
} from '../../lib/filter-and-sort-items';

import {
  conditionDisplayLabel,
  listingCategoryDisplayLabel,
  listingPriceDisplaySuffix,
} from '../../lib/marketplace-formatters';
import { formatPriceForVisitor } from '../../lib/currency-conversion';
import { useDisplayCurrency } from '../../contexts/display-currency-context';
import DisplayCurrencyToggle from '@/components/DisplayCurrencyToggle';
import {
  getCategoryFromUnknown,
  HOME_CATEGORIES,
  MARKETPLACE_CATEGORIES,
} from '../../lib/marketplace-categories';
import {
  getSubCategoryOptions,
  MODE_SUBSUBCATEGORIES,
  supportsSecondLevelSubcategories,
  supportsSubcategories,
} from '../../lib/marketplace-subcategories';
import DesktopTopNav from '@/components/DesktopTopNav';

const initialFilters: ItemFilters = {
  query: '',
  category: 'all',
  subCategory: '',
  subSubCategory: '',
  minPrice: '',
  maxPrice: '',
  condition: '',
  location: '',
  sortBy: 'recent',
};

export default function AnnoncesPage() {
  const router = useRouter();
  const { availableItems, hydrated } = useMarketplaceItems();
  const { displayCurrency } = useDisplayCurrency();
  const [filters, setFilters] = useState<ItemFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  const searchableCategories = useMemo(
    () =>
      HOME_CATEGORIES.filter((cat) => cat.label !== 'Tous')
        .map((homeCat) =>
          MARKETPLACE_CATEGORIES.find((cat) => cat.label === homeCat.label)
        )
        .filter((cat): cat is NonNullable<typeof cat> => Boolean(cat))
        .map((cat) => ({ value: cat.value, label: cat.label })),
    []
  );

  const results = useMemo(() => {
    return filterAndSortItems(availableItems, filters, displayCurrency);
  }, [availableItems, filters, displayCurrency]);

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const selectedCategory = getCategoryFromUnknown(filters.category);
  const showSubCategoryFilter =
    filters.category !== 'all' && supportsSubcategories(selectedCategory);
  const showSubSubCategoryFilter =
    showSubCategoryFilter && supportsSecondLevelSubcategories(selectedCategory);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl bg-white pb-24 md:px-4">
      <div className="mb-0 md:mb-4">
        <DesktopTopNav />
      </div>
      <div className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="px-4 pb-4 pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-bold">Annonces</h1>

            <div className="flex flex-wrap items-center gap-2">
              <DisplayCurrencyToggle />
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="rounded-full border px-4 py-2 text-sm font-medium"
              >
                Filtres
              </button>
            </div>
          </div>

          <p className="mb-2 text-[11px] leading-snug text-gray-500">
            Prix convertis au taux indicatif officiel (1&nbsp;€ = 491,96775&nbsp;KMF).
            Les vendeurs affichent le prix dans leur devise ; vous choisissez l’unité
            d’affichage.
          </p>

          <input
            type="text"
            placeholder="Rechercher une annonce..."
            value={filters.query}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, query: e.target.value }))
            }
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2"
          />

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {[{ value: 'all', label: 'Tout' }, ...searchableCategories.map((cat) => ({
              value: cat.value,
              label: cat.label,
            }))].map((cat) => {
              const active = filters.category === cat.value;

              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      category: cat.value,
                      subCategory: '',
                      subSubCategory: '',
                    }))
                  }
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                    active
                      ? 'bg-black text-white'
                      : 'border bg-white text-black'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section className="px-4 py-4 md:px-2">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {!hydrated
              ? 'Chargement...'
              : `${results.length} annonce${results.length > 1 ? 's' : ''}`}
          </p>

          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                sortBy: e.target.value as ItemFilters['sortBy'],
              }))
            }
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option value="recent">Plus récent</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>
        </div>

        {!hydrated ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="overflow-hidden rounded-3xl border bg-white"
              >
                <div className="aspect-[4/3] animate-pulse bg-gray-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-8 text-center">
            <p className="text-lg font-semibold">Aucune annonce trouvée</p>
            <p className="mt-2 text-sm text-gray-500">
              Essaie une autre recherche ou modifie les filtres.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-full bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Réinitialiser
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((item) => (
              <div
                key={item.id}
                role="link"
                tabIndex={0}
                className="block cursor-pointer overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:shadow-md"
                onClick={() =>
                  void router.push(
                    `/annonces/detail?id=${encodeURIComponent(item.id)}`
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    void router.push(
                      `/annonces/detail?id=${encodeURIComponent(item.id)}`
                    );
                  }
                }}
              >
                <div className="relative aspect-[4/3] w-full bg-gray-100">
                  <img
                    src={
                      item.images?.[0] ||
                      'https://placehold.co/600x400?text=Annonce'
                    }
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />

                  {item.status === 'sold' && (
                    <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                      Vendu
                    </span>
                  )}

                  {item.isFeatured === true &&
                    typeof item.featuredUntil === 'string' &&
                    new Date(item.featuredUntil).getTime() > Date.now() && (
                      <span className="absolute right-3 top-3 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                        Boostée
                      </span>
                    )}
                </div>

                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h2 className="line-clamp-2 text-base font-semibold">
                      {item.title}
                    </h2>

                    <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs">
                      {listingCategoryDisplayLabel(item)}
                    </span>
                  </div>

                  <p className="mb-2 text-lg font-bold">
                    {formatPriceForVisitor(
                      item.price,
                      item.priceCurrency ?? 'KMF',
                      displayCurrency
                    )}
                    {listingPriceDisplaySuffix(item)}
                  </p>

                  <p className="line-clamp-2 text-sm text-gray-600">
                    {item.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{item.location}</span>
                    <div className="flex items-center gap-2">
                      {item.sellerType === 'pro' && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-800">
                          Pro
                        </span>
                      )}
                      {item.category !== 'location' && (
                        <span>{conditionDisplayLabel(item.condition)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showFilters && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 md:items-center md:justify-center"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-4 pb-6 md:max-w-xl md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-gray-300" />

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filtres</h2>

              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="rounded-full border px-3 py-2 text-sm"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-4">
              {showSubCategoryFilter && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Sous-catégorie
                  </label>

                  <select
                    value={filters.subCategory}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        subCategory: e.target.value,
                        subSubCategory: '',
                      }))
                    }
                    className="w-full rounded-2xl border px-4 py-3 text-sm"
                  >
                    <option value="">Toutes</option>
                    {getSubCategoryOptions(selectedCategory).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {showSubSubCategoryFilter && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Détail
                  </label>

                  <select
                    value={filters.subSubCategory}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        subSubCategory: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border px-4 py-3 text-sm"
                  >
                    <option value="">Tous</option>
                    {MODE_SUBSUBCATEGORIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Localisation
                </label>

                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Ex : Moroni"
                  className="w-full rounded-2xl border px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">État</label>

                <select
                  value={filters.condition}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      condition: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border px-4 py-3 text-sm"
                >
                  <option value="">Tous</option>
                  <option value="new">Neuf</option>
                  <option value="like-new">Comme neuf</option>
                  <option value="good">Bon état</option>
                  <option value="fair">État correct</option>
                </select>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-500">
                  Fourchette dans la même devise que le sélecteur (KMF ou €).
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder={
                      displayCurrency === 'EUR' ? 'Min (€)' : 'Min (KMF)'
                    }
                    value={filters.minPrice}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minPrice: e.target.value,
                      }))
                    }
                    className="rounded-2xl border px-4 py-3 text-sm"
                  />

                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder={
                      displayCurrency === 'EUR' ? 'Max (€)' : 'Max (KMF)'
                    }
                    value={filters.maxPrice}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxPrice: e.target.value,
                      }))
                    }
                    className="rounded-2xl border px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border px-4 py-3 font-medium"
                >
                  Réinitialiser
                </button>

                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="rounded-full bg-black px-4 py-3 font-medium text-white"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}