import type {
  LocationRentalPeriod,
  MarketplaceItem,
  PriceCurrency,
} from '../types/marketplace';
import { getCategoryLabel } from './marketplace-categories';
import { getConditionLabel } from './marketplace-conditions';
import { allowedLocationRentalPeriodsForSub } from './marketplace-subcategories';

/** Annonce terrain (détectée par les champs métier, catégorie stockée = immobilier). */
export function isTerrainListingItem(
  item: Pick<
    MarketplaceItem,
    | 'terrainSetting'
    | 'terrainAreaMode'
    | 'terrainAreaM2'
    | 'terrainLengthM'
    | 'terrainWidthM'
  >
): boolean {
  return Boolean(
    item.terrainSetting ||
      item.terrainAreaMode ||
      item.terrainAreaM2 ||
      item.terrainLengthM ||
      item.terrainWidthM
  );
}

/** Suffixe d’affichage du prix (ex. / m²) pour les terrains. */
export function terrainPriceDisplaySuffix(
  item: MarketplaceItem | null | undefined
): string {
  if (!item || !isTerrainListingItem(item)) return '';
  return item.terrainPriceBasis === 'per-m2' ? ' / m²' : '';
}

const LOCATION_PERIOD_SUFFIX: Record<LocationRentalPeriod, string> = {
  month: ' / mois',
  day: ' / journée',
  night: ' / nuit',
  hour: ' / heure',
};

/** Suffixe prix location (mois, journée, nuit, heure). */
export function locationRentalPeriodDisplaySuffix(
  item: MarketplaceItem | null | undefined
): string {
  if (!item || item.category !== 'location' || !item.locationRentalPeriod)
    return '';
  const allowed = allowedLocationRentalPeriodsForSub(item.subCategory ?? '');
  if (!allowed.includes(item.locationRentalPeriod)) return '';
  return LOCATION_PERIOD_SUFFIX[item.locationRentalPeriod] ?? '';
}

/** Suffixe à afficher après le montant (terrain ou location, jamais les deux). */
export function listingPriceDisplaySuffix(
  item: MarketplaceItem | null | undefined
): string {
  if (!item) return '';
  const terrain = terrainPriceDisplaySuffix(item);
  if (terrain) return terrain;
  return locationRentalPeriodDisplaySuffix(item);
}

export function formatListingPrice(
  price: number,
  currency: PriceCurrency = 'KMF'
) {
  if (!price || Number.isNaN(price)) return 'Prix non renseigné';
  const formatted = new Intl.NumberFormat('fr-FR').format(price);
  return currency === 'EUR' ? `${formatted} €` : `${formatted} KMF`;
}

export function formatPriceKMF(price: number, currency: PriceCurrency = 'KMF') {
  return formatListingPrice(price, currency);
}

export function categoryDisplayLabel(category: MarketplaceItem['category']) {
  return getCategoryLabel(category);
}

/** Libellé affiché sur les cartes : choix à la publication, sinon déduction, sinon catégorie large. */
export function listingCategoryDisplayLabel(
  item: MarketplaceItem | null | undefined
): string {
  if (!item) return 'Catégories';
  const explicit = item.publishCategoryLabel?.trim();
  if (explicit) return explicit;

  if (item.category === 'immobilier') {
    if (isTerrainListingItem(item)) return 'Terrain';
    if (
      item.houseAreaM2 != null ||
      item.houseLengthM != null ||
      item.houseRoomCount != null ||
      item.houseLevels
    ) {
      return 'Vente maison';
    }
  }

  return categoryDisplayLabel(item.category);
}

export function conditionDisplayLabel(condition: MarketplaceItem['condition']) {
  return getConditionLabel(condition);
}
