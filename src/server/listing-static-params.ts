import { defaultMarketplaceItems } from '../lib/marketplace-default-items';
import { ensureIdParams } from '../lib/static-export-params';
import { readDb } from './db';

/** Segments `[id]` annonces : défauts + base, pour `output: 'export'` / APK (fichiers HTML par id). */
export async function listingPathParams(): Promise<{ id: string }[]> {
  const db = await readDb();
  const ids = new Set<string>();
  for (const item of defaultMarketplaceItems) {
    if (typeof item.id === 'string' && item.id.length > 0) ids.add(item.id);
  }
  for (const l of db.listings) {
    if (typeof l.id === 'string' && l.id.length > 0) ids.add(l.id);
  }
  return ensureIdParams([...ids].map((id) => ({ id })));
}
