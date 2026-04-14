export type FavoriteItem = {
  id: string;
  title: string;
  price: string;
  image: string;
  category: string;
  condition?: string;
};

export const FAVORITES_STORAGE_KEY = 'bazariyatrou-favorites';

export function readFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: any) => ({
      id: String(item.id ?? crypto.randomUUID()),
      title: item.title ?? 'Sans titre',
      price: item.price ?? 'Prix non renseigné',
      image:
        item.image ||
        item.images?.[0] ||
        'https://placehold.co/600x400?text=Annonce',
      category: item.category ?? 'Catégories',
      condition: item.condition,
    }));
  } catch {
    return [];
  }
}

export function writeFavorites(items: FavoriteItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
}

export function isFavoriteById(
  favorites: FavoriteItem[],
  id: string,
  title?: string
) {
  return favorites.some((item) => item.id === id || item.title === title);
}

export function toggleFavoriteItem(item: FavoriteItem) {
  const favorites = readFavorites();
  const exists = isFavoriteById(favorites, item.id, item.title);

  if (exists) {
    const updated = favorites.filter(
      (fav) => fav.id !== item.id && fav.title !== item.title
    );
    writeFavorites(updated);
    return false;
  }

  writeFavorites([...favorites, item]);
  return true;
}