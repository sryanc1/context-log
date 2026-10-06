import { useEffect, useState } from 'react';
import { subscribeToUserSettings } from '../services/firebase';
import { DEFAULT_SETTING, type UserSettings } from '../types/settings';

export function useUserSettings(uid: string) {
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTING);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }
        const unsubscribe = subscribeToUserSettings(uid, (s) => {
            setSettings(s);
            setLoading(false);
        });
        return unsubscribe;
    }, [uid]);

    return { settings, loading };
}