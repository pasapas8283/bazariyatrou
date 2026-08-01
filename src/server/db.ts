import { promises as fs } from 'fs';
import path from 'path';
import type { MarketplaceItem } from '../types/marketplace';
import type { TransactionFeedbackEntry } from '../types/transaction-feedback';
import type { Conversation } from '../lib/messages-storage';

export type DbUser = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  passwordHash: string;
  avatar?: string;
  createdAt: string;
};

type DbShape = {
  users: DbUser[];
  listings: MarketplaceItem[];
  conversations: Conversation[];
  transactionFeedback: TransactionFeedbackEntry[];
};

const FALLBACK_DB_FILE = path.join(process.cwd(), '.data', 'bazariyatrou-db.json');
const CONFIGURED_DB_FILE = process.env.BZY_DB_FILE?.trim()
  ? path.resolve(process.cwd(), process.env.BZY_DB_FILE.trim())
  : FALLBACK_DB_FILE;
let activeDbFile = CONFIGURED_DB_FILE;
const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const SUPABASE_TABLE = process.env.SUPABASE_STATE_TABLE?.trim() || 'app_state';
const SUPABASE_STATE_ID = 1;

const defaultDb: DbShape = {
  users: [],
  listings: [],
  conversations: [],
  transactionFeedback: [],
};

async function ensureDbFileAt(filePath: string) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultDb, null, 2), 'utf-8');
  }
}

async function ensureDbFile() {
  try {
    await ensureDbFileAt(activeDbFile);
  } catch {
    // Some hosts (Render free build) cannot create absolute paths like /var/data.
    // Fall back to a writable project-local file to avoid build-time crashes.
    activeDbFile = FALLBACK_DB_FILE;
    await ensureDbFileAt(activeDbFile);
  }
}

function isSupabaseEnabled() {
  return Boolean(normalizeSupabaseUrl() && SUPABASE_SERVICE_ROLE_KEY);
}

