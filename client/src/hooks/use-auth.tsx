import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";

export interface User {
    id: string;
    username: string;
    email?: string;
    name?: string;
    picture?: string;
    role?: "student" | "educator";
    isAdmin?: boolean;
    onboardingCompleted?: boolean;
    provider?: 'local' | 'google' | 'clerk';
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setUserRole: (role: "student" | "educator") => Promise<void>;
    showAuthModal: boolean;
    setShowAuthModal: (show: boolean) => void;
    authMode: "signin" | "signup";
    setAuthMode: (mode: "signin" | "signup") => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { isLoaded, isSignedIn, signOut, getToken } = useClerkAuth();
    const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
    const [, setLocation] = useLocation();

    // Sync user with backend when Clerk auth state changes
    useEffect(() => {
        async function syncUser() {
            if (!isLoaded || !isUserLoaded) return;

            if (isSignedIn && clerkUser) {
                try {
                    const token = await getToken();
                    const response = await fetch("/api/auth/sync", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const syncedUser = data.user;
                        setUser(syncedUser);

                        // Close modal on successful auth
                        setShowAuthModal(false);

                        // Redirect based on onboarding status
                        // Get current path to avoid unnecessary redirects
                        const currentPath = window.location.pathname;

                        if (!syncedUser.onboardingCompleted && !syncedUser.role) {
                            // New user - redirect to onboarding
                            if (currentPath !== "/onboarding") {
                                setLocation("/onboarding");
                            }
                        } else {
                            // Returning user - redirect to appropriate dashboard if on landing page
                            if (currentPath === "/" || currentPath === "") {
                                const targetPath = syncedUser.role === "educator" ? "/admin" : "/dashboard";
                                setLocation(targetPath);
                            }
                        }
                    } else {
                        console.error("Failed to sync user with backend");
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Error syncing user:", error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }

            setIsLoading(false);
        }

        syncUser();
    }, [isLoaded, isUserLoaded, isSignedIn, clerkUser, getToken]);

    const logout = async () => {
        try {
            await signOut();
            setUser(null);
            setLocation("/");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const setUserRole = async (role: "student" | "educator") => {
        try {
            const token = await getToken();
            const response = await fetch("/api/auth/role", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role }),
            });

            if (!response.ok) {
                throw new Error("Failed to set role");
            }

            const result = await response.json();
            setUser(result.user);
        } catch (error) {
            console.error("Error setting role:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading: !isLoaded || !isUserLoaded || isLoading,
                isAuthenticated: !!user && !!isSignedIn,
                setUserRole,
                showAuthModal,
                setShowAuthModal,
                authMode,
                setAuthMode,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
