// public/firebase-messaging-sw.js
//
// Vite does not process public/ files — this can't use import.meta.env, so the
// values below are copied directly from .env.local. Not a security issue: see
// the explanation above.

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBDFFkMfoJ0u6wA6PZ0ndjFKK1W3v8KOsU',
  authDomain: 'context-log-e6395.firebaseapp.com',
  projectId: 'context-log-e6395',
  storageBucket: 'context-log-e6395.firebasestorage.app',
  messagingSenderId: '73152806789',
  appId: '1:73152806789:web:edc789abc14a1a158aceec',
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