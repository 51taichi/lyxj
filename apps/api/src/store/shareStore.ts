import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { QuoteSharePayload, QuoteShareSnapshot } from '../types.js';

const SHARES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/shares');
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function ensureSharesDir(): void {
  fs.mkdirSync(SHARES_DIR, { recursive: true });
}

function generateId(): string {
  return crypto.randomBytes(6).toString('base64url');
}

function sharePath(id: string): string {
  return path.join(SHARES_DIR, `${id}.json`);
}

function isExpired(snapshot: QuoteShareSnapshot): boolean {
  return new Date(snapshot.expiresAt).getTime() <= Date.now();
}

export function createShare(payload: QuoteSharePayload): QuoteShareSnapshot {
  ensureSharesDir();
  const id = generateId();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  const snapshot: QuoteShareSnapshot = { ...payload, id, createdAt, expiresAt };
  fs.writeFileSync(sharePath(id), JSON.stringify(snapshot, null, 2), 'utf8');
  return snapshot;
}

export function getShare(id: string): QuoteShareSnapshot | null {
  const file = sharePath(id);
  if (!fs.existsSync(file)) return null;
  const snapshot = JSON.parse(fs.readFileSync(file, 'utf8')) as QuoteShareSnapshot;
  if (isExpired(snapshot)) {
    fs.unlinkSync(file);
    return null;
  }
  return snapshot;
}
