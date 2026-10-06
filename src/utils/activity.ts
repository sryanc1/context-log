// src/utils/activity.ts
import type { Item } from '../types/items';

export function getLastActivity(items: Item[], fallback: number): number {
  const timestamps = items.map((i) => i.updatedAt);
  return timestamps.length ? Math.max(...timestamps) : fallback;
}