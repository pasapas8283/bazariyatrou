import type { ItemCategory } from '../types/marketplace';

export type MarketplaceCategoryConfig = {
  value: ItemCategory;
  label: string;
  icon: string;
  publishLabels: string[];
  keywords?: string[];
};

/** Anciens libellés retirés du formulaire mais encore possibles en données. */
const LEGACY_PUBLISH_LABEL_TO_CATEGORY: Record<string, ItemCategory> = {
  'sport & loisirs': 'sport-loisirs',
  'beauté & santé': 'beaute-sante',
  'beauté & sante': 'beaute-sante',
  locations: 'maison',
  'location voiture': 'location',
  'location maison': 'location',
};

const PUBLISH_LABEL_ICONS: Record<string, string> = {
  électronique: '📱',
  telephones: '📞',
  téléphones: '📞',
  tv: '📺',
  audio: '🎧',
  informatique: '💻',
  ordinateurs: '🖥️',
  tablettes: '📱',
  'accessoires it': '⌨️',
  meubles: '🛋️',
  location: '🔑',
  'vente maison': '🏠',
  terrain: '🌿',
  vêtements: '👕',
  vetements: '👕',
  bijoux: '💍',
  velo: '🚲',
  motos: '🏍️',
  voitures: '🚗',
  'pièces auto': '🧰',
  'pieces auto': '🧰',
  sport: '⚽',
  loisirs: '🎮',
  beauté: '💄',
  beaute: '💄',
  santé: '🩺',
  sante: '🩺',
  animaux: '🐾',
  services: '🛠️',
  emploi: '💼',
};

export const MARKETPLACE_CATEGORIES: MarketplaceCategoryConfig[] = [
  {
    value: 'electronique',
    label: 'Électronique',
    icon: '📱',
    publishLabels: ['Électronique', 'Téléphones', 'TV', 'Audio'],
    keywords: ['telephone', 'téléphone', 'electronique', 'électronique', 'tv', 'audio'],
  },
  {
    value: 'informatique',
    label: 'Informatique',
    icon: '💻',
    publishLabels: ['Informatique', 'Ordinateurs', 'Tablettes', 'Accessoires IT'],
    keywords: ['informatique', 'ordinateur', 'pc', 'laptop', 'tablette', 'imprimante'],
  },
  {
    value: 'maison',
    label: 'Maison',
    icon: '🏠',
    publishLabels: ['Meubles'],
    keywords: ['maison', 'meuble', 'location'],
  },
  {
    value: 'location',
    label: 'Location',
    icon: '🔑',
    publishLabels: ['Location'],
    keywords: ['location', 'louer', 'locatif', 'bail'],
  },
  {
    value: 'immobilier',
    label: 'Immobilier',
    icon: '🏘️',
    publishLabels: ['Vente maison', 'Terrain'],
    keywords: ['immobilier', 'maison', 'appartement', 'terrain', 'location'],
  },
  {
    value: 'mode',
    label: 'Vêtements',
    icon: '👕',
    publishLabels: ['Vêtements', 'Bijoux'],
    keywords: ['mode', 'vetement', 'vêtement', 'bijou'],
  },
  {
    value: 'vehicule',
    label: 'Véhicules',
    icon: '🚗',
    publishLabels: ['Velo', 'Voitures', 'Motos', 'Pièces auto'],
    keywords: ['vehicule', 'véhicule', 'voiture', 'moto', 'scooter', 'auto'],
  },
  {
    value: 'sport-loisirs',
    label: 'Sport & Loisirs',
    icon: '⚽',
    publishLabels: ['Sport', 'Loisirs'],
    keywords: ['sport', 'loisir', 'fitness', 'velo', 'vélo', 'camping'],
  },
  {
    value: 'beaute-sante',
    label: 'Beauté & Santé',
    icon: '💄',
    publishLabels: ['Beauté', 'Santé'],
    keywords: ['beaute', 'beauté', 'sante', 'santé', 'cosmetique', 'cosmétique'],
  },
  {
    value: 'animaux',
    label: 'Animaux',
    icon: '🐾',
    publishLabels: ['Animaux'],
    keywords: ['animal', 'chien', 'chat', 'oiseau', 'poisson'],
  },
  {
    value: 'services',
    label: 'Services',
    icon: '🛠️',
    publishLabels: ['Services'],
    keywords: ['service', 'réparation', 'reparation', 'livraison', 'cours'],
  },
  {
    value: 'emploi',
    label: 'Emploi',
    icon: '💼',
    publishLabels: ['Emploi'],
    keywords: ['emploi', 'travail', 'job'],
  },
  {
    value: 'autre',
    label: 'Catégories',
    icon: '🛍️',
    publishLabels: [],
    keywords: [],
  },
];

export const HOME_CATEGORIES = [
  { label: 'Tous', icon: '🛍️' },
  ...getPublishCategoryOptions().map((label) => ({
    label,
    icon:
      PUBLISH_LABEL_ICONS[label.trim().toLowerCase()] ??
      getCategoryIcon(getCategoryFromPublishLabel(label)),
  })),
];

export function getCategoryLabel(value: ItemCategory): string {
  return (
    MARKETPLACE_CATEGORIES.find((cat) => cat.value === value)?.label ??
    'Catégories'
  );
}

export function getCategoryIcon(value: ItemCategory): string {
  return (
    MARKETPLACE_CATEGORIES.find((cat) => cat.value === value)?.icon ?? '🛍️'
  );
}

export function getCategoryFromPublishLabel(label: string): ItemCategory {
  const normalized = label.trim().toLowerCase();

  const found = MARKETPLACE_CATEGORIES.find((cat) =>
    cat.publishLabels.some(
      (publishLabel) => publishLabel.toLowerCase() === normalized
    )
  );

  if (found) return found.value;
  const legacy = LEGACY_PUBLISH_LABEL_TO_CATEGORY[normalized];
  if (legacy) return legacy;
  return 'autre';
}

export function getCategoryFromUnknown(value: unknown): ItemCategory {
  const normalized = String(value ?? '').trim().toLowerCase();

  const exact = MARKETPLACE_CATEGORIES.find(
    (cat) => cat.value === normalized
  );
  if (exact) return exact.value;

  const byPublishLabel = MARKETPLACE_CATEGORIES.find((cat) =>
    cat.publishLabels.some(
      (publishLabel) => publishLabel.toLowerCase() === normalized
    )
  );
  if (byPublishLabel) return byPublishLabel.value;

  const legacy = LEGACY_PUBLISH_LABEL_TO_CATEGORY[normalized];
  if (legacy) return legacy;

  const byKeyword = MARKETPLACE_CATEGORIES.find((cat) =>
    (cat.keywords ?? []).some((keyword) => normalized.includes(keyword))
  );
  if (byKeyword) return byKeyword.value;

  return 'autre';
}

export function getPublishCategoryOptions(): string[] {
  const flat = MARKETPLACE_CATEGORIES.flatMap((cat) => cat.publishLabels);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of flat) {
    const key = label.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}