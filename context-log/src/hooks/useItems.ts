import { useEffect, useState } from 'react';
import {subscribeToItems} from '../services/firebase';
import type {Item} from '../types/items';

export function useItems() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToItems((items) => {
            setItems(items);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    return { items, loading };
}

