import { useEffect } from "react";
import { useClerk } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function SSOCallback() {
    const { handleRedirectCallback } = useClerk();
    const [, setLocation] = useLocation();

    useEffect(() => {
        async function handleCallback() {
            try {
                await handleRedirectCallback({
                    afterSignInUrl: "/",
                    afterSignUpUrl: "/onboarding",
                });
            } catch (error) {
                console.error("SSO Callback error:", error);
                // Redirect to home on error
                setLocation("/");
            }
        }

        handleCallback();
    }, [handleRedirectCallback, setLocation]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Signing you in...</h2>
                <p className="text-muted-foreground">Please wait while we complete authentication.</p>
            </div>
        </div>
    );
}
