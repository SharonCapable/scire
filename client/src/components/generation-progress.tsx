import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, BookOpen, Brain, Sparkles, FileText, Trophy } from "lucide-react";

interface GenerationStep {
    id: string;
    label: string;
    icon: React.ElementType;
    status: 'pending' | 'active' | 'completed';
}

interface GenerationProgressProps {
    isVisible: boolean;
    courseTitle?: string;
    tierLevel?: 'start' | 'intermediate' | 'advanced';
    currentStep: number;
    totalSteps: number;
    onComplete?: () => void;
}

const defaultSteps: Omit<GenerationStep, 'status'>[] = [
    { id: 'analyze', label: 'Analyzing your interests...', icon: Brain },
    { id: 'structure', label: 'Designing course structure...', icon: FileText },
    { id: 'modules', label: 'Creating learning modules...', icon: BookOpen },
    { id: 'content', label: 'Generating learning materials...', icon: Sparkles },
    { id: 'finalize', label: 'Finalizing your course...', icon: Trophy },
];

export function GenerationProgress({
    isVisible,
    courseTitle,
    tierLevel,
    currentStep,
    totalSteps,
    onComplete,
}: GenerationProgressProps) {
    const [completedAnimation, setCompletedAnimation] = useState(false);

    const steps: GenerationStep[] = defaultSteps.map((step, index) => ({
        ...step,
        status: index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending',
    }));

    const isComplete = currentStep >= totalSteps;

    useEffect(() => {
        if (isComplete && !completedAnimation) {
            setCompletedAnimation(true);
            setTimeout(() => {
                onComplete?.();
            }, 2000);
        }
    }, [isComplete, completedAnimation, onComplete]);

    if (!isVisible) return null;

    const tierLabels = {
        start: 'Beginner Tier',
        intermediate: 'Intermediate Tier',
        advanced: 'Advanced Tier',
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-background"
            >
                {/* Animated background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-violet-500/5" />
                    {/* Floating particles */}
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-primary/20"
                            initial={{
                                x: Math.random() * window.innerWidth,
                                y: Math.random() * window.innerHeight,
                            }}
                            animate={{
                                y: [null, Math.random() * window.innerHeight],
                                x: [null, Math.random() * window.innerWidth],
                            }}
                            transition={{
                                duration: 10 + Math.random() * 10,
                                repeat: Infinity,
                                repeatType: "reverse",
                            }}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-md w-full mx-4 text-center">
                    {/* Logo/Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="mb-8"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-xl shadow-primary/25">
                            {isComplete ? (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", delay: 0.3 }}
                                >
                                    <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
                                </motion.div>
                            ) : (
                                <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
                            )}
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-2"
                    >
                        <h1 className="text-2xl md:text-3xl font-bold font-heading">
                            {isComplete ? 'Course Ready!' : 'Creating Your Course'}
                        </h1>
                    </motion.div>

                    {/* Course info */}
                    {(courseTitle || tierLevel) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mb-8"
                        >
                            {courseTitle && (
                                <p className="text-lg text-muted-foreground">{courseTitle}</p>
                            )}
                            {tierLevel && (
                                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                    {tierLabels[tierLevel]}
                                </span>
                            )}
                        </motion.div>
                    )}

                    {/* Steps */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-3 text-left"
                    >
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${step.status === 'active'
                                            ? 'bg-primary/10 border border-primary/20'
                                            : step.status === 'completed'
                                                ? 'bg-emerald-500/10'
                                                : 'bg-muted/50'
                                        }`}
                                >
                                    <div
                                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${step.status === 'active'
                                                ? 'bg-primary text-primary-foreground'
                                                : step.status === 'completed'
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        {step.status === 'active' ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : step.status === 'completed' ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : (
                                            <Icon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span
                                        className={`font-medium ${step.status === 'pending' ? 'text-muted-foreground' : ''
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Completion message */}
                    {isComplete && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mt-8"
                        >
                            <p className="text-muted-foreground">
                                Redirecting you to your dashboard...
                            </p>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
