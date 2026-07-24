// src/types/items.ts

export type ItemType =
    | 'task' | 'issue'
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
}

export interface BaseItem extends ItemCommonFields {
    type: ItemType;
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
    x: number; // position local to the outer canvas
    y: number;
    width: number;
    height: number;
    archived: boolean;
    createdAt: number;
    updatedAt: number;
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
    action: 'create' | 'status_changed' | 'field_updated' | 'moved';
    description: string; // auto-generated, human readable
    fieldChanged?: string;
    oldValue?: string;
    newValue?: string;
    createdAt: number;
}

