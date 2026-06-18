import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultAdminUser } from '../data/seed.js';

export interface DbUser {
  id: string;
  username: string;
  password: string;
  role: 'admin';
  name: string;
}

const DB_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/app.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL
    )
  `);
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number };
  if (count.c === 0) {
    const u = defaultAdminUser;
    db.prepare(
      'INSERT INTO users (id, username, password, role, name) VALUES (@id, @username, @password, @role, @name)',
    ).run(u);
  }
  return db;
}

function rowToUser(row: DbUser): DbUser {
  return row;
}

export function findUserByUsername(username: string): DbUser | undefined {
  const row = getDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as DbUser | undefined;
  return row ? rowToUser(row) : undefined;
}

export function findUserById(id: string): DbUser | undefined {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined;
  return row ? rowToUser(row) : undefined;
}

export function updateUserPassword(userId: string, password: string): boolean {
  const result = getDb().prepare('UPDATE users SET password = ? WHERE id = ?').run(password, userId);
  return result.changes > 0;
}

export function verifyUserPassword(user: DbUser, password: string): boolean {
  return user.password === password;
}
