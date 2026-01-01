import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    BookOpen,
    ArrowRight,
    ArrowLeft,
    Check,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

type Role = "student" | "educator" | null;

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState<Role>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, setUserRole } = useAuth();
    const [, setLocation] = useLocation();

    // If user is already onboarded, redirect
    if (user?.onboardingCompleted) {
        setLocation("/dashboard");
        return null;
    }

    const handleRoleSelect = (role: Role) => {
        setSelectedRole(role);
    };

    const handleContinue = async () => {
        if (step === 1 && selectedRole) {
            setStep(2);
        } else if (step === 2) {
            setIsSubmitting(true);
            try {
                if (selectedRole) {
                    await setUserRole(selectedRole);
                }
                setLocation("/dashboard");
            } catch (error) {
                console.error("Failed to complete onboarding:", error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border/50 p-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-foreground">S</span>
                        </div>
                        <span className="font-bold font-heading text-xl">SCIRE</span>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            {[1, 2].map((s) => (
                                <div
                                    key={s}
                                    className={`w-8 h-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"
                                        }`}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-muted-foreground ml-2">
                            Step {step} of 2
                        </span>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-2xl">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Step 1: Role Selection */}
                                <div className="text-center mb-12">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-6 shadow-lg shadow-primary/25"
                                    >
                                        <Sparkles className="w-8 h-8 text-primary-foreground" />
                                    </motion.div>
                                    <h1 className="text-3xl md:text-4xl font-bold font-heading mb-4">
                                        Welcome to SCIRE{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                                    </h1>
                                    <p className="text-xl text-muted-foreground">
                                        Let's personalize your experience. How would you like to use SCIRE?
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 mb-8">
                                    {/* Student option */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleRoleSelect("student")}
                                        className={`relative p-8 rounded-2xl border-2 text-left transition-all ${selectedRole === "student"
                                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                                : "border-border hover:border-primary/50 bg-card"
                                            }`}
                                    >
                                        {selectedRole === "student" && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                                            >
                                                <Check className="w-4 h-4 text-primary-foreground" />
                                            </motion.div>
                                        )}

                                        <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                                            <GraduationCap className="w-7 h-7 text-emerald-500" />
                                        </div>

                                        <h3 className="text-xl font-semibold font-heading mb-2">
                                            I'm a Student
                                        </h3>
                                        <p className="text-muted-foreground">
                                            I want to learn new skills, take courses, and track my progress.
                                        </p>

                                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                Personalized course recommendations
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                Interactive flashcards & quizzes
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                Progress tracking & achievements
                                            </li>
                                        </ul>
                                    </motion.button>

                                    {/* Educator option */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleRoleSelect("educator")}
                                        className={`relative p-8 rounded-2xl border-2 text-left transition-all ${selectedRole === "educator"
                                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                                : "border-border hover:border-primary/50 bg-card"
                                            }`}
                                    >
                                        {selectedRole === "educator" && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                                            >
                                                <Check className="w-4 h-4 text-primary-foreground" />
                                            </motion.div>
                                        )}

                                        <div className="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
                                            <BookOpen className="w-7 h-7 text-violet-500" />
                                        </div>

                                        <h3 className="text-xl font-semibold font-heading mb-2">
                                            I'm an Educator
                                        </h3>
                                        <p className="text-muted-foreground">
                                            I want to create courses, manage students, and analyze learning data.
                                        </p>

                                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-violet-500" />
                                                Course creation tools
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-violet-500" />
                                                Student analytics dashboard
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-violet-500" />
                                                Content management system
                                            </li>
                                        </ul>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Step 2: Confirmation */}
                                <div className="text-center mb-12">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                                        className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg ${selectedRole === "student"
                                                ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25"
                                                : "bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/25"
                                            }`}
                                    >
                                        {selectedRole === "student" ? (
                                            <GraduationCap className="w-10 h-10 text-white" />
                                        ) : (
                                            <BookOpen className="w-10 h-10 text-white" />
                                        )}
                                    </motion.div>

                                    <h1 className="text-3xl md:text-4xl font-bold font-heading mb-4">
                                        You're all set!
                                    </h1>
                                    <p className="text-xl text-muted-foreground max-w-md mx-auto">
                                        {selectedRole === "student"
                                            ? "Your personalized learning dashboard is ready. Start exploring courses tailored to your interests."
                                            : "Your educator dashboard is ready. Create courses and manage your students with powerful tools."}
                                    </p>
                                </div>

                                <div className="bg-card rounded-2xl border border-border/50 p-8 mb-8">
                                    <h3 className="font-semibold font-heading mb-4">What's next?</h3>
                                    <ul className="space-y-4">
                                        {selectedRole === "student" ? (
                                            <>
                                                <li className="flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <span className="text-xs font-bold text-primary">1</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Set your learning interests</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Tell us what topics you want to learn
                                                        </div>
                                                    </div>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <span className="text-xs font-bold text-primary">2</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Get AI recommendations</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            We'll curate courses perfect for you
                                                        </div>
                                                    </div>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <span className="text-xs font-bold text-primary">3</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Start learning!</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Begin your personalized learning journey
                                                        </div>
                                                    </div>
                                                </li>
                                            </>
                                        ) : (
                                            <>
                                                <li className="flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <span className="text-xs font-bold text-primary">1</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Explore the admin dashboard</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Familiarize yourself with the management tools
                                                        </div>
                                                    </div>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <span className="text-xs font-bold text-primary">2</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Create your first course</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Use our intuitive course builder
                                                        </div>
                                                    </div>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <span className="text-xs font-bold text-primary">3</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Invite students</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Share your courses and track progress
                                                        </div>
                                                    </div>
                                                </li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation buttons */}
                    <div className="flex items-center justify-between">
                        {step > 1 ? (
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                className="gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                        ) : (
                            <div />
                        )}

                        <Button
                            size="lg"
                            onClick={handleContinue}
                            disabled={step === 1 && !selectedRole}
                            className="gap-2 min-w-[180px]"
                        >
                            {isSubmitting ? (
                                "Loading..."
                            ) : step === 2 ? (
                                <>
                                    Go to Dashboard
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
