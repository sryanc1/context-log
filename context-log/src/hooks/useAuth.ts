import { useState, useEffect} from 'react';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    type User,

} from 'firebase/auth';
import {db} from '../services/firebase'; // to ensure firebase app is initialised first

const auth = getAuth(db.app);
const provider = new GoogleAuthProvider();

export function useAuth() {
    const [user,setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = () => signInWithPopup(auth, provider);
    const logout = () => signOut(auth);

    return { user, loading, login, logout };
}