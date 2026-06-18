import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const EXPORT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/exports');

function imagePath(id: string): string {
  return path.join(EXPORT_DIR, `${id}.png`);
}

export function readCachedExportImage(id: string): Buffer | null {
  const file = imagePath(id);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file);
}

export function writeCachedExportImage(id: string, png: Buffer): void {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  fs.writeFileSync(imagePath(id), png);
}
