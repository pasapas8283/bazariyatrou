export const CITIES_BY_ISLAND: Record<string, string[]> = {
  'Grande Comore': [
    'Moroni',
    'Mitsamiouli',
    'Itsandra',
    'Iconi',
    'Mdé',
    'Mbeni',
    'Foumbouni',
    'Bambao',
    'Hahaya',
    'Koimbani',
    'Sima',
    'Oichili',
    'Djomani',
    'Mboude',
  ],
  Anjouan: [
    'Mutsamudu',
    'Domoni',
    'Ouani',
    'Mirontsy',
    'Sima',
    'Pomoni',
    'Bambao Mtrouni',
    'Bambao Mtsangua',
    'Bandrani',
    'Tsembéhou',
    'Moya',
    'Bimbini',
    'Adda',
    'Coni',
    'Jimlimé',
    'Ongojou',
    'Vouani',
    'Dzindri',
    'Chandra',
    'Lingoni',
    'Bazimini',
    'Patsy',
  ],
  Mohéli: [
    'Fomboni',
    'Nioumachoua',
    'Wanani',
    'Hoani',
    'Itsamia',
    'Djando',
    'Miringoni',
    'Ouallah',
    'Ndrondroni',
    'Mohoro',
  ],
};

export const ISLAND_OPTIONS = Object.keys(CITIES_BY_ISLAND);

export function getSortedCitiesByIsland(island: string): string[] {
  const cities = CITIES_BY_ISLAND[island] ?? [];
  return [...cities].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}

/** Format annonces : « Ville, Île » (comme à la publication). */
export function parseListingLocation(location: string | undefined): {
  city: string;
  island: string;
} {
  const trimmed = (location ?? '').trim();
  if (!trimmed) return { city: '', island: '' };
  const idx = trimmed.indexOf(',');
  if (idx === -1) return { city: trimmed, island: '' };
  return {
    city: trimmed.slice(0, idx).trim(),
    island: trimmed.slice(idx + 1).trim(),
  };
}

export function matchesLocationFilter(
  location: string | undefined,
  islandFilter: string,
  cityFilter: string
): boolean {
  if (!islandFilter && !cityFilter) return true;
  const { city, island } = parseListingLocation(location);
  if (islandFilter && island !== islandFilter) return false;
  if (cityFilter && city !== cityFilter) return false;
  return true;
}