/** Accepte URL projet seule, avec slash final, ou déjà suffixée /rest/v1. */
function normalizeSupabaseUrl(): string {
  const raw = (SUPABASE_URL || '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  return raw.replace(/\/rest\/v1$/i, '');
}

function supabaseRestUrl(pathAndQuery: string): string {
  const base = normalizeSupabaseUrl();
  const suffix = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`;
  return `${base}/rest/v1${suffix}`;
}

function normalizeDbShape(parsed: unknown): DbShape {
  const source = parsed as Partial<DbShape> | null | undefined;
  return {
    users: Array.isArray(source?.users) ? source.users : [],
    listings: Array.isArray(source?.listings) ? source.listings : [],
    conversations: Array.isArray(source?.conversations) ? source.conversations : [],
    transactionFeedback: Array.isArray(source?.transactionFeedback)
      ? source.transactionFeedback
      : [],
  };
}

async function readFileDb(): Promise<DbShape> {
  await ensureDbFile();
  try {
    const raw = await fs.readFile(activeDbFile, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    return normalizeDbShape(parsed);
  } catch {
    return { ...defaultDb };
  }
}

async function writeFileDb(next: DbShape) {
  await ensureDbFile();
  await fs.writeFile(activeDbFile, JSON.stringify(next, null, 2), 'utf-8');
}

async function readSupabaseDb(): Promise<DbShape> {
  const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY as string;
  const url = supabaseRestUrl(
    `/${encodeURIComponent(SUPABASE_TABLE)}?id=eq.${SUPABASE_STATE_ID}&select=data`
  );

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: 'no-store',
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'fetch failed';
    throw new Error(`Supabase unreachable (${detail})`);
  }

  if (!res.ok) {
    throw new Error(`Supabase read failed (${res.status})`);
  }

  const rows = (await res.json()) as Array<{ data?: unknown }>;
  if (!Array.isArray(rows) || rows.length === 0) {
    // Initialize the single state row when empty.
    await writeSupabaseDb(defaultDb);
    return { ...defaultDb };
  }

  return normalizeDbShape(rows[0]?.data);
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400?text=Annonce';
/** Limite stricte : tout l’état vit dans une seule ligne Supabase. */
const MAX_STORED_DATA_URL_CHARS = 60_000;

function leanImagesForStorage(images: string[] | undefined): string[] {
  const cleaned = (images ?? [])
    .map((img) => (typeof img === 'string' ? img.trim() : ''))
    .filter(Boolean)
    .slice(0, 4)
    .map((img) => {
      if (img.startsWith('blob:')) return PLACEHOLDER_IMAGE;
      if (img.startsWith('data:') && img.length > MAX_STORED_DATA_URL_CHARS) {
        return PLACEHOLDER_IMAGE;
      }
      return img;
    })
    // Une seule data URL max par annonce pour éviter le 400 PostgREST.
    .reduce<string[]>((acc, img) => {
      if (img.startsWith('data:') && acc.some((x) => x.startsWith('data:'))) {
        return acc;
      }
      acc.push(img);
      return acc;
    }, []);

  return cleaned.length > 0 ? cleaned : [PLACEHOLDER_IMAGE];
}

/** Réduit le JSON avant écriture (évite code 400 / payload trop gros). */
function leanDbForStorage(db: DbShape): DbShape {
  return {
    users: db.users.map((user) => ({
      ...user,
      avatar:
        typeof user.avatar === 'string' &&
        user.avatar.startsWith('data:') &&
        user.avatar.length > 20_000
          ? undefined
          : user.avatar,
    })),
    listings: db.listings.map((item) => ({
      ...item,
      images: leanImagesForStorage(item.images),
    })),
    conversations: db.conversations,
    transactionFeedback: db.transactionFeedback,
  };
}

async function writeSupabaseDb(next: DbShape) {
  const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY as string;
  const url = supabaseRestUrl(
    `/${encodeURIComponent(SUPABASE_TABLE)}?on_conflict=id`
  );

  const payload = leanDbForStorage(next);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([{ id: SUPABASE_STATE_ID, data: payload }]),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'fetch failed';
    throw new Error(`Supabase unreachable (${detail})`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `Supabase write failed (${res.status})${
        detail ? `: ${detail.slice(0, 180)}` : ''
      }`
    );
  }
}

export async function probeStorage(): Promise<{
  supabaseConfigured: boolean;
  supabaseOk: boolean;
  supabaseError?: string;
  storage: 'supabase' | 'file';
  dbFile: string;
}> {
  const supabaseConfigured = isSupabaseEnabled();
  if (!supabaseConfigured) {
    await ensureDbFile();
    return {
      supabaseConfigured: false,
      supabaseOk: false,
      storage: 'file',
      dbFile: activeDbFile,
    };
  }

  try {
    await readSupabaseDb();
    return {
      supabaseConfigured: true,
      supabaseOk: true,
      storage: 'supabase',
      dbFile: activeDbFile,
    };
  } catch (error) {
    await ensureDbFile();
    return {
      supabaseConfigured: true,
      supabaseOk: false,
      supabaseError:
        error instanceof Error ? error.message : 'Supabase unavailable',
      storage: 'file',
      dbFile: activeDbFile,
    };
  }
}

export async function readDb(): Promise<DbShape> {
  if (isSupabaseEnabled()) {
    try {
      return await readSupabaseDb();
    } catch {
      // Supabase down / paused → fichier local sur l’instance Render.
      return await readFileDb();
    }
  }

  return await readFileDb();
}

export async function writeDb(next: DbShape) {
  const payload = leanDbForStorage(next);
  if (isSupabaseEnabled()) {
    try {
      await writeSupabaseDb(payload);
      try {
        await writeFileDb(payload);
      } catch {
        /* miroir fichier optionnel */
      }
      return;
    } catch (firstError) {
      const stripped: DbShape = {
        ...payload,
        listings: payload.listings.map((item) => ({
          ...item,
          images: [PLACEHOLDER_IMAGE],
        })),
        users: payload.users.map((user) => ({
          ...user,
          avatar: user.avatar?.startsWith('data:') ? undefined : user.avatar,
        })),
      };
      try {
        await writeSupabaseDb(stripped);
        try {
          await writeFileDb(stripped);
        } catch {
          /* ignore */
        }
        return;
      } catch {
        // Fallback fichier : permet A→B tant que l’instance Render reste chaude.
        try {
          await writeFileDb(payload);
          return;
        } catch {
          throw firstError;
        }
      }
    }
  }

  await writeFileDb(payload);
}
