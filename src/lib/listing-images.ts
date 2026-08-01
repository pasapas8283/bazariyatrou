const PLACEHOLDER_MARKERS = ['placehold.co', 'placehold'];

export function isPlaceholderListingImage(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u) return true;
  return PLACEHOLDER_MARKERS.some((marker) => u.includes(marker));
}

export function hasRealListingImages(images: string[]): boolean {
  return images.some((img) => {
    const s = img.trim();
    if (!s || isPlaceholderListingImage(s)) return false;
    return (
      s.startsWith('data:') ||
      s.startsWith('blob:') ||
      s.startsWith('http://') ||
      s.startsWith('https://')
    );
  });
}

/** Garde les vraies photos (souvent locales) plutôt que les placeholders API. */
export function mergeListingImages(a: string[], b: string[]): string[] {
  const aReal = hasRealListingImages(a);
  const bReal = hasRealListingImages(b);
  if (aReal && !bReal) return a;
  if (bReal && !aReal) return b;
  if (aReal && bReal) return a.length >= b.length ? a : b;
  return a.length > 0 ? a : b;
}

const MAX_API_IMAGE_CHARS = 80_000;
const MAX_API_IMAGES = 2;

/** Compresse une data URL pour tenir dans l’API (autres téléphones). */
export async function compressListingImageForApi(
  dataUrl: string,
  maxChars = MAX_API_IMAGE_CHARS
): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) return dataUrl;
  if (dataUrl.length <= maxChars) return dataUrl;
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      const maxDim = 1280;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.72;
      let out = canvas.toDataURL('image/jpeg', quality);
      while (out.length > maxChars && quality > 0.28) {
        quality -= 0.08;
        out = canvas.toDataURL('image/jpeg', quality);
      }
      if (out.length > maxChars) {
        const scale = Math.sqrt(maxChars / out.length);
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        out = canvas.toDataURL('image/jpeg', 0.55);
      }
      resolve(
        out.length <= maxChars
          ? out
          : 'https://placehold.co/600x400?text=Photo'
      );
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function prepareListingImagesForApi(
  images: string[]
): Promise<string[]> {
  const cleaned = images.map((img) => img.trim()).filter(Boolean).slice(0, MAX_API_IMAGES);
  const prepared: string[] = [];
  for (const img of cleaned) {
    if (img.startsWith('data:image/')) {
      prepared.push(await compressListingImageForApi(img));
    } else if (!img.startsWith('blob:')) {
      prepared.push(img);
    }
  }
  return prepared.length > 0
    ? prepared
    : ['https://placehold.co/600x400?text=Annonce'];
}
