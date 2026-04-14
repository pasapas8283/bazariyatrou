export const STORAGE_KEYS = {
  items: 'bazariyatrou-items',
  conversations: 'bazariyatrou-conversations',
  favorites: 'bazariyatrou-favorites',
};

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) return fallback;

    const parsed = JSON.parse(raw);

    // sécurité : si c'est null ou undefined → fallback
    if (parsed === null || parsed === undefined) return fallback;

    return parsed as T;
  } catch (error) {
    console.error(`Erreur lecture localStorage (${key})`, error);
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Erreur écriture localStorage (${key})`, error);
  }
}