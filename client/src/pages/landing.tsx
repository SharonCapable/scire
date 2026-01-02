import { useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { motion, useScroll, useTransform, useInView, useSpring } from "framer-motion";
import {
    ArrowRight,
    BookOpen,
    Brain,
    Users,
    Sparkles,
    GraduationCap,
    BarChart3,
    Upload,
    Target,
    Zap,
    CheckCircle2,
    Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

// Animated section wrapper
function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 60 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Floating orb background effect
function FloatingOrbs() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    x: [0, -80, 0],
                    y: [0, 60, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute top-40 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-20 left-1/3 w-80 h-80 bg-primary/15 rounded-full blur-3xl"
            />
        </div>
    );
}

// Hero section
function HeroSection() {
    const { setShowAuthModal, setAuthMode, user } = useAuth();
    const { isSignedIn } = useClerkAuth();
    const [, setLocation] = useLocation();
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    const handleGetStarted = () => {
        if (isSignedIn) {
            if (user) {
                const targetPath = user.role === "educator" ? "/admin" : "/dashboard";
                setLocation(targetPath);
            } else {
                // If signed in but user data not synced yet, go to dashboard which handles sync/loading
                setLocation("/dashboard");
            }
            return;
        }
        setAuthMode("signup");
        setShowAuthModal(true);
    };

    const handleSignIn = () => {
        if (isSignedIn) {
            setLocation("/dashboard");
            return;
        }
        setAuthMode("signin");
        setShowAuthModal(true);
    };

    return (
        <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <FloatingOrbs />

            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

            <motion.div
                style={{ y, opacity }}
                className="relative z-10 max-w-5xl mx-auto px-6 text-center"
            >
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                        <Sparkles className="w-4 h-4" />
                        AI-Powered Learning Platform
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-5xl md:text-7xl font-bold font-heading mb-6 tracking-tight"
                >
                    <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                        Learn Smarter.
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        Achieve More.
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
                >
                    SCIRE delivers personalized, adaptive education powered by AI.
                    Master any subject with intelligent course curation and progress tracking.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Button
                        size="lg"
                        className="h-14 px-8 text-lg font-semibold gap-2 shadow-lg shadow-primary/25"
                        onClick={handleGetStarted}
                    >
                        Get Started Free
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="h-14 px-8 text-lg font-semibold gap-2 backdrop-blur-sm"
                        onClick={handleSignIn}
                    >
                        <Play className="w-5 h-5" />
                        Watch Demo
                    </Button>
                </motion.div>

                {/* Trust indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="mt-16 flex flex-wrap justify-center gap-8 text-muted-foreground"
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        <span>Free forever tier</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        <span>No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        <span>AI-powered learning</span>
                    </div>
                </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center"
                >
                    <motion.div
                        animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-1.5 h-3 bg-muted-foreground/50 rounded-full mt-2"
                    />
                </motion.div>
            </motion.div>
        </section>
    );
}

// What is SCIRE section
function WhatIsScireSection() {
    return (
        <section className="py-24 md:py-32 relative">
            <div className="max-w-6xl mx-auto px-6">
                <AnimatedSection className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
                        What is <span className="text-primary">SCIRE</span>?
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        SCIRE (from Latin "to know") is an intelligent learning platform that adapts to your
                        unique learning style, delivering personalized education that evolves with you.
                    </p>
                </AnimatedSection>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: Brain,
                            title: "AI-Powered",
                            description: "Smart algorithms analyze your progress and adapt content to maximize learning efficiency."
                        },
                        {
                            icon: Target,
                            title: "Goal-Oriented",
                            description: "Set clear learning objectives and track your journey with detailed progress metrics."
                        },
                        {
                            icon: Zap,
                            title: "Adaptive Learning",
                            description: "Content difficulty adjusts in real-time based on your performance and understanding."
                        }
                    ].map((item, index) => (
                        <AnimatedSection key={index}>
                            <motion.div
                                whileHover={{ y: -5, scale: 1.02 }}
                                className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
                            >
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                                    <item.icon className="w-7 h-7 text-primary-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold font-heading mb-3">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                            </motion.div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}

// How it works section
function HowItWorksSection() {
    const steps = [
        {
            number: "01",
            title: "Create Your Profile",
            description: "Tell us about your interests, goals, and current skill level."
        },
        {
            number: "02",
            title: "Get AI Recommendations",
            description: "Our AI curates personalized learning paths tailored just for you."
        },
        {
            number: "03",
            title: "Learn at Your Pace",
            description: "Access tiered content that adapts as you progress through modules."
        },
        {
            number: "04",
            title: "Track & Achieve",
            description: "Monitor your progress with detailed analytics and earn achievements."
        }
    ];

    return (
        <section className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <AnimatedSection className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
                        How It Works
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Start learning in minutes with our streamlined onboarding process
                    </p>
                </AnimatedSection>

                <div className="relative">
                    {/* Connection line */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary to-primary/50 hidden md:block" />

                    <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-16 md:gap-y-24">
                        {steps.map((step, index) => (
                            <AnimatedSection
                                key={index}
                                className={`relative ${index % 2 === 1 ? 'md:mt-24' : ''}`}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-card rounded-2xl p-8 border border-border/50 shadow-lg relative"
                                >
                                    {/* Step number */}
                                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                                        {step.number}
                                    </div>

                                    <h3 className="text-2xl font-semibold font-heading mb-3 mt-4">{step.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                                </motion.div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// For Students section
function ForStudentsSection() {
    const { setShowAuthModal, setAuthMode } = useAuth();

    const features = [
        "Personalized learning paths",
        "Interactive flashcards",
        "AI-powered assessments",
        "Progress tracking",
        "Achievement system",
        "Mobile-friendly design"
    ];

    return (
        <section className="py-24 md:py-32 relative">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <AnimatedSection>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
                            <GraduationCap className="w-4 h-4" />
                            For Students
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
                            Your Personal Learning Companion
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                            Whether you're a student, professional, or lifelong learner, SCIRE adapts to your
                            unique needs and helps you achieve your educational goals.
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="flex items-center gap-3"
                                >
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                    <span className="text-sm">{feature}</span>
                                </motion.div>
                            ))}
                        </div>

                        <Button
                            size="lg"
                            className="gap-2"
                            onClick={() => {
                                setAuthMode("signup");
                                setShowAuthModal(true);
                            }}
                        >
                            Start Learning
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </AnimatedSection>

                    <AnimatedSection>
                        <div className="relative">
                            <motion.div
                                whileHover={{ rotate: 2 }}
                                className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-8 border border-primary/20"
                            >
                                <div className="bg-card rounded-2xl p-6 shadow-xl">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80" />
                                        <div>
                                            <div className="font-semibold">Your Progress</div>
                                            <div className="text-sm text-muted-foreground">This week</div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span>Machine Learning</span>
                                                <span className="text-primary">75%</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: "75%" }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    viewport={{ once: true }}
                                                    className="h-full bg-primary rounded-full"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span>Data Science</span>
                                                <span className="text-primary">45%</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: "45%" }}
                                                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                                    viewport={{ once: true }}
                                                    className="h-full bg-primary rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </AnimatedSection>
                </div>
            </div>
        </section>
    );
}

// For Educators section
function ForEducatorsSection() {
    const { setShowAuthModal, setAuthMode } = useAuth();

    const features = [
        {
            icon: Upload,
            title: "Easy Content Upload",
            description: "Import courses from various sources or create your own with our intuitive tools."
        },
        {
            icon: BarChart3,
            title: "Student Analytics",
            description: "Track student progress, identify struggling areas, and optimize your content."
        },
        {
            icon: Users,
            title: "Class Management",
            description: "Organize students, assign courses, and monitor engagement in real-time."
        }
    ];

    return (
        <section className="py-24 md:py-32 bg-muted/30 relative">
            <div className="max-w-6xl mx-auto px-6">
                <AnimatedSection className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-sm font-medium mb-6">
                        <BookOpen className="w-4 h-4" />
                        For Educators & Admins
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
                        Empower Your Teaching
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Create, manage, and optimize educational content with powerful tools designed for educators.
                    </p>
                </AnimatedSection>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    {features.map((feature, index) => (
                        <AnimatedSection key={index}>
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="bg-card rounded-2xl p-8 border border-border/50 h-full"
                            >
                                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
                                    <feature.icon className="w-6 h-6 text-violet-500" />
                                </div>
                                <h3 className="text-xl font-semibold font-heading mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </motion.div>
                        </AnimatedSection>
                    ))}
                </div>

                <AnimatedSection className="text-center">
                    <Button
                        size="lg"
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                            setAuthMode("signup");
                            setShowAuthModal(true);
                        }}
                    >
                        Create Educator Account
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </AnimatedSection>
            </div>
        </section>
    );
}

