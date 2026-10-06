// src/utils/dueDate.ts

import type { Item } from "../types/items";

const SOON_THRESHOLD_MS = 24*60*60*1000
const PRIORITY_RANK: Record <string, number> = {high: 0, medium: 1, low: 2}

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

export function getTodayItems(items: Item[], archivedProjectsIds: Set<string>) : Item[] {
    return items
        .filter((item)=> item.status !== "completed" && !archivedProjectsIds.has(item.containerId ?? ''))
        .sort((a,b) => {
            const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
            if (priorityDiff !==0) return priorityDiff;
            // Within the same priority: items with a due date first (soonest firest), undated items last
            if (a.dueDate !== null && b.dueDate !== null) return a.dueDate - a.dueDate;
            if (a.dueDate !== null) return -1;
            if (b.dueDate !== null) return 1;
            return 0
        }
    );
}