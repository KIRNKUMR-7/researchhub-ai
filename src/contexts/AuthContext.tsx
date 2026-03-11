import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { type User, seedDemoData } from "../lib/db";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Token invalid');
                    return res.json();
                })
                .then(data => {
                    setUser(data.user);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setUser(null);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch (e) { }
            if (!res.ok) throw new Error((data && data.error) || 'Login failed: ' + text);

            localStorage.setItem('token', data.token);
            setUser(data.user);
            return { success: true };
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            return { success: false, error: msg };
        }
    };

    const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        if (!name.trim()) return { success: false, error: "Please enter your full name." };
        if (!email.includes("@")) return { success: false, error: "Please enter a valid email." };
        if (password.length < 6) return { success: false, error: "Password must be at least 6 characters." };

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch (e) { }
            if (!res.ok) throw new Error((data && data.error) || 'Registration failed: ' + text);

            localStorage.setItem('token', data.token);
            setUser(data.user);
            seedDemoData(data.user.id);
            return { success: true };
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            return { success: false, error: msg };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const updateUser = async (updates: Partial<User>) => {
        if (!user) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/auth/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            }
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
