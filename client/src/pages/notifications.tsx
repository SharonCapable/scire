import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Bell,
    BookOpen,
    CheckCircle2,
    GraduationCap,
    Trophy,
    Sparkles,
    Clock,
    Check,
    Trash2,
} from "lucide-react";

interface Notification {
    id: string;
    userId: string;
    type: 'course_created' | 'tier_unlocked' | 'course_completed' | 'achievement_earned' | 'enrollment_confirmed';
    title: string;
    message: string;
    data?: {
        courseId?: string;
        tierId?: string;
        achievementId?: string;
    };
    read: boolean;
    createdAt: any;
}

const notificationIcons: Record<string, React.ElementType> = {
    course_created: Sparkles,
    tier_unlocked: GraduationCap,
    course_completed: Trophy,
    achievement_earned: Trophy,
    enrollment_confirmed: BookOpen,
};

const notificationColors: Record<string, string> = {
    course_created: "text-violet-500 bg-violet-500/10",
    tier_unlocked: "text-emerald-500 bg-emerald-500/10",
    course_completed: "text-yellow-500 bg-yellow-500/10",
    achievement_earned: "text-orange-500 bg-orange-500/10",
    enrollment_confirmed: "text-blue-500 bg-blue-500/10",
};

export default function Notifications() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const { data: notifications, isLoading } = useQuery<Notification[]>({
        queryKey: ["/api/notifications"],
    });

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("PATCH", `/api/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/notifications/mark-all-read");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            toast({
                title: "All caught up!",
                description: "All notifications marked as read.",
            });
        },
    });

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markReadMutation.mutate(notification.id);
        }

        // Navigate based on notification type
        if (notification.data?.courseId) {
            setLocation(`/course/${notification.data.courseId}`);
        }
    };

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    const formatTimeAgo = (timestamp: any) => {
        if (!timestamp) return "Just now";

        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <motion.div
            className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Bell className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold font-heading">Notifications</h1>
                        {unreadCount > 0 && (
                            <Badge className="bg-primary">{unreadCount} new</Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">Stay updated on your learning journey</p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                        className="gap-2"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark all read
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-muted" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-muted rounded w-1/3" />
                                        <div className="h-3 bg-muted rounded w-2/3" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                    <AnimatePresence>
                        {notifications.map((notification, index) => {
                            const Icon = notificationIcons[notification.type] || Bell;
                            const colorClass = notificationColors[notification.type] || "text-muted-foreground bg-muted";

                            return (
                                <motion.div
                                    key={notification.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card
                                        className={`cursor-pointer transition-all hover:shadow-md ${!notification.read ? "border-primary/30 bg-primary/5" : ""
                                            }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-lg ${colorClass}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <h3 className={`font-semibold ${!notification.read ? "" : "text-muted-foreground"}`}>
                                                                {notification.title}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {notification.message}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatTimeAgo(notification.createdAt)}
                                                            </span>
                                                            {!notification.read && (
                                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            When you complete courses or unlock new tiers, you'll see updates here.
                        </p>
                        <Button onClick={() => setLocation("/dashboard")}>
                            Go to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            )}
        </motion.div>
    );
}
