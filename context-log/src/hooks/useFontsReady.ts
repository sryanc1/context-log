import { useEffect, useState } from 'react';

export function useFontsReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fontsPromise = Promise.all([
      document.fonts.load('12px Inter'),
      document.fonts.load('10px Inter'),
      document.fonts.load('9px "IBM Plex Mono"'),
      document.fonts.load('11px "IBM Plex Mono"'),
    ]).then(() => document.fonts.ready);

    // Safety net: never block the board forever if a font fails to load
    // (offline, blocked CDN, etc.) — worse to hang than to occasionally mis-wrap.
    const timeout = new Promise((resolve) => setTimeout(resolve, 500));

    Promise.race([fontsPromise, timeout]).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => { cancelled = true; };
  }, []);

  return ready;
}