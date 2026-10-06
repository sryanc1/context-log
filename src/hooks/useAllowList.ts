// src/hooks/useAllowList

import { useEffect, useState } from "react";
import { subscribeToAllowlist } from "../services/firebase";
import type { AllowlistEntry } from "../types/items";

export function useAllowlist(isAdmin: boolean){
    const [entries, setEntries] = useState<AllowlistEntry[]>([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }
        const unsubscribe = subscribeToAllowlist((entries) => {
            setEntries(entries);
            setLoading(false);
        });
        return unsubscribe;
    }, [isAdmin]);
    return {entries, loading};
}