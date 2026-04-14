'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import ListingCard from '@/components/ListingCard';
import MobileShell from '@/components/MobileShell';
import CategoryGrid from '@/components/CategoryGrid';
import BottomNav from '@/components/BottomNav';
import DesktopTopNav from '@/components/DesktopTopNav';
import { useMarketplaceItems } from '../hooks/use-marketplace-items';
import {
  categoryDisplayLabel,
  conditionDisplayLabel,
  listingCategoryDisplayLabel,
  listingPriceDisplaySuffix,
} from '../lib/marketplace-formatters';
import { formatPriceForVisitor } from '../lib/currency-conversion';
import { getCategoryFromPublishLabel } from '../lib/marketplace-categories';
import { matchesLocationFilter } from '../lib/comoros-locations';
import { listingMatchesSearchQuery } from '../lib/listing-text-search';
import { useDisplayCurrency } from '../contexts/display-currency-context';
import DisplayCurrencyToggle from '@/components/DisplayCurrencyToggle';
import type { PriceCurrency } from '../types/marketplace';

type HomeCardItem = {
  id: string;
  title: string;
  price: string;
  category: string;
  locationLabel: string;
  condition?: string;
  images: string[];
  isFeatured?: boolean;
  sellerType?: 'standard' | 'pro';
};

function toHomeCardItem(item: any, displayCurrency: PriceCurrency): HomeCardItem {
  return {
    id: item.id,
    title: item.title,
    price:
      formatPriceForVisitor(
        item.price,
        item.priceCurrency ?? 'KMF',
        displayCurrency
      ) + listingPriceDisplaySuffix(item),
    category: listingCategoryDisplayLabel(item),
    locationLabel:
      typeof item.location === 'string' && item.location.trim().length > 0
        ? item.location.trim()
        : 'Localisation non précisée',
    condition: conditionDisplayLabel(item.condition),
    images: item.images,
    isFeatured:
      item.isFeatured === true &&
      typeof item.featuredUntil === 'string' &&
      new Date(item.featuredUntil).getTime() > Date.now(),
    sellerType: item.sellerType === 'pro' ? 'pro' : 'standard',
  };
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const { items } = useMarketplaceItems();
  const { displayCurrency } = useDisplayCurrency();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tous');
  const [island, setIsland] = useState('');
  const [city, setCity] = useState('');
  const [imageSearchMatchIds, setImageSearchMatchIds] = useState<
    string[] | null
  >(null);

  useEffect(() => {
    const q = (searchParams.get('q') ?? '').trim();
    if (!q) return;
    setQuery((prev) => prev || q);
  }, [searchParams]);

  const imageSearchCandidates = useMemo(
    () =>
      items
        .filter((item) => item.status === 'available')
        .map((item) => ({ id: item.id, images: item.images })),
    [items]
  );

  const filteredItems = useMemo(() => {
    const now = Date.now();
    const isBoostActive = (item: any) =>
      item.isFeatured === true &&
      typeof item.featuredUntil === 'string' &&
      new Date(item.featuredUntil).getTime() > now;

    return items
      .filter((item) => item.status === 'available')
      .filter((item) => {
        const matchSearch = listingMatchesSearchQuery(item, query);

        const cardCategoryLabel = listingCategoryDisplayLabel(item);
        const broadCategoryLabel = categoryDisplayLabel(item.category);
        const selectedCategory = getCategoryFromPublishLabel(category);

        const matchCategory =
          category === 'Tous' ||
          cardCategoryLabel === category ||
          broadCategoryLabel === category ||
          item.category === selectedCategory;

        const matchLocation = matchesLocationFilter(
          item.location,
          island,
          city
        );

        const matchImage =
          imageSearchMatchIds === null ||
          imageSearchMatchIds.includes(item.id);

        return matchSearch && matchCategory && matchLocation && matchImage;
      })
      .sort((a, b) => {
        const aBoost = isBoostActive(a);
        const bBoost = isBoostActive(b);
        if (aBoost !== bBoost) return aBoost ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map((item) => toHomeCardItem(item, displayCurrency));
  }, [
    items,
    query,
    category,
    island,
    city,
    displayCurrency,
    imageSearchMatchIds,
  ]);

  return (
    <main className="min-h-screen bg-[#efefef] px-0 pb-10 pt-0 md:px-4 md:pt-8">
      <div className="mx-auto mb-0 w-full max-w-5xl md:mb-4">
        <DesktopTopNav />
      </div>
      <MobileShell>
        <div className="bg-white">
          <div className="px-4 pb-2 pt-[max(0.25rem,env(safe-area-inset-top,0px))] md:pt-7">
            <Navbar />
          </div>

          <SearchBar
            query={query}
            setQuery={setQuery}
            island={island}
            setIsland={setIsland}
            city={city}
            setCity={setCity}
            imageSearchCandidates={imageSearchCandidates}
            imageSearchMatchIds={imageSearchMatchIds}
            setImageSearchMatchIds={setImageSearchMatchIds}
          />
          <CategoryGrid category={category} setCategory={setCategory} />

          <section className="px-4 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-gray-900">
                Annonces récentes
              </h2>
              <DisplayCurrencyToggle />
            </div>

            {filteredItems.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                {imageSearchMatchIds !== null &&
                imageSearchMatchIds.length === 0
                  ? 'Aucune annonce ne correspond assez à cette image. Essayez une autre photo ou touchez Effacer sous la barre de recherche.'
                  : 'Aucun produit trouvé.'}
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {filteredItems.map((item) => (
                  <ListingCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    price={item.price}
                    image={item.images[0]}
                    category={item.category}
                    badgeLabel={item.locationLabel}
                    condition={item.condition}
                    isFeatured={item.isFeatured}
                    sellerType={item.sellerType}
                  />
                ))}
              </div>
            )}
          </section>

          <BottomNav />
        </div>
      </MobileShell>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#efefef]" />}>
      <HomePageContent />
    </Suspense>
  );
}