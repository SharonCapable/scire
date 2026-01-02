import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { GenerationProgress } from "@/components/generation-progress";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    BookOpen,
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
    CheckCircle2,
    Brain,
    Plus,
    ArrowRight,
    ArrowLeft,
    Heart,
    RefreshCw,
    Library,
    ChevronLeft,
    ChevronRight,
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
}

interface Interest {
    id: string;
    topics: string[];
    learningGoals: string;
    preferredPace: string;
    createdAt: any;
}

const COURSES_PER_PAGE = 6;

export default function Dashboard() {
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("enrolled");
    const [showGeneration, setShowGeneration] = useState(false);
    const [generatingCourseTitle, setGeneratingCourseTitle] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch enrolled courses
    const { data: enrolledCourses, isLoading: isLoadingCourses, refetch: refetchCourses } = useQuery<EnrolledCourse[]>({
        queryKey: ["/api/user/enrolled-courses"],
    });

    // Fetch user interests (array of interests)
    const { data: interests, refetch: refetchInterests } = useQuery<Interest[]>({
        queryKey: ["/api/interests/all"],
    });

    // Fetch stats
    const { data: stats, refetch: refetchStats } = useQuery<UserStats>({
        queryKey: ["/api/user/stats"],
    });

    // Filter courses
    const allCourses = enrolledCourses || [];
    const inProgressCourses = allCourses.filter(c => c.progress < 100 && c.generationStatus !== 'generating');
    const completedCourses = allCourses.filter(c => c.progress === 100);
    const personalizedCourses = allCourses.filter(c => c.isPersonalized);

    // Pagination
    const totalCourses = allCourses.length;
    const totalPages = Math.ceil(totalCourses / COURSES_PER_PAGE);
    const startIndex = (currentPage - 1) * COURSES_PER_PAGE;
    const endIndex = startIndex + COURSES_PER_PAGE;
    const paginatedCourses = allCourses.slice(startIndex, endIndex);

    // Calculate XP and level
    const totalXP = (stats?.completedModules || 0) * 100 + (stats?.totalMinutes || 0) * 2;
    const level = Math.floor(totalXP / 1000) + 1;
    const xpProgress = ((totalXP % 1000) / 1000) * 100;
    const currentStreak = Math.min(Math.floor((stats?.totalMinutes || 0) / 30), 30);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            refetchCourses(),
            refetchInterests(),
            refetchStats(),
        ]);
        setIsRefreshing(false);
        toast({
            title: "Refreshed",
            description: "Dashboard data has been updated.",
        });
    };

    const handleGenerationComplete = () => {
        setShowGeneration(false);
        queryClient.invalidateQueries({ queryKey: ["/api/user/enrolled-courses"] });
        toast({
            title: "Course Created!",
            description: "Your personalized course is ready to explore.",
        });
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <>
            <GenerationProgress
                isVisible={showGeneration}
                courseTitle={generatingCourseTitle}
                currentStep={0}
                totalSteps={5}
                onComplete={handleGenerationComplete}
            />

            <motion.div
                className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div className="mb-8" variants={itemVariants}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <GraduationCap className="h-6 w-6 text-primary" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold font-heading">
                                    My Dashboard
                                </h1>
                            </div>
                            <p className="text-muted-foreground">
                                Welcome back, {user?.name || user?.username}! Continue your learning journey.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {/* XP Progress */}
                    <Card className="bg-gradient-to-r from-primary/10 to-violet-500/10">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <div className="flex items-center justify-between sm:justify-start gap-2">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-6 w-6 text-yellow-500" />
                                        <span className="text-xl font-bold">Level {level}</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:hidden">
                                        <Flame className="h-5 w-5 text-orange-500" />
                                        <span className="font-semibold text-sm">{currentStreak} days</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">{totalXP.toLocaleString()} XP</span>
                                        <span className="text-xs sm:text-sm text-muted-foreground">{Math.round(xpProgress)}% to next level</span>
                                    </div>
                                    <Progress value={xpProgress} className="h-2" />
                                </div>
                                <div className="hidden sm:flex items-center gap-2">
                                    <Flame className="h-5 w-5 text-orange-500" />
                                    <span className="font-semibold">{currentStreak} day streak</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Stats Grid */}
                <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" variants={itemVariants}>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Enrolled Courses
                            </CardDescription>
                            <CardTitle className="text-3xl">{totalCourses}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Completed Modules
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats?.completedModules || 0}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Hours Learned
                            </CardDescription>
                            <CardTitle className="text-3xl">{Math.floor((stats?.totalMinutes || 0) / 60)}h</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Heart className="h-4 w-4" />
                                My Interests
                            </CardDescription>
                            <CardTitle className="text-3xl">{interests?.length || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                </motion.div>

                {/* Main Content Tabs */}
                <motion.div variants={itemVariants}>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        {/* Tabs Header with Browse Courses button */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
                                <TabsTrigger value="enrolled" className="gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    <span className="hidden sm:inline">Enrolled Courses</span>
                                    <span className="sm:hidden">Enrolled</span>
                                    {totalCourses > 0 && (
                                        <Badge variant="secondary" className="ml-1">
                                            {totalCourses}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="interests" className="gap-2">
                                    <Brain className="h-4 w-4" />
                                    <span className="hidden sm:inline">My Interests</span>
                                    <span className="sm:hidden">Interests</span>
                                    {interests && interests.length > 0 && (
                                        <Badge variant="secondary" className="ml-1">
                                            {interests.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="achievements" className="gap-2">
                                    <Award className="h-4 w-4" />
                                    <span className="hidden sm:inline">Achievements</span>
                                    <span className="sm:hidden">Awards</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Browse Courses Button */}
                            <Button onClick={() => setLocation("/courses")} className="gap-2">
                                <Library className="h-4 w-4" />
                                Browse Courses
                            </Button>
                        </div>

                        {/* Enrolled Courses Tab */}
                        <TabsContent value="enrolled" className="space-y-6">
                            {isLoadingCourses ? (
                                <div className="flex items-center justify-center py-12">
                                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : totalCourses > 0 ? (
                                <>
                                    {/* Course Grid */}
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {paginatedCourses.map((course) => (
                                            <CourseCard
                                                key={course.id}
                                                course={course}
                                                onContinue={() => setLocation(`/course/${course.id}`)}
                                            />
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 pt-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Previous
                                            </Button>

                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <Button
                                                        key={page}
                                                        variant={currentPage === page ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setCurrentPage(page)}
                                                        className="w-8 h-8 p-0"
                                                    >
                                                        {page}
                                                    </Button>
                                                ))}
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* Summary */}
                                    <div className="text-center text-sm text-muted-foreground">
                                        Showing {startIndex + 1}-{Math.min(endIndex, totalCourses)} of {totalCourses} courses
                                    </div>
                                </>
                            ) : (
                                <EmptyState
                                    icon={BookOpen}
                                    title="No enrolled courses yet"
                                    description="Browse our course catalog or create personalized courses from your interests."
                                    actions={
                                        <div className="flex gap-3 flex-wrap justify-center">
                                            <Button onClick={() => setLocation("/courses")} className="gap-2">
                                                <Library className="h-4 w-4" />
                                                Browse Courses
                                            </Button>
                                            <Button variant="outline" onClick={() => setActiveTab("interests")} className="gap-2">
                                                <Plus className="h-4 w-4" />
                                                Add Interests
                                            </Button>
                                        </div>
                                    }
                                />
                            )}
                        </TabsContent>

                        {/* Interests Tab */}
                        <TabsContent value="interests" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Your Learning Interests</h3>
                                <Button onClick={() => setLocation("/interests")} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add New Interest
                                </Button>
                            </div>

                            {interests && interests.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {interests.map((interest) => (
                                        <InterestCard
                                            key={interest.id}
                                            interest={interest}
                                            onGenerateCourse={() => setLocation(`/interests?generate=${interest.id}`)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Brain}
                                    title="No interests defined yet"
                                    description="Tell us what you want to learn and we'll create personalized courses for you."
                                    actions={
                                        <Button onClick={() => setLocation("/interests")} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add Your First Interest
                                        </Button>
                                    }
                                />
                            )}

                            {/* Personalized Courses from Interests */}
                            {personalizedCourses.length > 0 && (
                                <div className="space-y-4 pt-6 border-t">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        Courses Generated from Your Interests
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {personalizedCourses.slice(0, 4).map((course) => (
                                            <CourseCard
                                                key={course.id}
                                                course={course}
                                                onContinue={() => setLocation(`/course/${course.id}`)}
                                            />
                                        ))}
                                    </div>
                                    {personalizedCourses.length > 4 && (
                                        <div className="text-center">
                                            <Button variant="ghost" onClick={() => setActiveTab("enrolled")}>
                                                View all {personalizedCourses.length} personalized courses
                                                <ArrowRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        {/* Achievements Tab */}
                        <TabsContent value="achievements" className="space-y-6">
                            <AchievementsSection stats={stats} />
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
        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onContinue}>
            <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <CardTitle className="text-lg truncate">{course.title}</CardTitle>
                            {course.isPersonalized && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    AI
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    </div>
                    <Badge
                        variant={course.progress === 100 ? "default" : "secondary"}
                        className="shrink-0"
                    >
                        {course.progress}%
                    </Badge>
                </div>
                <div className="space-y-2">
                    <Progress value={course.progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{course.timeSpent || 0} min spent</span>
                        <span className="flex items-center gap-1 text-primary group-hover:translate-x-1 transition-transform">
                            Continue
                            <ArrowRight className="h-3 w-3" />
                        </span>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}

// Interest Card Component
function InterestCard({
    interest,
    onGenerateCourse,
}: {
    interest: Interest;
    onGenerateCourse: () => void;
}) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary" />
                            Learning Interest
                        </CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                            {interest.learningGoals}
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="capitalize">
                        {interest.preferredPace}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-sm font-medium mb-2">Topics</p>
                    <div className="flex flex-wrap gap-2">
                        {interest.topics.slice(0, 5).map((topic) => (
                            <Badge key={topic} variant="secondary" className="text-xs">
                                {topic}
                            </Badge>
                        ))}
                        {interest.topics.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                                +{interest.topics.length - 5} more
                            </Badge>
                        )}
                    </div>
                </div>
                <Button onClick={onGenerateCourse} className="w-full gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate Course
                </Button>
            </CardContent>
        </Card>
    );
}

// Achievements Section Component
function AchievementsSection({ stats }: { stats?: UserStats }) {
    const currentStreak = Math.min(Math.floor((stats?.totalMinutes || 0) / 30), 30);

    const achievements = [
        { id: 1, name: "First Steps", icon: Star, earned: (stats?.completedModules || 0) >= 1, description: "Complete your first module" },
        { id: 2, name: "Dedicated Learner", icon: Flame, earned: currentStreak >= 7, description: "7-day learning streak" },
        { id: 3, name: "Course Explorer", icon: BookOpen, earned: (stats?.totalCourses || 0) >= 3, description: "Enroll in 3 courses" },
        { id: 4, name: "Time Investor", icon: Clock, earned: (stats?.totalMinutes || 0) >= 120, description: "2+ hours of learning" },
        { id: 5, name: "Module Master", icon: Target, earned: (stats?.completedModules || 0) >= 10, description: "Complete 10 modules" },
        { id: 6, name: "Knowledge Seeker", icon: Zap, earned: (stats?.totalMinutes || 0) >= 300, description: "5+ hours of learning" },
    ];

    const earnedCount = achievements.filter(a => a.earned).length;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Achievements
                </CardTitle>
                <CardDescription>
                    {earnedCount} of {achievements.length} unlocked
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            {actions}
        </div>
    );
}
