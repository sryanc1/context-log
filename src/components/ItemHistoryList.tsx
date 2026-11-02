import { useMemo } from 'react';
import type { ActivityEntry } from '../types/items';
import { formatDayHeading } from '../utils/time';

interface ItemHistoryListProps {
  entries: ActivityEntry[];
  loading: boolean;
}

export function ItemHistoryList({ entries, loading }: ItemHistoryListProps) {
  const groups = useMemo(() => {
    const byDay = new Map<string, ActivityEntry[]>();
    for (const entry of entries) {
      const key = formatDayHeading(entry.createdAt);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(entry);
    }
    return Array.from(byDay.entries());
  }, [entries]);

  if (loading) return <p className="archive-empty">Loading history...</p>;
  if (entries.length === 0) return <p className="archive-empty">No history recorded yet.</p>;

  return (
    <div className="item-history">
      {groups.map(([day, dayEntries]) => (
        <div key={day} className="timeline-group">
          <div className="timeline-day-heading">{day}</div>
          {dayEntries.map((entry) => (
            <div key={entry.id} className="item-history-row">
              <div className="item-history-desc">{entry.description}</div>
              <div className="timeline-row-time">
                {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}