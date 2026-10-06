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
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            setUser(u);

            if (u?.email) {
                try {
                    const results = await checkAllowlist(u.email);
                    setAllowed(results.allowed);
                    setIsAdmin(results.isAdmin);
                } catch {
                    // Fail closed - a failed check should never silently grant access
                    setAllowed(false);
                    setIsAdmin(false);
                }
            } else {
                setAllowed(false);
                setIsAdmin(false);
            }

            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error('Sign-in failed:', err);
            alert('Sign-in failed. Check the console for details.');
        }
    };
    const logout = () => signOut(auth);

    return { user, allowed, isAdmin, loading, login, logout };
}