/**
 * Avec `output: 'export'`, Next exige au moins une entrée dans `generateStaticParams`
 * pour chaque segment dynamique ; un tableau vide est traité comme une config manquante.
 */
export const STATIC_EXPORT_FALLBACK_ID = '__static_export__';

export function ensureIdParams(list: { id: string }[]): { id: string }[] {
  return list.length > 0 ? list : [{ id: STATIC_EXPORT_FALLBACK_ID }];
}
