// src/componenets/NavRail.tsx

import { VIEWS, type ViewId } from "../types/views";

interface NavRailProps {
    activeView: ViewId | null;
    onSelect: (view: ViewId) => void;
    isAdmin: boolean;
    collapsed: boolean;
    onToggleCollapsed: () => void;
}

export function NavRail({activeView, onSelect, isAdmin, collapsed, onToggleCollapsed}: NavRailProps) {
    const visibleViews = VIEWS.filter((v) => !v.adminOnly || isAdmin)

    return (
        <div className={`nav-rail ${collapsed ? 'nav-rail-collapsed' : ''}`}>
            <button className="nav-rail-toggle" onClick={onToggleCollapsed} aria-label="Toggle navigation">☰</button>
            <button className={`nav-rail-item ${activeView === null ? 'nav-rail-item-active': ''}`} 
                onClick={() => onSelect(null as unknown as ViewId)}>
                <span className="nav-rail-icon">▤</span>
                <span className="nav-rail-label">Board</span>
            </button>
            {visibleViews.map((view) => (
                <button
                    key={view.id}
                    className={`nav-rail-item ${activeView === view.id ? 'nav-rail-item-active' : ''}`}
                    onClick={() => onSelect(view.id)}
                >
                    <span className="nav-rail-icon">
                        {view.icon}
                    </span>
                    <span className="nav-rail-label">
                        {view.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
