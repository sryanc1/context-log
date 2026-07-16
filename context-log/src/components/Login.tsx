// src/components/Login.tsx

import {useAuth} from '../hooks/useAuth';

export function Login() {
    const { login } = useAuth();
    return (
        <div className="login-screen">
            <h1>contect-log</h1>
            <button onClick={login}>Sign in with Goolge</button>
        </div>
    )
}