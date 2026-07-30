// src/types/items.ts

export type ItemType =
    | 'task' | 'issue' | 'decision'
    | 'note' | 'document' | 'meeting' | 'contact' | 'asset';

export type ItemStatus = 'backlog' | 'active' | 'waiting' | 'completed';
export type Priority = 'low' | 'medium' | 'high';
export const STATUSES: ItemStatus[] = ["backlog", "active", "waiting", "completed"]

interface ItemCommonFields {
    id: string;
    title: string;
    description: string;
    status: ItemStatus;
    priority: Priority;
    tags: string[];
    containerId: string | null;
    x: number;
    y: number;
    createdAt: number;
    updatedAt: number;
    dueDate: number | null;
}

export interface BaseItem extends ItemCommonFields {
    type: Exclude<ItemType, 'decision'>;
}

export interface DecisionItem extends ItemCommonFields {
    type: 'decision';
    reason: string;
    impact: string;
}

export type Item = BaseItem | DecisionItem;
export type AnyItemType = ItemType | 'decision';

export interface Project {
    id: string;
    title: string;
    description: string;
    color: string;
    x: number; // position local to the outer canvas
    y: number;
    width: number;
    height: number;
    archived: boolean;
    createdAt: number;
    updatedAt: number;
    archivedAt: number | null;
}

export interface Relationship {
    id: string;
    sourceId: string;
    targetId: string;
    relationshipType: string; // e.g., "depends on", "related to", "blocks", etc.
    createdAt: Date;
}

export interface ActivityEntry {
    id: string;
    uid: string;
    action: 'create' | 'status_changed' | 'field_updated' | 'moved';
    description: string; // auto-generated, human readable
    fieldChanged?: string;
    oldValue?: string;
    newValue?: string;
    createdAt: number;
}

export interface ActivityFeedEntry extends ActivityEntry {
    itemId: string;
}

export interface AllowlistEntry {
    email: string;
    addedAt: number;
    source: 'manual' | 'stripe';
    notes: string;
    isAdmin: boolean;
}