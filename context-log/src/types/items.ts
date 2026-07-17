// src/types/items.ts

export type ItemType =
    | 'task' | 'issue' | 'decision' 
    | 'note' | 'document' | 'meeting' | 'contact' | 'asset';

export type ItemStatus = 'backlog' | 'active' | 'waiting' | 'completed';
export type Priority = 'low' | 'medium' | 'high';

export interface BaseItem {
    id: string;
    title: string;
    description: string;
    type: ItemType;
    status: ItemStatus;
    priority: Priority;
    tags: string[];
    containerId: string; // which project this card belongs to, if any
    x: number; // position local to the contatiner
    y: number; 
    createdAt: number;
    updatedAt: number;
}

// Type-specific extension - same pattern as cameraPin / TaskPin split
export interface DecisionItem extends BaseItem {
    type: 'decision';
    reason: string;
    inpact: string;
}

//Generic Union - extend this as needed - add more types-specific fileds later
export type Item = BaseItem | DecisionItem;

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

