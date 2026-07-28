// src/components/ArchiveView.tsx

import type { Project } from '../types/items';
import { formatRelativeTime } from '../utils/time';

interface ArchiveViewProps {
  archivedProjects: Project[];
  onRestore: (project: Project) => void;
}

export function ArchiveView({ archivedProjects, onRestore }: ArchiveViewProps) {
  if (archivedProjects.length === 0) {
    return <p className="archive-empty">No archived projects.</p>;
  }

  return (
    <div className="archive-list">
      {archivedProjects.map((project) => (
        <div key={project.id} className="archive-row">
          <span className="archive-swatch" style={{ background: project.color || '#3A4552' }} />
          <div className="archive-info">
            <div className="archive-title">{project.title}</div>
            <div className="archive-meta">
              Archived {formatRelativeTime(project.archivedAt ?? project.updatedAt)}
            </div>
          </div>
          <button className="modal-button modal-button-primary" onClick={() => onRestore(project)}>
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}