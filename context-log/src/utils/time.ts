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

export function formatDayHeading(ms: number) : string {
    const date = new Date(ms);
    const today = new Date;
    const yesterday = new Date;
    yesterday.setDate(today.getDate() -1);

    const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    
    if(isSameDay(date, today)) return 'Today';
    if(isSameDay(date, yesterday)) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric'});
}