import { useEffect, useState } from "react";
import { useClerk } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function SSOCallback() {
    const { handleRedirectCallback } = useClerk();
    const [, setLocation] = useLocation();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function handleCallback() {
            try {
                // Handle the OAuth redirect
                await handleRedirectCallback({
                    afterSignInUrl: "/dashboard",
                    afterSignUpUrl: "/onboarding",
                });
                // handleRedirectCallback should automatically redirect
                // If we get here without redirect, manually go to dashboard
                setLocation("/dashboard");
            } catch (error: any) {
                console.error("SSO Callback error:", error);
                setError(error?.message || "Authentication failed");
                // Redirect to home on error after a short delay
                setTimeout(() => setLocation("/"), 2000);
            }
        }

        handleCallback();
    }, [handleRedirectCallback, setLocation]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                {error ? (
                    <>
                        <div className="text-destructive mb-4">{error}</div>
                        <p className="text-muted-foreground">Redirecting...</p>
                    </>
                ) : (
                    <>
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Signing you in...</h2>
                        <p className="text-muted-foreground">Please wait while we complete authentication.</p>
                    </>
                )}
            </div>
        </div>
    );
}
