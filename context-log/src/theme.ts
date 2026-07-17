// src/theme.ts
import type { ItemStatus } from './types/items';

export const colors = {
  canvasBg: '#EEF1F5',      // blueprint paper — world canvas background
  ink: '#23282D',            // primary text / graphite
  paper: '#FFFFFF',          // card / container body surfaces
  headerBg: '#1D242B',       // project title block header
  gridDot: '#D7DEE6',        // subtle canvas dot-grid
  border: '#CBD3DC',         // hairline dividers

  blueprintBlue: '#1D5C8C',  // Active
  amber: '#C77D22',          // Waiting
  green: '#1F7A52',          // Completed
  slate: '#6B7280',          // Backlog
} as const;

export const statusColors: Record<ItemStatus, string> = {
  backlog: colors.slate,
  active: colors.blueprintBlue,
  waiting: colors.amber,
  completed: colors.green,
};