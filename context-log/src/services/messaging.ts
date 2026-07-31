// src/services/messaging.ts

import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

let messagingInstance: Messaging | null = null;

async function getMessagingInstance(): Promise<Messaging | null> {
  if (!(await isSupported())) return null;
  if (!messagingInstance) messagingInstance = getMessaging(db.app);
  return messagingInstance;
}

export type RegisterResult = 'granted' | 'denied' | 'unsupported';

export async function registerForPushNotifications(uid: string): Promise<RegisterResult> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'unsupported';

  const messaging = await getMessagingInstance();
  if (!messaging) return 'unsupported';

  const swRegistration = await navigator.serviceWorker.register(
    `${import.meta.env.BASE_URL}firebase-messaging-sw.js`,
    { scope: import.meta.env.BASE_URL }
  );

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: swRegistration,
  });

  if (token) {
    await setDoc(doc(db, 'users', uid, 'fcmTokens', token), {
      token,
      createdAt: Date.now(),
      userAgent: navigator.userAgent,
    });
  }

  return 'granted';
}

export async function listenForForegroundMessages(onReceive: (title: string, body: string) => void) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    onReceive(payload.notification?.title ?? 'context-log', payload.notification?.body ?? '');
  });
}