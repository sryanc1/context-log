// src/utils/dueDate.ts

import type { Item } from "../types/items";

const SOON_THRESHOLD_MS = 24*60*60*1000

export type DueUrgency = 'overdue' | 'soon' | null;

export function getDueUrgency(dueDate: number | null): DueUrgency {
    if (dueDate == null) return null;
    const now = Date.now();
    if (dueDate < now ) return 'overdue';
    if (dueDate - now <= SOON_THRESHOLD_MS) return 'soon';
    return null;
}

export function getUrgentItems(items: Item[], archivedProjectIds: Set<string>): Item[] {
    return items 
        .filter((item) => item.status !== 'completed')
        .filter((item) => item.dueDate !== null && ! archivedProjectIds.has(item.containerId ?? ''))
        .filter((item) => getDueUrgency(item.dueDate) !== null)
        .sort((a,b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));
}