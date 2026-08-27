// src/hooks/useProjects.ts
import { useEffect, useState } from 'react';
import { subscribeToProjects } from '../services/firebase';
import type { Project } from '../types/items';

export function useProjects(uid: string) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setProjects([]); // (or setProjects([]) in the other hook)
            setLoading(false);
            return;
        }
        setLoading(true); // ← new: genuinely re-enter a loading state for the new uid
        const unsubscribe = subscribeToProjects(uid, (items) => {
            setProjects(items);
            setLoading(false);
        });
        return unsubscribe;
    }, [uid]);

    return { projects, loading };
}