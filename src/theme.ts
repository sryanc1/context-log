// src/theme.ts
import type { ItemStatus } from './types/items';

export const colors = {
    canvasBg: '#EEF1F5',      // blueprint paper — world canvas background
    ink: '#23282D',            // primary text / graphite
    paper: '#FFFFFF',          // card / container body surfaces
    headerBg: '#1D242B',       // project title block header
    gridDot: '#bdc4cc',        // subtle canvas dot-grid
    border: '#CBD3DC',         // hairline dividers

    blueprintBlue: '#1D5C8C',  // Active
    amber: '#C77D22',          // Waiting
    green: '#1F7A52',          // Completed
    slate: '#6B7280',          // Backlog

    successBg: '#DCF3E6',
    successBgHover: '#C3EAD6',
    successIcon: '#1F7A52',
    dangerBg: '#FBE2E2',
    dangerBgHover: '#F6C6C6',
    dangerIcon: '#B23B3B',

    neutralBg: '#E7E9EC',
    neutralBgHover: '#D5D9DE',
    neutralIcon: '#3A4552',
} as const;

export const statusColors: Record<ItemStatus, string> = {
    backlog: colors.slate,
    active: colors.blueprintBlue,
    waiting: colors.amber,
    completed: colors.green,
};

export const projectColors = [
    { name: 'Graphite', hex: '#3A4552' },
    { name: 'Indigo', hex: '#3E4C8C' },
    { name: 'Teal', hex: '#1F7A78' },
    { name: 'Plum', hex: '#7A4B7E' },
    { name: 'Rust', hex: '#9C4A2E' },
    { name: 'Mustard', hex: '#A8862B' },
] as const;