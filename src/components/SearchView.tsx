// src/components/SearchView.tsx

import { useMemo, useState } from 'react';
import type { Item, Project } from '../types/items';
import { searchItems, searchProjects } from '../utils/search';

interface SearchViewProps {
    items: Item[];
    projects: Project[];
    onSelectItem: (itemId: string) => void;
    onSelectProject: (project: Project) => void;
}

export function SearchView({ items, projects, onSelectItem, onSelectProject }: SearchViewProps) {
    const [query, setQuery] = useState('');

    const matchedProjects = useMemo(() => searchProjects(projects, query), [projects, query]);
    const matchedItems = useMemo(() => searchItems(items, query), [items, query]);

    return (
        <div>
            <input
                className="modal-input search-input"
                placeholder="Search projects and items..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
            />

            {!query.trim() && <p className="archive-empty">Start typing to search.</p>}

            {query.trim() && matchedProjects.length === 0 && matchedItems.length === 0 && (
                <p className="archive-empty">No matches for "{query}".</p>
            )}

            {matchedProjects.length > 0 && (
                <div className="timeline-group">
                    <div className="timeline-day-heading">Projects</div>
                    {matchedProjects.map((project) => (
                        <button key={project.id} className="timeline-row" onClick={() => onSelectProject(project)}>
                            <span className="archive-swatch" style={{ background: project.color || '#3A4552' }} />
                            <div className="timeline-row-body">
                                <div className="timeline-row-title">
                                    {project.title}
                                    {project.archived && <span className="today-status-chip"> · archived</span>}
                                </div>
                                {project.description && <div className="timeline-row-desc">{project.description}</div>}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {matchedItems.length > 0 && (
                <div className="timeline-group">
                <div className="timeline-day-heading">Items</div>
                    {matchedItems.map((item) => {
                        const project = projects.find((p) => p.id === item.containerId);
                            return (
                            <button key={item.id} className="timeline-row" onClick={() => onSelectItem(item.id)}>
                                <span className="archive-swatch" style={{ background: project?.color || '#3A4552' }} />
                                <div className="timeline-row-body">
                                    <div className="timeline-row-title">
                                        {item.title}
                                        {project?.archived && <span className="today-status-chip"> · archived</span>}
                                    </div>
                                    <div className="timeline-row-desc">{project?.title ?? '(no project)'}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}