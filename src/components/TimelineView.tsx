// src/components/TimelineView.tsx

import { useMemo } from 'react';
import type { ActivityFeedEntry, Item, Project } from '../types/items';
import { formatDayHeading, formatRelativeTime } from '../utils/time';

interface TimelineViewProps {
    entries: ActivityFeedEntry[];
    items: Item[];
    projects: Project[];
    onSelectItem: (itemId: string) => void;
}

export function TimelineView({ entries, items, projects, onSelectItem }: TimelineViewProps) {
    const groups = useMemo(() => {
        const byDay = new Map<string, ActivityFeedEntry[]>();
        for (const entry of entries) {
            const key = formatDayHeading(entry.createdAt);
            if (!byDay.has(key)) byDay.set(key, []);
            byDay.get(key)!.push(entry);
        }
        return Array.from(byDay.entries());
    }, [entries]);

    if (entries.length === 0) {
        return <p className="archive-empty">No activity yet.</p>;
    }

    return (
        <div className="timeline">
            {groups.map(([day, dayEntries]) => (
                <div key={day} className="timeline-group">
                <div className="timeline-day-heading">{day}</div>
                    {dayEntries.map((entry) => {
                        const item = items.find((i) => i.id === entry.itemId);
                        const project = item ? projects.find((p) => p.id === item.containerId) : undefined;

                        return (
                        <button
                            key={entry.id}
                            className="timeline-row"
                            onClick={() => onSelectItem(entry.itemId)}
                            disabled={!item}
                        >
                            <span className="archive-swatch" style={{ background: project?.color || '#3A4552' }} />
                            <div className="timeline-row-body">
                                <div className="timeline-row-title">{item?.title ?? '(deleted item)'}</div>
                                <div className="timeline-row-desc">{entry.description}</div>
                            </div>
                            <div className="timeline-row-time">{formatRelativeTime(entry.createdAt)}</div>
                        </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}