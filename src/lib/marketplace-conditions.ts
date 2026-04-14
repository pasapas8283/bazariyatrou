import type { ItemCondition } from '../types/marketplace';

export type MarketplaceConditionConfig = {
  value: ItemCondition;
  label: string;
  badgeClass: string;
  publishLabels: string[];
  keywords?: string[];
};

export const MARKETPLACE_CONDITIONS: MarketplaceConditionConfig[] = [
  {
    value: 'new',
    label: 'Neuf',
    badgeClass: 'bg-green-100 text-green-700',
    publishLabels: ['Neuf'],
    keywords: ['neuf'],
  },
  {
    value: 'like-new',
    label: 'Très bon état',
    badgeClass: 'bg-blue-100 text-blue-700',
    publishLabels: ['Comme neuf', 'Très bon état'],
    keywords: ['comme neuf', 'très bon', 'tres bon'],
  },
  {
    value: 'good',
    label: 'Bon état',
    badgeClass: 'bg-yellow-100 text-yellow-700',
    publishLabels: ['Bon état'],
    keywords: ['bon état', 'bon'],
  },
  {
    value: 'fair',
    label: 'État correct',
    badgeClass: 'bg-orange-100 text-orange-700',
    publishLabels: ['État correct'],
    keywords: ['état correct', 'etat correct', 'moyen', 'correct'],
  },
];

export function getConditionLabel(value: ItemCondition): string {
  return (
    MARKETPLACE_CONDITIONS.find((condition) => condition.value === value)
      ?.label ?? 'Bon état'
  );
}

export function getConditionBadgeClass(value?: string): string {
  const found = MARKETPLACE_CONDITIONS.find(
    (condition) => condition.label === value
  );

  return found?.badgeClass ?? 'bg-gray-100 text-gray-600';
}

export function getConditionFromPublishLabel(label: string): ItemCondition {
  const normalized = label.trim().toLowerCase();

  const found = MARKETPLACE_CONDITIONS.find((condition) =>
    condition.publishLabels.some(
      (publishLabel) => publishLabel.toLowerCase() === normalized
    )
  );

  return found?.value ?? 'good';
}

export function getConditionFromUnknown(value: unknown): ItemCondition {
  const normalized = String(value ?? '').trim().toLowerCase();

  const exact = MARKETPLACE_CONDITIONS.find(
    (condition) => condition.value === normalized
  );
  if (exact) return exact.value;

  const byPublishLabel = MARKETPLACE_CONDITIONS.find((condition) =>
    condition.publishLabels.some(
      (publishLabel) => publishLabel.toLowerCase() === normalized
    )
  );
  if (byPublishLabel) return byPublishLabel.value;

  const byKeyword = MARKETPLACE_CONDITIONS.find((condition) =>
    (condition.keywords ?? []).some((keyword) =>
      normalized.includes(keyword)
    )
  );
  if (byKeyword) return byKeyword.value;

  return 'good';
}

export function getPublishConditionOptions(): string[] {
  return MARKETPLACE_CONDITIONS.flatMap((condition) => condition.publishLabels);
}