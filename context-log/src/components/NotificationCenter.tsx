import {useState} from 'react'
import type {Item, Project} from '../types/items'
import { getDueUrgency } from '../utils/dueDate'

interface NotificationCenterPropes {
    urgentItems: Item[];
    projects: Project[];
    onSelectItem: (itemId: string) => void;
}

export function NotificationCenter({urgentItems, projects, onSelectItem} : NotificationCenterPropes) {
    const [isOpen, setIsOpen] = useState(false);

    if (urgentItems.length === 0){
        return <span className='notif-center-empty' title='Nothing due soon'>⚠</span>
    }

  return (
        <div className="notif-center">
            <button className="notif-center-trigger" onClick={() => setIsOpen((o) => !o)}>
                <span>⚠</span>
                <span className="notif-center-badge">{urgentItems.length}</span>
            </button>

            {isOpen && (
                <div className="notif-center-dropdown">
                    {urgentItems.map((item) => {
                        const urgency = getDueUrgency(item.dueDate);
                        const project = projects.find((p) => p.id === item.containerId);
                        return (
                            <button
                                key={item.id}
                                className="notif-center-row"
                                onClick={() => {
                                onSelectItem(item.id);
                                setIsOpen(false);
                                }}
                            >
                                <span className={`notif-center-dot notif-center-dot-${urgency}`} />
                                <div className="notif-center-info">
                                    <div className="notif-center-title">{item.title}</div>
                                    <div className="notif-center-meta">
                                        {project?.title ?? '(no project)'} · {urgency === 'overdue' ? 'Overdue' : 'Due soon'}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
