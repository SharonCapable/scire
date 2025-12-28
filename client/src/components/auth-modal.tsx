import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { SignIn, SignUp, useSignIn, useSignUp } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

// Google SVG Icon
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </svg>
);

export function AuthModal() {
    const {
        showAuthModal,
        setShowAuthModal,
        authMode,
        setAuthMode,
    } = useAuth();

    const { signIn, isLoaded: signInLoaded } = useSignIn();
    const { signUp, isLoaded: signUpLoaded } = useSignUp();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);

    if (!showAuthModal) return null;

    const toggleMode = () => {
        setAuthMode(authMode === "signin" ? "signup" : "signin");
        setGoogleError(null);
    };

    const handleGoogleSignIn = async () => {
        if (!signInLoaded || !signIn) {
            setGoogleError("Authentication not ready. Please try again.");
            return;
        }

        try {
            setIsGoogleLoading(true);
            setGoogleError(null);

            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: `${window.location.origin}/sso-callback`,
                redirectUrlComplete: `${window.location.origin}/`,
            });
        } catch (error: any) {
            console.error("Google sign-in error:", error);
            setGoogleError(error?.errors?.[0]?.message || "Failed to sign in with Google. Please try again.");
            setIsGoogleLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        if (!signUpLoaded || !signUp) {
            setGoogleError("Authentication not ready. Please try again.");
            return;
        }

        try {
            setIsGoogleLoading(true);
            setGoogleError(null);

            await signUp.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: `${window.location.origin}/sso-callback`,
                redirectUrlComplete: `${window.location.origin}/`,
            });
        } catch (error: any) {
            console.error("Google sign-up error:", error);
            setGoogleError(error?.errors?.[0]?.message || "Failed to sign up with Google. Please try again.");
            setIsGoogleLoading(false);
        }
    };

    const handleGoogleClick = () => {
        if (authMode === "signin") {
            handleGoogleSignIn();
        } else {
            handleGoogleSignUp();
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
                onClick={() => setShowAuthModal(false)}
            >
                {/* Backdrop with blur */}
                <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                    className="relative z-10 w-full max-w-md mx-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
                        {/* Gradient accent */}
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />

                        {/* Close button */}
                        <button
                            onClick={() => setShowAuthModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>

                        <div className="p-8">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: "spring", bounce: 0.5 }}
                                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4 shadow-lg shadow-primary/25"
                                >
                                    <span className="text-2xl font-bold text-primary-foreground">S</span>
                                </motion.div>
                                <h2 className="text-2xl font-bold font-heading">
                                    {authMode === "signin" ? "Welcome back" : "Create account"}
                                </h2>
                                <p className="text-muted-foreground mt-2">
                                    {authMode === "signin"
                                        ? "Sign in to continue your learning journey"
                                        : "Join SCIRE and start learning today"}
                                </p>
                            </div>

                            {/* Custom Google Button */}
                            <div className="mb-6">
                                <Button
                                    variant="outline"
                                    className="w-full h-12 gap-3 text-base font-medium hover:bg-muted/50 transition-all"
                                    onClick={handleGoogleClick}
                                    disabled={isGoogleLoading}
                                >
                                    {isGoogleLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <GoogleIcon />
                                    )}
                                    {isGoogleLoading
                                        ? "Connecting..."
                                        : `Continue with Google`
                                    }
                                </Button>

                                {googleError && (
                                    <p className="text-sm text-destructive mt-2 text-center">
                                        {googleError}
                                    </p>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">
                                        or continue with email
                                    </span>
                                </div>
                            </div>

                            {/* Clerk Auth Component (Email/Password) */}
                            <div className="clerk-auth-container flex justify-center">
                                {authMode === "signin" ? (
                                    <SignIn
                                        appearance={{
                                            elements: {
                                                rootBox: "w-full",
                                                card: "shadow-none bg-transparent p-0 border-0",
                                                header: "hidden",
                                                footer: "hidden",
                                                socialButtonsBlockButton: "hidden",
                                                socialButtonsProviderIcon: "hidden",
                                                dividerRow: "hidden",
                                                formButtonPrimary:
                                                    "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200",
                                                formFieldInput:
                                                    "bg-background border-border focus:border-primary focus:ring-primary",
                                                formFieldLabel: "text-foreground",
                                                identityPreview: "bg-muted",
                                                identityPreviewText: "text-foreground",
                                                identityPreviewEditButton: "text-primary",
                                                formResendCodeLink: "text-primary hover:text-primary/80",
                                                footerActionLink: "text-primary hover:text-primary/80",
                                                alertText: "text-destructive",
                                            },
                                            layout: {
                                                socialButtonsPlacement: "bottom",
                                                showOptionalFields: false,
                                            },
                                        }}
                                        routing="hash"
                                        afterSignInUrl="/"
                                    />
                                ) : (
                                    <SignUp
                                        appearance={{
                                            elements: {
                                                rootBox: "w-full",
                                                card: "shadow-none bg-transparent p-0 border-0",
                                                header: "hidden",
                                                footer: "hidden",
                                                socialButtonsBlockButton: "hidden",
                                                socialButtonsProviderIcon: "hidden",
                                                dividerRow: "hidden",
                                                formButtonPrimary:
                                                    "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200",
                                                formFieldInput:
                                                    "bg-background border-border focus:border-primary focus:ring-primary",
                                                formFieldLabel: "text-foreground",
                                                identityPreview: "bg-muted",
                                                identityPreviewText: "text-foreground",
                                                identityPreviewEditButton: "text-primary",
                                                formResendCodeLink: "text-primary hover:text-primary/80",
                                                footerActionLink: "text-primary hover:text-primary/80",
                                                alertText: "text-destructive",
                                            },
                                            layout: {
                                                socialButtonsPlacement: "bottom",
                                                showOptionalFields: false,
                                            },
                                        }}
                                        routing="hash"
                                        afterSignUpUrl="/"
                                    />
                                )}
                            </div>

                            {/* Toggle mode */}
                            <p className="text-center text-sm text-muted-foreground mt-6">
                                {authMode === "signin" ? (
                                    <>
                                        Don't have an account?{" "}
                                        <button
                                            onClick={toggleMode}
                                            className="text-primary font-medium hover:underline"
                                        >
                                            Sign up
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{" "}
                                        <button
                                            onClick={toggleMode}
                                            className="text-primary font-medium hover:underline"
                                        >
                                            Sign in
                                        </button>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
