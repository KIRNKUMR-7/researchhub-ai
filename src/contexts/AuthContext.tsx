import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { userDb, hashPassword, seedDemoData, type User } from "../lib/db";

// Simple session persistence via localStorage
const SESSION_KEY = "pg_session_uid";
const sessionStore = {
    get: (): string | null => localStorage.getItem(SESSION_KEY),
    set: (id: string) => localStorage.setItem(SESSION_KEY, id),
    clear: () => localStorage.removeItem(SESSION_KEY),
};

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

    // Restore session on mount
    useEffect(() => {
        const userId = sessionStore.get();
        if (userId) {
            const found = userDb.getById(userId);
            if (found) setUser(found);
            else sessionStore.clear();
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        const found = userDb.getByEmail(email);
        if (!found) return { success: false, error: "No account found with that email." };
        if (found.passwordHash !== hashPassword(password)) {
            return { success: false, error: "Incorrect password. Please try again." };
        }
        sessionStore.set(found.id);
        setUser(found);
        return { success: true };
    };

    const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        if (!name.trim()) return { success: false, error: "Please enter your full name." };
        if (!email.includes("@")) return { success: false, error: "Please enter a valid email." };
        if (password.length < 6) return { success: false, error: "Password must be at least 6 characters." };
        const existing = userDb.getByEmail(email);
        if (existing) return { success: false, error: "An account with this email already exists." };
        const newUser = userDb.create(name, email, password);
        seedDemoData(newUser.id);
        sessionStore.set(newUser.id);
        setUser(newUser);
        return { success: true };
    };

    const logout = () => {
        sessionStore.clear();
        setUser(null);
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        // Update in localStorage
        const all = JSON.parse(localStorage.getItem("pg_users") ?? "[]") as User[];
        const updated = all.map(u => u.id === user.id ? { ...u, ...updates } : u);
        localStorage.setItem("pg_users", JSON.stringify(updated));
        setUser({ ...user, ...updates });
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
