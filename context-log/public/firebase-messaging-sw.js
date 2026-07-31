// public/firebase-messaging-sw.js
//
// Vite does not process public/ files — this can't use import.meta.env, so the
// values below are copied directly from .env.local. Not a security issue: see
// the explanation above.

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'PASTE_YOUR_VITE_FIREBASE_API_KEY',
  authDomain: 'PASTE_YOUR_VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'PASTE_YOUR_VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'PASTE_YOUR_VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'PASTE_YOUR_VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'PASTE_YOUR_VITE_FIREBASE_APP_ID',
});

const messaging = firebase.messaging();

// Handles a push arriving while the tab isn't focused, or the browser's closed
// entirely. Foreground handling (tab open and focused) is separate — that's an
// onMessage() listener inside the app itself, which we'll add in step 3.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'context-log';
  const options = {
    body: payload.notification?.body ?? '',
    icon: '/icon-192.png', // placeholder path — update once a real app icon exists
    data: payload.data,
  };
  self.registration.showNotification(title, options);
});