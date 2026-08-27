// src/types/views.ts

export type ViewId = 'archive' | 'timeline' | 'graph' | 'search' | 'today' | 'admin' 

export interface ViewDef {
    id: ViewId;
    label: string;
    icon: string;
    adminOnly?: boolean;
}

export const VIEWS: ViewDef[] = [
    {id: 'today', label: 'Today', icon: '☀' },    
    {id: 'timeline', label: 'Timeline', icon: '⏱'},
    {id: 'graph', label: 'Graph', icon: '◈' },
    {id: 'search', label: 'Search', icon: '🔍' },
    {id: 'archive', label: 'Archive', icon: '🗄'},
    {id: 'admin', label: 'Admin', icon: '⚙', adminOnly: true },    
];


