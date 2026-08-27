import { useCallback, useEffect, useState } from 'react';
import { registerForPushNotifications, unregisterPushNotifications, listenForForegroundMessages } from '../services/messaging';

export type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

const DISABLED_KEY_PREFIX = 'context-log:notifications-disabled:';
const isDisabledLocally = (uid: string) => localStorage.getItem(DISABLED_KEY_PREFIX + uid) === 'true';
const setDisabledLocally = (uid: string, disabled: boolean) =>
  	disabled ? localStorage.setItem(DISABLED_KEY_PREFIX + uid, 'true') : localStorage.removeItem(DISABLED_KEY_PREFIX + uid);

export function useNotifications(uid: string) {
	const [permissionState, setPermissionState] = useState<PermissionState>(
		'Notification' in window ? (Notification.permission as PermissionState) : 'unsupported'
	);
	const [subscribed, setSubscribed] = useState(false);
	const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

	const refreshPermissionState = () =>
		setPermissionState('Notification' in window ? (Notification.permission as PermissionState) : 'unsupported');

	const requestPermission = useCallback(async () => {
		if (!uid) return;
		setSubscribed(true); // optimistic, assume success, revert below if it fails
		try {
			await registerForPushNotifications(uid);
			setDisabledLocally(uid, false);
		} catch (err) {
			console.error('Failed to enable notifications:', err);
			setSubscribed(false); // revert, it didn't actually work			
		}
		refreshPermissionState();
	}, [uid]);

	const disableNotifications = useCallback(async () => {
		if (!uid) return;
		setSubscribed(false); // optimistic
		try {
			await unregisterPushNotifications(uid);
			setDisabledLocally(uid, true);
		} catch (err) {
			console.error('Failed to disable notifications:', err);
			setSubscribed(true); // revert
		}
	}, [uid]);

	useEffect(() => {
		if (!uid || !('Notification' in window)) return;
		if (Notification.permission === 'default') {
			requestPermission();
		} else if (Notification.permission === 'granted') {
			if (isDisabledLocally(uid)) {
				setSubscribed(false);
			} else {
				registerForPushNotifications(uid);
				setSubscribed(true);
			}
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

	return { permissionState, subscribed, requestPermission, disableNotifications, toast, dismissToast: () => setToast(null) };
}