// Features overview section
function FeaturesSection() {
    const features = [
        {
            icon: Brain,
            title: "AI-Powered Curation",
            description: "Smart algorithms match you with the perfect courses based on your goals and learning style.",
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: Target,
            title: "Tiered Learning Paths",
            description: "Progress from beginner to advanced with structured content that grows with you.",
            color: "from-violet-500 to-purple-500"
        },
        {
            icon: BookOpen,
            title: "Interactive Content",
            description: "Engage with flashcards, quizzes, and hands-on exercises that reinforce learning.",
            color: "from-emerald-500 to-green-500"
        },
        {
            icon: BarChart3,
            title: "Progress Analytics",
            description: "Detailed insights into your learning journey with actionable recommendations.",
            color: "from-orange-500 to-amber-500"
        },
        {
            icon: Users,
            title: "Community Learning",
            description: "Connect with fellow learners and share knowledge in collaborative spaces.",
            color: "from-pink-500 to-rose-500"
        },
        {
            icon: Zap,
            title: "Quick Assessments",
            description: "AI-validated understanding checks ensure you truly master each concept.",
            color: "from-indigo-500 to-blue-500"
        }
    ];

    return (
        <section className="py-24 md:py-32 relative">
            <div className="max-w-6xl mx-auto px-6">
                <AnimatedSection className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
                        Everything You Need to Excel
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Comprehensive tools and features designed to accelerate your learning journey
                    </p>
                </AnimatedSection>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <AnimatedSection key={index}>
                            <motion.div
                                whileHover={{ y: -5, scale: 1.02 }}
                                className="group relative bg-card rounded-2xl p-8 border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-xl"
                            >
                                {/* Gradient background on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                                <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>

                                <h3 className="relative text-xl font-semibold font-heading mb-3">{feature.title}</h3>
                                <p className="relative text-muted-foreground leading-relaxed">{feature.description}</p>
                            </motion.div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}

// CTA section
function CTASection() {
    const { setShowAuthModal, setAuthMode } = useAuth();

    return (
        <section className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
            <FloatingOrbs />

            <div className="relative max-w-4xl mx-auto px-6 text-center">
                <AnimatedSection>
                    <h2 className="text-4xl md:text-6xl font-bold font-heading mb-6">
                        Ready to Transform Your Learning?
                    </h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Join thousands of learners who are already accelerating their education with SCIRE.
                        Start your journey today – it's completely free.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            className="h-14 px-10 text-lg font-semibold gap-2 shadow-lg shadow-primary/25"
                            onClick={() => {
                                setAuthMode("signup");
                                setShowAuthModal(true);
                            }}
                        >
                            Get Started Free
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-14 px-10 text-lg font-semibold backdrop-blur-sm"
                            onClick={() => {
                                setAuthMode("signin");
                                setShowAuthModal(true);
                            }}
                        >
                            Sign In
                        </Button>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    );
}

// Footer
function Footer() {
    return (
        <footer className="py-12 border-t border-border/50">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-foreground">S</span>
                        </div>
                        <span className="font-bold font-heading text-xl">SCIRE</span>
                    </div>

                    <div className="flex gap-8 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                        <a href="#" className="hover:text-foreground transition-colors">Contact</a>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        © 2024 SCIRE. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

// Header for landing page
function LandingHeader() {
    const { setShowAuthModal, setAuthMode } = useAuth();
    const { scrollY } = useScroll();
    const backgroundColor = useTransform(
        scrollY,
        [0, 100],
        ["rgba(var(--background), 0)", "rgba(var(--background), 0.9)"]
    );

    const handleGetStarted = () => {
        setAuthMode("signup");
        setShowAuthModal(true);
    };

    const handleSignIn = () => {
        setAuthMode("signin");
        setShowAuthModal(true);
    };

    return (
        <motion.header
            style={{ backgroundColor: "hsl(var(--background) / 0.8)" }}
            className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md border-b border-border/50"
        >
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/">
                    <div className="flex items-center gap-2 cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-foreground">S</span>
                        </div>
                        <span className="font-bold font-heading text-xl">SCIRE</span>
                    </div>
                </Link>

                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        className="font-medium"
                        onClick={handleSignIn}
                    >
                        Sign In
                    </Button>
                    <Button
                        type="button"
                        className="font-medium gap-2"
                        onClick={handleGetStarted}
                    >
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </motion.header>
    );
}

// Main Landing Page Component
export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background">
            <LandingHeader />
            <main className="pt-16">
                <HeroSection />
                <WhatIsScireSection />
                <HowItWorksSection />
                <ForStudentsSection />
                <ForEducatorsSection />
                <FeaturesSection />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
}
