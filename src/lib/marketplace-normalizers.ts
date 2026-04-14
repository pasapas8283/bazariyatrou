import {
  HOUSE_SALE_LEVEL_OPTIONS,
  type HouseSaleLevel,
  type LocationRentalPeriod,
  type MarketplaceItem,
  type PriceCurrency,
  type TerrainPriceBasis,
} from '../types/marketplace';

export function normalizePriceCurrency(value: unknown): PriceCurrency {
  if (value === 'EUR') return 'EUR';
  if (typeof value === 'string') {
    const s = value.trim().toUpperCase();
    if (s === 'EUR' || s === 'EURO' || s === '€') return 'EUR';
  }
  return 'KMF';
}
import { getCategoryFromUnknown } from './marketplace-categories';
import { getConditionFromUnknown } from './marketplace-conditions';

const fallbackImage =
  'https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1200&auto=format&fit=crop';

export function normalizePrice(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d]/g, '');
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

export function normalizeCategory(value: unknown): MarketplaceItem['category'] {
  return getCategoryFromUnknown(value);
}

export function normalizeCondition(value: unknown): MarketplaceItem['condition'] {
  return getConditionFromUnknown(value);
}

export function normalizeImages(raw: any): string[] {
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    const cleaned = raw.images.filter(
      (img: unknown) => typeof img === 'string' && img.trim() !== ''
    );
    if (cleaned.length > 0) return cleaned;
  }

  if (typeof raw.image === 'string' && raw.image.trim() !== '') {
    return [raw.image];
  }

  if (typeof raw.imageUrl === 'string' && raw.imageUrl.trim() !== '') {
    return [raw.imageUrl];
  }

  return [fallbackImage];
}

export function normalizeLocation(raw: any): string {
  return (
    raw.location ??
    (raw.city && raw.island ? `${raw.city}, ${raw.island}` : raw.city) ??
    'Non précisé'
  );
}

function normalizeLocationRentalPeriod(
  value: unknown
): LocationRentalPeriod | undefined {
  if (value === 'month' || value === 'day' || value === 'night' || value === 'hour')
    return value;
  return undefined;
}

function normalizeTerrainPriceBasis(value: unknown): TerrainPriceBasis | undefined {
  if (value === 'per-m2' || value === 'per_m2') return 'per-m2';
  if (value === 'total') return 'total';
  return undefined;
}

function normalizeHouseSaleLevel(value: unknown): HouseSaleLevel | undefined {
  const s = typeof value === 'string' ? value.trim() : '';
  if ((HOUSE_SALE_LEVEL_OPTIONS as readonly string[]).includes(s)) {
    return s as HouseSaleLevel;
  }
  return undefined;
}

function parseHouseRoomCount(value: unknown): number | undefined {
  const n = parsePositiveNumber(value);
  if (n === undefined) return undefined;
  const rounded = Math.round(n);
  return rounded >= 1 ? rounded : undefined;
}

function parsePositiveNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : undefined;
  if (typeof value === 'string') {
    const cleaned = value.replace(',', '.').trim();
    if (!cleaned) return undefined;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }
  return undefined;
}

export function normalizeItem(raw: any): MarketplaceItem {
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    title: raw.title ?? raw.titre ?? raw.name ?? 'Sans titre',
    description: raw.description ?? raw.desc ?? '',
    price: normalizePrice(raw.price ?? raw.prix),
    priceCurrency: normalizePriceCurrency(
      raw.priceCurrency ?? raw.devise ?? raw.currency
    ),
    category: normalizeCategory(raw.category ?? raw.categorie),
    publishCategoryLabel:
      typeof raw.publishCategoryLabel === 'string' &&
      raw.publishCategoryLabel.trim() !== ''
        ? raw.publishCategoryLabel.trim()
        : undefined,
    condition: normalizeCondition(raw.condition ?? raw.etat),
    location: normalizeLocation(raw),
    images: normalizeImages(raw),
    sellerId: raw.sellerId ?? 'unknown',
    sellerName: raw.sellerName ?? raw.ownerName ?? 'Utilisateur',
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt,
    status: raw.status === 'sold' ? 'sold' : 'available',
    phone: raw.phone ?? raw.telephone ?? raw.numero ?? undefined,
    contactPhone: (() => {
      const explicit =
        typeof raw.contactPhone === 'string' && raw.contactPhone.trim() !== ''
          ? raw.contactPhone.trim()
          : undefined;
      if (explicit) return explicit;
      const pub =
        typeof raw.phone === 'string' && raw.phone.trim() !== ''
          ? raw.phone.trim()
          : undefined;
      return pub;
    })(),
    subCategory:
      typeof raw.subCategory === 'string' && raw.subCategory.trim() !== ''
        ? raw.subCategory.trim()
        : undefined,
    subSubCategory:
      typeof raw.subSubCategory === 'string' && raw.subSubCategory.trim() !== ''
        ? raw.subSubCategory.trim()
        : undefined,
    terrainSetting:
      raw.terrainSetting === 'Campagne' || raw.terrainSetting === 'Ville'
        ? raw.terrainSetting
        : undefined,
    terrainAreaMode:
      raw.terrainAreaMode === 'dimensions' || raw.terrainAreaMode === 'm2'
        ? raw.terrainAreaMode
        : undefined,
    terrainLengthM: parsePositiveNumber(raw.terrainLengthM),
    terrainWidthM: parsePositiveNumber(raw.terrainWidthM),
    terrainAreaM2: parsePositiveNumber(raw.terrainAreaM2),
    terrainPriceBasis: normalizeTerrainPriceBasis(raw.terrainPriceBasis),
    locationRentalPeriod: normalizeLocationRentalPeriod(
      raw.locationRentalPeriod
    ),
    houseLengthM: parsePositiveNumber(raw.houseLengthM),
    houseWidthM: parsePositiveNumber(raw.houseWidthM),
    houseRoomCount: parseHouseRoomCount(raw.houseRoomCount),
    houseLevels: normalizeHouseSaleLevel(raw.houseLevels),
    houseAreaM2: parsePositiveNumber(raw.houseAreaM2),
    isFeatured: raw.isFeatured === true,
    featuredUntil:
      typeof raw.featuredUntil === 'string' && raw.featuredUntil.trim() !== ''
        ? raw.featuredUntil
        : undefined,
    boostRequestedAt:
      typeof raw.boostRequestedAt === 'string' && raw.boostRequestedAt.trim() !== ''
        ? raw.boostRequestedAt
        : undefined,
    sellerType: raw.sellerType === 'pro' ? 'pro' : 'standard',
    ...(() => {
      const sold = raw.status === 'sold';
      const bid =
        sold &&
        typeof raw.buyerId === 'string' &&
        raw.buyerId.trim() !== ''
          ? raw.buyerId.trim()
          : undefined;
      const bname =
        sold &&
        typeof raw.buyerName === 'string' &&
        raw.buyerName.trim() !== ''
          ? raw.buyerName.trim().slice(0, 120)
          : undefined;
      return bid
        ? { buyerId: bid, buyerName: bname ?? 'Acheteur' }
        : {};
    })(),
  };
}