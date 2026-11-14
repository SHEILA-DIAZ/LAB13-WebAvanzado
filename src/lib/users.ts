import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

export const MAX_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;
type StoredUser = { id: string; name: string; email: string; password_hash: string; failed_attempts: number; locked_until: number };
let connection: DatabaseSync | undefined;

function database() {
  if (!connection) {
    if (process.env.VERCEL && !process.env.AUTH_DB_PATH) {
      throw new Error("Configura una base persistente antes de desplegar el registro en Vercel.");
    }
    const path = process.env.AUTH_DB_PATH ?? resolve(process.cwd(), "data", "auth.sqlite");
    mkdirSync(dirname(path), { recursive: true });
    connection = new DatabaseSync(path);
    connection.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until INTEGER NOT NULL DEFAULT 0
      );
    `);
  }
  return connection;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validPassword(value: string) {
  return value.length >= 8 && Buffer.byteLength(value, "utf8") <= 72;
}

export async function registerUser(name: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  const db = database();
  const id = randomUUID();
  const result = db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO NOTHING")
    .run(id, name, normalizeEmail(email), passwordHash);
  return result.changes ? { id, name, email: normalizeEmail(email) } : null;
}

// A real bcrypt hash makes unknown accounts follow the same expensive comparison.
const dummyHash = bcrypt.hashSync("not-a-user-password", 12);

export async function authenticateUser(email: string, password: string) {
  const db = database();
  const normalized = normalizeEmail(email);
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalized) as StoredUser | undefined;
  const matches = await bcrypt.compare(password, user?.password_hash ?? dummyHash);
  if (!user) return null;

  // Re-read inside a transaction: simultaneous attempts cannot bypass a lock.
  db.exec("BEGIN IMMEDIATE");
  try {
    const current = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as StoredUser;
    const now = Date.now();
    if (current.locked_until > now) throw new Error("AccountLocked");
    const attempts = current.locked_until > 0 ? 0 : current.failed_attempts;
    if (!matches) {
      const next = attempts + 1;
      db.prepare("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?")
        .run(next, next >= MAX_ATTEMPTS ? now + LOCK_DURATION_MS : 0, user.id);
      db.exec("COMMIT");
      if (next >= MAX_ATTEMPTS) throw new Error("AccountLocked");
      return null;
    }
    db.prepare("UPDATE users SET failed_attempts = 0, locked_until = 0 WHERE id = ?").run(user.id);
    db.exec("COMMIT");
    return { id: current.id, name: current.name, email: current.email };
  } catch (error) {
    // COMMIT may already have persisted the fifth failed attempt.
    try { db.exec("ROLLBACK"); } catch {}
    throw error;
  }
}
