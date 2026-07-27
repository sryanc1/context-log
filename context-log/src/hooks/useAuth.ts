// src/hooks/useAuth.ts

import { useEffect, useState } from 'react';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { db, checkAllowlist } from '../services/firebase';

const auth = getAuth(db.app);
const provider = new GoogleAuthProvider();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u?.email) {
        try {
          const isAllowed = await checkAllowlist(u.email);
          setAllowed(isAllowed);
        } catch {
          // Fail closed — a failed check should never silently grant access
          setAllowed(false);
        }
      } else {
        setAllowed(false);
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return { user, allowed, loading, login, logout };
}