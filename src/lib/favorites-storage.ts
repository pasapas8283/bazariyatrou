export type FavoriteItem = {
  id: string;
  title: string;
  price: string;
  image: string;
  category: string;
  condition?: string;
};

export const FAVORITES_STORAGE_KEY = 'bazariyatrou-favorites';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  if (value && typeof value === 'object') return value as UnknownRecord;
  return {};
}

export function readFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.map((itemValue: unknown) => {
      const item = asRecord(itemValue);
      const title =
        typeof item.title === 'string' && item.title.trim() !== ''
          ? item.title
          : 'Sans titre';
      const price =
        typeof item.price === 'string' && item.price.trim() !== ''
          ? item.price
          : 'Prix non renseigné';
      const image =
        typeof item.image === 'string' && item.image.trim() !== ''
          ? item.image
          : Array.isArray(item.images) &&
              typeof item.images[0] === 'string' &&
              item.images[0].trim() !== ''
            ? item.images[0]
            : 'https://placehold.co/600x400?text=Annonce';
      const category =
        typeof item.category === 'string' && item.category.trim() !== ''
          ? item.category
          : 'Catégories';
      const condition =
        typeof item.condition === 'string' ? item.condition : undefined;
      return {
      id: String(item.id ?? crypto.randomUUID()),
      title,
      price,
      image:
        image,
      category,
      condition,
      };
    });
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