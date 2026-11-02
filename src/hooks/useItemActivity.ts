import { useEffect, useState } from 'react';
import { subscribeToItemActivity } from '../services/firebase';
import type { ActivityEntry } from '../types/items';

export function useItemActivity(uid: string, itemId: string, enabled: boolean) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !uid || !itemId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToItemActivity(uid, itemId, (e) => {
      setEntries(e);
      setLoading(false);
    });
    return unsubscribe;
  }, [uid, itemId, enabled]);

  return { entries, loading };
}