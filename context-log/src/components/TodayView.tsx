// src/components/TodayView.tsx

import { useMemo } from "react";
import type { Item, Priority, Project } from "../types/items";
import { getDueUrgency } from "../utils/dueDate";
import { statusColors } from "../theme";

interface TodayViewProps {
    items: Item[]
    projects: Project[];
    onSelectItem: (itemId: string) => void;
}

const PRIORITY_LABELS: Record<Priority, string> = {high: 'High Proiority', medium: 'Medium Priority', low: 'Low Priority'};
const PRIORITY_ORDER: Priority[] = ['high', 'medium', 'low']

export function TodayView({items, projects, onSelectItem}: TodayViewProps) {
    const groups = useMemo (() => {
        return PRIORITY_ORDER
            .map((p) => [p, items.filter((i) => i.priority === p)] as const)
            .filter(([, group]) => group.length > 0);            
    }, [items]);

    if (items.length === 0) {
        return <p className="archive-empty">All caught up!</p>
    }

    return (
        <div className="timeline">
            {groups.map(([priority, group]) => (
                <div key={priority} className="timeline-group">
                    <div className="timeline-day-heading">{PRIORITY_LABELS[priority]}</div>
                    {group.map((item) => {
                        const project = projects.find((p) => p.id === item.containerId);
                        const urgency = getDueUrgency(item.dueDate);

                        return (
                            <button key={item.id} className="timeline-row" onClick={() => onSelectItem(item.id)}>
                                <span className="archive-swatch" style={{background: project?.color || '#3A4552'}}/>
                                <div className="timeline-row-body">
                                    <div className="timeline-row-title">{item.title}</div>
                                    <div className="timeline-row-desc">
                                        {project?.title ?? '(no project)'}
                                        {' . '}
                                        <span className="today-status-chip" style={{color: statusColors[item.status]}}>{item.status}</span>                                        
                                    </div>
                                </div>
                                {urgency && (
                                    <span className={`view-chip view-chip-${urgency}`}>
                                        {urgency === 'overdue' ? 'Overdue' : 'Due soon'}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
