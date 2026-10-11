// In-memory database backed by localStorage so demo entries survive reloads.
import type { Database } from '@/types';
import { DB_VERSION, generateSeed } from './seed';

const KEY = 'rpm-db';
let db: Database | null = null;

function load(): Database {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Database;
      if (parsed.version === DB_VERSION) return parsed;
    }
  } catch {
    // Storage blocked or corrupt: fall back to a fresh seed.
  }
  return generateSeed();
}

export function getDb(): Database {
  if (!db) {
    db = load();
    save();
  }
  return db;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Ignore quota or privacy-mode errors; data stays in memory for this session.
  }
}

export function reset() {
  db = generateSeed();
  save();
}
