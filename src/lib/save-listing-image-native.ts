import { Capacitor } from '@capacitor/core';

const ANDROID_APP_ALBUM = 'BazariYatrou';

/** Au‑delà de ~1,5 Mo en base64, certains ponts Capacitor échouent sans erreur visible. */
const MAX_DATA_URL_CHARS_FOR_MEDIA = 2_000_000;

/**
 * Sur Android, `Media.savePhoto` exige `albumIdentifier` (dossier album existant).
 */
async function resolveAndroidAlbumIdentifier(
  Media: typeof import('@capacitor-community/media').Media
): Promise<string | null> {
  if (Capacitor.getPlatform() !== 'android') return null;

  const pickAlbum = (
    albums: import('@capacitor-community/media').MediaAlbum[] | undefined
  ) => {
    if (!albums?.length) return null;
    const preferred = albums.find((a) => {
      const n = (a.name || '').toLowerCase();
      const id = (a.identifier || '').toLowerCase();
      return (
        n.includes('camera') ||
        n.includes('dcim') ||
        n.includes('picture') ||
        id.includes('dcim') ||
        id.includes('camera')
      );
    });
    return (preferred ?? albums[0]).identifier;
  };

  try {
    const { albums } = await Media.getAlbums();
    const id = pickAlbum(albums);
    if (id) return id;
  } catch {
    /* ignore */
  }

  try {
    await Media.createAlbum({ name: ANDROID_APP_ALBUM });
  } catch {
    /* déjà créé ou refus */
  }

  try {
    const { albums } = await Media.getAlbums();
    const ours = albums?.find(
      (a) => (a.name || '').toLowerCase() === ANDROID_APP_ALBUM.toLowerCase()
    );
    const id = ours?.identifier ?? pickAlbum(albums);
    if (id) return id;
  } catch {
    /* ignore */
  }

  try {
    const { path } = await Media.getAlbumsPath();
    if (path) {
      const base = path.replace(/[/\\]+$/, '');
      return `${base}/${ANDROID_APP_ALBUM}`;
    }
  } catch {
    /* ignore */
  }

  return null;
}

/** Résolution d’URL pour fetch dans le WebView (chemins relatifs → absolus). */
export function resolveListingImageUrl(src: string): string {
  if (typeof window === 'undefined') return src;
  if (!src) return src;
  const s = src.trim();
  if (/^(https?:|data:|blob:)/i.test(s)) return s;
  if (s.startsWith('//')) return `${window.location.protocol}${s}`;
  try {
    return new URL(s, window.location.origin).href;
  } catch {
    return s;
  }
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('read'));
    r.readAsDataURL(blob);
  });
}

export function extFromDataUrl(dataUrl: string): string {
  const m = /^data:image\/(png|webp|gif|jpeg|jpg)/i.exec(dataUrl);
  if (!m) return 'jpg';
  const t = m[1].toLowerCase();
  return t === 'jpeg' ? 'jpg' : t;
}

export function extFromImagePathOrUrl(src: string): string {
  const path = src.split('?')[0]?.toLowerCase() ?? '';
  if (path.endsWith('.png')) return 'png';
  if (path.endsWith('.webp')) return 'webp';
  if (path.endsWith('.gif')) return 'gif';
  if (path.endsWith('.jpeg') || path.endsWith('.jpg')) return 'jpg';
  return 'jpg';
}

/**
 * Charge l’image en Blob (data:, http(s):, chemins relatifs).
 * `fetch` gère correctement les data URL dans le WebView.
 */
export async function fetchListingImageAsBlob(
  resolved: string
): Promise<Blob | null> {
  if (!resolved) return null;
  try {
    const res = await fetch(resolved, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return blob.size > 0 ? blob : null;
  } catch {
    return null;
  }
}

/**
 * Lit l’image puis renvoie une data URL (pour le plugin Media).
 */
export async function fetchImageAsDataUrl(resolved: string): Promise<string | null> {
  if (resolved.startsWith('data:')) return resolved;
  const blob = await fetchListingImageAsBlob(resolved);
  if (!blob) return null;
  return blobToDataUrl(blob);
}

export type SaveListingImageResult =
  | { ok: true }
  | { ok: false; reason: string };

async function saveListingImageToGalleryInner(
  pathForMedia: string,
  fileStem: string
): Promise<SaveListingImageResult> {
  const { Media } = await import('@capacitor-community/media');

  if (Capacitor.getPlatform() === 'android') {
    const albumIdentifier = await resolveAndroidAlbumIdentifier(Media);
    if (!albumIdentifier) {
      return {
        ok: false,
        reason:
          'Aucun album photo disponible sur l’appareil. Créez au moins un dossier dans la galerie ou réessayez après avoir pris une photo.',
      };
    }
    try {
      await Media.savePhoto({
        path: pathForMedia,
        fileName: fileStem,
        albumIdentifier,
      });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        ok: false,
        reason: msg || 'Échec de l’enregistrement dans la galerie (plugin Media).',
      };
    }
  }

  try {
    await Media.savePhoto({
      path: pathForMedia,
      fileName: fileStem,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: msg || 'Échec Media.savePhoto.' };
  }
}

/**
 * Enregistre une photo d’annonce dans la galerie (app native).
 * Retourne le détail d’erreur pour affichage utilisateur.
 */
export async function saveListingImageToGallery(
  resolved: string,
  fileNameBase: string
): Promise<SaveListingImageResult> {
  if (!Capacitor.isNativePlatform()) {
    return { ok: false, reason: 'Réservé à l’application mobile.' };
  }

  const fileStem = fileNameBase.replace(/\.[a-z0-9]+$/i, '');

  let pathForMedia = await fetchImageAsDataUrl(resolved);
  if (!pathForMedia && /^https?:\/\//i.test(resolved)) {
    pathForMedia = resolved;
  }
  if (!pathForMedia) {
    return {
      ok: false,
      reason: 'Impossible de lire l’image (réseau ou format).',
    };
  }

  if (
    pathForMedia.startsWith('data:') &&
    pathForMedia.length > MAX_DATA_URL_CHARS_FOR_MEDIA
  ) {
    return {
      ok: false,
      reason: 'Image trop lourde pour l’enregistrement direct. Utilisez « Partager » pour l’enregistrer.',
    };
  }

  return saveListingImageToGalleryInner(pathForMedia, fileStem);
}

/**
 * Même chose à partir d’un Blob déjà chargé (évite un double fetch).
 */
export async function saveListingImageBlobToGallery(
  blob: Blob,
  fileNameBase: string
): Promise<SaveListingImageResult> {
  if (!Capacitor.isNativePlatform()) {
    return { ok: false, reason: 'Réservé à l’application mobile.' };
  }
  const fileStem = fileNameBase.replace(/\.[a-z0-9]+$/i, '');
  let dataUrl: string;
  try {
    dataUrl = await blobToDataUrl(blob);
  } catch {
    return { ok: false, reason: 'Impossible de convertir l’image.' };
  }
  if (dataUrl.length > MAX_DATA_URL_CHARS_FOR_MEDIA) {
    return {
      ok: false,
      reason: 'Image trop lourde pour l’enregistrement direct. Utilisez « Partager ».',
    };
  }
  return saveListingImageToGalleryInner(dataUrl, fileStem);
}
