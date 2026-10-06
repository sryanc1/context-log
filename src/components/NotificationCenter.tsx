import type { Item, Project } from '../types/items';
import { getDueUrgency } from '../utils/dueDate';

interface NotificationCenterProps {
    urgentItems: Item[];
    projects: Project[];
    onSelectItem: (itemId: string) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NotificationCenter({ urgentItems, projects, onSelectItem, isOpen, onOpenChange}: NotificationCenterProps) {
    if (urgentItems.length === 0) {
        return <span className="notif-center-empty" title="Nothing due soon">⚠</span>;
    }

    return (
        <div className="notif-center">
            <button className="notif-center-trigger" onClick={() => onOpenChange(!isOpen)}>
                <span>⚠</span>
                <span className="notif-center-badge">{urgentItems.length}</span>
            </button>

            {isOpen && (
                <div className="notif-center-dropdown">
                    <div className='modal-card'>
                        <div className='modal-card-scroll'>
                            <div className='view-body'>
                                {urgentItems.map((item) => {
                                    const urgency = getDueUrgency(item.dueDate);
                                    const project = projects.find((p) => p.id === item.containerId);
                                    return (
                                    <button
                                        key={item.id}
                                        className="notif-center-row"
                                        onClick={() => {
                                        onSelectItem(item.id);
                                        onOpenChange(false);
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
                                    <div className='modal-footer-right'>
                                        <button className="modal-button modal-button-primary" onClick={() => onOpenChange(!isOpen)} aria-label="Close">Close</button>
                                    </div>
                            </div>
                        </div>
                    </div>
            )}
        </div>
    );
}