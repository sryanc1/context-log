// src/hooks/useProjects.ts
import { useEffect, useState } from 'react';
import { subscribeToProjects } from '../services/firebase';
import type { Project } from '../types/items';

export function useProjects(uid: string) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToProjects(uid, (projects) => {
        setProjects(projects);
        setLoading(false);
        });
        return unsubscribe;
    }, [uid]);

    return { projects, loading };
}