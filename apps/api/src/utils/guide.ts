import type { Dimension, DimensionOption } from '../types.js';

export function isDriverGuideOption(opt: DimensionOption | undefined): boolean {
  if (!opt) return false;
  return opt.id === 'driverGuide' || opt.name.includes('司兼导');
}

export function isDriverGuideSelection(guideKey: string, guideDim: Dimension | undefined): boolean {
  if (!guideKey) return true;
  const opt = guideDim?.options?.find((o) => o.id === guideKey || o.name === guideKey);
  if (opt) return isDriverGuideOption(opt);
  return guideKey === 'driverGuide';
}
