import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, Clock, Award, Target, Flame, Trophy, Star, Zap } from "lucide-react";

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
}

export default function Dashboard() {
    const [, setLocation] = useLocation();

    const { data: stats } = useQuery<UserStats>({
        queryKey: ["/api/user/stats"],
    });

    const { data: enrolledCourses } = useQuery<EnrolledCourse[]>({
        queryKey: ["/api/user/enrolled-courses"],
    });

    // Calculate level and XP
    const totalXP = (stats?.completedModules || 0) * 100 + (stats?.totalMinutes || 0) * 2;
    const level = Math.floor(totalXP / 1000) + 1;
    const xpForNextLevel = level * 1000;
    const xpProgress = ((totalXP % 1000) / 1000) * 100;

    // Calculate streak (mock for now - would need real implementation)
    const currentStreak = Math.min(Math.floor((stats?.totalMinutes || 0) / 30), 30);

    // Achievement badges
    const achievements = [
        { id: 1, name: "First Steps", icon: Star, earned: (stats?.completedModules || 0) >= 1, description: "Complete your first module" },
        { id: 2, name: "Dedicated Learner", icon: Flame, earned: currentStreak >= 7, description: "7-day learning streak" },
        { id: 3, name: "Course Master", icon: Trophy, earned: (stats?.totalCourses || 0) >= 3, description: "Enroll in 3 courses" },
        { id: 4, name: "Speed Demon", icon: Zap, earned: (stats?.totalMinutes || 0) >= 120, description: "2+ hours of learning" },
    ];

    const earnedAchievements = achievements.filter(a => a.earned);

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12">
            {/* Header with Level */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2" data-testid="text-page-title">
                            Learning Dashboard
                        </h1>
                        <p className="text-muted-foreground">Track your progress and achievements</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <span className="text-2xl font-bold font-heading">Level {level}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{totalXP.toLocaleString()} XP</p>
                    </div>
                </div>

                {/* XP Progress Bar */}
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Progress to Level {level + 1}</span>
                                    <span className="text-sm text-muted-foreground">{Math.round(xpProgress)}%</span>
                                </div>
                                <Progress value={xpProgress} className="h-3" />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {xpForNextLevel - totalXP} XP to go
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="hover-elevate">
                    <CardHeader className="gap-1 pb-4">
                        <CardDescription className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Enrolled Courses
                        </CardDescription>
                        <CardTitle className="text-3xl">{stats?.totalCourses || 0}</CardTitle>
                    </CardHeader>
                </Card>

                <Card className="hover-elevate">
                    <CardHeader className="gap-1 pb-4">
                        <CardDescription className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Modules Completed
                        </CardDescription>
                        <CardTitle className="text-3xl">{stats?.completedModules || 0}</CardTitle>
                    </CardHeader>
                </Card>

                <Card className="hover-elevate">
                    <CardHeader className="gap-1 pb-4">
                        <CardDescription className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Learning Time
                        </CardDescription>
                        <CardTitle className="text-3xl">{Math.floor((stats?.totalMinutes || 0) / 60)}h</CardTitle>
                    </CardHeader>
                </Card>

                <Card className="hover-elevate">
                    <CardHeader className="gap-1 pb-4">
                        <CardDescription className="flex items-center gap-2">
                            <Flame className="h-4 w-4" />
                            Current Streak
                        </CardDescription>
                        <CardTitle className="text-3xl">{currentStreak} days</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Achievements */}
            <Card className="mb-8">
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
                                    <Icon className={`h-8 w-8 mx-auto mb-2 ${achievement.earned ? "text-primary" : "text-muted-foreground"}`} />
                                    <p className="font-semibold text-sm mb-1">{achievement.name}</p>
                                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Enrolled Courses */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>My Courses</CardTitle>
                            <CardDescription>Continue where you left off</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => setLocation("/courses")}>
                            Browse More
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {!enrolledCourses || enrolledCourses.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Start your learning journey by enrolling in a course
                            </p>
                            <Button onClick={() => setLocation("/courses")}>
                                Explore Courses
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {enrolledCourses.map((course) => (
                                <Card key={course.id} className="hover-elevate cursor-pointer" onClick={() => setLocation(`/course/${course.id}`)}>
                                    <CardHeader className="gap-2">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{course.title}</CardTitle>
                                                <CardDescription className="line-clamp-1">{course.description}</CardDescription>
                                            </div>
                                            <Badge variant={course.progress === 100 ? "default" : "secondary"}>
                                                {course.progress}%
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            <Progress value={course.progress} className="h-2" />
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{course.timeSpent} minutes spent</span>
                                                <Button size="sm" variant="ghost">
                                                    Continue →
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
