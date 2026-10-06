import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'];

export function useInactivityTimeout(onTimeout: () => void, timeoutMs: number, enabled: boolean) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onTimeoutRef = useRef(onTimeout);
    onTimeoutRef.current = onTimeout; // always fresh — no effect dependency needed

    useEffect(() => {
        if (!enabled) return;

        const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => onTimeoutRef.current(), timeoutMs);
        };

        ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer));
        resetTimer();

        return () => {
            ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [enabled, timeoutMs]);
}