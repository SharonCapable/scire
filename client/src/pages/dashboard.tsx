import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useRoleAccess } from "@/components/role-guard";
import { GenerationProgress } from "@/components/generation-progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    BookOpen,
    TrendingUp,
    Clock,
    Award,
    Target,
    Flame,
    Trophy,
    Star,
    Zap,
    Sparkles,
    GraduationCap,
    Play,
    Lock,
    CheckCircle2,
    Brain,
    Plus,
    RefreshCw,
    ArrowRight,
} from "lucide-react";

interface UserStats {
    totalCourses: number;
    completedModules: number;
    totalMinutes: number;
    averageScore: number;
}

interface EnrolledCourse {
    id: string;
    title: string;
    description: string;
    progress: number;
    timeSpent: number;
    isPersonalized?: boolean;
    generationStatus?: 'pending' | 'generating' | 'completed' | 'failed';
    tiers?: {
        id: string;
        level: string;
        title: string;
        generationStatus?: 'locked' | 'generating' | 'completed';
    }[];
}

interface Interest {
    id: string;
    topics: string[];
    learningGoals: string;
    preferredPace: string;
    createdAt: any;
}

export default function Dashboard() {
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const { isStudent } = useRoleAccess();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("active");
    const [showGeneration, setShowGeneration] = useState(false);
    const [generationStep, setGenerationStep] = useState(0);
    const [generatingCourseTitle, setGeneratingCourseTitle] = useState("");

    const { data: stats } = useQuery<UserStats>({
        queryKey: ["/api/user/stats"],
    });

    const { data: enrolledCourses, isLoading: isLoadingCourses } = useQuery<EnrolledCourse[]>({
        queryKey: ["/api/user/enrolled-courses"],
    });

    const { data: interests } = useQuery<Interest>({
        queryKey: ["/api/interests"],
    });

    // Filter courses by status
    const activeCourses = enrolledCourses?.filter(
        (c) => c.progress < 100 || c.generationStatus === 'generating'
    ) || [];
    const completedCourses = enrolledCourses?.filter(
        (c) => c.progress === 100 && c.generationStatus !== 'generating'
    ) || [];
    const generatingCourses = enrolledCourses?.filter(
        (c) => c.generationStatus === 'generating'
    ) || [];

    // Calculate level and XP
    const totalXP = (stats?.completedModules || 0) * 100 + (stats?.totalMinutes || 0) * 2;
    const level = Math.floor(totalXP / 1000) + 1;
    const xpForNextLevel = level * 1000;
    const xpProgress = ((totalXP % 1000) / 1000) * 100;

    // Current streak (mock for now)
    const currentStreak = Math.min(Math.floor((stats?.totalMinutes || 0) / 30), 30);

    // Achievements
    const achievements = [
        { id: 1, name: "First Steps", icon: Star, earned: (stats?.completedModules || 0) >= 1, description: "Complete your first module" },
        { id: 2, name: "Dedicated Learner", icon: Flame, earned: currentStreak >= 7, description: "7-day learning streak" },
        { id: 3, name: "Course Master", icon: Trophy, earned: (stats?.totalCourses || 0) >= 3, description: "Enroll in 3 courses" },
        { id: 4, name: "Speed Demon", icon: Zap, earned: (stats?.totalMinutes || 0) >= 120, description: "2+ hours of learning" },
    ];

    const earnedAchievements = achievements.filter((a) => a.earned);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    const handleGenerationComplete = () => {
        setShowGeneration(false);
        setGenerationStep(0);
        queryClient.invalidateQueries({ queryKey: ["/api/user/enrolled-courses"] });
        toast({
            title: "Course Created!",
            description: "Your personalized course is ready to explore.",
        });
    };

    return (
        <>
            {/* Generation Progress Overlay */}
            <GenerationProgress
                isVisible={showGeneration}
                courseTitle={generatingCourseTitle}
                currentStep={generationStep}
                totalSteps={5}
                onComplete={handleGenerationComplete}
            />

            <motion.div
                className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header with Level */}
                <motion.div className="mb-8" variants={itemVariants}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <GraduationCap className="h-6 w-6 text-primary" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold font-heading" data-testid="text-page-title">
                                    Learning Dashboard
                                </h1>
                            </div>
                            <p className="text-muted-foreground">
                                Welcome back, {user?.name || user?.username}! Track your progress and achievements.
                            </p>
                        </div>
                        <div className="text-right hidden md:block">
                            <div className="flex items-center gap-2 mb-1">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                <span className="text-2xl font-bold font-heading">Level {level}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{totalXP.toLocaleString()} XP</p>
                        </div>
                    </div>

                    {/* XP Progress Bar */}
                    <Card className="bg-gradient-to-r from-primary/10 to-violet-500/10">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Progress to Level {level + 1}</span>
                                        <span className="text-sm text-muted-foreground">{Math.round(xpProgress)}%</span>
                                    </div>
                                    <Progress value={xpProgress} className="h-3" />
                                </div>
                                <div className="text-sm text-muted-foreground">{xpForNextLevel - totalXP} XP to go</div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Stats Grid */}
                <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" variants={itemVariants}>
                    <Card className="hover-elevate">
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Courses
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats?.totalCourses || 0}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="hover-elevate">
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Modules
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats?.completedModules || 0}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="hover-elevate">
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Hours
                            </CardDescription>
                            <CardTitle className="text-3xl">{Math.floor((stats?.totalMinutes || 0) / 60)}h</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="hover-elevate">
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Flame className="h-4 w-4" />
                                Streak
                            </CardDescription>
                            <CardTitle className="text-3xl">{currentStreak}d</CardTitle>
                        </CardHeader>
                    </Card>
                </motion.div>

                {/* Main Content Tabs */}
                <motion.div variants={itemVariants}>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
                            <TabsTrigger value="active" className="gap-2">
                                <Play className="h-4 w-4" />
                                <span className="hidden sm:inline">Active Learning</span>
                                <span className="sm:hidden">Active</span>
                                {activeCourses.length > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {activeCourses.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="hidden sm:inline">My Courses</span>
                                <span className="sm:hidden">Done</span>
                                {completedCourses.length > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {completedCourses.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="interests" className="gap-2">
                                <Brain className="h-4 w-4" />
                                <span className="hidden sm:inline">My Interests</span>
                                <span className="sm:hidden">Interests</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Active Learning Tab */}
                        <TabsContent value="active" className="space-y-6">
                            {/* Generating Courses */}
                            {generatingCourses.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                                        Generating...
                                    </h3>
                                    {generatingCourses.map((course) => (
                                        <Card key={course.id} className="border-primary/30 bg-primary/5">
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">{course.title}</CardTitle>
                                                        <CardDescription>Creating your personalized course...</CardDescription>
                                                    </div>
                                                    <div className="animate-spin">
                                                        <RefreshCw className="h-5 w-5 text-primary" />
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* In-Progress Courses */}
                            {activeCourses.filter((c) => c.generationStatus !== 'generating').length > 0 ? (
                                <div className="space-y-4">
                                    {activeCourses
                                        .filter((c) => c.generationStatus !== 'generating')
                                        .map((course) => (
                                            <CourseCard
                                                key={course.id}
                                                course={course}
                                                onContinue={() => setLocation(`/course/${course.id}`)}
                                            />
                                        ))}
                                </div>
                            ) : (
                                generatingCourses.length === 0 && (
                                    <EmptyState
                                        icon={BookOpen}
                                        title="No active courses"
                                        description="Start learning by exploring courses or generating one from your interests."
                                        actions={
                                            <>
                                                <Button onClick={() => setLocation("/courses")}>
                                                    Browse Courses
                                                </Button>
                                                <Button variant="outline" onClick={() => setActiveTab("interests")}>
                                                    Set Interests
                                                </Button>
                                            </>
                                        }
                                    />
                                )
                            )}
                        </TabsContent>

                        {/* Completed Courses Tab */}
                        <TabsContent value="completed" className="space-y-6">
                            {completedCourses.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {completedCourses.map((course) => (
                                        <Card key={course.id} className="hover-elevate">
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-lg">{course.title}</CardTitle>
                                                        <CardDescription className="line-clamp-2">
                                                            {course.description}
                                                        </CardDescription>
                                                    </div>
                                                    <Badge className="bg-emerald-500">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Completed
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                    <span>{course.timeSpent} minutes spent</span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setLocation(`/course/${course.id}`)}
                                                    >
                                                        Review
                                                        <ArrowRight className="h-4 w-4 ml-1" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Trophy}
                                    title="No completed courses yet"
                                    description="Complete your first course to see it here!"
                                    actions={
                                        <Button onClick={() => setActiveTab("active")}>
                                            Continue Learning
                                        </Button>
                                    }
                                />
                            )}
                        </TabsContent>

                        {/* Interests Tab */}
                        <TabsContent value="interests" className="space-y-6">
                            {/* Current Interests */}
                            {interests && interests.topics?.length > 0 ? (
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Brain className="h-5 w-5" />
                                                    Your Learning Interests
                                                </CardTitle>
                                                <CardDescription>
                                                    Personalized courses are generated based on these interests
                                                </CardDescription>
                                            </div>
                                            <Button variant="outline" onClick={() => setLocation("/interests")}>
                                                Update
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-sm font-medium mb-2">Topics</p>
                                            <div className="flex flex-wrap gap-2">
                                                {interests.topics.map((topic) => (
                                                    <Badge key={topic} variant="secondary">
                                                        {topic}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium mb-2">Learning Goals</p>
                                            <p className="text-sm text-muted-foreground">{interests.learningGoals}</p>
                                        </div>
                                        <div className="pt-4 border-t">
                                            <Button className="w-full gap-2" onClick={() => setLocation("/interests")}>
                                                <Sparkles className="h-4 w-4" />
                                                Generate New Course from Interests
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <EmptyState
                                    icon={Brain}
                                    title="No interests set yet"
                                    description="Tell us what you want to learn and we'll create personalized courses for you."
                                    actions={
                                        <Button onClick={() => setLocation("/interests")} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Set Your Interests
                                        </Button>
                                    }
                                />
                            )}

                            {/* Achievements Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="h-5 w-5" />
                                        Achievements
                                    </CardTitle>
                                    <CardDescription>
                                        {earnedAchievements.length} of {achievements.length} unlocked
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {achievements.map((achievement) => {
                                            const Icon = achievement.icon;
                                            return (
                                                <div
                                                    key={achievement.id}
                                                    className={`p-4 rounded-lg border text-center transition-all ${achievement.earned
                                                            ? "bg-primary/10 border-primary"
                                                            : "bg-muted/50 border-muted opacity-50"
                                                        }`}
                                                >
                                                    <Icon
                                                        className={`h-8 w-8 mx-auto mb-2 ${achievement.earned ? "text-primary" : "text-muted-foreground"
                                                            }`}
                                                    />
                                                    <p className="font-semibold text-sm mb-1">{achievement.name}</p>
                                                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </motion.div>
        </>
    );
}

// Course Card Component
function CourseCard({
    course,
    onContinue,
}: {
    course: EnrolledCourse;
    onContinue: () => void;
}) {
    return (
        <Card className="hover-elevate cursor-pointer" onClick={onContinue}>
            <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{course.title}</CardTitle>
                            {course.isPersonalized && (
                                <Badge variant="outline" className="text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Personalized
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="line-clamp-1">{course.description}</CardDescription>
                    </div>
                    <Badge variant={course.progress === 100 ? "default" : "secondary"}>{course.progress}%</Badge>
                </div>
                <div className="space-y-2">
                    <Progress value={course.progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{course.timeSpent} minutes spent</span>
                        <Button size="sm" variant="ghost" className="gap-1">
                            Continue
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Tier Progress */}
                {course.tiers && course.tiers.length > 0 && (
                    <div className="pt-3 border-t mt-3">
                        <p className="text-xs font-medium mb-2">Tiers</p>
                        <div className="flex gap-2">
                            {course.tiers.map((tier, index) => (
                                <div
                                    key={tier.id}
                                    className={`flex-1 p-2 rounded text-center text-xs ${tier.generationStatus === 'completed'
                                            ? 'bg-emerald-500/10 text-emerald-600'
                                            : tier.generationStatus === 'generating'
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                >
                                    {tier.generationStatus === 'completed' ? (
                                        <CheckCircle2 className="h-3 w-3 mx-auto mb-1" />
                                    ) : tier.generationStatus === 'generating' ? (
                                        <RefreshCw className="h-3 w-3 mx-auto mb-1 animate-spin" />
                                    ) : (
                                        <Lock className="h-3 w-3 mx-auto mb-1" />
                                    )}
                                    <span className="capitalize">{tier.level}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardHeader>
        </Card>
    );
}

// Empty State Component
function EmptyState({
    icon: Icon,
    title,
    description,
    actions,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    actions?: React.ReactNode;
}) {
    return (
        <div className="text-center py-12">
            <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
            {actions && <div className="flex items-center justify-center gap-3">{actions}</div>}
        </div>
    );
}
