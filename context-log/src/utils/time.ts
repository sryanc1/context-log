// src/utils/time.ts

export function formatRelativeTime(ms: number): string {
    if (!ms) return '—';
    const diffMinutes = Math.floor((Date.now() - ms) / 60000);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}