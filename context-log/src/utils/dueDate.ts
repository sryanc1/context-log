// src/utils/dueDate.ts

const SOON_THRESHOLD_MS = 24*60*60*1000

export type DueUrgency = 'overdue' | 'soon' | null;

export function getDueUrgency(dueDate: number | null): DueUrgency {
    if (dueDate == null) return null;
    const now = Date.now();
    if (dueDate < now ) return 'overdue';
    if (dueDate - now <= SOON_THRESHOLD_MS) return 'soon';
    return null;
}