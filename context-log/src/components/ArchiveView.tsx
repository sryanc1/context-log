// src/components/ArchiveView.tsx

import type { Item, Project } from '../types/items';
import { formatRelativeTime } from '../utils/time';
import { statusColors } from '../theme';

interface ArchiveViewProps {
	archivedProjects: Project[];
	items: Item[];
	onRestore: (project: Project) => void;
	onDelete: (project: Project) => void;
}

export function ArchiveView({ archivedProjects, items, onRestore, onDelete }: ArchiveViewProps) {
	if (archivedProjects.length === 0) {
		return <p className="archive-empty">No archived projects.</p>;
	}



	return (
		<div className="archive-list">
			{archivedProjects.map((project) => {
				const projectItems = items.filter((i) => i.containerId === project.id);

				const handleDelete = () => {
					const itemWarning = projectItems.length > 0 ? ` and its ${projectItems.length} card${projectItems.length === 1 ? '' : 's'}` : '';
					const confirmed = window.confirm(`Permanently delete "${project.title}"${itemWarning}? This cannot be undone.`);
					if (confirmed) onDelete(project);
				};

				return (
				<div key={project.id} className="archive-row">
					<div className="archive-row-header">

						<span className="archive-swatch" style={{ background: project.color || '#3A4552' }} />
						<div className="archive-info">
							<div className="archive-title">{project.title}</div>
							<div className="archive-meta">
							Archived {formatRelativeTime(project.archivedAt ?? project.updatedAt)}
							{' · '}
							{projectItems.length} card{projectItems.length === 1 ? '' : 's'}
							</div>
						</div>
						<button className="modal-button modal-button-danger" onClick={handleDelete}>
							Delete
						</button>
						<button className="modal-button modal-button-primary" onClick={() => onRestore(project)}>
							Restore
						</button>
					</div>

					{project.description && (
						<p className="archive-description">{project.description}</p>
					)}

					{projectItems.length > 0 && (
						<div className="archive-chips">
							{projectItems.map((item) => (
							<span key={item.id} className="archive-chip">
								<span className="archive-chip-dot" style={{ background: statusColors[item.status] }} />
								{item.title}
							</span>
							))}
						</div>
					)}
				</div>
				);
			})}
		</div>
	);
}