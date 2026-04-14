import type { ItemCategory, LocationRentalPeriod } from '../types/marketplace';

export const MODE_SUBCATEGORIES = ['Homme', 'Femme'] as const;
export const MODE_SUBSUBCATEGORIES = ['Adulte', 'Enfant'] as const;
export const LOCATION_SUBCATEGORIES = ['Maison', 'Voiture', 'Autre'] as const;
export const SERVICES_SUBCATEGORIES = [
  'Livraison',
  'Cours',
  'Commision',
  'Autre',
] as const;

export function supportsModeSubcategories(category: ItemCategory) {
  return category === 'mode';
}

export function supportsSubcategories(category: ItemCategory) {
  return category === 'mode' || category === 'location' || category === 'services';
}

export function supportsSecondLevelSubcategories(category: ItemCategory) {
  return category === 'mode';
}

export function getSubCategoryOptions(category: ItemCategory): readonly string[] {
  if (category === 'mode') return MODE_SUBCATEGORIES;
  if (category === 'location') return LOCATION_SUBCATEGORIES;
  if (category === 'services') return SERVICES_SUBCATEGORIES;
  return [];
}

/** Options du menu « période » à côté du prix (publication location). */
export function getLocationRentalPeriodOptionsForSub(
  subCategory: string
): { value: LocationRentalPeriod; label: string }[] | null {
  const s = subCategory.trim().toLowerCase();
  if (s === 'maison') {
    return [
      { value: 'month', label: 'Le mois' },
      { value: 'day', label: 'La journée' },
      { value: 'night', label: 'La nuit' },
    ];
  }
  if (s === 'voiture' || s === 'vehicule' || s === 'véhicule') {
    return [
      { value: 'month', label: 'Le mois' },
      { value: 'day', label: 'La journée' },
      { value: 'hour', label: "L'heure" },
    ];
  }
  return null;
}

export function allowedLocationRentalPeriodsForSub(
  subCategory: string
): LocationRentalPeriod[] {
  const opts = getLocationRentalPeriodOptionsForSub(subCategory);
  return opts ? opts.map((o) => o.value) : [];
}
