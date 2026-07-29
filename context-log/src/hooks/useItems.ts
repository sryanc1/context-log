// src/hooks/useItems.ts
import { useEffect, useState } from 'react';
import { subscribeToItems } from '../services/firebase';
import type { Item } from '../types/items';

export function useItems(uid: string) {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(!uid) {
            setItems([]);
            setLoading(true);
            return;
        }
        const unsubscribe = subscribeToItems(uid, (items) => {
            setItems(items);
            setLoading(false);
        });
        return unsubscribe;
    }, [uid]);

    return { items, loading };
}