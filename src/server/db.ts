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

const DB_FILE = process.env.BZY_DB_FILE?.trim()
  ? path.resolve(process.cwd(), process.env.BZY_DB_FILE.trim())
  : path.join(process.cwd(), '.data', 'bazariyatrou-db.json');

const defaultDb: DbShape = {
  users: [],
  listings: [],
  conversations: [],
  transactionFeedback: [],
};

async function ensureDbFile() {
  const dir = path.dirname(DB_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
  }
}

export async function readDb(): Promise<DbShape> {
  await ensureDbFile();
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed?.users) ? parsed.users : [],
      listings: Array.isArray(parsed?.listings) ? parsed.listings : [],
      conversations: Array.isArray(parsed?.conversations) ? parsed.conversations : [],
      transactionFeedback: Array.isArray(parsed?.transactionFeedback)
        ? parsed.transactionFeedback
        : [],
    };
  } catch {
    return { ...defaultDb };
  }
}

export async function writeDb(next: DbShape) {
  await ensureDbFile();
  await fs.writeFile(DB_FILE, JSON.stringify(next, null, 2), 'utf-8');
}
