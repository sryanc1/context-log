import type { Item, Project } from '../types/items';

export function searchItems(items: Item[], query: string): Item[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter(
        (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
    );
}

export function searchProjects(projects: Project[], query: string): Project[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return projects.filter(
        (project) => project.title.toLowerCase().includes(q) || project.description.toLowerCase().includes(q)
    );
}