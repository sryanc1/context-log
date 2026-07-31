// src/hooks/useNotifications.ts

import { useCallback, useEffect, useState } from 'react';
import { registerForPushNotifications, listenForForegroundMessages } from '../services/messaging';

export type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function useNotifications(uid: string) {
  const [permissionState, setPermissionState] = useState<PermissionState>(
    'Notification' in window ? (Notification.permission as PermissionState) : 'unsupported'
  );
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  const requestPermission = useCallback(async () => {
    if (!uid) return;
    await registerForPushNotifications(uid);
    setPermissionState('Notification' in window ? (Notification.permission as PermissionState) : 'unsupported');
  }, [uid]);

  // Auto-prompt once per browser — self-limiting, since Notification.permission
  // stops being 'default' the moment you answer, granted or denied.
  useEffect(() => {
    if (!uid || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      requestPermission();
    } else if (Notification.permission === 'granted') {
      // Already decided in a past session — silently refresh the token registration
      // (tokens can rotate), no prompt needed.
      registerForPushNotifications(uid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    listenForForegroundMessages((title, body) => setToast({ title, body })).then((unsub) => {
      unsubscribe = unsub;
    });
    return () => unsubscribe?.();
  }, []);

  return { permissionState, requestPermission, toast, dismissToast: () => setToast(null) };
}