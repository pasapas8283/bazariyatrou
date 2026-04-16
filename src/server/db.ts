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
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
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

async function readSupabaseDb(): Promise<DbShape> {
  const baseUrl = SUPABASE_URL as string;
  const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY as string;
  const url = `${baseUrl}/rest/v1/${encodeURIComponent(
    SUPABASE_TABLE
  )}?id=eq.${SUPABASE_STATE_ID}&select=data`;

  const res = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  });

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

async function writeSupabaseDb(next: DbShape) {
  const baseUrl = SUPABASE_URL as string;
  const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY as string;
  const url = `${baseUrl}/rest/v1/${encodeURIComponent(
    SUPABASE_TABLE
  )}?on_conflict=id`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([{ id: SUPABASE_STATE_ID, data: next }]),
  });

  if (!res.ok) {
    throw new Error(`Supabase write failed (${res.status})`);
  }
}

export async function readDb(): Promise<DbShape> {
  if (isSupabaseEnabled()) {
    return readSupabaseDb();
  }

  await ensureDbFile();
  try {
    const raw = await fs.readFile(activeDbFile, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    return normalizeDbShape(parsed);
  } catch {
    return { ...defaultDb };
  }
}

export async function writeDb(next: DbShape) {
  if (isSupabaseEnabled()) {
    await writeSupabaseDb(next);
    return;
  }

  await ensureDbFile();
  await fs.writeFile(activeDbFile, JSON.stringify(next, null, 2), 'utf-8');
}
