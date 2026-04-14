export type ItemStatus = 'available' | 'sold';

/** Devise d’affichage du prix sur l’annonce */
export type PriceCurrency = 'KMF' | 'EUR';

/** Terrain : prix pour la parcelle entière ou au m² */
export type TerrainPriceBasis = 'total' | 'per-m2';

/** Location : unité de facturation du prix (maison vs véhicule) */
export type LocationRentalPeriod = 'month' | 'day' | 'night' | 'hour';

/** Vente maison : niveaux (rez-de-chaussée à R+10) */
export const HOUSE_SALE_LEVEL_OPTIONS = [
  'R',
  'R+1',
  'R+2',
  'R+3',
  'R+4',
  'R+5',
  'R+6',
  'R+7',
  'R+8',
  'R+9',
  'R+10',
] as const;

export type HouseSaleLevel = (typeof HOUSE_SALE_LEVEL_OPTIONS)[number];

export type ItemCondition = 'new' | 'like-new' | 'good' | 'fair';

export type ItemCategory =
  | 'electronique'
  | 'informatique'
  | 'maison'
  | 'location'
  | 'immobilier'
  | 'mode'
  | 'vehicule'
  | 'sport-loisirs'
  | 'beaute-sante'
  | 'animaux'
  | 'services'
  | 'emploi'
  | 'autre';

export type MarketplaceItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  /** Devise du montant (défaut KMF pour les annonces existantes) */
  priceCurrency?: PriceCurrency;
  category: ItemCategory;
  /** Libellé choisi à la publication (ex. Téléphones, Terrain) pour l’affichage ; optionnel pour les anciennes annonces. */
  publishCategoryLabel?: string;
  condition: ItemCondition;
  location: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  createdAt: string;
  updatedAt?: string;
  status: ItemStatus;
  phone?: string;
  /** Numéro pour messagerie (WhatsApp) même si le téléphone n’est pas affiché publiquement */
  contactPhone?: string;
  subCategory?: string;
  subSubCategory?: string;
  /** Location (Maison / Voiture) : période couverte par le prix affiché */
  locationRentalPeriod?: LocationRentalPeriod;
  terrainSetting?: 'Campagne' | 'Ville';
  terrainAreaMode?: 'dimensions' | 'm2';
  terrainLengthM?: number;
  terrainWidthM?: number;
  terrainAreaM2?: number;
  /** Uniquement terrain : le montant est-il pour tout le terrain ou au m² ? */
  terrainPriceBasis?: TerrainPriceBasis;
  /** Vente maison : dimensions au sol (m), L × l */
  houseLengthM?: number;
  houseWidthM?: number;
  /** Vente maison : nombre de pièces */
  houseRoomCount?: number;
  /** Vente maison : hauteur / nombre de niveaux */
  houseLevels?: HouseSaleLevel;
  houseAreaM2?: number;
  isFeatured?: boolean;
  featuredUntil?: string;
  boostRequestedAt?: string;
  sellerType?: 'standard' | 'pro';
  /** Renseigné quand l’annonce est vendue : acheteur ayant confirmé (pour avis transaction). */
  buyerId?: string;
  buyerName?: string;
};