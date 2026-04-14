/**
 * Recherche visuelle légère (hash moyen 8×8) entièrement côté client.
 * Les images distantes doivent autoriser CORS (ex. Unsplash) ; data: et blob: OK.
 */

export type ImageSearchCandidate = {
  id: string;
  images: string[];
};

function imageDataToAHash(imageData: ImageData): string {
  const d = imageData.data;
  const pixels: number[] = [];
  for (let i = 0; i < d.length; i += 4) {
    pixels.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
  }
  const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;
  return pixels.map((p) => (p > avg ? '1' : '0')).join('');
}

function hamming(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let dist = 0;
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist + Math.abs(a.length - b.length);
}

async function imageDataFromUrl(url: string): Promise<ImageData | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (!url.startsWith('data:') && !url.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 8;
        c.height = 8;
        const ctx = c.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, 8, 8);
        resolve(ctx.getImageData(0, 0, 8, 8));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function aHashFromUrl(url: string): Promise<string | null> {
  const imageData = await imageDataFromUrl(url);
  if (!imageData) return null;
  return imageDataToAHash(imageData);
}

export async function aHashFromFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    return await aHashFromUrl(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await fn(items[index]);
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

/**
 * Retourne les ids des annonces dont la première image est la plus proche visuellement.
 */
export async function findSimilarListingIds(
  file: File,
  candidates: ImageSearchCandidate[],
  options?: {
    concurrency?: number;
    maxDistance?: number;
  }
): Promise<string[]> {
  const concurrency = options?.concurrency ?? 6;
  const maxDistance = options?.maxDistance ?? 26;

  const queryHash = await aHashFromFile(file);
  if (!queryHash) return [];

  const withUrl = candidates
    .map((c) => ({ id: c.id, url: c.images[0] }))
    .filter((c): c is { id: string; url: string } => Boolean(c.url));

  const scores = await mapPool(withUrl, concurrency, async ({ id, url }) => {
    const h = await aHashFromUrl(url);
    if (!h) return { id, d: 64 };
    return { id, d: hamming(queryHash, h) };
  });

  scores.sort((a, b) => a.d - b.d);
  const best = scores[0]?.d ?? 99;
  if (best > 34) return [];

  const close = scores.filter((s) => s.d <= maxDistance);
  if (close.length > 0) return close.map((s) => s.id);

  return scores.slice(0, 8).map((s) => s.id);
}
