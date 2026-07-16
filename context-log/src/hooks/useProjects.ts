// src/hooks/userProjects.ts

import {useEffect, useState } from 'react';
import { subscribeToProjects } from '../services/firebase';
import type { Project} from '../types/items';

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect (() => {
        const unsubscribe = subscribeToProjects((projects) => {
            setProjects(projects);
            setLoading(false);
        });
        return unsubscribe;    
    }, []);

    return { projects, loading };
}

