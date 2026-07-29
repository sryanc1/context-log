import { useEffect, useState } from 'react';
import { subscribeToRecentActivity } from '../services/firebase';
import type { ActivityFeedEntry } from '../types/items';

export function useActivityFeed(uid: string) {
    const [entries, setEntries] = useState<ActivityFeedEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToRecentActivity(uid, (entries) => {
            setEntries(entries);
            setLoading(false);
        });
        return unsubscribe;
    }, [uid]);

    return { entries, loading };
}