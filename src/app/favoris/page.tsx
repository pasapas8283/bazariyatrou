'use client';

import { useEffect, useState } from 'react';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import ListingCard from '@/components/ListingCard';
import DesktopTopNav from '@/components/DesktopTopNav';
import { readFavorites, type FavoriteItem } from '../../lib/favorites-storage';

export default function FavorisPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  const loadFavorites = () => {
    setFavorites(readFavorites());
  };

  useEffect(() => {
    loadFavorites();

    const onFocus = () => loadFavorites();
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#efefef] px-0 py-0 md:px-4 md:py-8">
      <div className="mx-auto mb-0 w-full max-w-5xl md:mb-4">
        <DesktopTopNav />
      </div>
      <MobileShell>
        <div className="min-h-full bg-white">
          <div className="px-4 py-6">
            <h1 className="text-2xl font-extrabold text-gray-900">Favoris</h1>
            <p className="mt-2 text-sm text-gray-500">
              Vos annonces enregistrées apparaissent ici.
            </p>
          </div>

          <div className="px-4 pb-5">
            {favorites.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-sm font-medium text-gray-500">
                  Aucun favori pour le moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {favorites.map((item) => (
                  <ListingCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    price={item.price}
                    image={item.image}
                    category={item.category}
                    condition={item.condition}
                  />
                ))}
              </div>
            )}
          </div>

          <BottomNav />
        </div>
      </MobileShell>
    </main>
  );
}