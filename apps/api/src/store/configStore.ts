import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInitialConfig, defaultAgencies } from '../data/seed.js';
import type { Agency, Dimension, PricePeriod, SystemConfig } from '../types.js';
import { syncVehicleOptionsWithNeeds } from '../utils/vehicleNeeds.js';

const CONFIG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/config.json');

let cache: SystemConfig | null = null;

function ensureConfigFile(): SystemConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    const initial = buildInitialConfig();
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as SystemConfig;
  return migrateConfig(raw);
}

/** 兼容旧版 config：移除独立 ticketTypes 维度，通票并入景点 passAddon */
function migrateConfig(raw: SystemConfig & { mealAllowance?: number; mealAllowancePerPerson?: number; agencies?: unknown }): SystemConfig {
  const fallback = buildInitialConfig();
  let dimensions = raw.dimensions?.length ? raw.dimensions : fallback.dimensions;

  const ticketTypes = dimensions.find((d) => d.id === 'ticketTypes');
  const attractions = dimensions.find((d) => d.id === 'attractions');
  if (ticketTypes?.options && attractions?.options) {
    for (const pass of ticketTypes.options) {
      const linked = pass.linkedAttraction;
      const addon = pass.priceFields.addon ?? 0;
      const spot = attractions.options.find(
        (o) => o.name === linked || o.id === linked || pass.name.includes(o.name.replace('大门', '')),
      );
      if (spot && addon > 0) {
        spot.priceFields.passAddon = addon;
      }
    }
  }
  dimensions = dimensions.filter((d) => d.id !== 'ticketTypes');

  for (const dim of dimensions) {
    if (dim.id === 'attractions' && dim.type !== 'multi_select') {
      dim.type = 'multi_select';
    }
  }

  const migrated: SystemConfig = {
    dimensions,
    mealAllowancePerPersonDay:
      raw.mealAllowancePerPersonDay ?? raw.mealAllowancePerPerson ?? raw.mealAllowance ?? fallback.mealAllowancePerPersonDay,
    formulaNote: raw.formulaNote ?? fallback.formulaNote,
    agencies: Array.isArray(raw.agencies) && raw.agencies.length ? raw.agencies : fallback.agencies,
    pricePeriods: Array.isArray(raw.pricePeriods) ? raw.pricePeriods : fallback.pricePeriods,
  };

  const vehicleDim = migrated.dimensions.find((d) => d.id === 'vehicle');
  const vehicleNeedsDim = migrated.dimensions.find((d) => d.id === 'vehicleNeeds');
  syncVehicleOptionsWithNeeds(vehicleDim, vehicleNeedsDim);

  if (JSON.stringify(migrated) !== JSON.stringify(raw)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(migrated, null, 2), 'utf8');
  }

  return migrated;
}

export function loadConfig(): SystemConfig {
  if (!cache) cache = ensureConfigFile();
  return cache;
}

export function saveConfig(config: SystemConfig): SystemConfig {
  const dimensions = config.dimensions.map((d) => ({ ...d, options: d.options?.map((o) => ({ ...o })) }));
  const vehicleDim = dimensions.find((d) => d.id === 'vehicle');
  const vehicleNeedsDim = dimensions.find((d) => d.id === 'vehicleNeeds');
  syncVehicleOptionsWithNeeds(vehicleDim, vehicleNeedsDim);

  cache = {
    dimensions,
    mealAllowancePerPersonDay: config.mealAllowancePerPersonDay ?? 0,
    formulaNote: config.formulaNote,
    agencies: (config.agencies ?? defaultAgencies).map((a) => ({ ...a })),
    pricePeriods: (config.pricePeriods ?? []).map((p) => ({
      ...p,
      overrides: p.overrides?.map((o) => ({ ...o, priceFields: { ...o.priceFields } })) ?? [],
    })),
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cache, null, 2), 'utf8');
  return cache;
}

export function getDimensions(): Dimension[] {
  return loadConfig().dimensions.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getMealAllowancePerPersonDay(): number {
  return loadConfig().mealAllowancePerPersonDay;
}

export function getAgencies(): Agency[] {
  return loadConfig().agencies.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPricePeriods(): PricePeriod[] {
  return loadConfig().pricePeriods ?? [];
}

export function resetConfig(): SystemConfig {
  cache = null;
  if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
  return loadConfig();
}
